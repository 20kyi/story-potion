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
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  position: relative;
`;

const PointDisplay = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  color: ${({ theme }) => theme.subText || '#888'};
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
  background: ${({ theme }) => theme.card};
  border: none;
  border-radius: 15px;
  padding: 16px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
  color: ${({ theme }) => theme.text};
  margin-bottom: 2px;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

const MenuDescription = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#666'};
  text-align: center;
  margin-top: 4px;
  word-break: keep-all;
  overflow-wrap: break-word;
`;

function Shop({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
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
    <Container theme={theme}>
      <Header user={user} title={t('shop_title')} />

      <PointDisplay theme={theme}>
        <PointAmount>
          <PointIcon width={32} height={32} color="#3498f3" />
          {currentPoints.toLocaleString()}p
        </PointAmount>
        <PointLabel theme={theme}>{t('current_points')}</PointLabel>
      </PointDisplay>

      {/* 메뉴 그리드 */}
      <MenuGrid>
        <MenuButton onClick={() => navigate('/my/shop/charge')}>
          <MenuIcon>
            <PointIcon width={24} height={24} color="#3498f3" />
          </MenuIcon>
          <MenuContent>
            <MenuTitle>{t('point_charge')}</MenuTitle>
            <MenuDescription>
              {t('point_charge_desc') || '포인트로 다양한 기능을 이용해보세요!'}
            </MenuDescription>
          </MenuContent>
        </MenuButton>

        <MenuButton onClick={() => navigate('/my/potion-shop')}>
          <MenuIcon>
            <ShopIcon width={24} height={24} color="#e46262" />
          </MenuIcon>
          <MenuContent>
            <MenuTitle>{t('potion_shop')}</MenuTitle>
            <MenuDescription>
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