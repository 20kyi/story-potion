import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createNovelUrl } from '../../../utils/novelUtils';
import { useLanguage, useTranslation } from '../../../LanguageContext';
import { useTheme } from '../../../ThemeContext';
import { getDayIndicatorBackground, getCreateButtonStyle, getWeeklyCardTransform } from '../utils/novelHelpers';
import './WeeklyCard.css';

const WeeklyCard = ({
    week,
    index,
    progress,
    isCompleted,
    novelsForWeek,
    diaries,
    isDiaryTheme,
    isGlassTheme,
    isPremium,
    ownedPotions,
    currentDate,
    isListMode,
    onViewNovels,
    onCreateNovel,
    onWriteDiary,
    isFutureWeek,
    hasTodayDiary,
    weekRef,
    isLoading
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const { t } = useTranslation();
    const theme = useTheme();

    const firstNovel = novelsForWeek.length > 0 ? novelsForWeek[0] : null;
    const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

    // 모든 장르 목록
    const allGenres = ['로맨스', '추리', '역사', '동화', '판타지', '공포'];
    // 모든 장르의 소설이 생성되었는지 확인
    const allGenresCreated = allGenres.every(genre => existingGenres.includes(genre));

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    };

    const handleAddNovel = () => {
        if (allGenresCreated) return;

        if (progress < 100) {
            alert(t('novel_all_diaries_needed'));
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const novelTitle = language === 'en'
            ? t('novel_list_by_genre_title', { genre: t('novel_title') })
            : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

        const weekStartDate = new Date(week.start);
        const weekEndDate = new Date(week.end);

        const firstDiaryWithImage = diaries.find(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate >= weekStartDate &&
                diaryDate <= weekEndDate &&
                diary.imageUrls && diary.imageUrls.length > 0;
        });
        const imageUrl = firstDiaryWithImage ? firstDiaryWithImage.imageUrls[0] : '/novel_banner/romance.png';

        navigate('/novel/create', {
            state: {
                year: year,
                month: month,
                weekNum: week.weekNum,
                week: `${year}년 ${month}월 ${week.weekNum}주차`,
                dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                imageUrl: imageUrl,
                title: novelTitle,
                existingGenres: novelsForWeek.map(n => n.genre).filter(Boolean),
                returnPath: location.pathname || '/novel'
            }
        });
    };

    const handleViewNovel = () => {
        if (onViewNovels) {
            onViewNovels(novelsForWeek);
        } else {
            if (novelsForWeek.length > 1) {
                // 모달 표시는 부모에서 처리
                return;
            } else {
                const novelKey = createNovelUrl(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    week.weekNum,
                    firstNovel.genre,
                    firstNovel.id
                );
                navigate(`/novel/${novelKey}`);
            }
        }
    };

    // 로딩 중이거나 데이터가 아직 불완전할 때는 안정적인 색상 사용
    // isLoading이 true이면 barColor를 progress와 isCompleted 기반으로만 결정
    // 데이터가 로드되기 전에는 firstNovel을 사용하지 않고 progress 기반으로만 결정하여
    // 색상이 로딩 중에 변경되지 않도록 함
    const barColor = isLoading
        ? (isCompleted ? 'create' : 'fill')
        : (firstNovel ? 'view' : isCompleted ? 'create' : 'fill');

    // 주의 시작일부터 7일간의 날짜 생성
    const weekStart = new Date(week.start);
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        weekDays.push(date);
    }

    // 해당 주의 일기 날짜 목록
    const weekStartStr = formatDate(week.start);
    const weekEndStr = formatDate(week.end);
    const weekDiaries = diaries.filter(diary => {
        return diary.date >= weekStartStr && diary.date <= weekEndStr;
    });
    const writtenDates = new Set(weekDiaries.map(diary => diary.date));

    const handleButtonClick = () => {
        if (!isCompleted && (isFutureWeek || hasTodayDiary)) {
            return;
        }
        if (isCompleted) {
            if (onCreateNovel) {
                onCreateNovel(week);
            }
        } else {
            if (onWriteDiary) {
                onWriteDiary(week);
            }
        }
    };

    return (
        <div
            className={`novel-weekly-card ${isListMode ? 'list-mode' : ''} ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
            ref={weekRef}
            style={{
                ...(isDiaryTheme ? {
                    background: '#fffef9',
                    borderRadius: '14px 18px 16px 15px',
                    border: '1px solid rgba(139, 111, 71, 0.2)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                } : {
                    // 일반 모드는 CSS에서 처리 (다크모드 지원)
                    borderRadius: '15px'
                }),
                transform: getWeeklyCardTransform(isDiaryTheme, index),
                color: theme.cardText,
                ...(isListMode ? { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' } : {})
            }}
        >
            <div style={isListMode ? { display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: 0 } : {}}>
                <h3 className={`novel-week-title ${isListMode ? 'list-mode' : ''} ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                    <span>{t('week_num', { num: week.weekNum })}</span>
                    {firstNovel && isCompleted && (
                        <button
                            className="novel-add-button"
                            onClick={handleViewNovel}
                            title="소설 보기"
                            style={{
                                color: theme.primary
                            }}
                        >
                            ☰
                        </button>
                    )}
                </h3>
                <p className={`novel-date-range ${isListMode ? 'list-mode' : ''}`}>
                    {formatDisplayDate(week.start)} - {formatDisplayDate(week.end)}
                </p>
                <div className={`novel-progress-bar ${isListMode ? 'list-mode' : ''}`}>
                    {weekDays.map((day, idx) => {
                        const dayStr = formatDate(day);
                        const hasDiary = writtenDates.has(dayStr);
                        return (
                            <div
                                key={idx}
                                className={`novel-day-indicator ${isListMode ? 'list-mode' : ''}`}
                                style={{
                                    background: getDayIndicatorBackground(hasDiary, barColor, theme, isCompleted, isGlassTheme)
                                }}
                            />
                        );
                    })}
                </div>
            </div>
            <div style={isListMode ? { flexShrink: 0 } : {}}>
                {firstNovel ? (
                    <button
                        className={`novel-create-button ${isListMode ? 'list-mode' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
                        onClick={handleAddNovel}
                        disabled={allGenresCreated}
                        style={getCreateButtonStyle(
                            allGenresCreated ? "완성 ✨" : (!isPremium && novelsForWeek.length > 0 ? "👑 PREMIUM" : t('novel_create_other_genre')),
                            true,
                            theme,
                            false,
                            allGenresCreated,
                            isListMode,
                            isGlassTheme
                        )}
                    >
                        {allGenresCreated ? "완성 ✨" : (!isPremium && novelsForWeek.length > 0 ? "👑 PREMIUM" : t('novel_create_other_genre'))}
                    </button>
                ) : (
                    <button
                        className={`novel-create-button ${isListMode ? 'list-mode' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
                        disabled={!isCompleted && (isFutureWeek || hasTodayDiary)}
                        onClick={handleButtonClick}
                        style={getCreateButtonStyle(
                            isCompleted ? t('novel_create') : t('novel_fill_diary'),
                            false,
                            theme,
                            false,
                            !isCompleted && (isFutureWeek || hasTodayDiary),
                            isListMode,
                            isGlassTheme
                        )}
                    >
                        {isCompleted
                            ? t('novel_create')
                            : t('novel_fill_diary')}
                    </button>
                )}
            </div>
        </div>
    );
};

export default WeeklyCard;

