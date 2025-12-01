import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { createNovelUrl, getGenreKey } from '../../../../utils/novelUtils';
import { useTheme } from '../../../../ThemeContext';
import { useTranslation } from '../../../../LanguageContext';

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.3)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.25)';
        return 'rgba(0, 0, 0, 0.5)';
    }};
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '#faf8f3';
        if (theme.mode === 'dark') return '#2A2A2A';
        return 'white';
    }};
    backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
    -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
    border-radius: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '24px';
        if ($isDiaryTheme) return '20px';
        return '15px';
    }};
    border: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return 'none';
    }};
    box-shadow: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)';
        if (theme.mode === 'dark') return '0 4px 24px rgba(0, 0, 0, 0.4)';
        return '0 4px 24px rgba(0, 0, 0, 0.18)';
    }};
    padding: 20px;
    width: 90%;
    max-width: 400px;
    max-height: 70vh;
    overflow-y: auto;
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const ModalTitle = styled.h3`
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return '#cb6565';
    }};
    margin: 0;
    font-size: 20px;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return '#cb6565';
    }};
    font-size: 24px;
    cursor: pointer;
    padding: 8px;
`;

const NovelItem = styled.div`
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '10px'};
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 10px;
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.1)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.05)';
        if (theme.mode === 'dark') return 'rgba(255, 255, 255, 0.05)';
        return '#f9f9f9';
    }};
    
    &:hover {
        background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.15)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.08)';
        if (theme.mode === 'dark') return 'rgba(255, 255, 255, 0.1)';
        return '#f0f0f0';
    }};
    }
    
    &:last-child {
        margin-bottom: 0;
    }
`;

const NovelCover = styled.img`
    width: 60px;
    height: 90px;
    object-fit: cover;
    border-radius: 8px;
    flex-shrink: 0;
`;

const NovelInfo = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
`;

const NovelTitle = styled.div`
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#5C4B37';
        return theme.text || '#333';
    }};
`;

const NovelGenre = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.7)';
        if ($isDiaryTheme) return '#8B6F47';
        return '#cb6565';
    }};
`;

const NovelListModal = ({
    novels,
    isDiaryTheme,
    onClose
}) => {
    const navigate = useNavigate();
    const theme = useTheme();
    const { actualTheme } = theme;
    const isGlassTheme = actualTheme === 'glass';
    const { t } = useTranslation();

    if (!novels || novels.length === 0) return null;

    return (
        <ModalOverlay $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>
            <ModalContent theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>소설 선택</ModalTitle>
                    <CloseButton theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>×</CloseButton>
                </ModalHeader>
                {novels.map((novel) => {
                    const genreKey = getGenreKey(novel.genre);

                    return (
                        <NovelItem
                            key={novel.id}
                            theme={theme}
                            $isGlassTheme={isGlassTheme}
                            $isDiaryTheme={isDiaryTheme}
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
                            <NovelCover
                                src={novel.imageUrl || '/novel_banner/default.png'}
                                alt={novel.title}
                            />
                            <NovelInfo>
                                <NovelTitle theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{novel.title}</NovelTitle>
                                <NovelGenre theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                                    {genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}
                                </NovelGenre>
                            </NovelInfo>
                        </NovelItem>
                    );
                })}
            </ModalContent>
        </ModalOverlay>
    );
};

export default NovelListModal;
