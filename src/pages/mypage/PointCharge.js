import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useToast } from '../../components/ui/ToastProvider';
import styled from 'styled-components';
import { useTheme as useAppTheme } from '../../ThemeContext';
import { useTheme } from 'styled-components';
import PointIcon from '../../components/icons/PointIcon';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useTranslation } from '../../LanguageContext';
import { inAppPurchaseService, PRODUCT_IDS, PRODUCT_INFO } from '../../utils/inAppPurchase';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  margin: 40px auto;
  margin-top: 50px;
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
  font-family: inherit;
  color: #3498f3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const PointLabel = styled.div`
  font-size: 14px;
  font-family: inherit;
  color: ${({ theme }) => theme.subText || '#888'};
`;

const PackageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 30px;
`;

const PackageCard = styled.div`
  background: ${({ theme, selected }) => selected ? (theme.cardActive || theme.primary || '#3498f3') : theme.card};
  color: ${({ theme, selected }) => selected ? (theme.cardActiveText || 'white') : theme.text};
  border: 2px solid ${({ theme, selected }) => selected ? (theme.cardActiveBorder || theme.primary || '#3498f3') : (theme.border || '#e0e0e0')};
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

const PackagePoints = styled.div`
  font-size: 24px;
  font-weight: 700;
  font-family: inherit;
  margin-bottom: 8px;
`;

const PackagePrice = styled.div`
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  margin-bottom: 4px;
`;

const PackageBonus = styled.div`
  font-size: 12px;
  font-family: inherit;
  opacity: 0.8;
`;

const PurchaseButton = styled.button`
  background: #e46262;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s ease;

  &:hover {
    background: #d45555;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const InfoSection = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const InfoTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  font-family: inherit;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.text};
`;

const InfoText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  font-family: inherit;
  color: ${({ theme }) => theme.text};
  margin-bottom: 8px;
`;

// 새로운 스타일 컴포넌트들
const TabContainer = styled.div`
  margin-top: 30px;
  margin-bottom: 100px;
`;

const TabHeader = styled.div`
  display: flex;
  background: ${({ theme }) => theme.card};
  border-radius: 15px 15px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const TabButton = styled.button`
  flex: 1;
  padding: 16px;
  border: none;
  background: ${({ active, theme }) => active ? '#e46262' : 'transparent'};
  color: ${({ active, theme }) => active ? 'white' : theme.text};
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ active, theme }) => active ? '#d45555' : 'rgba(228, 98, 98, 0.1)'};
    color: ${({ active, theme }) => active ? 'white' : theme.text};
  }
`;

const TabContent = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 0 0 15px 15px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-height: 300px;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: ${({ theme }) => theme.background};
  border-radius: 12px;
`;

const HistoryInfo = styled.div`
  flex: 1;
`;

const HistoryTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  color: ${({ theme }) => theme.text};
  margin-bottom: 4px;
`;

const HistoryDate = styled.div`
  font-size: 12px;
  font-family: inherit;
  color: ${({ theme }) => theme.subText || '#888'};
`;

const HistoryAmount = styled.div`
  font-size: 16px;
  font-weight: 700;
  font-family: inherit;
  color: ${({ type, theme }) =>
    type === 'charge' ? theme.text :
      type === 'earn' ? theme.text :
        type === 'use' ? '#e74c3c' : '#95a5a6'
  };
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.subText || '#888'};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 16px;
  font-family: inherit;
  margin-bottom: 8px;
`;

const EmptySubText = styled.div`
  font-size: 14px;
  font-family: inherit;
  opacity: 0.7;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 16px 0;
`;

const PageButton = styled.button`
  width: 44px;
  height: 44px;
  border: none;
  background: ${({ theme }) => theme.card};
  color: ${({ theme }) => theme.text};
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);

  &:hover {
    background: rgba(228, 98, 98, 0.08);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const PageInfo = styled.div`
  font-size: 14px;
  font-family: inherit;
  color: ${({ theme }) => theme.subText || '#888'};
  margin: 0 16px;
`;

const packages = [
  { id: PRODUCT_IDS.POINTS_100, points: 100, price: '1,000원', bonusPoints: 0, productId: PRODUCT_IDS.POINTS_100 },
  { id: PRODUCT_IDS.POINTS_500, points: 500, price: '5,000원', bonusPoints: 50, productId: PRODUCT_IDS.POINTS_500 },
  { id: PRODUCT_IDS.POINTS_1000, points: 1000, price: '9,900원', bonusPoints: 150, productId: PRODUCT_IDS.POINTS_1000 },
  { id: PRODUCT_IDS.POINTS_2000, points: 2000, price: '19,800원', bonusPoints: 400, productId: PRODUCT_IDS.POINTS_2000 },
];

function PointCharge({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const { t } = useTranslation();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [historyData, setHistoryData] = useState({
    charge: [],
    earn: [],
    use: [],
    all: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const [modal, setModal] = useState(false);

  const formatHistoryTitle = (item) => {
    // desc가 있으면 상세 내역을 우선 표시
    if (item.desc) {
      return item.desc;
    }
    // desc가 없으면 기본 제목 표시
    switch (item.type) {
      case 'charge':
        return t('point_history_charge_title');
      case 'earn':
        return t('point_history_earn_title');
      case 'use':
        return t('point_history_use_title');
      default:
        return t('no_data');
    }
  };

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

  // 포인트 히스토리 조회
  useEffect(() => {
    if (user?.uid) {
      const fetchHistory = async () => {
        try {
          const historyRef = collection(db, 'users', user.uid, 'pointHistory');
          const q = query(historyRef, orderBy('createdAt', 'desc'), limit(50));
          const querySnapshot = await getDocs(q);

          const allHistory = querySnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }))
            .filter(item => item.type !== 'gift'); // 선물 내역 제외

          const categorized = {
            charge: allHistory.filter(item => item.type === 'charge'),
            earn: allHistory.filter(item => item.type === 'earn'),
            use: allHistory.filter(item => item.type === 'use'),
            all: allHistory
          };

          setHistoryData(categorized);
        } catch (error) {
          console.error('히스토리 조회 실패:', error);
        }
      };
      fetchHistory();
    }
  }, [user]);

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast.showToast(t('point_charge_select_package'), 'error');
      return;
    }
    setModal(true);
  };

  // 실제 구매 로직 분리
  const doPurchase = async () => {
    setIsLoading(true);
    try {
      const packageData = packages.find(p => p.id === selectedPackage);
      
      // 인앱 결제 시도
      if (inAppPurchaseService.isAvailable) {
        try {
          const purchase = await inAppPurchaseService.purchaseProduct(packageData.productId);
          if (purchase) {
            // 인앱 결제 성공 시 포인트 지급
            const bonusPoints = packageData.bonusPoints || 0;
            const totalPoints = packageData.points + bonusPoints;
            
            await updateDoc(doc(db, 'users', user.uid), {
              point: increment(totalPoints)
            });
            
            await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
              type: 'charge',
              amount: totalPoints,
              desc: `인앱 결제 - ${packageData.points}p + ${bonusPoints}p 보너스`,
              purchaseToken: purchase.purchaseToken,
              createdAt: new Date()
            });
            
            setCurrentPoints(prev => prev + totalPoints);
            toast.showToast(t('point_charge_success', { amount: totalPoints }), 'success');
            setSelectedPackage(null);
            return;
          }
        } catch (error) {
          console.error('인앱 결제 실패:', error);
          toast.showToast(t('point_charge_inapp_failed'), 'error');
        }
      }
      
      // 인앱 결제가 불가능하거나 실패한 경우 기존 로직 사용 (테스트용)
      const bonusPoints = packageData.bonusPoints || 0;
      const totalPoints = packageData.points + bonusPoints;
      
      await updateDoc(doc(db, 'users', user.uid), {
        point: increment(totalPoints)
      });
      
      await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
        type: 'charge',
        amount: totalPoints,
        desc: `포인트 충전 (${packageData.points}p + ${bonusPoints}p 보너스)`,
        createdAt: new Date()
      });
      
      setCurrentPoints(prev => prev + totalPoints);
      toast.showToast(t('point_charge_success', { amount: totalPoints }), 'success');
      setSelectedPackage(null);
      
    } catch (error) {
      console.error('포인트 충전 실패:', error);
      toast.showToast(t('point_charge_failed'), 'error');
    } finally {
      setIsLoading(false);
      setModal(false);
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };



  const renderHistoryList = (historyList) => {
    if (historyList.length === 0) {
      return (
        <EmptyState theme={theme}>
          <EmptyIcon>📊</EmptyIcon>
          <EmptyText>{t('no_history')}</EmptyText>
          <EmptySubText>
            {activeTab === 'charge' && t('no_point_charge_history')}
            {activeTab === 'earn' && t('no_point_earn_history')}
            {activeTab === 'use' && t('no_point_use_history')}
            {activeTab === 'all' && t('no_point_history')}
          </EmptySubText>
        </EmptyState>
      );
    }

    // 페이징 계산
    const totalPages = Math.ceil(historyList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = historyList.slice(startIndex, endIndex);

    return (
      <>
        <HistoryList>
          {currentItems.map((item) => (
            <HistoryItem key={item.id} theme={theme} type={item.type}>
              <HistoryInfo theme={theme}>
                <HistoryTitle theme={theme}>
                  {formatHistoryTitle(item)}
                </HistoryTitle>
                <HistoryDate theme={theme}>{formatDate(item.createdAt)}</HistoryDate>
              </HistoryInfo>
              <HistoryAmount type={item.type} theme={theme}>
                {item.type === 'use' ? '-' : '+'}
                {Math.abs(item.amount)}p
              </HistoryAmount>
            </HistoryItem>
          ))}
        </HistoryList>

        {/* 페이징 컨트롤 */}
        {totalPages > 1 && (
          <PaginationContainer theme={theme}>
            <PageButton
              theme={theme}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </PageButton>

            <PageInfo theme={theme}>
              {currentPage} / {totalPages}
            </PageInfo>

            <PageButton
              theme={theme}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </PageButton>
          </PaginationContainer>
        )}
      </>
    );
  };

  return (
    <Container theme={theme}>
      <Header user={user} title={t('point_charge')} />

      <PointDisplay theme={theme}>
        <PointAmount>
          <PointIcon width={32} height={32} color="#3498f3" />
          {currentPoints.toLocaleString()}p
        </PointAmount>
        <PointLabel theme={theme}>{t('current_points')}</PointLabel>
      </PointDisplay>

      <InfoSection theme={theme}>
        <InfoTitle theme={theme}>{t('point_usage_guide')}</InfoTitle>
        <InfoText theme={theme}>{t('point_usage_guide_item1')}</InfoText>
        <InfoText theme={theme}>{t('point_usage_guide_item2')}</InfoText>
        <InfoText theme={theme}>{t('point_usage_guide_item3')}</InfoText>
        <InfoText theme={theme}>{t('point_usage_guide_item4')}</InfoText>
      </InfoSection>

      <PackageGrid>
        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            selected={selectedPackage === pkg.id}
            onClick={() => setSelectedPackage(pkg.id)}
            theme={theme}
          >
            <PackagePoints>{pkg.points}p</PackagePoints>
            <PackagePrice>{pkg.price}</PackagePrice>
            {pkg.bonusPoints > 0 && (
              <PackageBonus>
                {t('point_charge_bonus', { bonus: pkg.bonusPoints })}
              </PackageBonus>
            )}
          </PackageCard>
        ))}
      </PackageGrid>

      <PurchaseButton
        onClick={handlePurchase}
        disabled={!selectedPackage || isLoading}
      >
        {isLoading ? t('point_charging') : t('point_charge_do')}
      </PurchaseButton>

      {/* 포인트 충전 확인 모달 */}
      <ConfirmModal
        open={modal}
        title={t('point_charge')}
        description={
          selectedPackage
            ? t('point_charge_confirm_desc', {
                points: packages.find(p => p.id === selectedPackage)?.points || '',
              })
            : ''
        }
        onCancel={() => setModal(false)}
        onConfirm={doPurchase}
        confirmText={t('point_charge_do')}
      />

      {/* 포인트 내역 탭 */}
      <TabContainer>
        <TabHeader theme={theme}>
          <TabButton
            active={activeTab === 'all'}
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            theme={theme}
          >
            {t('tab_all')}
          </TabButton>
          <TabButton
            active={activeTab === 'use'}
            onClick={() => {
              setActiveTab('use');
              setCurrentPage(1);
            }}
            theme={theme}
          >
            {t('tab_use')}
          </TabButton>
          <TabButton
            active={activeTab === 'earn'}
            onClick={() => {
              setActiveTab('earn');
              setCurrentPage(1);
            }}
            theme={theme}
          >
            {t('tab_earn')}
          </TabButton>
          <TabButton
            active={activeTab === 'charge'}
            onClick={() => {
              setActiveTab('charge');
              setCurrentPage(1);
            }}
            theme={theme}
          >
            {t('tab_charge')}
          </TabButton>
        </TabHeader>
        <TabContent theme={theme}>
          {renderHistoryList(historyData[activeTab])}
        </TabContent>
      </TabContainer>

      <Navigation />
    </Container>
  );
}

export default PointCharge; 