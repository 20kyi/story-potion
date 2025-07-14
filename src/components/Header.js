import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

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
  font-family: 'Inter', sans-serif;
  font-weight: 500;
`;

const RightSection = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoText = styled.span`
  font-family: 'Barlow Condensed', 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.mode === 'dark' ? '#fff' : '#111'};
  user-select: none;
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  pointer-events: none;
`;

const Header = ({ user, rightActions, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';

  const displayName = user?.displayName || user?.email?.split('@')[0];
  const photoURL = user?.photoURL || '/profile-placeholder.jpg';

  const handleBack = () => {
    if (location.pathname === '/diaries') {
      navigate('/');
    } else if (location.pathname.startsWith('/diary/')) {
      navigate('/diaries');
    } else if (location.pathname === '/write' || location.pathname.startsWith('/write')) {
      navigate('/diaries');
    } else if (location.pathname === '/novel') {
      navigate('/');
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
          <BackButton onClick={handleBack}>←</BackButton>
        )}
        {isHome && (
          <LogoText>STORYPOTION</LogoText>
        )}
      </LeftSection>
      {!isHome && title && (
        <CenterSection>
          <span style={{ fontSize: 20, fontWeight: 700 }}>{title}</span>
        </CenterSection>
      )}
      {rightActions && <RightSection>{rightActions}</RightSection>}
    </HeaderContainer>
  );
};

export default Header;
