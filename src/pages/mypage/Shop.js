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
  background: ${({ $isDiaryTheme }) => $isDiaryTheme ? '#faf8f3' : 'transparent'};
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#5C4B37' : theme.text};
  position: relative;
`;

const PointDisplay = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding: 24px 20px;
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '24px';
    return $isDiaryTheme ? '16px 20px 18px 17px' : '16px';
  }};
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  position: relative;
  transform: ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) ? 'rotate(0.2deg)' : 'none'};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  
  ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) && `
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

const PotionDisplay = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '24px';
    return $isDiaryTheme ? '16px 20px 18px 17px' : '16px';
  }};
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  position: relative;
  transform: ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) ? 'rotate(-0.1deg)' : 'none'};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  
  ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) && `
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

const PotionLabel = styled.div`
  font-size: 14px;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : (theme.subText || '#888')};
  margin-bottom: 12px;
  text-align: center;
  font-weight: 500;
`;

const PotionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const PotionItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: ${({ $hasPotion }) => $hasPotion ? 1 : 0.4};
`;

const PotionImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  margin-bottom: 6px;
`;

const PotionCount = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme, $isDiaryTheme, $hasPotion }) => {
    if (!$hasPotion) return theme.subText || '#999';
    return $isDiaryTheme ? '#8B6F47' : theme.text;
  }};
  text-align: center;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 30px;
  
  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const MenuButton = styled.button`
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.mode === 'dark' ? theme.card : '#ffffff';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return theme.mode === 'dark' ? 'none' : '1px solid #f0f0f0';
  }};
  border-radius: ${({ $isDiaryTheme, $isGlassTheme, index }) => {
    if ($isGlassTheme) return '24px';
    if (!$isDiaryTheme) return '16px';
    const borderRadiuses = [
      '14px 18px 16px 15px',
      '16px 14px 18px 15px',
      '15px 16px 14px 18px',
      '18px 15px 17px 14px'
    ];
    return borderRadiuses[index % borderRadiuses.length];
  }};
  padding: 20px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) {
      return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    }
    return theme.mode === 'dark'
      ? '0 2px 8px rgba(0,0,0,0.18)'
      : '0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
  }};
  text-align: center;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  transform: ${({ $isDiaryTheme, $isGlassTheme, index }) => {
    if ($isGlassTheme) return 'none';
    if (!$isDiaryTheme) return 'none';
    const rotations = [0.2, -0.3, 0.1, -0.2];
    return `rotate(${rotations[index % rotations.length] || 0}deg)`;
  }};

  ${({ $isDiaryTheme, $isGlassTheme }) => ($isDiaryTheme && !$isGlassTheme) && `
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
    transform: ${({ theme, $isDiaryTheme, $isGlassTheme, index }) => {
    if ($isGlassTheme) return 'translateY(-2px)';
    if ($isDiaryTheme) {
      const rotations = [0.2, -0.3, 0.1, -0.2];
      return `rotate(${rotations[index % rotations.length] || 0}deg) scale(0.98) translateY(-1px)`;
    }
    return theme.mode === 'dark' ? 'translateY(-2px)' : 'translateY(-3px)';
  }};
    box-shadow: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return '0 6px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
    if ($isDiaryTheme) {
      return '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)';
    }
    return theme.mode === 'dark'
      ? '0 4px 12px rgba(0,0,0,0.25)'
      : '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)';
  }};
    border-color: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.6)';
    if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.3)';
    return theme.mode === 'dark' ? 'none' : '#e0e0e0';
  }};
  }

  &:active {
    transform: ${({ theme, $isDiaryTheme, $isGlassTheme, index }) => {
    if ($isGlassTheme) return 'scale(0.97)';
    if ($isDiaryTheme) {
      const rotations = [0.2, -0.3, 0.1, -0.2];
      return `rotate(${rotations[index % rotations.length] || 0}deg) scale(0.95)`;
    }
    return 'scale(0.97)';
  }};
    background: ${({ theme, $isDiaryTheme, $isGlassTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.25)';
    if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.1)';
    return theme.mode === 'dark' ? '#2a2a2a' : '#f8f9fa';
  }};
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
  margin-bottom: 8px;
`;

const MenuTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme, $isDiaryTheme }) => $isDiaryTheme ? '#8B6F47' : theme.text};
  margin-bottom: 8px;
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

// 포션 데이터
const potionData = [
  { id: 'romance', key: 'novel_genre_romance', image: '/potion/romance.png' },
  { id: 'historical', key: 'novel_genre_historical', image: '/potion/historical.png' },
  { id: 'mystery', key: 'novel_genre_mystery', image: '/potion/mystery.png' },
  { id: 'horror', key: 'novel_genre_horror', image: '/potion/horror.png' },
  { id: 'fairytale', key: 'novel_genre_fairytale', image: '/potion/fairytale.png' },
  { id: 'fantasy', key: 'novel_genre_fantasy', image: '/potion/fantasy.png' },
];

function Shop({ user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { actualTheme } = useTheme();
  const isDiaryTheme = actualTheme === 'diary';
  const isGlassTheme = actualTheme === 'glass';
  const { t } = useTranslation();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [ownedPotions, setOwnedPotions] = useState({});

  // 현재 포인트 및 포션 조회
  useEffect(() => {
    if (user?.uid) {
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentPoints(data.point || 0);
            setOwnedPotions(data.potions || {});
          }
        } catch (error) {
          console.error('사용자 데이터 조회 실패:', error);
        }
      };
      fetchUser();
    }
  }, [user]);

  return (
    <Container theme={theme} $isDiaryTheme={isDiaryTheme}>
      <Header user={user} title={t('shop_title')} />

      <PointDisplay theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
        <PointAmount>
          <PointIcon width={32} height={32} color="#3498f3" />
          {currentPoints.toLocaleString()}p
        </PointAmount>
        <PointLabel theme={theme} $isDiaryTheme={isDiaryTheme}>{t('current_points')}</PointLabel>
      </PointDisplay>

      {/* 보유 포션 표시 */}
      <PotionDisplay theme={theme} $isDiaryTheme={isDiaryTheme} $isGlassTheme={isGlassTheme}>
        <PotionLabel theme={theme} $isDiaryTheme={isDiaryTheme}>
          {t('current_potions') || '보유 포션'}
        </PotionLabel>
        <PotionGrid>
          {potionData.map((potion) => {
            const count = ownedPotions[potion.id] || 0;
            const hasPotion = count > 0;
            return (
              <PotionItem key={potion.id} $hasPotion={hasPotion}>
                <PotionImage src={potion.image} alt={t(potion.key) || potion.id} />
                <PotionCount theme={theme} $isDiaryTheme={isDiaryTheme} $hasPotion={hasPotion}>
                  {count}
                </PotionCount>
              </PotionItem>
            );
          })}
        </PotionGrid>
      </PotionDisplay>

      {/* 메뉴 그리드 */}
      <MenuGrid>
        <MenuButton
          theme={theme}
          $isDiaryTheme={isDiaryTheme}
          $isGlassTheme={isGlassTheme}
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
          $isGlassTheme={isGlassTheme}
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