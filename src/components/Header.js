import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import BackIcon from './icons/BackIcon';
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
  box-shadow: 0 2px 12px ${({ theme }) => theme.cardShadow};
  background-color: ${({ theme }) => theme.card};
  padding: 16px 20px 12px 20px;
  padding-top: calc(env(safe-area-inset-top, 24px) + 16px); /* 모바일 상단 safe area 대응 */
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
  color: ${({ theme }) => theme.text};
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
  font-size: 18px;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`;

const RightSection = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoText = styled.span`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.mode === 'dark' ? '#fff' : '#111'};
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

const Header = ({ user, rightActions, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';
  const { theme: themeMode, actualTheme, setThemeMode, toggleTheme } = useTheme();
  const theme = actualTheme === 'dark'
    ? { text: '#fff' }
    : { text: '#222' };

  const displayName = user?.displayName || user?.email?.split('@')[0];
  const photoURL = user?.photoURL || '/profile-placeholder.jpg';

  const handleBack = () => {
    if (location.pathname === '/diaries') {
      navigate('/');
    } else if (location.pathname.startsWith('/diary/')) {
      navigate('/diaries');
    } else if (location.pathname === '/write' || location.pathname.startsWith('/write')) {
      navigate('/diaries');
    } else if (location.pathname === '/novel/create') {
      navigate('/novel');
    } else if (location.pathname.startsWith('/novel/') && location.pathname !== '/novel') {
      // URL에 userId 쿼리 파라미터가 있으면 친구 소설 목록으로 이동
      const urlParams = new URLSearchParams(location.search);
      const userId = urlParams.get('userId');
      if (userId) {
        navigate(`/friend-novels?userId=${userId}`);
      } else {
        // 소설 보기 페이지에서 뒤로가기 시 소설 홈으로 이동
        navigate('/novel');
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
    <HeaderContainer>
      <LeftSection>
        {!isHome && (
          <BackButton onClick={handleBack}>
            <BackIcon size={20} color={theme.text} />
          </BackButton>
        )}
        {isHome && (
          <LogoText>STORYPOTION</LogoText>
        )}
      </LeftSection>
      {!isHome && title && (
        <CenterSection>
          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: '1', display: 'flex', alignItems: 'center', height: '100%' }}>{title}</span>
        </CenterSection>
      )}
      {rightActions && <RightSection>{rightActions}</RightSection>}
    </HeaderContainer>
  );
};

export default Header;
