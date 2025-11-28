import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import styled from 'styled-components';
import Header from '../../components/Header';
import { useTheme } from '../../ThemeContext';
import { useLanguage, useTranslation } from '../../LanguageContext';

import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

import { getWeeklyDiaryStatus } from '../../utils/weeklyBonus';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
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
  gap: 12px;
`;

const MonthSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MonthText = styled.span`
  font-size: 20px;
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
  &:hover {
    background-color: rgba(223, 150, 150, 0.1);
  }
`;

const TodayButton = styled.button`
  background: transparent;
  border: 1.5px solid #e46262;
  color: #e46262;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 90px;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 36px;
  margin: 0 8px;
  &:hover {
    background: rgba(228, 98, 98, 0.1);
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.95);
  }
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
  position: absolute;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-2deg);
  width: 42px;
  height: 20px;
  background: rgba(255, 235, 59, 0.6);
  border-radius: 8px 10px 9px 8px;
  z-index: 1;
  box-shadow: 
    0 1px 3px rgba(255, 193, 7, 0.2),
    inset 0 0 8px rgba(255, 235, 59, 0.3);
  
  /* 손으로 칠한 듯한 불규칙한 느낌 */
  clip-path: polygon(
    5% 10%,
    15% 5%,
    35% 0%,
    55% 2%,
    75% 0%,
    90% 5%,
    95% 15%,
    98% 35%,
    100% 55%,
    98% 75%,
    95% 90%,
    85% 95%,
    65% 98%,
    45% 100%,
    25% 98%,
    10% 95%,
    2% 85%,
    0% 65%,
    2% 45%,
    3% 25%
  );
`;

const ImageContainer = styled.div`
  margin-top: 2px;
  line-height: 1;
  min-height: 32px;
  min-width: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const DisplayImage = styled.img`
  width: 32px;
  height: 32px;
  margin-bottom: 2px;
  border-radius: ${props => props.$isSticker ? '0' : '50%'};
  object-fit: cover;
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
  font-size: 14px;
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
    const location = useLocation();
    const theme = useTheme();
    const { language } = useLanguage();
    const { t } = useTranslation();
    // location.state에서 달 정보를 받아오거나, 없으면 현재 달 사용
    const initialDate = location.state?.targetDate ? new Date(location.state.targetDate) : new Date();
    const [currentDate, setCurrentDate] = useState(initialDate);
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

    // location.state가 변경되면 currentDate 업데이트
    useEffect(() => {
        if (location.state?.targetDate) {
            const targetDate = new Date(location.state.targetDate);
            setCurrentDate(targetDate);
        }
    }, [location.state]);

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
        // 언어에 따라 월 텍스트 포맷
        if (language === 'en') {
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        }
        return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
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

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const getTodayDate = () => {
        return new Date().getDate();
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

    // 감정별 라벨 (언어별)
    const emotionBarLabels = {
        love: t('emotion_love'),
        good: t('emotion_good'),
        normal: t('emotion_normal'),
        surprised: t('emotion_surprised'),
        angry: t('emotion_angry'),
        cry: t('emotion_cry'),
        empty: t('no_data')
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

    // 상단 문구 (이번 달 감정 요약 - 감정별 다른 멘트)
    const getTopMessage = () => {
        // 언어별로 월 표시
        const monthLabel = language === 'en'
            ? currentDate.toLocaleDateString('en-US', { month: 'long' })
            : `${currentDate.getMonth() + 1}`;

        // 현재 달의 일기가 있는지 확인
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const hasDiaryInMonth = diaries.some(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate.getFullYear() === year && diaryDate.getMonth() === month;
        });

        // 일기를 전혀 작성하지 않은 달인 경우
        if (!hasDiaryInMonth) {
            return t('diary_emotion_top_no_diary', { month: monthLabel });
        }

        const { percent } = getEmotionBarData();
        const emotionEntries = Object.entries(percent)
            .filter(([k]) => k !== 'empty')
            .sort((a, b) => b[1] - a[1]);
        const mainEmotion = emotionEntries.length > 0 ? emotionEntries[0][0] : 'empty';

        const keyMap = {
            love: 'diary_emotion_top_love',
            good: 'diary_emotion_top_good',
            normal: 'diary_emotion_top_normal',
            surprised: 'diary_emotion_top_surprised',
            angry: 'diary_emotion_top_angry',
            cry: 'diary_emotion_top_cry',
            empty: 'diary_emotion_top_empty'
        };

        const key = keyMap[mainEmotion] || keyMap.empty;
        return t(key, { month: monthLabel });
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

            // 우선순위: 사진 > 스티커 > 감정 이모티콘 > 날씨 이모티콘
            let displayImg = null;
            let isSticker = false;
            if (diary) {
                if (diary.imageUrls && diary.imageUrls.length > 0) {
                    // 사진이 있으면 첫 번째 사진 표시
                    displayImg = diary.imageUrls[0];
                } else if (diary.stickers && diary.stickers.length > 0) {
                    // 사진이 없으면 첫 번째 스티커 표시
                    displayImg = diary.stickers[0].src;
                    isSticker = true;
                } else if (diary.emotion) {
                    // 스티커도 없으면 감정 이모티콘 표시
                    displayImg = emotionImageMap[diary.emotion];
                } else if (diary.weather) {
                    // 감정 이모티콘도 없으면 날씨 이모티콘 표시
                    displayImg = weatherImageMap[diary.weather];
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
                        <span style={{
                            color: document.body.classList.contains('dark') ? '#fff' : '#000',
                            position: 'relative',
                            zIndex: isToday ? 2 : 1
                        }}>{day}</span>
                        {isToday && <TodayCircle />}
                        {/* 스티커 또는 감정 이미지, 없으면 빈 공간 */}
                        <ImageContainer>
                            {displayImg && <DisplayImage src={displayImg} alt="대표 이미지" $isSticker={isSticker} />}
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
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('diary_title')} />
            <Content>
                <CalendarHeader>
                    <MonthSection>
                        <MonthButton onClick={handlePrevMonth}>&lt;</MonthButton>
                        <MonthText>{formatMonth(currentDate)}</MonthText>
                        <MonthButton onClick={handleNextMonth}>&gt;</MonthButton>
                    </MonthSection>
                    <TodayButton onClick={handleToday}>{getTodayDate()}</TodayButton>
                </CalendarHeader>
                <Calendar>
                    <thead>
                        <tr>
                            {(language === 'en'
                                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                                : ['일', '월', '화', '수', '목', '금', '토']
                            ).map(day => (
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
                                <PreviewDiaryImage src={previewDiary.imageUrls[0]} alt="diary" />
                            )}
                            <PreviewTitle>{previewDiary.title}</PreviewTitle>
                            <PreviewDate>{previewDiary.date}</PreviewDate>
                            <PreviewCloseButton onClick={() => setPreviewDiary(null)}>{t('close')}</PreviewCloseButton>
                        </PreviewPopup>
                    );
                })()}
            </Content>
            <Navigation />
        </Container>
    );
}

export default Diary; 