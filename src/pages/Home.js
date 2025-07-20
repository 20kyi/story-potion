import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import PencilIcon from '../components/icons/PencilIcon';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import dailyTopics from '../data/topics.json';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  padding-top: 30px;
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

/* 일기 최근 미리보기 영역 */
const MainButtonRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 36px;
  align-items: stretch;

  // @media (min-width: 768px) {
  //   flex-direction: column;
  //   gap: 16px;
  //   margin-bottom: 0;
  //   flex-grow: 1;
  //   min-height: 280px;
  // }
`;
/* 일기 최근 미리보기 영역 */
const RecentDiaryCard = styled.div`
  flex: 1;
  min-width: 0;
  background: ${({ theme }) => theme.cardGradient || 'linear-gradient(135deg, #aee2ff 0%, #6db3f2 100%)'};
  border-radius: 28px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  min-height: 150px;
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.13); }
  padding: 16px;

  // @media (min-width: 768px) {
  //   height: auto;
  // }
`;
/* 일기 쓰기 버튼 */
const WriteDiaryButton = styled.div`
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.writeCardGradient || 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)'};
  border-radius: 28px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: box-shadow 0.2s;
  gap: 10px;
  &:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.13); }
`;
/* 일기 쓰기 버튼 텍스트 */
const MainButtonText = styled.div`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-shadow: 0 1px 6px rgba(0,0,0,0.08);
  // @media (min-width: 768px) {
  //   font-size: 20px;
  // }
`;
/* 일기 최근 미리보기 */
const DiaryPreviewContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
/* 일기 최근 미리보기 이미지 */
const DiaryPreviewImage = styled.img`
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  object-fit: cover;
`;
/* 일기 최근 미리보기 텍스트 */
const DiaryPreviewTextContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;
/* 일기 최근 미리보기 날짜 */
const DiaryPreviewDate = styled.div`
  font-size: 12px;
  opacity: 0.8;
  color: #fff;
  margin-bottom: 4px;
  // @media (min-width: 768px) {
  //   font-size: 14px;
  // }
`;
/* 일기 최근 미리보기 제목 */
const DiaryPreviewTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  // @media (min-width: 768px) {
  //   font-size: 22px;
  // }
`;
/* 일기 최근 미리보기 내용 */
const DiaryPreviewContent = styled.div`
  font-size: 14px;
  color: #fff;
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  width: 100%;
  // @media (min-width: 768px) {
  //   font-size: 16px;
  // }
`;
/* 일기 쓰기 버튼 텍스트 */
const WriteButtonContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;
/* 일기 최근 미리보기 영역 */
const ContentGrid = styled.div`
  display: flex;
  flex-direction: column;

  // @media (min-width: 768px) {
  //   flex-direction: row;
  //   gap: 20px;
  // }
`;
/* 일기 최근 미리보기 영역 */
// const LeftSection = styled.div`
//   @media (min-width: 768px) {
//     flex: 2;
//     min-width: 400px;
//     display: flex;
//     flex-direction: column;
//   }
// `;
/* 일기 최근 미리보기 영역 */
// const RightSection = styled.div`
//   flex: 1;
// `;
/* 일기 최근 미리보기 영역 */
const SectionLabel = styled.div`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  margin-bottom: 18px;
  // @media (min-width: 768px) {
  //   font-size: 24px;
  // }
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
  // @media (min-width: 768px) {
  //   font-size: 18px;
  // }
`;

const NovelCover = styled.img`
  width: 100%;
  max-width: 180px;
  aspect-ratio: 2/3;
  height: auto;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  background: #fdd2d2;
  display: block;
  margin-left: auto;
  margin-right: auto;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 120px;
  flex-shrink: 0;

  // @media (min-width: 768px) {
  //   flex-direction: row;
  //   width: 100%;
  //   align-items: stretch;
  // }
`;
/* 일기 최근 미리보기 영역 */
const TopicCard = styled.div`
  background-color: ${({ theme }) => theme.progressCard};
  border-radius: 20px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  // @media (min-width: 768px) {
  //   flex-grow: 1;
  // }
`;
/* 일기 최근 미리보기 영역 */
const TopicTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.cardText};
  margin-bottom: 8px;
`;
/* 일기 최근 미리보기 영역 */
const RecommendationIntro = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.cardSubText};
  line-height: 1.4;
`;

const RecommendationTopic = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.cardSubText};
  line-height: 1.4;
  margin-top: 4px;
`;

const CarouselContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  // padding: 0;
  margin-bottom: 20px;
  .slick-dots {
    bottom: -35px;
    li {
      margin: 0 4px;
      button:before {
        color: #fdd2d2;
        opacity: 0.5;
        font-size: 8px;
      }
      &.slick-active button:before {
        color: #cb6565;
        opacity: 1;
      }
    }
  }
  .slick-slide {
    padding: 0 5px;
  }
  .slick-list {
    margin: 0 -5px;
  }
`;
const CarouselSlide = styled.div`
  width: 100%;
  min-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border-radius: 0;
  padding: 0;
`;

// home_banner용 데이터
const bannerData = [
  { src: process.env.PUBLIC_URL + '/home_banner/home1.png' },
  { src: process.env.PUBLIC_URL + '/home_banner/home2.png' },
  // 앞으로 이미지가 추가될 경우 여기에 파일명만 추가하면 됨
];

const sliderSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  pauseOnHover: false,
  arrows: false,
  cssEase: 'linear',
};

function Home({ user }) {
  const navigate = useNavigate();
  const [recentDiaries, setRecentDiaries] = useState([]);
  const [recentNovels, setRecentNovels] = useState([]);

  // 오늘의 글감 선택 로직
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const topicIndex = dayOfYear % dailyTopics.length;
  const todayTopic = dailyTopics[topicIndex];

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleWriteDiaryClick = async () => {
    if (!user) return;
    const todayDate = getTodayDate();
    const diariesRef = collection(db, 'diaries');
    const q = query(diariesRef, where('userId', '==', user.uid), where('date', '==', todayDate));

    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        alert('오늘의 일기를 이미 작성했습니다.');
      } else {
        navigate('/write');
      }
    } catch (error) {
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

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
      <CarouselContainer>
        <Slider {...sliderSettings}>
          {bannerData.map((banner, idx) => (
            <CarouselSlide key={idx}>
              <img
                src={banner.src}
                alt={`배너${idx + 1}`}
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  height: 'auto',
                  objectFit: 'cover',
                  borderRadius: '16px',
                  display: 'block',
                  margin: '0 auto',
                  // marginTop: '10px',
                }}
              />
            </CarouselSlide>
          ))}
        </Slider>
      </CarouselContainer>

      <ContentGrid>
        <SectionLabel>최근일기</SectionLabel>
        <MainButtonRow>
          <RecentDiaryCard onClick={() => recentDiaries.length > 0 && recentDiaries[0] && navigate(`/diary/date/${recentDiaries[0].date}`)}>
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
              <DiaryPreviewContainer>
                <DiaryPreviewTitle>아직 작성된 일기가 없어요</DiaryPreviewTitle>
                <DiaryPreviewContent>오늘의 첫 일기를 작성해보세요!</DiaryPreviewContent>
              </DiaryPreviewContainer>
            )}
          </RecentDiaryCard>

          <RightColumn>
            <TopicCard>
              {/* <TopicTitle>오늘의 일기 </TopicTitle> */}
              <RecommendationIntro>이런 주제는 <br /> 어떠세요?💡</RecommendationIntro>
              <RecommendationTopic>"{todayTopic}"</RecommendationTopic>
            </TopicCard>
            <WriteDiaryButton onClick={handleWriteDiaryClick}>
              <WriteButtonContent>
                <PencilIcon width="32" height="32" />
                <MainButtonText>일기 쓰기</MainButtonText>
              </WriteButtonContent>
            </WriteDiaryButton>
          </RightColumn>
        </MainButtonRow>
        <SectionLabel>내 소설</SectionLabel>
        <MyNovelRow>
          {recentNovels.length > 0 ?
            recentNovels.map(novel => (
              <MyNovelBox key={novel.id} onClick={() => navigate(`/novel/${novel.year}-${novel.month}-${novel.weekNum}`)}>
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
      </ContentGrid>

      <Navigation />
    </Container>
  );
}

export default Home; 