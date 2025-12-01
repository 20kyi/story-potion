import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useTranslation } from '../../LanguageContext';
import { createNovelUrl } from '../../utils/novelUtils';
import { useTheme } from '../../ThemeContext';
import GridIcon from '../../components/icons/GridIcon';
import ListIcon from '../../components/icons/ListIcon';
import ConfirmModal from '../../components/ui/ConfirmModal';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: transparent;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? '#000000' : theme.text};
  padding: 20px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding: 0 4px;
`;

const TopBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const BottomBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
`;

const SelectAllCheckbox = styled.input`
  width: 24px;
  height: 24px;
  cursor: pointer;
  accent-color: #cb6565;
  min-width: 24px;
  min-height: 24px;
  touch-action: manipulation;
  flex-shrink: 0;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
`;

const Select = styled.select`
  padding: 12px 16px;
  border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid'};
  border-color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(255, 255, 255, 0.5)' : (theme.border || '#ddd')};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '8px'};
  background: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        return theme.card || '#fff';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? '#000000' : (theme.text || '#333')};
  font-size: 14px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: ${({ theme, $isGlassTheme }) => {
        const arrowColor = $isGlassTheme ? '%23000000' : (theme.mode === 'dark' ? '%23ccc' : '%23333');
        return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${arrowColor}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`;
    }};
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  padding-right: 36px;
  box-shadow: ${({ $isGlassTheme }) => $isGlassTheme ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none'};
  &:focus {
    outline: none;
    border-color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(255, 255, 255, 0.7)' : (theme.primary || '#cb6565')};
  }
`;

const ViewToggleRight = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: flex-end;
`;

const ViewToggleButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 24px;
  border: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '1.5px solid #8B6F47';
        return '1.5px solid';
    }};
  border-color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.primary || '#cb6565';
    }};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return 'transparent';
        return 'transparent';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  min-width: 90px;
  height: 36px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return 'none';
        return 'none';
    }};
  
  @media (min-width: 480px) {
    font-size: 13px;
    min-width: 100px;
    height: 36px;
  }
`;

const ToggleOption = styled.span`
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  svg {
    transition: stroke 0.3s ease;
    stroke: ${({ $active, $isGlassTheme, $isDiaryTheme }) => {
        if ($active && $isGlassTheme) return '#000000';
        if ($active && $isDiaryTheme) return '#fff';
        if ($active) return '#fff';
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.6)';
        if ($isDiaryTheme) return '#8B6F47';
        return '#888';
    }};
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  border-radius: 20px;
  transition: all 0.3s ease;
  z-index: 1;
  transform: ${({ $isList }) => $isList ? 'translateX(100%)' : 'translateX(0)'};
  background: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.4)';
        return 'rgba(203, 101, 101, 0.25)';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  border: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '1px solid rgba(255, 255, 255, 0.4)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.3)';
        return 'none';
    }};
  box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return '0 1px 4px rgba(139, 111, 71, 0.2)';
        return 'none';
    }};
  
  ${ViewToggleButton}:hover & {
    background: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.4)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.5)';
        return 'rgba(203, 101, 101, 0.35)';
    }};
    box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 4px 12px rgba(0, 0, 0, 0.15)';
        if ($isDiaryTheme) return '0 2px 6px rgba(139, 111, 71, 0.25)';
        return 'none';
    }};
  }
`;

const NovelListWrapper = styled.div`
  display: ${props => props.$viewMode === 'card' ? 'grid' : 'flex'};
  grid-template-columns: ${props => props.$viewMode === 'card' ? 'repeat(3, 1fr)' : 'none'};
  flex-direction: ${props => props.$viewMode === 'list' ? 'column' : 'row'};
  gap: ${props => props.$viewMode === 'card' ? '10px' : '20px'};
  padding-bottom: 20px;
`;

const NovelItem = styled.div`
  background: ${({ theme, $isGlassTheme, $viewMode }) => {
        if ($viewMode === 'card') return 'transparent';
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        return theme.card;
    }};
  backdrop-filter: ${({ $isGlassTheme, $viewMode }) => ($isGlassTheme && $viewMode !== 'card') ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme, $viewMode }) => ($isGlassTheme && $viewMode !== 'card') ? 'blur(15px)' : 'none'};
  border-radius: ${({ $isGlassTheme, $viewMode }) => {
        if ($viewMode === 'card') return '0';
        return $isGlassTheme ? '24px' : '12px';
    }};
  padding: ${props => props.$viewMode === 'card' ? '0' : '16px'};
  box-shadow: ${({ theme, $isGlassTheme, $selected, $viewMode }) => {
        if ($viewMode === 'card') return 'none';
        if ($isGlassTheme) {
            if ($selected) return '0 8px 24px rgba(203, 101, 101, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)';
            return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        }
        return theme.cardShadow;
    }};
  border: ${({ theme, $selected, $isGlassTheme, $viewMode }) => {
        if ($viewMode === 'card') return 'none';
        if ($isGlassTheme) {
            if ($selected) return '2px solid rgba(203, 101, 101, 0.8)';
            return '2px solid rgba(255, 255, 255, 0.5)';
        }
        if ($selected) return '1px solid #cb6565';
        return `1px solid ${theme.border}`;
    }};
  cursor: pointer;
  transition: ${props => props.$viewMode === 'card' ? 'transform 0.15s' : 'box-shadow 0.15s'};
  display: flex;
  flex-direction: ${props => props.$viewMode === 'card' ? 'column' : 'row'};
  align-items: ${props => props.$viewMode === 'card' ? 'center' : 'center'};
  gap: ${props => props.$viewMode === 'card' ? '8px' : '16px'};
  width: 100%;
  position: relative;
  &:hover {
    ${props => {
        if (props.$viewMode === 'card') {
            return 'transform: scale(1.02);';
        }
        if (props.$isGlassTheme) {
            return 'box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12);';
        }
        return 'box-shadow: 0 4px 16px rgba(0,0,0,0.10);';
    }}
  }
`;

const NovelCover = styled.img`
  width: ${props => props.$viewMode === 'card' ? '100%' : '80px'};
  max-width: ${props => props.$viewMode === 'card' ? 'none' : '80px'};
  aspect-ratio: 2/3;
  height: ${props => props.$viewMode === 'card' ? 'auto' : '120px'};
  object-fit: cover;
  border-radius: ${props => props.$viewMode === 'card' ? '8px' : '12px'};
  background: #E5E5E5;
  box-shadow: ${props => props.$viewMode === 'card' ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'};
  flex-shrink: 0;
`;

const NovelInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$viewMode === 'card' ? 'center' : 'flex-start'};
  justify-content: ${props => props.$viewMode === 'card' ? 'flex-start' : 'center'};
  gap: ${props => props.$viewMode === 'card' ? '3px' : '8px'};
  flex: 1;
  width: 100%;
`;

const NovelTitle = styled.div`
  font-size: ${props => props.$viewMode === 'card' ? '13px' : '15px'};
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? '#000000' : theme.text};
  font-weight: 600;
  margin-bottom: ${props => props.$viewMode === 'card' ? '0' : '4px'};
  text-align: ${props => props.$viewMode === 'card' ? 'center' : 'left'};
  word-break: keep-all;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: ${props => props.$viewMode === 'card' ? '1' : '2'};
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
`;

const NovelMeta = styled.div`
  font-size: ${props => props.$viewMode === 'card' ? '11px' : '12px'};
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#666')};
  display: flex;
  justify-content: ${props => props.$viewMode === 'card' ? 'center' : 'space-between'};
  align-items: center;
  width: 100%;
  gap: ${props => props.$viewMode === 'card' ? '8px' : '0'};
  margin-bottom: ${props => props.$viewMode === 'card' ? '4px' : '0'};
`;

const PurchaseBadge = styled.span`
  background: ${({ theme }) => theme.primary || '#cb6565'};
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#999')};
  font-size: 16px;
`;

const PublicToggleButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 24px;
  border: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '1.5px solid #8B6F47';
        return '1.5px solid';
    }};
  border-color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.primary || '#cb6565';
    }};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return 'transparent';
        return 'transparent';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  min-width: 70px;
  height: 28px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return 'none';
        return 'none';
    }};
`;

const PublicToggleOption = styled.span`
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 11px;
  color: ${({ $active, $isGlassTheme, $isDiaryTheme, theme }) => {
        if ($active && $isGlassTheme) return '#000000';
        if ($active && $isDiaryTheme) return '#fff';
        if ($active) return '#fff';
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.6)';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.mode === 'dark' ? '#aaa' : '#888';
    }};
`;

const PublicToggleSlider = styled.span`
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  border-radius: 20px;
  transition: all 0.3s ease;
  z-index: 1;
  transform: ${({ $isPublic }) => $isPublic ? 'translateX(0)' : 'translateX(100%)'};
  background: ${({ $isGlassTheme, $isDiaryTheme, theme, $isPublic }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) {
            return $isPublic ? '#8B6F47' : 'rgba(139, 111, 71, 0.4)';
        }
        const primary = theme.primary || '#cb6565';
        const r = parseInt(primary.slice(1, 3), 16);
        const g = parseInt(primary.slice(3, 5), 16);
        const b = parseInt(primary.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.25)`;
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  border: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '1px solid rgba(255, 255, 255, 0.4)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.3)';
        return 'none';
    }};
  box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return '0 1px 4px rgba(139, 111, 71, 0.2)';
        return 'none';
    }};
  
  ${PublicToggleButton}:hover & {
    background: ${({ $isGlassTheme, $isDiaryTheme, theme, $isPublic }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.4)';
        if ($isDiaryTheme) {
            return $isPublic ? '#7A5F3D' : 'rgba(139, 111, 71, 0.5)';
        }
        const primary = theme.primary || '#cb6565';
        const r = parseInt(primary.slice(1, 3), 16);
        const g = parseInt(primary.slice(3, 5), 16);
        const b = parseInt(primary.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.35)`;
    }};
    box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '0 4px 12px rgba(0, 0, 0, 0.15)';
        if ($isDiaryTheme) return '0 2px 6px rgba(139, 111, 71, 0.25)';
        return 'none';
    }};
  }
`;

const PublicStatus = styled.div`
  font-size: 12px;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#666')};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BatchActionBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        return theme.card || '#fff';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '24px' : '12px'};
  margin-bottom: 16px;
  box-shadow: ${({ $isGlassTheme }) => {
        if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        return '0 2px 8px rgba(0,0,0,0.08)';
    }};
  border: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        return `1px solid ${theme.border || '#f0f0f0'}`;
    }};
`;

const BatchActionTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const BatchActionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const Checkbox = styled.input`
  width: 24px;
  height: 24px;
  cursor: pointer;
  accent-color: #cb6565;
  min-width: 24px;
  min-height: 24px;
  touch-action: manipulation;
`;

const BatchActionText = styled.span`
  font-size: 15px;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? '#000000' : (theme.text || '#333')};
  font-weight: 500;
`;

const BatchActionButtons = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  flex-direction: column;
  
  @media (min-width: 400px) {
    flex-direction: row;
  }
`;

const BatchActionButton = styled.button`
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 48px;
  touch-action: manipulation;
  background: ${({ variant, theme }) => {
        if (variant === 'public') return '#cb6565';
        if (variant === 'private') return '#666';
        return theme.card || '#fdfdfd';
    }};
  color: ${({ variant }) => variant ? '#fff' : '#333'};
  flex: 1;
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const QuickActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  animation: slideIn 0.2s ease;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const QuickActionButton = styled.button`
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;
  touch-action: manipulation;
  white-space: nowrap;
  background: ${({ variant }) => {
        if (variant === 'public') return '#cb6565';
        if (variant === 'private') return '#666';
        return 'transparent';
    }};
  color: #fff;
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const NovelCheckbox = styled.input`
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  z-index: 10;
  accent-color: #cb6565;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  padding: 10px 16px;
  border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : '1px solid'};
  border-color: ${({ theme, $isGlassTheme, $active }) => {
        if ($isGlassTheme) {
            if ($active) return 'rgba(203, 101, 101, 0.8)';
            return 'rgba(255, 255, 255, 0.5)';
        }
        if ($active) return '#cb6565';
        return theme.border || '#ddd';
    }};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '8px'};
  background: ${({ theme, $active, $isGlassTheme }) => {
        if ($isGlassTheme) {
            if ($active) return 'rgba(203, 101, 101, 0.8)';
            return 'rgba(255, 255, 255, 0.2)';
        }
        if ($active) return '#cb6565';
        return theme.card || '#fff';
    }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  color: ${({ $active, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($active) return '#fff';
        return '#333';
    }};
  font-size: 14px;
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s;
  min-width: 44px;
  min-height: 44px;
  touch-action: manipulation;
  box-shadow: ${({ $isGlassTheme, $active }) => {
        if ($isGlassTheme && $active) return '0 4px 12px rgba(203, 101, 101, 0.3)';
        if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
        return 'none';
    }};
  
  &:hover:not(:disabled) {
    background: ${({ theme, $active, $isGlassTheme }) => {
        if ($isGlassTheme) {
            if ($active) return 'rgba(203, 101, 101, 0.9)';
            return 'rgba(255, 255, 255, 0.3)';
        }
        if ($active) return '#cb6565';
        return '#fdfdfd';
    }};
    border-color: ${({ theme, $isGlassTheme, $active }) => {
        if ($isGlassTheme && $active) return 'rgba(203, 101, 101, 1)';
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.7)';
        return theme.primary || '#cb6565';
    }};
    box-shadow: ${({ $isGlassTheme, $active }) => {
        if ($isGlassTheme && $active) return '0 6px 16px rgba(203, 101, 101, 0.4)';
        if ($isGlassTheme) return '0 4px 12px rgba(0, 0, 0, 0.15)';
        return 'none';
    }};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const PaginationInfo = styled.div`
  font-size: 14px;
  color: ${({ theme, $isGlassTheme }) => $isGlassTheme ? 'rgba(0, 0, 0, 0.7)' : (theme.cardSubText || '#666')};
  margin: 0 8px;
  white-space: nowrap;
`;

function CompletedNovels({ user }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();
    const { actualTheme } = theme;
    const isGlassTheme = actualTheme === 'glass';
    const isDiaryTheme = actualTheme === 'diary';
    const [novels, setNovels] = useState([]);
    const [filteredNovels, setFilteredNovels] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('all');
    const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'popular'
    const [novelsLoading, setNovelsLoading] = useState(true);
    // localStorage에서 저장된 viewMode를 가져오거나 기본값 'card' 사용
    const [viewMode, setViewMode] = useState(() => {
        const savedViewMode = localStorage.getItem('completedNovelsViewMode');
        return savedViewMode === 'list' ? 'list' : 'card';
    });
    const [privateConfirmOpen, setPrivateConfirmOpen] = useState(false);
    const [novelToToggle, setNovelToToggle] = useState(null);
    const [selectedNovels, setSelectedNovels] = useState(new Set());
    const [showCheckboxes, setShowCheckboxes] = useState(false);
    const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
    const [batchAction, setBatchAction] = useState(null); // 'public' or 'private'
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // 완성된 소설 목록 가져오기
    useEffect(() => {
        if (!user) return;

        const fetchNovels = async () => {
            setNovelsLoading(true);
            try {
                const novelsRef = collection(db, 'novels');
                const novelsQ = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
                const novelsSnap = await getDocs(novelsQ);
                const fetchedNovels = novelsSnap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(novel => novel.deleted !== true); // 삭제되지 않은 소설만

                // 구매자 수 조회 (최적화: 모든 사용자의 viewedNovels를 한 번에 조회)
                const usersRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersRef);
                const purchaseCountMap = {};

                // 각 사용자의 viewedNovels를 조회하여 구매자 수 집계
                const countPromises = usersSnapshot.docs.map(async (userDoc) => {
                    try {
                        const viewedNovelsRef = collection(db, 'users', userDoc.id, 'viewedNovels');
                        const viewedSnap = await getDocs(viewedNovelsRef);
                        viewedSnap.docs.forEach(viewedDoc => {
                            const novelId = viewedDoc.id;
                            purchaseCountMap[novelId] = (purchaseCountMap[novelId] || 0) + 1;
                        });
                    } catch (error) {
                        // 개별 사용자 조회 실패는 무시
                    }
                });

                await Promise.all(countPromises);

                // 소설에 구매자 수 추가
                const novelsWithPurchaseCount = fetchedNovels.map(novel => ({
                    ...novel,
                    purchaseCount: purchaseCountMap[novel.id] || 0
                }));

                setNovels(novelsWithPurchaseCount);
            } catch (error) {
                console.error('소설 목록 가져오기 실패:', error);
                setNovels([]);
            } finally {
                setNovelsLoading(false);
            }
        };

        fetchNovels();
    }, [user]);

    // 필터링 및 정렬
    useEffect(() => {
        let filtered = [...novels];

        // 장르 필터
        if (selectedGenre !== 'all') {
            filtered = filtered.filter(novel => novel.genre === selectedGenre);
        }

        // 정렬
        if (sortBy === 'latest') {
            filtered.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateB - dateA;
            });
        } else if (sortBy === 'oldest') {
            filtered.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return dateA - dateB;
            });
        } else if (sortBy === 'popular') {
            filtered.sort((a, b) => (b.purchaseCount || 0) - (a.purchaseCount || 0));
        }

        setFilteredNovels(filtered);
        // 필터/정렬 변경 시 첫 페이지로 리셋
        setCurrentPage(1);
    }, [novels, selectedGenre, sortBy]);

    // 사용 가능한 장르 목록
    const availableGenres = ['all', ...new Set(novels.map(n => n.genre).filter(Boolean))];

    const getGenreKey = (genre) => {
        const genreMap = {
            '로맨스': 'romance',
            '추리': 'mystery',
            '역사': 'historical',
            '동화': 'fairytale',
            '판타지': 'fantasy',
            '공포': 'horror'
        };
        return genreMap[genre] || null;
    };

    const handleTogglePublic = async (novel, e) => {
        e.stopPropagation(); // 소설 클릭 이벤트 방지
        if (!novel || !novel.id) return;

        // 비공개로 전환하는 경우에만 확인 모달 표시
        if (novel.isPublic !== false) {
            setNovelToToggle(novel);
            setPrivateConfirmOpen(true);
            return;
        }

        // 공개로 전환하는 경우 바로 실행
        const newIsPublic = !novel.isPublic;
        try {
            await updateDoc(doc(db, 'novels', novel.id), {
                isPublic: newIsPublic
            });
            // 로컬 상태 업데이트
            setNovels(prevNovels =>
                prevNovels.map(n =>
                    n.id === novel.id ? { ...n, isPublic: newIsPublic } : n
                )
            );
        } catch (error) {
            console.error('공개 설정 변경 실패:', error);
        }
    };

    const confirmTogglePrivate = async () => {
        setPrivateConfirmOpen(false);
        if (!novelToToggle || !novelToToggle.id) return;

        const newIsPublic = false;
        try {
            await updateDoc(doc(db, 'novels', novelToToggle.id), {
                isPublic: newIsPublic
            });
            // 로컬 상태 업데이트
            setNovels(prevNovels =>
                prevNovels.map(n =>
                    n.id === novelToToggle.id ? { ...n, isPublic: newIsPublic } : n
                )
            );
            setNovelToToggle(null);
        } catch (error) {
            console.error('공개 설정 변경 실패:', error);
        }
    };


    // 개별 소설 선택/해제
    const toggleNovelSelection = (novelId, e) => {
        e.stopPropagation();
        setSelectedNovels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(novelId)) {
                newSet.delete(novelId);
            } else {
                newSet.add(novelId);
            }
            return newSet;
        });
    };

    // 전체 선택/해제
    const toggleSelectAll = () => {
        if (!showCheckboxes) {
            // 처음 체크박스를 보이게 하고 전체 선택
            setShowCheckboxes(true);
            setSelectedNovels(new Set(filteredNovels.map(n => n.id)));
        } else if (selectedNovels.size === filteredNovels.length) {
            // 전체 해제 시 체크박스도 숨김
            setSelectedNovels(new Set());
            setShowCheckboxes(false);
        } else {
            // 전체 선택
            setSelectedNovels(new Set(filteredNovels.map(n => n.id)));
        }
    };

    // 일괄 처리
    const handleBatchAction = (action) => {
        if (selectedNovels.size === 0) return;

        // 비공개로 전환하는 경우에만 확인 모달 표시
        if (action === 'private') {
            setBatchAction(action);
            setBatchConfirmOpen(true);
        } else {
            // 공개로 전환하는 경우 바로 실행
            executeBatchAction(action);
        }
    };

    const executeBatchAction = async (action) => {
        if (selectedNovels.size === 0) return;

        const newIsPublic = action === 'public';
        const batch = writeBatch(db);
        const novelIds = Array.from(selectedNovels);

        try {
            // Firestore 배치 업데이트
            novelIds.forEach(novelId => {
                const novelRef = doc(db, 'novels', novelId);
                batch.update(novelRef, { isPublic: newIsPublic });
            });

            await batch.commit();

            // 로컬 상태 업데이트
            setNovels(prevNovels =>
                prevNovels.map(n =>
                    selectedNovels.has(n.id) ? { ...n, isPublic: newIsPublic } : n
                )
            );

            // 선택 초기화
            setSelectedNovels(new Set());
            setShowCheckboxes(false);
            setBatchConfirmOpen(false);
            setBatchAction(null);
        } catch (error) {
            console.error('일괄 처리 실패:', error);
        }
    };

    const confirmBatchPrivate = async () => {
        setBatchConfirmOpen(false);
        await executeBatchAction('private');
    };

    return (
        <Container theme={theme} $isGlassTheme={isGlassTheme}>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="완성된 소설" />

            <ViewToggle>
                <TopBar>
                    <FilterRow>
                        <FilterContainer>
                            <Select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} theme={theme} $isGlassTheme={isGlassTheme} disabled={showCheckboxes}>
                                <option value="all">전체 장르</option>
                                {availableGenres.filter(g => g !== 'all').map(genre => (
                                    <option key={genre} value={genre}>
                                        {getGenreKey(genre) ? t(`novel_genre_${getGenreKey(genre)}`) : genre}
                                    </option>
                                ))}
                            </Select>
                            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} theme={theme} $isGlassTheme={isGlassTheme} disabled={showCheckboxes}>
                                <option value="latest">최신순</option>
                                <option value="oldest">오래된순</option>
                                <option value="popular">인기순</option>
                            </Select>
                        </FilterContainer>
                    </FilterRow>
                    <BottomBar>
                        <SelectAllCheckbox
                            type="checkbox"
                            checked={selectedNovels.size === filteredNovels.length && filteredNovels.length > 0 && showCheckboxes}
                            onChange={toggleSelectAll}
                        />
                        {showCheckboxes && selectedNovels.size > 0 && (
                            <QuickActionButtons>
                                <QuickActionButton
                                    variant="public"
                                    onClick={() => handleBatchAction('public')}
                                >
                                    공개
                                </QuickActionButton>
                                <QuickActionButton
                                    variant="private"
                                    onClick={() => handleBatchAction('private')}
                                >
                                    비공개
                                </QuickActionButton>
                            </QuickActionButtons>
                        )}
                        <ActionButtonsContainer>
                            <ViewToggleButton
                                $isGlassTheme={isGlassTheme}
                                $isDiaryTheme={isDiaryTheme}
                                theme={theme}
                                onClick={() => {
                                    const newMode = viewMode === 'card' ? 'list' : 'card';
                                    setViewMode(newMode);
                                    localStorage.setItem('completedNovelsViewMode', newMode);
                                }}
                                aria-label={viewMode === 'card' ? '목록형으로 전환' : '카드형으로 전환'}
                            >
                                <ToggleOption $active={viewMode === 'card'} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                                    <GridIcon width={16} height={16} />
                                </ToggleOption>
                                <ToggleOption $active={viewMode === 'list'} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
                                    <ListIcon width={16} height={16} />
                                </ToggleOption>
                                <ToggleSlider $isList={viewMode === 'list'} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} />
                            </ViewToggleButton>
                        </ActionButtonsContainer>
                    </BottomBar>
                </TopBar>
            </ViewToggle>

            {showCheckboxes && selectedNovels.size > 0 && (
                <BatchActionBar theme={theme} $isGlassTheme={isGlassTheme}>
                    <BatchActionText theme={theme} $isGlassTheme={isGlassTheme}>
                        {selectedNovels.size}개 선택됨
                    </BatchActionText>
                </BatchActionBar>
            )}

            {novelsLoading ? (
                <div style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>{t('loading')}</div>
            ) : filteredNovels.length === 0 ? (
                <EmptyMessage theme={theme} $isGlassTheme={isGlassTheme}>완성된 소설이 없습니다.</EmptyMessage>
            ) : (
                <>
                    <NovelListWrapper $viewMode={viewMode}>
                        {filteredNovels
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((novel) => {
                                const genreKey = getGenreKey(novel.genre);
                                return (
                                    <NovelItem
                                        key={novel.id}
                                        $viewMode={viewMode}
                                        $selected={selectedNovels.has(novel.id)}
                                        $isGlassTheme={isGlassTheme}
                                        onClick={() => {
                                            if (!showCheckboxes) {
                                                navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}`);
                                            }
                                        }}
                                    >
                                        {showCheckboxes && (
                                            <NovelCheckbox
                                                type="checkbox"
                                                checked={selectedNovels.has(novel.id)}
                                                onChange={(e) => toggleNovelSelection(novel.id, e)}
                                            />
                                        )}
                                        <NovelCover
                                            src={novel.imageUrl || '/novel_banner/default.png'}
                                            alt={novel.title}
                                            $viewMode={viewMode}
                                        />
                                        <NovelInfo $viewMode={viewMode}>
                                            {viewMode === 'card' ? (
                                                <>
                                                    <NovelTitle $viewMode={viewMode} theme={theme} $isGlassTheme={isGlassTheme}>{novel.title}</NovelTitle>
                                                    <NovelMeta theme={theme} $viewMode={viewMode} $isGlassTheme={isGlassTheme}>
                                                        <span>{genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}</span>
                                                    </NovelMeta>
                                                </>
                                            ) : (
                                                <>
                                                    <NovelMeta theme={theme} $viewMode={viewMode} $isGlassTheme={isGlassTheme}>
                                                        <span>{genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}</span>
                                                        {novel.purchaseCount > 0 && (
                                                            <PurchaseBadge theme={theme}>{novel.purchaseCount}</PurchaseBadge>
                                                        )}
                                                    </NovelMeta>
                                                    <NovelTitle $viewMode={viewMode} theme={theme} $isGlassTheme={isGlassTheme}>{novel.title}</NovelTitle>
                                                    {!showCheckboxes && (
                                                        <PublicStatus theme={theme} $isGlassTheme={isGlassTheme}>
                                                            <PublicToggleButton
                                                                $isGlassTheme={isGlassTheme}
                                                                $isDiaryTheme={isDiaryTheme}
                                                                theme={theme}
                                                                onClick={(e) => handleTogglePublic(novel, e)}
                                                            >
                                                                <PublicToggleOption $active={novel.isPublic !== false} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} theme={theme}>
                                                                    공개
                                                                </PublicToggleOption>
                                                                <PublicToggleOption $active={novel.isPublic === false} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} theme={theme}>
                                                                    비공개
                                                                </PublicToggleOption>
                                                                <PublicToggleSlider $isPublic={novel.isPublic !== false} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} theme={theme} />
                                                            </PublicToggleButton>
                                                        </PublicStatus>
                                                    )}
                                                    {showCheckboxes && (
                                                        <PublicStatus theme={theme} $isGlassTheme={isGlassTheme}>
                                                            <span>{novel.isPublic !== false ? '공개' : '비공개'}</span>
                                                        </PublicStatus>
                                                    )}
                                                </>
                                            )}
                                        </NovelInfo>
                                    </NovelItem>
                                );
                            })}
                    </NovelListWrapper>

                    {/* 페이지네이션 */}
                    {filteredNovels.length > itemsPerPage && (
                        <PaginationContainer theme={theme}>
                            <PaginationButton
                                theme={theme}
                                $isGlassTheme={isGlassTheme}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                이전
                            </PaginationButton>
                            <PaginationInfo theme={theme} $isGlassTheme={isGlassTheme}>
                                {currentPage} / {Math.ceil(filteredNovels.length / itemsPerPage)}
                            </PaginationInfo>
                            <PaginationButton
                                theme={theme}
                                $isGlassTheme={isGlassTheme}
                                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredNovels.length / itemsPerPage), prev + 1))}
                                disabled={currentPage >= Math.ceil(filteredNovels.length / itemsPerPage)}
                            >
                                다음
                            </PaginationButton>
                        </PaginationContainer>
                    )}
                </>
            )}

            <ConfirmModal
                open={privateConfirmOpen}
                title="소설 비공개 전환"
                description={`비공개로 전환하더라도 이미 구매한 이용자의 '내 서재'에서는 구매 당시 버전을 계속 볼 수 있습니다.\n\n계속하시겠습니까?`}
                onCancel={() => {
                    setPrivateConfirmOpen(false);
                    setNovelToToggle(null);
                }}
                onConfirm={confirmTogglePrivate}
                confirmText="확인"
            />
            <ConfirmModal
                open={batchConfirmOpen}
                title="소설 일괄 비공개 전환"
                description={`선택한 ${selectedNovels.size}개의 소설을 비공개로 전환합니다.\n\n비공개로 전환하더라도 이미 구매한 이용자의 '내 서재'에서는 구매 당시 버전을 계속 볼 수 있습니다.\n\n계속하시겠습니까?`}
                onCancel={() => {
                    setBatchConfirmOpen(false);
                    setBatchAction(null);
                }}
                onConfirm={confirmBatchPrivate}
                confirmText="확인"
            />

            <Navigation />
        </Container>
    );
}

export default CompletedNovels;

