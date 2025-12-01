import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../../../ThemeContext';

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
    position: relative;
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
    max-width: 400px;
    width: 100%;
    opacity: 1;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.text || '#333';
    }};
`;

const ModalTitle = styled.h3`
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 16px 0;
    text-align: center;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.text || '#333';
    }};
`;

const OptionButton = styled.button`
    width: 100%;
    padding: 16px;
    margin-bottom: 4px;
    border: 2px solid;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: none;
    
    &.free {
        background: ${({ $isGlassTheme }) => $isGlassTheme
        ? 'rgba(228, 163, 13, 0.2)'
        : 'linear-gradient(135deg, rgba(228, 163, 13, 0.2) 0%, rgba(255, 226, 148, 0.2) 100%)'};
        color: #e4a30d;
        border-color: ${({ $isGlassTheme }) => $isGlassTheme ? 'rgba(228, 163, 13, 0.7)' : '#e4a30d'};
        backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
        -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
    }
    
    &:not(.free) {
        background: ${({ $isGlassTheme }) => $isGlassTheme
        ? 'rgba(228, 98, 98, 0.2)'
        : 'linear-gradient(135deg, rgba(228, 98, 98, 0.15) 0%, rgba(203, 101, 101, 0.15) 100%)'};
        color: ${({ $isGlassTheme }) => $isGlassTheme ? '#000000' : '#e46262'};
        border-color: ${({ $isGlassTheme }) => $isGlassTheme ? 'rgba(228, 98, 98, 0.7)' : '#e46262'};
        backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
        -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
    }
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: ${({ $isGlassTheme }) => $isGlassTheme
        ? '0 4px 12px rgba(0, 0, 0, 0.15)'
        : '0 4px 12px rgba(0, 0, 0, 0.15)'};
    }
    
    &.free:hover {
        box-shadow: ${({ $isGlassTheme }) => $isGlassTheme
        ? '0 4px 12px rgba(0, 0, 0, 0.15)'
        : '0 4px 12px rgba(0, 0, 0, 0.15)'};
    }
    
    &:not(.free):hover {
        box-shadow: ${({ $isGlassTheme }) => $isGlassTheme
        ? '0 4px 12px rgba(0, 0, 0, 0.15)'
        : '0 4px 12px rgba(228, 98, 98, 0.2)'};
    }
    
    &:last-child {
        margin-bottom: 0;
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const OptionDesc = styled.div`
    font-size: 12px;
    margin-bottom: 8px;
    text-align: center;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.7)';
        if ($isDiaryTheme) return '#5C4B37';
        return theme.subText || '#666';
    }};
`;

const CreateOptionModal = ({
    isOpen,
    onClose,
    onSelectFree,
    onSelectPotion
}) => {
    const theme = useTheme();
    const { actualTheme } = theme;
    const isDiaryTheme = actualTheme === 'diary';
    const isGlassTheme = actualTheme === 'glass';

    if (!isOpen) return null;

    return (
        <ModalOverlay $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>
            <ModalContent theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={(e) => e.stopPropagation()}>
                <CloseButton theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>×</CloseButton>
                <ModalTitle theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>소설 생성 방법 선택</ModalTitle>
                <OptionButton className="free" $isGlassTheme={isGlassTheme} onClick={onSelectFree}>
                    🪄 프리미엄 무료권 사용
                </OptionButton>
                <OptionDesc theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} style={{ marginBottom: '12px' }}>
                    무료로 소설을 생성합니다 (매월 자동 충전)
                </OptionDesc>
                <OptionButton $isGlassTheme={isGlassTheme} onClick={onSelectPotion}>
                    🔮 포션 사용
                </OptionButton>
                <OptionDesc theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                    보유한 포션 1개를 사용합니다
                </OptionDesc>
            </ModalContent>
        </ModalOverlay>
    );
};

export default CreateOptionModal;
