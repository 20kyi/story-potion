import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useTheme } from '../../ThemeContext';
import { createNovelUrl } from '../../utils/novelUtils';
import { useLanguage, useTranslation } from '../../LanguageContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  margin: 60px auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.text};
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 24px 0 24px 0;
`;

const NovelListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const NovelItem = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 12px;
  padding: 16px;
  box-shadow: ${({ theme }) => theme.cardShadow};
  border: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;
  transition: box-shadow 0.15s;
  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  }
`;

const NovelCover = styled.img`
  width: 100px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  background: #E5E5E5;
  margin-right: 16px;
`;

const NovelTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 6px;
`;

const NovelDate = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardSubText};
  margin-bottom: 8px;
`;

const NovelOwner = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.cardSubText};
  margin-bottom: 14px;
`;

const NovelContent = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardText};
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0;
`;

const ActionButtonView = styled.button`
  width: 100%;
  padding: 12px 0;
  background: transparent;
  color: #2176bd;
  font-weight: 700;
  box-shadow: none;
  border: none;
  border-radius: 0 0 12px 12px;
  font-family: inherit;
  font-size: 16px;
  cursor: pointer;
  margin-top: 12px;
  &:active, &:hover {
    background: transparent;
    text-decoration: underline;
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.cardSubText || '#999'};
  font-size: 16px;
  padding: 60px 20px;
`;

function PurchasedNovels({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const { language } = useLanguage();
    const { t } = useTranslation();
    const [novels, setNovels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchPurchasedNovels = async () => {
            setIsLoading(true);
            try {
                // 사용자가 구매한 소설 ID 목록 가져오기
                const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                const viewedSnapshot = await getDocs(viewedNovelsRef);
                const novelIds = viewedSnapshot.docs.map(doc => doc.id);
                
                if (novelIds.length === 0) {
                    setNovels([]);
                    setIsLoading(false);
                    return;
                }

                // novelId로 novels 컬렉션에서 데이터 fetch
                const novelsRef = collection(db, 'novels');
                const novelDocs = await Promise.all(
                    novelIds.map(id => getDoc(doc(novelsRef, id)))
                );
                
                let purchased = novelDocs
                    .filter(snap => snap.exists())
                    .map(snap => ({ ...snap.data(), id: snap.id }));
                
                // 최신순 정렬(createdAt 내림차순)
                purchased = purchased.sort((a, b) => {
                    const aDate = a.createdAt?.toDate?.() || new Date(0);
                    const bDate = b.createdAt?.toDate?.() || new Date(0);
                    return bDate - aDate;
                });

                // 각 소설의 userId로 닉네임/아이디 조회
                const ownerIds = [...new Set(purchased.map(novel => novel.userId))];
                const userDocs = await Promise.all(
                    ownerIds.map(uid => getDoc(doc(db, 'users', uid)))
                );
                
                const ownerMap = {};
                userDocs.forEach((snap, idx) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        ownerMap[ownerIds[idx]] = data.nickname || data.nick || data.displayName || ownerIds[idx];
                    } else {
                        ownerMap[ownerIds[idx]] = ownerIds[idx];
                    }
                });

                // novel에 ownerName 필드 추가
                purchased = purchased.map(novel => ({
                    ...novel,
                    ownerName: ownerMap[novel.userId] || novel.userId
                }));

                setNovels(purchased);
            } catch (error) {
                console.error('구매한 소설 목록 가져오기 실패:', error);
                setNovels([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPurchasedNovels();
    }, [user]);

    return (
        <Container theme={theme}>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('home_purchased_novel')} />
            {isLoading ? (
                <div style={{ textAlign: 'center', marginTop: 40 }}>로딩 중...</div>
            ) : novels.length === 0 ? (
                <EmptyMessage>{t('home_no_purchased_novel')}</EmptyMessage>
            ) : (
                <NovelListWrapper>
                    {novels.map((novel) => (
                        <NovelItem
                            key={novel.id}
                            style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', flexDirection: 'column', padding: 0 }}
                        >
                            <div style={{ display: 'flex', width: '100%', padding: 16 }}>
                                <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginLeft: 12 }}>
                                    <NovelTitle>{novel.title}</NovelTitle>
                                    <NovelDate>
                                        {language === 'en'
                                            ? (() => {
                                                const d = new Date(novel.year || 2000, (novel.month || 1) - 1, 1);
                                                const monthName = d.toLocaleDateString('en-US', { month: 'long' });
                                                return `${monthName} ${t('week_num', { num: novel.weekNum })}`;
                                            })()
                                            : `${novel.month}월 ${novel.weekNum}주차 소설`}
                                    </NovelDate>
                                    <NovelOwner>by {novel.ownerName}</NovelOwner>
                                    <NovelContent>{novel.content}</NovelContent>
                                </div>
                            </div>
                            <ActionButtonView
                                onClick={() => navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre)}?userId=${novel.userId}`)}
                            >
                                {t('friend_novel_view')}
                            </ActionButtonView>
                        </NovelItem>
                    ))}
                </NovelListWrapper>
            )}
            <Navigation />
        </Container>
    );
}

export default PurchasedNovels;

