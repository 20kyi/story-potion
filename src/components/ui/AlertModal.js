import React from "react";
import styled from 'styled-components';
import { useTranslation } from '../../LanguageContext';
import { useTheme } from '../../ThemeContext';

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
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;

const ModalContainer = styled.div`
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '#faf8f3';
        if (theme.mode === 'dark') return '#2a2a2a';
        return '#fff';
    }};
    backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
    -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
    border-radius: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '24px';
        if ($isDiaryTheme) return '20px';
        return '16px';
    }};
    border: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return 'none';
    }};
    box-shadow: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)';
        if (theme.mode === 'dark') return '0 8px 32px rgba(0, 0, 0, 0.4)';
        return '0 8px 32px rgba(0, 0, 0, 0.2)';
    }};
    padding: 24px;
    max-width: 400px;
    width: 100%;
    animation: alertModalSlideIn 0.3s ease-out;
    color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if (theme.mode === 'dark') return '#fff';
        return 'inherit';
    }};
    
    @keyframes alertModalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const ModalTitle = styled.h3`
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        if (theme.mode === 'dark') return '#fff';
        return '#333';
    }};
    text-align: center;
`;

const ModalMessage = styled.p`
    margin: 0 0 24px 0;
    font-size: 15px;
    line-height: 1.6;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.7)';
        if ($isDiaryTheme) return '#5C4B37';
        if (theme.mode === 'dark') return '#ccc';
        return '#666';
    }};
    text-align: center;
    white-space: pre-line;
`;

const ModalActions = styled.div`
    display: flex;
    justify-content: center;
    gap: 12px;
`;

const ConfirmButton = styled.button`
    padding: 12px 24px;
    border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : 'none'};
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    min-width: 100px;
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return 'rgba(203, 101, 101, 0.2)';
        if (theme.mode === 'dark') return '#cb6565';
        return '#cb6565';
    }};
    backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
    -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
    color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if (theme.mode === 'dark') return '#fff';
        return '#fff';
    }};
    
    &:hover {
        background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) return 'rgba(203, 101, 101, 0.3)';
        if (theme.mode === 'dark') return '#b85555';
        return '#b85555';
    }};
    }
    
    &:active {
        transform: scale(0.98);
    }
`;

const AlertModal = ({ open, title, message, onClose, confirmText }) => {
    const { t } = useTranslation();
    const { actualTheme } = useTheme();
    const isDiaryTheme = actualTheme === 'diary';
    const isGlassTheme = actualTheme === 'glass';

    if (!open) return null;

    return (
        <ModalOverlay $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>
            <ModalContainer $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={(e) => e.stopPropagation()}>
                {title && <ModalTitle $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{title}</ModalTitle>}
                {message && <ModalMessage $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{message}</ModalMessage>}
                <ModalActions>
                    <ConfirmButton $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>{confirmText || t('confirm')}</ConfirmButton>
                </ModalActions>
            </ModalContainer>
        </ModalOverlay>
    );
};

export default AlertModal;
