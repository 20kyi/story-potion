import React from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { lightTheme, darkTheme } from '../../theme';
import { FaShare, FaUsers, FaQrcode, FaHeart } from 'react-icons/fa';

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin: 60px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
`;

const SettingsContainer = styled.div`
  max-width: 600px;
  margin: 60px auto;
  padding: 20px;
  background: ${({ theme }) => theme.background};
  min-height: 500px;
`;

const SettingsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SettingsItem = styled.li`
  border-bottom: 1px solid ${({ theme }) => theme.border};
  padding: 18px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 400;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  flex-direction: ${props => props.expanded ? 'column' : 'row'};
  align-items: ${props => props.expanded ? 'stretch' : 'center'};
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  padding-bottom: 18px;
  font-family: inherit;
`;

const ItemTitle = styled.span`
  font-weight: 400;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.text};
  font-family: inherit;
`;

const ItemDescription = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.subText || '#888'};
  font-weight: 400;
  font-family: inherit;
`;

const ActionButton = styled.button`
  padding: 6px 16px;
  background: #e46262;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  margin-left: 12px;
  cursor: pointer;
  font-weight: 400;
  font-family: inherit;
  transition: background-color 0.2s;

  &:hover {
    background: #cb6565;
  }
`;

const ComingSoonBadge = styled.span`
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
  font-family: inherit;
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ItemDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
`;

const ItemDetailsDescription = styled.div`
  display: flex;
  align-items: center;
  margin-top: 6px;
`;

function Social() {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  const theme = actualTheme === 'dark' ? darkTheme : lightTheme;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Story Potion',
        text: '당신의 이야기를 담는 마법의 포션',
        url: 'https://story-potion.web.app'
      });
    } else {
      navigator.clipboard.writeText('https://story-potion.web.app');
      alert('링크가 클립보드에 복사되었습니다!');
    }
  };



  const handleCommunity = () => {
    alert('커뮤니티 기능은 준비 중입니다.');
  };

  return (
    <>
      <Header user={null} title="소셜" />
      <SettingsContainer theme={theme}>
        <SettingsList>
          {/* 앱 공유 */}
          <SettingsItem theme={theme} expanded clickable>
            <ItemContent>
              <ItemTitle theme={theme}>앱 공유</ItemTitle>
            </ItemContent>
            <ItemDetails>
              <ItemDescription theme={theme}>친구들과 스토리포션을 공유해보세요</ItemDescription>
              <ActionButton theme={theme} onClick={handleShare}>공유</ActionButton>
            </ItemDetails>
          </SettingsItem>
          

          
          {/* 커뮤니티 */}
          <SettingsItem theme={theme} expanded>
            <ItemContent>
              <ItemTitle theme={theme}>커뮤니티</ItemTitle>
              <ComingSoonBadge>준비중</ComingSoonBadge>
            </ItemContent>
            <ItemDetailsDescription>
              <ItemDescription theme={theme}>다른 사용자들과 이야기를 나누고 소통할 수 있는 커뮤니티 기능이 곧 출시됩니다.</ItemDescription>
            </ItemDetailsDescription>
          </SettingsItem>
        </SettingsList>
      </SettingsContainer>
      <Navigation />
    </>
  );
}

export default Social; 