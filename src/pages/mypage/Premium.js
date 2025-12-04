import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { useToast } from '../../components/ui/ToastProvider';
import styled from 'styled-components';
import { useTheme } from '../../ThemeContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useLanguage } from '../../LanguageContext';
import { auth } from '../../firebase';
import { inAppPurchaseService, PRODUCT_IDS } from '../../utils/inAppPurchase';

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

const PremiumSection = styled.div`
  background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.card;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border: ${({ $isGlassTheme, $isDiaryTheme, theme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return 'none';
  }};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '24px' : '15px'};
  padding: 20px;
  box-shadow: ${({ $isGlassTheme, $isDiaryTheme, theme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)';
    return '0 2px 8px rgba(0,0,0,0.1)';
  }};
  margin-bottom: 20px;
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
  background: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.8)';
    return 'linear-gradient(135deg, #e46262, #cb6565)';
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  color: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return '#000000';
    return 'white';
  }};
  border: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid #8B6F47';
    return 'none';
  }};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '12px' : '25px'};
  padding: 16px 32px;
  font-size: 18px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 2px 8px rgba(139, 111, 71, 0.3)';
    return '0 4px 12px rgba(228, 98, 98, 0.3)';
  }};

  &:hover {
    transform: translateY(-2px);
    background: ${({ $isGlassTheme, $isDiaryTheme }) => {
      if ($isGlassTheme) return 'rgba(255, 255, 255, 0.3)';
      if ($isDiaryTheme) return 'rgba(139, 111, 71, 0.9)';
      return 'linear-gradient(135deg, #e46262, #cb6565)';
    }};
    box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
      if ($isGlassTheme) return '0 6px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
      if ($isDiaryTheme) return '0 4px 12px rgba(139, 111, 71, 0.4)';
      return '0 6px 16px rgba(228, 98, 98, 0.4)';
    }};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PremiumCard = styled.div`
  flex: 1;
  background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.card;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '24px' : '14px'};
  box-shadow: ${({ $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.08)';
    return '0 2px 8px rgba(0,0,0,0.08)';
  }};
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1.5px solid rgba(139, 111, 71, 0.3)';
    return `1.5px solid ${theme.border || '#e0e0e0'}`;
  }};
  margin: 0;
  height: 220px;
  text-align: center;
`;

const YearlyPremiumCard = styled(PremiumCard)`
  box-shadow: ${({ $isGlassTheme }) => $isGlassTheme 
    ? '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(255,195,0,0.2)'
    : '0 4px 16px rgba(255,195,0,0.13)'};
  border: ${({ $isGlassTheme }) => $isGlassTheme ? '2px solid rgba(255, 195, 0, 0.8)' : '2.5px solid #FFC300'};
  position: relative;
`;

const SubscriptionSection = styled.div`
  background: ${({ theme, $isGlassTheme, $isDiaryTheme }) => {
    if ($isGlassTheme) return 'rgba(255, 255, 255, 0.2)';
    if ($isDiaryTheme) return '#fffef9';
    return theme.card;
  }};
  backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  -webkit-backdrop-filter: ${({ $isGlassTheme }) => $isGlassTheme ? 'blur(15px)' : 'none'};
  border: ${({ $isGlassTheme, $isDiaryTheme, theme }) => {
    if ($isGlassTheme) return '2px solid rgba(255, 255, 255, 0.5)';
    if ($isDiaryTheme) return '1px solid rgba(139, 111, 71, 0.2)';
    return 'none';
  }};
  border-radius: ${({ $isGlassTheme }) => $isGlassTheme ? '24px' : '15px'};
  padding: 20px;
  box-shadow: ${({ $isGlassTheme, $isDiaryTheme, theme }) => {
    if ($isGlassTheme) return '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
    if ($isDiaryTheme) return '0 2px 8px rgba(0, 0, 0, 0.08)';
    return '0 2px 8px rgba(0,0,0,0.1)';
  }};
  margin-bottom: 20px;
`;

const SubscriptionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SubscriptionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const SubscriptionStatus = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SubscriptionDetail = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.subText || '#888'};
  line-height: 1.5;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  color: #e46262;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;

  &:hover {
    background: rgba(228, 98, 98, 0.1);
    color: #e46262;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const premiumFeatures = [
  { id: 'photo-upload', titleKey: 'premium_feature_photo_upload_title', descKey: 'premium_feature_photo_upload_desc' },
  { id: 'premium-sticker', titleKey: 'premium_feature_sticker_title', descKey: 'premium_feature_sticker_desc' },
  {
    id: 'free-potion-on-weekly-novel',
    titleKey: 'premium_feature_free_potion_title',
    descKey: 'premium_feature_free_potion_desc',
  },
  { id: 'ai-diary', titleKey: 'premium_feature_ai_diary_title', descKey: 'premium_feature_ai_diary_desc' },
  { id: 'premium-theme', titleKey: 'premium_feature_theme_title', descKey: 'premium_feature_theme_desc' },
];

function Premium({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const { actualTheme } = useTheme();
  const isGlassTheme = actualTheme === 'glass';
  const isDiaryTheme = actualTheme === 'diary';
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState({
    isMonthlyPremium: false,
    isYearlyPremium: false,
    premiumType: null
  });
  const [modal, setModal] = useState({ open: false, type: null });

  // 프리미엄 상태 조회 및 Google Play 동기화
  useEffect(() => {
    if (user?.uid) {
      // 네이티브 플랫폼에서 구독 상태 동기화
      const syncStatus = async () => {
        try {
          await inAppPurchaseService.syncSubscriptionStatus(user.uid);
        } catch (error) {
          console.error('구독 상태 동기화 실패:', error);
        }
      };
      syncStatus();

      // Firebase에서 실시간으로 구독 상태 확인 (네이티브 앱에서 동기화한 결과 반영)
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPremiumStatus({
            isMonthlyPremium: data.isMonthlyPremium || false,
            isYearlyPremium: data.isYearlyPremium || false,
            premiumType: data.premiumType || null
          });
        }
      }, (error) => {
        console.error('프리미엄 상태 실시간 조회 실패:', error);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  const handleMonthlyPremium = async () => {
    if (premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) {
      toast.showToast(t('premium_already_member'), 'error');
      return;
    }
    setModal({ open: true, type: 'monthly' });
  };

  const handleYearlyPremium = async () => {
    if (premiumStatus.isYearlyPremium) {
      toast.showToast(t('premium_already_yearly'), 'error');
      return;
    }
    setModal({ open: true, type: 'yearly' });
  };

  // 실제 결제 로직 분리
  const doMonthlyPremium = async () => {
    setIsLoading(true);
    try {
      console.log('[구독] doMonthlyPremium 시작', {
        productId: PRODUCT_IDS.MONTHLY_PREMIUM,
        isAvailable: inAppPurchaseService.isAvailable
      });

      // 인앱 결제 시도
      if (inAppPurchaseService.isAvailable) {
        console.log('[구독] 인앱 결제 가능, purchaseProduct 호출');
        try {
          const purchase = await inAppPurchaseService.purchaseProduct(
            PRODUCT_IDS.MONTHLY_PREMIUM,
            'subs'
          );
          console.log('[구독] purchaseProduct 결과', { purchase, hasPurchase: !!purchase });

          if (purchase) {
            console.log('[구독] 인앱 결제 성공 - Google Play Store 상태 확인 후 프리미엄 활성화');
            // 구매 성공 후 Google Play Store 상태를 확인하여 프리미엄 활성화
            // 앱에서 직접 프리미엄 상태를 설정하지 않고, syncSubscriptionStatus에서만 설정
            try {
              // Google Play Store 상태 동기화 (구매 직후 반영 지연을 고려하여 재시도)
              let retryCount = 0;
              const maxRetries = 3;
              let syncSuccess = false;

              while (retryCount < maxRetries && !syncSuccess) {
                if (retryCount > 0) {
                  // 재시도 전 대기 (1초, 2초)
                  await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                }

                await inAppPurchaseService.syncSubscriptionStatus(user.uid);

                // 동기화 후 상태 확인
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                  const data = userDoc.data();
                  if (data.isMonthlyPremium && data.premiumType === 'monthly') {
                    // 가입 직후 무료권이 6개가 아니면 강제로 6개로 설정
                    if (data.premiumFreeNovelCount !== 6) {
                      console.log('[구독] 가입 직후 무료권 개수 확인 및 수정', {
                        currentCount: data.premiumFreeNovelCount,
                        expectedCount: 6
                      });
                      const now = new Date();
                      const nextFreeNovelChargeDate = new Date(now);
                      nextFreeNovelChargeDate.setMonth(nextFreeNovelChargeDate.getMonth() + 1);
                      nextFreeNovelChargeDate.setHours(0, 0, 0, 0);

                      await updateDoc(doc(db, 'users', user.uid), {
                        premiumFreeNovelCount: 6,
                        premiumFreeNovelNextChargeDate: Timestamp.fromDate(nextFreeNovelChargeDate),
                        updatedAt: Timestamp.now()
                      });
                    }
                    syncSuccess = true;
                    console.log('[구독] 월간 프리미엄 가입 완료 - Google Play Store 상태 확인됨');
                  }
                }

                if (!syncSuccess) {
                  retryCount++;
                  console.log(`[구독] 구독 상태 동기화 재시도 ${retryCount}/${maxRetries}`);
                }
              }

              if (syncSuccess) {
                toast.showToast(t('premium_monthly_success'), 'success');
              } else {
                toast.showToast('구독이 완료되었습니다. 잠시 후 앱을 재시작하면 프리미엄 상태가 반영됩니다.', 'warning');
              }
            } catch (syncError) {
              console.error('[구독] 구독 상태 동기화 실패:', syncError);
              toast.showToast('구독이 완료되었지만 상태 확인에 실패했습니다. 잠시 후 다시 확인해주세요.', 'warning');
            }
            return;
          } else {
            console.warn('[구독] purchase가 null - 인앱 결제 창이 표시되지 않았거나 사용자가 취소함');
            toast.showToast('인앱 결제가 완료되지 않았습니다. 다시 시도해주세요.', 'error');
            return;
          }
        } catch (error) {
          console.error('[구독] 인앱 결제 실패:', error);
          console.error('[구독] 에러 상세:', {
            message: error.message,
            stack: error.stack,
            productId: PRODUCT_IDS.MONTHLY_PREMIUM
          });
          toast.showToast('인앱 결제에 실패했습니다. 다시 시도해주세요.', 'error');
          return; // 에러 발생 시 테스트 로직으로 넘어가지 않음
        }
      } else {
        console.warn('[구독] 인앱 결제 불가능 - 네이티브 플랫폼이 아님');
        toast.showToast('인앱 결제는 앱에서만 사용 가능합니다.', 'error');
        return;
      }
    } catch (error) {
      console.error('[구독] 월간 프리미엄 가입 실패:', error);
      console.error('[구독] 에러 상세:', {
        message: error.message,
        stack: error.stack
      });
      toast.showToast(t('premium_monthly_failed'), 'error');
    } finally {
      setIsLoading(false);
      setModal({ open: false, type: null });
    }
  };

  const doYearlyPremium = async () => {
    setIsLoading(true);

    console.log('[구독] doYearlyPremium 시작', {
      productId: PRODUCT_IDS.YEARLY_PREMIUM,
      isAvailable: inAppPurchaseService.isAvailable,
      isMonthlyPremium: premiumStatus.isMonthlyPremium
    });

    try {
      // 인앱 결제 시도
      if (inAppPurchaseService.isAvailable) {
        console.log('[구독] 인앱 결제 가능, purchaseProduct 호출');
        try {
          const purchase = await inAppPurchaseService.purchaseProduct(
            PRODUCT_IDS.YEARLY_PREMIUM,
            'subs'
          );
          console.log('[구독] purchaseProduct 결과', { purchase, hasPurchase: !!purchase });

          if (purchase) {
            console.log('[구독] 인앱 결제 성공 - Google Play Store 상태 확인 후 프리미엄 활성화');
            // 구매 성공 후 Google Play Store 상태를 확인하여 프리미엄 활성화
            // 앱에서 직접 프리미엄 상태를 설정하지 않고, syncSubscriptionStatus에서만 설정
            try {
              // Google Play Store 상태 동기화 (구매 직후 반영 지연을 고려하여 재시도)
              let retryCount = 0;
              const maxRetries = 3;
              let syncSuccess = false;

              while (retryCount < maxRetries && !syncSuccess) {
                if (retryCount > 0) {
                  // 재시도 전 대기 (1초, 2초)
                  await new Promise(resolve => setTimeout(resolve, retryCount * 1000));
                }

                await inAppPurchaseService.syncSubscriptionStatus(user.uid);

                // 동기화 후 상태 확인
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                  const data = userDoc.data();
                  if (data.isYearlyPremium && data.premiumType === 'yearly') {
                    // 가입 직후 무료권이 6개가 아니면 강제로 6개로 설정
                    if (data.premiumFreeNovelCount !== 6) {
                      console.log('[구독] 가입 직후 무료권 개수 확인 및 수정', {
                        currentCount: data.premiumFreeNovelCount,
                        expectedCount: 6
                      });
                      const now = new Date();
                      const nextFreeNovelChargeDate = new Date(now);
                      nextFreeNovelChargeDate.setMonth(nextFreeNovelChargeDate.getMonth() + 1);
                      nextFreeNovelChargeDate.setHours(0, 0, 0, 0);

                      await updateDoc(doc(db, 'users', user.uid), {
                        premiumFreeNovelCount: 6,
                        premiumFreeNovelNextChargeDate: Timestamp.fromDate(nextFreeNovelChargeDate),
                        updatedAt: Timestamp.now()
                      });
                    }
                    syncSuccess = true;
                    console.log('[구독] 연간 프리미엄 가입 완료 - Google Play Store 상태 확인됨');
                  }
                }

                if (!syncSuccess) {
                  retryCount++;
                  console.log(`[구독] 구독 상태 동기화 재시도 ${retryCount}/${maxRetries}`);
                }
              }

              if (syncSuccess) {
                toast.showToast(t('premium_yearly_success'), 'success');
              } else {
                toast.showToast('구독이 완료되었습니다. 잠시 후 앱을 재시작하면 프리미엄 상태가 반영됩니다.', 'warning');
              }
            } catch (syncError) {
              console.error('[구독] 구독 상태 동기화 실패:', syncError);
              toast.showToast('구독이 완료되었지만 상태 확인에 실패했습니다. 잠시 후 다시 확인해주세요.', 'warning');
            }
            return;
          } else {
            console.warn('[구독] purchase가 null - 인앱 결제 창이 표시되지 않았거나 사용자가 취소함');
            toast.showToast('인앱 결제가 완료되지 않았습니다. 다시 시도해주세요.', 'error');
            return;
          }
        } catch (error) {
          console.error('[구독] 인앱 결제 실패:', error);
          console.error('[구독] 에러 상세:', {
            message: error.message,
            stack: error.stack,
            productId: PRODUCT_IDS.YEARLY_PREMIUM
          });
          toast.showToast('인앱 결제에 실패했습니다. 다시 시도해주세요.', 'error');
          return; // 에러 발생 시 테스트 로직으로 넘어가지 않음
        }
      } else {
        console.warn('[구독] 인앱 결제 불가능 - 네이티브 플랫폼이 아님');
        toast.showToast('인앱 결제는 앱에서만 사용 가능합니다.', 'error');
        return;
      }
    } catch (error) {
      console.error('[구독] 연간 프리미엄 가입 실패:', error);
      console.error('[구독] 에러 상세:', {
        message: error.message,
        stack: error.stack
      });
      toast.showToast(t('premium_yearly_failed'), 'error');
    } finally {
      setIsLoading(false);
      setModal({ open: false, type: null });
    }
  };

  // 프리미엄 해지 확인 모달 표시
  const handleCancelPremium = () => {
    setModal({ open: true, type: 'cancel' });
  };

  // 프리미엄 해지 확인 후 Google Play Store로 이동
  const doCancelPremium = async () => {
    try {
      console.log('[구독] 구독 해지 - Google Play Store 열기');

      // Google Play Store의 구독 관리 페이지 열기
      const opened = await inAppPurchaseService.openSubscriptionManagement();

      if (!opened) {
        console.warn('[구독] Google Play Store 열기 실패');
        toast.showToast('Google Play Store를 열 수 없습니다. 직접 Google Play Store에서 구독을 관리해주세요.', 'error');
      }
    } catch (error) {
      console.error('[구독] 프리미엄 해지 실패:', error);
      toast.showToast('구독 관리 페이지를 열 수 없습니다.', 'error');
    } finally {
      setModal({ open: false, type: null });
    }
  };

  // 페이지 포커스 시 네이티브 플랫폼에서 구독 상태 동기화
  useEffect(() => {
    const handleFocus = () => {
      if (user?.uid) {
        // 네이티브 플랫폼에서만 구독 상태 동기화 (웹에서는 Firebase 실시간 업데이트로 반영됨)
        inAppPurchaseService.syncSubscriptionStatus(user.uid).catch(error => {
          console.error('구독 상태 동기화 실패:', error);
        });
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  return (
    <Container theme={theme}>
      <Header user={user} title={language === 'en' ? 'PREMIUM' : '프리미엄'} />

      {/* 구독 관리 섹션 - 프리미엄 회원에게만 표시 */}
      {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) && (
        <SubscriptionSection theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} style={{ marginTop: '0' }}>
          <SubscriptionTitle theme={theme}>
            {t('subscription_manage') || '구독 관리'}
          </SubscriptionTitle>
          <SubscriptionInfo>
            <SubscriptionStatus theme={theme}>
              {premiumStatus.isMonthlyPremium && `💎 ${t('premium_monthly')}`}
              {premiumStatus.isYearlyPremium && `👑 ${t('premium_yearly')}`}
            </SubscriptionStatus>
          </SubscriptionInfo>

        </SubscriptionSection>
      )}

      {/* 프리미엄 결제 비교 카드 UI */}
      {!premiumStatus.isYearlyPremium && (
        <div style={{
          display: 'flex',
          gap: '6px',
          margin: '0 0 24px 0',
          flexWrap: 'nowrap',
          justifyContent: 'center',
          alignItems: 'stretch'
        }}>
          {/* 월간 결제 카드 - 프리미엄이 아닌 사용자에게만 표시 */}
          {!premiumStatus.isMonthlyPremium && (
            <PremiumCard theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
              <div
                style={{
                  color: '#e46262',
                  fontWeight: 700,
                  fontSize: 12,
                  marginBottom: 6,
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              >
                {t('premium_monthly')}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    marginBottom: 2,
                    textAlign: 'center',
                    fontFamily: 'inherit',
                  }}
                >
                  {t('premium_monthly_price')}
                </div>
                <div
                  style={{
                    color: '#888',
                    fontSize: 12,
                    marginBottom: 10,
                    textAlign: 'center',
                    marginTop: 10,
                    fontFamily: 'inherit',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {t('premium_monthly_desc')}
                </div>
              </div>
              <PremiumButton
                $isGlassTheme={isGlassTheme}
                $isDiaryTheme={isDiaryTheme}
                style={{ width: '100%', fontSize: 13, marginTop: 6, padding: '10px 0' }}
                onClick={handleMonthlyPremium}
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '구독하기'}
              </PremiumButton>
            </PremiumCard>
          )}

          {/* 연간 결제 카드 - 월간 프리미엄 회원도 연간으로 전환 가능 */}
          <YearlyPremiumCard theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme}>
            <div
              style={{
                position: 'absolute',
                top: -14,
                left: 12,
                background: 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 11,
                borderRadius: 7,
                padding: '3px 12px',
                boxShadow: '0 2px 8px rgba(255,195,0,0.13)',
                letterSpacing: 1,
                fontFamily: 'inherit',
              }}
            >
              {t('premium_recommended')}
            </div>
            <div
              style={{
                color: '#FF9800',
                fontWeight: 800,
                fontSize: 13,
                marginBottom: 6,
                textAlign: 'center',
                zIndex: 1,
                fontFamily: 'inherit',
              }}
            >
              {t('premium_yearly')}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  marginBottom: 12,
                  textAlign: 'center',
                  color: '#FF6F00',
                  fontFamily: 'inherit',
                }}
              >
                {t('premium_yearly_price')}
              </div>
              <div
                style={{
                  color: '#FF9800',
                  fontWeight: 700,
                  fontSize: 12,
                  marginBottom: 1,
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              >
                {t('premium_yearly_discount')}
              </div>
              <div
                style={{
                  color: '#FFB300',
                  fontSize: 11,
                  marginBottom: 1,
                  textDecoration: 'line-through',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              >
                {t('premium_yearly_original_price')}
              </div>
              <div
                style={{
                  color: '#FF9800',
                  fontSize: 13,
                  marginBottom: 10,
                  textAlign: 'center',
                  fontFamily: 'inherit',
                }}
              >
                {t('premium_yearly_monthly_equiv')}
              </div>
            </div>
            <PremiumButton
              $isGlassTheme={isGlassTheme}
              $isDiaryTheme={isDiaryTheme}
              style={{ 
                width: '100%', 
                fontSize: 13, 
                background: isGlassTheme ? 'rgba(255, 255, 255, 0.2)' : (isDiaryTheme ? 'rgba(139, 111, 71, 0.8)' : 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)'), 
                color: isGlassTheme ? '#000000' : '#fff', 
                fontWeight: 700, 
                padding: '10px 0', 
                boxShadow: isGlassTheme ? '0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(255,195,0,0.2)' : '0 4px 12px rgba(255,195,0,0.18)',
                border: isGlassTheme ? '2px solid rgba(255, 195, 0, 0.8)' : 'none'
              }}
              onClick={handleYearlyPremium}
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '구독하기'}
            </PremiumButton>
          </YearlyPremiumCard>
        </div>
      )}

      {/* 프리미엄 기능 섹션 - 모든 사용자에게 표시 (결제 카드 아래로 이동) */}
      <PremiumSection theme={theme} $isGlassTheme={isGlassTheme} $isDiaryTheme={isDiaryTheme} style={{ marginTop: '0', marginBottom: '24px' }}>
        <PremiumTitle theme={theme}>
          <span style={{ color: '#e46262' }}>👑</span>
          {t('premium_benefits')}
        </PremiumTitle>
        <FeatureList>
          {premiumFeatures.map((feature) => (
            <FeatureItem key={feature.id} theme={theme}>
              {t(feature.titleKey)}
            </FeatureItem>
          ))}
        </FeatureList>
      </PremiumSection>

      {/* 해지하기 버튼 - 페이지 맨 아래 (정상 구독 상태일 때만) */}
      {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) && (
        <div style={{ marginTop: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <SubscriptionDetail theme={theme} style={{ marginBottom: '12px', fontSize: '14px' }}>
            Google Play Store에서 구독을 관리하실 수 있습니다.
          </SubscriptionDetail>
          <CancelButton
            onClick={handleCancelPremium}
          >
            {t('premium_cancel_button') || '구독 관리'}
          </CancelButton>
        </div>
      )}

      {/* 프리미엄 가입 확인 모달 */}
      <ConfirmModal
        open={modal.open && (modal.type === 'monthly' || modal.type === 'yearly')}
        title={
          modal.type === 'monthly'
            ? t('premium_monthly_modal_title')
            : modal.type === 'yearly'
              ? t('premium_yearly_modal_title')
              : ''
        }
        description={
          modal.type === 'monthly'
            ? t('premium_monthly_modal_desc')
            : modal.type === 'yearly'
              ? t('premium_yearly_modal_desc')
              : ''
        }
        onCancel={() => setModal({ open: false, type: null })}
        onConfirm={() => {
          if (modal.type === 'monthly') doMonthlyPremium();
          else if (modal.type === 'yearly') doYearlyPremium();
        }}
        confirmText={t('premium_subscribe_confirm_button')}
      />

      {/* 프리미엄 해지 확인 모달 */}
      <ConfirmModal
        open={modal.open && modal.type === 'cancel'}
        title="구독 해지 안내"
        description="구독을 해지하시면 프리미엄 무료 소설 생성권이 모두 사라집니다. 정말 해지하시겠습니까?"
        onCancel={() => setModal({ open: false, type: null })}
        onConfirm={doCancelPremium}
        confirmText="해지하기"
        cancelText="취소"
      />


      <Navigation />
    </Container>
  );
}

export default Premium;

