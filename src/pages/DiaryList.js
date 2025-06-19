import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import styled from 'styled-components';
import Header from '../components/Header';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: radial-gradient(circle at 30% 20%, #f2b7b7 0%, #ffffff 100%);
  padding: 20px;
  padding-top: 70px;
`;

function DiaryList() {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const diaries = JSON.parse(localStorage.getItem('diaries') || '[]');

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            height: '80vh',
            // background: 'radial-gradient(circle at 30% 20%, #f2b7b7 0%, #ffffff 100%)',
            // padding: '20px'
        },
        content: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '80px',
            // marginTop: '20px'
        },
        mainContent: {
            backgroundColor: '#fffbfb',
            borderRadius: '30px',
            padding: '20px',
            flex: 1,
            overflowY: 'auto'
        },
        calendarHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
            textAlign: 'center',
            color: '#888',
            fontSize: '14px',
            fontWeight: '500'
        },
        dateCell: {
            padding: '0',
            textAlign: 'center',
            position: 'relative',
            height: '45px',
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
                        {hasDiaryOnDate(date) && <div style={styles.hasDiary} />}
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
            <Header />
            <div style={styles.container}>
                <div style={styles.content}>
                    <header style={styles.header}>
                        {/* <BackButton onClick={() => navigate('/')}>←</BackButton> */}
                    </header>
                    <div style={styles.mainContent}>
                        <div style={styles.calendarHeader}>
                            <button style={styles.monthButton} onClick={handlePrevMonth}>‹</button>
                            <span style={styles.monthText}>{formatMonth(currentDate)}</span>
                            <button style={styles.monthButton} onClick={handleNextMonth}>›</button>
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
                    </div>
                </div>
            </div>
            <Navigation />
        </Container>
    );
}

export default DiaryList; 