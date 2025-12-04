import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../ThemeContext';
import { useTranslation } from '../../../LanguageContext';
import { useToast } from '../../../components/ui/ToastProvider';
import { claimWeeklyBonus, hasReceivedWeeklyBonus, checkLastWeekBonusStatus } from '../../../utils/weeklyBonus';
import PointIcon from '../../../components/icons/PointIcon';
import './NovelCTACard.css';

const NovelCTACard = ({ isDiaryTheme, isGlassTheme, currentWeekDiariesForProgress, onClick, user }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const toast = useToast();
    const [isClaiming, setIsClaiming] = useState(false);
    const [hasReceived, setHasReceived] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [lastWeekBonus, setLastWeekBonus] = useState(null);

    const getCurrentWeekProgress = () => {
        // createdAt이 해당 날짜인 일기만 카운트
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const formatDateToString = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const todayStr = formatDateToString(today);
        const validDiaries = currentWeekDiariesForProgress.filter(diary => {
            const createdAt = diary.createdAt?.toDate?.() || new Date(diary.createdAt);
            const createdAtStr = formatDateToString(createdAt);
            return createdAtStr === diary.date;
        });

        const count = validDiaries.length;
        const total = 7;
        const progress = Math.min(100, (count / total) * 100);
        return { progress, count, total };
    };

    const { progress, count, total } = getCurrentWeekProgress();
    const isCompleted = count === total;
    const remainingDays = total - count;

    // 현재 주와 지난 주 보너스 상태 확인
    useEffect(() => {
        const checkBonusStatus = async () => {
            if (!user) {
                setIsChecking(false);
                setLastWeekBonus(null);
                return;
            }

            try {
                const today = new Date();
                
                // 현재 주 보너스 상태 확인
                let currentWeekReceived = false;
                if (isCompleted) {
                    currentWeekReceived = await hasReceivedWeeklyBonus(user.uid, today);
                    setHasReceived(currentWeekReceived);
                } else {
                    setHasReceived(false);
                }

                // 지난 주 보너스 상태 항상 확인
                const lastWeekStatus = await checkLastWeekBonusStatus(user.uid);
                setLastWeekBonus(lastWeekStatus);
            } catch (error) {
                console.error('보너스 상태 확인 실패:', error);
                setLastWeekBonus(null);
            } finally {
                setIsChecking(false);
            }
        };

        checkBonusStatus();
    }, [user, isCompleted]);

    const handlePointClick = async (e, isLastWeek = false) => {
        e.stopPropagation(); // 카드 클릭 이벤트 방지

        if (!user || isClaiming) {
            return;
        }

        // 현재 주 보너스 클릭
        if (!isLastWeek && (hasReceived || !isCompleted)) {
            return;
        }

        // 지난 주 보너스 클릭
        if (isLastWeek && (!lastWeekBonus || !lastWeekBonus.canClaim)) {
            return;
        }

        setIsClaiming(true);
        try {
            const targetDate = isLastWeek ? (() => {
                // 지난 주의 일요일 계산
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dayOfWeek = today.getDay();
                const diff = dayOfWeek === 0 ? 7 : dayOfWeek;
                const lastWeekSunday = new Date(today);
                lastWeekSunday.setDate(today.getDate() - diff);
                return lastWeekSunday;
            })() : new Date();

            const result = await claimWeeklyBonus(user.uid, targetDate);
            
            if (result.success) {
                if (isLastWeek) {
                    setLastWeekBonus(null);
                    toast.showToast(`지난 주 일주일 연속 일기 작성 보너스 ${result.amount}포인트를 받았습니다!`, 'success');
                } else {
                    setHasReceived(true);
                    toast.showToast(`일주일 연속 일기 작성 보너스 ${result.amount}포인트를 받았습니다!`, 'success');
                }
                
                // 상태 재확인
                const today = new Date();
                if (isCompleted) {
                    const received = await hasReceivedWeeklyBonus(user.uid, today);
                    setHasReceived(received);
                }
                const lastWeekStatus = await checkLastWeekBonusStatus(user.uid);
                setLastWeekBonus(lastWeekStatus);
            }
        } catch (error) {
            console.error('보너스 지급 실패:', error);
            const errorMessage = error.message || '보너스 지급에 실패했습니다.';
            toast.showToast(errorMessage, 'error');
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <div
            className={`novel-cta-card ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
            onClick={onClick}
            style={{
                ...(isDiaryTheme ? {
                    background: '#fffef9',
                    border: '2px solid rgba(139, 111, 71, 0.25)',
                    transform: 'rotate(-0.3deg)'
                } : isGlassTheme ? {
                    // 글래스 테마는 CSS에서 처리
                    transform: 'none'
                } : {
                    // 일반 모드는 CSS에서 처리 (다크모드 지원)
                    transform: 'none'
                })
            }}
        >
            <div
                className={`novel-cta-content ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
                style={{
                    color: isDiaryTheme ? '#5C4B37' : isGlassTheme ? '#000000' : theme.text
                }}
            >
                <div className="novel-cta-progress">
                    <div className={`novel-cta-progress-text ${isGlassTheme ? 'glass-theme' : ''}`}>
                        <span>{t('novel_this_week_progress') || '이번주 일기 진행도'}</span>
                        <span>{count}/{total}</span>
                    </div>
                    <div className={`novel-cta-progress-bar ${isGlassTheme ? 'glass-theme' : ''}`}>
                        <div
                            className={`novel-cta-progress-fill ${isGlassTheme ? 'glass-theme' : ''} ${count === total && isGlassTheme ? 'completed' : ''}`}
                            style={{
                                width: `${progress}%`,
                                ...(count === total && isGlassTheme ? {
                                    background: '#d1c4e9',
                                    border: '1px solid rgba(209, 196, 233, 0.6)'
                                } : {})
                            }}
                        />
                    </div>
                </div>
                
                {/* 보너스 문구 및 포인트 이미지 */}
                <div className={`novel-cta-bonus-section ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                    {/* 지난 주 보너스 - 항상 표시 */}
                    {!isChecking && (
                        <div className="novel-cta-bonus-message">
                            {lastWeekBonus ? (
                                lastWeekBonus.canClaim ? (
                                    <>
                                        <span className={`novel-cta-bonus-text ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                                            지난 주 보너스 포인트 받기
                                        </span>
                                        <button
                                            className={`novel-cta-point-button ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
                                            onClick={(e) => handlePointClick(e, true)}
                                            disabled={isClaiming}
                                            title="지난 주 보너스 포인트 받기"
                                        >
                                            <PointIcon width={32} height={32} color="#FFD700" />
                                            <span className="novel-cta-point-amount">+10</span>
                                        </button>
                                    </>
                                ) : lastWeekBonus.isCompleted && lastWeekBonus.hasReceived ? (
                                    <span className={`novel-cta-bonus-text completed ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                                        지난 주 보너스 포인트를 받았습니다
                                    </span>
                                ) : (
                                    <span className={`novel-cta-bonus-text ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                                        지난 주: {lastWeekBonus.count}/7일 작성
                                    </span>
                                )
                            ) : (
                                <span className={`novel-cta-bonus-text ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                                    지난 주: 정보 없음
                                </span>
                            )}
                        </div>
                    )}

                    {/* 이번 주 보너스 */}
                    {isCompleted && !isChecking ? (
                        !hasReceived ? (
                            <div className="novel-cta-bonus-message">
                                <span className={`novel-cta-bonus-text ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                                    이번 주 보너스 포인트 받기
                                </span>
                                <button
                                    className={`novel-cta-point-button ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
                                    onClick={(e) => handlePointClick(e, false)}
                                    disabled={isClaiming}
                                    title="포인트 받기"
                                >
                                    <PointIcon width={32} height={32} color="#FFD700" />
                                    <span className="novel-cta-point-amount">+10</span>
                                </button>
                            </div>
                        ) : (
                            <div className="novel-cta-bonus-message">
                                <span className={`novel-cta-bonus-text completed ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                                    이번 주 보너스 포인트를 받았습니다!
                                </span>
                            </div>
                        )
                    ) : (
                        remainingDays > 0 && (
                            <div className="novel-cta-bonus-message">
                                <span className={`novel-cta-bonus-text ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                                    {remainingDays}일만 더 작성하면 포인트 지급
                                </span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default NovelCTACard;

