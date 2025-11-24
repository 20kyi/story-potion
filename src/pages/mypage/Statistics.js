import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, orderBy } from 'firebase/firestore';
import { useTranslation } from '../../LanguageContext';
import { createNovelUrl } from '../../utils/novelUtils';
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
  background: ${({ theme }) => theme.card};
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 24px 12px 18px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
  min-height: 100px;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  background-clip: padding-box;

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.13);
    transform: translateY(-2px);
  }
`;
const StatImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-bottom: 12px;
`;
const StatLabel = styled.div`
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 1.08rem;
  color: ${({ color }) => color || '#333'};
  text-align: center;
`;
const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ color }) => color || '#222'};
  margin-bottom: 2px;
  text-align: center;
`;
const Rank1 = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 2px;
  color: #e462a0;
`;
const Rank2 = styled.div`
  font-size: 0.98rem;
  font-weight: 600;
  margin-bottom: 2px;
  color: #e462a0;
`;
const Rank3 = styled.div`
  font-size: 0.95rem;
  font-weight: 500;
  color: #e462a0;
`;

// 아래에만 적용되는 StatNumberSmall 추가
const StatNumberSmall = styled(StatNumber)`
  font-size: 1.1rem;
`;

const NovelListModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const NovelListModalContent = styled.div`
  background-color: ${({ theme }) => theme.card || 'white'};
  padding: 24px;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 10px 16px;
  border: 1px solid ${({ theme }) => theme.border || '#ddd'};
  border-radius: 8px;
  background: ${({ theme }) => theme.card || '#fff'};
  color: ${({ theme }) => theme.text || '#333'};
  font-size: 14px;
  cursor: pointer;
  flex: 1;
  min-width: 120px;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary || '#cb6565'};
  }
`;

const NovelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
  width: 100%;
`;

const NovelItem = styled.div`
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  &:hover {
    transform: translateY(-4px);
  }
`;

const NovelCover = styled.img`
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 8px;
  display: block;
  min-width: 0;
`;

const NovelTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#333'};
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

const NovelMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.cardSubText || '#666'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const PurchaseBadge = styled.span`
  background: ${({ theme }) => theme.primary || '#cb6565'};
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.cardSubText || '#999'};
  font-size: 16px;
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
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.text || '#333'};
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
        text: '시간을 여행하는는 고전 감성러'
    },
    '동화': {
        genreKey: 'fairytale',
        src: process.env.PUBLIC_URL + '/novel_banner/fairytale.png',
        text: '동화를 꿈꾸는 이야기꾼'
    },
    '판타지': {
        genreKey: 'fantasy',
        src: process.env.PUBLIC_URL + '/novel_banner/fantasy.png',
        text: '새로운 세계를 창조하는 모험가'
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
    const [diaryCount, setDiaryCount] = useState(0);
    const [novelCount, setNovelCount] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [topWords, setTopWords] = useState(['-', '-', '-']);
    const [loading, setLoading] = useState(true);
    const [favoriteGenre, setFavoriteGenre] = useState('-');
    const [favoriteGenreCount, setFavoriteGenreCount] = useState(0);
    const [showNovelList, setShowNovelList] = useState(false);
    const [novels, setNovels] = useState([]);
    const [filteredNovels, setFilteredNovels] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'popular'
    const [novelsLoading, setNovelsLoading] = useState(false);

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

    // 완성된 소설 목록 가져오기
    useEffect(() => {
        if (!user || !showNovelList) return;

        const fetchNovels = async () => {
            setNovelsLoading(true);
            try {
                const novelsRef = collection(db, 'novels');
                const novelsQ = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
                const novelsSnap = await getDocs(novelsQ);
                const fetchedNovels = novelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // 구매자 수 조회 (최적화: 모든 사용자의 viewedNovels를 한 번에 조회)
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);
                const purchaseCountMap = {};

                // 각 사용자의 viewedNovels를 조회하여 구매자 수 집계
                const countPromises = usersSnapshot.docs.map(async (userDoc) => {
                    try {
                        const viewedNovelsRef = collection(db, 'users', userDoc.id, 'viewedNovels');
                        const viewedSnap = await getDocs(viewedNovelsRef);
                        viewedSnap.docs.forEach(viewedDoc => {
                            const novelId = viewedDoc.id;
                            purchaseCountMap[novelId] = (purchaseCountMap[novelId] || 0) + 1;
                        });
                    } catch (error) {
                        // 개별 사용자 조회 실패는 무시
                    }
                });

                await Promise.all(countPromises);

                // 소설에 구매자 수 추가
                const novelsWithPurchaseCount = fetchedNovels.map(novel => ({
                    ...novel,
                    purchaseCount: purchaseCountMap[novel.id] || 0
                }));

                setNovels(novelsWithPurchaseCount);
            } catch (error) {
                console.error('소설 목록 가져오기 실패:', error);
                setNovels([]);
            } finally {
                setNovelsLoading(false);
            }
        };

        fetchNovels();
    }, [user, showNovelList]);

    // 필터링 및 정렬
    useEffect(() => {
        let filtered = [...novels];

        // 장르 필터
        if (selectedGenre !== 'all') {
            filtered = filtered.filter(novel => novel.genre === selectedGenre);
        }

        // 정렬
        if (sortBy === 'latest') {
            filtered.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateB - dateA;
            });
        } else if (sortBy === 'oldest') {
            filtered.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateA - dateB;
            });
        } else if (sortBy === 'popular') {
            filtered.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
        }

        setFilteredNovels(filtered);
    }, [novels, selectedGenre, sortBy]);

    // 사용 가능한 장르 목록
    const availableGenres = ['all', ...new Set(novels.map(n => n.genre).filter(Boolean))];

    const getGenreKey = (genre) => {
        const genreMap = {
            '로맨스': 'romance',
            '추리': 'mystery',
            '역사': 'historical',
            '동화': 'fairytale',
            '판타지': 'fantasy',
            '공포': 'horror'
        };
        return genreMap[genre] || null;
    };

    // 가장 많이 제작한 장르의 배너 정보 가져오기
    const favoriteGenreBanner = favoriteGenre !== '-' && genreBannerData[favoriteGenre]
        ? genreBannerData[favoriteGenre]
        : null;

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('stats_title')} />
            <div style={{ maxWidth: 600, margin: '60px auto', marginTop: 50, padding: 24, paddingTop: 40, paddingBottom: 100 }}>
                {/* 가장 많이 제작한 장르 이미지 */}
                {!loading && favoriteGenreBanner && (
                    <FavoriteGenreContainer>
                        <div>
                            <FavoriteGenreCard onClick={() => navigate(`/novels/genre/${favoriteGenreBanner.genreKey}`)}>
                                <img
                                    src={favoriteGenreBanner.src}
                                    alt={t(`novel_genre_${favoriteGenreBanner.genreKey}`)}
                                />
                            </FavoriteGenreCard>
                            <FavoriteGenreText>
                                {favoriteGenreBanner.text}
                            </FavoriteGenreText>
                        </div>
                    </FavoriteGenreContainer>
                )}
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>{t('loading')}</div>
                ) : (
                    <StatsGrid>
                        {/* 작성한 일기 */}
                        <StatCard style={{ gridColumn: 1, gridRow: '1 / 4' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/작성된일기.png'} alt={t('stat_diary_count')} />
                            <StatLabel color="#ff8800">{t('stat_diary_count')}</StatLabel>
                            <StatNumber color="#e46262">{diaryCount}</StatNumber>
                        </StatCard>
                        {/* 완성된 소설 */}
                        <StatCard style={{ gridColumn: 1, gridRow: '4 / 7' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/내관심사.png'} alt={t('stat_interest')} />
                            <StatLabel color="#e462a0">{t('stat_interest')}</StatLabel>
                            <Rank1>1위: {topWords[0]}</Rank1>
                            <Rank2>2위: {topWords[1]}</Rank2>
                            <Rank3>3위: {topWords[2]}</Rank3>
                        </StatCard>
                        {/* 연속일수 */}
                        <StatCard style={{ gridColumn: 2, gridRow: '1 / 3' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/연속일수.png'} alt={t('stat_streak')} />
                            <StatLabel color="#a259d9">{t('stat_streak')}</StatLabel>
                            <StatNumber color="#a259d9">{maxStreak}</StatNumber>
                        </StatCard>
                        {/* 내 관심사 */}
                        <StatCard
                            style={{ gridColumn: 2, gridRow: '3 / 5', cursor: novelCount > 0 ? 'pointer' : 'default' }}
                            onClick={() => {
                                if (novelCount > 0) {
                                    setShowNovelList(true);
                                }
                            }}
                        >
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/완성된소설.png'} alt={t('stat_novel_count')} />
                            <StatLabel color="#1abc3b">{t('stat_novel_count')}</StatLabel>
                            <StatNumber color="#1abc3b">{novelCount}</StatNumber>
                        </StatCard>
                        {/* Total Potion -> 가장 많이 쓴 소설 장르*/}
                        <StatCard style={{ gridColumn: 2, gridRow: '5 / 7' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/토탈포션.png'} alt={t('stat_favorite_genre')} />
                            <StatLabel color="#3498f3">{t('stat_favorite_genre')}</StatLabel>
                            <StatNumberSmall color="#3498f3">{favoriteGenre !== '-' ? `${favoriteGenre} (${favoriteGenreCount}${t('unit_count') || '편'})` : t('no_data') || '데이터 없음'}</StatNumberSmall>
                        </StatCard>
                    </StatsGrid>
                )}

                {/* 완성된 소설 목록 모달 */}
                {showNovelList && (
                    <NovelListModal onClick={() => setShowNovelList(false)}>
                        <NovelListModalContent onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ color: '#cb6565', margin: 0, fontSize: 20 }}>완성된 소설</h3>
                                <button
                                    onClick={() => setShowNovelList(false)}
                                    style={{ background: 'none', border: 'none', color: '#cb6565', fontSize: 24, cursor: 'pointer', padding: 8 }}
                                >
                                    ×
                                </button>
                            </div>

                            <FilterContainer>
                                <Select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
                                    <option value="all">전체 장르</option>
                                    {availableGenres.filter(g => g !== 'all').map(genre => (
                                        <option key={genre} value={genre}>
                                            {getGenreKey(genre) ? t(`novel_genre_${getGenreKey(genre)}`) : genre}
                                        </option>
                                    ))}
                                </Select>
                                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="latest">최신순</option>
                                    <option value="oldest">오래된순</option>
                                    <option value="popular">인기순</option>
                                </Select>
                            </FilterContainer>

                            {novelsLoading ? (
                                <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>{t('loading')}</div>
                            ) : filteredNovels.length === 0 ? (
                                <EmptyMessage>완성된 소설이 없습니다.</EmptyMessage>
                            ) : (
                                <NovelGrid>
                                    {filteredNovels.map((novel) => {
                                        const genreKey = getGenreKey(novel.genre);
                                        return (
                                            <NovelItem
                                                key={novel.id}
                                                onClick={() => {
                                                    navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre)}`);
                                                    setShowNovelList(false);
                                                }}
                                            >
                                                <NovelCover src={novel.imageUrl || '/novel_banner/default.png'} alt={novel.title} />
                                                <NovelTitle>{novel.title}</NovelTitle>
                                                <NovelMeta>
                                                    <span>{genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}</span>
                                                    {novel.purchaseCount > 0 && (
                                                        <PurchaseBadge>{novel.purchaseCount}</PurchaseBadge>
                                                    )}
                                                </NovelMeta>
                                            </NovelItem>
                                        );
                                    })}
                                </NovelGrid>
                            )}
                        </NovelListModalContent>
                    </NovelListModal>
                )}
            </div>
            <Navigation />
        </>
    );
}

export default Statistics; 