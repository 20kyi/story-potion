import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import styled from 'styled-components';
import Header from '../../components/Header';
import { useTheme } from '../../ThemeContext';

import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

import { getWeeklyDiaryStatus } from '../../utils/weeklyBonus';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin: 60px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const MonthText = styled.span`
  font-size: 24px;
  color: #e46262;
  font-weight: 500;
`;

const MonthButton = styled.button`
  background: none;
  border: none;
  color: #df9696;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
`;

const Calendar = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const DayHeader = styled.th`
  padding: 10px;
  padding-bottom: 20px;
  text-align: center;
  color: #888;
  font-size: 16px;
  font-weight: 500;
`;

const DateCell = styled.td`
  padding: 0;
  text-align: center;
  position: relative;
  height: 90px;
  width: 45px;
`;

const DateButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background: none;
  cursor: pointer;
  position: relative;
  color: #000;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  font-size: 14px;
  
  &.today {
    color: #fff;
    position: relative;
    z-index: 1;
  }
  
  &.future {
    color: #ccc;
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  &.prev-month {
    color: #ccc;
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const TodayCircle = styled.div`
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e46262;
  z-index: -1;
`;

const ImageContainer = styled.div`
  margin-top: 2px;
  line-height: 1;
  min-height: 28px;
  min-width: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const DisplayImage = styled.img`
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
`;

const EmotionStatsContainer = styled.div`
  margin: 32px 0 20px 0;
  width: 100%;
  max-width: 540px;
  min-height: 40px;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
`;

const TopMessage = styled.div`
  text-align: center;
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 18px;
  color: #7c6f6f;
  letter-spacing: -1px;
  font-family: inherit;
`;

const EmotionBar = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 38px;
  border-radius: 22px;
  overflow: hidden;
  background: #f6f6f6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
`;

const EmotionSegment = styled.div`
  flex: ${props => props.value} 0 0;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-top-left-radius: ${props => props.isFirst ? '22px' : '0'};
  border-bottom-left-radius: ${props => props.isFirst ? '22px' : '0'};
  border-top-right-radius: ${props => props.isLast ? '22px' : '0'};
  border-bottom-right-radius: ${props => props.isLast ? '22px' : '0'};
`;

const EmotionIcon = styled.img`
  width: 28px;
  height: 28px;
  opacity: 0.85;
`;

const PercentContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: 8px;
`;

const PercentItem = styled.div`
  flex: ${props => props.value} 0 0;
  text-align: center;
  color: ${props => props.color};
  font-weight: 600;
  font-size: 17px;
  opacity: 0.6;
`;

const PreviewPopup = styled.div`
  position: fixed;
  left: ${props => props.left}px;
  top: ${props => props.top}px;
  z-index: 2000;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
  padding: 16px;
  min-width: 180px;
  max-width: 260px;
  font-size: 13px;
  width: ${props => props.width}px;
  max-height: ${props => props.height}px;
  overflow: auto;
  transform: none;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
`;

const PreviewImage = styled.img`
  width: 28px;
  height: 28px;
`;

const PreviewDiaryImage = styled.img`
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const PreviewTitle = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 15px;
`;

const PreviewDate = styled.div`
  font-weight: 500;
  color: #888;
  font-size: 12px;
  margin-bottom: 4px;
`;

const PreviewCloseButton = styled.button`
  margin-top: 6px;
  font-size: 13px;
  color: #e46262;
  background: none;
  border: none;
  cursor: pointer;
`;


function Diary({ user }) {
    const navigate = useNavigate();
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [diaries, setDiaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewDiary, setPreviewDiary] = useState(null);
    const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });

    const [longPressTimer, setLongPressTimer] = useState(null);
    // --- 추가: 주간 일기 현황 state ---
    const [weeklyDiaryStatus, setWeeklyDiaryStatus] = useState({
        weekStatus: [],
        totalWritten: 0,
        totalDays: 7
    });

    useEffect(() => {
        if (!user) return;

        const fetchDiaries = async () => {
            setIsLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            const diariesRef = collection(db, 'diaries');
            const q = query(diariesRef,
                where('userId', '==', user.uid),
                where('date', '>=', formatDateToString(firstDay)),
                where('date', '<=', formatDateToString(lastDay)),
                orderBy('date')
            );

            try {
                const querySnapshot = await getDocs(q);
                const fetchedDiaries = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                setDiaries(fetchedDiaries);
            } catch (error) {
                // 삭제된 코드: console.error("Error fetching diaries: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDiaries();
        // --- 추가: 주간 일기 현황 조회 ---
        const fetchWeeklyStatus = async () => {
            try {
                const status = await getWeeklyDiaryStatus(user.uid, new Date());
                setWeeklyDiaryStatus(status);
            } catch (error) {
                // console.error('주간 일기 현황 조회 실패:', error);
            }
        };
        fetchWeeklyStatus();
    }, [user, currentDate]);



    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const getLastDayOfPrevMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    };

    const formatMonth = (date) => {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
    };

    const formatDateToString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const hasDiaryOnDate = (date) => {
        const dateString = formatDateToString(date);
        return diaries.some(diary => diary.date.startsWith(dateString));
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDateClick = (clickedDate) => {
        if (isFutureDate(clickedDate)) return;
        const dateString = formatDateToString(clickedDate);
        const existingDiary = diaries.find(diary => diary.date.startsWith(dateString));

        if (existingDiary) {
            navigate(`/diary/date/${dateString}`);
        } else {
            navigate(`/write?date=${dateString}`);
        }
    };

    const isFutureDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    };

    // 감정/날씨 이미지 매핑 추가
    const weatherImageMap = {
        sunny: '/weather/sunny.png',
        cloudy: '/weather/cloudy.png',
        rainy: '/weather/rainy.png',
        snowy: '/weather/snowy.png',
        windy: '/weather/windy.png',
        thunder: '/weather/thunder.png',
    };
    const emotionImageMap = {
        love: '/emotions/love.png',
        good: '/emotions/good.png',
        normal: '/emotions/normal.png',
        surprised: '/emotions/surprised.png',
        angry: '/emotions/angry.png',
        cry: '/emotions/cry.png',
    };

    // 감정별 색상 매핑
    const emotionBarColors = {
        love: '#ffb3de',      // 연분홍
        good: '#ffe156',      // 노랑
        normal: '#b2f2bb',    // 연녹
        surprised: '#a5d8ff', // 하늘
        angry: '#ff8787',     // 연빨강
        cry: '#b5b5c3',       // 연보라
        empty: '#e0e0e0'      // 회색(미작성)
    };

    // 감정별 한글명 및 이모티콘 경로 매핑
    const emotionBarLabels = {
        love: '사랑',
        good: '기쁨',
        normal: '평온',
        surprised: '놀람',
        angry: '화남',
        cry: '슬픔',
        empty: '미작성'
    };
    const emotionBarIcons = {
        love: '/emotions/love.png',
        good: '/emotions/good.png',
        normal: '/emotions/normal.png',
        surprised: '/emotions/surprised.png',
        angry: '/emotions/angry.png',
        cry: '/emotions/cry.png',
        empty: null
    };

    // 감정별 맞춤형 상단 문구 매핑
    const emotionTopMessages = {
        love: (month) => `${month}월, 사랑이 가득한 한 달이었어요`,
        good: (month) => `${month}월, 기쁨이 많았네요! 앞으로도 좋은 일만 가득하길`,
        normal: (month) => `${month}월, 평온한 하루하루가 이어졌어요`,
        surprised: (month) => `${month}월, 놀라움이 많았던 한 달이었네요!`,
        angry: (month) => `${month}월, 화남이 많았어요. 내 마음을 토닥여주세요`,
        cry: (month) => `${month}월, 슬픔이 많았군요. 힘든 순간도 곧 지나갈 거예요`,
        empty: (month) => `${month}월의 마음은 비어있어요`
    };

    // 상단 문구 자동 생성 (감정별 맞춤)
    const getTopMessage = () => {
        const { percent } = getEmotionBarData();
        const emotionEntries = Object.entries(percent)
            .filter(([k]) => k !== 'empty')
            .sort((a, b) => b[1] - a[1]);
        const mainEmotion = emotionEntries.length > 0 ? emotionEntries[0][0] : null;
        const month = currentDate.getMonth() + 1;
        if (!mainEmotion || percent[mainEmotion] === 0) return emotionTopMessages.empty(month);
        return emotionTopMessages[mainEmotion](month);
    };



    // 달력 날짜 롱프레스 핸들러
    const handleDateLongPressStart = (date, event) => {
        if (isFutureDate(date)) return;
        const touch = event.touches && event.touches[0];
        const x = touch ? touch.clientX : 0;
        const y = touch ? touch.clientY : 0;
        const timer = setTimeout(() => {
            const dateString = formatDateToString(date);
            const diary = diaries.find(d => d.date.startsWith(dateString));
            if (diary) {
                setPreviewDiary(diary);
                setPreviewPosition({ x, y });
            }
        }, 500); // 500ms 이상 누르면 미리보기
        setLongPressTimer(timer);
    };
    const handleDateLongPressEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
        setPreviewDiary(null); // 손을 떼면 미리보기 닫기
    };

    // 이번 달 감정 비율 데이터 계산
    const getEmotionBarData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const counts = { love: 0, good: 0, normal: 0, surprised: 0, angry: 0, cry: 0, empty: 0 };
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = formatDateToString(date);
            const diary = diaries.find(d => d.date.startsWith(dateString));
            if (diary && diary.emotion) {
                counts[diary.emotion]++;
            } else {
                counts.empty++;
            }
        }
        const total = daysInMonth;
        // total이 0이거나 undefined일 때를 방지
        const percent = Object.fromEntries(
            Object.entries(counts).map(([k, v]) => [
                k,
                total > 0 ? Math.round((v / total) * 100) : 0
            ])
        );
        return { counts, percent, total };
    };
    const emotionBarData = getEmotionBarData();

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const today = new Date();

        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const lastDayPrevMonth = getLastDayOfPrevMonth(currentDate);

        const weeks = [];
        let days = [];

        for (let i = 0; i < firstDay; i++) {
            const prevMonthDay = lastDayPrevMonth - firstDay + i + 1;
            const date = new Date(year, month - 1, prevMonthDay);

            days.push(
                <DateCell key={`prev-${prevMonthDay}`}>
                    <DateButton
                        className="prev-month"
                        onClick={() => handleDateClick(date)}
                        disabled
                    >
                        <span style={{ color: '#ccc' }}>{prevMonthDay}</span>
                    </DateButton>
                </DateCell>
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year;
            const future = isFutureDate(date);

            const diary = hasDiaryOnDate(date) ? diaries.find(d => d.date.startsWith(formatDateToString(date))) : null;

            // 스티커가 있으면 첫 번째 스티커를, 없으면 감정 이모티콘을 표시
            let displayImg = null;
            if (diary) {
                if (diary.stickers && diary.stickers.length > 0) {
                    // 첫 번째 스티커를 대표 이미지로 사용
                    displayImg = diary.stickers[0].src;
                } else if (diary.emotion) {
                    // 스티커가 없으면 감정 이모티콘 사용
                    displayImg = emotionImageMap[diary.emotion];
                }
            }

            days.push(
                <DateCell key={`current-${day}`}>
                    <DateButton
                        className={`${isToday ? 'today' : ''} ${future ? 'future' : ''}`}
                        onClick={() => !future && handleDateClick(date)}
                        disabled={future}
                        onTouchStart={e => handleDateLongPressStart(date, e)}
                        onTouchEnd={handleDateLongPressEnd}
                        onTouchCancel={handleDateLongPressEnd}
                    >
                        <span style={{ color: document.body.classList.contains('dark') ? '#fff' : '#000' }}>{day}</span>
                        {isToday && <TodayCircle />}
                        {/* 스티커 또는 감정 이미지, 없으면 빈 공간 */}
                        <ImageContainer>
                            {displayImg && <DisplayImage src={displayImg} alt="대표 이미지" />}
                        </ImageContainer>
                    </DateButton>
                </DateCell>
            );

            if (days.length === 7) {
                weeks.push(<tr key={`week-${weeks.length}`}>{days}</tr>);
                days = [];
            }
        }

        let nextMonthDay = 1;
        while (days.length < 7) {
            const date = new Date(year, month + 1, nextMonthDay);

            days.push(
                <DateCell key={`next-${nextMonthDay}`}>
                    <DateButton
                        className="prev-month"
                        onClick={() => handleDateClick(date)}
                        disabled
                    >
                        <span style={{ color: '#ccc' }}>{nextMonthDay}</span>
                    </DateButton>
                </DateCell>
            );
            nextMonthDay++;
        }

        if (days.length > 0) {
            weeks.push(<tr key={`week-${weeks.length}`}>{days}</tr>);
        }

        return weeks;
    };

    return (
        <Container>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="일기" />
            <Content>
                <CalendarHeader>
                    <MonthButton onClick={handlePrevMonth}>&lt;</MonthButton>
                    <MonthText>{formatMonth(currentDate)}</MonthText>
                    <MonthButton onClick={handleNextMonth}>&gt;</MonthButton>
                </CalendarHeader>
                <Calendar>
                    <thead>
                        <tr>
                            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                                <DayHeader key={day}>{day}</DayHeader>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderCalendar()}
                    </tbody>
                </Calendar>

                {/* 감정 비율 막대(커스텀) */}
                <EmotionStatsContainer>
                    {/* 상단 문구 */}
                    <TopMessage>
                        {getTopMessage()}
                    </TopMessage>
                    {/* 막대 */}
                    <EmotionBar>
                        {Object.entries(emotionBarData.percent).map(([emotion, value], idx, arr) => {
                            if (isNaN(value) || value === 0) return null; // 0%는 렌더링하지 않음
                            const emotionKeys = Object.keys(emotionBarData.percent).filter(
                                key => !isNaN(emotionBarData.percent[key]) && emotionBarData.percent[key] > 0
                            );
                            const isFirst = emotion === emotionKeys[0];
                            const isLast = emotion === emotionKeys[emotionKeys.length - 1];
                            return (
                                <EmotionSegment
                                    key={emotion}
                                    value={value}
                                    color={emotionBarColors[emotion]}
                                    isFirst={isFirst}
                                    isLast={isLast}
                                >
                                    {emotion !== 'empty' && value >= 10 && (
                                        <EmotionIcon src={emotionBarIcons[emotion]} alt={emotionBarLabels[emotion]} />
                                    )}
                                </EmotionSegment>
                            );
                        })}
                    </EmotionBar>
                    {/* 퍼센트/개수 */}
                    <PercentContainer>
                        {Object.entries(emotionBarData.percent).map(([emotion, value]) => {
                            if (isNaN(value) || value === 0) return null;
                            return (
                                <PercentItem
                                    key={emotion}
                                    value={value}
                                    color={emotionBarColors[emotion]}
                                >
                                    {value}%
                                </PercentItem>
                            );
                        })}
                    </PercentContainer>
                </EmotionStatsContainer>
                {/* 미리보기 팝업은 달력 아래에 그대로 유지 */}
                {previewDiary && (() => {
                    const popupWidth = 260, popupHeight = 220;
                    let left = previewPosition.x, top = previewPosition.y;
                    if (left + popupWidth > window.innerWidth) left = window.innerWidth - popupWidth - 8;
                    if (left < 8) left = 8;
                    if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 8;
                    if (top < 8) top = 8;
                    return (
                        <PreviewPopup
                            left={left}
                            top={top}
                            width={popupWidth}
                            height={popupHeight}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 감정/날씨 이모티콘 */}
                            <PreviewHeader>
                                {previewDiary.emotion && emotionImageMap[previewDiary.emotion] && (
                                    <PreviewImage src={emotionImageMap[previewDiary.emotion]} alt="감정" />
                                )}
                                {previewDiary.weather && weatherImageMap[previewDiary.weather] && (
                                    <PreviewImage src={weatherImageMap[previewDiary.weather]} alt="날씨" />
                                )}
                            </PreviewHeader>
                            {previewDiary.imageUrls && previewDiary.imageUrls.length > 0 && (
                                <PreviewDiaryImage src={previewDiary.imageUrls[0]} alt="일기 이미지" />
                            )}
                            <PreviewTitle>{previewDiary.title}</PreviewTitle>
                            <PreviewDate>{previewDiary.date}</PreviewDate>
                            <PreviewCloseButton onClick={() => setPreviewDiary(null)}>닫기</PreviewCloseButton>
                        </PreviewPopup>
                    );
                })()}
            </Content>
            <Navigation />
        </Container>
    );
}

export default Diary; 