/**
 * AdminLayout.js - 관리자 페이지 공통 레이아웃 컴포넌트
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import Header from '../Header';

const Container = styled.div`
  max-width: 1200px;
  margin-top: 70px;
  margin-left: auto;
  margin-right: auto;
//   margin-bottom: 100px;
  padding: 20px;
  padding-bottom: 100px;
//   padding-top: calc(env(safe-area-inset-top, 24px) + 74px);
  font-family: 'Arial', sans-serif;
  background: ${({ theme }) => theme.card || theme.background || '#fdfdfd'};
  color: ${({ theme }) => theme.text || '#222'};
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return '#000000';
        if ($isDiaryTheme) return '#8B6F47';
        return theme.text;
    }};
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s, transform 0.2s;
  
  &:hover {
    background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
        if ($isGlassTheme) return 'rgba(0, 0, 0, 0.1)';
        if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.1)';
        return theme.cardHover || 'rgba(0, 0, 0, 0.05)';
    }};
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 20px;
    padding: 6px;
  }
`;

export const AdminLayout = ({ user, title = '관리자', children, showNav = true }) => {
    const navigate = useNavigate();
    const { theme: themeMode, actualTheme } = useTheme();
    const isDiaryTheme = actualTheme === 'diary';
    const isGlassTheme = actualTheme === 'glass';
    const theme = isDiaryTheme
        ? { text: '#8B6F47', card: '#faf8f3', cardHover: 'rgba(139, 111, 71, 0.1)' }
        : actualTheme === 'dark'
            ? { text: '#fff', card: '#2a2a2a', cardHover: '#333' }
            : { text: '#222', card: '#fdfdfd', cardHover: '#e8e8e8' };

    const handleClose = () => {
        navigate('/my');
    };

    return (
        <>
            {showNav && (
                <Header
                    user={user}
                    title={title}
                    rightActions={
                        <CloseButton
                            theme={theme}
                            $isDiaryTheme={isDiaryTheme}
                            $isGlassTheme={isGlassTheme}
                            onClick={handleClose}
                            title="닫기"
                        >
                            ×
                        </CloseButton>
                    }
                />
            )}
            <Container theme={theme}>
                {children}
            </Container>
        </>
    );
};

export default AdminLayout;

