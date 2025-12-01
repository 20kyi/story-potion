import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createNovelUrl } from '../../../utils/novelUtils';
import { useTheme } from '../../../ThemeContext';
import { useTranslation } from '../../../LanguageContext';
import './LibrarySection.css';

const LibrarySection = ({
    title,
    icon,
    novels,
    isDiaryTheme,
    isGlassTheme,
    moreLinkPath,
    emptyMessage
}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <div className="novel-library-section">
            <div className="novel-section-header">
                <h2 className={`novel-section-title ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}>
                    {icon} {title}
                </h2>
                {novels.length > 0 && (
                    <button
                        className={`novel-more-link ${isDiaryTheme ? 'diary-theme' : ''} ${isGlassTheme ? 'glass-theme' : ''}`}
                        onClick={() => navigate(moreLinkPath)}
                    >
                        더보기 →
                    </button>
                )}
            </div>
            <div className={isGlassTheme ? 'novel-content-wrapper glass-theme' : 'novel-content-wrapper'}>
                {novels.length > 0 ? (
                    <div className="novel-row">
                        {novels.map(novel => (
                            <div
                                key={novel.id}
                                className="novel-box"
                                onClick={() => {
                                    const url = novel.userId
                                        ? `/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}?userId=${novel.userId}`
                                        : `/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}`;
                                    navigate(url, novel.userId ? { state: { returnPath: '/novel' } } : {});
                                }}
                            >
                                <img
                                    className="novel-cover-image"
                                    src={novel.imageUrl || '/novel_banner/default.png'}
                                    alt={novel.title}
                                />
                                <div className="novel-title" style={{ color: theme.text }}>{novel.title}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="novel-empty-state" style={{ color: theme.subText || '#888' }}>
                        {emptyMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibrarySection;

