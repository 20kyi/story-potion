import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';

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
  background: #fdd2d2;
  margin-right: 16px;
`;

const NovelTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.primary};
  margin-bottom: 8px;
`;

const NovelDate = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardSubText};
  margin-bottom: 12px;
`;

const NovelContent = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.cardText};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

function FriendNovelList() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const [novels, setNovels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setNovels([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const fetchNovels = async () => {
            try {
                const novelsRef = collection(db, 'novels');
                const q = query(novelsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedNovels = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setNovels(fetchedNovels);
            } catch (error) {
                setNovels([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNovels();
    }, [userId]);

    const formatDate = (dateOrTimestamp) => {
        if (!dateOrTimestamp) return '';
        let dateObj;
        if (typeof dateOrTimestamp === 'object' && dateOrTimestamp.toDate) {
            dateObj = dateOrTimestamp.toDate();
        } else {
            dateObj = new Date(dateOrTimestamp);
        }
        return `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
    };

    return (
        <Container>
            <Header title="친구의 소설 목록" />
            {(!userId) ? (
                <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>userId가 없습니다.</div>
            ) : isLoading ? (
                <div style={{ textAlign: 'center', marginTop: 40 }}>로딩 중...</div>
            ) : (
                <NovelListWrapper>
                    {novels.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>소설이 없습니다.</div>
                    ) : (
                        novels.map((novel) => (
                            <NovelItem
                                key={novel.id}
                                onClick={() => navigate(`/novel/${novel.year}-${novel.month}-${novel.weekNum}`)}
                                style={{ display: 'flex', alignItems: 'center' }}
                            >
                                <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                                <div style={{ flex: 1 }}>
                                    <NovelTitle>{novel.title}</NovelTitle>
                                    <NovelDate>{formatDate(novel.createdAt)}</NovelDate>
                                    <NovelContent>{novel.content}</NovelContent>
                                </div>
                            </NovelItem>
                        ))
                    )}
                </NovelListWrapper>
            )}
            <Navigation />
        </Container>
    );
}

export default FriendNovelList; 