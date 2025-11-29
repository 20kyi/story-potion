import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import { useTheme } from '../../ThemeContext';
import { useLanguage, useTranslation } from '../../LanguageContext';

import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

import { getWeeklyDiaryStatus } from '../../utils/weeklyBonus';

import './Diary.css';


// 형광펜 색상 옵션
const HIGHLIGHTER_COLORS = [
    { id: 'yellow', color: 'rgba(255, 235, 59, 0.6)', shadowColor: 'rgba(255, 193, 7, 0.2)' },
    { id: 'pink', color: 'rgba(255, 128, 171, 0.6)', shadowColor: 'rgba(255, 64, 129, 0.2)' },
    { id: 'green', color: 'rgba(129, 199, 132, 0.6)', shadowColor: 'rgba(76, 175, 80, 0.2)' },
    { id: 'blue', color: 'rgba(100, 181, 246, 0.6)', shadowColor: 'rgba(33, 150, 243, 0.2)' },
    { id: 'orange', color: 'rgba(255, 183, 77, 0.6)', shadowColor: 'rgba(255, 152, 0, 0.2)' }
];

function Diary({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { actualTheme } = useTheme();
    const { language } = useLanguage();
    const { t } = useTranslation();
    const isDiaryTheme = actualTheme === 'diary';
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

    // 형광펜 색상 상태
    const [selectedHighlighterColor, setSelectedHighlighterColor] = useState(() => {
        const saved = localStorage.getItem('highlighterColor');
        return saved || HIGHLIGHTER_COLORS[0].id;
    });

    // 팔레트 열림/닫힘 상태
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const paletteRef = useRef(null);

    // 팔레트 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (paletteRef.current && !paletteRef.current.contains(event.target)) {
                setIsPaletteOpen(false);
            }
        };

        if (isPaletteOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isPaletteOpen]);

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

    const handleHighlighterColorChange = (colorId) => {
        setSelectedHighlighterColor(colorId);
        localStorage.setItem('highlighterColor', colorId);
        setIsPaletteOpen(false); // 색상 선택 후 팔레트 닫기
    };

    const togglePalette = () => {
        setIsPaletteOpen(!isPaletteOpen);
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
            const isSunday = date.getDay() === 0;

            days.push(
                <td key={`prev-${prevMonthDay}`} className={`diary-date-cell ${isDiaryTheme ? 'diary-theme' : ''}`}>
                    <button
                        className="diary-date-button prev-month"
                        onClick={() => handleDateClick(date)}
                        disabled
                    >
                        <span style={{ color: isSunday ? '#e46262' : '#ccc', fontSize: '12px', fontWeight: 'normal' }}>{prevMonthDay}</span>
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
            const isSunday = date.getDay() === 0;

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
                <td key={`current-${day}`} className={`diary-date-cell ${isDiaryTheme ? 'diary-theme' : ''}`}>
                    <button
                        className={`diary-date-button ${isToday ? 'today' : ''} ${future ? 'future' : ''}`}
                        onClick={() => !future && handleDateClick(date)}
                        disabled={future}
                        onTouchStart={e => handleDateLongPressStart(date, e)}
                        onTouchEnd={handleDateLongPressEnd}
                        onTouchCancel={handleDateLongPressEnd}
                    >
                        <span style={{
                            color: isToday
                                ? (isDiaryTheme || !document.body.classList.contains('dark') ? '#000' : '#fff')
                                : (isSunday
                                    ? '#e46262'
                                    : (document.body.classList.contains('dark') ? '#fff' : '#000')),
                            position: 'relative',
                            zIndex: isToday ? 2 : 1,
                            fontSize: '12px',
                            fontWeight: 'normal'
                        }}>{day}</span>
                        {isToday && (() => {
                            const colorOption = HIGHLIGHTER_COLORS.find(c => c.id === selectedHighlighterColor) || HIGHLIGHTER_COLORS[0];
                            return <div
                                className="diary-today-circle"
                                style={{
                                    background: colorOption.color,
                                    boxShadow: `0 1px 3px ${colorOption.shadowColor}, inset 0 0 8px ${colorOption.color.replace('0.6', '0.3')}`
                                }}
                            />;
                        })()}
                        {/* 스티커 또는 감정 이미지, 없으면 빈 공간 */}
                        <div className="diary-image-container">
                            {displayImg && <img src={displayImg} alt="대표 이미지" className={`diary-display-image ${isSticker ? 'sticker' : ''}`} />}
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
            const isSunday = date.getDay() === 0;

            days.push(
                <td key={`next-${nextMonthDay}`} className={`diary-date-cell ${isDiaryTheme ? 'diary-theme' : ''}`}>
                    <button
                        className="diary-date-button prev-month"
                        onClick={() => handleDateClick(date)}
                        disabled
                    >
                        <span style={{ color: isSunday ? '#e46262' : '#ccc', fontSize: '12px', fontWeight: 'normal' }}>{nextMonthDay}</span>
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

    const { theme } = useTheme();
    const containerStyle = {
        background: isDiaryTheme ? '#faf8f3' : (theme?.background || '#fff')
    };

    return (
        <div className={`diary-container ${isDiaryTheme ? 'diary-theme' : ''}`} style={containerStyle}>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('diary_title')} />
            <div className="diary-content">
                <div className="diary-calendar-header">
                    <div className="diary-month-section">
                        <button onClick={handlePrevMonth} className={`diary-month-button ${isDiaryTheme ? 'diary-theme' : ''}`}>&lt;</button>
                        <span className={`diary-month-text ${isDiaryTheme ? 'diary-theme' : ''}`}>{formatMonth(currentDate)}</span>
                        <button onClick={handleNextMonth} className={`diary-month-button ${isDiaryTheme ? 'diary-theme' : ''}`}>&gt;</button>
                    </div>
                    <div className="diary-highlighter-color-picker" ref={paletteRef}>
                        {(() => {
                            const selectedColor = HIGHLIGHTER_COLORS.find(c => c.id === selectedHighlighterColor) || HIGHLIGHTER_COLORS[0];
                            const unselectedColors = HIGHLIGHTER_COLORS.filter(c => c.id !== selectedHighlighterColor);
                            return (
                                <>
                                    {!isPaletteOpen && (
                                        <button
                                            className="diary-selected-color-button"
                                            style={{ background: selectedColor.color }}
                                            onClick={togglePalette}
                                            title="형광펜 색상 선택"
                                        />
                                    )}
                                    <div className={`diary-color-palette ${isPaletteOpen ? 'open' : 'closed'}`}>
                                        {unselectedColors.map((colorOption) => (
                                            <button
                                                key={colorOption.id}
                                                className="diary-color-button"
                                                style={{ background: colorOption.color }}
                                                onClick={() => handleHighlighterColorChange(colorOption.id)}
                                                title={`형광펜 색상: ${colorOption.id}`}
                                            />
                                        ))}
                                        {isPaletteOpen && (
                                            <button
                                                className="diary-color-button"
                                                style={{ background: selectedColor.color }}
                                                onClick={togglePalette}
                                                title={`현재 선택된 색상: ${selectedHighlighterColor}`}
                                            />
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                    <button onClick={handleToday} className={`diary-today-button ${isDiaryTheme ? 'diary-theme' : ''}`}>{getTodayDate()}</button>
                </div>
                <table className={`diary-calendar ${isDiaryTheme ? 'diary-theme' : ''}`}>
                    <thead>
                        <tr>
                            {(language === 'en'
                                ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                                : ['일', '월', '화', '수', '목', '금', '토']
                            ).map((day, index) => (
                                <th key={day} className={`diary-day-header ${isDiaryTheme ? 'diary-theme' : ''} ${index === 0 ? 'sunday' : ''}`}>{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderCalendar()}
                    </tbody>
                </table>

                {/* 감정 비율 막대(커스텀) */}
                <div className="diary-emotion-stats-container">
                    {/* 상단 문구 */}
                    <div className="diary-top-message">
                        {getTopMessage()}
                    </div>
                    {/* 막대 */}
                    <div className="diary-emotion-bar">
                        {Object.entries(emotionBarData.percent).map(([emotion, value], idx, arr) => {
                            if (isNaN(value) || value === 0) return null; // 0%는 렌더링하지 않음
                            const emotionKeys = Object.keys(emotionBarData.percent).filter(
                                key => !isNaN(emotionBarData.percent[key]) && emotionBarData.percent[key] > 0
                            );
                            const isFirst = emotion === emotionKeys[0];
                            const isLast = emotion === emotionKeys[emotionKeys.length - 1];
                            return (
                                <div
                                    key={emotion}
                                    className="diary-emotion-segment"
                                    style={{
                                        flex: `${value} 0 0`,
                                        background: emotionBarColors[emotion],
                                        borderTopLeftRadius: isFirst ? '22px' : '0',
                                        borderBottomLeftRadius: isFirst ? '22px' : '0',
                                        borderTopRightRadius: isLast ? '22px' : '0',
                                        borderBottomRightRadius: isLast ? '22px' : '0'
                                    }}
                                >
                                    {emotion !== 'empty' && value >= 10 && (
                                        <img src={emotionBarIcons[emotion]} alt={emotionBarLabels[emotion]} className="diary-emotion-icon" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {/* 퍼센트/개수 */}
                    <div className="diary-percent-container">
                        {Object.entries(emotionBarData.percent).map(([emotion, value]) => {
                            if (isNaN(value) || value === 0) return null;
                            return (
                                <div
                                    key={emotion}
                                    className="diary-percent-item"
                                    style={{
                                        flex: `${value} 0 0`,
                                        color: emotionBarColors[emotion]
                                    }}
                                >
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
                            className="diary-preview-popup"
                            style={{ left: `${left}px`, top: `${top}px`, width: `${popupWidth}px`, maxHeight: `${popupHeight}px` }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* 감정/날씨 이모티콘 */}
                            <div className="diary-preview-header">
                                {previewDiary.emotion && emotionImageMap[previewDiary.emotion] && (
                                    <img src={emotionImageMap[previewDiary.emotion]} alt="감정" className="diary-preview-image" />
                                )}
                                {previewDiary.weather && weatherImageMap[previewDiary.weather] && (
                                    <img src={weatherImageMap[previewDiary.weather]} alt="날씨" className="diary-preview-image" />
                                )}
                            </div>
                            {previewDiary.imageUrls && previewDiary.imageUrls.length > 0 && (
                                <img src={previewDiary.imageUrls[0]} alt="diary" className="diary-preview-diary-image" />
                            )}
                            <div className="diary-preview-title">{previewDiary.title}</div>
                            <div className="diary-preview-date">{previewDiary.date}</div>
                            <button className="diary-preview-close-button" onClick={() => setPreviewDiary(null)}>{t('close')}</button>
                        </div>
                    );
                })()}
            </div>
            <Navigation />
        </div>
    );
}

export default Diary; 