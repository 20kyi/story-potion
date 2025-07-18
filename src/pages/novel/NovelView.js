import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  padding-top: 40px;
  padding-bottom: 100px;
  margin: 40px auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const NovelHeader = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
`;

const NovelCover = styled.img`
  width: 120px;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const NovelInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const NovelTitle = styled.h1`
  font-size: 24px;
  color: ${({ theme }) => theme.primary};
  margin: 0 0 8px 0;
  font-weight: 600;

  /* 다크모드 대응 */
  body.dark & {
    color: #ffb3b3;
  }
`;

const NovelDate = styled.div`
  font-size: 14px;
  color: #999;
`;

const NovelContent = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ theme }) => theme.cardText};
  white-space: pre-line;
  padding: 20px;
  background: ${({ theme }) => theme.card};
  border-radius: 15px;

  /* 다크모드 대응 */
  body.dark & {
    color: #f1f1f1;
    background: #232323;
  }
`;

function NovelView({ user }) {
    const { id } = useParams();
    // id가 연-월-주차(예: 2025-6-3) 형식인지 확인
    const idParts = id ? id.split('-') : [];
    const isDateKey = idParts.length === 3 && idParts.every(part => !isNaN(Number(part)));
    const [novel, setNovel] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !id) {
            setLoading(false);
            return;
        }

        const fetchNovel = async () => {
            setLoading(true);
            try {
                if (isDateKey) {
                    // 연-월-주차로 쿼리
                    const [year, month, weekNum] = idParts.map(Number);
                    const novelsRef = collection(db, 'novels');
                    const q = query(
                        novelsRef,
                        where('year', '==', year),
                        where('month', '==', month),
                        where('weekNum', '==', weekNum),
                        where('userId', '==', user.uid)
                    );
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        setNovel({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
                    } else {
                        setNovel(null);
                    }
                } else {
                    // 기존: 랜덤 문서 ID로 접근
                    const novelRef = doc(db, 'novels', id);
                    const novelSnap = await getDoc(novelRef);
                    if (novelSnap.exists() && novelSnap.data().userId === user.uid) {
                        setNovel({ ...novelSnap.data(), id: novelSnap.id });
                    } else {
                        setNovel(null);
                    }
                }
            } catch (error) {
                setNovel(null);
            } finally {
                setLoading(false);
            }
        };

        fetchNovel();
    }, [id, user]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '날짜 정보 없음';
        return timestamp.toDate().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleDelete = async () => {
        if (!novel || !novel.id) return;
        if (!window.confirm('정말 이 소설을 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'novels', novel.id));
            alert('소설이 삭제되었습니다.');
            navigate('/novel');
        } catch (error) {
            alert('삭제에 실패했습니다.');
        }
    };

    if (loading) {
        return (
            <Container>
                <Header user={user} />
                <div>소설을 불러오는 중...</div>
                <Navigation />
            </Container>
        );
    }

    if (!novel) {
        return (
            <Container>
                <Header user={user} />
                <div>소설을 찾을 수 없거나 접근 권한이 없습니다.</div>
                <Navigation />
            </Container>
        );
    }

    return (
        <Container>
            <Header user={user} />
            <NovelHeader>
                <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                <NovelInfo>
                    <NovelTitle>{novel.title}</NovelTitle>
                    <NovelDate>{formatDate(novel.createdAt)}</NovelDate>
                    {/* 삭제 버튼 */}
                    {novel.id && (
                        <button onClick={handleDelete} style={{ marginTop: 16, background: '#e46262', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>
                            소설 삭제하기
                        </button>
                    )}
                </NovelInfo>
            </NovelHeader>
            <NovelContent>
                {novel.content || `이 소설은 ${formatDate(novel.createdAt)}에 작성되었습니다. 
아직 내용이 준비되지 않았습니다.`}
            </NovelContent>
            <Navigation />
        </Container>
    );
}

export default NovelView; 