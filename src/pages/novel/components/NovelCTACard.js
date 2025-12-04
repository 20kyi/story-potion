import React from 'react';
import { useTheme } from '../../../ThemeContext';
import { useTranslation } from '../../../LanguageContext';
import './NovelCTACard.css';

const NovelCTACard = ({ isDiaryTheme, isGlassTheme, genreStats }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    // 장르별 색상 정의
    const genreColors = {
        '로맨스': { bg: 'rgba(255, 182, 193, 0.3)', border: 'rgba(255, 182, 193, 0.6)', text: '#FF69B4' },
        '추리': { bg: 'rgba(128, 128, 128, 0.3)', border: 'rgba(128, 128, 128, 0.6)', text: '#808080' },
        '역사': { bg: 'rgba(184, 134, 11, 0.3)', border: 'rgba(184, 134, 11, 0.6)', text: '#B8860B' },
        '동화': { bg: 'rgba(255, 218, 185, 0.3)', border: 'rgba(255, 218, 185, 0.6)', text: '#FFB347' },
        '판타지': { bg: 'rgba(138, 43, 226, 0.3)', border: 'rgba(138, 43, 226, 0.6)', text: '#8A2BE2' },
        '공포': { bg: 'rgba(139, 0, 0, 0.3)', border: 'rgba(139, 0, 0, 0.6)', text: '#8B0000' }
    };

    const genres = ['로맨스', '추리', '역사', '동화', '판타지', '공포'];
    const stats = genreStats || { counts: {}, percentages: {}, total: 0 };

    return (
        <div
            className={`novel-cta-card ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
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
                        <span>장르별 소설</span>
                        {stats.total > 0 && <span>총 {stats.total}개</span>}
                    </div>
                    {stats.total > 0 ? (
                        <div className="novel-cta-genre-chart">
                            {genres.map(genre => {
                                const percentage = stats.percentages[genre] || 0;
                                const count = stats.counts[genre] || 0;
                                const color = genreColors[genre];
                                return (
                                    <div key={genre} className="novel-cta-genre-item">
                                        <div className="novel-cta-genre-label">
                                            <span>{genre}</span>
                                            <span>{count}개 ({percentage.toFixed(0)}%)</span>
                                        </div>
                                        <div className={`novel-cta-progress-bar ${isGlassTheme ? 'glass-theme' : ''}`}>
                                            <div
                                                className={`novel-cta-progress-fill ${isGlassTheme ? 'glass-theme' : ''}`}
                                                style={{
                                                    width: `${percentage}%`,
                                                    background: color.bg,
                                                    border: `1px solid ${color.border}`
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="novel-cta-empty-message">
                            아직 생성한 소설이 없습니다
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NovelCTACard;

