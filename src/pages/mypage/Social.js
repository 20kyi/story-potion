import React from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { FaShare, FaUsers, FaQrcode, FaHeart } from 'react-icons/fa';

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

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 24px;
  margin-bottom: 32px;
`;

const MenuCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 18px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ theme }) => theme.cardShadow};
  min-height: 120px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const MenuIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e46262, #cb6565);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(228, 98, 98, 0.3);
`;

const MenuTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
  text-align: center;
  margin-bottom: 4px;
`;

const MenuDescription = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#888'};
  text-align: center;
  line-height: 1.4;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeatureCard = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: ${({ theme }) => theme.cardShadow};
  border: 1px solid ${({ theme }) => theme.border || '#f0f0f0'};
`;

const FeatureHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const FeatureIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e46262, #cb6565);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
`;

const FeatureTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.text};
`;

const FeatureDescription = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.subText || '#666'};
  line-height: 1.5;
`;

const ComingSoonBadge = styled.span`
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: auto;
`;

function Social() {
    const navigate = useNavigate();
    const theme = useTheme();

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

    const handleQRCode = () => {
        alert('QR 코드 기능은 준비 중입니다.');
    };

    const handleCommunity = () => {
        alert('커뮤니티 기능은 준비 중입니다.');
    };

    return (
        <>
            <Header user={null} title="소셜" />
            <MainContainer theme={theme}>
                <MenuGrid>
                    <MenuCard onClick={handleShare} theme={theme}>
                        <MenuIcon>
                            <FaShare />
                        </MenuIcon>
                        <MenuTitle theme={theme}>앱 공유</MenuTitle>
                        <MenuDescription theme={theme}>
                            친구들과 스토리포션을 공유해보세요
                        </MenuDescription>
                    </MenuCard>

                    <MenuCard onClick={handleQRCode} theme={theme}>
                        <MenuIcon>
                            <FaQrcode />
                        </MenuIcon>
                        <MenuTitle theme={theme}>QR 초대</MenuTitle>
                        <MenuDescription theme={theme}>
                            QR 코드로 쉽게 초대하세요
                        </MenuDescription>
                    </MenuCard>
                </MenuGrid>

                <FeatureCard theme={theme}>
                    <FeatureHeader>
                        <FeatureIcon>
                            <FaUsers />
                        </FeatureIcon>
                        <FeatureTitle theme={theme}>커뮤니티</FeatureTitle>
                        <ComingSoonBadge>준비중</ComingSoonBadge>
                    </FeatureHeader>
                    <FeatureDescription theme={theme}>
                        다른 사용자들과 이야기를 나누고 소통할 수 있는 커뮤니티 기능이 곧 출시됩니다.
                    </FeatureDescription>
                </FeatureCard>

                <Navigation />
            </MainContainer>
        </>
    );
}

export default Social; 