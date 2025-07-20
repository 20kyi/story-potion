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

const PackageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 30px;
`;

const PackageCard = styled.div`
  background: ${({ theme, selected }) => selected ? '#3498f3' : theme.card};
  color: ${({ selected }) => selected ? 'white' : 'inherit'};
  border: 2px solid ${({ selected }) => selected ? '#3498f3' : '#e0e0e0'};
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
  margin-bottom: 8px;
`;

const PackagePrice = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const PackageBonus = styled.div`
  font-size: 12px;
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
  margin-bottom: 12px;
  color: ${({ theme }) => theme.text};
`;

const InfoText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.subText || '#666'};
  margin-bottom: 8px;
`;

const packages = [
  { id: 1, points: 100, price: '1,000원', bonus: '' },
  { id: 2, points: 300, price: '2,500원', bonus: '+50 보너스' },
  { id: 3, points: 500, price: '4,000원', bonus: '+100 보너스' },
  { id: 4, points: 1000, price: '7,000원', bonus: '+250 보너스' },
];

function PointCharge({ user }) {
    const navigate = useNavigate();
    const toast = useToast();
    const theme = useTheme();
    const [currentPoints, setCurrentPoints] = useState(0);
    const [selectedPackage, setSelectedPackage] = useState(null);
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

    const handlePurchase = async () => {
        if (!selectedPackage) {
            toast.showToast('포인트 패키지를 선택해주세요.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            // 실제 결제 로직은 여기에 구현
            // 현재는 시뮬레이션으로 포인트만 추가
            const packageData = packages.find(p => p.id === selectedPackage);
            const bonusPoints = packageData.bonus.includes('+') ? 
                parseInt(packageData.bonus.match(/\d+/)[0]) : 0;
            const totalPoints = packageData.points + bonusPoints;

            // 포인트 추가
            await updateDoc(doc(db, 'users', user.uid), {
                point: increment(totalPoints)
            });

            // 포인트 히스토리 기록
            await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                type: 'charge',
                amount: totalPoints,
                desc: `포인트 충전 (${packageData.points}p + ${bonusPoints}p 보너스)`,
                createdAt: new Date()
            });

            // 현재 포인트 업데이트
            setCurrentPoints(prev => prev + totalPoints);
            
            toast.showToast(`${totalPoints}포인트가 충전되었습니다!`, 'success');
            setSelectedPackage(null);
        } catch (error) {
            console.error('포인트 충전 실패:', error);
            toast.showToast('포인트 충전에 실패했습니다.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container theme={theme}>
            <Header user={user} title="포인트 충전" />
            
            <PointDisplay theme={theme}>
                <PointAmount>
                    <PointIcon width={32} height={32} color="#3498f3" />
                    {currentPoints.toLocaleString()}p
                </PointAmount>
                <PointLabel theme={theme}>현재 보유 포인트</PointLabel>
            </PointDisplay>

            <InfoSection theme={theme}>
                <InfoTitle theme={theme}>포인트 사용법</InfoTitle>
                <InfoText theme={theme}>
                    • 포인트는 일기 작성, 소설 생성, 충전 등 다양한 활동에서 적립/사용/충전됩니다
                </InfoText>
                <InfoText theme={theme}>
                    • 소설 생성 시 포션 1개당 50포인트가 차감됩니다
                </InfoText>
                <InfoText theme={theme}>
                    • 포인트는 소설 생성에만 사용됩니다
                </InfoText>
            </InfoSection>

            <PackageGrid>
                {packages.map((pkg) => (
                    <PackageCard
                        key={pkg.id}
                        theme={theme}
                        selected={selectedPackage === pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                    >
                        <PackagePoints>{pkg.points}p</PackagePoints>
                        <PackagePrice>{pkg.price}</PackagePrice>
                        {pkg.bonus && <PackageBonus>{pkg.bonus}</PackageBonus>}
                    </PackageCard>
                ))}
            </PackageGrid>

            <PurchaseButton
                onClick={handlePurchase}
                disabled={!selectedPackage || isLoading}
            >
                {isLoading ? '충전 중...' : '포인트 충전하기'}
            </PurchaseButton>

            <Navigation />
        </Container>
    );
}

export default PointCharge; 