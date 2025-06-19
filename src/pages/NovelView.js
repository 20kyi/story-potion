import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import { useParams } from 'react-router-dom';

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

function NovelView() {
  const { id } = useParams();
  const [novel, setNovel] = useState(null);

  useEffect(() => {
    const novels = JSON.parse(localStorage.getItem('novels') || '[]');
    const foundNovel = novels.find(n => n.id === id);
    if (foundNovel) {
      setNovel(foundNovel);
    }
  }, [id]);

  if (!novel) {
    return (
      <Container>
        <Header />
        <div>소설을 찾을 수 없습니다.</div>
        <Navigation />
      </Container>
    );
  }

  return (
    <Container>
      <Header />
      <NovelHeader>
        <NovelCover src={novel.imageUrl} alt={novel.title} />
        <NovelInfo>
          <NovelTitle>{novel.title}</NovelTitle>
          <NovelDate>{novel.week} ({novel.dateRange})</NovelDate>
        </NovelInfo>
      </NovelHeader>
      <NovelContent>
        {novel.content || `이 소설은 ${novel.week}에 작성되었습니다. 
아직 내용이 준비되지 않았습니다.`}
      </NovelContent>
      <Navigation />
    </Container>
  );
}

export default NovelView; 