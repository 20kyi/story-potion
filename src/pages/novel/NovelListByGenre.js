import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createNovelUrl } from '../../utils/novelUtils';
import styled from 'styled-components';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useLanguage, useTranslation } from '../../LanguageContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
  // padding-top: 10px;
  // padding-bottom: 100px;
  margin-top: 60px;
  margin-bottom: 80px;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;
// const BannerImage = styled.img`
//   width: 100%;
//   max-width: 240px;
//   border-radius: 16px;
//   margin: 0 auto 24px auto;
//   display: block;
// `;



const Content = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const NovelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px 16px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(5, 1fr);
  }
`;

const NovelItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  text-align: center;
`;

const WeekTitle = styled.h2`
  font-size: 14px;
  color: ${({ theme }) => theme.primary};
  font-weight: 500;
  margin: 0 0 12px 0;
`;

const NovelCover = styled.img`
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.card};
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-bottom: 12px;
`;

const NovelTitle = styled.h3`
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50vh;
    font-size: 18px;
    color: ${({ theme }) => theme.cardSubText};
`;

const NoNovelsMessage = styled.div`
    text-align: center;
    margin-top: 50px;
    color: ${({ theme }) => theme.cardSubText};
`;

const genreBanners = {
  '로맨스': process.env.PUBLIC_URL + '/novel_banner/romance.png',
  '추리': process.env.PUBLIC_URL + '/novel_banner/mystery.png',
  '역사': process.env.PUBLIC_URL + '/novel_banner/historical.png',
  '동화': process.env.PUBLIC_URL + '/novel_banner/fairytale.png',
  '판타지': process.env.PUBLIC_URL + '/novel_banner/fantasy.png',
  '공포': process.env.PUBLIC_URL + '/novel_banner/horror.png'
};

const genreMap = {
  fantasy: '판타지',
  romance: '로맨스',
  mystery: '추리',
  historical: '역사',
  fairytale: '동화',
  horror: '공포'
};

const NovelListByGenre = ({ user }) => {
  const { genre: genreParam } = useParams();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const genre = (genreMap[genreParam] || genreParam).trim(); // 한글로 변환 후 trim
  const navigate = useNavigate();
  const [novels, setNovels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('useEffect 실행', user, genre);
    if (!user || !genre) {
      setIsLoading(false);
      return;
    }

    const fetchNovels = async () => {
      setIsLoading(true);
      try {
        console.log('Firestore 쿼리 userId:', user.uid, 'genre:', genre);
        const novelsRef = collection(db, 'novels');
        const q = query(novelsRef,
          where('userId', '==', user.uid),
          where('genre', '==', genre),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedNovels = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('fetchedNovels:', fetchedNovels);
        setNovels(fetchedNovels);
      } catch (error) {
        console.error('Error fetching novels by genre:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovels();
  }, [user, genre]);

  const handleNovelClick = (novel) => {
    navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre)}`);
  };

  const bannerImage = genreBanners[genre];

  const getDisplayGenre = () => {
    // route param 기준으로 장르 번역 (novel_genre_* 키 사용)
    const key = `novel_genre_${genreParam}`;
    const translated = t(key);
    return translated !== key ? translated : genre;
  };

  const formatWeekLabel = (novel) => {
    if (!novel) return '';
    if (language === 'en') {
      const d = new Date(novel.year || 2000, (novel.month || 1) - 1, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'long' });
      return `${monthName} ${t('week_num', { num: novel.weekNum })}`;
    }
    return novel.week || `${novel.month}월 ${novel.weekNum}주차`;
  };

  const titleText = t('novel_list_by_genre_title', { genre: getDisplayGenre() });

  return (
    <Container>
      <Header
        user={user}
        leftAction={() => navigate(-1)}
        leftIconType="back"
        title={titleText}
      />

      {/* {bannerImage && <BannerImage src={bannerImage} alt={`${genre} 배너`} />} */}

      <Content>
        {isLoading ? (
          <LoadingContainer>{t('novel_loading')}</LoadingContainer>
        ) : novels.length > 0 ? (
          <NovelGrid>
            {novels.map(novel => (
              <NovelItem key={novel.id || novel.title} onClick={() => handleNovelClick(novel)}>
                <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                <NovelTitle>{novel.title}</NovelTitle>
              </NovelItem>
            ))}
          </NovelGrid>
        ) : (
          <NoNovelsMessage>{t('novel_no_novel_genre')}</NoNovelsMessage>
        )}
      </Content>

      <Navigation />
    </Container>
  );
};

export default NovelListByGenre; 