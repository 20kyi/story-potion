import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';

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

const Carousel = styled.div`
  background-color: #df9696;
  border-radius: 25px;
  height: 200px;
  margin-bottom: 30px;
  margin-top: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CarouselDots = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#e46262' : 'rgba(255, 255, 255, 0.5)'};
`;

const MainButtonRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 36px;
  justify-content: flex-start;
`;

const MainButton = styled.div`
  flex: 1;
  min-width: 0;
  background: ${({ color }) => color === 'blue' ? 'linear-gradient(135deg, #aee2ff 0%, #6db3f2 100%)' : 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)'};
  border-radius: 28px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.13); }
`;

const MainButtonText = styled.div`
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  text-shadow: 0 1px 6px rgba(0,0,0,0.08);
`;

const SectionLabel = styled.div`
  font-size: 22px;
  font-weight: 500;
  color: #222;
  margin-bottom: 18px;
`;

const MyNovelRow = styled.div`
  display: flex;
  gap: 18px;
  margin-bottom: 30px;
`;

const MyNovelBox = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
`;

const MyNovelTitle = styled.div`
  margin-top: 10px;
  font-size: 15px;
  color: #cb6565;
  font-weight: 600;
  text-align: center;
  word-break: keep-all;
`;

const NovelCover = styled.img`
  width: 100%;
  max-width: 180px;
  aspect-ratio: 2/3;
  height: auto;
  object-fit: cover;
  // border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  background: #fdd2d2;
  display: block;
  margin-left: auto;
  margin-right: auto;
`;

function Home() {
  const navigate = useNavigate();
  const [recentDiaries, setRecentDiaries] = useState([]);
  const [recentNovels, setRecentNovels] = useState([]);

  useEffect(() => {
    const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
    const sortedDiaries = diaries.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 1);
    setRecentDiaries(sortedDiaries);
    const novels = JSON.parse(localStorage.getItem('novels') || '[]');
    const sortedNovels = novels.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);
    setRecentNovels(sortedNovels);
  }, []);

  return (
    <Container>
      <Header />
      <Carousel>
        <CarouselDots>
          {[0, 1, 2].map((index) => (
            <Dot key={index} active={index === 0} />
          ))}
        </CarouselDots>
      </Carousel>

      <SectionLabel>최근일기</SectionLabel>
      <MainButtonRow>
        <MainButton color="blue" style={{ flex: 2 }} onClick={() => recentDiaries[0] ? navigate(`/diary/date/${recentDiaries[0].date.split('T')[0]}`) : navigate('/write')}>
          {/* <MainButtonText>최근일기</MainButtonText> */}
        </MainButton>
        <MainButton color="yellow" style={{ flex: 1 }} onClick={() => navigate('/write')}>
          <MainButtonText>일기쓰기</MainButtonText>
        </MainButton>
      </MainButtonRow>

      <SectionLabel>내 소설</SectionLabel>
      <MyNovelRow>
        {recentNovels.length > 0 ? (
          recentNovels.map((novel) => (
            <MyNovelBox key={novel.id} onClick={() => navigate(`/novel/${novel.id}`)}>
              <NovelCover src={novel.imageUrl} alt={novel.title} />
              <MyNovelTitle>{novel.title}</MyNovelTitle>
            </MyNovelBox>
          ))
        ) : (
          Array(3).fill(null).map((_, idx) => (
            <MyNovelBox key={idx}>
              <div style={{
                width: '100%',
                maxWidth: 180,
                aspectRatio: '2/3',
                background: '#fdd2d2',
                borderRadius: 15,
              }} />
              <MyNovelTitle style={{ color: '#ddd' }}>소설 쓰기</MyNovelTitle>
            </MyNovelBox>
          ))
        )}
      </MyNovelRow>

      <Navigation />
    </Container>
  );
}

export default Home; 