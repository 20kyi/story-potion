import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Navigation from '../components/Navigation';
import Header from '../components/Header';
import PencilIcon from '../components/icons/PencilIcon';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc, increment, updateDoc, addDoc } from 'firebase/firestore';
import dailyTopics from '../data/topics.json';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { toast } from '../components/ui/Toast';
import { getPointPolicy } from '../utils/appConfig';
import { checkWeeklyBonus } from '../utils/weeklyBonus';
import { useTranslation } from '../LanguageContext';


const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  // padding-top: 30px;
  padding-bottom: 100px;
  margin: 60px auto;
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
  margin-bottom: 10px;
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
  -webkit-line-clamp: ${props => props.lineClamp || 3};
  -webkit-box-orient: vertical;
  line-height: 1.4;
  width: 100%;
  word-break: keep-all;
  overflow-wrap: anywhere;
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
  margin-bottom: 10px;
  margin-top: 10px;
  // @media (min-width: 768px) {
  //   font-size: 24px;
  // }
`;

const MyNovelRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
  overflow-x: auto;
  // padding-bottom: 8px;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const PotionSection = styled.div`
  // margin-top: 10px;
`;

const PotionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 8px 0;
`;

const PotionCard = styled.div`
  width: 100%;
  height: 110px;
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.95);
    background: ${({ theme }) => theme.cardHover || '#f8f9fa'};
  }
`;

const PotionImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-bottom: 6px;
`;

const PotionCount = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const PotionName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
  text-align: center;
`;

const EmptyPotionCard = styled.div`
  width: 100%;
  height: 110px;
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  opacity: 0.5;
  grid-column: 1 / -1;
`;

const EmptyPotionText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#888'};
  text-align: center;
`;

const MyNovelBox = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap: 18px;
  margin-bottom: 10px;
`;



const MyNovelTitle = styled.div`
  // margin-top: 10px;
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
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const RecommendationTopic = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.cardSubText};
  line-height: 1.4;
  margin-top: 4px;
  word-break: keep-all;
  overflow-wrap: anywhere;
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

// 탭 버튼 스타일 추가
const TabBar = styled.div`
  display: flex;
  gap: 0;
  margin: 18px 0 10px 0;
  border-bottom: 1.5px solid #f0caca;
`;
const TabButton = styled.button`
  flex: 1;
  padding: 12px 0 10px 0;
  background: none;
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#cb6565' : 'transparent'};
  color: ${props => props.$active ? '#cb6565' : '#888'};
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: border-bottom 0.2s, color 0.2s;
  font-family: inherit;
`;

function Home({ user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [recentDiaries, setRecentDiaries] = useState([]);
  const [recentNovels, setRecentNovels] = useState([]);
  const [purchasedNovels, setPurchasedNovels] = useState([]); // 추가
  const [ownedPotions, setOwnedPotions] = useState({});
  const [activeTab, setActiveTab] = useState('my'); // 'my', 'purchased', 'potion'


  // 포션 데이터 (표시는 locale로)
  const potionData = [
    { id: 'romance', key: 'novel_genre_romance', image: '/potion/romance.png' },
    { id: 'historical', key: 'novel_genre_historical', image: '/potion/historical.png' },
    { id: 'mystery', key: 'novel_genre_mystery', image: '/potion/mystery.png' },
    { id: 'horror', key: 'novel_genre_horror', image: '/potion/horror.png' },
    { id: 'fairytale', key: 'novel_genre_fairytale', image: '/potion/fairytale.png' },
    { id: 'fantasy', key: 'novel_genre_fantasy', image: '/potion/fantasy.png' },
  ];

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

      // Fetch purchased novels
      try {
        const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
        const viewedSnapshot = await getDocs(viewedNovelsRef);
        const novelIds = viewedSnapshot.docs.map(doc => doc.id);
        if (novelIds.length === 0) {
          setPurchasedNovels([]);
        } else {
          // novelId로 novels 컬렉션에서 데이터 fetch (최신순 3개)
          // Firestore는 in 쿼리로 최대 10개까지 지원하므로, novelIds가 많으면 최근 10개만
          const limitedNovelIds = novelIds.slice(-10);
          const novelsRef = collection(db, 'novels');
          // novelId별 getDoc 병렬 fetch
          const novelDocs = await Promise.all(limitedNovelIds.map(id => getDoc(doc(novelsRef, id))));
          let purchased = novelDocs
            .filter(snap => snap.exists())
            .map(snap => ({ ...snap.data(), id: snap.id }));
          // 최신순 정렬(createdAt 내림차순)
          purchased = purchased.sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0));
          // 각 소설의 userId로 닉네임/아이디 조회
          const ownerIds = [...new Set(purchased.map(novel => novel.userId))];
          const userDocs = await Promise.all(ownerIds.map(uid => getDoc(doc(db, 'users', uid))));
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
          purchased = purchased.map(novel => ({ ...novel, ownerName: ownerMap[novel.userId] }));
          setPurchasedNovels(purchased.slice(0, 3));
        }
      } catch (e) {
        setPurchasedNovels([]);
      }

      // Fetch user's potions
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setOwnedPotions(userDoc.data().potions || {});
        }
      } catch (error) {
        console.error('포션 정보 조회 실패:', error);
      }
    };

    fetchRecentData();
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // 'YYYY-MM-DD' 형식을 로컬 시간대로 안전하게 파싱
    const date = new Date(dateString.replace(/-/g, '/'));
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
        <SectionLabel>{t('home_recent_diary')}</SectionLabel>
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
                  <DiaryPreviewContent lineClamp={recentDiaries[0].imageUrls && recentDiaries[0].imageUrls.length > 0 ? 3 : 6}>{recentDiaries[0].content}</DiaryPreviewContent>
                </DiaryPreviewTextContainer>
              </DiaryPreviewContainer>
            ) : (
              <DiaryPreviewContainer>
                <DiaryPreviewTitle>{t('home_no_diary_yet')}</DiaryPreviewTitle>
                <DiaryPreviewContent lineClamp={6}>{t('home_write_first_diary')}</DiaryPreviewContent>
              </DiaryPreviewContainer>
            )}
          </RecentDiaryCard>

          <RightColumn>
            <TopicCard>
              {/* <TopicTitle>오늘의 일기 </TopicTitle> */}
              <RecommendationIntro>{t('home_topic_intro')}</RecommendationIntro>
              <RecommendationTopic>"{todayTopic}"</RecommendationTopic>
            </TopicCard>
            <WriteDiaryButton onClick={handleWriteDiaryClick}>
              <WriteButtonContent>
                <PencilIcon width="32" height="32" />
                <MainButtonText>{t('home_write_diary')}</MainButtonText>
              </WriteButtonContent>
            </WriteDiaryButton>
          </RightColumn>
        </MainButtonRow>

        {/* 탭 바 추가 */}
        <TabBar>
          <TabButton $active={activeTab === 'my'} onClick={() => setActiveTab('my')}>{t('home_my_novel')}</TabButton>
          <TabButton $active={activeTab === 'purchased'} onClick={() => setActiveTab('purchased')}>{t('home_purchased_novel')}</TabButton>
          <TabButton $active={activeTab === 'potion'} onClick={() => setActiveTab('potion')}>{t('home_my_potion')}</TabButton>
        </TabBar>
        <div style={{ height: 16 }} />

        {/* 탭별 내용 */}
        {activeTab === 'my' && (
          <>
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
                    <MyNovelTitle style={{ color: '#aaa' }}>{t('home_no_novel')}</MyNovelTitle>
                  </MyNovelBox>
                ))
              }
            </MyNovelRow>
          </>
        )}
        {activeTab === 'purchased' && (
          <>
            <MyNovelRow>
              {purchasedNovels.length > 0 ?
                purchasedNovels.map(novel => (
                  <MyNovelBox key={novel.id} onClick={() => navigate(`/novel/${novel.year}-${novel.month}-${novel.weekNum}?userId=${novel.userId}`)}>
                    <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                    <MyNovelTitle>{novel.title}</MyNovelTitle>
                    <div style={{ fontSize: '13px', color: '#888', marginTop: '-10px', marginBottom: '6px' }}>by {novel.ownerName}</div>
                  </MyNovelBox>
                ))
                :
                Array(3).fill(null).map((_, idx) => (
                  <MyNovelBox key={`purchased-placeholder-${idx}`}>
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
                    <MyNovelTitle style={{ color: '#aaa' }}>{t('home_no_purchased_novel')}</MyNovelTitle>
                  </MyNovelBox>
                ))
              }
            </MyNovelRow>
          </>
        )}
        {activeTab === 'potion' && (
          <>
            <PotionSection>
              <PotionRow>
                {potionData.map(potion => {
                  const count = ownedPotions[potion.id] || 0;
                  return count > 0 ? (
                    <PotionCard
                      key={potion.id}
                      onClick={() => navigate('/my/potion-shop')}
                      title={`${t(potion.key)} ${t('potion') || ''} ${count}`}
                    >
                      <PotionImage src={potion.image} alt={t(potion.key)} />
                      <PotionCount>{count}</PotionCount>
                      <PotionName>{t(potion.key)}</PotionName>
                    </PotionCard>
                  ) : null;
                })}
                {Object.values(ownedPotions).every(count => !count || count <= 0) && (
                  <EmptyPotionCard>
                    <EmptyPotionText>{t('home_no_potion')}</EmptyPotionText>
                    <EmptyPotionText style={{ fontSize: '10px', marginTop: '4px' }}>
                      {t('home_buy_potion')}
                    </EmptyPotionText>
                  </EmptyPotionCard>
                )}
              </PotionRow>
            </PotionSection>
          </>
        )}
      </ContentGrid>

      <Navigation />
    </Container>
  );
}

export default Home; 