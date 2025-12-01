import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../ThemeContext';
import { useTranslation } from '../../../../LanguageContext';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.3)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.25)';
        return 'rgba(0, 0, 0, 0.5)';
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
`;

const ModalContent = styled.div`
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '#faf8f3';
        if (theme.mode === 'dark') return '#2A2A2A';
        return '#FFFFFF';
    }};
    backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
    -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
    border-radius: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '24px';
        if ($isDiaryTheme) return '20px';
        return '20px';
    }};
    border: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return 'none';
    }};
    box-shadow: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)';
        if (theme.mode === 'dark') return '0 4px 20px rgba(0, 0, 0, 0.4)';
        return '0 4px 20px rgba(0, 0, 0, 0.3)';
    }};
    padding: 24px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if (theme.mode === 'dark') return '#fff';
        return 'inherit';
    }};
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.text || '#333';
    }};
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: opacity 0.2s;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.text || '#333';
    }};
    
    &:hover {
        opacity: 1;
    }
`;

const DiaryList = styled.div`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const DiaryItem = styled.div`
    display: flex;
    gap: 12px;
    padding: 16px;
    border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '12px'};
    cursor: pointer;
    transition: all 0.2s;
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.1)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.05)';
        if (theme.mode === 'dark') return '#3A3A3A';
        return '#fdfdfd';
    }};
    
    &:hover {
        transform: translateY(-2px);
        background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.15)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.08)';
        if (theme.mode === 'dark') return '#4A4A4A';
        return '#EEEEEE';
    }};
    }
`;

const DiaryImage = styled.img`
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
`;

const ImagePlaceholder = styled.div`
    width: 80px;
    height: 80px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    flex-shrink: 0;
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.1)';
        if (theme.mode === 'dark') return '#4A4A4A';
        return '#E5E5E5';
    }};
`;

const DiaryInfo = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const DiaryDate = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.7)';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.subText || '#888';
    }};
`;

const DiaryTitleText = styled.div`
    font-size: 16px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#5C4B37';
        return theme.text || '#333';
    }};
`;

const DiaryPreview = styled.div`
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.4;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.7)';
        if ($isDiaryTheme) return '#5C4B37';
        return theme.subText || '#888';
    }};
`;

const EmptyMessage = styled.div`
    text-align: center;
    padding: 40px 20px;
    font-size: 14px;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.7)';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.subText || '#888';
    }};
`;

const CurrentWeekDiaryModal = ({
    isOpen,
    diaries,
    onClose,
    onDiaryClick
}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { actualTheme } = theme;
    const isDiaryTheme = actualTheme === 'diary';
    const isGlassTheme = actualTheme === 'glass';
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
        <ModalOverlay $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>
            <ModalContent theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                        {t('novel_this_week_diaries') || '이번주 일기 목록'}
                    </ModalTitle>
                    <CloseButton theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>
                        ×
                    </CloseButton>
                </ModalHeader>
                <DiaryList>
                    {diaries.length === 0 ? (
                        <EmptyMessage theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                            {t('novel_no_this_week_diaries') || '이번주에 작성한 일기가 없습니다.'}
                        </EmptyMessage>
                    ) : (
                        diaries.map((diary, index) => {
                            const diaryDate = new Date(diary.date);
                            const dateStr = `${diaryDate.getFullYear()}년 ${diaryDate.getMonth() + 1}월 ${diaryDate.getDate()}일`;

                            const hasImage = diary.imageUrls && diary.imageUrls.length > 0;
                            const imageUrl = hasImage ? diary.imageUrls[0] : null;

                            return (
                                <DiaryItem
                                    key={index}
                                    theme={theme}
                                    $isGlassTheme={isGlassTheme}
                                    $isDiaryTheme={isDiaryTheme}
                                    onClick={() => handleDiaryClick(diary)}
                                >
                                    {imageUrl ? (
                                        <DiaryImage src={imageUrl} alt="일기 이미지" />
                                    ) : (
                                        <ImagePlaceholder theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                                            📝
                                        </ImagePlaceholder>
                                    )}
                                    <DiaryInfo>
                                        <DiaryDate theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{dateStr}</DiaryDate>
                                        <DiaryTitleText theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                                            {diary.title || t('diary_no_title') || '제목 없음'}
                                        </DiaryTitleText>
                                        {diary.content && (
                                            <DiaryPreview theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                                                {diary.content}
                                            </DiaryPreview>
                                        )}
                                    </DiaryInfo>
                                </DiaryItem>
                            );
                        })
                    )}
                </DiaryList>
            </ModalContent>
        </ModalOverlay>
    );
};

export default CurrentWeekDiaryModal;
