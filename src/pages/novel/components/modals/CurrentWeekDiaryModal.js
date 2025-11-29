import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../ThemeContext';
import { useTranslation } from '../../../../LanguageContext';
import './CurrentWeekDiaryModal.css';

const CurrentWeekDiaryModal = ({ 
    isOpen, 
    diaries, 
    onClose,
    onDiaryClick 
}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { t } = useTranslation();

    if (!isOpen) return null;

    const handleDiaryClick = (diary) => {
        if (onDiaryClick) {
            onDiaryClick(diary);
        } else {
            navigate('/diary/view', {
                state: {
                    date: diary.date,
                    diary: diary
                }
            });
        }
        onClose();
    };

    return (
        <div className="novel-current-week-diary-modal" onClick={onClose}>
            <div className="novel-current-week-diary-content" onClick={(e) => e.stopPropagation()}>
                <div className="novel-current-week-diary-header">
                    <h3 className="novel-current-week-diary-title" style={{ color: theme.text }}>
                        {t('novel_this_week_diaries') || '이번주 일기 목록'}
                    </h3>
                    <button className="novel-current-week-diary-close" onClick={onClose} style={{ color: theme.text }}>
                        ×
                    </button>
                </div>
                <div className="novel-current-week-diary-list">
                    {diaries.length === 0 ? (
                        <div className="novel-current-week-diary-empty" style={{ color: theme.subText || '#888' }}>
                            {t('novel_no_this_week_diaries') || '이번주에 작성한 일기가 없습니다.'}
                        </div>
                    ) : (
                        diaries.map((diary, index) => {
                            const diaryDate = new Date(diary.date);
                            const dateStr = `${diaryDate.getFullYear()}년 ${diaryDate.getMonth() + 1}월 ${diaryDate.getDate()}일`;

                            // 이미지가 있으면 첫 번째 이미지 사용, 없으면 이모티콘 표시
                            const hasImage = diary.imageUrls && diary.imageUrls.length > 0;
                            const imageUrl = hasImage ? diary.imageUrls[0] : null;

                            return (
                                <div
                                    key={index}
                                    className="novel-current-week-diary-item"
                                    onClick={() => handleDiaryClick(diary)}
                                >
                                    {imageUrl ? (
                                        <img className="novel-current-week-diary-image" src={imageUrl} alt="일기 이미지" />
                                    ) : (
                                        <div className="novel-current-week-diary-image-placeholder">
                                            📝
                                        </div>
                                    )}
                                    <div className="novel-current-week-diary-info">
                                        <div className="novel-current-week-diary-date" style={{ color: theme.subText || '#888' }}>{dateStr}</div>
                                        <div className="novel-current-week-diary-title-text" style={{ color: theme.text }}>
                                            {diary.title || t('diary_no_title') || '제목 없음'}
                                        </div>
                                        {diary.content && (
                                            <div className="novel-current-week-diary-preview" style={{ color: theme.subText || '#888' }}>
                                                {diary.content}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurrentWeekDiaryModal;

