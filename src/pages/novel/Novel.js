import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createNovelUrl } from '../../utils/novelUtils';
import styled from 'styled-components';
import Navigation from '../../components/Navigation';
import Header from '../../components/Header';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc, limit, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '../../components/ui/ToastProvider';
import { useLanguage, useTranslation } from '../../LanguageContext';
import { useTheme } from '../../ThemeContext';
import GridIcon from '../../components/icons/GridIcon';
import ListIcon from '../../components/icons/ListIcon';
import { inAppPurchaseService } from '../../utils/inAppPurchase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
//   min-height: 100vh;
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  padding: 20px;
//   padding-top: 40px;
//   padding-bottom: 100px;
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


const GenreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  margin-bottom: 20px;
  gap: 0;
  max-width: 450px;
  margin-left: auto;
  margin-right: auto;
`;

const GenreCard = styled.div`
  width: 100%;
  aspect-ratio: 1;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }
`;

const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const MonthButton = styled.button`
  background: none;
  border: none;
  color: #cb6565;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  &:hover {
    transform: scale(1.1);
  }
`;

const CurrentMonth = styled.h2`
  color: #cb6565;
  font-size: 24px;
  font-family: inherit;
  font-weight: 600;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DatePickerModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const DatePickerContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  width: 300px;
  max-width: 90%;
`;

const DatePickerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const DatePickerTitle = styled.h3`
  color: #cb6565;
  margin: 0;
  font-size: 20px;
`;

const DatePickerClose = styled.button`
  background: none;
  border: none;
  color: #cb6565;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
`;

const DatePickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const DatePickerButton = styled.button`
  background-color: ${props => props.selected ? '#cb6565' : '#fff2f2'};
  color: ${props => props.selected ? 'white' : '#cb6565'};
  border: 1px solid #fdd2d2;
  border-radius: 8px;
  padding: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background-color: ${props => props.selected ? '#cb6565' : '#fdd2d2'};
  }
`;

const NovelListModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const NovelListContent = styled.div`
  background-color: ${({ theme }) => theme.card || 'white'};
  padding: 20px;
  border-radius: 15px;
  width: 90%;
  max-width: 400px;
  max-height: 70vh;
  overflow-y: auto;
`;

const NovelListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const NovelListTitle = styled.h3`
  color: #cb6565;
  margin: 0;
  font-size: 20px;
`;

const NovelListClose = styled.button`
  background: none;
  border: none;
  color: #cb6565;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
`;

const NovelListItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 10px;
  background-color: ${({ theme }) => theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f9f9f9'};
  &:hover {
    background-color: ${({ theme }) => theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f0f0f0'};
  }
  &:last-child {
    margin-bottom: 0;
  }
`;

const NovelListCover = styled.img`
  width: 60px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
`;

const NovelListInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
`;

const NovelListNovelTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NovelListGenre = styled.div`
  font-size: 14px;
  color: #cb6565;
  font-weight: 500;
`;

const WeeklySection = styled.div`
  margin-top: 20px;
  overflow: hidden;
`;

const WeeklySectionTitle = styled.h2`
  color: #cb6565;
  font-size: 24px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  span {
    font-size: 20px;
    opacity: 0.8;
  }
`;

const WeeklyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  padding: 10px 0;
  width: 100%;
`;

const WeeklyList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0;
  width: 100%;
`;

const ViewToggleButton = styled.button`
  background: ${({ active, theme }) => active
        ? (theme.primary || '#cb6565')
        : 'transparent'};
  border: 1px solid ${({ active, theme }) => active
        ? (theme.primary || '#cb6565')
        : (theme.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#ddd')};
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  
  &:hover {
    background: ${({ active, theme }) => active
        ? (theme.primary || '#cb6565')
        : (theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f5f5f5')};
    border-color: ${({ active, theme }) => active
        ? (theme.primary || '#cb6565')
        : (theme.primary || '#cb6565')};
  }
  
  svg {
    stroke: ${({ active, theme }) => active
        ? '#fff'
        : (theme.mode === 'dark' ? 'rgba(255,255,255,0.7)' : '#888')};
    transition: stroke 0.2s;
  }
  
  &:hover svg {
    stroke: ${({ active, theme }) => active
        ? '#fff'
        : (theme.primary || '#cb6565')};
  }
`;

const ViewToggleContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: flex-end;
`;

const WeeklyCard = styled.div`
  background-color: ${({ theme }) => theme.progressCard};
  border-radius: 15px;
  padding: ${({ isListMode }) => isListMode ? '16px' : '20px 16px'};
  flex: 0 0 240px;
  color: ${({ theme }) => theme.cardText};
  min-width: 70px;
  box-sizing: border-box;
  ${({ isListMode }) => isListMode ? `
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 16px;
    padding: 16px;
  ` : ''}
`;


const WeekTitle = styled.h3`
  color: #cb6565;
  font-size: ${({ isListMode }) => isListMode ? '16px' : '18px'};
  margin: ${({ isListMode }) => isListMode ? '0' : '0 0 10px 0'};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  min-height: ${({ isListMode }) => isListMode ? '24px' : '32px'};
  line-height: 1.2;
  flex-shrink: 0;
  span {
    display: flex;
    align-items: flex-start;
    line-height: 1.2;
  }
`;
// 일기 진행도 UI 컴포넌트
const DateRange = styled.p`
  color: #666;
  font-size: ${({ isListMode }) => isListMode ? '10px' : '11px'};
  margin: ${({ isListMode }) => isListMode ? '0' : '0 0 10px 0'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
`;

const ProgressBar = styled.div`
  width: 100%;
  display: flex;
  gap: 4px;
  margin: ${({ isListMode }) => isListMode ? '0' : '0 0 10px 0'};
  justify-content: space-between;
  flex-shrink: ${({ isListMode }) => isListMode ? '0' : '1'};
  min-width: ${({ isListMode }) => isListMode ? '140px' : 'auto'};
`;

const DayIndicator = styled.div`
  flex: 1;
  height: ${({ isListMode }) => isListMode ? '12px' : '16px'};
  border-radius: ${({ isListMode }) => isListMode ? '2px' : '3px'};
  background: ${({ hasDiary, barColor, theme, isCompleted }) => {
        if (!hasDiary) {
            // 일기가 없으면 연한 회색
            if (barColor === 'fill') return theme.mode === 'dark' ? '#4A4A4A' : '#E5E5E5';
            return theme.mode === 'dark' ? '#3A3A3A' : '#E5E5E5';
        }
        // 모든 일기를 완성한 경우 상단 CTA와 동일한 그라데이션 색상 적용
        if (isCompleted && hasDiary) {
            return 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)';
        }
        // 일기가 있으면 버튼 텍스트 색상과 일치
        if (barColor === 'fill') return theme.mode === 'dark' ? '#BFBFBF' : '#868E96'; // 일기 채우기 버튼 텍스트 색상
        if (barColor === 'create') return theme.mode === 'dark' ? '#FFB3B3' : '#e07e7e'; // 소설 만들기 버튼 텍스트 색상
        if (barColor === 'free') return '#e4a30d'; // 무료 버튼 텍스트 색상
        if (barColor === 'view') return theme.primary; // 소설 보기 버튼 배경 색상
        return '#cb6565'; // 기본값
    }};
  transition: background 0.3s ease;
`;

const CreateButton = styled.button`
  width: ${({ isListMode }) => isListMode ? '130px' : '100%'};
  min-width: ${({ isListMode }) => isListMode ? '130px' : 'auto'};
  margin: 0;
  margin-top: ${({ isListMode }) => isListMode ? '0' : '2px'};
  padding: ${({ isListMode }) => isListMode ? '6px 12px' : '8px'};
  font-size: ${({ isListMode }) => isListMode ? '11px' : '12px'};
  white-space: ${({ isListMode }) => isListMode ? 'nowrap' : 'nowrap'};
  background: ${({ children, completed, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '#2A2A2A' : '#E5E5E5';
        if (isFree) return 'transparent';
        // children을 문자열로 변환하여 PREMIUM 체크
        const childrenStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children || ''));
        if (childrenStr.includes('PREMIUM')) return theme.premiumBannerBg || 'linear-gradient(135deg, #ffe29f 0%, #ffc371 100%)'; // 홈화면 프리미엄 배너 색상 팔레트
        if (children === '일기 채우기') return theme.mode === 'dark' ? '#3A3A3A' : '#F5F6FA'; // 다크모드에서는 어두운 회색
        if (children === '다른 장르 생성') return 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)'; // 일기 진행도 그래프 색상
        if (children === '소설 만들기' || children === '완성 ✨') return theme.mode === 'dark' ? '#3A3A3A' : '#f5f5f5'; // 다크모드에서는 어두운 회색
        if (children === '소설 보기') return theme.primary; // 분홍
        return theme.primary;
    }};
  color: ${({ children, completed, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '#666666' : '#999999';
        if (isFree) return '#e4a30d';
        // children을 문자열로 변환하여 PREMIUM 체크
        const childrenStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children || ''));
        if (childrenStr.includes('PREMIUM')) return theme.premiumBannerText || '#8B4513'; // 홈화면 프리미엄 배너 텍스트 색상
        if (children === '일기 채우기') return theme.mode === 'dark' ? '#BFBFBF' : '#868E96';
        if (children === '다른 장르 생성') return '#fff'; // 일기 진행도 그래프 색상 배경에 맞춰 흰색
        if (children === '소설 만들기' || children === '완성 ✨') return theme.mode === 'dark' ? '#FFB3B3' : '#e07e7e';
        if (children === '소설 보기') return '#fff';
        return '#fff';
    }};
  border: ${({ children, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '2px solid #3A3A3A' : '2px solid #CCCCCC';
        if (isFree) return '2px solid #e4a30d';
        // children을 문자열로 변환하여 PREMIUM 체크
        const childrenStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children || ''));
        if (childrenStr.includes('PREMIUM')) return 'none'; // 프리미엄 버튼 테두리 없음
        if (children === '일기 채우기') return theme.mode === 'dark' ? '2px solid #BFBFBF' : '2px solid #868E96';
        if (children === '다른 장르 생성') return 'none'; // 그라데이션 배경이므로 border 없음
        if (children === '소설 만들기' || children === '완성 ✨') return theme.mode === 'dark' ? '2px solid #FFB3B3' : '2px solid #e07e7e';
        if (children === '소설 보기') return 'none';
        return 'none';
    }};
  border-radius: 10px;
  padding: 8px;
  font-size: ${({ isFree }) => isFree ? '12px' : '12px'};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  transition: all 0.2s ease;
  font-weight: 700;
  font-family: inherit;
  white-space: nowrap;
  overflow: visible;
  box-shadow: ${({ children }) =>
        (children === '소설 보기') ? '0 2px 8px rgba(228,98,98,0.08)' : 'none'};
  &:hover {
    background: ${({ children, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '#2A2A2A' : '#E5E5E5';
        if (isFree) return 'rgba(228, 163, 13, 0.1)';
        // children을 문자열로 변환하여 PREMIUM 체크
        const childrenStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children || ''));
        if (childrenStr.includes('PREMIUM')) {
            // hover 시 약간 더 밝은 그라데이션
            if (theme.mode === 'dark') {
                return 'linear-gradient(135deg, #5A4A3A 0%, #4A3A2F 100%)'; // 다크모드 hover
            }
            return 'linear-gradient(135deg, #ffe8af 0%, #ffcc81 100%)'; // 라이트모드 hover (약간 더 밝게)
        }
        if (children === '일기 채우기') return theme.mode === 'dark' ? '#4A4A4A' : '#E9ECEF';
        if (children === '다른 장르 생성') return 'linear-gradient(90deg, #B88A8A 0%, #C39595 100%)'; // hover 시 약간 어둡게
        if (children === '소설 만들기') return theme.mode === 'dark' ? '#4A4A4A' : '#C3CAD6'; // hover 저채도 블루
        if (children === '소설 보기') return theme.secondary;
        return theme.secondary;
    }};
    color: ${({ children, theme, isFree, disabled }) => {
        if (disabled) return theme.mode === 'dark' ? '#666666' : '#999999';
        if (isFree) return '#e4a30d';
        // children을 문자열로 변환하여 PREMIUM 체크
        const childrenStr = typeof children === 'string' ? children : (Array.isArray(children) ? children.join('') : String(children || ''));
        if (childrenStr.includes('PREMIUM')) return theme.premiumBannerText || '#8B4513'; // 홈화면 프리미엄 배너 텍스트 색상 (hover 시에도 동일)
        if (children === '일기 채우기' || children === '소설 만들기' || children === '다른 장르 생성') return theme.mode === 'dark' ? '#FFB3B3' : '#fff';
        return '#fff';
    }};
    opacity: ${({ disabled }) => disabled ? 0.6 : 0.96};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;


const CreateOptionModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const CreateOptionContent = styled.div`
  background: ${({ theme }) => theme.mode === 'dark' ? '#2A2A2A' : '#FFFFFF'};
  border-radius: 20px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  opacity: 1;
`;

const CreateOptionTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0 0 16px 0;
  text-align: center;
`;

const CreateOptionButton = styled.button`
  width: 100%;
  padding: 16px;
  margin-bottom: 4px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ isFree, theme }) =>
        isFree
            ? 'linear-gradient(135deg, rgba(228, 163, 13, 0.2) 0%, rgba(255, 226, 148, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(228, 98, 98, 0.15) 0%, rgba(203, 101, 101, 0.15) 100%)'};
  color: ${({ isFree }) => isFree ? '#e4a30d' : '#e46262'};
  border: ${({ isFree }) => isFree ? '2px solid #e4a30d' : '2px solid #e46262'};
  box-shadow: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ isFree }) =>
        isFree
            ? '0 4px 12px rgba(0,0,0,0.15)'
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

const CreateOptionDesc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#666'};
  margin-bottom: 8px;
  text-align: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  padding: 4px 8px;
`;

const AddButton = styled.button`
  background-color: transparent;
  color: ${({ theme, disabled }) => disabled ? theme.mode === 'dark' ? '#666666' : '#999999' : theme.primary};
  border: none;
  padding: 0;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
  &:hover {
    color: ${({ theme, disabled }) => disabled ? theme.mode === 'dark' ? '#666666' : '#999999' : theme.secondary};
    opacity: ${({ disabled }) => disabled ? 0.5 : 0.96};
    background-color: ${({ theme, disabled }) => disabled ? 'transparent' : theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
  }
  &:active {
    transform: ${({ disabled }) => disabled ? 'none' : 'scale(0.95)'};
  }
  
  font-size: 18px;
  line-height: 1;
`;

// CTA 카드 스타일
const NovelCTACard = styled.div`
  background: ${({ theme }) => theme.novelProgressCardBg || '#FFFFFF'};
  border: 1px solid ${({ theme }) => theme.novelProgressCardBorder || '#E5E5E5'};
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 24px;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.mode === 'dark' ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.08)'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  user-select: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.mode === 'dark' ? '0 6px 20px rgba(0,0,0,0.4)' : '0 6px 20px rgba(0,0,0,0.12)'};
  }
  
  &:active {
    transform: translateY(0);
  }
`;



const NovelCTAContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: ${({ theme }) => theme.text};
`;

const NovelCTAIcon = styled.div`
  font-size: 40px;
  flex-shrink: 0;
`;

const NovelCTATop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const NovelCTAIconWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const NovelCTAText = styled.div`
  flex: 1;
  min-width: 0;
`;

const NovelCTATitle = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
  line-height: 1.3;
  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;
  color: ${({ theme }) => theme.text};
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

const NovelCTADesc = styled.div`
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.4;
  word-break: keep-all;
  word-wrap: break-word;
  overflow-wrap: break-word;
  color: ${({ theme }) => theme.subText || '#888'};
  
  @media (max-width: 480px) {
    font-size: 13px;
  }
`;

const NovelCTAArrow = styled.div`
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
  opacity: 0.7;
  transition: transform 0.2s;
  color: ${({ theme }) => theme.text};
  
  ${NovelCTACard}:hover & {
    transform: translateX(4px);
    opacity: 1;
  }
`;

const NovelCTAProgress = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NovelCTAProgressText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#888'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const NovelCTAProgressBar = styled.div`
  width: 100%;
  height: 16px;
  background: ${({ theme }) => theme.novelProgressBarBg || '#E5E5E5'};
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const NovelCTAProgressFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.novelProgressBarFill || 'linear-gradient(90deg, #C99A9A 0%, #D4A5A5 100%)'};
  border-radius: 8px;
  transition: width 0.3s ease;
  width: ${({ progress }) => progress}%;
`;

// 이번주 일기 목록 모달 스타일
const CurrentWeekDiaryModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const CurrentWeekDiaryContent = styled.div`
  background: ${({ theme }) => theme.mode === 'dark' ? '#2A2A2A' : '#FFFFFF'};
  border-radius: 20px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
`;

const CurrentWeekDiaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CurrentWeekDiaryTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.text};
  margin: 0;
`;

const CurrentWeekDiaryClose = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.text};
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
  
  &:hover {
    opacity: 1;
  }
`;

const CurrentWeekDiaryList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CurrentWeekDiaryItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.mode === 'dark' ? '#3A3A3A' : '#F5F5F5'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.mode === 'dark' ? '#4A4A4A' : '#EEEEEE'};
    transform: translateY(-2px);
  }
`;

const CurrentWeekDiaryImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
`;

const CurrentWeekDiaryImagePlaceholder = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: ${({ theme }) => theme.mode === 'dark' ? '#4A4A4A' : '#E5E5E5'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  flex-shrink: 0;
`;

const CurrentWeekDiaryInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const CurrentWeekDiaryDate = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText || '#888'};
  font-weight: 500;
`;

const CurrentWeekDiaryTitleText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
`;

const CurrentWeekDiaryPreview = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.subText || '#888'};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.4;
`;

const CurrentWeekDiaryEmpty = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.subText || '#888'};
  font-size: 14px;
`;

// 내 소설/서재 섹션 스타일
const LibrarySection = styled.div`
  margin-bottom: 30px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  color: #cb6565;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MoreLink = styled.button`
  background: none;
  border: none;
  color: #cb6565;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  opacity: 0.8;
  transition: opacity 0.2s;
  &:hover {
    opacity: 1;
  }
`;

const NovelRow = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const NovelBox = styled.div`
  width: calc((100% - 24px) / 3);
  min-width: calc((100% - 24px) / 3);
  max-width: calc((100% - 24px) / 3);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s;
  &:hover {
    transform: translateY(-4px);
  }
`;

const NovelCoverImage = styled.img`
  width: 100%;
  aspect-ratio: 2/3;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  margin-bottom: 8px;
`;

const NovelTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.subText || '#888'};
  font-size: 14px;
`;

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  margin: 30px 0;
`;

const Novel = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const { t } = useTranslation();
    const toast = useToast();
    const theme = useTheme();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weeks, setWeeks] = useState([]);
    const [weeklyProgress, setWeeklyProgress] = useState({});
    const [monthProgress, setMonthProgress] = useState(0);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    const [diaries, setDiaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [novelsMap, setNovelsMap] = useState({});
    const [selectedWeekNovels, setSelectedWeekNovels] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [ownedPotions, setOwnedPotions] = useState({});
    const [showCreateOptionModal, setShowCreateOptionModal] = useState(false);
    const [selectedWeekForCreate, setSelectedWeekForCreate] = useState(null);
    const [myNovels, setMyNovels] = useState([]);
    const [purchasedNovels, setPurchasedNovels] = useState([]);
    const weekRefs = useRef({});
    const [showCurrentWeekDiaryModal, setShowCurrentWeekDiaryModal] = useState(false);
    const [currentWeekDiaries, setCurrentWeekDiaries] = useState([]);
    const [currentWeekDiariesForProgress, setCurrentWeekDiariesForProgress] = useState([]);
    const progressSectionRef = useRef(null);
    const [weeklyViewMode, setWeeklyViewMode] = useState(() => {
        const saved = localStorage.getItem('novel_weekly_view_mode');
        return saved || 'card'; // 'card' or 'list'
    });



    useEffect(() => {
        localStorage.setItem('novel_weekly_view_mode', weeklyViewMode);
    }, [weeklyViewMode]);

    // 상단 CTA 카드용 현재 주의 일기 가져오기 (항상 현재 날짜 기준)
    useEffect(() => {
        if (!user) {
            setCurrentWeekDiariesForProgress([]);
            return;
        }

        const fetchCurrentWeek = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 현재 주의 시작일과 종료일 계산
            const dayOfWeek = today.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일까지의 차이
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - diff);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            // formatDate 함수 사용 (컴포넌트 내부에 정의되어 있음)
            const formatDateForQuery = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const weekStartStr = formatDateForQuery(weekStart);
            const weekEndStr = formatDateForQuery(weekEnd);

            try {
                const diariesRef = collection(db, 'diaries');
                const diariesQuery = query(diariesRef,
                    where('userId', '==', user.uid),
                    where('date', '>=', weekStartStr),
                    where('date', '<=', weekEndStr),
                    orderBy('date')
                );
                const diarySnapshot = await getDocs(diariesQuery);
                const fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());
                setCurrentWeekDiariesForProgress(fetchedDiaries);
            } catch (error) {
                setCurrentWeekDiariesForProgress([]);
            }
        };

        fetchCurrentWeek();
    }, [user]);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        };

        const fetchAllData = async () => {
            setIsLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            // 표시되는 월의 주차 정보를 먼저 가져옴
            const monthWeeks = getWeeksInMonth(year, month);

            // 주차 정보가 없으면 데이터를 불러오지 않음
            if (monthWeeks.length === 0) {
                setDiaries([]);
                setNovelsMap({});
                calculateAllProgress(year, month, []);
                setIsLoading(false);
                return;
            }

            // 표시되는 모든 주차를 포함하는 날짜 범위 설정
            // 표시되는 모든 주차를 포함하는 날짜 범위 설정
            const startDate = monthWeeks[0].start;
            const endDate = monthWeeks[monthWeeks.length - 1].end;

            // 1. 확장된 날짜 범위로 일기 가져오기
            const diariesRef = collection(db, 'diaries');
            const diariesQuery = query(diariesRef,
                where('userId', '==', user.uid),
                where('date', '>=', formatDate(startDate)),
                where('date', '<=', formatDate(endDate)),
                orderBy('date')
            );

            let fetchedDiaries = [];
            try {
                const diarySnapshot = await getDocs(diariesQuery);
                fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());
                setDiaries(fetchedDiaries);
            } catch (error) {
                // 오류가 나도 UI는 계속 진행되도록 함
            }

            // 2. Fetch all Novels for the user to create a map
            const novelsRef = collection(db, 'novels');
            const novelsQuery = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
            try {
                const novelSnapshot = await getDocs(novelsQuery);
                const newNovelsMap = {};
                const allMyNovels = [];
                novelSnapshot.forEach(doc => {
                    const novel = doc.data();
                    // 삭제되지 않은 소설만 추가
                    if (novel.deleted !== true) {
                        allMyNovels.push({ id: doc.id, ...novel });
                    }
                    // year, month, weekNum이 모두 있고 삭제되지 않은 경우에만 맵에 추가
                    if (novel.year && novel.month && novel.weekNum && novel.deleted !== true) {
                        const weekKey = `${novel.year}년 ${novel.month}월 ${novel.weekNum}주차`;
                        // 같은 주차에 여러 소설이 있을 수 있으므로 배열로 저장
                        if (!newNovelsMap[weekKey]) {
                            newNovelsMap[weekKey] = [];
                        }
                        newNovelsMap[weekKey].push({ id: doc.id, ...novel });
                    }
                });

                // 같은 주차, 같은 장르의 소설이 여러 개 있을 때 최신 것만 유지
                Object.keys(newNovelsMap).forEach(weekKey => {
                    const novels = newNovelsMap[weekKey];
                    // 장르별로 그룹화
                    const novelsByGenre = {};
                    novels.forEach(novel => {
                        const genreKey = novel.genre || 'default';
                        if (!novelsByGenre[genreKey]) {
                            novelsByGenre[genreKey] = [];
                        }
                        novelsByGenre[genreKey].push(novel);
                    });
                    // 각 장르별로 최신 것만 유지 (이미 createdAt desc로 정렬되어 있음)
                    const filteredNovels = Object.values(novelsByGenre).map(genreNovels => {
                        // createdAt 기준으로 정렬 (최신순)
                        return genreNovels.sort((a, b) => {
                            const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
                            const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
                            return bTime - aTime;
                        })[0]; // 가장 최신 것만
                    });
                    newNovelsMap[weekKey] = filteredNovels;
                });
                setNovelsMap(newNovelsMap);
                // 최근 5개만 표시
                setMyNovels(allMyNovels.slice(0, 5));
            } catch (error) {
                // 오류가 나도 UI는 계속 진행되도록 함
            }

            // 3. Fetch purchased novels
            try {
                const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                const viewedSnapshot = await getDocs(viewedNovelsRef);

                if (viewedSnapshot.empty) {
                    setPurchasedNovels([]);
                } else {
                    // viewedNovels 문서에서 novelId와 viewedAt 정보 추출
                    // 문서 ID가 novelId입니다
                    const viewedNovelsData = viewedSnapshot.docs.map(doc => ({
                        novelId: doc.id,
                        viewedAt: doc.data().viewedAt || doc.data().createdAt || null
                    }));

                    // novelId로 novels 컬렉션에서 데이터 fetch
                    const novelsRef = collection(db, 'novels');
                    const novelDocs = await Promise.all(
                        viewedNovelsData.map(item => getDoc(doc(novelsRef, item.novelId)))
                    );

                    let purchased = novelDocs
                        .map((snap, idx) => {
                            if (!snap.exists()) return null;
                            const novelData = snap.data();
                            // 삭제되지 않고 공개된 소설만 추가
                            if (novelData.deleted === true || novelData.isPublic === false) {
                                return null;
                            }
                            return {
                                ...novelData,
                                id: snap.id,
                                purchasedAt: viewedNovelsData[idx].viewedAt
                            };
                        })
                        .filter(novel => novel !== null);

                    // 구매일 기준 최신순 정렬
                    purchased = purchased.sort((a, b) => {
                        const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
                        const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
                        return bDate - aDate;
                    });

                    // 각 소설의 userId로 닉네임/아이디 조회
                    const ownerIds = [...new Set(purchased.map(novel => novel.userId))];
                    const userDocs = await Promise.all(
                        ownerIds.map(uid => getDoc(doc(db, 'users', uid)))
                    );
                    const ownerMap = {};
                    userDocs.forEach((snap, idx) => {
                        if (snap.exists()) {
                            const data = snap.data();
                            ownerMap[ownerIds[idx]] = data.nickname || data.nick || data.displayName || ownerIds[idx];
                        } else {
                            ownerMap[ownerIds[idx]] = ownerIds[idx];
                        }
                    });

                    // novel에 ownerName 필드 추가
                    purchased = purchased.map(novel => ({
                        ...novel,
                        ownerName: ownerMap[novel.userId] || novel.userId
                    }));

                    // 최근 5개만 표시
                    setPurchasedNovels(purchased.slice(0, 5));
                }
            } catch (error) {
                console.error('구매한 소설 목록 가져오기 실패:', error);
                setPurchasedNovels([]);
            }

            // 4. Fetch premium free novel status and potions
            try {
                // 구독 상태 동기화
                try {
                    await inAppPurchaseService.syncSubscriptionStatus(user.uid);
                } catch (syncError) {
                    console.error('구독 상태 동기화 실패:', syncError);
                }

                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const isPremiumUser = userData.isMonthlyPremium || userData.isYearlyPremium || false;
                    setIsPremium(isPremiumUser);
                    setOwnedPotions(userData.potions || {});

                }
            } catch (error) {
                // 오류가 나도 UI는 계속 진행되도록 함
                console.error('프리미엄 무료권 상태 조회 실패:', error);
            }

            // 5. Calculate progress
            calculateAllProgress(year, month, fetchedDiaries);
            setIsLoading(false);
        };

        fetchAllData();
    }, [user, currentDate]);


    // location state에서 소설 삭제 알림을 받으면 데이터 다시 가져오기
    useEffect(() => {
        if (location.state?.novelDeleted && user) {
            const fetchAllData = async () => {
                setIsLoading(true);
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();

                // 표시되는 월의 주차 정보를 먼저 가져옴
                const monthWeeks = getWeeksInMonth(year, month);

                // 주차 정보가 없으면 데이터를 불러오지 않음
                if (monthWeeks.length === 0) {
                    setDiaries([]);
                    setNovelsMap({});
                    calculateAllProgress(year, month, []);
                    setIsLoading(false);
                    return;
                }

                // 표시되는 모든 주차를 포함하는 날짜 범위 설정
                // 지난주도 포함하기 위해 시작 날짜를 7일 앞으로 확장
                const startDate = new Date(monthWeeks[0].start);
                startDate.setDate(startDate.getDate() - 7);
                const endDate = monthWeeks[monthWeeks.length - 1].end;

                // 1. 확장된 날짜 범위로 일기 가져오기 (지난주 포함)
                const diariesRef = collection(db, 'diaries');
                const diariesQuery = query(diariesRef,
                    where('userId', '==', user.uid),
                    where('date', '>=', formatDate(startDate)),
                    where('date', '<=', formatDate(endDate)),
                    orderBy('date')
                );

                let fetchedDiaries = [];
                try {
                    const diarySnapshot = await getDocs(diariesQuery);
                    fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());
                    setDiaries(fetchedDiaries);
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                }

                // 2. Fetch all Novels for the user to create a map
                const novelsRef = collection(db, 'novels');
                const novelsQuery = query(novelsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
                try {
                    const novelSnapshot = await getDocs(novelsQuery);
                    const newNovelsMap = {};
                    const allMyNovels = [];
                    novelSnapshot.forEach(doc => {
                        const novel = doc.data();
                        // 삭제되지 않은 소설만 추가
                        if (novel.deleted !== true) {
                            allMyNovels.push({ id: doc.id, ...novel });
                        }
                        // year, month, weekNum이 모두 있고 삭제되지 않은 경우에만 맵에 추가
                        if (novel.year && novel.month && novel.weekNum && novel.deleted !== true) {
                            const weekKey = `${novel.year}년 ${novel.month}월 ${novel.weekNum}주차`;
                            // 같은 주차에 여러 소설이 있을 수 있으므로 배열로 저장
                            if (!newNovelsMap[weekKey]) {
                                newNovelsMap[weekKey] = [];
                            }
                            newNovelsMap[weekKey].push({ id: doc.id, ...novel });
                        }
                    });

                    // 같은 주차, 같은 장르의 소설이 여러 개 있을 때 최신 것만 유지
                    Object.keys(newNovelsMap).forEach(weekKey => {
                        const novels = newNovelsMap[weekKey];
                        // 장르별로 그룹화
                        const novelsByGenre = {};
                        novels.forEach(novel => {
                            const genreKey = novel.genre || 'default';
                            if (!novelsByGenre[genreKey]) {
                                novelsByGenre[genreKey] = [];
                            }
                            novelsByGenre[genreKey].push(novel);
                        });
                        // 각 장르별로 최신 것만 유지 (이미 createdAt desc로 정렬되어 있음)
                        const filteredNovels = Object.values(novelsByGenre).map(genreNovels => {
                            // createdAt 기준으로 정렬 (최신순)
                            return genreNovels.sort((a, b) => {
                                const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
                                const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
                                return bTime - aTime;
                            })[0]; // 가장 최신 것만
                        });
                        newNovelsMap[weekKey] = filteredNovels;
                    });

                    setNovelsMap(newNovelsMap);
                    // 최근 5개만 표시
                    setMyNovels(allMyNovels.slice(0, 5));
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                }

                // 3. Fetch purchased novels
                try {
                    const purchasedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                    const purchasedQuery = query(purchasedNovelsRef, orderBy('viewedAt', 'desc'), limit(5));
                    const purchasedSnapshot = await getDocs(purchasedQuery);
                    const purchasedList = [];

                    for (const purchasedDoc of purchasedSnapshot.docs) {
                        const purchasedData = purchasedDoc.data();
                        if (purchasedData.novelId) {
                            try {
                                const novelDoc = await getDoc(doc(db, 'novels', purchasedData.novelId));
                                if (novelDoc.exists()) {
                                    const novelData = novelDoc.data();
                                    // 삭제되지 않고 공개된 소설만 추가
                                    if (novelData.deleted !== true && novelData.isPublic !== false) {
                                        purchasedList.push({
                                            id: novelDoc.id,
                                            ...novelData,
                                            ownerName: purchasedData.ownerName || novelData.ownerName
                                        });
                                    }
                                }
                            } catch (err) {
                                // 개별 소설 조회 실패는 무시
                            }
                        }
                    }
                    setPurchasedNovels(purchasedList);
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                }

                // 4. Fetch premium free novel status and potions
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const isPremiumUser = userData.isMonthlyPremium || userData.isYearlyPremium || false;
                        setIsPremium(isPremiumUser);
                        setOwnedPotions(userData.potions || {});

                    }
                } catch (error) {
                    // 오류가 나도 UI는 계속 진행되도록 함
                    console.error('프리미엄 무료권 상태 조회 실패:', error);
                }

                // 4. Fetch purchased novels
                try {
                    const viewedNovelsRef = collection(db, 'users', user.uid, 'viewedNovels');
                    const viewedSnapshot = await getDocs(viewedNovelsRef);

                    if (viewedSnapshot.empty) {
                        setPurchasedNovels([]);
                    } else {
                        // viewedNovels 문서에서 novelId와 viewedAt 정보 추출
                        // 문서 ID가 novelId입니다
                        const viewedNovelsData = viewedSnapshot.docs.map(doc => ({
                            novelId: doc.id,
                            viewedAt: doc.data().viewedAt || doc.data().createdAt || null
                        }));

                        // novelId로 novels 컬렉션에서 데이터 fetch
                        const novelsRef = collection(db, 'novels');
                        const novelDocs = await Promise.all(
                            viewedNovelsData.map(item => getDoc(doc(novelsRef, item.novelId)))
                        );

                        let purchased = novelDocs
                            .map((snap, idx) => {
                                if (!snap.exists()) return null;
                                const novelData = snap.data();
                                // 삭제되지 않고 공개된 소설만 추가
                                if (novelData.deleted === true || novelData.isPublic === false) {
                                    return null;
                                }
                                return {
                                    ...novelData,
                                    id: snap.id,
                                    purchasedAt: viewedNovelsData[idx].viewedAt
                                };
                            })
                            .filter(novel => novel !== null);

                        // 구매일 기준 최신순 정렬
                        purchased = purchased.sort((a, b) => {
                            const aDate = a.purchasedAt?.toDate?.() || a.purchasedAt || new Date(0);
                            const bDate = b.purchasedAt?.toDate?.() || b.purchasedAt || new Date(0);
                            return bDate - aDate;
                        });

                        // 각 소설의 userId로 닉네임/아이디 조회
                        const ownerIds = [...new Set(purchased.map(novel => novel.userId))];
                        const userDocs = await Promise.all(
                            ownerIds.map(uid => getDoc(doc(db, 'users', uid)))
                        );
                        const ownerMap = {};
                        userDocs.forEach((snap, idx) => {
                            if (snap.exists()) {
                                const data = snap.data();
                                ownerMap[ownerIds[idx]] = data.nickname || data.nick || data.displayName || ownerIds[idx];
                            } else {
                                ownerMap[ownerIds[idx]] = ownerIds[idx];
                            }
                        });

                        // novel에 ownerName 필드 추가
                        purchased = purchased.map(novel => ({
                            ...novel,
                            ownerName: ownerMap[novel.userId] || novel.userId
                        }));

                        // 최근 5개만 표시
                        setPurchasedNovels(purchased.slice(0, 5));
                    }
                } catch (error) {
                    console.error('구매한 소설 목록 가져오기 실패:', error);
                    setPurchasedNovels([]);
                }

                // 5. Calculate progress
                calculateAllProgress(year, month, fetchedDiaries);
                setIsLoading(false);
            };
            fetchAllData();
            // location state 초기화
            navigate(location.pathname, { replace: true });
        }
    }, [location.state?.novelDeleted, user, currentDate, navigate, location.pathname]);

    // 홈화면에서 진행도 구역으로 스크롤
    useEffect(() => {
        if (location.state?.scrollToProgress && progressSectionRef.current && !isLoading) {
            setTimeout(() => {
                progressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // state 초기화
                navigate(location.pathname, { replace: true });
            }, 500);
        }
    }, [location.state?.scrollToProgress, isLoading, navigate, location.pathname]);


    const getWeeksInMonth = (year, month) => {
        const weeks = [];
        const firstDayOfMonth = new Date(year, month, 1);

        // 주의 시작인 월요일을 찾기 위해, 해당 월의 첫 날이 속한 주의 월요일부터 시작
        let currentMonday = new Date(firstDayOfMonth);
        const dayOfWeek = currentMonday.getDay(); // 0=일, 1=월, ..., 6=토
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        currentMonday.setDate(currentMonday.getDate() - diff);

        let weekNum = 1;

        // 주의 마지막 날(일요일)이 현재 달에 속하는 주차들을 계산
        while (true) {
            const weekStart = new Date(currentMonday);
            const weekEnd = new Date(currentMonday);
            weekEnd.setDate(weekEnd.getDate() + 6); // 주의 마지막 날 (일요일)

            // 주의 마지막 날이 현재 달에 속하면 해당 월의 주차로 포함
            if (weekEnd.getMonth() === month && weekEnd.getFullYear() === year) {
                weeks.push({
                    weekNum: weekNum++,
                    start: weekStart,
                    end: weekEnd,
                });
            } else if (weeks.length > 0) {
                // 이미 해당 월의 주차 계산이 끝났고, 다음 달로 넘어갔으므로 중단
                break;
            }

            // 다음 주 월요일로 이동
            currentMonday.setDate(currentMonday.getDate() + 7);

            // 무한 루프 방지를 위한 안전 장치
            if (currentMonday.getFullYear() > year || (currentMonday.getFullYear() === year && currentMonday.getMonth() > month + 1)) {
                break;
            }
        }

        setWeeks(weeks);
        return weeks;
    };

    const calculateAllProgress = (year, month, fetchedDiaries) => {
        const currentWeeks = getWeeksInMonth(year, month);
        let totalWrittenDaysInMonth = 0;
        const newWeeklyProgress = {};

        currentWeeks.forEach(week => {
            const weekStartStr = formatDate(week.start);
            const weekEndStr = formatDate(week.end);

            const weekDiaries = fetchedDiaries.filter(diary => {
                return diary.date >= weekStartStr && diary.date <= weekEndStr;
            });

            // 한 주는 7일이므로, 7일 기준으로 진행률 계산
            const weekDateCount = 7;
            const progress = Math.min(100, (weekDiaries.length / weekDateCount) * 100);

            newWeeklyProgress[week.weekNum] = progress;
        });

        // 월간 진행률은 현재 '월'에 해당하는 일기만 카운트
        fetchedDiaries.forEach(diary => {
            const diaryDate = new Date(diary.date);
            if (diaryDate.getFullYear() === year && diaryDate.getMonth() === month) {
                totalWrittenDaysInMonth++;
            }
        });

        setWeeklyProgress(newWeeklyProgress);

        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        setMonthProgress(totalDaysInMonth > 0 ? (totalWrittenDaysInMonth / totalDaysInMonth) * 100 : 0);
    };


    const getFirstWeekOfMonth = (year, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDayOfWeek = new Date(firstDay);
        lastDayOfWeek.setDate(firstDay.getDate() + (6 - firstDay.getDay()));

        return {
            start: firstDay,
            end: lastDayOfWeek
        };
    };

    const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatDisplayDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        // 모바일에서 공간 절약을 위해 더 짧은 형식 사용
        return `${d.getMonth() + 1}/${d.getDate()}`;
    }

    const handleCreateNovel = (week) => {
        const weekProgress = weeklyProgress[week.weekNum] || 0;
        if (weekProgress < 100) {
            alert(t('novel_all_diaries_needed'));
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const weekKey = `${year}년 ${month}월 ${week.weekNum}주차`;
        const novelsForWeek = novelsMap[weekKey] || [];
        const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

        const novelTitle = language === 'en'
            ? t('novel_list_by_genre_title', { genre: t('novel_title') }) // simple fallback
            : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

        const weekStartDate = new Date(week.start);
        const weekEndDate = new Date(week.end);

        // 이 주의 일기 중 첫 번째 이미지 URL을 대표 이미지로 사용 (없으면 기본값)
        const firstDiaryWithImage = diaries.find(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate >= weekStartDate &&
                diaryDate <= weekEndDate &&
                diary.imageUrls && diary.imageUrls.length > 0;
        });
        const imageUrl = firstDiaryWithImage ? firstDiaryWithImage.imageUrls[0] : '/novel_banner/romance.png';

        navigate('/novel/create', {
            state: {
                year: year,
                month: month,
                weekNum: week.weekNum,
                week: weekKey,
                dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                imageUrl: imageUrl,
                title: novelTitle,
                existingGenres: existingGenres,
                returnPath: location.pathname || '/novel'
            }
        });
    };

    const handleCreateNovelClick = async (week) => {
        const weekProgress = weeklyProgress[week.weekNum] || 0;
        if (weekProgress < 100) {
            alert(t('novel_all_diaries_needed'));
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const weekKey = `${year}년 ${month}월 ${week.weekNum}주차`;
        const novelsForWeek = novelsMap[weekKey] || [];

        // 일반 회원인 경우 같은 주차에 이미 다른 장르의 소설이 있는지 확인
        if (!isPremium && novelsForWeek.length > 0) {
            const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);
            if (existingGenres.length > 0) {
                toast.showToast('일반 회원은 한 주에 한 장르의 소설만 생성할 수 있습니다.', 'error');
                return;
            }
        }

        // 포션 보유 여부 확인
        const hasPotions = Object.values(ownedPotions).some(count => count > 0);

        if (hasPotions) {
            // 포션이 있으면 바로 소설 생성 페이지로 이동
            handleCreateNovel(week, false);
        } else {
            // 포션이 없으면 포션 상점으로 안내
            toast.showToast('포션이 필요합니다. 포션 상점에서 구매해주세요.', 'error');
            setTimeout(() => {
                navigate('/my/potion-shop');
            }, 1500);
        }
    };

    // 주차가 미래인지 확인하는 함수
    const isFutureWeek = (week) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStartDate = new Date(week.start);
        weekStartDate.setHours(0, 0, 0, 0);
        return weekStartDate > today;
    };

    // 오늘에 해당하는 주차에서 오늘의 일기가 작성되었는지 확인하는 함수
    const hasTodayDiary = (week) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekStartDate = new Date(week.start);
        weekStartDate.setHours(0, 0, 0, 0);
        const weekEndDate = new Date(week.end);
        weekEndDate.setHours(23, 59, 59, 999);

        // 오늘이 이 주차에 포함되는지 확인
        if (today < weekStartDate || today > weekEndDate) {
            return false;
        }

        // 오늘의 일기가 작성되었는지 확인
        const todayStr = formatDate(today);
        return diaries.some(diary => diary.date === todayStr);
    };

    const handleWriteDiary = (week) => {
        // 미래 주차이거나 오늘의 일기가 이미 작성된 경우 처리하지 않음
        if (isFutureWeek(week) || hasTodayDiary(week)) {
            return;
        }

        // 해당 주차에서 작성하지 않은 첫 번째 날짜 찾기
        const weekStartDate = new Date(week.start);
        const weekEndDate = new Date(week.end);

        // 해당 주차의 모든 날짜 생성
        const weekDates = [];
        const currentDate = new Date(weekStartDate);
        while (currentDate <= weekEndDate) {
            weekDates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 해당 주차의 일기들 찾기
        const weekDiaries = diaries.filter(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate >= weekStartDate && diaryDate <= weekEndDate;
        });

        // 작성하지 않은 첫 번째 날짜 찾기
        const writtenDates = weekDiaries.map(diary => formatDate(diary.date));
        const unwrittenDate = weekDates.find(date => {
            const dateStr = formatDate(date);
            return !writtenDates.includes(dateStr);
        });

        if (unwrittenDate) {
            // 일기 작성 페이지로 이동 (해당 날짜와 함께)
            navigate('/write', {
                state: {
                    selectedDate: formatDate(unwrittenDate),
                    year: unwrittenDate.getFullYear(),
                    month: unwrittenDate.getMonth() + 1,
                    weekNum: week.weekNum
                }
            });
        } else {
            // 모든 날짜가 작성된 경우 (이론적으로는 발생하지 않음)
            navigate('/write');
        }
    };

    const handleYearChange = (year) => {
        setCurrentDate(new Date(year, currentDate.getMonth()));
    };

    const handleMonthChange = (month) => {
        setCurrentDate(new Date(currentDate.getFullYear(), month - 1));
        setIsPickerOpen(false);
    };

    // 소설을 만들 수 있는 주차 찾기 (일기 7개 모두 작성된 주차)
    const findCreatableWeek = () => {
        // 모든 주차를 확인하여 소설을 만들 수 있는 주차 찾기
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            const progress = weeklyProgress[week.weekNum] || 0;
            const isCompleted = progress >= 100;

            if (isCompleted) {
                return week;
            }
        }
        return null;
    };

    // 오늘이 속한 주차 찾기
    const getCurrentWeek = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 현재 표시된 월의 주차들 확인
        for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            const weekStart = new Date(week.start);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(week.end);
            weekEnd.setHours(23, 59, 59, 999);

            if (today >= weekStart && today <= weekEnd) {
                return week;
            }
        }

        // 현재 표시된 월에 없으면 오늘이 속한 월 확인
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // 오늘이 속한 월이 현재 표시된 월과 다를 때만 계산
        if (currentYear !== currentDate.getFullYear() || currentMonth !== currentDate.getMonth()) {
            // getWeeksInMonth를 호출하지 않고 직접 계산
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
            let currentMonday = new Date(firstDayOfMonth);
            const dayOfWeek = currentMonday.getDay();
            const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            currentMonday.setDate(currentMonday.getDate() - diff);

            let weekNum = 1;
            while (true) {
                const weekStart = new Date(currentMonday);
                const weekEnd = new Date(currentMonday);
                weekEnd.setDate(weekEnd.getDate() + 6);

                if (today >= weekStart && today <= weekEnd) {
                    return {
                        weekNum: weekNum,
                        start: weekStart,
                        end: weekEnd
                    };
                }

                if (weekEnd.getMonth() !== currentMonth || weekEnd.getFullYear() !== currentYear) {
                    if (weekNum > 1) break;
                }

                currentMonday.setDate(currentMonday.getDate() + 7);
                weekNum++;

                if (currentMonday.getFullYear() > currentYear || (currentMonday.getFullYear() === currentYear && currentMonday.getMonth() > currentMonth + 1)) {
                    break;
                }
            }
        }

        return null;
    };


    // 이번주 일기 진행도 계산 (항상 현재 날짜 기준)
    const getCurrentWeekProgress = () => {
        const count = currentWeekDiariesForProgress.length;
        const total = 7;
        const progress = Math.min(100, (count / total) * 100);

        return { progress, count, total };
    };

    // 이번주 일기 목록 가져오기 (모달용, 항상 현재 날짜 기준)
    const getCurrentWeekDiaries = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 현재 주의 시작일과 종료일 계산
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 월요일까지의 차이
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - diff);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // formatDate 함수 사용 (컴포넌트 내부에 정의되어 있음)
        const formatDateForQuery = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const weekStartStr = formatDateForQuery(weekStart);
        const weekEndStr = formatDateForQuery(weekEnd);

        if (!user) {
            setCurrentWeekDiaries([]);
            return;
        }

        try {
            const diariesRef = collection(db, 'diaries');
            const diariesQuery = query(diariesRef,
                where('userId', '==', user.uid),
                where('date', '>=', weekStartStr),
                where('date', '<=', weekEndStr),
                orderBy('date')
            );
            const diarySnapshot = await getDocs(diariesQuery);
            const fetchedDiaries = diarySnapshot.docs.map(doc => doc.data());

            // 날짜순으로 정렬
            fetchedDiaries.sort((a, b) => {
                return a.date.localeCompare(b.date);
            });

            setCurrentWeekDiaries(fetchedDiaries);
        } catch (error) {
            setCurrentWeekDiaries([]);
        }
    };

    // 이번주 일기 목록 모달 열기
    const openCurrentWeekDiaryModal = async () => {
        await getCurrentWeekDiaries();
        setShowCurrentWeekDiaryModal(true);
    };

    // 일기 상세 보기로 이동
    const handleDiaryClick = (diary) => {
        navigate('/diary/view', {
            state: {
                date: diary.date,
                diary: diary
            }
        });
    };

    // 소설을 만들 수 있는 주차로 스크롤
    const scrollToCreatableWeek = () => {
        const creatableWeek = findCreatableWeek();

        if (creatableWeek) {
            const weekKey = `${creatableWeek.weekNum}`;
            const weekRef = weekRefs.current[weekKey];

            if (weekRef) {
                // 해당 주차가 현재 표시된 월에 있는지 확인
                const weekYear = new Date(creatableWeek.start).getFullYear();
                const weekMonth = new Date(creatableWeek.start).getMonth();
                const currentYear = currentDate.getFullYear();
                const currentMonth = currentDate.getMonth();

                // 다른 월에 있으면 해당 월로 이동
                if (weekYear !== currentYear || weekMonth !== currentMonth) {
                    setCurrentDate(new Date(weekYear, weekMonth));
                    // 상태 업데이트 후 스크롤 (약간의 지연 필요)
                    setTimeout(() => {
                        const updatedWeekRef = weekRefs.current[weekKey];
                        if (updatedWeekRef) {
                            updatedWeekRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 300);
                } else {
                    // 같은 월에 있으면 바로 스크롤
                    weekRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // ref가 없으면 해당 월로 이동
                const weekYear = new Date(creatableWeek.start).getFullYear();
                const weekMonth = new Date(creatableWeek.start).getMonth();
                setCurrentDate(new Date(weekYear, weekMonth));
            }
        } else {
            // 소설을 만들 수 있는 주차가 없으면 토스트 메시지 표시
            toast.show(t('novel_no_creatable_week') || '소설을 만들 수 있는 주차가 없습니다. 일기를 더 작성해주세요.');
        }
    };

    return (
        <Container>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('novel_title')} />
            {/* <Title>Novel</Title> */}

            {/* 소설 만들기 CTA */}
            <NovelCTACard onClick={openCurrentWeekDiaryModal}>
                <NovelCTAContent>
                    <NovelCTAProgress>
                        <NovelCTAProgressText>
                            <span>{t('novel_this_week_progress') || '이번주 일기 진행도'}</span>
                            <span>{(() => {
                                const { count, total } = getCurrentWeekProgress();
                                return `${count}/${total}`;
                            })()}</span>
                        </NovelCTAProgressText>
                        <NovelCTAProgressBar>
                            <NovelCTAProgressFill progress={getCurrentWeekProgress().progress} />
                        </NovelCTAProgressBar>
                    </NovelCTAProgress>
                </NovelCTAContent>
            </NovelCTACard>

            {/* 내 소설 섹션 */}
            <LibrarySection>
                <SectionHeader>
                    <SectionTitle>📚 {t('home_my_novel') || '내 소설'}</SectionTitle>
                    {myNovels.length > 0 && (
                        <MoreLink onClick={() => navigate('/my/completed-novels')}>
                            더보기 →
                        </MoreLink>
                    )}
                </SectionHeader>
                {myNovels.length > 0 ? (
                    <NovelRow>
                        {myNovels.map(novel => (
                            <NovelBox
                                key={novel.id}
                                onClick={() => navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}`)}
                            >
                                <NovelCoverImage
                                    src={novel.imageUrl || '/novel_banner/default.png'}
                                    alt={novel.title}
                                />
                                <NovelTitle>{novel.title}</NovelTitle>
                            </NovelBox>
                        ))}
                    </NovelRow>
                ) : (
                    <EmptyState>
                        아직 작성한 소설이 없습니다.<br />
                        일기를 작성하고 소설을 만들어보세요!
                    </EmptyState>
                )}
            </LibrarySection>

            {/* 내 서재 섹션 */}
            <LibrarySection>
                <SectionHeader>
                    <SectionTitle>🛍️ {t('home_purchased_novel') || '내 서재'}</SectionTitle>
                    {purchasedNovels.length > 0 && (
                        <MoreLink onClick={() => navigate('/purchased-novels')}>
                            더보기 →
                        </MoreLink>
                    )}
                </SectionHeader>
                {purchasedNovels.length > 0 ? (
                    <NovelRow>
                        {purchasedNovels.map(novel => (
                            <NovelBox
                                key={novel.id}
                                onClick={() => navigate(`/novel/${createNovelUrl(novel.year, novel.month, novel.weekNum, novel.genre, novel.id)}?userId=${novel.userId}`, {
                                    state: { returnPath: '/novel' }
                                })}
                            >
                                <NovelCoverImage
                                    src={novel.imageUrl || '/novel_banner/default.png'}
                                    alt={novel.title}
                                />
                                <NovelTitle>{novel.title}</NovelTitle>
                            </NovelBox>
                        ))}
                    </NovelRow>
                ) : (
                    <EmptyState>
                        아직 구매한 소설이 없습니다.<br />
                        다른 사람의 소설을 구매해보세요!
                    </EmptyState>
                )}
            </LibrarySection>

            <Divider />


            <WeeklySection ref={progressSectionRef}>
                <MonthSelector>
                    <MonthButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>‹</MonthButton>
                    <CurrentMonth onClick={() => setIsPickerOpen(true)}>
                        {language === 'en'
                            ? currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                            : `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
                    </CurrentMonth>
                    <MonthButton onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>›</MonthButton>
                </MonthSelector>
                <ViewToggleContainer>
                    <ViewToggleButton
                        active={weeklyViewMode === 'card'}
                        onClick={() => setWeeklyViewMode('card')}
                        theme={theme}
                        title="카드형"
                    >
                        <GridIcon width={20} height={20} />
                    </ViewToggleButton>
                    <ViewToggleButton
                        active={weeklyViewMode === 'list'}
                        onClick={() => setWeeklyViewMode('list')}
                        theme={theme}
                        title="목록형"
                    >
                        <ListIcon width={20} height={20} />
                    </ViewToggleButton>
                </ViewToggleContainer>
                {isPickerOpen && (
                    <DatePickerModal onClick={() => setIsPickerOpen(false)}>
                        <DatePickerContent onClick={(e) => e.stopPropagation()}>
                            <DatePickerHeader>
                                <DatePickerTitle>{t('novel_month_label')}</DatePickerTitle>
                                <DatePickerClose onClick={() => setIsPickerOpen(false)}>×</DatePickerClose>
                            </DatePickerHeader>
                            <DatePickerTitle>{t('year')}</DatePickerTitle>
                            <DatePickerGrid>
                                {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((year) => (
                                    <DatePickerButton
                                        key={year}
                                        selected={year === currentDate.getFullYear()}
                                        onClick={() => handleYearChange(year)}
                                    >
                                        {year}
                                    </DatePickerButton>
                                ))}
                            </DatePickerGrid>
                            <DatePickerTitle>{t('month')}</DatePickerTitle>
                            <DatePickerGrid>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                    <DatePickerButton
                                        key={month}
                                        selected={month === currentDate.getMonth() + 1}
                                        onClick={() => handleMonthChange(month)}
                                    >
                                        {language === 'en' ? month : `${month}월`}
                                    </DatePickerButton>
                                ))}
                            </DatePickerGrid>
                        </DatePickerContent>
                    </DatePickerModal>
                )}
                {weeklyViewMode === 'card' ? (
                    <WeeklyGrid>
                        {weeks.map((week) => {
                            const progress = weeklyProgress[week.weekNum] || 0;
                            const isCompleted = progress >= 100;
                            const weekKey = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${week.weekNum}주차`;
                            const novelsForWeek = novelsMap[weekKey] || [];
                            const firstNovel = novelsForWeek.length > 0 ? novelsForWeek[0] : null;
                            const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

                            // 모든 장르 목록
                            const allGenres = ['로맨스', '추리', '역사', '동화', '판타지', '공포'];
                            // 모든 장르의 소설이 생성되었는지 확인
                            const allGenresCreated = allGenres.every(genre => existingGenres.includes(genre));

                            const handleAddNovel = () => {
                                // 모든 장르의 소설이 이미 생성된 경우 처리하지 않음
                                if (allGenresCreated) {
                                    return;
                                }

                                const weekProgress = weeklyProgress[week.weekNum] || 0;
                                if (weekProgress < 100) {
                                    alert(t('novel_all_diaries_needed'));
                                    return;
                                }

                                // 포션 보유 여부 확인
                                const hasPotions = Object.values(ownedPotions).some(count => count > 0);

                                // 바로 소설 생성 페이지로 이동
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth() + 1;
                                const novelTitle = language === 'en'
                                    ? t('novel_list_by_genre_title', { genre: t('novel_title') })
                                    : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

                                const weekStartDate = new Date(week.start);
                                const weekEndDate = new Date(week.end);

                                const firstDiaryWithImage = diaries.find(diary => {
                                    const diaryDate = new Date(diary.date);
                                    return diaryDate >= weekStartDate &&
                                        diaryDate <= weekEndDate &&
                                        diary.imageUrls && diary.imageUrls.length > 0;
                                });
                                const imageUrl = firstDiaryWithImage ? firstDiaryWithImage.imageUrls[0] : '/novel_banner/romance.png';

                                navigate('/novel/create', {
                                    state: {
                                        year: year,
                                        month: month,
                                        weekNum: week.weekNum,
                                        week: `${year}년 ${month}월 ${week.weekNum}주차`,
                                        dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                                        imageUrl: imageUrl,
                                        title: novelTitle,
                                        existingGenres: novelsForWeek.map(n => n.genre).filter(Boolean),
                                        returnPath: location.pathname || '/novel'
                                    }
                                });
                            };

                            const handleViewNovel = () => {
                                // 소설이 2개 이상이면 목록 모달 표시
                                if (novelsForWeek.length > 1) {
                                    setSelectedWeekNovels(novelsForWeek);
                                } else {
                                    // 소설이 1개면 바로 이동
                                    const novelKey = createNovelUrl(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth() + 1,
                                        week.weekNum,
                                        firstNovel.genre,
                                        firstNovel.id
                                    );
                                    navigate(`/novel/${novelKey}`);
                                }
                            };

                            return (
                                <WeeklyCard
                                    key={week.weekNum}
                                    ref={(el) => {
                                        if (el) {
                                            weekRefs.current[week.weekNum] = el;
                                        }
                                    }}
                                >
                                    <WeekTitle>
                                        <span>{t('week_num', { num: week.weekNum })}</span>
                                        {firstNovel && isCompleted && (
                                            <AddButton
                                                onClick={handleViewNovel}
                                                title="소설 보기"
                                            >
                                                ☰
                                            </AddButton>
                                        )}
                                    </WeekTitle>
                                    <DateRange>{formatDisplayDate(week.start)} - {formatDisplayDate(week.end)}</DateRange>
                                    <ProgressBar
                                        barColor={
                                            firstNovel
                                                ? 'view'
                                                : isCompleted
                                                    ? 'create'
                                                    : 'fill'
                                        }
                                    >
                                        {(() => {
                                            // 주의 시작일부터 7일간의 날짜 생성
                                            const weekStart = new Date(week.start);
                                            const weekDays = [];
                                            for (let i = 0; i < 7; i++) {
                                                const date = new Date(weekStart);
                                                date.setDate(weekStart.getDate() + i);
                                                weekDays.push(date);
                                            }

                                            // 해당 주의 일기 날짜 목록
                                            const weekStartStr = formatDate(week.start);
                                            const weekEndStr = formatDate(week.end);
                                            const weekDiaries = diaries.filter(diary => {
                                                return diary.date >= weekStartStr && diary.date <= weekEndStr;
                                            });
                                            const writtenDates = new Set(weekDiaries.map(diary => diary.date));

                                            return weekDays.map((day, idx) => {
                                                const dayStr = formatDate(day);
                                                const hasDiary = writtenDates.has(dayStr);
                                                return (
                                                    <DayIndicator
                                                        key={idx}
                                                        hasDiary={hasDiary}
                                                        isCompleted={isCompleted}
                                                        barColor={
                                                            firstNovel
                                                                ? 'view'
                                                                : isCompleted
                                                                    ? 'create'
                                                                    : 'fill'
                                                        }
                                                    />
                                                );
                                            });
                                        })()}
                                    </ProgressBar>
                                    {firstNovel ? (
                                        <CreateButton
                                            completed={true}
                                            onClick={handleAddNovel}
                                            disabled={allGenresCreated}
                                        >
                                            {allGenresCreated ? "완성 ✨" : (!isPremium && novelsForWeek.length > 0 ? "👑 PREMIUM" : "다른 장르 생성")}
                                        </CreateButton>
                                    ) : (
                                        <CreateButton
                                            completed={false}
                                            isFree={false}
                                            disabled={!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))}
                                            onClick={() => {
                                                if (!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))) {
                                                    return;
                                                }
                                                isCompleted ? handleCreateNovelClick(week) : handleWriteDiary(week);
                                            }}
                                        >
                                            {isCompleted
                                                ? t('novel_create')
                                                : t('novel_fill_diary')}
                                        </CreateButton>
                                    )}
                                </WeeklyCard>
                            );
                        })}
                    </WeeklyGrid>
                ) : (
                    <WeeklyList>
                        {weeks.map((week) => {
                            const progress = weeklyProgress[week.weekNum] || 0;
                            const isCompleted = progress >= 100;
                            const weekKey = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${week.weekNum}주차`;
                            const novelsForWeek = novelsMap[weekKey] || [];
                            const firstNovel = novelsForWeek.length > 0 ? novelsForWeek[0] : null;
                            const existingGenres = novelsForWeek.map(n => n.genre).filter(Boolean);

                            // 모든 장르 목록
                            const allGenres = ['로맨스', '추리', '역사', '동화', '판타지', '공포'];
                            // 모든 장르의 소설이 생성되었는지 확인
                            const allGenresCreated = allGenres.every(genre => existingGenres.includes(genre));

                            const handleAddNovel = () => {
                                // 일반 회원이고 이미 소설이 있는 경우 프리미엄 페이지로 이동
                                if (!isPremium && novelsForWeek.length > 0) {
                                    navigate('/my/premium');
                                    return;
                                }

                                // 모든 장르의 소설이 이미 생성된 경우 처리하지 않음
                                if (allGenresCreated) {
                                    return;
                                }

                                const weekProgress = weeklyProgress[week.weekNum] || 0;
                                if (weekProgress < 100) {
                                    alert(t('novel_all_diaries_needed'));
                                    return;
                                }

                                // 포션 보유 여부 확인
                                const hasPotions = Object.values(ownedPotions).some(count => count > 0);

                                // 바로 소설 생성 페이지로 이동
                                const year = currentDate.getFullYear();
                                const month = currentDate.getMonth() + 1;
                                const novelTitle = language === 'en'
                                    ? t('novel_list_by_genre_title', { genre: t('novel_title') })
                                    : `${year}년 ${month}월 ${week.weekNum}주차 소설`;

                                const weekStartDate = new Date(week.start);
                                const weekEndDate = new Date(week.end);

                                const firstDiaryWithImage = diaries.find(diary => {
                                    const diaryDate = new Date(diary.date);
                                    return diaryDate >= weekStartDate &&
                                        diaryDate <= weekEndDate &&
                                        diary.imageUrls && diary.imageUrls.length > 0;
                                });
                                const imageUrl = firstDiaryWithImage ? firstDiaryWithImage.imageUrls[0] : '/novel_banner/romance.png';

                                navigate('/novel/create', {
                                    state: {
                                        year: year,
                                        month: month,
                                        weekNum: week.weekNum,
                                        week: `${year}년 ${month}월 ${week.weekNum}주차`,
                                        dateRange: `${formatDate(week.start)} ~ ${formatDate(week.end)}`,
                                        imageUrl: imageUrl,
                                        title: novelTitle,
                                        existingGenres: novelsForWeek.map(n => n.genre).filter(Boolean),
                                        returnPath: location.pathname || '/novel'
                                    }
                                });
                            };

                            const handleViewNovel = () => {
                                // 소설이 2개 이상이면 목록 모달 표시
                                if (novelsForWeek.length > 1) {
                                    setSelectedWeekNovels(novelsForWeek);
                                } else {
                                    // 소설이 1개면 바로 이동
                                    const novelKey = createNovelUrl(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth() + 1,
                                        week.weekNum,
                                        firstNovel.genre,
                                        firstNovel.id
                                    );
                                    navigate(`/novel/${novelKey}`);
                                }
                            };

                            return (
                                <WeeklyCard
                                    key={week.weekNum}
                                    isListMode={true}
                                    ref={(el) => {
                                        if (el) {
                                            weekRefs.current[week.weekNum] = el;
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: 0 }}>
                                        <WeekTitle isListMode={true}>
                                            <span>{t('week_num', { num: week.weekNum })}</span>
                                            {firstNovel && isCompleted && (
                                                <AddButton
                                                    onClick={handleViewNovel}
                                                    title="소설 보기"
                                                >
                                                    ☰
                                                </AddButton>
                                            )}
                                        </WeekTitle>
                                        <DateRange isListMode={true}>{formatDisplayDate(week.start)} - {formatDisplayDate(week.end)}</DateRange>
                                        <ProgressBar
                                            isListMode={true}
                                            barColor={
                                                firstNovel
                                                    ? 'view'
                                                    : isCompleted
                                                        ? 'create'
                                                        : 'fill'
                                            }
                                        >
                                            {(() => {
                                                // 주의 시작일부터 7일간의 날짜 생성
                                                const weekStart = new Date(week.start);
                                                const weekDays = [];
                                                for (let i = 0; i < 7; i++) {
                                                    const date = new Date(weekStart);
                                                    date.setDate(weekStart.getDate() + i);
                                                    weekDays.push(date);
                                                }

                                                // 해당 주의 일기 날짜 목록
                                                const weekStartStr = formatDate(week.start);
                                                const weekEndStr = formatDate(week.end);
                                                const weekDiaries = diaries.filter(diary => {
                                                    return diary.date >= weekStartStr && diary.date <= weekEndStr;
                                                });
                                                const writtenDates = new Set(weekDiaries.map(diary => diary.date));

                                                return weekDays.map((day, idx) => {
                                                    const dayStr = formatDate(day);
                                                    const hasDiary = writtenDates.has(dayStr);
                                                    return (
                                                        <DayIndicator
                                                            key={idx}
                                                            isListMode={true}
                                                            hasDiary={hasDiary}
                                                            isCompleted={isCompleted}
                                                            barColor={
                                                                firstNovel
                                                                    ? 'view'
                                                                    : isCompleted
                                                                        ? 'create'
                                                                        : 'fill'
                                                            }
                                                        />
                                                    );
                                                });
                                            })()}
                                        </ProgressBar>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                        {firstNovel ? (
                                            <CreateButton
                                                isListMode={true}
                                                completed={true}
                                                onClick={handleAddNovel}
                                                disabled={allGenresCreated}
                                            >
                                                {allGenresCreated ? "완성 ✨" : (!isPremium && novelsForWeek.length > 0 ? "👑 PREMIUM" : "다른 장르 생성")}
                                            </CreateButton>
                                        ) : (
                                            <CreateButton
                                                isListMode={true}
                                                completed={false}
                                                isFree={false}
                                                disabled={!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))}
                                                onClick={() => {
                                                    if (!isCompleted && (isFutureWeek(week) || hasTodayDiary(week))) {
                                                        return;
                                                    }
                                                    isCompleted ? handleCreateNovelClick(week) : handleWriteDiary(week);
                                                }}
                                            >
                                                {isCompleted
                                                    ? t('novel_create')
                                                    : t('novel_fill_diary')}
                                            </CreateButton>
                                        )}
                                    </div>
                                </WeeklyCard>
                            );
                        })}
                    </WeeklyList>
                )}
            </WeeklySection>

            {/* 소설 생성 옵션 모달 */}
            {showCreateOptionModal && selectedWeekForCreate && (
                <CreateOptionModal onClick={() => setShowCreateOptionModal(false)}>
                    <CreateOptionContent onClick={(e) => e.stopPropagation()} theme={theme}>
                        <CloseButton onClick={() => setShowCreateOptionModal(false)} theme={theme}>×</CloseButton>
                        <CreateOptionTitle theme={theme}>소설 생성 방법 선택</CreateOptionTitle>
                        <CreateOptionButton
                            isFree={true}
                            onClick={() => {
                                handleCreateNovel(selectedWeekForCreate, true);
                                setShowCreateOptionModal(false);
                            }}
                            theme={theme}
                        >
                            🪄 프리미엄 무료권 사용
                        </CreateOptionButton>
                        <CreateOptionDesc theme={theme} style={{ marginBottom: '12px' }}>
                            무료로 소설을 생성합니다 (매월 자동 충전)
                        </CreateOptionDesc>
                        <CreateOptionButton
                            isFree={false}
                            onClick={() => {
                                handleCreateNovel(selectedWeekForCreate, false);
                                setShowCreateOptionModal(false);
                            }}
                            theme={theme}
                        >
                            🔮 포션 사용
                        </CreateOptionButton>
                        <CreateOptionDesc theme={theme}>
                            보유한 포션 1개를 사용합니다
                        </CreateOptionDesc>
                    </CreateOptionContent>
                </CreateOptionModal>
            )}

            {/* 소설 목록 모달 */}
            {selectedWeekNovels && (
                <NovelListModal onClick={() => setSelectedWeekNovels(null)}>
                    <NovelListContent onClick={(e) => e.stopPropagation()}>
                        <NovelListHeader>
                            <NovelListTitle>소설 선택</NovelListTitle>
                            <NovelListClose onClick={() => setSelectedWeekNovels(null)}>×</NovelListClose>
                        </NovelListHeader>
                        {selectedWeekNovels.map((novel) => {
                            const genreKey = novel.genre === '로맨스' ? 'romance' :
                                novel.genre === '역사' ? 'historical' :
                                    novel.genre === '추리' ? 'mystery' :
                                        novel.genre === '공포' ? 'horror' :
                                            novel.genre === '동화' ? 'fairytale' :
                                                novel.genre === '판타지' ? 'fantasy' : null;

                            return (
                                <NovelListItem
                                    key={novel.id}
                                    onClick={() => {
                                        const novelKey = createNovelUrl(
                                            novel.year,
                                            novel.month,
                                            novel.weekNum,
                                            novel.genre,
                                            novel.id
                                        );
                                        navigate(`/novel/${novelKey}`);
                                        setSelectedWeekNovels(null);
                                    }}
                                >
                                    <NovelListCover
                                        src={novel.imageUrl || '/novel_banner/default.png'}
                                        alt={novel.title}
                                    />
                                    <NovelListInfo>
                                        <NovelListNovelTitle>{novel.title}</NovelListNovelTitle>
                                        <NovelListGenre>
                                            {genreKey ? t(`novel_genre_${genreKey}`) : novel.genre}
                                        </NovelListGenre>
                                    </NovelListInfo>
                                </NovelListItem>
                            );
                        })}
                    </NovelListContent>
                </NovelListModal>
            )}

            {/* 이번주 일기 목록 모달 */}
            {showCurrentWeekDiaryModal && (
                <CurrentWeekDiaryModal onClick={() => setShowCurrentWeekDiaryModal(false)}>
                    <CurrentWeekDiaryContent theme={theme} onClick={(e) => e.stopPropagation()}>
                        <CurrentWeekDiaryHeader>
                            <CurrentWeekDiaryTitle theme={theme}>
                                {t('novel_this_week_diaries') || '이번주 일기 목록'}
                            </CurrentWeekDiaryTitle>
                            <CurrentWeekDiaryClose theme={theme} onClick={() => setShowCurrentWeekDiaryModal(false)}>
                                ×
                            </CurrentWeekDiaryClose>
                        </CurrentWeekDiaryHeader>
                        <CurrentWeekDiaryList>
                            {currentWeekDiaries.length === 0 ? (
                                <CurrentWeekDiaryEmpty theme={theme}>
                                    {t('novel_no_this_week_diaries') || '이번주에 작성한 일기가 없습니다.'}
                                </CurrentWeekDiaryEmpty>
                            ) : (
                                currentWeekDiaries.map((diary, index) => {
                                    const diaryDate = new Date(diary.date);
                                    const dateStr = `${diaryDate.getFullYear()}년 ${diaryDate.getMonth() + 1}월 ${diaryDate.getDate()}일`;

                                    // 이미지가 있으면 첫 번째 이미지 사용, 없으면 이모티콘 표시
                                    const hasImage = diary.imageUrls && diary.imageUrls.length > 0;
                                    const imageUrl = hasImage ? diary.imageUrls[0] : null;

                                    return (
                                        <CurrentWeekDiaryItem
                                            key={index}
                                            theme={theme}
                                        >
                                            {imageUrl ? (
                                                <CurrentWeekDiaryImage src={imageUrl} alt="일기 이미지" />
                                            ) : (
                                                <CurrentWeekDiaryImagePlaceholder theme={theme}>
                                                    📝
                                                </CurrentWeekDiaryImagePlaceholder>
                                            )}
                                            <CurrentWeekDiaryInfo>
                                                <CurrentWeekDiaryDate theme={theme}>{dateStr}</CurrentWeekDiaryDate>
                                                <CurrentWeekDiaryTitleText theme={theme}>
                                                    {diary.title || t('diary_no_title') || '제목 없음'}
                                                </CurrentWeekDiaryTitleText>
                                                {diary.content && (
                                                    <CurrentWeekDiaryPreview theme={theme}>
                                                        {diary.content}
                                                    </CurrentWeekDiaryPreview>
                                                )}
                                            </CurrentWeekDiaryInfo>
                                        </CurrentWeekDiaryItem>
                                    );
                                })
                            )}
                        </CurrentWeekDiaryList>
                    </CurrentWeekDiaryContent>
                </CurrentWeekDiaryModal>
            )}

            <Navigation />
        </Container>
    );
};

export default Novel; 