import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import styled from 'styled-components';
import Header from '../components/Header';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
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

function DiaryList({ user }) {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');

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
            height: '60px',
            width: '45px'
        },
        dateButton: {
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            position: 'relative',
            color: '#666',
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

    // 날씨/감정 이모티콘 매핑 추가
    const weatherIcons = {
        sunny: "☀️",
        cloudy: "☁️",
        rainy: "🌧️",
        snowy: "❄️"
    };
    const emotionIcons = {
        happy: "😊",
        sad: "😢",
        angry: "😠",
        calm: "😌"
    };

    // 감정 값 매핑
    const emotionValues = {
        happy: 4,
        calm: 3,
        sad: 2,
        angry: 1
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
                label: '월별 감정 변화',
                data: emotionData,
                borderColor: '#e46262',
                backgroundColor: '#fdd2d2',
                tension: 0.3
            },
        ],
    };

    // 차트 옵션 설정
    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                min: 0,
                max: 5,
                ticks: {
                    stepSize: 1,
                    callback: function (value) {
                        switch (value) {
                            case 4: return '행복';
                            case 3: return '평온';
                            case 2: return '슬픔';
                            case 1: return '화남';
                            default: return '';
                        }
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = context.raw;
                        let emotion = '';
                        switch (value) {
                            case 4: emotion = '행복 😊'; break;
                            case 3: emotion = '평온 😌'; break;
                            case 2: emotion = '슬픔 😢'; break;
                            case 1: emotion = '화남 😠'; break;
                        }
                        return emotion;
                    }
                }
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
            const dateString = formatDateToString(date);
            const diary = diaries.find(diary => diary.date.startsWith(dateString));
            // 감정 이모티콘만 표시
            const emotionIcon = diary && diary.emotion ? emotionIcons[diary.emotion] : null;

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
                        {day}
                        {isToday && <div style={styles.todayCircle} />}
                        {/* 감정 이모티콘만, 없으면 빈 공간 */}
                        <div style={{ fontSize: '16px', marginTop: '2px', lineHeight: 1, minHeight: '28px', minWidth: '20px' }}>
                            {emotionIcon || '\u00A0'}
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
                    <GraphTitle>{formatMonth(currentDate)} 감정 그래프</GraphTitle>
                    <Line data={chartData} options={chartOptions} />
                </EmotionGraphContainer>
            </div>
            <Navigation />
        </Container>
    );
}

export default DiaryList; 