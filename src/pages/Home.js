import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import PencilIcon from '../components/icons/PencilIcon';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

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
  height: 220px;
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
  background-color: ${props => props.$active ? '#e46262' : 'rgba(255, 255, 255, 0.5)'};
`;

const MainButtonRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 36px;
  justify-content: flex-start;

  @media (min-width: 768px) {
    flex-direction: column;
    gap: 16px;
    margin-bottom: 0;
    flex-grow: 1;
  }
`;

const MainButton = styled.div`
  flex: 1;
  min-width: 0;
  background: ${({ color }) => color === 'blue' ? 'linear-gradient(135deg, #aee2ff 0%, #6db3f2 100%)' : 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)'};
  border-radius: 28px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.13); }

  @media (min-width: 768px) {
    height: auto;
  }
`;
/* 일기 쓰기 버튼 텍스트 */
const MainButtonText = styled.div`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 6px rgba(0,0,0,0.08);
  @media (min-width: 768px) {
    font-size: 20px;
  }
`;
/* 일기 최근 미리보기 */
const DiaryPreviewContainer = styled.div`
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  gap: 16px;
  align-items: center;
`;

const DiaryPreviewImage = styled.img`
  width: 80px;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
`;

const DiaryPreviewTextContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const DiaryPreviewDate = styled.div`
  font-size: 12px;
  opacity: 0.8;
  color: #fff;
  margin-bottom: 4px;
  @media (min-width: 768px) {
    font-size: 14px;
  }
`;

const DiaryPreviewTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  @media (min-width: 768px) {
    font-size: 22px;
  }
`;

const DiaryPreviewContent = styled.div`
  font-size: 12px;
  color: #fff;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  width: 100%;
  @media (min-width: 768px) {
    font-size: 16px;
  }
`;

const WriteButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 20px;
  }
`;
/* 최근일기 영역 */
const LeftSection = styled.div`
  @media (min-width: 768px) {
    flex: 0 0 480px;
    display: flex;
    flex-direction: column;
  }
`;

const RightSection = styled.div`
  flex: 1;
`;

const SectionLabel = styled.div`
  font-size: 20px;
  font-weight: 500;
  color: #222;
  margin-bottom: 18px;
  @media (min-width: 768px) {
    font-size: 24px;
  }
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
  @media (min-width: 768px) {
    font-size: 18px;
  }
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

function Home({ user }) {
  const navigate = useNavigate();
  const [recentDiaries, setRecentDiaries] = useState([]);
  const [recentNovels, setRecentNovels] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchRecentData = async () => {
      // Fetch recent diaries
      const diariesRef = collection(db, 'diaries');
      const diariesQuery = query(diariesRef, where('userId', '==', user.uid), orderBy('date', 'desc'), limit(1));
      const diarySnapshot = await getDocs(diariesQuery);
      setRecentDiaries(diarySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));

      // Fetch recent novels
      const novelsRef = collection(db, 'novels');
      const novelsQuery = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(3));
      const novelSnapshot = await getDocs(novelsQuery);
      setRecentNovels(novelSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };

    fetchRecentData();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // 'YYYY-MM-DD' 형식을 로컬 시간대로 안전하게 파싱
    const date = new Date(dateString.replace(/-/g, '/'));
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Container>
      <Header user={user} />
      <Carousel>
        <CarouselDots>
          <Dot $active={true} />
          <Dot $active={false} />
          <Dot $active={false} />
        </CarouselDots>
      </Carousel>

      <ContentGrid>
        <LeftSection>
          <SectionLabel>최근일기</SectionLabel>
          <MainButtonRow>
            <MainButton color="blue" style={{ flex: 2 }} onClick={() => recentDiaries[0] ? navigate(`/diary/date/${recentDiaries[0].date}`) : navigate('/write')}>
              {recentDiaries.length > 0 && recentDiaries[0] ? (
                <DiaryPreviewContainer>
                  {recentDiaries[0].imageUrls && recentDiaries[0].imageUrls.length > 0 && (
                    <DiaryPreviewImage src={recentDiaries[0].imageUrls[0]} alt="최근 일기 이미지" />
                  )}
                  <DiaryPreviewTextContainer>
                    <DiaryPreviewDate>{formatDate(recentDiaries[0].date)}</DiaryPreviewDate>
                    <DiaryPreviewTitle>{recentDiaries[0].title}</DiaryPreviewTitle>
                    <DiaryPreviewContent>{recentDiaries[0].content}</DiaryPreviewContent>
                  </DiaryPreviewTextContainer>
                </DiaryPreviewContainer>
              ) : (
                <MainButtonText>최근 작성한 일기가 없어요</MainButtonText>
              )}
            </MainButton>
            <MainButton color="yellow" onClick={() => navigate('/write')}>
              <WriteButtonContent>
                <PencilIcon width="40" height="40" />
                <MainButtonText>일기쓰기</MainButtonText>
              </WriteButtonContent>
            </MainButton>
          </MainButtonRow>
        </LeftSection>
        <RightSection>
          <SectionLabel>내 소설</SectionLabel>
          <MyNovelRow>
            {recentNovels.length > 0 ?
              recentNovels.map(novel => (
                <MyNovelBox key={novel.id} onClick={() => navigate(`/novel/${novel.id}`)}>
                  <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                  <MyNovelTitle>{novel.title}</MyNovelTitle>
                </MyNovelBox>
              ))
              :
              Array(3).fill(null).map((_, idx) => (
                <MyNovelBox key={`placeholder-${idx}`}>
                  <div style={{
                    width: '100%',
                    maxWidth: '180px',
                    aspectRatio: '2/3',
                    background: '#fdd2d2',
                    borderRadius: '15px',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }} />
                  <MyNovelTitle style={{ color: '#aaa' }}>소설 없음</MyNovelTitle>
                </MyNovelBox>
              ))
            }
          </MyNovelRow>
        </RightSection>
      </ContentGrid>

      <Navigation />
    </Container>
  );
}

export default Home; 