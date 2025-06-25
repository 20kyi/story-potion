import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #fff;
  padding: 20px;
  padding-top: 70px;
  padding-bottom: 100px;
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
  color: #e46262;
  margin: 0 0 8px 0;
  font-weight: 600;
`;

const NovelDate = styled.div`
  font-size: 14px;
  color: #999;
`;

const NovelContent = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  white-space: pre-line;
  padding: 20px;
  background: #fff8f8;
  border-radius: 15px;
`;

function NovelView({ user }) {
  const { id } = useParams();
  // id가 연-월-주차(예: 2025-6-3) 형식인지 확인
  const idParts = id ? id.split('-') : [];
  const isDateKey = idParts.length === 3 && idParts.every(part => !isNaN(Number(part)));
  const [novel, setNovel] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('NovelView 렌더링 시작. loading:', loading, 'user:', user, 'id:', id);

  useEffect(() => {
    console.log('useEffect 실행. user:', user, 'id:', id);

    if (!user || !id) {
      console.log('useEffect: user 또는 id가 없어서 종료합니다.');
      setLoading(false);
      return;
    }

    const fetchNovel = async () => {
      setLoading(true);
      console.log('fetchNovel 함수 실행 시작.');
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

  if (loading) {
    console.log('렌더링: "로딩 중" 화면');
    return (
      <Container>
        <Header user={user} />
        <div>소설을 불러오는 중...</div>
        <Navigation />
      </Container>
    );
  }

  if (!novel) {
    console.log('렌더링: "소설 없음" 화면');
    return (
      <Container>
        <Header user={user} />
        <div>소설을 찾을 수 없거나 접근 권한이 없습니다.</div>
        <Navigation />
      </Container>
    );
  }

  console.log('렌더링: "소설 정보 있음" 화면', novel);
  return (
    <Container>
      <Header user={user} />
      <NovelHeader>
        <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
        <NovelInfo>
          <NovelTitle>{novel.title}</NovelTitle>
          <NovelDate>{formatDate(novel.createdAt)}</NovelDate>
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