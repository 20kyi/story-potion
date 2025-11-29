import React from 'react';
import { useTheme } from '../../../ThemeContext';
import { useTranslation } from '../../../LanguageContext';
import './NovelCTACard.css';

const NovelCTACard = ({ isDiaryTheme, currentWeekDiariesForProgress, onClick }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    const getCurrentWeekProgress = () => {
        const count = currentWeekDiariesForProgress.length;
        const total = 7;
        const progress = Math.min(100, (count / total) * 100);
        return { progress, count, total };
    };

    const { progress, count, total } = getCurrentWeekProgress();

    return (
        <div
            className={`novel-cta-card ${isDiaryTheme ? 'diary-theme' : ''}`}
            onClick={onClick}
            style={{
                ...(isDiaryTheme ? {
                    background: '#fffef9',
                    border: '2px solid rgba(139, 111, 71, 0.25)',
                    transform: 'rotate(-0.3deg)'
                } : {
                    // 일반 모드는 CSS에서 처리 (다크모드 지원)
                    transform: 'none'
                })
            }}
        >
            <div
                className={`novel-cta-content ${isDiaryTheme ? 'diary-theme' : ''}`}
                style={{
                    color: isDiaryTheme ? '#5C4B37' : theme.text
                }}
            >
                <div className="novel-cta-progress">
                    <div className="novel-cta-progress-text">
                        <span>{t('novel_this_week_progress') || '이번주 일기 진행도'}</span>
                        <span>{count}/{total}</span>
                    </div>
                    <div className="novel-cta-progress-bar">
                        <div
                            className="novel-cta-progress-fill"
                            style={{
                                width: `${progress}%`
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NovelCTACard;

