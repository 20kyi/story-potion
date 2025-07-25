import React from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../ThemeContext';
import { FaShare, FaUsers, FaQrcode, FaHeart } from 'react-icons/fa';
import './Settings.css'; // 스타일 재사용

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  // min-height: 100vh;
  padding: 20px;
  margin: 60px auto;
  max-width: 600px;
  background: ${({ theme }) => theme.background};
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  // padding-bottom: 100px;
`;

// MyPage.js 스타일과 동일하게 MenuGrid, MenuButton, MenuIcon, MenuLabel 재정의
const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0px;
  margin-top: 30px;
  margin-bottom: 30px;
  width: 100%;
`;
const MenuButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: none;
  border-radius: 12px;
  padding: 15px 10px;
  cursor: pointer;
  font-family: inherit;
  transition: background-color 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.menuHover};
  }
`;
const MenuIcon = styled.div`
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const MenuLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.menuText};
  margin-top: 2px;
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
      <div className="settings-container" style={{ minHeight: 500 }}>
        <ul className="settings-list">
          {/* 앱 공유 */}
          <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', paddingBottom: 18, fontFamily: 'inherit', fontWeight: 400, fontSize: '1.1rem', color: '#222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 400, fontSize: '1.1rem', color: '#222', fontFamily: 'inherit' }}>앱 공유</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 13, color: '#888', fontWeight: 400, fontFamily: 'inherit' }}>친구들과 스토리포션을 공유해보세요</span>
              <button style={{ padding: '6px 16px', background: '#e46262', color: 'white', border: 'none', borderRadius: 6, fontSize: 16, marginLeft: 12, cursor: 'pointer', fontWeight: 400, fontFamily: 'inherit' }} onClick={handleShare}>공유</button>
            </div>
          </li>
          {/* QR 초대 */}
          <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', paddingBottom: 18, fontFamily: 'inherit', fontWeight: 400, fontSize: '1.1rem', color: '#222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 400, fontSize: '1.1rem', color: '#222', fontFamily: 'inherit' }}>QR 초대</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 13, color: '#888', fontWeight: 400, fontFamily: 'inherit' }}>QR 코드로 쉽게 초대하세요</span>
              <button style={{ padding: '6px 16px', background: '#e46262', color: 'white', border: 'none', borderRadius: 6, fontSize: 16, marginLeft: 12, cursor: 'pointer', fontWeight: 400, fontFamily: 'inherit' }} onClick={handleQRCode}>초대</button>
            </div>
          </li>
          {/* 커뮤니티 */}
          <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default', paddingBottom: 18, fontFamily: 'inherit', fontWeight: 400, fontSize: '1.1rem', color: '#222' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 400, fontSize: '1.1rem', color: '#222', fontFamily: 'inherit' }}>커뮤니티</span>
              <span style={{ background: 'linear-gradient(135deg, #f39c12, #e67e22)', color: 'white', fontSize: 10, fontWeight: 600, padding: '4px 8px', borderRadius: 12, marginLeft: 8, fontFamily: 'inherit' }}>준비중</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
              <span style={{ fontSize: 13, color: '#888', fontWeight: 400, fontFamily: 'inherit' }}>다른 사용자들과 이야기를 나누고 소통할 수 있는 커뮤니티 기능이 곧 출시됩니다.</span>
            </div>
          </li>
        </ul>
      </div>
      <Navigation />
    </>
  );
}

export default Social; 