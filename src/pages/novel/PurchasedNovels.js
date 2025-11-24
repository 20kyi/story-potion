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
import GridIcon from '../../components/icons/GridIcon';
import ListIcon from '../../components/icons/ListIcon';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
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

const ViewToggle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 4px;
`;

const SortSelect = styled.select`
  padding: 8px 12px;
  background: ${({ theme }) => theme.card || '#fff'};
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.text || '#333'};
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  outline: none;
  
  &:hover {
    border-color: #cb6565;
  }
  
  &:focus {
    border-color: #cb6565;
  }
`;

const ViewToggleRight = styled.div`
  display: flex;
  gap: 8px;
`;

const ToggleButton = styled.button`
  padding: 8px;
  background: ${props => props.$active ? '#cb6565' : 'transparent'};
  border: 1px solid ${props => props.$active ? '#cb6565' : '#ddd'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  
  &:hover {
    background: ${props => props.$active ? '#cb6565' : '#f5f5f5'};
    border-color: ${props => props.$active ? '#cb6565' : '#cb6565'};
  }
  
  svg {
    stroke: ${props => props.$active ? '#fff' : '#888'};
    transition: stroke 0.2s;
  }
  
  &:hover svg {
    stroke: ${props => props.$active ? '#fff' : '#cb6565'};
  }
`;

const NovelListWrapper = styled.div`
  display: ${props => props.$viewMode === 'card' ? 'grid' : 'flex'};
  grid-template-columns: ${props => props.$viewMode === 'card' ? 'repeat(2, 1fr)' : 'none'};
  flex-direction: ${props => props.$viewMode === 'list' ? 'column' : 'row'};
  gap: 20px;
  padding-bottom: 20px;
  
  @media (min-width: 480px) {
    grid-template-columns: ${props => props.$viewMode === 'card' ? 'repeat(3, 1fr)' : 'none'};
  }
`;

const NovelItem = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 12px;
  padding: ${props => props.$viewMode === 'card' ? '20px' : '16px'};
  box-shadow: ${({ theme }) => theme.cardShadow};
  border: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;
  transition: box-shadow 0.15s;
  display: flex;
  flex-direction: ${props => props.$viewMode === 'card' ? 'column' : 'row'};
  align-items: ${props => props.$viewMode === 'card' ? 'center' : 'flex-start'};
  gap: ${props => props.$viewMode === 'card' ? '12px' : '16px'};
  width: 100%;
  &:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  }
`;

const NovelCover = styled.img`
  width: ${props => props.$viewMode === 'card' ? '100%' : '80px'};
  max-width: ${props => props.$viewMode === 'card' ? '180px' : '80px'};
  aspect-ratio: 2/3;
  height: ${props => props.$viewMode === 'card' ? 'auto' : '120px'};
  object-fit: cover;
  border-radius: 12px;
  background: #E5E5E5;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex-shrink: 0;
`;

const NovelInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$viewMode === 'card' ? 'center' : 'flex-start'};
  gap: 8px;
  flex: 1;
  width: 100%;
`;

const NovelTitle = styled.div`
  font-size: 15px;
  color: ${({ theme }) => theme.text};
  font-weight: 600;
  margin-bottom: 4px;
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
  word-break: keep-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NovelOwner = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  margin-bottom: 0;
  font-weight: 500;
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
`;

const PurchaseDate = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.cardSubText || '#888'};
  margin-bottom: 0;
  margin-top: 4px;
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
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
    const [sortedNovels, setSortedNovels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // localStorage에서 저장된 viewMode를 가져오거나 기본값 'card' 사용
    const [viewMode, setViewMode] = useState(() => {
        const savedViewMode = localStorage.getItem('purchasedNovelsViewMode');
        return savedViewMode === 'list' ? 'list' : 'card';
    });
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'author'

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchPurchasedNovels = async () => {
            setIsLoading(true);
            try {
                // 사용자가 구매한 소설 ID 목록과 구매 날짜 가져오기
                const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                const viewedSnapshot = await getDocs(viewedNovelsRef);
                
                if (viewedSnapshot.empty) {
                    setNovels([]);
                    setIsLoading(false);
                    return;
                }

                // viewedNovels 문서에서 novelId와 viewedAt 정보 추출
                const viewedNovelsData = viewedSnapshot.docs.map(doc => ({
                    novelId: doc.id,
                    viewedAt: doc.data().viewedAt || doc.data().createdAt || null
                }));

                // novelId로 novels 컬렉션에서 데이터 fetch
                const novelsRef = collection(db, 'novels');
                const novelDocs = await Promise.all(
                    viewedNovelsData.map(item => getDoc(doc(novelsRef, item.novelId)))
                );
                
                // 백업 데이터(purchasedNovels)도 함께 조회
                const purchasedNovelsRef = collection(db, 'users', user.uid, 'purchasedNovels');
                const purchasedNovelsSnapshot = await getDocs(purchasedNovelsRef);
                const purchasedNovelsMap = {};
                purchasedNovelsSnapshot.docs.forEach(doc => {
                    purchasedNovelsMap[doc.id] = { id: doc.id, ...doc.data() };
                });
                
                let purchased = novelDocs
                    .map((snap, idx) => {
                        const novelId = viewedNovelsData[idx].novelId;
                        // 소설이 삭제되었거나 존재하지 않는 경우 백업 데이터 사용
                        if (!snap.exists() || snap.data().deleted === true) {
                            const backupNovel = purchasedNovelsMap[novelId];
                            if (backupNovel) {
                                return {
                                    ...backupNovel,
                                    purchasedAt: viewedNovelsData[idx].viewedAt,
                                    isDeleted: true // 삭제된 소설임을 표시
                                };
                            }
                            return null;
                        }
                        return {
                            ...snap.data(),
                            id: snap.id,
                            purchasedAt: viewedNovelsData[idx].viewedAt
                        };
                    })
                    .filter(novel => novel !== null);
                
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

    // 정렬 로직
    useEffect(() => {
        if (novels.length === 0) {
            setSortedNovels([]);
            return;
        }

        const sorted = [...novels].sort((a, b) => {
            if (sortBy === 'newest') {
                // 구매일 기준 최신순
                const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
                const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
                return bDate - aDate;
            } else if (sortBy === 'oldest') {
                // 구매일 기준 오래된순
                const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
                const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
                return aDate - bDate;
            } else if (sortBy === 'author') {
                // 작가순 (가나다순)
                const aName = a.ownerName || '';
                const bName = b.ownerName || '';
                return aName.localeCompare(bName, 'ko');
            }
            return 0;
        });

        setSortedNovels(sorted);
    }, [novels, sortBy]);

    return (
        <Container theme={theme}>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('home_purchased_novel')} />
            {isLoading ? (
                <div style={{ textAlign: 'center', marginTop: 40 }}>로딩 중...</div>
            ) : novels.length === 0 ? (
                <EmptyMessage>{t('home_no_purchased_novel')}</EmptyMessage>
            ) : (
                <>
                    <ViewToggle>
                        <SortSelect 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            theme={theme}
                        >
                            <option value="newest">구매일 최신순</option>
                            <option value="oldest">구매일 오래된순</option>
                            <option value="author">작가순</option>
                        </SortSelect>
                        <ViewToggleRight>
                            <ToggleButton 
                                $active={viewMode === 'card'} 
                                onClick={() => {
                                    setViewMode('card');
                                    localStorage.setItem('purchasedNovelsViewMode', 'card');
                                }}
                                title="그리드형"
                            >
                                <GridIcon width={20} height={20} />
                            </ToggleButton>
                            <ToggleButton 
                                $active={viewMode === 'list'} 
                                onClick={() => {
                                    setViewMode('list');
                                    localStorage.setItem('purchasedNovelsViewMode', 'list');
                                }}
                                title="목록형"
                            >
                                <ListIcon width={20} height={20} />
                            </ToggleButton>
                        </ViewToggleRight>
                    </ViewToggle>
                    <NovelListWrapper $viewMode={viewMode}>
                        {sortedNovels.map((novel) => {
                            const formatPurchaseDate = (purchasedAt) => {
                                if (!purchasedAt) return '';
                                const date = purchasedAt.toDate ? purchasedAt.toDate() : new Date(purchasedAt);
                                if (isNaN(date.getTime())) return '';
                                const year = date.getFullYear();
                                const month = date.getMonth() + 1;
                                const day = date.getDate();
                                return `${year}. ${month}. ${day}`;
                            };

                            return (
                                <NovelItem
                                    key={novel.id}
                                    $viewMode={viewMode}
                                    onClick={() => navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre)}?userId=${novel.userId}`, { 
                                        state: { returnPath: '/purchased-novels' } 
                                    })}
                                >
                                    <NovelCover 
                                        src={novel.imageUrl || '/novel_banner/default.png'} 
                                        alt={novel.title || '소설 표지'}
                                        $viewMode={viewMode}
                                    />
                                    <NovelInfo $viewMode={viewMode}>
                                        <NovelTitle $viewMode={viewMode}>{novel.title}</NovelTitle>
                                        <NovelOwner $viewMode={viewMode}>by {novel.ownerName}</NovelOwner>
                                        <PurchaseDate $viewMode={viewMode}>
                                            구매일: {formatPurchaseDate(novel.purchasedAt)}
                                        </PurchaseDate>
                                    </NovelInfo>
                                </NovelItem>
                            );
                        })}
                    </NovelListWrapper>
                </>
            )}
            <Navigation />
        </Container>
    );
}

export default PurchasedNovels;

