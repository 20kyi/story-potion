import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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

function Statistics({ user }) {
    const navigate = useNavigate();
    const [diaryCount, setDiaryCount] = useState(0);
    const [novelCount, setNovelCount] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [topWords, setTopWords] = useState(['-', '-', '-']);
    const [loading, setLoading] = useState(true);
    const [favoriteGenre, setFavoriteGenre] = useState('-');
    const [favoriteGenreCount, setFavoriteGenreCount] = useState(0);

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

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="내 통계" />
            <div style={{ maxWidth: 600, margin: '60px auto', marginTop: 50, padding: 24, paddingTop: 40, paddingBottom: 20 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>로딩 중...</div>
                ) : (
                    <StatsGrid>
                        {/* 작성한 일기 */}
                        <StatCard style={{ gridColumn: 1, gridRow: '1 / 4' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/작성된일기.png'} alt="작성된 일기" />
                            <StatLabel color="#ff8800">작성한 일기</StatLabel>
                            <StatNumber color="#e46262">{diaryCount}</StatNumber>
                        </StatCard>
                        {/* 완성된 소설 */}
                        <StatCard style={{ gridColumn: 1, gridRow: '4 / 7' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/내관심사.png'} alt="내 관심사" />
                            <StatLabel color="#e462a0">내 관심사</StatLabel>
                            <Rank1>1위: {topWords[0]}</Rank1>
                            <Rank2>2위: {topWords[1]}</Rank2>
                            <Rank3>3위: {topWords[2]}</Rank3>
                        </StatCard>
                        {/* 연속일수 */}
                        <StatCard style={{ gridColumn: 2, gridRow: '1 / 3' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/연속일수.png'} alt="연속일수" />
                            <StatLabel color="#a259d9">연속일수</StatLabel>
                            <StatNumber color="#a259d9">{maxStreak}</StatNumber>
                        </StatCard>
                        {/* 내 관심사 */}
                        <StatCard style={{ gridColumn: 2, gridRow: '3 / 5' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/완성된소설.png'} alt="완성된 소설" />
                            <StatLabel color="#1abc3b">완성된 소설</StatLabel>
                            <StatNumber color="#1abc3b">{novelCount}</StatNumber>

                        </StatCard>
                        {/* Total Potion -> 가장 많이 쓴 소설 장르*/}
                        <StatCard style={{ gridColumn: 2, gridRow: '5 / 7' }}>
                            <StatImage src={process.env.PUBLIC_URL + '/my_stats/토탈포션.png'} alt="가장 많이 쓴 소설 장르" />
                            <StatLabel color="#3498f3">최애 장르</StatLabel>
                            <StatNumberSmall color="#3498f3">{favoriteGenre !== '-' ? `${favoriteGenre} (${favoriteGenreCount}편)` : '데이터 없음'}</StatNumberSmall>
                        </StatCard>
                    </StatsGrid>
                )}
            </div >
        </>
    );
}

export default Statistics; 