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
import ConfirmModal from '../../components/ui/ConfirmModal';
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
  max-width: 600px;
  background: transparent;
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
  gap: 12px;
  margin-bottom: 20px;
`;

const PotionCard = styled(motion.div)`
  background: ${({ theme }) => theme.card};
  border-radius: 13px;
  padding: 12px 8px 14px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  border: 1.5px solid transparent;
  ${({ isSet }) => isSet && `grid-column: span 2;`}
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.13);
  }
`;

const PotionImage = styled.img`
  width: 54px;
  height: 54px;
  object-fit: contain;
  margin: 0 auto 8px auto;
`;

const PotionName = styled.div`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: ${({ theme }) => theme.text};
`;

const PotionPrice = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #e46262;
  margin-bottom: 2px;
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
  background-color: rgba(190, 71, 71, 0.62);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 8px 0;
  font-size: 16px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s;
  box-shadow: 0 2px 8px rgba(190, 71, 71, 0.08);
  margin-top: 4px;
  &:hover, &:focus {
    background-color: rgba(190, 71, 71, 0.82);
  }
  &:disabled {
    background: #ccc;
    color: #fff;
    cursor: not-allowed;
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

// 테마 세트 정보 추가
const themeSets = [
  { id: 'lovetail', name: '러브테일 세트', price: 150, potions: ['romance', 'fairytale'], description: '사랑과 동화가 만나는 마법 같은 순간! 러브테일 세트로 설레는 이야기를 만들어보세요.' },
  { id: 'adventurer', name: '모험가 세트', price: 150, potions: ['historical', 'fantasy'], description: '과거와 상상이 교차하는 대서사시! 역사와 판타지의 모험을 떠나보세요.' },
  { id: 'mysterynight', name: '추리의 밤 세트', price: 150, potions: ['mystery', 'horror'], description: '오싹한 미스터리와 소름 돋는 공포의 콜라보! 밤에 읽으면 더 무서운 이야기 완성!' },
  { id: 'romhorror', name: '로맨스릴러 세트', price: 150, potions: ['romance', 'horror'], description: '로맨스와 스릴러의 짜릿한 만남! 설렘과 긴장감이 함께하는 로맨스릴러 스토리를 완성해보세요.' }
];

// + 아이콘: 단순 텍스트 +
const PlusIcon = () => (
  <span style={{ fontSize: 24, color: '#e46262', fontWeight: 700, margin: '0 2px', lineHeight: 1, fontFamily: 'inherit' }}>+</span>
);

function PotionShop({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const { t } = useTranslation();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [ownedPotions, setOwnedPotions] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, potionId: null });
  const [themeModal, setThemeModal] = useState({ open: false, setId: null });

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
      toast.showToast(t('friend_novel_point_not_enough'), 'error');
      return;
    }

    setModal({ open: true, potionId });
  };

  // 실제 구매 로직 분리
  const doBuyPotion = async () => {
    const potionId = modal.potionId;
    const potion = potions.find(p => p.id === potionId);
    if (!potion) return;
    setIsLoading(true);
    try {
      // 포인트 차감
      await updateDoc(doc(db, 'users', user.uid), {
        point: increment(-potion.price)
      });
      // 포션 추가
      const newPotions = { ...ownedPotions };
      if (potion.isSet) {
        ['romance', 'historical', 'mystery', 'horror', 'fairytale', 'fantasy'].forEach(type => {
          newPotions[type] = (newPotions[type] || 0) + 1;
        });
      } else {
        newPotions[potionId] = (newPotions[potionId] || 0) + 1;
      }
      await updateDoc(doc(db, 'users', user.uid), {
        potions: newPotions
      });
      await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
        type: 'use',
        amount: -potion.price,
        desc: potion.isSet ? '포션 6종 세트 구매' : `${potion.name} 구매`,
        createdAt: new Date()
      });
      setCurrentPoints(prev => prev - potion.price);
      setOwnedPotions(newPotions);
      toast.showToast(
        potion.isSet ? t('potion_set6_buy_success') : t('potion_buy_success', { name: potion.name }),
        'success'
      );
    } catch (error) {
      console.error('포션 구매 실패:', error);
      toast.showToast(t('potion_buy_failed'), 'error');
    } finally {
      setIsLoading(false);
      setModal({ open: false, potionId: null });
    }
  };

  // 테마 세트 구매 로직
  const handleBuyThemeSet = (setId) => {
    setThemeModal({ open: true, setId });
  };
  const doBuyThemeSet = async () => {
    const setId = themeModal.setId;
    const set = themeSets.find(s => s.id === setId);
    if (!set) return;
    if (currentPoints < set.price) {
      toast.showToast(t('friend_novel_point_not_enough'), 'error');
      setThemeModal({ open: false, setId: null });
      return;
    }
    setIsLoading(true);
    try {
      // 포인트 차감
      await updateDoc(doc(db, 'users', user.uid), {
        point: increment(-set.price)
      });
      // 포션 2종 지급
      const newPotions = { ...ownedPotions };
      set.potions.forEach(type => {
        newPotions[type] = (newPotions[type] || 0) + 1;
      });
      await updateDoc(doc(db, 'users', user.uid), {
        potions: newPotions
      });
      await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
        type: 'use',
        amount: -set.price,
        desc: `${set.name} 구매`,
        createdAt: new Date()
      });
      setCurrentPoints(prev => prev - set.price);
      setOwnedPotions(newPotions);
      toast.showToast(t('potion_theme_buy_success', { name: set.name }), 'success');
    } catch (error) {
      console.error('테마 세트 구매 실패:', error);
      toast.showToast(t('potion_theme_buy_failed'), 'error');
    } finally {
      setIsLoading(false);
      setThemeModal({ open: false, setId: null });
    }
  };

  return (
    <Container theme={theme}>
      <Header user={user} title={t('potion_shop')} />

      <PointDisplay theme={theme}>
        <PointAmount>
          <PointIcon width={32} height={32} color="#3498f3" />
          {currentPoints.toLocaleString()}p
        </PointAmount>
        <PointLabel theme={theme}>{t('current_points')}</PointLabel>
      </PointDisplay>

      <InfoSection theme={theme}>
        <InfoTitle theme={theme}>{t('potion_guide_title')}</InfoTitle>
        <InfoText theme={theme}>{t('potion_guide_item1')}</InfoText>
        <InfoText theme={theme}>{t('potion_guide_item2')}</InfoText>
        <InfoText theme={theme}>{t('potion_guide_item3')}</InfoText>
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
            {t('friend_novel_point_not_enough')}
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
            {t('point_history_charge_button')}
          </button>
        </div>
      )}

      <PotionGrid>
        {potions.map((potion) => (
          <PotionCard
            key={potion.id}
            isSet={potion.isSet}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleBuyPotion(potion.id)}
            style={{
              cursor: currentPoints < potion.price || isLoading ? 'not-allowed' : 'pointer',
              opacity: currentPoints < potion.price || isLoading ? 0.5 : 1,
              ...(potion.isSet ? {
                background: 'linear-gradient(90deg, #ffe0ec 60%, #e0e7ff 100%)',
                border: '2.5px solid #e462a0',
                boxShadow: '0 4px 16px rgba(228,98,160,0.13)',
              } : {})
            }}
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
            <PotionName style={potion.isSet ? { color: '#e462a0', fontWeight: 600 } : {}}>
              {potion.name}
            </PotionName>
            <PotionDescription>{potion.description}</PotionDescription>
            {potion.isSet ? (
              <div style={{ marginBottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: 15, marginRight: 4 }}>480p</span>
                  <span style={{ fontWeight: 800, fontSize: 20, color: '#e462a0' }}>400p</span>
                </div>
                <span style={{
                  background: 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: 7,
                  padding: '2px 8px',
                  marginTop: 2,
                  display: 'inline-block'
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
              {!potion.isSet && t('potion_owned_count', { count: ownedPotions[potion.id] || 0 })}
            </div>
            {/* BuyButton 제거됨 */}
          </PotionCard>
        ))}
      </PotionGrid>

      {/* 테마 세트 UI */}
      <div style={{ margin: '32px 0 16px 0' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: theme.text, fontFamily: 'inherit' }}>
          {t('potion_theme_title')}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          width: '100%',
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {themeSets.map(set => (
            <div
              key={set.id}
              onClick={() => handleBuyThemeSet(set.id)}
              style={{
                width: '100%',
                background: theme.card,
                borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                border: '2px solid #e462a0',
                padding: '18px 14px 14px 14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 180,
                transition: 'box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <img
                  src={process.env.PUBLIC_URL + `/potion/${set.potions[0]}.png`}
                  alt={set.potions[0]}
                  style={{ width: 38, height: 38, objectFit: 'contain', background: theme.card, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginRight: 2 }}
                />
                <PlusIcon />
                <img
                  src={process.env.PUBLIC_URL + `/potion/${set.potions[1]}.png`}
                  alt={set.potions[1]}
                  style={{ width: 38, height: 38, objectFit: 'contain', background: theme.card, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginLeft: 2 }}
                />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: theme.text }}>
                {set.name}
              </div>
              <div style={{ fontSize: 13, color: theme.subText || '#888', marginBottom: 8, textAlign: 'center', wordBreak: 'keep-all', whiteSpace: 'normal' }}>
                {set.description}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
                <span style={{ textDecoration: 'line-through', color: '#aaa', fontSize: 15, marginRight: 4 }}>160p</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#e46262' }}>150p</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 테마 세트 구매 확인 모달 */}
      <ConfirmModal
        open={themeModal.open}
        title={t('potion_theme_buy_title')}
        description={
          themeModal.setId
            ? t('potion_theme_buy_confirm', { name: themeSets.find(s => s.id === themeModal.setId)?.name || '' })
            : ''
        }
        onCancel={() => setThemeModal({ open: false, setId: null })}
        onConfirm={doBuyThemeSet}
        confirmText={t('potion_buy_confirm')}
      />

      {/* 포션 구매 확인 모달 */}
      <ConfirmModal
        open={modal.open}
        title={t('potion_buy_title')}
        description={
          modal.potionId
            ? t('potion_buy_confirm_desc', { name: potions.find(p => p.id === modal.potionId)?.name || '' })
            : ''
        }
        onCancel={() => setModal({ open: false, potionId: null })}
        onConfirm={doBuyPotion}
        confirmText={t('potion_buy_confirm')}
      />

      <Navigation />
    </Container>
  );
}

export default PotionShop; 