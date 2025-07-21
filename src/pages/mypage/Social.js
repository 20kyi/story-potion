import React from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { FaUserFriends, FaShare, FaUsers, FaQrcode } from 'react-icons/fa';

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  margin: 60px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 100px;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MenuItem = styled.li`
  background: ${({ theme }) => theme.card};
//   border: 1px solid ${({ theme }) => theme.border};
  border-radius: 16px;
  padding: 14px;
//   margin-bottom: 16px;
  font-weight: 500;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
//   box-shadow: ${({ theme }) => theme.cardShadow};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const MenuIcon = styled.div`
  color: #e46262;
  font-size: 20px;
  margin-right: 16px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuContent = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const MenuText = styled.span`
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`;

const ArrowIcon = styled.div`
  color: ${({ theme }) => theme.cardSubText};
  font-size: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin: 32px 0 16px 0;
  color: ${({ theme }) => theme.text};
  padding-bottom: 8px;
  border-bottom: 2px solid #e46262;
`;

function Social() {
    const navigate = useNavigate();
    const theme = useTheme();

    const handleFriendSearch = () => {
        navigate('/my/friend-search');
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Story Potion',
                text: '당신의 이야기를 담는 마법의 포션',
                url: window.location.origin
            });
        } else {
            // 클립보드에 복사
            navigator.clipboard.writeText(window.location.origin);
            alert('링크가 클립보드에 복사되었습니다!');
        }
    };

    const handleCommunity = () => {
        alert('커뮤니티 기능은 준비 중입니다.');
    };

    const handleQRCode = () => {
        alert('QR 코드 기능은 준비 중입니다.');
    };

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="소셜" />
            <MainContainer theme={theme}>
                <SectionTitle theme={theme} style={{ marginTop: '0px', marginBottom: '16px' }}>친구 관리</SectionTitle>
                <MenuList>
                    <MenuItem
                        onClick={handleFriendSearch}
                        theme={theme}
                    >
                        <MenuContent>
                            <MenuIcon theme={theme}>
                                <FaUserFriends />
                            </MenuIcon>
                            <MenuText theme={theme}>친구 찾기</MenuText>
                        </MenuContent>
                        <ArrowIcon theme={theme}>›</ArrowIcon>
                    </MenuItem>
                </MenuList>

                <SectionTitle theme={theme}>공유 및 초대</SectionTitle>
                <MenuList>
                    <MenuItem
                        onClick={handleShare}
                        theme={theme}
                    >
                        <MenuContent>
                            <MenuIcon theme={theme}>
                                <FaShare />
                            </MenuIcon>
                            <MenuText theme={theme}>앱 공유하기</MenuText>
                        </MenuContent>
                        <ArrowIcon theme={theme}>›</ArrowIcon>
                    </MenuItem>
                    <MenuItem
                        onClick={handleQRCode}
                        theme={theme}
                    >
                        <MenuContent>
                            <MenuIcon theme={theme}>
                                <FaQrcode />
                            </MenuIcon>
                            <MenuText theme={theme}>QR 코드로 초대</MenuText>
                        </MenuContent>
                        <ArrowIcon theme={theme}>›</ArrowIcon>
                    </MenuItem>
                </MenuList>

                <SectionTitle theme={theme}>커뮤니티</SectionTitle>
                <MenuList>
                    <MenuItem
                        onClick={handleCommunity}
                        theme={theme}
                    >
                        <MenuContent>
                            <MenuIcon theme={theme}>
                                <FaUsers />
                            </MenuIcon>
                            <MenuText theme={theme}>커뮤니티</MenuText>
                        </MenuContent>
                        <ArrowIcon theme={theme}>›</ArrowIcon>
                    </MenuItem>
                </MenuList>

                <Navigation />
            </MainContainer>
        </>
    );
}

export default Social; 