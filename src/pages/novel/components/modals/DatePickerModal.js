import React from 'react';
import styled from 'styled-components';
import { useLanguage, useTranslation } from '../../../../LanguageContext';
import { useTheme } from '../../../../ThemeContext';

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
`;

const ModalContent = styled.div`
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
        if (theme.mode === 'dark') return '0 4px 24px rgba(0, 0, 0, 0.4)';
        return '0 4px 24px rgba(0, 0, 0, 0.18)';
    }};
    padding: 24px;
    max-width: 400px;
    width: 100%;
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
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        if (theme.mode === 'dark') return '#fff';
        return '#333';
    }};
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        if (theme.mode === 'dark') return '#fff';
        return '#666';
    }};
    cursor: pointer;
    padding: 8px;
    
    &:hover {
        opacity: 0.7;
    }
`;

const ButtonGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 24px;
`;

const DateButton = styled.button`
    padding: 12px;
    border: ${({ $selected, theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($selected) {
            if ($isGlassTheme) return '2px solid rgba(203, 101, 101, 0.8)';
            if ($isDiaryTheme) return '2px solid #8B6F47';
            return '2px solid #cb6565';
        }
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
        return '1px solid #ddd';
    }};
    border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '8px'};
    background: ${({ $selected, theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($selected) {
            if ($isGlassTheme) {
                const primary = theme.primary || '#cb6565';
                const r = parseInt(primary.slice(1, 3), 16);
                const g = parseInt(primary.slice(3, 5), 16);
                const b = parseInt(primary.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, 0.8)`;
            }
            if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.2)';
            return theme.primary || '#cb6565';
        }
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.05)';
        if (theme.mode === 'dark') return 'rgba(255, 255, 255, 0.05)';
        return 'transparent';
    }};
    backdrop-filter: ${({ $isGlassTheme, $selected }) => ($isGlassTheme && $selected) ? 'blur(10px)' : 'none'};
    -webkit-backdrop-filter: ${({ $isGlassTheme, $selected }) => ($isGlassTheme && $selected) ? 'blur(10px)' : 'none'};
    color: ${({ $selected, theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($selected) {
            if ($isGlassTheme) return '#000000';
            return '#fff';
        }
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        if (theme.mode === 'dark') return '#ccc';
        return '#333';
    }};
    font-size: 14px;
    font-weight: ${({ $selected }) => $selected ? '600' : '500'};
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
        background: ${({ $selected, theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($selected) {
            if ($isGlassTheme) {
                const primary = theme.primary || '#cb6565';
                const r = parseInt(primary.slice(1, 3), 16);
                const g = parseInt(primary.slice(3, 5), 16);
                const b = parseInt(primary.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, 0.9)`;
            }
            return theme.primary || '#cb6565';
        }
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.1)';
        if (theme.mode === 'dark') return 'rgba(255, 255, 255, 0.1)';
        return '#f0f0f0';
    }};
    }
`;

const DatePickerModal = ({
    isOpen,
    currentDate,
    onClose,
    onYearChange,
    onMonthChange
}) => {
    const { language } = useLanguage();
    const { t } = useTranslation();
    const { actualTheme } = useTheme();
    const isDiaryTheme = actualTheme === 'diary';
    const isGlassTheme = actualTheme === 'glass';
    const theme = useTheme();

    if (!isOpen) return null;

    return (
        <ModalOverlay $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>
            <ModalContent theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{t('novel_month_label')}</ModalTitle>
                    <CloseButton theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} onClick={onClose}>×</CloseButton>
                </ModalHeader>
                <ModalTitle theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{t('year')}</ModalTitle>
                <ButtonGrid>
                    {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((year) => (
                        <DateButton
                            key={year}
                            $selected={year === currentDate.getFullYear()}
                            theme={theme}
                            $isGlassTheme={isGlassTheme}
                            $isDiaryTheme={isDiaryTheme}
                            onClick={() => onYearChange(year)}
                        >
                            {year}
                        </DateButton>
                    ))}
                </ButtonGrid>
                <ModalTitle theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>{t('month')}</ModalTitle>
                <ButtonGrid>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <DateButton
                            key={month}
                            $selected={month === currentDate.getMonth() + 1}
                            theme={theme}
                            $isGlassTheme={isGlassTheme}
                            $isDiaryTheme={isDiaryTheme}
                            onClick={() => onMonthChange(month)}
                        >
                            {language === 'en' ? month : `${month}월`}
                        </DateButton>
                    ))}
                </ButtonGrid>
            </ModalContent>
        </ModalOverlay>
    );
};

export default DatePickerModal;
