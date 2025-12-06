import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { db, storage } from '../../firebase';
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import imageCompression from 'browser-image-compression';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/ToastProvider';
import { usePrompt } from '../../hooks/usePrompt';
import { useTheme } from '../../ThemeContext';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { getPointPolicy } from '../../utils/appConfig';
import { checkWeeklyBonus } from '../../utils/weeklyBonus';
import { useTranslation, useLanguage } from '../../LanguageContext';
import { createPointEarnNotification } from '../../utils/notificationService';

// 오늘 날짜를 yyyy-mm-dd 형식으로 반환하는 함수
const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// Timezone-safe 날짜 포맷팅 함수
const formatDateToString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

// formatDate 함수 추가 (언어에 따라 다른 표기)
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';

    // LanguageContext 훅을 여기서 쓸 수 없으므로, localStorage에 저장된 언어 값을 사용
    const lang =
        typeof window !== 'undefined'
            ? (localStorage.getItem('language') || 'ko')
            : 'ko';

    // 요일 배열
    const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
    const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = date.getDay();

    if (lang === 'en') {
        const dateStr = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        return `${dateStr}, ${weekdaysEn[dayOfWeek]}`;
    }

    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일, ${weekdaysKo[dayOfWeek]}`;
};

// TopRow styled-component 추가
const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

// 다크모드 감지 함수
const isDarkMode = () => typeof document !== 'undefined' && document.body.classList.contains('dark');

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: ${() => window.innerWidth <= 768 ? '120vh' : '100vh'};
  position: relative;
  max-width: 600px;
  width: 100%;
  margin: ${() => window.innerWidth <= 768 ? '60px auto' : '60px auto'};
  padding: ${() => window.innerWidth <= 768 ? '20px' : '20px'};
  padding-top: ${() => window.innerWidth <= 768 ? '20px' : '20px'};
  margin-bottom: ${() => window.innerWidth <= 768 ? '100px' : '100px'};
  padding-bottom: ${() => window.innerWidth <= 768 ? '200px' : '180px'};
  overflow-x: hidden;
  box-sizing: border-box;
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) =>
        $isDiaryTheme
            ? '#faf8f3'
            : $isGlassTheme
                ? 'transparent'
                : 'transparent'};
  ${props => props.$isDiaryTheme && `
    background-image: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.02) 2px,
        rgba(0, 0, 0, 0.02) 4px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.02) 2px,
        rgba(0, 0, 0, 0.02) 4px
      );
  `}
`;

const Card = styled.div`
  background: ${props => {
        if (props.$isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if (props.$isDiaryTheme) return '#faf8f3';
        if (props.$isDark) return '#2d2d2d';
        return '#fff';
    }};
  backdrop-filter: ${props => props.$isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.$isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: ${props => props.$isGlassTheme ? '24px' : '12px'};
  padding: ${props => props.$isMetaCard ? '10px 16px' : '16px'};
  margin-bottom: 16px;
  box-shadow: ${props => {
        if (props.$isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
        if (props.$isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)';
        if (props.$isDark) return '0 2px 8px rgba(0, 0, 0, 0.18)';
        return '0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)';
    }};
  border: ${props => {
        if (props.$isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if (props.$isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        if (props.$isDark) return 'none';
        return '1px solid rgba(0, 0, 0, 0.06)';
    }};
`;

const DiaryDate = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-top: 0;
  cursor: default;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: inherit;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) =>
        $isGlassTheme ? '#000000' : $isDiaryTheme ? '#8B6F47' : theme.text};
  .date-number, .date-unit {
    color: ${({ theme, $isDiaryTheme, $isGlassTheme }) =>
        $isGlassTheme ? '#000000' : $isDiaryTheme ? '#8B6F47' : theme.text};
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
  }
`;
/* 오늘의 날씨, 내 기분 */
const DiaryMeta = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  margin: 0;
  min-height: auto;
  font-size: 16px;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) =>
        $isGlassTheme ? '#000000' : $isDiaryTheme ? '#8B6F47' : theme.text};
  font-weight: 500;
  width: 100%;
  
  span {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;
/* 오늘의 날씨, 내 기분 라벨 */
const MetaLabel = styled.span`
  display: flex;
  align-items: center;
  font-size: 16px;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) =>
        $isGlassTheme ? '#000000' : $isDiaryTheme ? '#8B6F47' : theme.text};
  font-weight: 500;
  min-width: 140px;
  min-height: 44px;
  padding: 0;
  font-family: inherit;
`;

const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  min-height: 100px;
`;
const ImagePreviewBox = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: ${props => props.$isGlassTheme ? '12px' : '8px'};
  overflow: hidden;
  border: 2px solid ${({ theme, isDragging, isDragOver, $isDiaryTheme, $isGlassTheme }) => {
        if (isDragging) {
            if ($isGlassTheme) return 'rgba(255, 255, 255, 0.8)';
            if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.8)';
            return theme.mode === 'dark' ? '#cb6565' : '#cb6565';
        }
        if (isDragOver) {
            if ($isGlassTheme) return 'rgba(255, 255, 255, 0.8)';
            if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.8)';
            return theme.mode === 'dark' ? '#cb6565' : '#cb6565';
        }
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.5)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.2)';
        return theme.mode === 'dark' ? '#4a4a4a' : '#fdd2d2';
    }};
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '#fdfdfd';
        return theme.mode === 'dark' ? '#2a2a2a' : '#fdfdfd';
    }};
  backdrop-filter: ${props => props.$isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.$isGlassTheme ? 'blur(10px)' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  transition: all 0.2s ease;
  opacity: ${props => props.isDragging ? 0.5 : 1};
  transform: ${props => props.isDragOver ? 'scale(1.05)' : 'scale(1)'};
  box-shadow: ${props => {
        if (!props.isDragOver) {
            if (props.$isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
            return 'none';
        }
        if (props.$isGlassTheme) return '0 4px 12px rgba(255, 255, 255, 0.3)';
        if (props.$isDiaryTheme) return '0 4px 12px rgba(139, 111, 71, 0.3)';
        return '0 4px 12px rgba(203, 101, 101, 0.3)';
    }};
`;
const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
`;
const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  color: #cb6565;
  z-index: 10;
`;

const ImageViewerModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const ImageViewerContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ImageViewerImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
`;

const ImageViewerClose = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  color: #333;
  z-index: 2001;
  font-weight: bold;
  
  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
`;

const ImageViewerNav = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  color: white;
  z-index: 2001;
  font-weight: bold;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const ImageViewerPrev = styled(ImageViewerNav)`
  left: 20px;
`;

const ImageViewerNext = styled(ImageViewerNav)`
  right: 20px;
`;

// AI 보강 모달 스타일 (NotificationModal과 동일한 구조)
const EnhanceModalOverlay = styled.div`
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
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 80px 20px 120px 20px;
`;

const EnhanceModalContent = styled.div`
  background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '#faf8f3';
        return theme.card || '#fff';
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
  width: 100%;
  max-width: 600px;
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EnhanceModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '1px solid rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return `1px solid ${theme.border || '#e0e0e0'}`;
    }};
`;

const EnhanceModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.text || '#333';
    }};
`;

const EnhanceModalClose = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.text || '#666';
    }};
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.1)';
        return theme.cardHover || '#fdfdfd';
    }};
  }
`;

const EnhanceModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const EnhanceSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EnhanceLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.text || '#666';
    }};
`;

const EnhanceText = styled.div`
  padding: 12px;
  background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '#faf8f3';
        if (theme.mode === 'dark') return '#1a1a1a';
        return '#f8f8f8';
    }};
  border-radius: 8px;
  border: ${({ $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return '1px solid rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return 'none';
    }};
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#5a4a3a';
        if (theme.mode === 'dark') return '#fff';
        return '#222';
    }};
  font-size: 15px;
`;

const EnhanceTitleText = styled.div`
  padding: 12px;
  background-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '#faf8f3';
        if (theme.mode === 'dark') return '#1a1a1a';
        return '#f8f8f8';
    }};
  border-radius: 8px;
  border: ${({ $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return '1px solid rgba(255, 255, 255, 0.2)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return 'none';
    }};
  width: fit-content;
  max-width: 100%;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#5a4a3a';
        if (theme.mode === 'dark') return '#fff';
        return '#222';
    }};
  font-size: 15px;
`;

const EnhanceModalFooter = styled.div`
  padding: 20px 24px;
  border-top: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return '1px solid rgba(255, 255, 255, 0.3)';
        if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return `1px solid ${theme.border || '#e0e0e0'}`;
    }};
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const EnhanceModalButton = styled.button`
  flex: 1 1 0;
  padding: 10px 0;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
`;

const EnhanceCancelButton = styled(EnhanceModalButton)`
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

const EnhanceApplyButton = styled(EnhanceModalButton)`
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

// 임시저장 모달 스타일 (ConfirmModal과 동일한 구조)
const TempSaveModalOverlay = styled.div`
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
  z-index: 2000;
    padding: 80px 20px 120px 20px;
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

const TempSaveModalContainer = styled.div`
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

const TempSaveModalTitle = styled.h3`
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

const TempSaveModalDesc = styled.p`
    margin: 0 0 22px 0;
    font-size: 13px;
    color: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.7)';
        if ($isDiaryTheme) return '#5C4B37';
        if (theme.mode === 'dark') return '#ccc';
        return '#444';
    }};
`;

const TempSaveModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const TempSaveModalButton = styled.button`
    flex: 1 1 0;
    padding: 10px 0;
  border: none;
  border-radius: 8px;
    font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
    transition: all 0.15s;
`;

const TempSaveCancelButton = styled(TempSaveModalButton)`
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

const TempSaveConfirmButton = styled(TempSaveModalButton)`
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

// 스티커 관련 스타일 컴포넌트들

const StickerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const StickerHandle = styled.div`
  position: absolute;
  width: 12px;
  height: 12px;
  background: #cb6565;
  border: 2px solid white;
  border-radius: 50%;
  cursor: ${props => props.cursor || 'pointer'};
  z-index: 10;
  pointer-events: auto;
  
  &:hover {
    background: #a54a4a;
    transform: scale(1.2);
  }
`;

const StickerDeleteButton = styled.button`
  position: absolute;
  top: -10px;
  right: -10px;
  width: 24px;
  height: 24px;
  border: none;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 6px rgba(255, 71, 87, 0.3);
  z-index: 15;
  transition: all 0.2s ease;
  
  &:hover {
    background: #ff3742;
    transform: scale(1.15);
    box-shadow: 0 4px 8px rgba(255, 71, 87, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const StickerPanel = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => {
        if (props.$isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if (props.$isDiaryTheme) return '#faf8f3';
        if (props.theme.mode === 'dark') return '#232323';
        return '#fff';
    }};
  backdrop-filter: ${props => props.$isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.$isGlassTheme ? 'blur(15px)' : 'none'};
  border-top-left-radius: ${props => props.$isGlassTheme ? '24px' : '20px'};
  border-top-right-radius: ${props => props.$isGlassTheme ? '24px' : '20px'};
  border-top: ${props => {
        if (props.$isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
        if (props.$isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.15)';
        return 'none';
    }};
  box-shadow: ${props => {
        if (props.$isGlassTheme) return '0 -4px 20px rgba(0, 0, 0, 0.15), 0 -2px 8px rgba(0, 0, 0, 0.1)';
        if (props.$isDiaryTheme) return '0 -2px 16px rgba(0, 0, 0, 0.06), 0 -1px 3px rgba(0, 0, 0, 0.04)';
        if (props.theme.mode === 'dark') return '0 -2px 16px rgba(0,0,0,0.32)';
        return '0 -2px 16px rgba(0,0,0,0.12)';
    }};
  padding: 24px;
  z-index: 1000;
  max-height: 60vh;
  overflow-y: auto;
  animation: slideUp 0.2s ease;
`;

const StickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 20px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(6, 1fr);
  }
`;

const StickerItem = styled.button`
  width: 50px;
  height: 50px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 8px;
  padding: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background: ${props => {
        if (props.$isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        if (props.$isDiaryTheme) return 'rgba(139, 111, 71, 0.1)';
        if (props.theme.mode === 'dark') return '#333';
        return '#fdfdfd';
    }};
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const StickerButton = styled.button`
  position: fixed;
  bottom: 120px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: ${props => props.$isGlassTheme
        ? 'rgba(255, 255, 255, 0.2)'
        : '#cb6565'};
  backdrop-filter: ${props => props.$isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.$isGlassTheme ? 'blur(15px)' : 'none'};
  border: ${props => props.$isGlassTheme
        ? '2px solid rgba(255, 255, 255, 0.5)'
        : 'none'};
  border-radius: 50%;
  color: ${props => props.$isGlassTheme ? '#000000' : 'white'};
  font-size: 24px;
  cursor: pointer;
  box-shadow: ${props => props.$isGlassTheme
        ? '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)'
        : '0 4px 12px rgba(203, 101, 101, 0.3)'};
  transition: all 0.2s ease;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.$isGlassTheme
        ? 'rgba(255, 255, 255, 0.3)'
        : '#a54a4a'};
    transform: scale(1.1);
    box-shadow: ${props => props.$isGlassTheme
        ? '0 6px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)'
        : '0 6px 16px rgba(203, 101, 101, 0.4)'};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const StickerPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${({ theme }) => theme.mode === 'dark' ? '#aaa' : '#999'};
  font-size: 14px;
  
  .icon {
    font-size: 32px;
    margin-bottom: 8px;
  }
`;

// 포인트 지급 애니메이션 스타일 (카카오 로딩 화면 스타일)
const PointEarnOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  pointer-events: none;
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const PointEarnAnimation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  animation: pointEarnPop 2s ease-out forwards;
  
  @keyframes pointEarnPop {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    15% {
      opacity: 1;
      transform: scale(1.1);
    }
    30% {
      transform: scale(1);
    }
    70% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    100% {
      opacity: 0;
      transform: scale(0.9) translateY(-30px);
    }
  }
`;

const PointEarnIcon = styled.div`
  font-size: 48px;
  animation: coinSpin 0.6s ease-out;
  
  @keyframes coinSpin {
    0% {
      transform: rotateY(0deg) scale(0.5);
    }
    50% {
      transform: rotateY(180deg) scale(1.2);
    }
    100% {
      transform: rotateY(360deg) scale(1);
    }
  }
`;

const PointEarnText = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  text-align: center;
`;

const PointEarnAmount = styled.div`
  font-size: 42px;
  font-weight: 700;
  color: #FFD700;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 2px 8px rgba(255, 215, 0, 0.5);
  animation: numberPop 0.4s ease-out 0.2s both;
  
  @keyframes numberPop {
    0% {
      opacity: 0;
      transform: scale(0.5);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const PointEarnDesc = styled.div`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
`;

// 사진 추가하기 버튼 styled-component 추가
const UploadLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  border-radius: ${props => props.$isGlassTheme ? '12px' : '8px'};
  background: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
        return theme.mode === 'dark' ? '#2a2a2a' : '#fdfdfd';
    }};
  backdrop-filter: ${props => props.$isGlassTheme ? 'blur(10px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.$isGlassTheme ? 'blur(10px)' : 'none'};
  color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        return theme.mode === 'dark' ? '#ccc' : '#666';
    }};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '2px dashed rgba(255, 255, 255, 0.5)';
        return `2px dashed ${theme.mode === 'dark' ? '#4a4a4a' : '#ddd'}`;
    }};
  box-shadow: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '0 2px 8px rgba(0, 0, 0, 0.1)';
        return theme.mode === 'dark' ? '0 2px 6px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.1)';
    }};
  transition: all 0.2s;
  font-family: inherit;
  &:hover {
    background: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
        return theme.mode === 'dark' ? '#3a3a3a' : '#e8e8e8';
    }};
    box-shadow: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return '0 4px 12px rgba(0, 0, 0, 0.15)';
        return theme.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.15)';
    }};
    border-color: ${({ theme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(255, 255, 255, 0.7)';
        return theme.mode === 'dark' ? '#5a5a5a' : '#bbb';
    }};
  }
  & > .icon {
    font-size: 28px;
    margin-bottom: 6px;
  }
`;

// DiaryView와 동일한 스타일의 제목, 본문 인풋 스타일 적용
const TitleInput = styled.input`
  font-size: 20px !important;
  font-weight: 700 !important;
  margin: 0;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) =>
        $isGlassTheme ? '#000000' : $isDiaryTheme ? '#8B6F47' : theme.diaryText} !important;
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  font-family: inherit;
`;
const ContentTextarea = styled.textarea`
  font-size: 16px;
  line-height: 1.8;
  letter-spacing: 0.02em;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) =>
        $isGlassTheme ? '#000000' : $isDiaryTheme ? '#5C4B37' : theme.diaryContent};
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  resize: none;
  font-family: inherit;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;
  position: relative;
  min-height: 300px;
  padding: 0;
  margin: 0;
  overflow: hidden;
`;

const ContentContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  min-height: 300px;
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  overflow: ${() => window.innerWidth <= 768 ? 'hidden' : 'visible'};
  box-sizing: border-box;
`;

const StickerElement = styled.div`
  position: absolute;
  cursor: move;
  user-select: none;
  border: ${props => props.isSelected ? '2px solid #cb6565' : 'none'};
  border-radius: 4px;
  
  &:hover {
    border: 2px solid #cb6565;
  }
`;

function WriteDiary({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [diary, setDiary] = useState({
        title: '',
        content: '',
        mood: '',
        imageUrls: [],
        weather: '',
        emotion: ''
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreview, setImagePreview] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingDiaryId, setExistingDiaryId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEmotionSheetOpen, setIsEmotionSheetOpen] = useState(false);
    const [isWeatherSheetOpen, setIsWeatherSheetOpen] = useState(false);
    const toast = useToast();
    const prevLocation = useRef(location);
    const textareaRef = useRef();
    const theme = useTheme();
    const isDark = theme.actualTheme === 'dark';
    const isDiaryTheme = theme.actualTheme === 'diary';
    const isGlassTheme = theme.actualTheme === 'glass';
    const labelColor = isDark ? '#fff' : '#222';
    const themeObj = isDiaryTheme
        ? { text: '#8B6F47', card: '#faf8f3', border: 'rgba(139, 111, 71, 0.15)' }
        : isDark
            ? { text: '#fff', card: '#2a2a2a', border: '#444' }
            : { text: '#333', card: '#fff', border: '#e0e0e0' };
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const containerRef = useRef();
    const [isPremium, setIsPremium] = useState(false);
    const [imageLimitExtended, setImageLimitExtended] = useState(false); // 프리미엄 회원이었을 때 작성한 일기인지 여부
    const { t } = useTranslation();
    const { language } = useLanguage();

    // AI 보강 관련 state
    const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
    const [enhancedContent, setEnhancedContent] = useState('');
    const [enhancedTitle, setEnhancedTitle] = useState('');
    const [isEnhancing, setIsEnhancing] = useState(false);

    // 스티커 관련 state
    const [stickers, setStickers] = useState([]);
    const [isStickerPanelOpen, setIsStickerPanelOpen] = useState(false);
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [stickerCounter, setStickerCounter] = useState(0);
    const [contentHeight, setContentHeight] = useState(300);
    const [draggedSticker, setDraggedSticker] = useState(null);
    const [dragStartPos, setDragStartPos] = useState(null);

    // 이미지 드래그 앤 드롭 관련 state
    const [draggedImageIndex, setDraggedImageIndex] = useState(null);
    const [dragOverImageIndex, setDragOverImageIndex] = useState(null);
    const [touchStartIndex, setTouchStartIndex] = useState(null);
    const [touchStartY, setTouchStartY] = useState(null);

    // 이미지 뷰어 모달 관련 state
    const [selectedImageIndex, setSelectedImageIndex] = useState(null);

    // 포인트 지급 애니메이션 관련 state
    const [showPointAnimation, setShowPointAnimation] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState(0);
    const [shouldDelayNavigation, setShouldDelayNavigation] = useState(false);
    const [showBonusAnimation, setShowBonusAnimation] = useState(false);
    const [bonusPoints, setBonusPoints] = useState(0);

    // 임시저장 관련 state
    const [isTempSaveModalOpen, setIsTempSaveModalOpen] = useState(false);
    const [hasTempSave, setHasTempSave] = useState(false);
    const isInitialLoad = useRef(true);

    // 임시저장 키 생성 함수
    const getTempSaveKey = useCallback((date) => {
        const dateStr = formatDateToString(date);
        return `diary_temp_${user?.uid}_${dateStr}`;
    }, [user?.uid]);

    // blob URL을 base64로 변환하는 함수
    const blobUrlToBase64 = async (blobUrl) => {
        try {
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('blob URL을 base64로 변환 실패:', error);
            return null;
        }
    };

    // 임시저장 함수
    const saveTempDiary = useCallback(async (date, showNotification = false) => {
        if (!user?.uid) return;

        // blob URL을 base64로 변환
        const imageDataPromises = imagePreview.map(async (url) => {
            if (url.startsWith('blob:')) {
                const base64 = await blobUrlToBase64(url);
                return base64 ? { type: 'base64', data: base64 } : null;
            } else {
                // 기존 URL은 그대로 저장
                return { type: 'url', data: url };
            }
        });

        const imageData = await Promise.all(imageDataPromises);
        const validImageData = imageData.filter(data => data !== null);

        const tempData = {
            title: diary.title,
            content: diary.content,
            mood: diary.mood,
            weather: diary.weather,
            emotion: diary.emotion,
            stickers: stickers,
            imageData: validImageData, // base64 또는 URL 저장
            savedAt: new Date().toISOString()
        };

        // 내용이 있을 때만 저장
        if (tempData.content.trim().length > 0 || tempData.title.trim().length > 0) {
            const key = getTempSaveKey(date);
            try {
                localStorage.setItem(key, JSON.stringify(tempData));
                setHasTempSave(true);
                // 알림 표시 옵션이 있으면 토스트 표시
                if (showNotification) {
                    toast.showToast('임시저장됨', 'success');
                }
            } catch (error) {
                console.error('임시저장 실패:', error);
                // localStorage 크기 제한 초과 시 이전 방식으로 저장 (blob URL 제외)
                if (error.name === 'QuotaExceededError') {
                    const fallbackData = {
                        ...tempData,
                        imageData: imagePreview.filter(url => !url.startsWith('blob:')).map(url => ({ type: 'url', data: url }))
                    };
                    try {
                        localStorage.setItem(key, JSON.stringify(fallbackData));
                    } catch (fallbackError) {
                        console.error('임시저장 폴백 실패:', fallbackError);
                    }
                }
            }
        }
    }, [diary, stickers, imagePreview, user?.uid, getTempSaveKey, toast]);

    // 임시저장 불러오기 함수
    const loadTempDiary = useCallback((date) => {
        if (!user?.uid) return null;
        try {
            const key = getTempSaveKey(date);
            const saved = localStorage.getItem(key);
            if (!saved) return null;

            const parsed = JSON.parse(saved);

            // 빈 객체나 null이 아닌지 확인
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                // 잘못된 형식의 데이터는 삭제
                localStorage.removeItem(key);
                return null;
            }

            // 실제로 내용이 있는지 엄격하게 확인
            const hasContent =
                (parsed.content && typeof parsed.content === 'string' && parsed.content.trim().length > 0) ||
                (parsed.title && typeof parsed.title === 'string' && parsed.title.trim().length > 0) ||
                (parsed.imageData && Array.isArray(parsed.imageData) && parsed.imageData.length > 0) ||
                (parsed.stickers && Array.isArray(parsed.stickers) && parsed.stickers.length > 0);

            if (hasContent) {
                return parsed;
            } else {
                // 내용이 없는 빈 데이터는 삭제
                localStorage.removeItem(key);
                return null;
            }
        } catch (error) {
            console.error('임시저장 불러오기 실패:', error);
            // 파싱 에러가 발생하면 잘못된 데이터이므로 삭제
            try {
                const key = getTempSaveKey(date);
                localStorage.removeItem(key);
            } catch (e) {
                // 삭제 실패는 무시
            }
            return null;
        }
    }, [user?.uid, getTempSaveKey]);

    // 임시저장 삭제 함수
    const clearTempDiary = useCallback((date) => {
        if (!user?.uid) return;
        try {
            const key = getTempSaveKey(date);
            localStorage.removeItem(key);
            setHasTempSave(false);
        } catch (error) {
            console.error('임시저장 삭제 실패:', error);
        }
    }, [user?.uid, getTempSaveKey]);

    // 이미지 뷰어 키보드 이벤트
    useEffect(() => {
        if (selectedImageIndex === null) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedImageIndex(null);
            } else if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
                setSelectedImageIndex(selectedImageIndex - 1);
            } else if (e.key === 'ArrowRight' && selectedImageIndex < imagePreview.length - 1) {
                setSelectedImageIndex(selectedImageIndex + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedImageIndex, imagePreview.length]);

    const weatherImageMap = {
        sunny: '/weather/sunny.png',
        cloudy: '/weather/cloudy.png',
        rainy: '/weather/rainy.png',
        snowy: '/weather/snowy.png',
        windy: '/weather/windy.png',
        thunder: '/weather/thunder.png',
    };
    const weatherOptions = [
        { value: 'sunny', label: '맑음' },
        { value: 'cloudy', label: '흐림' },
        { value: 'rainy', label: '비' },
        { value: 'snowy', label: '눈' },
        { value: 'windy', label: '바람' },
        { value: 'thunder', label: '천둥' },
    ];
    const emotionImageMap = {
        love: '/emotions/love.png',
        good: '/emotions/good.png',
        normal: '/emotions/normal.png',
        surprised: '/emotions/surprised.png',
        angry: '/emotions/angry.png',
        cry: '/emotions/cry.png',
    };
    const emotionOptions = [
        { value: 'love', label: '완전행복' },
        { value: 'good', label: '기분좋음' },
        { value: 'normal', label: '평범함' },
        { value: 'surprised', label: '놀람' },
        { value: 'angry', label: '화남' },
        { value: 'cry', label: '슬픔' }
    ];

    // 스티커 목록
    const stickerList = [
        { id: 'cutlery', name: '커틀러리', src: '/sticker/cutlery.png' },
        { id: 'closednote', name: '노트', src: '/sticker/closednote.png' },
        { id: 'note', name: '메모', src: '/sticker/note.png' },
        { id: 'error', name: '에러', src: '/sticker/error.png' },
        { id: 'clock', name: '시계', src: '/sticker/clock.png' },
        { id: 'music2', name: '음악', src: '/sticker/music2.png' },
        { id: 'phone_chat', name: '채팅', src: '/sticker/phone_chat.png' },
        { id: 'hamburger', name: '햄버거', src: '/sticker/hamburger.png' },
        { id: 'cake2', name: '케이크', src: '/sticker/cake2.png' },
        { id: 'laptop2', name: '노트북', src: '/sticker/laptop2.png' },
        { id: 'coffee_takeout', name: '커피', src: '/sticker/coffee_takeout.png' },
        { id: 'bed', name: '침대', src: '/sticker/bed.png' },
        { id: 'music', name: '음악', src: '/sticker/music.png' },
        { id: 'shopping', name: '쇼핑', src: '/sticker/shopping.png' },
        { id: 'juice', name: '주스', src: '/sticker/juice.png' },
        { id: 'laptop', name: '노트북', src: '/sticker/laptop.png' },
        { id: 'camera', name: '카메라', src: '/sticker/camera.png' },
        { id: 'calander', name: '달력', src: '/sticker/calander.png' },
        { id: 'run', name: '달리기', src: '/sticker/run.png' },
        { id: 'gift', name: '선물', src: '/sticker/gift.png' },
        { id: 'piggybank', name: '저금통', src: '/sticker/piggybank.png' },
        { id: 'heart', name: '하트', src: '/sticker/heart.png' },
        { id: 'weight', name: '운동', src: '/sticker/weight.png' },
        { id: 'movie', name: '영화', src: '/sticker/movie.png' },
        { id: 'cake', name: '케이크', src: '/sticker/cake.png' },
        { id: 'sleep', name: '잠', src: '/sticker/sleep.png' },
        { id: 'Headset', name: '헤드셋', src: '/sticker/Headset.png' },
        { id: 'food', name: '음식', src: '/sticker/food.png' },
        { id: 'diary2', name: '다이어리', src: '/sticker/diary2.png' },
        { id: 'laundry', name: '빨래', src: '/sticker/laundry.png' },
        { id: 'noddle', name: '면', src: '/sticker/noddle.png' },
        { id: 'love_chat', name: '러브채팅', src: '/sticker/love_chat.png' },
        { id: 'food2', name: '음식2', src: '/sticker/food2.png' },
        { id: 'diary', name: '다이어리', src: '/sticker/diary.png' },
        { id: 'coffee', name: '커피', src: '/sticker/coffee.png' }
    ];

    useEffect(() => {
        // location.state에서 전달받은 날짜 처리
        if (location.state && location.state.selectedDate && user) {
            const date = new Date(location.state.selectedDate.replace(/-/g, '/'));
            setSelectedDate(date);
            fetchDiaryForDate(date);
            // 날짜가 변경되면 초기 로드 상태로 리셋
            isInitialLoad.current = true;
        } else {
            // URL 파라미터에서 날짜 처리 (기존 방식)
            const params = new URLSearchParams(location.search);
            const dateParam = params.get('date');
            if (dateParam && user) {
                // new Date()는 T00:00:00Z가 아닌 로컬 시간대를 사용하도록 합니다.
                const date = new Date(dateParam.replace(/-/g, '/'));
                setSelectedDate(date);
                fetchDiaryForDate(date);
                // 날짜가 변경되면 초기 로드 상태로 리셋
                isInitialLoad.current = true;
            }
        }
    }, [location, user]);

    // selectedDate가 변경될 때마다 isInitialLoad 리셋 및 임시저장 상태 초기화
    useEffect(() => {
        if (selectedDate) {
            isInitialLoad.current = true;
            // 날짜가 변경되면 임시저장 상태 초기화
            setHasTempSave(false);
            setIsTempSaveModalOpen(false);
        }
    }, [selectedDate]);

    // 페이지 진입 시 임시저장 확인 (fetchDiaryForDate 완료 후)
    useEffect(() => {
        if (!user?.uid || !selectedDate || !isInitialLoad.current) return;

        // fetchDiaryForDate가 완료된 후 임시저장 확인
        const checkTempSave = async () => {
            // 약간의 지연을 두어 fetchDiaryForDate가 완료되도록 함
            await new Promise(resolve => setTimeout(resolve, 500));

            const dateStr = formatDateToString(selectedDate);
            const diariesRef = collection(db, 'diaries');
            const q = query(diariesRef, where('userId', '==', user.uid), where('date', '==', dateStr));
            const querySnapshot = await getDocs(q);

            // 기존 일기가 없고, 현재 선택된 날짜에 임시저장이 있으면 모달 표시
            if (querySnapshot.empty) {
                const tempData = loadTempDiary(selectedDate);
                // loadTempDiary에서 이미 내용 검증을 했으므로, null이 아니면 유효한 데이터
                // 현재 선택된 날짜의 임시저장만 확인
                if (tempData) {
                    setHasTempSave(true);
                    setIsTempSaveModalOpen(true);
                } else {
                    // 현재 날짜에 임시저장이 없으면 상태 초기화
                    setHasTempSave(false);
                    setIsTempSaveModalOpen(false);
                }
            } else {
                // 기존 일기가 있으면 임시저장 모달 표시하지 않음
                setHasTempSave(false);
                setIsTempSaveModalOpen(false);
            }
            isInitialLoad.current = false;
        };

        checkTempSave();
    }, [selectedDate, user, loadTempDiary]);

    // diary 상태 변경 시 자동 임시저장 (디바운싱)
    useEffect(() => {
        if (!user?.uid || !selectedDate || isInitialLoad.current) return;

        const timeoutId = setTimeout(() => {
            saveTempDiary(selectedDate);
        }, 1000); // 1초 후 저장

        return () => clearTimeout(timeoutId);
    }, [diary.title, diary.content, diary.mood, diary.weather, diary.emotion, stickers, selectedDate, saveTempDiary]);

    // 중복 토스트 방지를 위한 ref
    const lastSaveTimeRef = useRef(0);
    const SAVE_COOLDOWN = 3000; // 3초 내 중복 저장 방지

    // 페이지 이탈 시 임시저장
    useEffect(() => {
        if (!user?.uid || !selectedDate) return;

        let visibilityChangeTimeout = null;
        let isUnmounting = false;

        const handleBeforeUnload = (e) => {
            saveTempDiary(selectedDate, false); // beforeunload에서는 토스트 표시 불가
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                const now = Date.now();
                // 최근에 저장했으면 토스트 표시하지 않음
                if (now - lastSaveTimeRef.current < SAVE_COOLDOWN) {
                    saveTempDiary(selectedDate, false);
                    return;
                }

                // 디바운싱: 짧은 시간 내 여러 번 호출되는 것을 방지
                if (visibilityChangeTimeout) {
                    clearTimeout(visibilityChangeTimeout);
                }
                visibilityChangeTimeout = setTimeout(() => {
                    // 탭 전환 시 토스트 표시 (언마운트 중이 아닐 때만)
                    if (!isUnmounting) {
                        saveTempDiary(selectedDate, true);
                        lastSaveTimeRef.current = Date.now();
                    } else {
                        saveTempDiary(selectedDate, false);
                    }
                }, 200);
            } else {
                // 탭이 다시 보일 때 타이머 취소
                if (visibilityChangeTimeout) {
                    clearTimeout(visibilityChangeTimeout);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isUnmounting = true; // 언마운트 시작 표시
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (visibilityChangeTimeout) {
                clearTimeout(visibilityChangeTimeout);
            }
            // cleanup에서는 토스트 표시하지 않음 (의존성 변경으로 인한 재실행 방지)
            saveTempDiary(selectedDate, false);
        };
    }, [selectedDate, saveTempDiary]);

    // location 변경 감지로 실제 페이지 이탈 확인
    const prevLocationRef = useRef(location.pathname);
    useEffect(() => {
        const currentPath = location.pathname;
        const prevPath = prevLocationRef.current;

        // 실제로 다른 페이지로 이동한 경우
        if (prevPath === '/write' || prevPath.startsWith('/write')) {
            if (currentPath !== '/write' && !currentPath.startsWith('/write')) {
                const now = Date.now();
                // 최근에 저장하지 않았을 때만 토스트 표시
                if (now - lastSaveTimeRef.current > SAVE_COOLDOWN) {
                    saveTempDiary(selectedDate, true);
                    lastSaveTimeRef.current = now;
                }
            }
        }

        prevLocationRef.current = currentPath;
    }, [location.pathname, selectedDate, saveTempDiary]);

    useEffect(() => {
        if (textareaRef.current) {
            // 텍스트 변경 시 컨테이너 크기 업데이트 (텍스트 높이만 고려)
            setTimeout(() => updateContainerSize(), 0);
        }
    }, [diary.content]);

    useEffect(() => {
        setDiary(prev => ({ ...prev, date: formatDateToString(selectedDate) }));
    }, [selectedDate]);

    useEffect(() => {
        let onShow, onHide;
        if (Capacitor.getPlatform() !== 'web') {
            onShow = Keyboard.addListener('keyboardWillShow', (info) => {
                setKeyboardHeight(info.keyboardHeight);
                // 키보드가 올라올 때 입력창이 가려지지 않도록 스크롤
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }, 100);
            });
            onHide = Keyboard.addListener('keyboardWillHide', () => {
                setKeyboardHeight(0);
            });
        }
        return () => {
            if (onShow) onShow.remove();
            if (onHide) onHide.remove();
        };
    }, []);

    useEffect(() => {
        if (user?.uid) {
            const fetchPremiumStatus = async () => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setIsPremium(userData.isMonthlyPremium || userData.isYearlyPremium || false);
                    }
                } catch (error) {
                    console.error('프리미엄 상태 조회 실패:', error);
                }
            };
            fetchPremiumStatus();
        }
    }, [user]);


    // 스티커 드래그 앤 드롭 기능
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (draggedSticker) {
                handleDragMove(e);
            }
        };

        const handleMouseUp = () => {
            if (draggedSticker) {
                handleDragEnd();
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleMouseMove, { passive: false });
        document.addEventListener('touchend', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleMouseMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [draggedSticker, dragStartPos, stickers]);

    // fetchDiaryForDate에서 imageLimitExtended 필드 반영
    const fetchDiaryForDate = async (date) => {
        const dateStr = formatDateToString(date);
        const diariesRef = collection(db, 'diaries');
        const q = query(diariesRef, where('userId', '==', user.uid), where('date', '==', dateStr));

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const existingDiary = querySnapshot.docs[0].data();
            const diaryId = querySnapshot.docs[0].id;
            setDiary({
                title: existingDiary.title,
                content: existingDiary.content,
                mood: existingDiary.mood || '',
                imageUrls: existingDiary.imageUrls || [],
                weather: existingDiary.weather || '',
                emotion: existingDiary.emotion || '',
                date: dateStr,
            });
            setImagePreview(existingDiary.imageUrls || []);
            setStickers(existingDiary.stickers || []);
            setStickerCounter(existingDiary.stickers ? existingDiary.stickers.length : 0);
            setIsEditMode(true);
            setExistingDiaryId(diaryId);
            // 프리미엄 회원이었을 때 작성한 일기인지 확인
            setImageLimitExtended(existingDiary.imageLimitExtended || false);
            // 기존 일기가 있으면 임시저장 삭제
            clearTempDiary(date);
        } else {
            // Reset form if no diary exists for the new date
            setDiary({
                title: '',
                content: '',
                mood: '',
                imageUrls: [],
                weather: '',
                emotion: '',
                date: dateStr,
            });
            setImagePreview([]);
            setStickers([]);
            setStickerCounter(0);
            setIsEditMode(false);
            setExistingDiaryId(null);
            setImageLimitExtended(false);
        }
    };

    // 날짜 포맷팅
    const formattedDate = {
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate()
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDiary(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleImageUpload = async (e) => {
        const newFiles = Array.from(e.target.files);
        const totalImages = imagePreview.length + newFiles.length;
        const maxImages = (isPremium || imageLimitExtended) ? 4 : 1;

        if (totalImages > maxImages) {
            if (!(isPremium || imageLimitExtended)) {
                toast.showToast(t('image_limit_premium_required'), 'info');
            } else {
                toast.showToast(t('image_limit_max'), 'error');
            }
            return;
        }
        // 이미지 압축 및 리사이즈
        const compressedFiles = await Promise.all(
            newFiles.map(file =>
                imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                })
            )
        );
        // imageFiles와 imagePreview를 함께 관리하여 순서 추적
        const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));
        setImageFiles(prev => [...prev, ...compressedFiles]);
        setImagePreview(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (indexToRemove) => {
        const existingUrlCount = (diary.imageUrls || []).length;

        setImagePreview(prev => prev.filter((_, i) => i !== indexToRemove));

        if (indexToRemove < existingUrlCount) {
            // 기존에 업로드되었던 이미지 제거 (diary.imageUrls에서 제거)
            const urlToRemove = diary.imageUrls[indexToRemove];
            setDiary(prev => ({
                ...prev,
                imageUrls: prev.imageUrls.filter(url => url !== urlToRemove)
            }));
        } else {
            // 이번에 새로 첨부한 파일 제거 (imageFiles에서 제거)
            const fileIndexToRemove = indexToRemove - existingUrlCount;
            setImageFiles(prev => prev.filter((_, i) => i !== fileIndexToRemove));
        }
    };

    // 이미지 순서 변경 함수
    const reorderImages = (fromIndex, toIndex) => {
        if (fromIndex === toIndex) return;

        const existingUrlCount = (diary.imageUrls || []).length;

        // imagePreview 순서 변경
        const newImagePreview = [...imagePreview];
        const [movedPreview] = newImagePreview.splice(fromIndex, 1);
        newImagePreview.splice(toIndex, 0, movedPreview);
        setImagePreview(newImagePreview);

        // diary.imageUrls와 imageFiles 순서 변경
        if (fromIndex < existingUrlCount && toIndex < existingUrlCount) {
            // 둘 다 기존 이미지인 경우
            const newImageUrls = [...diary.imageUrls];
            const [movedUrl] = newImageUrls.splice(fromIndex, 1);
            newImageUrls.splice(toIndex, 0, movedUrl);
            setDiary(prev => ({
                ...prev,
                imageUrls: newImageUrls
            }));
        } else if (fromIndex >= existingUrlCount && toIndex >= existingUrlCount) {
            // 둘 다 새 파일인 경우
            const newImageFiles = [...imageFiles];
            const fileFromIndex = fromIndex - existingUrlCount;
            const fileToIndex = toIndex - existingUrlCount;
            const [movedFile] = newImageFiles.splice(fileFromIndex, 1);
            newImageFiles.splice(fileToIndex, 0, movedFile);
            setImageFiles(newImageFiles);
        }
        // 기존 이미지와 새 파일이 섞이는 경우는 imagePreview 순서만 변경
        // 저장 시 imagePreview 순서를 기준으로 재구성하므로 여기서는 imagePreview만 변경
    };

    // 이미지 드래그 시작
    const handleImageDragStart = (e, index) => {
        console.log('드래그 시작:', index, e);
        setDraggedImageIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    // 이미지 드래그 오버
    const handleImageDragOver = (e, index) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedImageIndex !== null && draggedImageIndex !== index) {
            setDragOverImageIndex(index);
        }
    };

    // 이미지 드래그 리브
    const handleImageDragLeave = (e) => {
        e.preventDefault();
        // 자식 요소로 이동하는 경우는 무시하지 않음
        setDragOverImageIndex(null);
    };

    // 이미지 드롭
    const handleImageDrop = (e, dropIndex) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('드롭:', draggedImageIndex, '->', dropIndex);

        if (draggedImageIndex === null || draggedImageIndex === dropIndex) {
            setDraggedImageIndex(null);
            setDragOverImageIndex(null);
            return;
        }

        reorderImages(draggedImageIndex, dropIndex);
        setDraggedImageIndex(null);
        setDragOverImageIndex(null);
    };

    // 이미지 드래그 종료
    const handleImageDragEnd = (e) => {
        console.log('드래그 종료');
        setDraggedImageIndex(null);
        setDragOverImageIndex(null);
    };

    // 터치 이벤트 핸들러 (모바일 지원) - useRef로 passive: false 설정
    const imageBoxRefs = useRef([]);
    const touchHandlersRef = useRef({});

    useEffect(() => {
        // 터치 이벤트 리스너를 passive: false로 등록
        const boxes = imageBoxRefs.current;
        const handlers = touchHandlersRef.current;

        boxes.forEach((box, index) => {
            if (!box) return;

            // 기존 핸들러 제거
            if (handlers[index]) {
                const { start, move, end } = handlers[index];
                box.removeEventListener('touchstart', start);
                box.removeEventListener('touchmove', move);
                box.removeEventListener('touchend', end);
            }

            const handleTouchStart = (e) => {
                const touch = e.touches[0];
                console.log('터치 시작:', index);
                setTouchStartIndex(index);
                setTouchStartY(touch.clientY);
                setDraggedImageIndex(index);
            };

            const handleTouchMove = (e) => {
                const currentTouchStartIndex = touchStartIndex;
                if (currentTouchStartIndex === null || currentTouchStartIndex !== index) return;

                e.preventDefault(); // passive: false이므로 가능
                const touch = e.touches[0];
                const currentY = touch.clientY;
                const startY = touchStartY;

                if (startY === null) return;

                const deltaY = currentY - startY;
                const boxHeight = 108;
                const newIndex = Math.round(currentTouchStartIndex + (deltaY / boxHeight));

                if (newIndex >= 0 && newIndex < imagePreview.length && newIndex !== currentTouchStartIndex) {
                    setDragOverImageIndex(newIndex);
                }
            };

            const handleTouchEnd = (e) => {
                const currentTouchStartIndex = touchStartIndex;
                const currentDragOverIndex = dragOverImageIndex;

                if (currentTouchStartIndex === null || currentTouchStartIndex !== index) return;

                console.log('터치 종료:', currentTouchStartIndex, '->', currentDragOverIndex);

                if (currentDragOverIndex !== null && currentDragOverIndex !== currentTouchStartIndex) {
                    reorderImages(currentTouchStartIndex, currentDragOverIndex);
                }

                setTouchStartIndex(null);
                setTouchStartY(null);
                setDraggedImageIndex(null);
                setDragOverImageIndex(null);
            };

            box.addEventListener('touchstart', handleTouchStart, { passive: true });
            box.addEventListener('touchmove', handleTouchMove, { passive: false });
            box.addEventListener('touchend', handleTouchEnd, { passive: true });

            handlers[index] = {
                start: handleTouchStart,
                move: handleTouchMove,
                end: handleTouchEnd
            };
        });

        return () => {
            boxes.forEach((box, index) => {
                if (!box || !handlers[index]) return;
                const { start, move, end } = handlers[index];
                box.removeEventListener('touchstart', start);
                box.removeEventListener('touchmove', move);
                box.removeEventListener('touchend', end);
            });
        };
    }, [imagePreview.length]);

    const handleDelete = async () => {
        if (window.confirm(t('diary_delete_confirm'))) {
            if (existingDiaryId) {
                try {
                    const diaryRef = doc(db, 'diaries', existingDiaryId);
                    await deleteDoc(diaryRef);
                    alert(t('diary_deleted'));
                    navigate('/diaries', { replace: true });
                } catch (error) {
                    alert(t('diary_delete_failed'));
                }
            }
        }
    };


    // 감정/날씨 바텀시트 오버레이 닫기 핸들러
    const closeSheets = () => {
        setIsEmotionSheetOpen(false);
        setIsWeatherSheetOpen(false);
    };

    // 스티커 관련 함수들
    const addSticker = (sticker) => {
        const newSticker = {
            id: `sticker_${stickerCounter}`,
            type: sticker.id,
            src: sticker.src,
            x: 50,
            y: 50,
            width: 60,
            height: 60,
            zIndex: stickerCounter
        };
        setStickers(prev => [...prev, newSticker]);
        setStickerCounter(prev => prev + 1);
        setIsStickerPanelOpen(false);
    };

    const updateStickerPosition = (stickerId, x, y) => {
        setStickers(prev => {
            const sticker = prev.find(s => s.id === stickerId);
            if (!sticker) return prev;

            // ContentContainer의 현재 너비 가져오기
            const contentContainer = document.querySelector('[data-content-container]');
            const containerWidth = contentContainer ? contentContainer.offsetWidth : 600;
            const padding = 16; // ContentContainer의 padding
            const maxX = containerWidth - padding * 2 - sticker.width; // 오른쪽 경계
            const minX = 0; // 왼쪽 경계

            // x 좌표를 경계 내로 제한
            const clampedX = Math.max(minX, Math.min(maxX, x));

            return prev.map(sticker =>
                sticker.id === stickerId
                    ? { ...sticker, x: clampedX, y }
                    : sticker
            );
        });
    };

    const updateStickerSize = (stickerId, width, height) => {
        setStickers(prev => prev.map(sticker =>
            sticker.id === stickerId
                ? { ...sticker, width, height }
                : sticker
        ));
    };



    const removeSticker = (stickerId) => {
        setStickers(prev => prev.filter(sticker => sticker.id !== stickerId));
    };

    const selectSticker = (stickerId) => {
        setSelectedSticker(stickerId);
    };

    // 컨테이너 크기를 텍스트 영역 높이에 맞게 업데이트 (스티커 위치는 무시)
    const updateContainerSize = () => {
        const padding = 16; // ContentContainer의 padding
        const minHeight = 300; // 최소 높이

        // 모바일에서는 실제 화면 너비를 계산, 데스크탑에서는 고정 너비
        const isMobile = window.innerWidth <= 768;
        const containerWidth = isMobile ? Math.min(window.innerWidth - 40, 600) : 600; // 40px는 좌우 마진
        const fixedWidth = `${containerWidth}px`;

        // 텍스트 영역의 실제 높이만 고려
        let textAreaHeight = minHeight;
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            // 최대 높이 제한 제거 - 텍스트에 맞게 자동으로 늘어나도록
            textAreaHeight = Math.max(minHeight, scrollHeight);
            textareaRef.current.style.height = textAreaHeight + 'px';
        }

        // 컨테이너 크기는 textarea 높이에 맞게 자동 조정
        const containerHeight = textAreaHeight;

        console.log('Container size update:', { textAreaHeight, containerHeight, isMobile, fixedWidth, containerWidth });

        // ContentContainer의 크기 업데이트 (가로는 고정 픽셀 값)
        const contentContainer = document.querySelector('[data-content-container]');
        if (contentContainer) {
            contentContainer.style.width = fixedWidth;
            contentContainer.style.height = `${containerHeight}px`;
            contentContainer.style.maxWidth = '100%'; // 부모 컨테이너를 넘지 않도록
        }

        // contentHeight state도 업데이트
        setContentHeight(containerHeight);
    };

    // 드래그 시작 처리 (마우스 + 터치)
    const handleDragStart = (e, stickerId, action) => {
        e.preventDefault();
        e.stopPropagation();

        const sticker = stickers.find(s => s.id === stickerId);
        if (!sticker) return;

        // 마우스와 터치 이벤트 모두 지원
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        setDragStartPos({ x: clientX, y: clientY });
        setSelectedSticker(stickerId);
        setDraggedSticker({ id: stickerId, action });

        console.log('Drag start:', action, stickerId);
    };

    // 드래그 중 처리 (마우스 + 터치)
    const handleDragMove = (e) => {
        if (!draggedSticker || !dragStartPos) return;

        e.preventDefault();

        // 마우스와 터치 이벤트 모두 지원
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const deltaX = clientX - dragStartPos.x;
        const deltaY = clientY - dragStartPos.y;

        console.log('Drag move:', draggedSticker.action, deltaX, deltaY);

        if (draggedSticker.action === 'move') {
            const sticker = stickers.find(s => s.id === draggedSticker.id);
            if (sticker) {
                updateStickerPosition(draggedSticker.id, sticker.x + deltaX, sticker.y + deltaY);
            }
        } else if (draggedSticker.action === 'resize') {
            const sticker = stickers.find(s => s.id === draggedSticker.id);
            if (sticker) {
                const newWidth = Math.max(20, sticker.width + deltaX);
                const newHeight = Math.max(20, sticker.height + deltaY);
                updateStickerSize(draggedSticker.id, newWidth, newHeight);
            }
        }

        setDragStartPos({ x: clientX, y: clientY });
    };

    // 드래그 종료 처리
    const handleDragEnd = () => {
        console.log('Drag end');
        setDraggedSticker(null);
        setDragStartPos(null);
    };

    // 작성 중 여부 판별
    const isDirty = diary.title || diary.content || diary.mood || diary.weather || diary.emotion || imagePreview.length > 0 || stickers.length > 0;

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: window.innerWidth <= 768 ? '120vh' : '100vh', // 모바일에서 더 긴 화면
            position: 'relative',
            maxWidth: '600px',
            width: '100%',
            margin: window.innerWidth <= 768 ? '60px auto' : '60px auto',
            padding: window.innerWidth <= 768 ? '20px' : '20px',
            paddingTop: window.innerWidth <= 768 ? '20px' : '20px',
            marginBottom: window.innerWidth <= 768 ? '100px' : '100px',
            paddingBottom: window.innerWidth <= 768 ? '200px' : '180px', // 키보드 대응을 위해 더 큰 패딩
            overflowX: 'hidden', // 가로 스크롤 방지
        },
        mainContent: {
            flex: 1,
            position: 'relative',
            paddingTop: '0',
            paddingLeft: '0',
            paddingRight: '0',
            paddingBottom: window.innerWidth <= 768 ? '250px' : '220px', // 키보드 대응을 위해 더 큰 패딩
            minHeight: 0,
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden', // 가로 스크롤 방지
        },
        // header: {
        //     display: 'flex',
        //     alignItems: 'center',
        //     gap: '15px',
        //     marginBottom: '25px'
        // },
        // 저장 버튼 컨테이너
        actionButtons: {
            display: 'flex',
            gap: '10px',
            position: 'absolute',
            top: '20px',
            right: '20px'
        },
        // 저장 버튼
        actionButton: {
            backgroundColor: isGlassTheme
                ? 'rgba(255, 255, 255, 0.2)'
                : isDiaryTheme
                    ? 'rgba(139, 111, 71, 0.7)'
                    : 'rgba(190, 71, 71, 0.62)',
            backdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
            WebkitBackdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
            color: isGlassTheme ? '#000000' : '#ffffff',
            border: isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : 'none',
            borderRadius: isGlassTheme ? '24px' : '14px',
            padding: '8px 15px',
            fontSize: '14px',
            fontFamily: 'Source Sans Pro',
            minHeight: '36px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isGlassTheme
                ? '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)'
                : 'none'
        },
        // 삭제 버튼
        deleteButton: {
            backgroundColor: 'rgba(190, 71, 71, 0.4)'
        },
        // 날짜 선택 컨테이너
        dateSection: {
            fontWeight: 500,
            fontSize: '18px',
            color: '#cb6565',
            lineHeight: '24px',
            marginBottom: '24px',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        datePicker: {
            position: 'absolute',
            top: '100%',
            left: '0',
            backgroundColor: '#ffffff',
            border: '1px solid #fdd2d2',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            display: isDatePickerOpen ? 'block' : 'none',
            // marginTop: '8px'
        },
        dateUnit: {
            fontSize: '18px',
            color: '#cb6565',
            opacity: 0.8,
            marginLeft: '2px'
        },
        datePickerInput: {
            border: 'none',
            outline: 'none',
            fontFamily: 'Inter',
            fontSize: '16px',
            color: '#cb6565',
            // padding: '8px',
            width: '100%',
            backgroundColor: '#fff9f9'
        },
        imageContainer: {
            marginBottom: '24px',
            position: 'relative'
        },
        uploadLabel: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#fdd2d2',
            border: 'none',
            borderRadius: '12px',
            color: '#cb6565',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
        },
        titleInput: {
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: '24px',
            color: theme.primary,
            border: 'none',
            borderBottom: `1px solid ${theme.primary}`,
            background: 'transparent',
            width: '100%',
            marginBottom: '24px',
            padding: '8px 0',
            outline: 'none'
        },
        contentInput: {
            fontFamily: 'Inter',
            fontSize: '16px',
            color: theme.text,
            border: 'none',
            background: 'transparent',
            width: '100%',
            outline: 'none',
            lineHeight: '1.5'
        },
        dateDisplay: {
            fontSize: '18px',
            color: '#e46262',
            marginBottom: '20px',
            fontWeight: '500',
            marginTop: '40px',
            cursor: 'pointer'
        },
        navigationFixed: {
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: 500,
            margin: '0 auto',
            zIndex: 100,
            background: '#fff',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.06)'
        }
    };

    // AI 보강 함수
    const handleEnhanceDiary = async () => {
        if (!diary.content || diary.content.trim().length < 10) {
            toast.showToast('일기 내용이 너무 짧습니다. 최소 10자 이상 작성해주세요.', 'info');
            return;
        }

        if (!isPremium) {
            toast.showToast('이 기능은 프리미엄 회원만 사용할 수 있습니다.', 'error');
            return;
        }

        setIsEnhancing(true);
        try {
            const functions = getFunctions();
            const enhanceDiary = httpsCallable(functions, 'enhanceDiary', { timeout: 60000 });
            const currentLanguage = language === 'en' ? 'en' : 'ko';

            const result = await enhanceDiary({
                diaryContent: diary.content,
                language: currentLanguage
            });

            if (result.data?.enhancedContent) {
                setEnhancedContent(result.data.enhancedContent);
                setEnhancedTitle(result.data.enhancedTitle || '');
                setIsEnhanceModalOpen(true);
            } else {
                toast.showToast('AI 보강에 실패했습니다.', 'error');
            }
        } catch (enhanceError) {
            console.error('AI 보강 실패:', enhanceError);
            let errorMessage = 'AI 보강에 실패했습니다.';
            if (enhanceError.code === 'permission-denied') {
                errorMessage = '이 기능은 프리미엄 회원만 사용할 수 있습니다.';
            } else if (enhanceError.message) {
                errorMessage = enhanceError.message;
            }
            toast.showToast(errorMessage, 'error');
        } finally {
            setIsEnhancing(false);
        }
    };

    // handleSubmit 함수 재정의 (컴포넌트 내부에 추가)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!diary.content || diary.content.trim().length < 50) {
            toast.showToast(t('diary_need_more_content'), 'info');
            return;
        }
        setIsSubmitting(true);
        try {
            // 1. Firestore에 일기 텍스트만 먼저 저장 (imageUrls는 저장하지 않음)
            const diaryData = {
                userId: user.uid,
                date: formatDateToString(selectedDate),
                title: diary.title,
                content: diary.content,
                weather: diary.weather,
                emotion: diary.emotion,
                mood: diary.mood,
                stickers: stickers,
                imageLimitExtended: isPremium, // 프리미엄 회원이 작성한 일기는 imageLimitExtended로 표시
                createdAt: new Date(),
            };
            let diaryRef;
            let earnedPointValue = 0; // 포인트 지급 여부 추적
            let shouldShowAnimation = false; // 애니메이션 표시 여부
            let bonusGranted = false; // 보너스 지급 여부 추적

            if (isEditMode && existingDiaryId) {
                diaryRef = doc(db, 'diaries', existingDiaryId);
                // 기존 일기의 imageLimitExtended는 유지하되, 현재 프리미엄 회원이거나 기존에 imageLimitExtended가 true였으면 유지
                const updateData = { ...diaryData, updatedAt: new Date() };
                // 기존에 imageLimitExtended가 true였거나, 현재 프리미엄 회원이면 true로 유지
                if (imageLimitExtended || isPremium) {
                    updateData.imageLimitExtended = true;
                }
                await setDoc(diaryRef, updateData, { merge: true });
                toast.showToast(t('diary_updated'), 'success');
            } else {
                diaryRef = await addDoc(collection(db, 'diaries'), diaryData);
                toast.showToast(t('diary_saved'), 'success');
                // 포인트 적립: 일기 최초 저장 시 정책값 적용 (당일에만 지급)
                try {
                    const today = new Date();
                    const todayStr = formatDateToString(today);
                    const selectedDateStr = formatDateToString(selectedDate);

                    // 당일에 작성한 일기인 경우에만 포인트 지급
                    if (selectedDateStr === todayStr) {
                        // 중복 포인트 지급 방지: 오늘 이미 포인트를 받았는지 확인
                        const pointHistoryRef = collection(db, "users", user.uid, "pointHistory");
                        const pointHistoryQuery = query(
                            pointHistoryRef,
                            where('desc', '==', t('today_diary'))
                        );
                        const pointHistorySnapshot = await getDocs(pointHistoryQuery);

                        let hasReceivedToday = false;
                        pointHistorySnapshot.forEach(doc => {
                            const history = doc.data();
                            const historyDate = history.createdAt?.toDate?.() || new Date(history.createdAt);
                            const historyDateStr = formatDateToString(historyDate);
                            if (historyDateStr === todayStr) {
                                hasReceivedToday = true;
                            }
                        });

                        // 오늘 이미 포인트를 받지 않은 경우에만 지급
                        if (!hasReceivedToday) {
                            let earnPoint = await getPointPolicy('diary_write_earn', 10);
                            // 프리미엄 회원은 일기 작성 포인트 2배
                            if (isPremium) {
                                earnPoint = earnPoint * 2;
                            }
                            await updateDoc(doc(db, "users", user.uid), {
                                point: increment(earnPoint)
                            });
                            await addDoc(collection(db, "users", user.uid, "pointHistory"), {
                                type: 'earn',
                                amount: earnPoint,
                                desc: t('today_diary'),
                                createdAt: new Date()
                            });
                            // 포인트 적립 알림 생성
                            await createPointEarnNotification(user.uid, earnPoint, t('today_diary'));

                            // 포인트 지급 정보 저장
                            earnedPointValue = earnPoint;
                            shouldShowAnimation = true;

                            // 포인트 지급 애니메이션 표시 (즉시 표시)
                            setEarnedPoints(earnPoint);
                            setShowPointAnimation(true);
                            setShouldDelayNavigation(true);

                            console.log('포인트 애니메이션 표시:', earnPoint);

                            // 일주일 연속 일기 작성 보너스 체크 (당일 작성인 경우에만)
                            const bonusResult = await checkWeeklyBonus(user.uid, today);

                            // 보너스가 지급되었으면 보너스 포인트 애니메이션을 순차적으로 표시
                            if (bonusResult && bonusResult.granted) {
                                bonusGranted = true;
                                // 일기 작성 포인트 애니메이션이 끝난 후 보너스 애니메이션 표시
                                setTimeout(() => {
                                    setShowPointAnimation(false);
                                    setBonusPoints(bonusResult.amount);
                                    setShowBonusAnimation(true);

                                    // 보너스 애니메이션이 끝난 후 이미지 업로드 및 페이지 이동
                                    setTimeout(async () => {
                                        setShowBonusAnimation(false);

                                        // 이미지 업로드 진행
                                        const existingUrlCount = (diary.imageUrls || []).length;
                                        const existingUrls = diary.imageUrls || [];

                                        // 새 파일 업로드
                                        let uploadedUrls = [];
                                        if (imageFiles.length > 0) {
                                            const uploadPromises = imageFiles.map((file, fileIndex) => {
                                                const imageRef = ref(storage, `diaries/${user.uid}/${formatDateToString(selectedDate)}/${Date.now()}_${fileIndex}_${file.name}`);
                                                return uploadBytes(imageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
                                            });
                                            uploadedUrls = await Promise.all(uploadPromises);
                                        }

                                        // imagePreview 순서를 기준으로 최종 이미지 URL 배열 구성
                                        const finalImageUrlsResult = [];
                                        for (let i = 0; i < imagePreview.length; i++) {
                                            const preview = imagePreview[i];
                                            if (preview.startsWith('blob:')) {
                                                const blobUrlsInPreview = imagePreview.filter(p => p.startsWith('blob:'));
                                                const currentBlobIndex = blobUrlsInPreview.indexOf(preview);
                                                if (currentBlobIndex >= 0 && currentBlobIndex < uploadedUrls.length) {
                                                    finalImageUrlsResult.push(uploadedUrls[currentBlobIndex]);
                                                }
                                            } else {
                                                finalImageUrlsResult.push(preview);
                                            }
                                        }

                                        // 이미지 URL 업데이트
                                        const imageUpdateData = {
                                            imageUrls: finalImageUrlsResult,
                                            updatedAt: new Date(),
                                        };
                                        if (finalImageUrlsResult.length >= 4) {
                                            imageUpdateData.imageLimitExtended = true;
                                        }
                                        await updateDoc(isEditMode && existingDiaryId ? diaryRef : doc(db, 'diaries', diaryRef.id), imageUpdateData);

                                        setShouldDelayNavigation(false);
                                        navigate(`/diary/date/${formatDateToString(selectedDate)}`, { replace: true });
                                    }, 2000);
                                }, 2000);
                            }
                        } else {
                            // 이미 오늘 포인트를 받은 경우 알림 표시
                            toast.showToast('오늘의 일기 포인트를 이미 받았습니다.', 'info');
                        }
                    } else {
                        // 과거 날짜에 작성한 경우 안내 메시지
                        toast.showToast(t('diary_point_not_today'), 'info');
                    }
                } catch (pointError) {
                    console.error('포인트 지급 오류:', pointError);
                    toast.showToast(t('diary_point_earn_failed'), 'error');
                }
            }

            // 2. 이미지 업로드는 Firestore 저장 후 비동기로 진행
            // 포인트 애니메이션이 표시 중이면 이미지 업로드를 기다리지 않고 먼저 애니메이션 표시
            // (보너스가 지급된 경우는 위에서 처리되므로 여기서는 보너스가 지급되지 않은 경우만 처리)
            if (shouldShowAnimation && !bonusGranted) {
                // 애니메이션이 충분히 보이도록 1.5초 대기 후 이미지 업로드 및 페이지 이동
                setTimeout(async () => {
                    // 이미지 업로드 진행
                    const existingUrlCount = (diary.imageUrls || []).length;
                    const existingUrls = diary.imageUrls || [];

                    // 새 파일 업로드
                    let uploadedUrls = [];
                    if (imageFiles.length > 0) {
                        const uploadPromises = imageFiles.map((file, fileIndex) => {
                            const imageRef = ref(storage, `diaries/${user.uid}/${formatDateToString(selectedDate)}/${Date.now()}_${fileIndex}_${file.name}`);
                            return uploadBytes(imageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
                        });
                        uploadedUrls = await Promise.all(uploadPromises);
                    }

                    // imagePreview 순서를 기준으로 최종 이미지 URL 배열 구성
                    const finalImageUrlsResult = [];
                    for (let i = 0; i < imagePreview.length; i++) {
                        const preview = imagePreview[i];
                        if (preview.startsWith('blob:')) {
                            const blobUrlsInPreview = imagePreview.filter(p => p.startsWith('blob:'));
                            const currentBlobIndex = blobUrlsInPreview.indexOf(preview);
                            if (currentBlobIndex >= 0 && currentBlobIndex < uploadedUrls.length) {
                                finalImageUrlsResult.push(uploadedUrls[currentBlobIndex]);
                            }
                        } else {
                            finalImageUrlsResult.push(preview);
                        }
                    }

                    // 이미지 URL 업데이트
                    const imageUpdateData = {
                        imageUrls: finalImageUrlsResult,
                        updatedAt: new Date(),
                    };
                    if (finalImageUrlsResult.length >= 4) {
                        imageUpdateData.imageLimitExtended = true;
                    }
                    await updateDoc(isEditMode && existingDiaryId ? diaryRef : doc(db, 'diaries', diaryRef.id), imageUpdateData);

                    // 애니메이션 종료 및 페이지 이동
                    setShowPointAnimation(false);
                    setShouldDelayNavigation(false);
                    navigate(`/diary/date/${formatDateToString(selectedDate)}`, { replace: true });
                }, 1500);
            } else {
                // 애니메이션이 없으면 기존대로 이미지 업로드 후 페이지 이동
                const existingUrlCount = (diary.imageUrls || []).length;
                const existingUrls = diary.imageUrls || [];

                // 새 파일 업로드
                let uploadedUrls = [];
                if (imageFiles.length > 0) {
                    const uploadPromises = imageFiles.map((file, fileIndex) => {
                        const imageRef = ref(storage, `diaries/${user.uid}/${formatDateToString(selectedDate)}/${Date.now()}_${fileIndex}_${file.name}`);
                        return uploadBytes(imageRef, file).then(snapshot => getDownloadURL(snapshot.ref));
                    });
                    uploadedUrls = await Promise.all(uploadPromises);
                }

                // imagePreview 순서를 기준으로 최종 이미지 URL 배열 구성
                const finalImageUrlsResult = [];
                for (let i = 0; i < imagePreview.length; i++) {
                    const preview = imagePreview[i];
                    if (preview.startsWith('blob:')) {
                        const blobUrlsInPreview = imagePreview.filter(p => p.startsWith('blob:'));
                        const currentBlobIndex = blobUrlsInPreview.indexOf(preview);
                        if (currentBlobIndex >= 0 && currentBlobIndex < uploadedUrls.length) {
                            finalImageUrlsResult.push(uploadedUrls[currentBlobIndex]);
                        }
                    } else {
                        finalImageUrlsResult.push(preview);
                    }
                }

                // 이미지 URL 업데이트
                const imageUpdateData = {
                    imageUrls: finalImageUrlsResult,
                    updatedAt: new Date(),
                };
                if (finalImageUrlsResult.length >= 4) {
                    imageUpdateData.imageLimitExtended = true;
                }
                await updateDoc(isEditMode && existingDiaryId ? diaryRef : doc(db, 'diaries', diaryRef.id), imageUpdateData);

                navigate(`/diary/date/${formatDateToString(selectedDate)}`, { replace: true });
            }
            // 제출 성공 시 임시저장 삭제
            clearTempDiary(selectedDate);
        } catch (error) {
            toast.showToast(t('diary_save_failed'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 임시저장 불러오기 핸들러
    const handleLoadTempSave = async () => {
        const tempData = loadTempDiary(selectedDate);
        if (tempData) {
            setDiary(prev => ({
                ...prev,
                title: tempData.title || '',
                content: tempData.content || '',
                mood: tempData.mood || '',
                weather: tempData.weather || '',
                emotion: tempData.emotion || ''
            }));
            if (tempData.stickers) {
                setStickers(tempData.stickers);
                setStickerCounter(tempData.stickers.length);
            }

            // 이미지 데이터 불러오기 (기존 방식과 새 방식 모두 지원)
            if (tempData.imageData && tempData.imageData.length > 0) {
                const restoredPreviews = [];
                const base64Files = [];

                for (let i = 0; i < tempData.imageData.length; i++) {
                    const item = tempData.imageData[i];
                    if (item.type === 'base64') {
                        // base64를 blob URL로 변환
                        try {
                            const response = await fetch(item.data);
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            restoredPreviews.push(blobUrl);

                            // File 객체로도 변환하여 imageFiles에 저장
                            const file = new File([blob], `temp-image-${i}.jpg`, { type: blob.type });
                            base64Files.push(file);
                        } catch (error) {
                            console.error('base64를 blob URL로 변환 실패:', error);
                        }
                    } else {
                        // 기존 URL
                        restoredPreviews.push(item.data);
                    }
                }

                setImagePreview(restoredPreviews);
                if (base64Files.length > 0) {
                    setImageFiles(base64Files);
                }
            } else if (tempData.imagePreview && tempData.imagePreview.length > 0) {
                // 기존 방식 호환성
                setImagePreview(tempData.imagePreview);
            }

            setIsTempSaveModalOpen(false);
            toast.showToast('임시저장된 내용을 불러왔습니다.', 'success');
        }
    };

    // 새로 작성하기 핸들러
    const handleStartNew = () => {
        clearTempDiary(selectedDate);
        setIsTempSaveModalOpen(false);
    };

    return (
        <Container ref={containerRef} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
            <Header
                user={user}
                rightActions={
                    <button
                        style={styles.actionButton}
                        onClick={handleSubmit}
                        disabled={isSubmitting || isEnhancing}
                    >
                        {isSubmitting ? t('diary_saving') : t('diary_save')}
                    </button>
                }
            />
            <main style={{ ...styles.mainContent, paddingBottom: keyboardHeight }}>
                <Card $isDiaryTheme={isDiaryTheme} $isDark={isDark} $isGlassTheme={isGlassTheme}>
                    <DiaryDate $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>{formatDate(diary.date)}</DiaryDate>
                </Card>

                <Card $isDiaryTheme={isDiaryTheme} $isDark={isDark} $isGlassTheme={isGlassTheme} $isMetaCard={true}>
                    <DiaryMeta $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
                        <MetaLabel>
                            {!diary.weather ? (
                                <Button
                                    onClick={(e) => {
                                        setIsWeatherSheetOpen(true);
                                        setIsEmotionSheetOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        fontSize: 16,
                                        color: isGlassTheme ? '#000000' : (isDark ? '#ffffff' : '#222'),
                                        fontWeight: 500,
                                        padding: '0 0'
                                    }}
                                >
                                    {t('today_weather')}
                                </Button>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 32, minWidth: 140, fontSize: 16, color: isGlassTheme ? '#000000' : (isDark ? '#ffffff' : '#222'), fontWeight: 500, padding: 0 }}>
                                    {t('today_weather')}
                                    <img
                                        src={weatherImageMap[diary.weather]}
                                        alt={diary.weather}
                                        style={{ width: 28, height: 28, cursor: 'pointer', alignSelf: 'center', marginLeft: 8 }}
                                        onClick={(e) => {
                                            setIsWeatherSheetOpen(true);
                                            setIsEmotionSheetOpen(false);
                                        }}
                                    />
                                </span>
                            )}
                        </MetaLabel>
                        <MetaLabel>
                            {!diary.emotion ? (
                                <Button
                                    onClick={(e) => {
                                        setIsEmotionSheetOpen(true);
                                        setIsWeatherSheetOpen(false);
                                    }}
                                    style={{
                                        width: '100%',
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-start',
                                        fontSize: 16,
                                        color: isGlassTheme ? '#000000' : (isDark ? '#ffffff' : '#222'),
                                        fontWeight: 500,
                                        padding: '0 0'
                                    }}
                                >
                                    {t('today_mood')}
                                </Button>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', height: 32, minWidth: 140, fontSize: 16, color: isGlassTheme ? '#000000' : (isDark ? '#ffffff' : '#222'), fontWeight: 500, padding: 0 }}>
                                    {t('today_mood')}
                                    <img
                                        src={emotionImageMap[diary.emotion]}
                                        alt={diary.emotion}
                                        style={{ width: 28, height: 28, cursor: 'pointer', alignSelf: 'center', marginLeft: 8 }}
                                        onClick={(e) => {
                                            setIsEmotionSheetOpen(true);
                                            setIsWeatherSheetOpen(false);
                                        }}
                                    />
                                </span>
                            )}
                        </MetaLabel>
                    </DiaryMeta>
                </Card>

                {/* 바텀시트 오버레이 */}
                {(isWeatherSheetOpen || isEmotionSheetOpen) && (
                    <div
                        onClick={closeSheets}
                        style={{
                            position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 999,
                            background: 'rgba(0,0,0,0.15)'
                        }}
                    />
                )}
                {isWeatherSheetOpen && (
                    <div style={{
                        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
                        background: isGlassTheme ? 'rgba(255, 255, 255, 0.2)' : isDiaryTheme ? '#faf8f3' : isDark ? '#1a1a1a' : '#fff',
                        backdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
                        WebkitBackdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
                        borderTopLeftRadius: isGlassTheme ? 24 : 20,
                        borderTopRightRadius: isGlassTheme ? 24 : 20,
                        borderTop: isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : isDiaryTheme ? '1px solid rgba(139, 111, 71, 0.15)' : 'none',
                        boxShadow: isGlassTheme ? '0 -4px 20px rgba(0, 0, 0, 0.15), 0 -2px 8px rgba(0, 0, 0, 0.1)' : isDiaryTheme ? '0 -2px 16px rgba(0, 0, 0, 0.06), 0 -1px 3px rgba(0, 0, 0, 0.04)' : isDark ? '0 -2px 16px rgba(0,0,0,0.32)' : '0 -2px 16px rgba(0,0,0,0.12)',
                        padding: 24, minHeight: 220,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        animation: 'slideUp 0.2s ease',
                        color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#f1f1f1' : '#222',
                    }}>
                        <div style={{ fontWeight: 300, fontSize: 18, marginBottom: 16, color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#f1f1f1' : '#222' }}>{t('today_weather_select')}</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(2, 1fr)',
                            gap: 24,
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 240,
                            margin: '0 auto',
                        }}>
                            {weatherOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => {
                                        setDiary(prev => ({ ...prev, weather: opt.value }));
                                        setIsWeatherSheetOpen(false);
                                    }}
                                    style={{
                                        border: 'none', background: 'none', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        outline: 'none',
                                        filter: diary.weather === opt.value ? (isDark ? 'brightness(1.2) drop-shadow(0 0 6px #ffe29f)' : 'brightness(0.9) drop-shadow(0 0 6px rgb(255, 209, 111))') : 'none'
                                    }}
                                >
                                    <img src={weatherImageMap[opt.value]} alt={opt.label} style={{ width: 56, height: 56, marginBottom: 6 }} />
                                    <span style={{ fontSize: 14, color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#ffffff' : '#cb6565', fontWeight: 500, fontFamily: 'inherit' }}>{t(`weather_${opt.value}`)}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsWeatherSheetOpen(false)}
                            style={{ marginTop: 24, color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#aaa' : '#888', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
                        >{t('close')}</button>
                    </div>
                )}
                {isEmotionSheetOpen && (
                    <div style={{
                        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1000,
                        background: isGlassTheme ? 'rgba(255, 255, 255, 0.2)' : isDiaryTheme ? '#faf8f3' : isDark ? '#1a1a1a' : '#fff',
                        backdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
                        WebkitBackdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
                        borderTopLeftRadius: isGlassTheme ? 24 : 20,
                        borderTopRightRadius: isGlassTheme ? 24 : 20,
                        borderTop: isGlassTheme ? '2px solid rgba(255, 255, 255, 0.5)' : isDiaryTheme ? '1px solid rgba(139, 111, 71, 0.15)' : 'none',
                        boxShadow: isGlassTheme ? '0 -4px 20px rgba(0, 0, 0, 0.15), 0 -2px 8px rgba(0, 0, 0, 0.1)' : isDiaryTheme ? '0 -2px 16px rgba(0, 0, 0, 0.06), 0 -1px 3px rgba(0, 0, 0, 0.04)' : isDark ? '0 -2px 16px rgba(0,0,0,0.32)' : '0 -2px 16px rgba(0,0,0,0.12)',
                        padding: 24, minHeight: 220,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        animation: 'slideUp 0.2s ease',
                        color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#f1f1f1' : '#222',
                    }}>
                        <div style={{ fontWeight: 300, fontSize: 18, marginBottom: 16, color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#f1f1f1' : '#222' }}>{t('today_mood_select')}</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(2, 1fr)',
                            gap: 24,
                            justifyContent: 'center',
                            alignItems: 'center',
                            width: 240,
                            margin: '0 auto',
                        }}>
                            {emotionOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => {
                                        setDiary(prev => ({ ...prev, emotion: opt.value }));
                                        setIsEmotionSheetOpen(false);
                                    }}
                                    style={{
                                        border: 'none', background: 'none', cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        outline: 'none',
                                        filter: diary.emotion === opt.value ? (isDark ? 'brightness(1.2) drop-shadow(0 0 6px #ffe29f)' : 'brightness(0.9) drop-shadow(0 0 6px rgb(255, 209, 111))') : 'none'
                                    }}
                                >
                                    <img src={emotionImageMap[opt.value]} alt={opt.label} style={{ width: 56, height: 56, marginBottom: 6 }} />
                                    <span style={{ fontSize: 14, color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#ffffff' : '#cb6565', fontWeight: 500, fontFamily: 'inherit' }}>{t(`emotion_${opt.value}`)}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsEmotionSheetOpen(false)}
                            style={{ marginTop: 24, color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#aaa' : '#888', background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}
                        >{t('close')}</button>
                    </div>
                )}

                <div style={styles.imageContainer}>
                    {/* 사진 개수 표시 */}
                    {/* 사진 개수 표시(상단, 버튼 위) 코드 완전히 삭제 */}
                    {/* 사진 추가 버튼 분기 */}
                    <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        disabled={(isPremium || imageLimitExtended) ? imagePreview.length >= 4 : imagePreview.length >= 1}
                    />
                    <ImagePreviewContainer
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                        }}
                    >
                        {imagePreview.map((src, index) => (
                            <ImagePreviewBox
                                key={`img-${index}`}
                                ref={(el) => {
                                    if (imageBoxRefs.current) {
                                        imageBoxRefs.current[index] = el;
                                    }
                                }}
                                draggable={true}
                                isDragging={draggedImageIndex === index}
                                isDragOver={dragOverImageIndex === index}
                                $isDiaryTheme={isDiaryTheme}
                                $isGlassTheme={isGlassTheme}
                                onDragStart={(e) => handleImageDragStart(e, index)}
                                onDragOver={(e) => handleImageDragOver(e, index)}
                                onDragLeave={handleImageDragLeave}
                                onDrop={(e) => handleImageDrop(e, index)}
                                onDragEnd={handleImageDragEnd}
                            >
                                <PreviewImg
                                    src={src}
                                    alt={`upload ${index + 1}`}
                                    draggable={false}
                                    onDragStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(index);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                />
                                <RemoveButton
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        removeImage(index);
                                    }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                    }}
                                    onDragStart={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    ×
                                </RemoveButton>
                            </ImagePreviewBox>
                        ))}
                        {/* 사진 추가 버튼 */}
                        {((isPremium || imageLimitExtended) && imagePreview.length < 4) || (!(isPremium || imageLimitExtended) && imagePreview.length < 1) ? (
                            <UploadLabel htmlFor="image-upload" $isGlassTheme={isGlassTheme}>
                                <span className="icon">📸</span>
                                {t('image_add')}
                            </UploadLabel>
                        ) : !(isPremium || imageLimitExtended) && imagePreview.length === 1 ? (
                            <button
                                type="button"
                                onClick={() => navigate('/my/premium')}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100px',
                                    height: '100px',
                                    flexShrink: 0,
                                    borderRadius: '8px',
                                    background: isDark ? '#2a2a2a' : '#fdfdfd',
                                    color: isDark ? '#ccc' : '#666',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: `2px dashed ${isDark ? '#4a4a4a' : '#ddd'}`,
                                    boxShadow: isDark
                                        ? '0 2px 6px rgba(0,0,0,0.3)'
                                        : '0 2px 6px rgba(0,0,0,0.1)',
                                    fontFamily: 'inherit',
                                    transition: 'background 0.2s, box-shadow 0.2s, border-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = isDark ? '#3a3a3a' : '#e8e8e8';
                                    e.target.style.boxShadow = isDark
                                        ? '0 4px 12px rgba(0,0,0,0.4)'
                                        : '0 4px 12px rgba(0,0,0,0.15)';
                                    e.target.style.borderColor = isDark ? '#5a5a5a' : '#bbb';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = isDark ? '#2a2a2a' : '#fdfdfd';
                                    e.target.style.boxShadow = isDark
                                        ? '0 2px 6px rgba(0,0,0,0.3)'
                                        : '0 2px 6px rgba(0,0,0,0.1)';
                                    e.target.style.borderColor = isDark ? '#4a4a4a' : '#ddd';
                                }}
                            >
                                <span className="icon" style={{ fontSize: '20px', marginBottom: '4px' }}>👑</span>
                                <span style={{
                                    fontSize: '11px',
                                    textAlign: 'center',
                                    lineHeight: '1.3',
                                    padding: '0 4px',
                                    backgroundColor: 'transparent',
                                }}>
                                    {t('diary_image_premium_feature')}
                                </span>
                            </button>
                        ) : null}
                    </ImagePreviewContainer>
                    {/* 카운터 - 항상 마지막에 표시 */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 12,
                        width: '100%',
                    }}>
                        <span style={{
                            fontSize: 14,
                            color: isDiaryTheme ? '#8B6F47' : '#cb6565',
                            fontWeight: 500,
                            letterSpacing: '-0.3px',
                        }}>
                            ({imagePreview.length}/{(isPremium || imageLimitExtended) ? 4 : 1})
                        </span>
                    </div>
                    {/* 프리미엄 사용자 최대 사진 제한 안내 */}
                    {(isPremium || imageLimitExtended) && imagePreview.length >= 4 && (
                        <div style={{
                            marginTop: 12,
                            padding: '8px 12px',
                            background: isDark ? 'rgba(203, 101, 101, 0.1)' : 'rgba(203, 101, 101, 0.05)',
                            borderRadius: 8,
                            border: `1px solid ${isDark ? 'rgba(203, 101, 101, 0.3)' : 'rgba(203, 101, 101, 0.2)'}`,
                            textAlign: 'center',
                        }}>
                            <div style={{
                                color: '#cb6565',
                                fontSize: 13,
                            }}>
                                {t('image_limit_max')}
                            </div>
                        </div>
                    )}
                </div>

                <Card $isDiaryTheme={isDiaryTheme} $isDark={isDark} $isGlassTheme={isGlassTheme}>
                    <TitleInput
                        type="text"
                        name="title"
                        placeholder={t('diary_title_placeholder')}
                        value={diary.title}
                        onChange={handleChange}
                        required
                        $isDiaryTheme={isDiaryTheme}
                        $isGlassTheme={isGlassTheme}
                    />
                </Card>

                {/* 일기 내용 작성 영역 (스티커 포함) */}
                <Card $isDiaryTheme={isDiaryTheme} $isDark={isDark} $isGlassTheme={isGlassTheme}>
                    <ContentContainer
                        data-content-container
                        $isDiaryTheme={isDiaryTheme}
                        $isGlassTheme={isGlassTheme}
                        style={{ height: contentHeight }}
                        onClick={(e) => {
                            if (!draggedSticker) {
                                setSelectedSticker(null);
                            }
                        }}
                    >
                        <ContentTextarea
                            ref={textareaRef}
                            name="content"
                            placeholder={t('diary_content_placeholder')}
                            value={diary.content}
                            onChange={handleChange}
                            onFocus={e => {
                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            required
                            $isDiaryTheme={isDiaryTheme}
                            $isGlassTheme={isGlassTheme}
                        />

                        {/* 스티커들 */}
                        {stickers.map((sticker) => (
                            <StickerElement
                                key={sticker.id}
                                data-sticker-id={sticker.id}
                                isSelected={selectedSticker === sticker.id}
                                style={{
                                    left: sticker.x,
                                    top: sticker.y,
                                    width: sticker.width,
                                    height: sticker.height,
                                    zIndex: sticker.zIndex
                                }}
                            >
                                <StickerImage
                                    src={sticker.src}
                                    alt={sticker.type}
                                    onMouseDown={(e) => handleDragStart(e, sticker.id, 'move')}
                                    onTouchStart={(e) => handleDragStart(e, sticker.id, 'move')}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        selectSticker(sticker.id);
                                    }}
                                    style={{
                                        cursor: draggedSticker?.id === sticker.id ? 'grabbing' : 'grab',
                                        userSelect: 'none',
                                        pointerEvents: 'auto',
                                        touchAction: 'none'
                                    }}
                                    draggable={false}
                                />

                                {/* 삭제 버튼 - 항상 표시 */}
                                <StickerDeleteButton
                                    onClick={() => removeSticker(sticker.id)}
                                    title="삭제"
                                    style={{
                                        opacity: selectedSticker === sticker.id ? 1 : 0.7
                                    }}
                                >
                                    ✕
                                </StickerDeleteButton>

                                {selectedSticker === sticker.id && (
                                    <>
                                        {/* 크기 조절 핸들 (우하단) */}
                                        <StickerHandle
                                            style={{
                                                bottom: '-8px',
                                                right: '-8px',
                                                cursor: 'nw-resize',
                                                background: draggedSticker?.id === sticker.id && draggedSticker?.action === 'resize' ? '#a54a4a' : '#cb6565',
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid white',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDragStart(e, sticker.id, 'resize');
                                            }}
                                            onTouchStart={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDragStart(e, sticker.id, 'resize');
                                            }}
                                            title="크기 조절"
                                        />
                                    </>
                                )}
                            </StickerElement>
                        ))}
                    </ContentContainer>
                </Card>

                {/* AI 일기 생성 버튼 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '20px',
                    marginTop: '12px'
                }}>
                    {isPremium ? (
                        <button
                            type="button"
                            onClick={handleEnhanceDiary}
                            disabled={isEnhancing || isSubmitting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                backgroundColor: isGlassTheme
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : (isDark ? '#3a3a3a' : '#fff'),
                                backdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
                                WebkitBackdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
                                border: isGlassTheme
                                    ? '2px solid rgba(255, 255, 255, 0.5)'
                                    : `1px solid ${isDark ? '#555' : '#ddd'}`,
                                borderRadius: isGlassTheme ? '24px' : '8px',
                                color: isGlassTheme ? '#000000' : (isDark ? '#fff' : '#222'),
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: (isEnhancing || isSubmitting) ? 'not-allowed' : 'pointer',
                                opacity: (isEnhancing || isSubmitting) ? 0.6 : 1,
                                transition: 'all 0.2s',
                                boxShadow: isGlassTheme
                                    ? '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)'
                                    : (isDark ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.05)')
                            }}
                            onMouseEnter={(e) => {
                                if (!isEnhancing && !isSubmitting) {
                                    e.target.style.backgroundColor = isGlassTheme
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : (isDark ? '#4a4a4a' : '#fdfdfd');
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = isGlassTheme
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : (isDark ? '#3a3a3a' : '#fff');
                            }}
                        >
                            {isEnhancing ? (
                                <>
                                    <span>⏳</span>
                                    <span>{t('diary_ai_generating')}</span>
                                </>
                            ) : (
                                <>
                                    <span>✨</span>
                                    <span>{t('diary_ai_generate')}</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate('/my/premium')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                backgroundColor: isGlassTheme
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : (isDark ? 'rgba(203, 101, 101, 0.1)' : 'rgba(255, 209, 111, 0.1)'),
                                backdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
                                WebkitBackdropFilter: isGlassTheme ? 'blur(15px)' : 'none',
                                border: isGlassTheme
                                    ? '2px solid rgba(255, 255, 255, 0.5)'
                                    : `1px solid ${isDark ? 'rgba(203, 101, 101, 0.3)' : 'rgba(255, 209, 111, 0.3)'}`,
                                borderRadius: isGlassTheme ? '24px' : '8px',
                                color: isGlassTheme ? '#000000' : (isDark ? '#ff9f9f' : '#cb6565'),
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: isGlassTheme
                                    ? '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)'
                                    : (isDark ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.05)')
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = isGlassTheme
                                    ? 'rgba(255, 255, 255, 0.3)'
                                    : (isDark ? 'rgba(203, 101, 101, 0.2)' : 'rgba(255, 209, 111, 0.2)');
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = isGlassTheme
                                    ? 'rgba(255, 255, 255, 0.2)'
                                    : (isDark ? 'rgba(203, 101, 101, 0.1)' : 'rgba(255, 209, 111, 0.1)');
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <span>✨</span>
                            <span>{t('diary_ai_generate')}</span>
                            <span style={{
                                fontSize: '10px',
                                color: isDark ? '#ff9f9f' : '#cb6565',
                                fontWeight: 500,
                                padding: '2px 6px',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                borderRadius: '4px',
                            }}>
                                {t('premium_only')}
                            </span>
                        </button>
                    )}
                </div>

                {/* 스티커 패널 */}
                {isStickerPanelOpen && (
                    <>
                        <div
                            onClick={() => setIsStickerPanelOpen(false)}
                            style={{
                                position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, zIndex: 999,
                                background: 'rgba(0,0,0,0.15)'
                            }}
                        />
                        <StickerPanel $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
                            <div style={{
                                fontWeight: 300,
                                fontSize: 18,
                                marginBottom: 16,
                                color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#f1f1f1' : '#222',
                                textAlign: 'center'
                            }}>
                                스티커를 선택하세요
                            </div>
                            <StickerGrid>
                                {stickerList.map((sticker) => (
                                    <StickerItem
                                        key={sticker.id}
                                        onClick={() => addSticker(sticker)}
                                        title={sticker.name}
                                        $isDiaryTheme={isDiaryTheme}
                                        $isGlassTheme={isGlassTheme}
                                    >
                                        <img src={sticker.src} alt={sticker.name} />
                                    </StickerItem>
                                ))}
                            </StickerGrid>
                            <button
                                type="button"
                                onClick={() => setIsStickerPanelOpen(false)}
                                style={{
                                    marginTop: 24,
                                    color: isGlassTheme ? '#000000' : isDiaryTheme ? '#8B6F47' : isDark ? '#aaa' : '#888',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: 16,
                                    cursor: 'pointer',
                                    display: 'block',
                                    margin: '0 auto'
                                }}
                            >
                                닫기
                            </button>
                        </StickerPanel>
                    </>
                )}

                {/* 플로팅 스티커 버튼 */}
                <StickerButton
                    $isGlassTheme={isGlassTheme}
                    onClick={() => {
                        if (!isPremium) {
                            toast.showToast(t('premium_required'), 'info');
                            navigate('/my/premium');
                            return;
                        }
                        setIsStickerPanelOpen(true);
                    }}
                >
                    🎨
                </StickerButton>
            </main>
            <div style={styles.navigationFixed}>
                {/* 이미지 뷰어 모달 */}
                {selectedImageIndex !== null && (
                    <ImageViewerModal onClick={() => setSelectedImageIndex(null)}>
                        <ImageViewerContent onClick={(e) => e.stopPropagation()}>
                            <ImageViewerClose onClick={() => setSelectedImageIndex(null)}>
                                ×
                            </ImageViewerClose>
                            {selectedImageIndex > 0 && (
                                <ImageViewerPrev
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(selectedImageIndex - 1);
                                    }}
                                >
                                    ‹
                                </ImageViewerPrev>
                            )}
                            <ImageViewerImg
                                src={imagePreview[selectedImageIndex]}
                                alt={`이미지 ${selectedImageIndex + 1}`}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {selectedImageIndex < imagePreview.length - 1 && (
                                <ImageViewerNext
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImageIndex(selectedImageIndex + 1);
                                    }}
                                >
                                    ›
                                </ImageViewerNext>
                            )}
                        </ImageViewerContent>
                    </ImageViewerModal>
                )}

                {/* AI 보강 모달 */}
                {isEnhanceModalOpen && (
                    <EnhanceModalOverlay
                        $isGlassTheme={isGlassTheme}
                        $isDiaryTheme={isDiaryTheme}
                        onClick={() => setIsEnhanceModalOpen(false)}
                    >
                        <EnhanceModalContent
                            $isGlassTheme={isGlassTheme}
                            $isDiaryTheme={isDiaryTheme}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <EnhanceModalHeader
                                $isGlassTheme={isGlassTheme}
                                $isDiaryTheme={isDiaryTheme}
                            >
                                <EnhanceModalTitle
                                    $isGlassTheme={isGlassTheme}
                                    $isDiaryTheme={isDiaryTheme}
                                >
                                    ✨ AI로 생성한 일기
                                </EnhanceModalTitle>
                                <EnhanceModalClose
                                    $isGlassTheme={isGlassTheme}
                                    $isDiaryTheme={isDiaryTheme}
                                    onClick={() => {
                                        setIsEnhanceModalOpen(false);
                                    }}
                                >
                                    ×
                                </EnhanceModalClose>
                            </EnhanceModalHeader>
                            <EnhanceModalBody>
                                {enhancedTitle && (
                                    <EnhanceSection>
                                        <EnhanceLabel
                                            $isDiaryTheme={isDiaryTheme}
                                            $isGlassTheme={isGlassTheme}
                                        >
                                            AI로 생성한 제목
                                        </EnhanceLabel>
                                        <EnhanceTitleText
                                            $isDiaryTheme={isDiaryTheme}
                                            $isGlassTheme={isGlassTheme}
                                            style={{ fontWeight: 'bold', fontSize: '18px' }}
                                        >
                                            {enhancedTitle}
                                        </EnhanceTitleText>
                                    </EnhanceSection>
                                )}
                                <EnhanceSection>
                                    <EnhanceLabel
                                        $isDiaryTheme={isDiaryTheme}
                                        $isGlassTheme={isGlassTheme}
                                    >
                                        원본 일기
                                    </EnhanceLabel>
                                    <EnhanceText
                                        $isDiaryTheme={isDiaryTheme}
                                        $isGlassTheme={isGlassTheme}
                                    >
                                        {diary.content}
                                    </EnhanceText>
                                </EnhanceSection>
                                <EnhanceSection>
                                    <EnhanceLabel
                                        $isDiaryTheme={isDiaryTheme}
                                        $isGlassTheme={isGlassTheme}
                                    >
                                        AI로 생성한 일기
                                    </EnhanceLabel>
                                    <EnhanceText
                                        $isDiaryTheme={isDiaryTheme}
                                        $isGlassTheme={isGlassTheme}
                                    >
                                        {enhancedContent}
                                    </EnhanceText>
                                </EnhanceSection>
                            </EnhanceModalBody>
                            <EnhanceModalFooter
                                $isGlassTheme={isGlassTheme}
                                $isDiaryTheme={isDiaryTheme}
                            >
                                <EnhanceCancelButton
                                    $isGlassTheme={isGlassTheme}
                                    $isDiaryTheme={isDiaryTheme}
                                    onClick={() => {
                                        setIsEnhanceModalOpen(false);
                                    }}
                                >
                                    원본 유지
                                </EnhanceCancelButton>
                                <EnhanceApplyButton
                                    $isGlassTheme={isGlassTheme}
                                    $isDiaryTheme={isDiaryTheme}
                                    onClick={() => {
                                        setDiary(prev => ({
                                            ...prev,
                                            content: enhancedContent,
                                            title: enhancedTitle || prev.title
                                        }));
                                        toast.showToast('AI 일기가 수정되었습니다!', 'success');
                                        setIsEnhanceModalOpen(false);
                                    }}
                                >
                                    AI 일기 선택
                                </EnhanceApplyButton>
                            </EnhanceModalFooter>
                        </EnhanceModalContent>
                    </EnhanceModalOverlay>
                )}

                {/* 임시저장 모달 */}
                {isTempSaveModalOpen && (
                    <TempSaveModalOverlay
                        $isGlassTheme={isGlassTheme}
                        $isDiaryTheme={isDiaryTheme}
                        onClick={() => setIsTempSaveModalOpen(false)}
                    >
                        <TempSaveModalContainer
                            $isGlassTheme={isGlassTheme}
                            $isDiaryTheme={isDiaryTheme}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <TempSaveModalTitle
                                $isGlassTheme={isGlassTheme}
                                $isDiaryTheme={isDiaryTheme}
                            >
                                임시저장된 내용이 있습니다
                            </TempSaveModalTitle>
                            <TempSaveModalDesc
                                $isGlassTheme={isGlassTheme}
                                $isDiaryTheme={isDiaryTheme}
                            >
                                이전에 작성하던 일기가 임시저장되어 있습니다.<br />
                                불러오시겠습니까?
                            </TempSaveModalDesc>
                            <TempSaveModalActions>
                                <TempSaveCancelButton
                                    $isGlassTheme={isGlassTheme}
                                    $isDiaryTheme={isDiaryTheme}
                                    onClick={handleStartNew}
                                >
                                    새로 작성
                                </TempSaveCancelButton>
                                <TempSaveConfirmButton
                                    $isGlassTheme={isGlassTheme}
                                    $isDiaryTheme={isDiaryTheme}
                                    onClick={handleLoadTempSave}
                                >
                                    불러오기
                                </TempSaveConfirmButton>
                            </TempSaveModalActions>
                        </TempSaveModalContainer>
                    </TempSaveModalOverlay>
                )}

                <Navigation />
            </div>

            {/* 포인트 지급 애니메이션 */}
            {showPointAnimation && (
                <PointEarnOverlay>
                    <PointEarnAnimation>
                        <PointEarnIcon>🪙</PointEarnIcon>
                        <PointEarnText>{t('point_earned')}</PointEarnText>
                        <PointEarnAmount>
                            +{earnedPoints}p
                        </PointEarnAmount>
                        <PointEarnDesc>{t('today_diary')}</PointEarnDesc>
                    </PointEarnAnimation>
                </PointEarnOverlay>
            )}

            {/* 보너스 포인트 지급 애니메이션 */}
            {showBonusAnimation && (
                <PointEarnOverlay>
                    <PointEarnAnimation>
                        <PointEarnIcon>🪙</PointEarnIcon>
                        <PointEarnText>{t('point_earned')}</PointEarnText>
                        <PointEarnAmount>
                            +{bonusPoints}p
                        </PointEarnAmount>
                        <PointEarnDesc>일주일 일기 연속 작성 보너스</PointEarnDesc>
                    </PointEarnAnimation>
                </PointEarnOverlay>
            )}
        </Container>
    );
}

export default WriteDiary; 