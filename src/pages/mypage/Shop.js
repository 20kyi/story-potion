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
import ConfirmModal from '../../components/ui/ConfirmModal';

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

const PremiumSection = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  padding: 20px;
  // margin-bottom: 20px;
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
  font-family: inherit;
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
  font-family: inherit;
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

const PremiumCard = styled.div`
  flex: 1;
  background: ${({ theme }) => theme.card};
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1.5px solid ${({ theme }) => theme.border || '#e0e0e0'};
  margin: 0;
  height: 220px;
  text-align: center;
`;

const YearlyPremiumCard = styled(PremiumCard)`
  box-shadow: 0 4px 16px rgba(255,195,0,0.13);
  border: 2.5px solid #FFC300;
  position: relative;
`;

function Shop({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState({
    isMonthlyPremium: false,
    isYearlyPremium: false,
    premiumType: null
  });
  const [modal, setModal] = useState({ open: false, type: null });

  // 현재 포인트 및 프리미엄 상태 조회
  useEffect(() => {
    if (user?.uid) {
      const fetchUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentPoints(data.point || 0);
            setPremiumStatus({
              isMonthlyPremium: data.isMonthlyPremium || false,
              isYearlyPremium: data.isYearlyPremium || false,
              premiumType: data.premiumType || null
            });
          }
        } catch (error) {
          console.error('포인트/프리미엄 상태 조회 실패:', error);
        }
      };
      fetchUser();
    }
  }, [user]);

  const handleMonthlyPremium = async () => {
    if (premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) {
      toast.showToast('이미 프리미엄 회원입니다.', 'error');
      return;
    }
    setModal({ open: true, type: 'monthly' });
  };

  const handleYearlyPremium = async () => {
    if (premiumStatus.isYearlyPremium) {
      toast.showToast('이미 연간 프리미엄 회원입니다.', 'error');
      return;
    }
    setModal({ open: true, type: 'yearly' });
  };

  // 실제 결제 로직 분리
  const doMonthlyPremium = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const renewalDate = new Date(now);
      renewalDate.setMonth(now.getMonth() + 1);
      await updateDoc(doc(db, 'users', user.uid), {
        isMonthlyPremium: true,
        isYearlyPremium: false,
        premiumType: 'monthly',
        premiumStartDate: now,
        premiumRenewalDate: renewalDate
      });
      toast.showToast('월간 프리미엄 가입이 완료되었습니다!', 'success');
      setPremiumStatus({
        isMonthlyPremium: true,
        isYearlyPremium: false,
        premiumType: 'monthly'
      });
    } catch (error) {
      console.error('월간 프리미엄 가입 실패:', error);
      toast.showToast('월간 프리미엄 가입에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
      setModal({ open: false, type: null });
    }
  };

  const doYearlyPremium = async () => {
    setIsLoading(true);
    let extraDays = 0;
    
    // 월간 프리미엄 회원인 경우 남은 기간 계산
    if (premiumStatus.isMonthlyPremium) {
      const now = new Date();
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.premiumRenewalDate) {
            let renewal;
            
            // Firestore Timestamp 객체를 Date 객체로 변환
            if (data.premiumRenewalDate.seconds) {
              renewal = new Date(data.premiumRenewalDate.seconds * 1000);
            } else if (data.premiumRenewalDate.toDate) {
              renewal = data.premiumRenewalDate.toDate();
            } else {
              renewal = new Date(data.premiumRenewalDate);
            }
            
            // 현재 시간보다 미래인 경우에만 추가 일수 계산
            if (renewal > now) {
              extraDays = Math.ceil((renewal - now) / (1000 * 60 * 60 * 24));
              console.log(`월간 프리미엄 남은 기간: ${extraDays}일`);
            }
          }
        }
      } catch (error) {
        console.error('월간 프리미엄 남은 기간 계산 실패:', error);
        // 에러가 발생해도 연간 프리미엄 가입은 진행
      }
    }
    
    try {
      const now = new Date();
      let renewalDate = new Date(now);
      renewalDate.setFullYear(now.getFullYear() + 1);
      
      // 월간 프리미엄의 남은 기간을 연간 프리미엄에 추가
      if (extraDays > 0) {
        renewalDate.setDate(renewalDate.getDate() + extraDays);
        console.log(`연간 프리미엄 갱신일: ${renewalDate.toLocaleDateString()}, 추가된 일수: ${extraDays}일`);
      }
      
      await updateDoc(doc(db, 'users', user.uid), {
        isMonthlyPremium: false,
        isYearlyPremium: true,
        premiumType: 'yearly',
        premiumStartDate: now,
        premiumRenewalDate: renewalDate
      });
      
      const successMessage = extraDays > 0 
        ? `연간 프리미엄 가입이 완료되었습니다! (기존 월간 프리미엄 ${extraDays}일이 추가되었습니다)`
        : '연간 프리미엄 가입이 완료되었습니다!';
      
      toast.showToast(successMessage, 'success');
      setPremiumStatus({
        isMonthlyPremium: false,
        isYearlyPremium: true,
        premiumType: 'yearly'
      });
    } catch (error) {
      console.error('연간 프리미엄 가입 실패:', error);
      toast.showToast('연간 프리미엄 가입에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
      setModal({ open: false, type: null });
    }
  };

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
        <MenuButton onClick={() => navigate('/my/shop/charge')}>
          <MenuIcon>
            <PointIcon width={24} height={24} color="#3498f3" />
          </MenuIcon>
          <MenuContent>
            <MenuTitle>포인트 충전</MenuTitle>
            <MenuDescription>
              포인트로 다양한 기능을 이용해보세요!
            </MenuDescription>
          </MenuContent>
        </MenuButton>

        <MenuButton onClick={() => navigate('/my/potion-shop')}>
          <MenuIcon>
            <ShopIcon width={24} height={24} color="#e46262" />
          </MenuIcon>
          <MenuContent>
            <MenuTitle>포션 상점</MenuTitle>
            <MenuDescription>
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
        <PremiumCard>
          <div style={{ color: '#e46262', fontWeight: 700, fontSize: 12, marginBottom: 6, textAlign: 'center', fontFamily: 'inherit' }}>월간 프리미엄</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2, textAlign: 'center', fontFamily: 'inherit' }}>월 5,900원</div>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 10, textAlign: 'center', marginTop: 10, fontFamily: 'inherit' }}>매월 결제, <br />언제든 해지 가능</div>
          </div>
          <PremiumButton
            style={{ width: '100%', fontSize: 13, marginTop: 6, padding: '10px 0' }}
            onClick={handleMonthlyPremium}
            disabled={isLoading}
          >
            {isLoading ? '처리중...' : '월간 가입하기'}
          </PremiumButton>
        </PremiumCard>

        {/* 연간 결제 카드 */}
        <YearlyPremiumCard>
          <div style={{ position: 'absolute', top: -14, left: 12, background: 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)', color: '#fff', fontWeight: 700, fontSize: 11, borderRadius: 7, padding: '3px 12px', boxShadow: '0 2px 8px rgba(255,195,0,0.13)', letterSpacing: 1, fontFamily: 'inherit' }}>추천</div>
          <div style={{ color: '#FF9800', fontWeight: 800, fontSize: 13, marginBottom: 6, textAlign: 'center', zIndex: 1, fontFamily: 'inherit' }}>연간 프리미엄</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, textAlign: 'center', color: '#FF6F00', fontFamily: 'inherit' }}>연 49,560원</div>
            <div style={{ color: '#FF9800', fontWeight: 700, fontSize: 12, marginBottom: 1, textAlign: 'center', fontFamily: 'inherit' }}>30% 할인</div>
            <div style={{ color: '#FFB300', fontSize: 11, marginBottom: 1, textDecoration: 'line-through', textAlign: 'center', fontFamily: 'inherit' }}>정가 70,800원</div>
            <div style={{ color: '#FF9800', fontSize: 13, marginBottom: 10, textAlign: 'center', fontFamily: 'inherit' }}>월 4,130원</div>
          </div>
          <PremiumButton
            style={{ width: '100%', fontSize: 13, background: 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)', color: '#fff', fontWeight: 700, padding: '10px 0', boxShadow: '0 4px 12px rgba(255,195,0,0.18)' }}
            onClick={handleYearlyPremium}
            disabled={isLoading}
          >
            {isLoading ? '처리중...' : '연간 가입하기'}
          </PremiumButton>
        </YearlyPremiumCard>
      </div>

      {/* 프리미엄 가입 확인 모달 */}
      <ConfirmModal
        open={modal.open}
        title={modal.type === 'monthly' ? '월간 프리미엄 가입' : modal.type === 'yearly' ? '연간 프리미엄 가입' : ''}
        description={modal.type === 'monthly' ? '월간 프리미엄에 가입하시겠습니까?' : modal.type === 'yearly' ? '연간 프리미엄에 가입하시겠습니까?' : ''}
        onCancel={() => setModal({ open: false, type: null })}
        onConfirm={() => {
          if (modal.type === 'monthly') doMonthlyPremium();
          else if (modal.type === 'yearly') doYearlyPremium();
        }}
        confirmText="가입하기"
      />

      <Navigation />
    </Container>
  );
}

export default Shop; 