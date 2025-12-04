import React, { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { useTranslation } from '../LanguageContext';
import { checkWeekBonusStatus } from '../utils/weeklyBonus';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import styled from 'styled-components';

const BonusCard = styled.div`
    padding: 16px;
    margin-bottom: 16px;
    background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) {
            return 'rgba(255, 255, 255, 0.3)';
        }
        return $isDiaryTheme ? '#fffef9' : theme.progressCard;
    }};
    backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(5px)' : 'none'};
    -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(5px)' : 'none'};
    border-radius: ${({ $isDiaryTheme }) =>
        $isDiaryTheme ? '16px 20px 18px 17px' : '20px'};
    border: ${({ $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) {
            return '2px solid rgba(255, 255, 255, 0.3)';
        }
        return $isDiaryTheme ? '1px solid rgba(139, 111, 71, 0.2)' : '1px solid #f0f0f0';
    }};
    box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) {
            return '0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        }
        return $isDiaryTheme
            ? '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
            : '0 2px 8px rgba(0,0,0,0.04)';
    }};
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    transform: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'rotate(0.2deg)' : 'none'};
    transition: transform 0.2s, box-shadow 0.2s;
    
    ${({ $isDiaryTheme }) => $isDiaryTheme && `
        &::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            border-radius: inherit;
            background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, transparent 50%);
            z-index: -1;
            opacity: 0.4;
        }
    `}
    
    &:hover {
        transform: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'rotate(0.4deg) translateY(-1px)' : 'none'};
        box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) {
            return '0 12px 32px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12)';
        }
        return $isDiaryTheme
            ? '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
            : '0 2px 8px rgba(0,0,0,0.04)';
    }};
    }
`;

const BonusContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: ${({ $isDiaryTheme, $isGlassTheme, theme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#5C4B37';
        return theme.text;
    }};
`;

const BonusTitle = styled.div`
    font-size: 16px;
    font-weight: 700;
    color: ${({ $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return 'inherit';
    }};
`;



const WeekStatusGrid = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`;

const DayStatus = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
`;

const DayLabel = styled.div`
    font-size: 11px;
    color: ${({ $isDiaryTheme, $isGlassTheme, theme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#5C4B37';
        return theme.text;
    }};
    opacity: 0.7;
`;


const DayIndicator = styled.div`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${({ status }) => status === 'P' ? '11px' : '16px'};
    font-weight: 700;
    position: relative;
    background: ${({ status, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) {
            if (status === 'O') return 'rgba(76, 175, 80, 0.25)';
            if (status === 'X') return 'rgba(244, 67, 54, 0.25)';
            if (status === 'P') return 'rgba(33, 150, 243, 0.25)';
            return 'rgba(158, 158, 158, 0.25)';
        }
        if ($isDiaryTheme) {
            if (status === 'O') return 'rgba(76, 175, 80, 0.15)';
            if (status === 'X') return 'rgba(244, 67, 54, 0.15)';
            if (status === 'P') return 'rgba(33, 150, 243, 0.15)';
            return 'rgba(158, 158, 158, 0.15)';
        }
        // 기본 테마
        if (status === 'O') return 'rgba(76, 175, 80, 0.15)';
        if (status === 'X') return 'rgba(244, 67, 54, 0.15)';
        if (status === 'P') return 'rgba(33, 150, 243, 0.15)';
        return 'rgba(158, 158, 158, 0.15)';
    }};
    color: ${({ status }) => {
        if (status === 'O') return '#4CAF50';
        if (status === 'X') return '#F44336';
        if (status === 'P') return '#2196F3';
        return '#9E9E9E';
    }};
    border: ${({ status, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) {
            if (status === 'O') return '2px solid rgba(76, 175, 80, 0.4)';
            if (status === 'X') return '2px solid rgba(244, 67, 54, 0.4)';
            if (status === 'P') return '2px solid rgba(33, 150, 243, 0.4)';
            return '2px solid rgba(158, 158, 158, 0.4)';
        }
        if ($isDiaryTheme) {
            if (status === 'O') return '1px solid rgba(76, 175, 80, 0.3)';
            if (status === 'X') return '1px solid rgba(244, 67, 54, 0.3)';
            if (status === 'P') return '1px solid rgba(33, 150, 243, 0.3)';
            return '1px solid rgba(158, 158, 158, 0.3)';
        }
        // 기본 테마
        if (status === 'O') return '1px solid rgba(76, 175, 80, 0.3)';
        if (status === 'X') return '1px solid rgba(244, 67, 54, 0.3)';
        if (status === 'P') return '1px solid rgba(33, 150, 243, 0.3)';
        return '1px solid rgba(158, 158, 158, 0.3)';
    }};
    box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return '0 1px 3px rgba(0, 0, 0, 0.05)';
        return '0 1px 3px rgba(0, 0, 0, 0.08)';
    }};
    
    ${({ $isDiaryTheme }) => $isDiaryTheme && `
        &::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            border-radius: inherit;
            background: linear-gradient(135deg, rgba(139, 111, 71, 0.05) 0%, transparent 50%);
            z-index: -1;
            opacity: 0.3;
        }
    `}
`;

const WeeklyBonusCard = ({ user }) => {
    const theme = useTheme();
    const { actualTheme } = useTheme();
    const { t } = useTranslation();
    const isDiaryTheme = actualTheme === 'diary';
    const isGlassTheme = actualTheme === 'glass';

    const [currentWeekBonus, setCurrentWeekBonus] = useState(null);
    const [isChecking, setIsChecking] = useState(true);
    const [weekDayStatuses, setWeekDayStatuses] = useState([]);

    // 날짜를 YYYY-MM-DD 형식으로 변환
    const formatDateToString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // 이번 주의 날짜 배열 생성 (월~일)
    const getCurrentWeekDates = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const day = today.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        const dates = [];
        const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push({
                dateStr: formatDateToString(date),
                dayName: dayNames[i],
                dateObj: date
            });
        }

        return dates;
    };

    // 현재 주와 지난 주 보너스 상태 확인
    useEffect(() => {
        const checkBonusStatus = async () => {
            if (!user) {
                setIsChecking(false);
                return;
            }

            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = formatDateToString(today);

                // 현재 주 보너스 상태 확인
                const currentWeekStatus = await checkWeekBonusStatus(user.uid, today);
                setCurrentWeekBonus(currentWeekStatus);

                // 이번 주 날짜별 작성 상태 확인
                const weekDates = getCurrentWeekDates();

                // 이번 주 일기 조회
                const monday = weekDates[0].dateStr;
                const sunday = weekDates[6].dateStr;
                const diariesRef = collection(db, 'diaries');
                const weekQuery = query(
                    diariesRef,
                    where('userId', '==', user.uid),
                    where('date', '>=', monday),
                    where('date', '<=', sunday)
                );

                const querySnapshot = await getDocs(weekQuery);
                const writtenDates = new Set();

                querySnapshot.forEach(doc => {
                    const diary = doc.data();
                    const diaryDate = diary.date;
                    const createdAt = diary.createdAt?.toDate?.() || new Date(diary.createdAt);
                    const createdAtStr = formatDateToString(createdAt);

                    // 현재 주인 경우: createdAt이 해당 날짜인지 확인
                    if (createdAtStr === diaryDate) {
                        writtenDates.add(diaryDate);
                    }
                });

                // 각 날짜별 상태 설정
                const statuses = weekDates.map(({ dateStr, dayName, dateObj }) => {
                    const isFuture = dateObj > today;
                    const isToday = dateStr === todayStr;
                    const isWritten = writtenDates.has(dateStr);

                    let status = '?'; // 미래
                    if (!isFuture) {
                        if (isWritten) {
                            status = 'O';
                        } else if (isToday) {
                            // 오늘이고 아직 작성하지 않은 경우 연필 아이콘
                            status = 'P';
                        } else {
                            // 과거 날짜이고 작성하지 않은 경우
                            status = 'X';
                        }
                    }

                    return {
                        dateStr,
                        dayName,
                        status
                    };
                });

                setWeekDayStatuses(statuses);
            } catch (error) {
                console.error('보너스 상태 확인 실패:', error);
            } finally {
                setIsChecking(false);
            }
        };

        checkBonusStatus();
    }, [user]);


    if (isChecking) {
        return null; // 로딩 중에는 표시하지 않음
    }

    // 이번 주 진행도 표시 (날짜별 상태가 있으면 표시)
    const showCurrentWeekProgress = weekDayStatuses.length > 0;

    // 날짜별 상태가 없으면 숨김
    if (!showCurrentWeekProgress) {
        return null;
    }

    return (
        <BonusCard
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
        >
            <BonusContent
                $isDiaryTheme={isDiaryTheme}
                $isGlassTheme={isGlassTheme}
                theme={theme}
            >
                {/* 날짜별 상태 표시 - 항상 표시 */}
                {weekDayStatuses.length > 0 && (
                    <WeekStatusGrid>
                        {weekDayStatuses.map(({ dateStr, dayName, status }) => (
                            <DayStatus key={dateStr}>
                                <DayLabel
                                    $isDiaryTheme={isDiaryTheme}
                                    $isGlassTheme={isGlassTheme}
                                    theme={theme}
                                >
                                    {dayName}
                                </DayLabel>
                                <DayIndicator
                                    status={status}
                                    $isDiaryTheme={isDiaryTheme}
                                    $isGlassTheme={isGlassTheme}
                                >
                                    {status === 'P' ? 'GO' : status}
                                </DayIndicator>
                            </DayStatus>
                        ))}
                    </WeekStatusGrid>
                )}

            </BonusContent>
        </BonusCard>
    );
};

export default WeeklyBonusCard;

