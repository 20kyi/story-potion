import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useToast } from '../../components/ui/ToastProvider';
import styled from 'styled-components';
import { useTheme as useAppTheme } from '../../ThemeContext';
import { useTheme } from 'styled-components';
import PointIcon from '../../components/icons/PointIcon';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useTranslation } from '../../LanguageContext';
import { inAppPurchaseService, PRODUCT_IDS, PRODUCT_INFO, consumeUnconsumedPointPurchases } from '../../utils/inAppPurchase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  background: ${({ $isDiaryTheme }) => $isDiaryTheme ? '#faf8f3' : 'transparent'};
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#5C4B37' : theme.text};
  position: relative;
`;

const PointDisplay = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 24px 20px;
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '24px';
    return $isDiaryTheme ? '16px 20px 18px 17px' : '16px';
  }};
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  position: relative;
  transform: ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) ? 'rotate(0.2deg)' : 'none'};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  
  ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) && `
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, transparent 50%);
      z-index: -1;
      opacity: 0.3;
    }
  `}
`;

const PointAmount = styled.div`
  font-size: 32px;
  font-weight: 700;
  font-family: inherit;
  color: #3498f3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const PointLabel = styled.div`
  font-size: 14px;
  font-family: inherit;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#888')};
`;

const PackageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 30px;
`;

const PackageCard = styled.div`
  background: ${({ theme, selected, $isDiaryTheme, $isGlassTheme }) => {
    if (selected) {
      if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
      if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.1)';
      return theme.cardActive || theme.primary || '#3498f3';
    }
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  color: ${({ theme, selected, $isDiaryTheme, $isGlassTheme }) => {
    if (selected) {
      if ($isGlassTheme) return '#000000';
      if ($isDiaryTheme) return '#8B6F47';
      return theme.cardActiveText || 'white';
    }
    if ($isDiaryTheme) return '#5C4B37';
    return theme.text;
  }};
  border: 2px solid ${({ theme, selected, $isDiaryTheme, $isGlassTheme }) => {
    if (selected) {
      if ($isGlassTheme) return 'rgba(255, 255, 255, 0.6)';
      if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.4)';
      return theme.cardActiveBorder || theme.primary || '#3498f3';
    }
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.2)';
    return theme.border || '#e0e0e0';
  }};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '24px';
    return $isDiaryTheme ? '15px 19px 17px 16px' : '15px';
  }};
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme, selected }) => {
    if ($isGlassTheme) return selected ? '0 6px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return selected
        ? '0 4px 12px rgba(228, 98, 98, 0.2), 0 2px 4px rgba(228, 98, 98, 0.15)'
        : '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    }
    return selected
      ? '0 4px 12px rgba(52, 152, 243, 0.3)'
      : theme.mode === 'dark'
        ? '0 2px 8px rgba(0,0,0,0.18)'
        : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  position: relative;
  transform: ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) ? 'rotate(-0.1deg)' : 'none'};

  &:hover {
    transform: ${({ $isDiaryTheme, $isGlassTheme }) => {
      if ($isGlassTheme) return 'translateY(-2px)';
      if ($isDiaryTheme) return 'rotate(-0.1deg) translateY(-2px)';
      return 'translateY(-2px)';
    }};
    box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme, selected }) => {
      if ($isGlassTheme) return '0 6px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
      if ($isDiaryTheme) {
        return '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
      }
      return selected
        ? '0 6px 16px rgba(52, 152, 243, 0.4)'
        : theme.mode === 'dark'
          ? '0 4px 12px rgba(0,0,0,0.25)'
          : '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)';
    }};
  }
  
  ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) && `
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, transparent 50%);
      z-index: -1;
      opacity: 0.3;
    }
  `}
`;

const PackagePoints = styled.div`
  font-size: 24px;
  font-weight: 700;
  font-family: inherit;
  margin-bottom: 8px;
`;

const PackagePrice = styled.div`
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  margin-bottom: 4px;
`;

const PackageBonus = styled.div`
  font-size: 12px;
  font-family: inherit;
  opacity: 0.8;
`;

const PurchaseButton = styled.button`
  background: ${({ disabled, $isGlassTheme, $isDiaryTheme }) => {
    if (disabled) {
      if ($isGlassTheme) return 'rgba(204, 204, 204, 0.3)';
      if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.3)';
      return '#ccc';
    }
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.8)';
    return '#e46262';
  }};
  backdrop-filter: ${({ $isGlassTheme, disabled }) => ($isGlassTheme && !disabled) ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme, disabled }) => ($isGlassTheme && !disabled) ? 'blur(15px)' : 'none'};
  color: ${({ $isGlassTheme, $isDiaryTheme, disabled }) => {
    if (disabled) return '#999';
    if ($isGlassTheme) return '#000000';
    return 'white';
  }};
  border: ${({ $isGlassTheme, $isDiaryTheme, disabled }) => {
    if (disabled) return 'none';
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(228, 98, 98, 0.5)';
    return 'none';
  }};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '24px';
    return $isDiaryTheme ? '25px 29px 27px 26px' : '25px';
  }};
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  font-family: inherit;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: ${({ disabled, $isGlassTheme, $isDiaryTheme }) => {
    if (disabled) return 'none';
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 2px 8px rgba(228, 98, 98, 0.3)';
    return '0 4px 12px rgba(228, 98, 98, 0.3)';
  }};
  transform: ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) ? 'rotate(-0.1deg)' : 'none'};

  &:hover:not(:disabled) {
    background: ${({ $isGlassTheme, $isDiaryTheme }) => {
      if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
      if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.9)';
      return '#d45555';
    }};
    transform: ${({ $isDiaryTheme, $isGlassTheme }) => {
      if ($isGlassTheme) return 'translateY(-2px)';
      if ($isDiaryTheme) return 'rotate(-0.1deg) translateY(-2px)';
      return 'translateY(-2px)';
    }};
    box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
      if ($isGlassTheme) return '0 6px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
      if ($isDiaryTheme) return '0 4px 12px rgba(228, 98, 98, 0.4)';
      return '0 6px 16px rgba(228, 98, 98, 0.4)';
    }};
  }

  &:disabled {
    opacity: 0.6;
  }
  
  ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) && `
    &::after {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(228, 98, 98, 0.08) 0%, transparent 50%);
      z-index: -1;
      opacity: 0.3;
    }
  `}
`;

const InfoSection = styled.div`
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '24px';
    return $isDiaryTheme ? '16px 20px 18px 17px' : '16px';
  }};
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  position: relative;
  transform: ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) ? 'rotate(-0.1deg)' : 'none'};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  
  ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) && `
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, transparent 50%);
      z-index: -1;
      opacity: 0.3;
    }
  `}
`;

const InfoTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  font-family: inherit;
  margin-bottom: 12px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
`;

const InfoText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  font-family: inherit;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#5C4B37' : theme.text};
  margin-bottom: 8px;
`;

// 새로운 스타일 컴포넌트들
const TabContainer = styled.div`
  margin-top: 30px;
  margin-bottom: 100px;
`;

const TabHeader = styled.div`
  display: flex;
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: 15px 15px 0 0;
  overflow: hidden;
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  border-bottom: none;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 16px;
  border: none;
  background: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
    if (active) {
      if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
      if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.8)';
      return '#e46262';
    }
    return 'transparent';
  }};
  color: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
    if (active) {
      if ($isGlassTheme) return '#000000';
      return 'white';
    }
    if ($isDiaryTheme) return '#8B6F47';
    return theme.text;
  }};
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
      if (active) {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.4)';
        if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.9)';
        return '#d45555';
      }
      if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.1)';
      return 'rgba(228, 98, 98, 0.1)';
    }};
    color: ${({ active, theme, $isDiaryTheme, $isGlassTheme }) => {
      if (active) {
        if ($isGlassTheme) return '#000000';
        return 'white';
      }
      if ($isDiaryTheme) return '#8B6F47';
      return theme.text;
    }};
  }
`;

const TabContent = styled.div`
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: 0 0 15px 15px;
  padding: 10px;
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  border-top: none;
  min-height: 300px;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.15)';
    if ($isDiaryTheme) return 'rgba(255, 254, 249, 0.8)';
    return theme.background;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(10px)' : 'none'};
  border-radius: ${({ $isDiaryTheme }) => $isDiaryTheme ? '12px 16px 14px 13px' : '12px'};
  border: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '1px solid rgba(255, 255, 255, 0.3)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.1)';
    return 'none';
  }};
`;

const HistoryInfo = styled.div`
  flex: 1;
`;

const HistoryTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#5C4B37' : theme.text};
  margin-bottom: 4px;
`;

const HistoryDate = styled.div`
  font-size: 12px;
  font-family: inherit;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#888')};
`;

const HistoryAmount = styled.div`
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  color: ${({ type, theme }) =>
    type === 'charge' ? theme.text :
      type === 'earn' ? theme.text :
        type === 'use' ? '#e74c3c' : '#95a5a6'
  };
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#888')};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  font-family: inherit;
  margin-bottom: 8px;
`;

const EmptySubText = styled.div`
  font-size: 14px;
  font-family: inherit;
  opacity: 0.7;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 16px 0;
`;

const PageButton = styled.button`
  width: 44px;
  height: 44px;
  border: none;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.text};
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);

  &:hover {
    background: rgba(228, 98, 98, 0.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const PageInfo = styled.div`
  font-size: 14px;
  font-family: inherit;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#888')};
  margin: 0 16px;
`;

const packages = [
  { id: PRODUCT_IDS.POINTS_100, points: 100, price: '1,000원', bonusPoints: 0, productId: PRODUCT_IDS.POINTS_100 },
  { id: PRODUCT_IDS.POINTS_500, points: 500, price: '5,000원', bonusPoints: 50, productId: PRODUCT_IDS.POINTS_500 },
  { id: PRODUCT_IDS.POINTS_1000, points: 1000, price: '9,900원', bonusPoints: 150, productId: PRODUCT_IDS.POINTS_1000 },
  { id: PRODUCT_IDS.POINTS_2000, points: 2000, price: '19,800원', bonusPoints: 400, productId: PRODUCT_IDS.POINTS_2000 },
];

function PointCharge({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const { actualTheme } = useAppTheme();
  const isDiaryTheme = actualTheme === 'diary';
  const isGlassTheme = actualTheme === 'glass';
  const { t } = useTranslation();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [historyData, setHistoryData] = useState({
    charge: [],
    earn: [],
    use: [],
    all: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [modal, setModal] = useState(false);

  const formatHistoryTitle = (item) => {
    // desc가 있으면 상세 내역을 우선 표시
    if (item.desc) {
      return item.desc;
    }
    // desc가 없으면 기본 제목 표시
    switch (item.type) {
      case 'charge':
        return t('point_history_charge_title');
      case 'earn':
        return t('point_history_earn_title');
      case 'use':
        return t('point_history_use_title');
      default:
        return t('no_data');
    }
  };

  // 페이지 진입 시 미소비 포인트 구매 자동 소비 처리
  useEffect(() => {
    const handleUnconsumedPurchases = async () => {
      if (inAppPurchaseService.isAvailable) {
        console.log('[포인트충전] 페이지 진입 - 미소비 구매 확인 시작');
        try {
          await consumeUnconsumedPointPurchases();
          console.log('[포인트충전] 미소비 구매 처리 완료');
        } catch (error) {
          console.error('[포인트충전] 미소비 구매 처리 실패:', error);
          // 에러가 발생해도 페이지는 정상 동작
        }
      }
    };
    handleUnconsumedPurchases();
  }, []);

  // 현재 포인트 조회
  useEffect(() => {
    if (user?.uid) {
      const fetchPoints = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentPoints(userDoc.data().point || 0);
          }
        } catch (error) {
          console.error('포인트 조회 실패:', error);
        }
      };
      fetchPoints();
    }
  }, [user]);

  // 포인트 히스토리 조회
  useEffect(() => {
    if (user?.uid) {
      const fetchHistory = async () => {
        try {
          const historyRef = collection(db, 'users', user.uid, 'pointHistory');
          const q = query(historyRef, orderBy('createdAt', 'desc'), limit(50));
          const querySnapshot = await getDocs(q);

          const allHistory = querySnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }))
            .filter(item => item.type !== 'gift'); // 선물 내역 제외

          const categorized = {
            charge: allHistory.filter(item => item.type === 'charge'),
            earn: allHistory.filter(item => item.type === 'earn'),
            use: allHistory.filter(item => item.type === 'use'),
            all: allHistory
          };

          setHistoryData(categorized);
        } catch (error) {
          console.error('히스토리 조회 실패:', error);
        }
      };
      fetchHistory();
    }
  }, [user]);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.showToast(t('point_charge_select_package'), 'error');
      return;
    }
    setModal(true);
  };

  // 실제 구매 로직 분리
  const doPurchase = async () => {
    setIsLoading(true);
    try {
      const packageData = packages.find(p => p.id === selectedPackage);
      console.log('[포인트충전] doPurchase 시작', {
        packageId: packageData?.id,
        productId: packageData?.productId,
        isAvailable: inAppPurchaseService.isAvailable
      });

      // 인앱 결제 시도
      if (inAppPurchaseService.isAvailable) {
        console.log('[포인트충전] 인앱 결제 가능, purchaseProduct 호출');
        try {
          const purchase = await inAppPurchaseService.purchaseProduct(packageData.productId);
          console.log('[포인트충전] purchaseProduct 결과', { purchase, hasPurchase: !!purchase });

          if (purchase) {
            // purchase 객체의 유효성 검증
            if (!purchase.purchaseToken || !purchase.orderId) {
              console.error('[포인트충전] purchase 객체가 유효하지 않음', purchase);
              toast.showToast('인앱 결제 정보가 유효하지 않습니다. 다시 시도해주세요.', 'error');
              return;
            }

            console.log('[포인트충전] 인앱 결제 성공, 포인트 지급 시작', {
              orderId: purchase.orderId,
              purchaseToken: purchase.purchaseToken?.substring(0, 20) + '...'
            });

            try {
              // 인앱 결제 성공 시 포인트 지급
              const bonusPoints = packageData.bonusPoints || 0;
              const totalPoints = packageData.points + bonusPoints;

              await updateDoc(doc(db, 'users', user.uid), {
                point: increment(totalPoints)
              });

              await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                type: 'charge',
                amount: totalPoints,
                desc: `인앱 결제 - ${packageData.points}p + ${bonusPoints}p 보너스`,
                purchaseToken: purchase.purchaseToken,
                orderId: purchase.orderId,
                createdAt: new Date()
              });

              // 소비성 상품이므로 구매 후 소비 처리 (재구매 가능하도록)
              try {
                console.log('[포인트충전] 소비성 상품 소비 처리 시작');
                await inAppPurchaseService.consumePurchase(purchase.purchaseToken);
                console.log('[포인트충전] 소비성 상품 소비 처리 완료 - 재구매 가능');
              } catch (consumeError) {
                console.error('[포인트충전] 소비 처리 실패 (포인트는 이미 지급됨):', consumeError);
                // 소비 처리가 실패해도 포인트는 이미 지급되었으므로 경고만 표시
                // 사용자에게는 성공 메시지를 보여주고, 로그에만 기록
              }

              setCurrentPoints(prev => prev + totalPoints);
              toast.showToast(t('point_charge_success', { amount: totalPoints }), 'success');
              setSelectedPackage(null);
              setModal(false);
              console.log('[포인트충전] 인앱 결제 완료 및 포인트 지급 완료');
              return;
            } catch (dbError) {
              console.error('[포인트충전] 포인트 지급 중 오류 발생:', dbError);
              toast.showToast('포인트 지급 중 오류가 발생했습니다. 고객센터로 문의해주세요.', 'error');
              setModal(false);
              return;
            }
          } else {
            console.warn('[포인트충전] purchase가 null - 인앱 결제 창이 표시되지 않았거나 사용자가 취소함');
            toast.showToast('인앱 결제가 완료되지 않았습니다. 다시 시도해주세요.', 'error');
            setModal(false);
            return;
          }
        } catch (error) {
          console.error('[포인트충전] 인앱 결제 실패:', error);
          console.error('[포인트충전] 에러 상세:', {
            message: error.message,
            stack: error.stack,
            productId: packageData.productId,
            errorName: error.name
          });

          // 에러 메시지에 따라 다른 메시지 표시
          let errorMessage = t('point_charge_inapp_failed');
          if (error.message && error.message.includes('canceled')) {
            errorMessage = '인앱 결제가 취소되었습니다.';
          } else if (error.message && error.message.includes('User canceled')) {
            errorMessage = '인앱 결제가 취소되었습니다.';
          }

          toast.showToast(errorMessage, 'error');
          setModal(false);
          return; // 에러 발생 시 포인트 지급하지 않음
        }
      } else {
        console.warn('[포인트충전] 인앱 결제 불가능 - 네이티브 플랫폼이 아님');
        toast.showToast('인앱 결제는 앱에서만 사용 가능합니다.', 'error');
        setModal(false);
        return;
      }

    } catch (error) {
      console.error('[포인트충전] 포인트 충전 실패:', error);
      console.error('[포인트충전] 에러 상세:', {
        message: error.message,
        stack: error.stack
      });
      toast.showToast(t('point_charge_failed'), 'error');
      setModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };



  const renderHistoryList = (historyList) => {
    if (historyList.length === 0) {
      return (
        <EmptyState theme={theme} $isDiaryTheme={isDiaryTheme}>
          <EmptyIcon>📊</EmptyIcon>
          <EmptyText>{t('no_history')}</EmptyText>
          <EmptySubText>
            {activeTab === 'charge' && t('no_point_charge_history')}
            {activeTab === 'earn' && t('no_point_earn_history')}
            {activeTab === 'use' && t('no_point_use_history')}
            {activeTab === 'all' && t('no_point_history')}
          </EmptySubText>
        </EmptyState>
      );
    }

    // 페이징 계산
    const totalPages = Math.ceil(historyList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = historyList.slice(startIndex, endIndex);

    return (
      <>
        <HistoryList>
          {currentItems.map((item) => (
            <HistoryItem key={item.id} theme={theme} type={item.type} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
              <HistoryInfo theme={theme}>
                <HistoryTitle theme={theme} $isDiaryTheme={isDiaryTheme}>
                  {formatHistoryTitle(item)}
                </HistoryTitle>
                <HistoryDate theme={theme} $isDiaryTheme={isDiaryTheme}>{formatDate(item.createdAt)}</HistoryDate>
              </HistoryInfo>
              <HistoryAmount type={item.type} theme={theme}>
                {item.type === 'use' ? '-' : '+'}
                {Math.abs(item.amount)}p
              </HistoryAmount>
            </HistoryItem>
          ))}
        </HistoryList>

        {/* 페이징 컨트롤 */}
        {totalPages > 1 && (
          <PaginationContainer theme={theme}>
            <PageButton
              theme={theme}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </PageButton>

            <PageInfo theme={theme} $isDiaryTheme={isDiaryTheme}>
              {currentPage} / {totalPages}
            </PageInfo>

            <PageButton
              theme={theme}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </PageButton>
          </PaginationContainer>
        )}
      </>
    );
  };

  return (
    <Container theme={theme} $isDiaryTheme={isDiaryTheme}>
      <Header user={user} title={t('point_charge')} />

      <PointDisplay theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
        <PointAmount>
          <PointIcon width={32} height={32} color="#3498f3" />
          {currentPoints.toLocaleString()}p
        </PointAmount>
        <PointLabel theme={theme} $isDiaryTheme={isDiaryTheme}>{t('current_points')}</PointLabel>
      </PointDisplay>

      <InfoSection theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
        <InfoTitle theme={theme} $isDiaryTheme={isDiaryTheme}>{t('point_usage_guide')}</InfoTitle>
        <InfoText theme={theme} $isDiaryTheme={isDiaryTheme}>{t('point_usage_guide_item1')}</InfoText>
        <InfoText theme={theme} $isDiaryTheme={isDiaryTheme}>{t('point_usage_guide_item2')}</InfoText>
        <InfoText theme={theme} $isDiaryTheme={isDiaryTheme}>{t('point_usage_guide_item3')}</InfoText>
        <InfoText theme={theme} $isDiaryTheme={isDiaryTheme}>{t('point_usage_guide_item4')}</InfoText>
      </InfoSection>

      <PackageGrid>
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            selected={selectedPackage === pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
          >
            <PackagePoints>{pkg.points}p</PackagePoints>
            <PackagePrice>{pkg.price}</PackagePrice>
            {pkg.bonusPoints > 0 && (
              <PackageBonus>
                {t('point_charge_bonus', { bonus: pkg.bonusPoints })}
              </PackageBonus>
            )}
          </PackageCard>
        ))}
      </PackageGrid>

      <PurchaseButton
        onClick={handlePurchase}
        disabled={!selectedPackage || isLoading}
        $isDiaryTheme={isDiaryTheme}
        $isGlassTheme={isGlassTheme}
      >
        {isLoading ? t('point_charging') : t('point_charge_do')}
      </PurchaseButton>

      {/* 포인트 충전 확인 모달 */}
      <ConfirmModal
        open={modal}
        title={t('point_charge')}
        description={
          selectedPackage
            ? t('point_charge_confirm_desc', {
              points: packages.find(p => p.id === selectedPackage)?.points || '',
            })
            : ''
        }
        onCancel={() => setModal(false)}
        onConfirm={() => {
          setModal(false);
          // 모달을 닫은 후 구매 프로세스 시작
          setTimeout(() => {
            doPurchase();
          }, 100);
        }}
        confirmText={t('point_charge_do')}
      />

      {/* 포인트 내역 탭 */}
      <TabContainer>
        <TabHeader theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
          <TabButton
            active={activeTab === 'all'}
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
          >
            {t('tab_all')}
          </TabButton>
          <TabButton
            active={activeTab === 'use'}
            onClick={() => {
              setActiveTab('use');
              setCurrentPage(1);
            }}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
          >
            {t('tab_use')}
          </TabButton>
          <TabButton
            active={activeTab === 'earn'}
            onClick={() => {
              setActiveTab('earn');
              setCurrentPage(1);
            }}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
          >
            {t('tab_earn')}
          </TabButton>
          <TabButton
            active={activeTab === 'charge'}
            onClick={() => {
              setActiveTab('charge');
              setCurrentPage(1);
            }}
            theme={theme}
            $isDiaryTheme={isDiaryTheme}
            $isGlassTheme={isGlassTheme}
          >
            {t('tab_charge')}
          </TabButton>
        </TabHeader>
        <TabContent theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
          {renderHistoryList(historyData[activeTab])}
        </TabContent>
      </TabContainer>

      <Navigation />
    </Container>
  );
}

export default PointCharge; 