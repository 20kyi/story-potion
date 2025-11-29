import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createNovelUrl } from '../../../../utils/novelUtils';
import { useTheme } from '../../../../ThemeContext';
import { useTranslation } from '../../../../LanguageContext';
import './NovelListModal.css';

const NovelListModal = ({ 
    novels, 
    isDiaryTheme, 
    onClose 
}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    if (!novels || novels.length === 0) return null;

    return (
        <div className="novel-list-modal" onClick={onClose}>
            <div className="novel-list-content" onClick={(e) => e.stopPropagation()}>
                <div className="novel-list-header">
                    <h3 className="novel-list-title">소설 선택</h3>
                    <button className="novel-list-close" onClick={onClose}>×</button>
                </div>
                {novels.map((novel) => {
                    const genreKey = novel.genre === '로맨스' ? 'romance' :
                        novel.genre === '역사' ? 'historical' :
                            novel.genre === '추리' ? 'mystery' :
                                novel.genre === '공포' ? 'horror' :
                                    novel.genre === '동화' ? 'fairytale' :
                                        novel.genre === '판타지' ? 'fantasy' : null;

                    return (
                        <div
                            key={novel.id}
                            className="novel-list-item"
                            onClick={() => {
                                const novelKey = createNovelUrl(
                                    novel.year,
                                    novel.month,
                                    novel.weekNum,
                                    novel.genre,
                                    novel.id
                                );
                                navigate(`/novel/${novelKey}`);
                                onClose();
                            }}
                        >
                            <img
                                className="novel-list-cover"
                                src={novel.imageUrl || '/novel_banner/default.png'}
                                alt={novel.title}
                            />
                            <div className="novel-list-info">
                                <div className="novel-list-novel-title" style={{ color: theme.text }}>{novel.title}</div>
                                <div className={`novel-list-genre ${isDiaryTheme ? 'diary-theme' : ''}`}>
                                    {genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NovelListModal;

