import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import styled from 'styled-components';
import Header from '../components/Header';
import { Line, getElementAtEvent } from 'react-chartjs-2';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
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
  padding-top: 70px;
`;

const EmotionGraphContainer = styled.div`
  margin-top: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const GraphTitle = styled.h3`
  color: #e46262;
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
                console.error("Error fetching diaries: ", error);
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
                pointRadius: 2,
                pointHoverRadius: 4,
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
                        style={{ ...styles.dateButton, color: '#ccc' }}
                        onClick={() => handleDateClick(date)}
                    >
                        {prevMonthDay}
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
                    >
                        <span style={{ color: !isToday && !future ? '#000' : undefined }}>{day}</span>
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
                        style={{ ...styles.dateButton, color: '#ccc' }}
                        onClick={() => handleDateClick(date)}
                    >
                        {nextMonthDay}
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
            <Header user={user} />
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

                <EmotionGraphContainer>
                    <GraphTitle>이달의 감정</GraphTitle>
                    <Line ref={chartRef} data={chartData} options={chartOptions} onClick={handleChartClick} onTouchStart={handleChartTouch} />
                    {previewDiary && (
                        <div
                            style={{
                                position: 'fixed',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 2000,
                                background: '#fff',
                                border: '1px solid #eee',
                                borderRadius: 10,
                                boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                                padding: 16,
                                minWidth: 180,
                                maxWidth: 260,
                                fontSize: 13
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
                    )}
                </EmotionGraphContainer>
            </div>
            <Navigation />
        </Container>
    );
}

export default Diary; 