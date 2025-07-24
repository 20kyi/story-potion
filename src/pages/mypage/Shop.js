import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { useToast } from '../../components/ui/ToastProvider';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import PointIcon from '../../components/icons/PointIcon';
import ShopIcon from '../../components/icons/ShopIcon';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  margin: 60px auto;
  margin-top: 60px;
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
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 30px;
`;

const MenuButton = styled.button`
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
  background: rgba(52, 152, 243, 0.1);
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

const PremiumSection = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const PremiumTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border || '#f1f1f1'};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.text};
  
  &:last-child {
    border-bottom: none;
  }
`;

const PremiumButton = styled.button`
  background: linear-gradient(135deg, #e46262, #cb6565);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(228, 98, 98, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(228, 98, 98, 0.4);
  }
`;

const premiumFeatures = [
  { id: 'ads', title: '광고 제거', description: '모든 광고를 제거하고 깔끔한 환경을 제공합니다' },
  { id: 'theme', title: '프리미엄 전용 테마', description: '독점적인 다크/라이트 테마를 사용할 수 있습니다' },
  { id: 'ai-diary', title: 'AI 일기 자동 완성', description: 'AI가 입력한 감정과 키워드로 일기를 자동으로 완성해줍니다.' },
  { id: 'free-potion-on-weekly-novel', title: '매주 소설 생성 1회 무료', description: '프리미엄 회원은 주간 소설 만들기 시 6개 장르 중 원하는 포션을 포인트 차감 없이 무료로 선택할 수 있습니다.' },
  { id: 'premium-sticker', title: '프리미엄 전용 스티커', description: '프리미엄 회원만 사용할 수 있는 특별한 스티커 제공' },
];

function Shop({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 현재 포인트 조회
  useEffect(() => {
    if (user?.uid) {
      const fetchPoints = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentPoints(userDoc.data().point || 0);
          }
        } catch (error) {
          console.error('포인트 조회 실패:', error);
        }
      };
      fetchPoints();
    }
  }, [user]);

  return (
    <Container theme={theme}>
      <Header user={user} title="상점" />

      <PointDisplay theme={theme}>
        <PointAmount>
          <PointIcon width={32} height={32} color="#3498f3" />
          {currentPoints.toLocaleString()}p
        </PointAmount>
        <PointLabel theme={theme}>현재 보유 포인트</PointLabel>
      </PointDisplay>

      {/* 메뉴 그리드 */}
      <MenuGrid>
        <MenuButton onClick={() => navigate('/my/shop/charge')} theme={theme}>
          <MenuIcon>
            <PointIcon width={24} height={24} color="#3498f3" />
          </MenuIcon>
          <MenuContent>
            <MenuTitle theme={theme}>포인트 충전</MenuTitle>
            <MenuDescription theme={theme}>
              포인트로 다양한 기능을 이용해보세요!
            </MenuDescription>
          </MenuContent>
        </MenuButton>

        <MenuButton onClick={() => navigate('/my/potion-shop')} theme={theme}>
          <MenuIcon>
            <ShopIcon width={24} height={24} color="#e46262" />
          </MenuIcon>
          <MenuContent>
            <MenuTitle theme={theme}>포션 상점</MenuTitle>
            <MenuDescription theme={theme}>
              포션을 구매하여 소설을 생성하세요
            </MenuDescription>
          </MenuContent>
        </MenuButton>
      </MenuGrid>

      {/* 프리미엄 기능 섹션 */}
      <PremiumSection theme={theme}>
        <PremiumTitle theme={theme}>
          <span style={{ color: '#e46262' }}>👑</span>
          프리미엄 혜택
        </PremiumTitle>
        <FeatureList>
          {premiumFeatures.map((feature) => (
            <FeatureItem key={feature.id} theme={theme}>
              {feature.title}
            </FeatureItem>
          ))}
        </FeatureList>
      </PremiumSection>

      {/* 프리미엄 결제 비교 카드 UI */}
      <div style={{ display: 'flex', gap: '6px', margin: '18px 0', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'stretch' }}>
        {/* 월간 결제 카드 */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1.5px solid #e0e0e0', margin: 0, height: 220, textAlign: 'center' }}>
          <div style={{ color: '#e46262', fontWeight: 700, fontSize: 12, marginBottom: 6, textAlign: 'center' }}>월간 프리미엄</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2, textAlign: 'center' }}>월 1,900원</div>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 10, textAlign: 'center', marginTop: 10 }}>매월 결제, <br />언제든 해지 가능</div>
          </div>
          <PremiumButton style={{ width: '100%', fontSize: 13, marginTop: 6, padding: '10px 0' }}>월간 가입하기</PremiumButton>
        </div>
        {/* 연간 결제 카드 */}
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, boxShadow: '0 4px 16px rgba(255,195,0,0.13)', padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2.5px solid #FFC300', position: 'relative', margin: 0, height: 220, textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: -14, left: 12, background: 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)', color: '#fff', fontWeight: 700, fontSize: 11, borderRadius: 7, padding: '3px 12px', boxShadow: '0 2px 8px rgba(255,195,0,0.13)', letterSpacing: 1 }}>추천</div>
          <div style={{ color: '#FF9800', fontWeight: 800, fontSize: 13, marginBottom: 6, textAlign: 'center', zIndex: 1, textShadow: '0 1px 2px #fffde7' }}>연간 프리미엄</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 2, textAlign: 'center', color: '#FF6F00', textShadow: '0 1px 2px #fffde7' }}>연 15,000원</div>
            <div style={{ color: '#FF6F00', fontWeight: 700, fontSize: 12, marginBottom: 1, textAlign: 'center', textShadow: '0 1px 2px #fffde7' }}>34% 할인</div>
            <div style={{ color: '#FFB300', fontSize: 11, marginBottom: 1, textDecoration: 'line-through', textAlign: 'center' }}>정가 22,800원</div>
            <div style={{ color: '#FF9800', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>월 1,250원</div>
          </div>
          <PremiumButton style={{ width: '100%', fontSize: 13, background: 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)', color: '#fff', fontWeight: 700, padding: '10px 0', boxShadow: '0 4px 12px rgba(255,195,0,0.18)' }}>연간 가입하기</PremiumButton>
        </div>
      </div>

      <Navigation />
    </Container>
  );
}

export default Shop; 