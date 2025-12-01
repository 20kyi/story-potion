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
    background: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.3)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.25)';
        return 'rgba(0, 0, 0, 0.35)';
    }};
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s;
    
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
        return '18px';
    }};
    box-shadow: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)';
        if (theme.mode === 'dark') return '0 4px 24px rgba(0, 0, 0, 0.4)';
        return '0 4px 24px rgba(0, 0, 0, 0.18)';
    }};
    border: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return 'none';
    }};
    padding: 28px 22px 18px 22px;
    min-width: 270px;
    max-width: 90vw;
    text-align: center;
    animation: modalPop 0.22s cubic-bezier(.4, 1.6, .6, 1);
    color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if (theme.mode === 'dark') return '#fff';
        return 'inherit';
    }};
    
    @keyframes modalPop {
        from {
            transform: translateY(40px) scale(0.96);
            opacity: 0;
        }
        to {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
    }
`;

const ModalTitle = styled.h3`
    margin: 0 0 10px 0;
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        if (theme.mode === 'dark') return '#fff';
        return '#333';
    }};
`;

const ModalDesc = styled.p`
    margin: 0 0 22px 0;
    font-size: 13px;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.7)';
        if ($isDiaryTheme) return '#5C4B37';
        if (theme.mode === 'dark') return '#ccc';
        return '#444';
    }};
`;

const ModalActions = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
`;

const ModalButton = styled.button`
    flex: 1 1 0;
    padding: 10px 0;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
`;

const CancelButton = styled(ModalButton)`
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.1)';
        if (theme.mode === 'dark') return '#3a3a3a';
        return '#f2f2f2';
    }};
    backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
    -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
    border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : 'none'};
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        if (theme.mode === 'dark') return '#ccc';
        return '#555';
    }};
    
    &:hover {
        background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.15)';
        if (theme.mode === 'dark') return '#4a4a4a';
        return '#e0e0e0';
    }};
    }
`;

const DeleteButton = styled(ModalButton)`
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return 'rgba(219, 83, 85, 0.2)';
        if (theme.mode === 'dark') return '#db5355';
        return '#db5355';
    }};
    backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
    -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
    border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : 'none'};
    color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if (theme.mode === 'dark') return '#fff';
        return '#fff';
    }};
    
    &:hover {
        background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) return 'rgba(219, 83, 85, 0.3)';
        if (theme.mode === 'dark') return '#c52f32';
        return '#c52f32';
    }};
    }
`;

const ConfirmModal = ({ open, title, description, onCancel, onConfirm, confirmText = '삭제', cancelText }) => {
    const { t } = useTranslation();
    const { actualTheme } = useTheme();
    const isDiaryTheme = actualTheme === 'diary';
    const isGlassTheme = actualTheme === 'glass';

    if (!open) return null;

    return (
        <ModalOverlay $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
            <ModalContainer $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                {title && <ModalTitle $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{title}</ModalTitle>}
                {description && <ModalDesc $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{description}</ModalDesc>}
                <ModalActions>
                    <CancelButton $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onCancel}>{cancelText || t('cancel')}</CancelButton>
                    <DeleteButton $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onConfirm}>{confirmText}</DeleteButton>
                </ModalActions>
            </ModalContainer>
        </ModalOverlay>
    );
};

export default ConfirmModal;
