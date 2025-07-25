import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection, setDoc } from 'firebase/firestore';
import { useToast } from '../../components/ui/ToastProvider';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import PointIcon from '../../components/icons/PointIcon';
import { motion } from 'framer-motion';

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

const PotionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
`;

const PotionCard = styled(motion.div)`
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 2px solid transparent;
  
  // 6종 세트는 가로로 꽉 차게
  ${({ isSet }) => isSet && `grid-column: span 2;`}

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

const PotionImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin: 0 auto 12px auto;
`;

const PotionName = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.text};
`;

const PotionPrice = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #e46262;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const PotionDescription = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.subText || '#666'};
  margin-bottom: 12px;
`;

const BuyButton = styled.button`
  background: ${({ isSet }) => isSet ? 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)' : '#3498f3'};
  color: ${({ isSet }) => isSet ? '#fff' : 'white'};
  border: none;
  border-radius: 24px;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 8px rgba(52, 152, 243, 0.08);
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  margin-top: 6px;

  &:hover {
    background: ${({ isSet }) => isSet ? 'linear-gradient(90deg, #FF9800 60%, #FFC300 100%)' : '#2176bd'};
    color: #fff;
    box-shadow: 0 4px 16px rgba(52, 152, 243, 0.13);
  }

  &:disabled {
    background: #ccc;
    color: #fff;
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.7;
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

const potions = [
  {
    id: 'set6',
    name: '포션 6종 세트',
    price: 400,
    image: '/potion/set.png',
    description: '로맨스/역사/추리/공포/동화/판타지 포션 각 1개씩!',
    isSet: true
  },
  {
    id: 'romance',
    name: '로맨스 포션',
    price: 80,
    image: '/potion/romance.png',
    description: '달콤한 로맨스 소설을 만들어요'
  },
  {
    id: 'historical',
    name: '역사 포션',
    price: 80,
    image: '/potion/historical.png',
    description: '역사적 배경의 소설을 만들어요'
  },
  {
    id: 'mystery',
    name: '추리 포션',
    price: 80,
    image: '/potion/mystery.png',
    description: '긴장감 넘치는 추리를 만들어요'
  },
  {
    id: 'horror',
    name: '공포 포션',
    price: 80,
    image: '/potion/horror.png',
    description: '소름 끼치는 공포 소설을 만들어요'
  },
  {
    id: 'fairytale',
    name: '동화 포션',
    price: 80,
    image: '/potion/fairytale.png',
    description: '마법 같은 동화를 만들어요'
  },
  {
    id: 'fantasy',
    name: '판타지 포션',
    price: 80,
    image: '/potion/fantasy.png',
    description: '상상력 넘치는 판타지를 만들어요'
  },
];

function PotionShop({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [ownedPotions, setOwnedPotions] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 현재 포인트와 보유 포션 조회
  useEffect(() => {
    if (user?.uid) {
      const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentPoints(userData.point || 0);
            setOwnedPotions(userData.potions || {});
          }
        } catch (error) {
          console.error('사용자 데이터 조회 실패:', error);
        }
      };
      fetchUserData();
    }
  }, [user]);

  const handleBuyPotion = async (potionId) => {
    const potion = potions.find(p => p.id === potionId);
    if (!potion) return;

    if (currentPoints < potion.price) {
      toast.showToast('포인트가 부족합니다.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // 포인트 차감
      await updateDoc(doc(db, 'users', user.uid), {
        point: increment(-potion.price)
      });

      // 포션 추가
      const newPotions = { ...ownedPotions };
      if (potion.isSet) {
        // 6종 세트: 각 포션 1개씩 지급
        ['romance', 'historical', 'mystery', 'horror', 'fairytale', 'fantasy'].forEach(type => {
          newPotions[type] = (newPotions[type] || 0) + 1;
        });
      } else {
        newPotions[potionId] = (newPotions[potionId] || 0) + 1;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        potions: newPotions
      });

      // 포인트 사용 내역 기록
      await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
        type: 'use',
        amount: -potion.price,
        desc: potion.isSet ? '포션 6종 세트 구매' : `${potion.name} 구매`,
        createdAt: new Date()
      });

      // 상태 업데이트
      setCurrentPoints(prev => prev - potion.price);
      setOwnedPotions(newPotions);

      toast.showToast(potion.isSet ? '포션 6종 세트를 구매했습니다!' : `${potion.name}을 구매했습니다!`, 'success');
    } catch (error) {
      console.error('포션 구매 실패:', error);
      toast.showToast('포션 구매에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container theme={theme}>
      <Header user={user} title="포션 상점" />

      <PointDisplay theme={theme}>
        <PointAmount>
          <PointIcon width={32} height={32} color="#3498f3" />
          {currentPoints.toLocaleString()}p
        </PointAmount>
        <PointLabel theme={theme}>현재 보유 포인트</PointLabel>
      </PointDisplay>

      <InfoSection theme={theme}>
        <InfoTitle theme={theme}>포션 사용법</InfoTitle>
        <InfoText theme={theme}>
          • 포션 1개당 80포인트로 구매할 수 있습니다
        </InfoText>
        <InfoText theme={theme}>
          • 소설 생성 시 보유한 포션을 사용합니다
        </InfoText>
        <InfoText theme={theme}>
          • 포션이 없으면 해당 장르의 소설을 만들 수 없습니다
        </InfoText>
      </InfoSection>

      {/* 포인트 충전 버튼 */}
      {currentPoints < 50 && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            fontSize: '14px',
            color: '#e46262',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            포인트가 부족합니다
          </div>
          <button
            onClick={() => navigate('/my/shop/charge')}
            style={{
              background: '#e46262',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(228, 98, 98, 0.3)'
            }}
          >
            포인트 충전하기
          </button>
        </div>
      )}

      <PotionGrid>
        {potions.map((potion) => (
          <PotionCard
            key={potion.id}
            theme={theme}
            isSet={potion.isSet}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {potion.isSet ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                {['romance', 'historical', 'mystery', 'horror', 'fairytale', 'fantasy'].map((type, idx) => (
                  <img
                    key={type}
                    src={`/potion/${type}.png`}
                    alt={type}
                    style={{
                      width: 36,
                      height: 36,
                      objectFit: 'contain',
                      marginLeft: idx === 0 ? 0 : -12,
                      zIndex: idx + 1,
                      borderRadius: 8,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}
                  />
                ))}
              </div>
            ) : (
              <PotionImage src={potion.image} alt={potion.name} />
            )}
            <PotionName theme={theme}>{potion.name}</PotionName>
            <PotionDescription theme={theme}>
              {potion.description}
            </PotionDescription>
            {potion.isSet ? (
              <div style={{ marginBottom: 4 }}>
                <span style={{
                  textDecoration: 'line-through',
                  color: '#aaa',
                  fontSize: 15,
                  marginRight: 8
                }}>
                  480p
                </span>
                <span style={{
                  color: '#e46262',
                  fontWeight: 700,
                  fontSize: 20
                }}>
                  400p
                </span>
                <span style={{
                  background: 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: 7,
                  padding: '2px 8px',
                  marginLeft: 8
                }}>
                  80p 할인
                </span>
              </div>
            ) : (
              <PotionPrice>
                <PointIcon width={16} height={16} color="#e46262" />
                {potion.price}p
              </PotionPrice>
            )}
            <div style={{
              fontSize: '12px',
              color: '#3498f3',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              보유: {ownedPotions[potion.id] || 0}개
            </div>
            <BuyButton
              isSet={potion.isSet}
              onClick={() => handleBuyPotion(potion.id)}
              disabled={currentPoints < potion.price || isLoading}
            >
              {isLoading ? '구매 중...' : '구매하기'}
            </BuyButton>
          </PotionCard>
        ))}
      </PotionGrid>

      <Navigation />
    </Container>
  );
}

export default PotionShop; 