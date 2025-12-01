import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTranslation } from '../../LanguageContext';
import { useTheme as useStyledTheme } from 'styled-components';
import { useTheme as useThemeContext } from '../../ThemeContext';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(6, 1fr);
  gap: 20px;
  max-width: 400px;
  margin: 0 auto;
  height: 480px;
`;
const StatCard = styled.div`
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme, index }) => {
    if ($isGlassTheme) return '24px';
    if (!$isDiaryTheme) return '18px';
    const borderRadiuses = [
      '16px 20px 18px 17px',
      '18px 16px 20px 17px',
      '17px 18px 16px 20px',
      '20px 17px 19px 16px',
      '18px 20px 17px 19px',
      '19px 17px 18px 20px'
    ];
    return borderRadiuses[index % borderRadiuses.length];
  }};
  box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    }
    return '0 2px 8px rgba(0,0,0,0.08)';
  }};
  padding: 24px 12px 18px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return `1px solid ${theme.border || '#f0f0f0'}`;
  }};
  min-height: 100px;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  background-clip: padding-box;
  transform: ${({ $isDiaryTheme, $isGlassTheme, index }) => {
    if ($isGlassTheme) return 'none';
    if (!$isDiaryTheme) return 'none';
    const rotations = [0.2, -0.3, 0.1, -0.2, 0.3, -0.1];
    return `rotate(${rotations[index % rotations.length] || 0}deg)`;
  }};

  /* 점선 내부 테두리 - 유지 */
  &::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border: 2px dashed ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
      if ($isDiaryTheme) {
        return 'rgba(139, 111, 71, 0.25)';
      }
      if ($isGlassTheme) {
        return 'rgba(0, 0, 0, 0.2)';
      }
      return theme.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.25)'
        : 'rgba(0, 0, 0, 0.15)';
    }};
    border-radius: 12px;
    pointer-events: none;
    z-index: 1;
  }

  /* 그라데이션 배경 효과 */
  ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) && `
    &::after {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, transparent 50%);
      z-index: -1;
      opacity: 0.3;
    }
  `}

  &:hover {
    box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
      if ($isGlassTheme) return '0 6px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
      if ($isDiaryTheme) {
        return '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
      }
      return '0 8px 24px rgba(0,0,0,0.13)';
    }};
    transform: ${({ $isDiaryTheme, $isGlassTheme, index }) => {
      if ($isGlassTheme) return 'translateY(-2px)';
      if (!$isDiaryTheme) return 'translateY(-2px)';
      const rotations = [0.2, -0.3, 0.1, -0.2, 0.3, -0.1];
      return `rotate(${rotations[index % rotations.length] || 0}deg) scale(0.98) translateY(-1px)`;
    }};
  }
`;
const StatImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 0;
  object-fit: contain;
  background: transparent;
  margin-bottom: 12px;
`;
const StatLabel = styled.div`
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 0.95rem;
  color: ${({ color, theme }) => color || theme.primary || theme.text};
  text-align: center;
`;
const StatNumber = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${({ color, theme }) => color || theme.primary || theme.text};
  margin-bottom: 2px;
  text-align: center;
`;
const Rank1 = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 2px;
  color: ${({ color, theme }) => color || theme.primary || '#e462a0'};
`;
const Rank2 = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 2px;
  color: ${({ color, theme }) => color || theme.primary || '#e462a0'};
`;
const Rank3 = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
  color: ${({ color, theme }) => color || theme.primary || '#e462a0'};
`;

// 아래에만 적용되는 StatNumberSmall 추가
const StatNumberSmall = styled(StatNumber)`
  font-size: 0.95rem;
`;


// 가장 많이 제작한 장르 이미지
const FavoriteGenreContainer = styled.div`
  width: 100%;
  max-width: 240px;
  margin: 0 auto 20px auto;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const FavoriteGenreCard = styled.div`
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

// 가장 많이 제작한 장르 텍스트
const FavoriteGenreText = styled.div`
  text-align: center;
  margin-top: 32px;
  margin-bottom: 20px;
  font-size: 1.05rem;
  font-weight: 600;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '#000000';
    if ($isDiaryTheme) return '#8B6F47';
    return theme.text || '#333';
  }};
`;

// 장르별 배너 데이터
const genreBannerData = {
    '로맨스': {
        genreKey: 'romance',
        src: process.env.PUBLIC_URL + '/novel_banner/romance.png',
        text: '낭만적인 로맨티스트'
    },
    '추리': {
        genreKey: 'mystery',
        src: process.env.PUBLIC_URL + '/novel_banner/mystery.png',
        text: '추리를 풀어가는 탐정'
    },
    '역사': {
        genreKey: 'historical',
        src: process.env.PUBLIC_URL + '/novel_banner/historical.png',
        text: '시간을 여행하는 고전 감성러'
    },
    '동화': {
        genreKey: 'fairytale',
        src: process.env.PUBLIC_URL + '/novel_banner/fairytale.png',
        text: '동화를 꿈꾸는 이야기꾼'
    },
    '판타지': {
        genreKey: 'fantasy',
        src: process.env.PUBLIC_URL + '/novel_banner/fantasy.png',
        text: '새로운 세계의 모험가'
    },
    '공포': {
        genreKey: 'horror',
        src: process.env.PUBLIC_URL + '/novel_banner/horror.png',
        text: '공포를 즐기는 호러 마니아'
    },
};

function Statistics({ user }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useStyledTheme();
    const { actualTheme } = useThemeContext();
    const isDiaryTheme = actualTheme === 'diary';
    const isGlassTheme = actualTheme === 'glass';
    const [diaryCount, setDiaryCount] = useState(0);
    const [novelCount, setNovelCount] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [topWords, setTopWords] = useState(['-', '-', '-']);
    const [loading, setLoading] = useState(true);
    const [favoriteGenre, setFavoriteGenre] = useState('-');
    const [favoriteGenreCount, setFavoriteGenreCount] = useState(0);

    // 앱 컨셉에 맞는 조화로운 5가지 색상 팔레트 (라이트/다크 모드 대응)
    const statColors = actualTheme === 'dark' ? {
        diary: '#ffb3b3',      // 로즈/코랄 (primary)
        interest: '#e8a8d0',    // 핑크/라벤더
        streak: '#c49dd4',      // 보라/퍼플
        novel: '#7bc4b0',       // 민트/그린
        genre: '#8bb5e0'        // 블루/스카이
    } : {
        diary: '#e46262',      // 로즈/코랄 (primary)
        interest: '#d47fb8',    // 핑크/라벤더
        streak: '#a67ac7',      // 보라/퍼플
        novel: '#5db89f',       // 민트/그린
        genre: '#6ba3d4'        // 블루/스카이
    };

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setLoading(true);
            // 1. 총 일기 수
            const diariesRef = collection(db, 'diaries');
            const diariesQ = query(diariesRef, where('userId', '==', user.uid));
            const diariesSnap = await getDocs(diariesQ);
            setDiaryCount(diariesSnap.size);

            // 2. 총 소설 수
            const novelsRef = collection(db, 'novels');
            const novelsQ = query(novelsRef, where('userId', '==', user.uid));
            const novelsSnap = await getDocs(novelsQ);
            setNovelCount(novelsSnap.size);

            // 3. 연속 작성일 계산
            const diaryDates = diariesSnap.docs.map(doc => doc.data().date).filter(Boolean).sort();
            let maxStreak = 0, currentStreak = 0, prevDate = null;
            for (let dateStr of diaryDates) {
                const date = new Date(dateStr);
                if (prevDate) {
                    const diff = (date - prevDate) / (1000 * 60 * 60 * 24);
                    if (diff === 1) {
                        currentStreak += 1;
                    } else if (diff > 1) {
                        currentStreak = 1;
                    }
                } else {
                    currentStreak = 1;
                }
                if (currentStreak > maxStreak) maxStreak = currentStreak;
                prevDate = date;
            }
            setMaxStreak(maxStreak);

            // 4. 전체 일기에서 가장 많이 쓴 단어 집계 (상위 3개)
            const allDiaries = diariesSnap.docs.map(doc => doc.data());
            const allText = allDiaries.map(d => d.content || '').join(' ');
            const stopwords = ['그리고', '하지만', '그래서', '나는', '너는', '우리는',
                '이', '그', '저', '것', '수', '등', '때', '더', '또', '좀', '잘', '만', '의', '가',
                '을', '를', '은', '는', '이', '가', '도', '에', '와', '과', '로', '다',
                '에서', '까지', '부터', '처럼', '보다', '하고', '거나', '라도', '마저', '조차',
                '밖에', '만큼', '이나', '이며', '든지', '오늘', '오늘은', '했다', '너무', '갔다', '왔다', '왔어', '왔어요', '왔어요',
                '하루', '하루는', '하루도', '그래', '진짜',
                '나', '내', '나의', '내가', '내게', '내게는', '내게서', '내가서', '내가도', '내가만', '내가뿐', '내가처럼', '내가보다', '내가하고', '내가라도', '내가마저', '내가조차', '내가밖에', '내가만큼', '내가이나', '내가이며', '내가든지',
                '저', '저의', '제가', '저는', '저도', '저만', '저뿐', '저처럼', '저보다', '저하고', '저라도', '저마저', '저조차', '저밖에', '저만큼', '저이나', '저이며', '저든지'];
            const postpositions = [
                '가', '은', '는', '을', '를', '도', '에', '와', '과', '로', '에서', '까지', '부터', '처럼', '보다',
                '하고', '거나', '라도', '마저', '조차', '밖에', '만큼', '이나', '이며', '든지', '다', '요', '서', '죠', '네', '야'
            ];
            let words = allText
                .replace(/[^가-힣a-zA-Z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length >= 2)
                .map(w => {
                    for (const p of postpositions) {
                        if (w.endsWith(p) && w.length > p.length) {
                            return w.slice(0, -p.length);
                        }
                    }
                    return w;
                })
                // 조사/어미 제거 후 불용어 필터링 한 번 더!
                .filter(w => w.length >= 2 && !stopwords.includes(w))
                .filter(w => !(w.endsWith('다') && w.length > 2));
            const freq = {};
            words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
            const top3 = sorted.slice(0, 3).map(([word, count]) => word ? `${word} (${count})` : '-');
            while (top3.length < 3) top3.push('-');
            setTopWords(top3);

            // --- 장르별 집계 추가 ---
            const genres = novelsSnap.docs.map(doc => doc.data().genre).filter(Boolean);
            const genreCount = {};
            genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
            let maxGenre = '-';
            let maxCount = 0;
            Object.entries(genreCount).forEach(([genre, count]) => {
                if (count > maxCount) {
                    maxGenre = genre;
                    maxCount = count;
                }
            });
            setFavoriteGenre(maxGenre);
            setFavoriteGenreCount(maxCount);
            // --- 장르별 집계 끝 ---

            setLoading(false);
        };
        fetchData();
    }, [user]);


    // 가장 많이 제작한 장르의 배너 정보 가져오기
    const favoriteGenreBanner = favoriteGenre !== '-' && genreBannerData[favoriteGenre]
        ? genreBannerData[favoriteGenre]
        : null;

    // 소설을 만들지 않은 경우 emptyroom 이미지와 추천 문구
    const emptyRoomData = {
        src: process.env.PUBLIC_URL + '/novel_banner/emptyroom.png',
        text: '첫 소설로 공간을 채워볼까요?'
    };

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('stats_title')} />
            <div style={{
                maxWidth: 600,
                marginTop: 60,
                marginBottom: 80,
                marginLeft: 'auto',
                marginRight: 'auto',
                padding: 24,
                paddingTop: 40,
                paddingBottom: 100,
                background: isDiaryTheme ? '#faf8f3' : (isGlassTheme ? 'transparent' : 'transparent'),
                color: isDiaryTheme ? '#5C4B37' : 'inherit'
            }}>
                {/* 가장 많이 제작한 장르 이미지 또는 빈 방 이미지 */}
                {!loading && (
                    <FavoriteGenreContainer>
                        <div>
                            {favoriteGenreBanner ? (
                                <>
                                    <FavoriteGenreCard onClick={() => navigate(`/novels/genre/${favoriteGenreBanner.genreKey}`)}>
                                        <img
                                            src={favoriteGenreBanner.src}
                                            alt={t(`novel_genre_${favoriteGenreBanner.genreKey}`)}
                                        />
                                    </FavoriteGenreCard>
                                    <FavoriteGenreText theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
                                        {favoriteGenreBanner.text}
                                    </FavoriteGenreText>
                                </>
                            ) : (
                                <>
                                    <FavoriteGenreCard onClick={() => navigate('/novel')}>
                                        <img
                                            src={emptyRoomData.src}
                                            alt="빈 방"
                                        />
                                    </FavoriteGenreCard>
                                    <FavoriteGenreText theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
                                        {emptyRoomData.text}
                                    </FavoriteGenreText>
                                </>
                            )}
                        </div>
                    </FavoriteGenreContainer>
                )}
                {loading ? (
                    <div style={{ textAlign: 'center', color: isDiaryTheme ? '#8B6F47' : (theme.cardSubText || '#888'), marginTop: 40 }}>{t('loading')}</div>
                ) : (
                    <StatsGrid>
                        {/* 작성한 일기 */}
                        <StatCard theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme} index={0} style={{ gridColumn: 1, gridRow: '1 / 4' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/작성한일기.png'} alt={t('stat_diary_count')} />
                            <StatLabel color={statColors.diary}>{t('stat_diary_count')}</StatLabel>
                            <StatNumber color={statColors.diary}>{diaryCount}</StatNumber>
                        </StatCard>
                        {/* 내 관심사 */}
                        <StatCard theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme} index={1} style={{ gridColumn: 1, gridRow: '4 / 7' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/내관심사.png'} alt={t('stat_interest')} />
                            <StatLabel color={statColors.interest}>{t('stat_interest')}</StatLabel>
                            <Rank1 color={statColors.interest}>🥇 {topWords[0]}</Rank1>
                            <Rank2 color={statColors.interest}>🥈 {topWords[1]}</Rank2>
                            <Rank3 color={statColors.interest}>🥉 {topWords[2]}</Rank3>
                        </StatCard>
                        {/* 연속일수 */}
                        <StatCard theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme} index={2} style={{ gridColumn: 2, gridRow: '1 / 3' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/연속일수.png'} alt={t('stat_streak')} />
                            <StatLabel color={statColors.streak}>{t('stat_streak')}</StatLabel>
                            <StatNumber color={statColors.streak}>{maxStreak}</StatNumber>
                        </StatCard>
                        {/* 완성한 소설 */}
                        <StatCard
                            theme={theme}
                            $isDiaryTheme={isDiaryTheme}
                            $isGlassTheme={isGlassTheme}
                            index={3}
                            style={{ gridColumn: 2, gridRow: '3 / 5', cursor: novelCount > 0 ? 'pointer' : 'default' }}
                            onClick={() => {
                                if (novelCount > 0) {
                                    navigate('/my/completed-novels');
                                }
                            }}
                        >
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/완성된소설.png'} alt={t('stat_novel_count')} />
                            <StatLabel color={statColors.novel}>{t('stat_novel_count')}</StatLabel>
                            <StatNumber color={statColors.novel}>{novelCount}</StatNumber>
                        </StatCard>
                        {/* 최애 장르 */}
                        <StatCard theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme} index={4} style={{ gridColumn: 2, gridRow: '5 / 7' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/최애장르.png'} alt={t('stat_favorite_genre')} />
                            <StatLabel color={statColors.genre}>{t('stat_favorite_genre')}</StatLabel>
                            <StatNumberSmall color={statColors.genre}>{favoriteGenre !== '-' ? `${favoriteGenre} (${favoriteGenreCount}${t('unit_count') || '편'})` : t('no_data') || '데이터 없음'}</StatNumberSmall>
                        </StatCard>
                    </StatsGrid>
                )}

            </div>
            <Navigation />
        </>
    );
}

export default Statistics; 