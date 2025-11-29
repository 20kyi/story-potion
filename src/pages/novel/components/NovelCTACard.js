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
                background: isDiaryTheme ? '#fffef9' : (theme.novelProgressCardBg || '#FFFFFF'),
                border: isDiaryTheme ? '2px solid rgba(139, 111, 71, 0.25)' : `1px solid ${theme.novelProgressCardBorder || '#E5E5E5'}`,
                transform: isDiaryTheme ? 'rotate(-0.3deg)' : 'none'
            }}
        >
            <div
                className={`novel-cta-content ${isDiaryTheme ? 'diary-theme' : ''}`}
                style={{
                    color: isDiaryTheme ? '#5C4B37' : theme.text
                }}
            >
                <div className="novel-cta-progress">
                    <div className="novel-cta-progress-text" style={{ color: theme.subText || '#888' }}>
                        <span>{t('novel_this_week_progress') || '이번주 일기 진행도'}</span>
                        <span>{count}/{total}</span>
                    </div>
                    <div className="novel-cta-progress-bar" style={{ background: theme.novelProgressBarBg || '#E5E5E5' }}>
                        <div
                            className="novel-cta-progress-fill"
                            style={{
                                width: `${progress}%`,
                                background: theme.novelProgressBarFill || 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NovelCTACard;

