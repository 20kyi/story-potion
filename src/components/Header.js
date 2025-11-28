import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import BackIcon from './icons/BackIcon';
import NotificationIcon from './icons/NotificationIcon';
import { useTheme } from '../ThemeContext';
import { getSafeProfileImageUrl, handleImageError } from '../utils/profileImageUtils';

const HeaderContainer = styled.header`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: transparent;
  box-shadow: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme
      ? '0 2px 12px rgba(0,0,0,0.06)'
      : `0 2px 12px ${theme.cardShadow}`};
  background-color: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#faf8f3' : theme.card};
  padding: 16px 20px 16px 20px;
  padding-top: calc(env(safe-area-inset-top, 24px) + 18px); /* 모바일 상단 safe area 대응 */
  min-height: 56px;
  // padding-top: env(safe-area-inset-top, 24px);

  @media (min-width: 768px) {
    padding-top: 12px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const BackButton = styled.div`
  color: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#8B6F47' : theme.text};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProfileImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 0.5px solidrgb(0, 0, 0);
  background-color:rgba(212, 212, 212, 0.77);
  object-fit: cover;
`;

const Nickname = styled.span`
  font-size: 18px !important;
  color: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#8B6F47' : theme.text};
  font-weight: 500;
`;

const RightSection = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NotificationButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#8B6F47' : (theme.text || '#333')};
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? 'rgba(139, 111, 71, 0.1)' : (theme.cardHover || 'rgba(0, 0, 0, 0.05)')};
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background-color: #ff4444;
  border-radius: 50%;
  border: 2px solid ${({ theme, $isDiaryTheme }) =>
    $isDiaryTheme ? '#faf8f3' : (theme.card || '#fff')};
`;

const LogoText = styled.span`
  font-size: 28px !important;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${({ theme, $isDiaryTheme }) => {
    if ($isDiaryTheme) return '#8B6F47';
    return theme.mode === 'dark' ? '#fff' : '#111';
  }};
  user-select: none;
`;

const CenterSection = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: calc(env(safe-area-inset-top, 24px) + 16px);
  bottom: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
`;

const TitleText = styled.span`
  font-size: 20px !important;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  height: 100%;
  color: ${({ $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : 'inherit'};
`;

const Header = ({ user, rightActions, title, onNotificationClick, hasUnreadNotifications }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';
  const { theme: themeMode, actualTheme, setThemeMode, toggleTheme } = useTheme();
  const isDiaryTheme = actualTheme === 'diary';
  const theme = isDiaryTheme
    ? { text: '#8B6F47', card: '#faf8f3', cardHover: 'rgba(139, 111, 71, 0.1)' }
    : actualTheme === 'dark'
      ? { text: '#fff', card: '#2a2a2a', cardHover: '#333' }
      : { text: '#222', card: '#fff', cardHover: '#f5f5f5' };

  const displayName = user?.displayName || user?.email?.split('@')[0];
  const photoURL = user?.photoURL || '/profile-placeholder.jpg';

  const handleBack = () => {
    if (location.pathname === '/diaries') {
      navigate('/');
    } else if (location.pathname.startsWith('/diary/')) {
      // 일기 상세 페이지에서 뒤로가기 시 해당 달의 일기 목록으로 이동
      const dateMatch = location.pathname.match(/\/diary\/date\/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        const [year, month] = dateStr.split('-').map(Number);
        // 해당 달의 첫 날짜를 targetDate로 전달
        const targetDate = new Date(year, month - 1, 1);
        navigate('/diaries', { state: { targetDate: targetDate.toISOString() } });
      } else {
        navigate(-1);
      }
    } else if (location.pathname === '/write' || location.pathname.startsWith('/write')) {
      navigate('/diaries');
    } else if (location.pathname === '/novel/create') {
      navigate('/novel');
    } else if (location.pathname.startsWith('/novel/') && location.pathname !== '/novel') {
      // state에 returnPath가 있으면 해당 경로로 이동 (구매한 소설 페이지 등)
      if (location.state?.returnPath) {
        navigate(location.state.returnPath);
      } else {
        // URL에 userId 쿼리 파라미터가 있으면 친구 소설 목록으로 이동
        const urlParams = new URLSearchParams(location.search);
        const userId = urlParams.get('userId');
        if (userId) {
          navigate(`/friend-novels?userId=${userId}`);
        } else {
          // 소설 보기 페이지에서 뒤로가기 시 직전 페이지로 이동
          // 단, 포션 선택 페이지(NovelCreate)에서 온 경우는 건너뛰기
          if (location.state?.skipCreatePage && location.state?.returnPath) {
            // 포션 선택 페이지를 건너뛰고 이전 페이지로 직접 이동
            navigate(location.state.returnPath);
          } else {
            navigate(-1);
          }
        }
      }
    } else if (location.pathname === '/novel') {
      navigate('/');
    } else if (location.pathname === '/friend-novels') {
      // 친구 소설 목록에서 뒤로가기 시 친구 페이지로 이동
      navigate('/my/friend');
    } else if (location.pathname === '/my') {
      navigate('/');
    } else if (location.pathname === '/novels') {
      navigate('/');
    } else {
      navigate(-1);
    }
  };

  return (
    <HeaderContainer $isDiaryTheme={isDiaryTheme}>
      <LeftSection>
        {!isHome && (
          <BackButton onClick={handleBack} $isDiaryTheme={isDiaryTheme}>
            <BackIcon size={20} color={theme.text} />
          </BackButton>
        )}
        {isHome && (
          <LogoText data-logo="true" $isDiaryTheme={isDiaryTheme}>STORYPOTION</LogoText>
        )}
      </LeftSection>
      {!isHome && title && (
        <CenterSection>
          <TitleText $isDiaryTheme={isDiaryTheme}>{title}</TitleText>
        </CenterSection>
      )}
      <RightSection>
        {isHome && onNotificationClick && (
          <NotificationButton theme={theme} $isDiaryTheme={isDiaryTheme} onClick={onNotificationClick}>
            <NotificationIcon size={24} color={theme.text} />
            {hasUnreadNotifications && <NotificationBadge theme={theme} $isDiaryTheme={isDiaryTheme} />}
          </NotificationButton>
        )}
        {rightActions && rightActions}
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
