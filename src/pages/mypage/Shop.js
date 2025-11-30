import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import PointIcon from '../../components/icons/PointIcon';
import ShopIcon from '../../components/icons/ShopIcon';
import { useTranslation } from '../../LanguageContext';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  margin-top: 60px;
  margin-bottom: 80px;
  margin-left: auto;
  margin-right: auto;
  // padding-bottom: 100px;
  max-width: 600px;
  background: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#faf8f3' : theme.background};
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#5C4B37' : theme.text};
  position: relative;
`;

const PointDisplay = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#fffef9' : theme.card};
  border-radius: ${({ $isDiaryTheme }) => $isDiaryTheme ? '16px 20px 18px 17px' : '15px'};
  box-shadow: ${({ $isDiaryTheme }) => $isDiaryTheme
    ? '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
    : '0 2px 8px rgba(0,0,0,0.1)'};
  border: ${({ $isDiaryTheme }) => $isDiaryTheme ? '1px solid rgba(139, 111, 71, 0.2)' : 'none'};
  position: relative;
  transform: ${({ $isDiaryTheme }) => $isDiaryTheme ? 'rotate(0.2deg)' : 'none'};
  
  ${({ $isDiaryTheme }) => $isDiaryTheme && `
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, transparent 50%);
      z-index: -1;
      opacity: 0.3;
    }
  `}
`;

const PointAmount = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #3498f3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const PointLabel = styled.div`
  font-size: 14px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#888')};
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 30px;
`;

const MenuButton = styled.button`
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#fffef9' : theme.card};
  border: ${({ $isDiaryTheme }) => $isDiaryTheme ? '1px solid rgba(139, 111, 71, 0.2)' : 'none'};
  border-radius: ${({ $isDiaryTheme, index }) => {
    if (!$isDiaryTheme) return '15px';
    const borderRadiuses = [
      '14px 18px 16px 15px',
      '16px 14px 18px 15px',
      '15px 16px 14px 18px',
      '18px 15px 17px 14px'
    ];
    return borderRadiuses[index % borderRadiuses.length];
  }};
  padding: 16px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ $isDiaryTheme }) => $isDiaryTheme
    ? '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
    : '0 2px 8px rgba(0,0,0,0.1)'};
  text-align: center;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  transform: ${({ $isDiaryTheme, index }) => {
    if (!$isDiaryTheme) return 'none';
    const rotations = [0.2, -0.3, 0.1, -0.2];
    return `rotate(${rotations[index % rotations.length] || 0}deg)`;
  }};

  ${({ $isDiaryTheme }) => $isDiaryTheme && `
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, transparent 50%);
      z-index: -1;
      opacity: 0.3;
    }
  `}

  &:hover {
    transform: ${({ $isDiaryTheme, index }) => {
    if (!$isDiaryTheme) return 'translateY(-2px)';
    const rotations = [0.2, -0.3, 0.1, -0.2];
    return `rotate(${rotations[index % rotations.length] || 0}deg) scale(0.98) translateY(-1px)`;
  }};
    box-shadow: ${({ $isDiaryTheme }) => $isDiaryTheme
    ? '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
    : '0 4px 12px rgba(0,0,0,0.15)'};
  }

  &:active {
    transform: ${({ $isDiaryTheme, index }) => {
    if (!$isDiaryTheme) return 'scale(0.95)';
    const rotations = [0.2, -0.3, 0.1, -0.2];
    return `rotate(${rotations[index % rotations.length] || 0}deg) scale(0.95)`;
  }};
    background: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? 'rgba(139, 111, 71, 0.1)' : (theme.cardHover || '#f8f9fa')};
  }
`;

const MenuIcon = styled.div`
  width: 40px;
  height: 40px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  // background: rgba(52, 152, 243, 0.1);
  border-radius: 12px;
`;

const MenuContent = styled.div`
  flex: 1;
`;

const MenuTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
  margin-bottom: 2px;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const MenuDescription = styled.div`
  font-size: 12px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#666')};
  text-align: center;
  margin-top: 4px;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

function Shop({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { actualTheme } = useTheme();
  const isDiaryTheme = actualTheme === 'diary';
  const { t } = useTranslation();
  const [currentPoints, setCurrentPoints] = useState(0);

  // 현재 포인트 조회
  useEffect(() => {
    if (user?.uid) {
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentPoints(data.point || 0);
          }
        } catch (error) {
          console.error('포인트 조회 실패:', error);
        }
      };
      fetchUser();
    }
  }, [user]);

  return (
    <Container theme={theme} $isDiaryTheme={isDiaryTheme}>
      <Header user={user} title={t('shop_title')} />

      <PointDisplay theme={theme} $isDiaryTheme={isDiaryTheme}>
        <PointAmount>
          <PointIcon width={32} height={32} color="#3498f3" />
          {currentPoints.toLocaleString()}p
        </PointAmount>
        <PointLabel theme={theme} $isDiaryTheme={isDiaryTheme}>{t('current_points')}</PointLabel>
      </PointDisplay>

      {/* 메뉴 그리드 */}
      <MenuGrid>
        <MenuButton
          theme={theme}
          $isDiaryTheme={isDiaryTheme}
          index={0}
          onClick={() => navigate('/my/shop/charge')}
        >
          <MenuIcon>
            <PointIcon width={24} height={24} color="#3498f3" />
          </MenuIcon>
          <MenuContent>
            <MenuTitle theme={theme} $isDiaryTheme={isDiaryTheme}>{t('point_charge')}</MenuTitle>
            <MenuDescription theme={theme} $isDiaryTheme={isDiaryTheme}>
              {t('point_charge_desc') || '포인트로 다양한 기능을 이용해보세요!'}
            </MenuDescription>
          </MenuContent>
        </MenuButton>

        <MenuButton
          theme={theme}
          $isDiaryTheme={isDiaryTheme}
          index={1}
          onClick={() => navigate('/my/potion-shop')}
        >
          <MenuIcon>
            <ShopIcon width={24} height={24} color="#e46262" />
          </MenuIcon>
          <MenuContent>
            <MenuTitle theme={theme} $isDiaryTheme={isDiaryTheme}>{t('potion_shop')}</MenuTitle>
            <MenuDescription theme={theme} $isDiaryTheme={isDiaryTheme}>
              {t('potion_shop_desc')}
            </MenuDescription>
          </MenuContent>
        </MenuButton>
      </MenuGrid>

      <Navigation />
    </Container>
  );
}

export default Shop; 