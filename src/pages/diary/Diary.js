import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import styled from 'styled-components';
import Header from '../../components/Header';
import { Line, getElementAtEvent, Bar } from 'react-chartjs-2';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  padding-top: 0;
  margin: 40px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
`;

const EmotionGraphContainer = styled.div`
  margin-top: 30px;
  padding: 20px;
  background-color: ${({ theme }) => theme.card};
  border-radius: 15px;
  box-shadow: ${({ theme }) => theme.cardShadow};
`;

const GraphTitle = styled.h3`
  color: ${({ theme }) => theme.primary};
  margin-bottom: 20px;
  text-align: center;
`;

function Diary({ user }) {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [diaries, setDiaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewDiary, setPreviewDiary] = useState(null);
    const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
    const chartRef = useRef();
    const [longPressTimer, setLongPressTimer] = useState(null);

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
    }, [user, currentDate]);

    const styles = {
        content: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '80px',
        },
        calendarHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            marginBottom: '20px'
        },
        monthText: {
            fontSize: '24px',
            color: '#e46262',
            fontWeight: '500'
        },
        monthButton: {
            background: 'none',
            border: 'none',
            color: '#df9696',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
        },
        calendar: {
            width: '100%',
            borderCollapse: 'collapse'
        },
        dayHeader: {
            padding: '10px',
            paddingBottom: '20px',
            textAlign: 'center',
            color: '#888',
            fontSize: '16px',
            fontWeight: '500'
        },
        dateCell: {
            padding: '0',
            textAlign: 'center',
            position: 'relative',
            height: '90px',
            width: '45px'
        },
        dateButton: {
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            position: 'relative',
            color: '#000',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            fontSize: '14px'
        },
        todayButton: {
            color: '#fff',
            position: 'relative',
            zIndex: 1
        },
        todayCircle: {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#e46262',
            zIndex: -1
        },
        hasDiary: {
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            backgroundColor: '#e46262'
        }
    };

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

    // 감정 값 매핑 (그래프용, 값이 클수록 긍정)
    const emotionValues = {
        love: 6,
        good: 5,
        normal: 4,
        surprised: 3,
        angry: 2,
        cry: 1
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
        surprised: (month) => `${month}월, 놀람이 많았던 한 달이었네요!`,
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

    // 현재 월의 감정 데이터 가져오기
    const getCurrentMonthEmotionData = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 현재 월의 일수 구하기
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // 날짜별 감정 데이터 생성
        const emotionData = [];
        const labels = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateString = formatDateToString(date);
            const diary = diaries.find(d => d.date.startsWith(dateString));

            if (diary && diary.emotion) {
                emotionData.push(emotionValues[diary.emotion]);
                labels.push(day);
            }
        }

        return { labels, emotionData };
    };

    // 차트 데이터 설정
    const { labels, emotionData } = getCurrentMonthEmotionData();
    const chartData = {
        labels,
        datasets: [
            {
                fill: true,
                label: '월별 감정 변화',
                data: emotionData,
                borderColor: '#e46262',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
                    gradient.addColorStop(0, 'rgba(228, 98, 98, 0.4)');
                    gradient.addColorStop(1, 'rgba(228, 98, 98, 0)');
                    return gradient;
                },
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#e46262',
                pointRadius: 6,
                pointHoverRadius: 10,
                pointBorderWidth: 2,
            },
        ],
    };

    // 차트 옵션 설정
    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                min: 0,
                max: 7,
                grid: {
                    display: false
                },
                ticks: {
                    display: false
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: false
            }
        }
    };

    // 그래프 포인트 클릭 핸들러 (마우스)
    const handleChartClick = (event) => {
        if (!chartRef.current) return;
        const points = getElementAtEvent(chartRef.current, event);
        if (points && points.length > 0) {
            const idx = points[0].index;
            const day = labels[idx];
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const dateString = formatDateToString(new Date(year, month, day));
            const diary = diaries.find(d => d.date.startsWith(dateString));
            if (diary) {
                setPreviewDiary(diary);
                setPreviewPosition({ x: event.clientX, y: event.clientY });
            }
        }
    };

    // 그래프 포인트 터치 핸들러 (모바일)
    const handleChartTouch = (event) => {
        if (!chartRef.current) return;
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        // Chart.js는 getElementAtEvent에 nativeEvent를 넘겨야 하므로, 좌표를 맞춰서 전달
        const fakeEvent = {
            ...event,
            clientX: touch.clientX,
            clientY: touch.clientY,
            native: true
        };
        const points = getElementAtEvent(chartRef.current, fakeEvent);
        if (points && points.length > 0) {
            const idx = points[0].index;
            const day = labels[idx];
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const dateString = formatDateToString(new Date(year, month, day));
            const diary = diaries.find(d => d.date.startsWith(dateString));
            if (diary) {
                setPreviewDiary(diary);
                setPreviewPosition({ x: touch.clientX, y: touch.clientY });
            }
        }
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
                <td key={`prev-${prevMonthDay}`} style={styles.dateCell}>
                    <button
                        style={{ ...styles.dateButton, color: '#ccc', cursor: 'not-allowed', opacity: 0.5 }}
                        onClick={() => handleDateClick(date)}
                        disabled
                    >
                        <span style={{ color: '#ccc' }}>{prevMonthDay}</span>
                    </button>
                </td>
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year;
            const future = isFutureDate(date);

            const diary = hasDiaryOnDate(date) ? diaries.find(d => d.date.startsWith(formatDateToString(date))) : null;
            const emotionImg = diary && diary.emotion ? emotionImageMap[diary.emotion] : null;

            days.push(
                <td key={`current-${day}`} style={styles.dateCell}>
                    <button
                        style={{
                            ...styles.dateButton,
                            ...(isToday && styles.todayButton),
                            ...(future && { color: '#ccc', cursor: 'not-allowed', opacity: 0.5 })
                        }}
                        onClick={() => !future && handleDateClick(date)}
                        disabled={future}
                        onTouchStart={e => handleDateLongPressStart(date, e)}
                        onTouchEnd={handleDateLongPressEnd}
                        onTouchCancel={handleDateLongPressEnd}
                    >
                        <span style={{ color: document.body.classList.contains('dark') ? '#fff' : '#000' }}>{day}</span>
                        {isToday && <div style={styles.todayCircle} />}
                        {/* 감정 이미지만, 없으면 빈 공간 */}
                        <div style={{ marginTop: '2px', lineHeight: 1, minHeight: '28px', minWidth: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            {emotionImg && <img src={emotionImg} alt="감정" style={{ width: 24, height: 24, marginBottom: 2 }} />}
                        </div>
                    </button>
                </td>
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
                <td key={`next-${nextMonthDay}`} style={styles.dateCell}>
                    <button
                        style={{ ...styles.dateButton, color: '#ccc', cursor: 'not-allowed', opacity: 0.5 }}
                        onClick={() => handleDateClick(date)}
                        disabled
                    >
                        <span style={{ color: '#ccc' }}>{nextMonthDay}</span>
                    </button>
                </td>
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
            <div style={styles.content}>
                <div style={styles.calendarHeader}>
                    <button style={styles.monthButton} onClick={handlePrevMonth}>&lt;</button>
                    <span style={styles.monthText}>{formatMonth(currentDate)}</span>
                    <button style={styles.monthButton} onClick={handleNextMonth}>&gt;</button>
                </div>
                <table style={styles.calendar}>
                    <thead>
                        <tr>
                            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                                <th key={day} style={styles.dayHeader}>{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderCalendar()}
                    </tbody>
                </table>
                {/* 감정 비율 막대(커스텀) */}
                <div style={{ margin: '32px 0 0 0', width: '100%', maxWidth: 540, minHeight: 40, position: 'relative', left: '50%', transform: 'translateX(-50%)' }}>
                    {/* 상단 문구 */}
                    <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 500, marginBottom: 18, color: '#7c6f6f', letterSpacing: '-1px' }}>
                        {getTopMessage()}
                    </div>
                    {/* 막대 */}
                    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: 38, borderRadius: 22, overflow: 'hidden', background: '#f6f6f6', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                        {Object.entries(emotionBarData.percent).map(([emotion, value], idx, arr) => {
                            if (isNaN(value) || value === 0) return null; // 0%는 렌더링하지 않음
                            const emotionKeys = Object.keys(emotionBarData.percent).filter(
                                key => !isNaN(emotionBarData.percent[key]) && emotionBarData.percent[key] > 0
                            );
                            const isFirst = emotion === emotionKeys[0];
                            const isLast = emotion === emotionKeys[emotionKeys.length - 1];
                            return (
                                <div key={emotion} style={{
                                    flex: value + ' 0 0',
                                    background: emotionBarColors[emotion],
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative',
                                    borderTopLeftRadius: isFirst ? 22 : 0,
                                    borderBottomLeftRadius: isFirst ? 22 : 0,
                                    borderTopRightRadius: isLast ? 22 : 0,
                                    borderBottomRightRadius: isLast ? 22 : 0
                                }}>
                                    {emotion !== 'empty' && value >= 10 && (
                                        <img src={emotionBarIcons[emotion]} alt={emotionBarLabels[emotion]} style={{ width: 28, height: 28, opacity: 0.85 }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* 퍼센트/개수 */}
                    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', marginTop: 8 }}>
                        {Object.entries(emotionBarData.percent).map(([emotion, value]) => {
                            if (isNaN(value) || value === 0) return null;
                            return (
                                <div key={emotion} style={{
                                    flex: value + ' 0 0',
                                    textAlign: 'center',
                                    color: emotionBarColors[emotion],
                                    fontWeight: 600,
                                    fontSize: 17,
                                    opacity: 0.6
                                }}>
                                    {value}%
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* 미리보기 팝업은 달력 아래에 그대로 유지 */}
                {previewDiary && (() => {
                    const popupWidth = 260, popupHeight = 220;
                    let left = previewPosition.x, top = previewPosition.y;
                    if (left + popupWidth > window.innerWidth) left = window.innerWidth - popupWidth - 8;
                    if (left < 8) left = 8;
                    if (top + popupHeight > window.innerHeight) top = window.innerHeight - popupHeight - 8;
                    if (top < 8) top = 8;
                    return (
                        <div
                            style={{
                                position: 'fixed',
                                left,
                                top,
                                zIndex: 2000,
                                background: '#fff',
                                border: '1px solid #eee',
                                borderRadius: 10,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                                padding: 16,
                                minWidth: 180,
                                maxWidth: 260,
                                fontSize: 13,
                                width: popupWidth,
                                maxHeight: popupHeight,
                                overflow: 'auto',
                                transform: 'none'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 감정/날씨 이모티콘 */}
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                {previewDiary.emotion && emotionImageMap[previewDiary.emotion] && (
                                    <img src={emotionImageMap[previewDiary.emotion]} alt="감정" style={{ width: 28, height: 28 }} />
                                )}
                                {previewDiary.weather && weatherImageMap[previewDiary.weather] && (
                                    <img src={weatherImageMap[previewDiary.weather]} alt="날씨" style={{ width: 28, height: 28 }} />
                                )}
                            </div>
                            {previewDiary.imageUrls && previewDiary.imageUrls.length > 0 && (
                                <img src={previewDiary.imageUrls[0]} alt="일기 이미지" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                            )}
                            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{previewDiary.title}</div>
                            <div style={{ fontWeight: 500, color: '#888', fontSize: 12, marginBottom: 4 }}>
                                {previewDiary.date}
                            </div>
                            <button style={{ marginTop: 6, fontSize: 13, color: '#e46262', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setPreviewDiary(null)}>닫기</button>
                        </div>
                    );
                })()}
            </div>
            <Navigation />
        </Container>
    );
}

export default Diary; 