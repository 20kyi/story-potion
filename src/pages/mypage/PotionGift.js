import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { useToast } from '../../components/ui/ToastProvider';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useTranslation } from '../../LanguageContext';
import { motion } from 'framer-motion';
import { giftPotionToFriend } from '../../utils/potionGift';
import { getFriendsList, searchUsers } from '../../utils/friendSystem';
import { FaGift, FaSearch, FaTimes } from 'react-icons/fa';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getSafeProfileImageUrl, handleImageError } from '../../utils/profileImageUtils';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  margin-top: 70px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  background: ${({ $isDiaryTheme }) => $isDiaryTheme ? '#faf8f3' : 'transparent'};
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#5C4B37' : theme.text};
  position: relative;
`;

const Section = styled.div`
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

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  ${({ showGiftIcon }) => showGiftIcon && `
    &::before {
      content: '🎁';
      font-size: 24px;
    }
  `}
`;

const SearchSection = styled.div`
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
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const SearchInput = styled.input.attrs({
  className: 'potion-gift-search-input'
})`
  width: 100%;
  padding: 14px 16px;
  padding-right: ${({ hasClearButton }) => hasClearButton ? '90px' : '50px'};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.3)';
    return `1px solid ${theme.border || '#e0e0e0'}`;
  }};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '20px';
    return $isDiaryTheme ? '10px 14px 12px 11px' : '10px';
  }};
  font-size: 16px;
  background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2) !important';
    if ($isDiaryTheme) return '#fffef9 !important';
    return `${theme.background} !important`;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#5C4B37 !important';
    return `${theme.text} !important`;
  }};
  outline: none;
  transition: all 0.2s ease;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 1px 3px rgba(0, 0, 0, 0.05)';
    return 'none';
  }};

  &::placeholder {
    color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#8B6F47 !important';
    return `${theme.subText || '#666'} !important`;
  }};
    opacity: 1;
  }

  &:focus {
    border-color: #e46262;
    box-shadow: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 0 0 3px rgba(228, 98, 98, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 0 0 2px rgba(228, 98, 98, 0.15), 0 1px 3px rgba(0, 0, 0, 0.05)';
    return '0 0 0 2px rgba(228, 98, 98, 0.1)';
  }};
    background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.25) !important';
    if ($isDiaryTheme) return '#fffef9 !important';
    return `${theme.background} !important`;
  }};
    color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#5C4B37 !important';
    return `${theme.text} !important`;
  }};
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.background;
  }} inset !important;
    -webkit-text-fill-color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#5C4B37 !important';
    return `${theme.text} !important`;
  }};
    background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2) !important';
    if ($isDiaryTheme) return '#fffef9 !important';
    return `${theme.background} !important`;
  }};
  }

  &:hover,
  &:active,
  &:focus,
  &:visited {
    background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.25) !important';
    if ($isDiaryTheme) return '#fffef9 !important';
    return `${theme.background} !important`;
  }};
    color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#5C4B37 !important';
    return `${theme.text} !important`;
  }};
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  color: #e46262;
  border: none;
  border-radius: 8px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #d45555;
    background: rgba(228, 98, 98, 0.1);
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
    background: transparent;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 48px;
  top: 50%;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.subText || '#999'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
  font-size: 12px;

  &:hover {
    background: ${({ theme }) => theme.subText || '#666'};
    opacity: 1;
  }
`;

const SearchResultsContainer = styled.div`
  margin-top: 16px;
  background: ${({ theme }) => theme.card || theme.background};
  border-radius: 12px;
  overflow: hidden;
`;

const SearchResultCard = styled(motion.div)`
  background: ${({ theme }) => theme.background};
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#e0e0e0'};
  padding: 12px 16px;
  margin-bottom: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  
  &:hover {
    background: ${({ theme }) => theme.card || theme.background};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SearchResultAvatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.border || '#f0f0f0'};
`;

const SearchResultInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SearchResultName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SearchResultEmail = styled.div`
  font-size: 12px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#666')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FriendCard = styled(motion.div)`
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.background;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border: none;
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '20px';
    return $isDiaryTheme ? '14px 18px 16px 15px' : '14px';
  }};
  padding: 12px 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 14px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15)';
    if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.08)';
    return '0 4px 12px rgba(0,0,0,0.1)';
  }};
  }
  
  ${({ selected, $isGlassTheme, $isDiaryTheme }) => selected && `
    background: linear-gradient(135deg, rgba(228, 98, 98, 0.1) 0%, rgba(212, 85, 85, 0.1) 100%);
    box-shadow: ${$isGlassTheme
      ? '0 6px 24px rgba(228, 98, 98, 0.25)'
      : $isDiaryTheme
        ? '0 4px 12px rgba(228, 98, 98, 0.2)'
        : '0 4px 16px rgba(228, 98, 98, 0.2)'};
  `}
`;

const FriendAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.border || '#f0f0f0'};
`;

const FriendInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FriendName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FriendEmail = styled.div`
  font-size: 13px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#666')};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SelectedFriendDisplay = styled.div`
  background: linear-gradient(135deg, rgba(228, 98, 98, 0.1) 0%, rgba(212, 85, 85, 0.1) 100%);
  border: none;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const PotionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 24px;
`;

const PotionItem = styled(motion.div)`
  background: ${({ selected, theme, $isDiaryTheme, $isGlassTheme }) => {
    if (selected) {
      return 'linear-gradient(135deg, rgba(228, 98, 98, 0.1) 0%, rgba(212, 85, 85, 0.1) 100%)';
    }
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.background || '#f9f9f9';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border: 2.5px solid ${({ selected, theme, $isDiaryTheme, $isGlassTheme }) => {
    if (selected) return '#e46262';
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.2)';
    return theme.border || '#e0e0e0';
  }};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '24px';
    return $isDiaryTheme ? '14px 18px 16px 15px' : '14px';
  }};
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: ${({ disabled, $isGlassTheme, $isDiaryTheme }) => {
    if (disabled) return 'none';
    if ($isGlassTheme) return '0 6px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
    if ($isDiaryTheme) return '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)';
    return '0 6px 20px rgba(228, 98, 98, 0.3)';
  }};
    border-color: ${({ disabled, theme, $isDiaryTheme, $isGlassTheme }) => {
    if (disabled) {
      if ($isGlassTheme) return 'rgba(255, 255, 255, 0.5)';
      if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.2)';
      return theme.border || '#e0e0e0';
    }
    return '#e46262';
  }};
  }
  
  ${({ selected, $isGlassTheme, $isDiaryTheme }) => selected && `
    box-shadow: ${$isGlassTheme
      ? '0 6px 24px rgba(228, 98, 98, 0.25), 0 4px 12px rgba(228, 98, 98, 0.2)'
      : $isDiaryTheme
        ? '0 4px 12px rgba(228, 98, 98, 0.2), 0 2px 4px rgba(228, 98, 98, 0.15)'
        : '0 4px 16px rgba(228, 98, 98, 0.25)'};
  `}
  
  ${({ disabled }) => disabled && `
    opacity: 0.4;
    cursor: not-allowed;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  `}
`;

const PotionImage = styled.img`
  width: 56px;
  height: 56px;
  object-fit: contain;
  margin: 0 auto 10px auto;
  filter: ${({ disabled }) => disabled ? 'grayscale(100%)' : 'none'};
  transition: all 0.2s ease;
  background: none !important;
  
  ${PotionItem}:hover & {
    transform: ${({ disabled }) => disabled ? 'none' : 'scale(1.1)'};
  }
`;

const PotionName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
  margin-bottom: 6px;
  line-height: 1.3;
`;

const PotionCount = styled.div`
  font-size: 12px;
  color: ${({ disabled, $isDiaryTheme }) => {
    if (disabled) return '#999';
    return $isDiaryTheme ? '#8B6F47' : '#3498f3';
  }};
  font-weight: 600;
  background: ${({ disabled }) => disabled ? 'transparent' : 'rgba(52, 152, 243, 0.1)'};
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
`;

const GiftButton = styled.button`
  width: 100%;
  background: ${({ disabled, $isGlassTheme, $isDiaryTheme }) => {
    if (disabled) {
      if ($isGlassTheme) return 'rgba(204, 204, 204, 0.3)';
      if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.3)';
      return 'linear-gradient(135deg, #ccc 0%, #bbb 100%)';
    }
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.8)';
    return 'linear-gradient(135deg, #e46262 0%, #d45555 100%)';
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
    return $isDiaryTheme ? '14px 18px 16px 15px' : '14px';
  }};
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.25s ease;
  box-shadow: ${({ disabled, $isGlassTheme, $isDiaryTheme }) => {
    if (disabled) return 'none';
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 2px 8px rgba(228, 98, 98, 0.3)';
    return '0 4px 12px rgba(228, 98, 98, 0.3)';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
  transform: ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) ? 'rotate(-0.1deg)' : 'none'};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover:not(:disabled) {
    background: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
    if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.9)';
    return 'linear-gradient(135deg, #d45555 0%, #c44a4a 100%)';
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
    border-color: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.6)';
    if ($isDiaryTheme) return 'rgba(228, 98, 98, 0.6)';
    return 'none';
  }};
    
    &::before {
      left: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'scale(0.97)';
    if ($isDiaryTheme) return 'rotate(-0.1deg) scale(0.95)';
    return 'translateY(0)';
  }};
    box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 2px 6px rgba(228, 98, 98, 0.3)';
    return '0 2px 8px rgba(228, 98, 98, 0.3)';
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.subText || '#666'};
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  opacity: 0.8;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  &::after {
    content: '';
    width: 32px;
    height: 32px;
    border: 3px solid ${({ theme }) => theme.border || '#e0e0e0'};
    border-top: 3px solid #e46262;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function PotionGift({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const { actualTheme } = useTheme();
  const isDiaryTheme = actualTheme === 'diary';
  const isGlassTheme = actualTheme === 'glass';
  const toast = useToast();
  const { t } = useTranslation();

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedPotion, setSelectedPotion] = useState(null);
  const [ownedPotions, setOwnedPotions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // 포션 데이터
  const potions = [
    { id: 'romance', nameKey: 'novel_genre_romance', image: '/potion/romance.png' },
    { id: 'historical', nameKey: 'novel_genre_historical', image: '/potion/historical.png' },
    { id: 'mystery', nameKey: 'novel_genre_mystery', image: '/potion/mystery.png' },
    { id: 'horror', nameKey: 'novel_genre_horror', image: '/potion/horror.png' },
    { id: 'fairytale', nameKey: 'novel_genre_fairytale', image: '/potion/fairytale.png' },
    { id: 'fantasy', nameKey: 'novel_genre_fantasy', image: '/potion/fantasy.png' },
  ];

  // URL 파라미터에서 친구 ID 가져오기
  const friendIdFromUrl = searchParams.get('friendId');

  useEffect(() => {
    if (user?.uid) {
      loadFriends();
      loadOwnedPotions();
    }
  }, [user, friendIdFromUrl]);

  // 친구 목록 로드
  const loadFriends = async () => {
    if (!user?.uid) return;
    setIsLoadingFriends(true);
    try {
      const friendsList = await getFriendsList(user.uid);
      setFriends(friendsList);

      // URL 파라미터에 friendId가 있으면 해당 친구 선택
      if (friendIdFromUrl) {
        const friend = friendsList.find(f => f.user.uid === friendIdFromUrl);
        if (friend) {
          setSelectedFriend(friend);
        }
      }
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
      toast.showToast(t('potion_gift_friend_list_failed'), 'error');
    } finally {
      setIsLoadingFriends(false);
    }
  };

  // 보유 포션 조회
  const loadOwnedPotions = async () => {
    if (!user?.uid) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setOwnedPotions(userData.potions || {});
      }
    } catch (error) {
      console.error('보유 포션 조회 실패:', error);
    }
  };

  // 디바운싱된 검색 함수
  const debouncedSearch = useCallback(async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // 친구 목록이 아직 로드되지 않았다면 먼저 로드
      let friendsList = friends;
      if (friendsList.length === 0) {
        friendsList = await getFriendsList(user.uid);
        setFriends(friendsList);
      }

      const results = await searchUsers(query, user.uid);

      // 친구만 필터링
      const friendIds = friendsList.map(f => f.user.uid);
      const friendResults = results.filter(user => friendIds.includes(user.uid));

      setSearchResults(friendResults);
    } catch (error) {
      console.error('친구 검색 실패:', error);
      toast.showToast(t('potion_gift_search_failed'), 'error');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [user.uid, friends, toast]);

  // 검색어 변경 핸들러
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // 이전 타이머 클리어
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // 새로운 타이머 설정 (500ms 후 검색 실행)
    const newTimeout = setTimeout(() => {
      debouncedSearch(value);
    }, 500);

    setSearchTimeout(newTimeout);
  };

  // 수동 검색 함수 (검색 버튼 클릭 시)
  const handleSearch = async () => {
    // 타이머 클리어
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    await debouncedSearch(searchQuery);
  };

  // 컴포넌트 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // 검색 결과에서 친구 선택
  const handleSelectSearchResult = (user) => {
    // friends 배열에서 해당 친구 찾기
    const friend = friends.find(f => f.user.uid === user.uid);
    if (friend) {
      setSelectedFriend(friend);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // 검색어가 비어있을 때 검색 결과 초기화
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // 포션 선물하기
  const handleGiftPotion = async () => {
    if (!selectedFriend || !selectedPotion) {
      toast.showToast(t('potion_gift_select'), 'error');
      return;
    }

    const potion = potions.find(p => p.id === selectedPotion);
    if (!potion) return;

    const potionName = t(potion.nameKey);

    // 보유 포션 확인
    const potionCount = ownedPotions[selectedPotion] || 0;
    if (potionCount <= 0) {
      toast.showToast(t('potion_gift_no_potion', { name: potionName }), 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await giftPotionToFriend(
        user.uid,
        selectedFriend.user.uid,
        selectedPotion,
        potionName
      );

      if (result.success) {
        toast.showToast(t('potion_gift_success', { name: potionName }), 'success');
        await loadOwnedPotions(); // 보유 포션 새로고침
        // 성공 후 친구 페이지로 이동
        setTimeout(() => {
          navigate('/my/friend');
        }, 1000);
      } else {
        toast.showToast(result.error || t('potion_gift_failed'), 'error');
      }
    } catch (error) {
      console.error('포션 선물 실패:', error);
      toast.showToast(t('potion_gift_failed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container theme={theme} $isDiaryTheme={isDiaryTheme}>
      <Header user={user} title={t('potion_gift_title')} />

      {!selectedFriend ? (
        <>
          <Section theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
            <SectionTitle theme={theme} $isDiaryTheme={isDiaryTheme} showGiftIcon={false}>
              {t('potion_gift_select_friend')}
            </SectionTitle>

            <SearchInputContainer>
              <SearchInput
                type="text"
                placeholder={t('friend_search_placeholder') || '친구 이름이나 이메일로 검색'}
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                theme={theme}
                $isDiaryTheme={isDiaryTheme}
                $isGlassTheme={isGlassTheme}
                hasClearButton={searchQuery.trim().length > 0}
              />
              {searchQuery.trim().length > 0 && (
                <ClearButton
                  onClick={handleClearSearch}
                  theme={theme}
                >
                  <FaTimes />
                </ClearButton>
              )}
              <SearchButton
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim() || searchQuery.trim().length < 2}
                hasClearButton={searchQuery.trim().length > 0}
              >
                <FaSearch />
              </SearchButton>
            </SearchInputContainer>

            {isSearching && (
              <div style={{ textAlign: 'center', padding: '20px', color: theme.subText || '#666' }}>
                {t('potion_gift_searching')}
              </div>
            )}

            {!isSearching && searchQuery.trim() && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: theme.subText || '#666' }}>
                {t('potion_gift_no_search_results')}
              </div>
            )}

            {/* 검색어가 없을 때만 친구 목록 표시 */}
            {!searchQuery.trim() || searchQuery.trim().length < 2 ? (
              <>
                {isLoadingFriends ? (
                  <LoadingSpinner theme={theme} />
                ) : friends.length === 0 ? (
                  <EmptyState theme={theme}>
                    <EmptyIcon>👥</EmptyIcon>
                    <EmptyText>{t('potion_gift_no_friends')}</EmptyText>
                    <EmptySubtext>{t('potion_gift_no_friends_desc')}</EmptySubtext>
                  </EmptyState>
                ) : (
                  friends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      theme={theme}
                      $isDiaryTheme={isDiaryTheme}
                      $isGlassTheme={isGlassTheme}
                      selected={false}
                      onClick={() => setSelectedFriend(friend)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FriendAvatar
                        src={getSafeProfileImageUrl(friend.user.photoURL)}
                        alt={friend.user.displayName}
                        onError={(e) => handleImageError(e)}
                        theme={theme}
                        fetchPriority="high"
                        loading="eager"
                      />
                      <FriendInfo>
                        <FriendName theme={theme} $isDiaryTheme={isDiaryTheme}>
                          {friend.user.displayName || t('friend_default_name')}
                        </FriendName>
                        <FriendEmail theme={theme} $isDiaryTheme={isDiaryTheme}>
                          {friend.user.email}
                        </FriendEmail>
                      </FriendInfo>
                      <FaGift style={{ color: '#e46262', fontSize: '20px' }} />
                    </FriendCard>
                  ))
                )}
              </>
            ) : null}
          </Section>

          {/* 검색 결과를 별도 섹션에 표시 */}
          {searchResults.length > 0 && (
            <Section theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
              <SectionTitle theme={theme} $isDiaryTheme={isDiaryTheme} showGiftIcon={false}>
                {t('potion_gift_search_results')}
              </SectionTitle>
              <SearchResultsContainer>
                {searchResults.map((user) => (
                  <SearchResultCard
                    key={user.uid}
                    theme={theme}
                    onClick={() => handleSelectSearchResult(user)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <SearchResultAvatar
                      src={getSafeProfileImageUrl(user.photoURL)}
                      alt={user.displayName}
                      onError={(e) => handleImageError(e)}
                      theme={theme}
                      fetchPriority="high"
                      loading="eager"
                    />
                    <SearchResultInfo>
                      <SearchResultName theme={theme} $isDiaryTheme={isDiaryTheme}>
                        {user.displayName || t('friend_default_name')}
                      </SearchResultName>
                      <SearchResultEmail theme={theme} $isDiaryTheme={isDiaryTheme}>
                        {user.email}
                      </SearchResultEmail>
                    </SearchResultInfo>
                    <FaGift style={{ color: '#e46262', fontSize: '18px' }} />
                  </SearchResultCard>
                ))}
              </SearchResultsContainer>
            </Section>
          )}
        </>
      ) : (
        <>
          <Section theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
            <SectionTitle theme={theme} $isDiaryTheme={isDiaryTheme} showGiftIcon={true}>{t('potion_gift_selected_friend')}</SectionTitle>
            <SelectedFriendDisplay>
              <FriendAvatar
                src={getSafeProfileImageUrl(selectedFriend.user.photoURL)}
                alt={selectedFriend.user.displayName}
                onError={(e) => handleImageError(e)}
                theme={theme}
                fetchPriority="high"
                loading="eager"
              />
              <FriendInfo>
                <FriendName theme={theme} $isDiaryTheme={isDiaryTheme}>
                  {selectedFriend.user.displayName || t('friend_default_name')}
                </FriendName>
                <FriendEmail theme={theme} $isDiaryTheme={isDiaryTheme}>
                  {selectedFriend.user.email}
                </FriendEmail>
              </FriendInfo>
              <button
                onClick={() => setSelectedFriend(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.text,
                  cursor: 'pointer',
                  padding: '8px',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            </SelectedFriendDisplay>
          </Section>

          <Section theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
            <SectionTitle theme={theme} $isDiaryTheme={isDiaryTheme} showGiftIcon={true}>{t('potion_gift_select_potion')}</SectionTitle>

            <PotionGrid>
              {potions.map((potion) => {
                const count = ownedPotions[potion.id] || 0;
                const hasPotion = count > 0;

                return (
                  <PotionItem
                    key={potion.id}
                    selected={selectedPotion === potion.id}
                    disabled={!hasPotion}
                    onClick={() => hasPotion && setSelectedPotion(potion.id)}
                    theme={theme}
                    $isDiaryTheme={isDiaryTheme}
                    $isGlassTheme={isGlassTheme}
                    whileHover={hasPotion ? { scale: 1.05 } : {}}
                    whileTap={hasPotion ? { scale: 0.95 } : {}}
                  >
                    <PotionImage src={potion.image} alt={t(potion.nameKey)} disabled={!hasPotion} />
                    <PotionName theme={theme} $isDiaryTheme={isDiaryTheme}>{t(potion.nameKey)}</PotionName>
                    <PotionCount disabled={!hasPotion} $isDiaryTheme={isDiaryTheme}>{count}</PotionCount>
                  </PotionItem>
                );
              })}
            </PotionGrid>

            <GiftButton
              onClick={handleGiftPotion}
              disabled={!selectedPotion || isLoading}
              $isDiaryTheme={isDiaryTheme}
              $isGlassTheme={isGlassTheme}
            >
              {isLoading ? (
                <>
                  <span style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  {t('potion_gift_gifting')}
                </>
              ) : selectedPotion ? (
                <>
                  <FaGift style={{ fontSize: '18px' }} />
                  {t('potion_gift_button', { name: t(potions.find(p => p.id === selectedPotion)?.nameKey || '') })}
                </>
              ) : (
                <>
                  <FaGift style={{ fontSize: '18px', opacity: 0.7 }} />
                  {t('potion_gift_select')}
                </>
              )}
            </GiftButton>
          </Section>
        </>
      )}

      <Navigation />

      <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
    </Container>
  );
}

export default PotionGift;

