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
  box-shadow: 0 2px 12px rgba(228,98,98,0.06);
  padding: 16px 20px 12px 20px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const BackButton = styled.div`
  color:rgb(0, 0, 0);
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProfileImage = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #df9696;
  background-color: #fdd2d2;
`;

const Nickname = styled.span`
  font-size: 16px;
  color: #cb6565;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
`;

const Header = ({ nickname = '닉네임' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '/home';

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
          <>
            <ProfileImage />
            <Nickname>{nickname}</Nickname>
          </>
        )}
      </LeftSection>
    </HeaderContainer>
  );
};

export default Header;
