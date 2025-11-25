import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
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
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.text};
  position: relative;
`;

const PremiumSection = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

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

const SubscriptionSection = styled.div`
  background: ${({ theme }) => theme.card};
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  { id: 'ads', titleKey: 'premium_feature_ads_title', descKey: 'premium_feature_ads_desc' },
  { id: 'ai-diary', titleKey: 'premium_feature_ai_diary_title', descKey: 'premium_feature_ai_diary_desc' },
  {
    id: 'free-potion-on-weekly-novel',
    titleKey: 'premium_feature_free_potion_title',
    descKey: 'premium_feature_free_potion_desc',
  },
  { id: 'premium-sticker', titleKey: 'premium_feature_sticker_title', descKey: 'premium_feature_sticker_desc' },
  { id: 'photo-upload', titleKey: 'premium_feature_photo_upload_title', descKey: 'premium_feature_photo_upload_desc' },
];

function Premium({ user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const theme = useTheme();
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState({
    isMonthlyPremium: false,
    isYearlyPremium: false,
    premiumType: null,
    premiumRenewalDate: null,
    premiumCancelled: false
  });
  const [modal, setModal] = useState({ open: false, type: null });
  const [cancelModal, setCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // 프리미엄 상태 조회 및 Google Play 동기화
  useEffect(() => {
    if (user?.uid) {
      const fetchUser = async () => {
        try {
          // Google Play 구독 상태 동기화 (네이티브 플랫폼에서만)
          if (inAppPurchaseService.isAvailable) {
            try {
              await inAppPurchaseService.syncSubscriptionStatus(user.uid);
            } catch (error) {
              console.error('구독 상태 동기화 실패:', error);
            }
          }

          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setPremiumStatus({
              isMonthlyPremium: data.isMonthlyPremium || false,
              isYearlyPremium: data.isYearlyPremium || false,
              premiumType: data.premiumType || null,
              premiumRenewalDate: data.premiumRenewalDate || null,
              premiumCancelled: data.premiumCancelled || false
            });
          }
        } catch (error) {
          console.error('프리미엄 상태 조회 실패:', error);
        }
      };
      fetchUser();
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

  // 일주일 무료 체험 핸들러
  const handleFreeTrial = async () => {
    if (premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) {
      toast.showToast('이미 프리미엄 회원입니다.', 'error');
      return;
    }
    setModal({ open: true, type: 'trial' });
  };

  // 일주일 무료 체험 실행 함수
  const doFreeTrial = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const renewalDate = new Date(now);
      renewalDate.setDate(now.getDate() + 7); // 7일 후

      // 프리미엄 무료권 다음 충전 시점 계산 (체험 시작 시점 + 7일)
      const nextFreeNovelChargeDate = new Date(now);
      nextFreeNovelChargeDate.setDate(nextFreeNovelChargeDate.getDate() + 7);

      await updateDoc(doc(db, 'users', user.uid), {
        isMonthlyPremium: true, // 일주일 체험도 월간 프리미엄으로 처리
        isYearlyPremium: false,
        premiumType: 'trial', // 체험 타입 표시
        premiumStartDate: Timestamp.fromDate(now),
        premiumRenewalDate: Timestamp.fromDate(renewalDate),
        premiumFreeNovelNextChargeDate: Timestamp.fromDate(nextFreeNovelChargeDate),
        premiumFreeNovelCount: 1, // 체험 시작 시점에 무료권 1개 지급
        premiumCancelled: false,
        updatedAt: Timestamp.now()
      });
      toast.showToast('일주일 무료 체험이 시작되었습니다!', 'success');
      // 상태 업데이트를 위해 다시 조회
      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (updatedUserDoc.exists()) {
        const data = updatedUserDoc.data();
        setPremiumStatus({
          isMonthlyPremium: data.isMonthlyPremium || false,
          isYearlyPremium: data.isYearlyPremium || false,
          premiumType: data.premiumType || null,
          premiumRenewalDate: data.premiumRenewalDate || null
        });
      }
    } catch (error) {
      console.error('일주일 무료 체험 시작 실패:', error);
      toast.showToast('일주일 무료 체험 시작에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
      setModal({ open: false, type: null });
    }
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
            console.log('[구독] 인앱 결제 성공, 프리미엄 활성화 시작');
            // 인앱 결제 성공 시 프리미엄 활성화
            const now = new Date();
            const renewalDate = new Date(now);
            renewalDate.setMonth(now.getMonth() + 1);

            // 프리미엄 무료권 다음 충전 시점 계산 (결제 시점 + 7일)
            const nextFreeNovelChargeDate = new Date(now);
            nextFreeNovelChargeDate.setDate(nextFreeNovelChargeDate.getDate() + 7);

            await updateDoc(doc(db, 'users', user.uid), {
              isMonthlyPremium: true,
              isYearlyPremium: false,
              premiumType: 'monthly',
              premiumStartDate: Timestamp.fromDate(now),
              premiumRenewalDate: Timestamp.fromDate(renewalDate),
              premiumFreeNovelNextChargeDate: Timestamp.fromDate(nextFreeNovelChargeDate),
              premiumFreeNovelCount: 1, // 결제 시점에 무료권 1개 지급
              premiumCancelled: false,
              updatedAt: Timestamp.now()
            });
            toast.showToast(t('premium_monthly_success'), 'success');
            // 상태 업데이트를 위해 다시 조회
            const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
            if (updatedUserDoc.exists()) {
              const data = updatedUserDoc.data();
              setPremiumStatus({
                isMonthlyPremium: data.isMonthlyPremium || false,
                isYearlyPremium: data.isYearlyPremium || false,
                premiumType: data.premiumType || null,
                premiumRenewalDate: data.premiumRenewalDate || null
              });
            }
            console.log('[구독] 월간 프리미엄 가입 완료');
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
    let extraDays = 0;

    console.log('[구독] doYearlyPremium 시작', {
      productId: PRODUCT_IDS.YEARLY_PREMIUM,
      isAvailable: inAppPurchaseService.isAvailable,
      isMonthlyPremium: premiumStatus.isMonthlyPremium
    });

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
              console.log(`[구독] 월간 프리미엄 남은 기간: ${extraDays}일`);
            }
          }
        }
      } catch (error) {
        console.error('[구독] 월간 프리미엄 남은 기간 계산 실패:', error);
        // 에러가 발생해도 연간 프리미엄 가입은 진행
      }
    }

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
            console.log('[구독] 인앱 결제 성공, 프리미엄 활성화 시작');
            // 인앱 결제 성공 시 프리미엄 활성화
            const now = new Date();
            let renewalDate = new Date(now);
            renewalDate.setFullYear(now.getFullYear() + 1);

            // 월간 프리미엄의 남은 기간을 연간 프리미엄에 추가
            if (extraDays > 0) {
              renewalDate.setDate(renewalDate.getDate() + extraDays);
              console.log(`[구독] 연간 프리미엄 갱신일: ${renewalDate.toLocaleDateString()}, 추가된 일수: ${extraDays}일`);
            }

            // 프리미엄 무료권 다음 충전 시점 계산 (결제 시점 + 7일)
            const nextFreeNovelChargeDate = new Date(now);
            nextFreeNovelChargeDate.setDate(nextFreeNovelChargeDate.getDate() + 7);

            await updateDoc(doc(db, 'users', user.uid), {
              isMonthlyPremium: false,
              isYearlyPremium: true,
              premiumType: 'yearly',
              premiumStartDate: Timestamp.fromDate(now),
              premiumRenewalDate: Timestamp.fromDate(renewalDate),
              premiumFreeNovelNextChargeDate: Timestamp.fromDate(nextFreeNovelChargeDate),
              premiumFreeNovelCount: 1, // 결제 시점에 무료권 1개 지급
              premiumCancelled: false,
              updatedAt: Timestamp.now()
            });

            const successMessage =
              extraDays > 0
                ? t('premium_yearly_success_with_extra', { days: extraDays })
                : t('premium_yearly_success');

            toast.showToast(successMessage, 'success');
            // 상태 업데이트를 위해 다시 조회
            const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
            if (updatedUserDoc.exists()) {
              const data = updatedUserDoc.data();
              setPremiumStatus({
                isMonthlyPremium: data.isMonthlyPremium || false,
                isYearlyPremium: data.isYearlyPremium || false,
                premiumType: data.premiumType || null,
                premiumRenewalDate: data.premiumRenewalDate || null
              });
            }
            console.log('[구독] 연간 프리미엄 가입 완료');
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

  // 프리미엄 해지 함수
  const handleCancelPremium = () => {
    setCancelModal(true);
  };

  // 구독 취소 철회 함수
  const handleResumePremium = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      // Google Play 구독 상태 확인
      if (inAppPurchaseService.isAvailable) {
        try {
          const monthlyStatus = await inAppPurchaseService.getSubscriptionStatus(PRODUCT_IDS.MONTHLY_PREMIUM);
          const yearlyStatus = await inAppPurchaseService.getSubscriptionStatus(PRODUCT_IDS.YEARLY_PREMIUM);

          const isActive = (premiumStatus.isMonthlyPremium && monthlyStatus.isActive) ||
            (premiumStatus.isYearlyPremium && yearlyStatus.isActive);

          if (!isActive) {
            toast.showToast('Google Play에서 구독이 활성화되어 있지 않습니다. Google Play 스토어에서 구독을 확인해주세요.', 'error');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('구독 상태 확인 실패:', error);
        }
      }

      // 취소 철회 처리
      await updateDoc(doc(db, 'users', user.uid), {
        premiumCancelled: false,
        updatedAt: Timestamp.now()
      });

      // 상태 업데이트
      setPremiumStatus(prev => ({
        ...prev,
        premiumCancelled: false
      }));

      toast.showToast('구독 취소가 철회되었습니다. 구독이 계속됩니다.', 'success');
    } catch (error) {
      console.error('구독 취소 철회 실패:', error);
      toast.showToast('구독 취소 철회에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 실제 해지 로직
  const doCancelPremium = async () => {
    if (!user?.uid) return;
    setIsCancelling(true);
    try {
      // Google Play 구독 취소는 Google Play Console에서 처리
      // 앱에서는 취소 예정 상태만 표시하고, 해지일까지는 구독 유지
      // premiumRenewalDate까지는 구독이 유지되므로 즉시 해지하지 않음
      await updateDoc(doc(db, 'users', user.uid), {
        premiumCancelled: true, // 취소 예정 표시
        // isMonthlyPremium, isYearlyPremium, premiumRenewalDate는 유지
        // 해지일(premiumRenewalDate)까지는 구독 혜택 유지
        updatedAt: Timestamp.now()
      });

      // 사용자에게 안내 메시지 표시
      const renewalDate = premiumStatus.premiumRenewalDate;
      let message = '구독 취소가 예약되었습니다. ';
      if (renewalDate) {
        const date = renewalDate.toDate ? renewalDate.toDate() : new Date(renewalDate.seconds * 1000);
        message += `해지일(${date.toLocaleDateString('ko-KR')})까지는 모든 프리미엄 혜택을 이용하실 수 있습니다.`;
      } else {
        message += '해지일까지는 모든 프리미엄 혜택을 이용하실 수 있습니다.';
      }

      toast.showToast(message, 'success');

      // 로컬 상태 즉시 업데이트 (UI 반영)
      setPremiumStatus(prev => ({
        ...prev,
        premiumCancelled: true
      }));
    } catch (error) {
      console.error('프리미엄 해지 실패:', error);
      toast.showToast(t('premium_cancel_failed') || '프리미엄 해지에 실패했습니다.', 'error');
    } finally {
      setIsCancelling(false);
      setCancelModal(false);
    }
  };

  // 페이지 포커스 시 프리미엄 상태 다시 조회 및 동기화
  useEffect(() => {
    const handleFocus = () => {
      if (user?.uid) {
        const fetchUser = async () => {
          try {
            // Google Play 구독 상태 동기화
            if (inAppPurchaseService.isAvailable) {
              try {
                await inAppPurchaseService.syncSubscriptionStatus(user.uid);
              } catch (error) {
                console.error('구독 상태 동기화 실패:', error);
              }
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setPremiumStatus({
                isMonthlyPremium: data.isMonthlyPremium || false,
                isYearlyPremium: data.isYearlyPremium || false,
                premiumType: data.premiumType || null,
                premiumRenewalDate: data.premiumRenewalDate || null,
                premiumCancelled: data.premiumCancelled || false
              });
            }
          } catch (error) {
            console.error('프리미엄 상태 조회 실패:', error);
          }
        };
        fetchUser();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  return (
    <Container theme={theme}>
      <Header user={user} title={t('premium') || '프리미엄'} />

      {/* 구독 관리 섹션 - 프리미엄 회원에게만 표시 */}
      {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) && (
        <SubscriptionSection theme={theme} style={{ marginTop: '0' }}>
          <SubscriptionTitle theme={theme}>
            {t('subscription_manage') || '구독 관리'}
          </SubscriptionTitle>
          <SubscriptionInfo>
            <SubscriptionStatus theme={theme}>
              {premiumStatus.premiumType === 'trial' && `🎁 일주일 무료 체험`}
              {premiumStatus.isMonthlyPremium && premiumStatus.premiumType !== 'trial' && `💎 ${t('premium_monthly')}`}
              {premiumStatus.isYearlyPremium && `👑 ${t('premium_yearly')}`}
            </SubscriptionStatus>
            {premiumStatus.premiumRenewalDate && (
              <SubscriptionDetail theme={theme}>
                {premiumStatus.premiumType === 'trial'
                  ? '체험 종료일'
                  : premiumStatus.premiumCancelled
                    ? (t('subscription_expiry_date') || '구독 만료일')
                    : (t('subscription_next_renewal_date') || '다음 갱신일')}{' '}
                {new Date(
                  premiumStatus.premiumRenewalDate.seconds
                    ? premiumStatus.premiumRenewalDate.seconds * 1000
                    : premiumStatus.premiumRenewalDate
                ).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </SubscriptionDetail>
            )}
          </SubscriptionInfo>

          {/* 취소 철회 버튼 - 구독 관리 카드 안에 포함 (취소 예정 상태일 때만) */}
          {premiumStatus.premiumCancelled && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <SubscriptionDetail theme={theme} style={{ marginBottom: '12px', fontSize: '13px', color: '#e74c3c' }}>
                구독 취소가 예약되어 있습니다.
                {premiumStatus.premiumRenewalDate && (
                  <>
                    <br />
                    해지일({new Date(
                      premiumStatus.premiumRenewalDate.seconds
                        ? premiumStatus.premiumRenewalDate.seconds * 1000
                        : premiumStatus.premiumRenewalDate.toDate
                          ? premiumStatus.premiumRenewalDate.toDate()
                          : premiumStatus.premiumRenewalDate
                    ).toLocaleDateString('ko-KR')})까지는 모든 프리미엄 혜택을 이용하실 수 있습니다.
                  </>
                )}
              </SubscriptionDetail>
              <PremiumButton
                style={{
                  width: '100%',
                  fontSize: 14,
                  padding: '12px 0',
                  background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                  boxShadow: '0 4px 12px rgba(46, 204, 113, 0.3)'
                }}
                onClick={handleResumePremium}
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '구독 취소 철회'}
              </PremiumButton>
            </div>
          )}
        </SubscriptionSection>
      )}

      {/* 프리미엄 결제 비교 카드 UI */}
      {!premiumStatus.isYearlyPremium && (
        <>
          {/* 일주일 무료 체험 카드 - 프리미엄이 아닌 사용자에게만 표시 */}
          {!premiumStatus.isMonthlyPremium && (
            <div style={{ marginBottom: '20px' }}>
              <PremiumCard style={{
                border: '2px solid #4CAF50',
                boxShadow: '0 4px 16px rgba(76,175,80,0.2)',
                background: 'linear-gradient(135deg, rgba(76,175,80,0.05) 0%, rgba(76,175,80,0.02) 100%)'
              }}>
                <div
                  style={{
                    color: '#4CAF50',
                    fontWeight: 800,
                    fontSize: 13,
                    marginBottom: 6,
                    textAlign: 'center',
                    fontFamily: 'inherit',
                  }}
                >
                  일주일 무료 체험
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      marginBottom: 2,
                      textAlign: 'center',
                      color: '#4CAF50',
                      fontFamily: 'inherit',
                    }}
                  >
                    무료
                  </div>
                  <div
                    style={{
                      color: '#666',
                      fontSize: 12,
                      marginBottom: 10,
                      textAlign: 'center',
                      marginTop: 10,
                      fontFamily: 'inherit',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    모든 프리미엄 기능을{'\n'}7일간 무료로 체험하세요
                  </div>
                </div>
                <PremiumButton
                  style={{
                    width: '100%',
                    fontSize: 14,
                    marginTop: 6,
                    padding: '12px 0',
                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
                  }}
                  onClick={handleFreeTrial}
                  disabled={isLoading}
                >
                  {isLoading ? '처리 중...' : '일주일 무료 체험 시작'}
                </PremiumButton>
              </PremiumCard>
            </div>
          )}

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
              <PremiumCard>
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
                  style={{ width: '100%', fontSize: 13, marginTop: 6, padding: '10px 0' }}
                  onClick={handleMonthlyPremium}
                  disabled={isLoading}
                >
                  {isLoading ? '처리 중...' : '구독하기'}
                </PremiumButton>
              </PremiumCard>
            )}

            {/* 연간 결제 카드 - 월간 프리미엄 회원도 연간으로 전환 가능 */}
            <YearlyPremiumCard>
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
                style={{ width: '100%', fontSize: 13, background: 'linear-gradient(90deg, #FFC300 60%, #FF9800 100%)', color: '#fff', fontWeight: 700, padding: '10px 0', boxShadow: '0 4px 12px rgba(255,195,0,0.18)' }}
                onClick={handleYearlyPremium}
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '구독하기'}
              </PremiumButton>
            </YearlyPremiumCard>
          </div>
        </>
      )}

      {/* 프리미엄 기능 섹션 - 모든 사용자에게 표시 (결제 카드 아래로 이동) */}
      <PremiumSection theme={theme} style={{ marginTop: '0', marginBottom: '24px' }}>
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
      {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) && !premiumStatus.premiumCancelled && (
        <div style={{ marginTop: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <SubscriptionDetail theme={theme} style={{ marginBottom: '12px', fontSize: '14px' }}>
            프리미엄 해지 즉시<br />모든 프리미엄 혜택이 중단됩니다.
          </SubscriptionDetail>
          <CancelButton
            onClick={handleCancelPremium}
            disabled={isCancelling}
          >
            {isCancelling ? (t('processing') || '처리 중...') : (t('premium_cancel_button') || '구독 해지')}
          </CancelButton>
        </div>
      )}

      {/* 프리미엄 가입 확인 모달 */}
      <ConfirmModal
        open={modal.open}
        title={
          modal.type === 'monthly'
            ? t('premium_monthly_modal_title')
            : modal.type === 'yearly'
              ? t('premium_yearly_modal_title')
              : modal.type === 'trial'
                ? '일주일 무료 체험 시작'
                : ''
        }
        description={
          modal.type === 'monthly'
            ? t('premium_monthly_modal_desc')
            : modal.type === 'yearly'
              ? t('premium_yearly_modal_desc')
              : modal.type === 'trial'
                ? '일주일 동안 모든 프리미엄 기능을 무료로 체험하실 수 있습니다. 체험 기간이 끝나면 자동으로 해지됩니다.'
                : ''
        }
        onCancel={() => setModal({ open: false, type: null })}
        onConfirm={() => {
          if (modal.type === 'monthly') doMonthlyPremium();
          else if (modal.type === 'yearly') doYearlyPremium();
          else if (modal.type === 'trial') doFreeTrial();
        }}
        confirmText={modal.type === 'trial' ? '체험 시작' : t('premium_subscribe_confirm_button')}
      />

      {/* 프리미엄 해지 확인 모달 */}
      <ConfirmModal
        open={cancelModal}
        title={
          premiumStatus.isMonthlyPremium
            ? t('premium_cancel_monthly_title') || '월간 프리미엄 해지'
            : t('premium_cancel_yearly_title') || '연간 프리미엄 해지'
        }
        description={
          premiumStatus.isMonthlyPremium
            ? (premiumStatus.premiumRenewalDate
              ? `월간 프리미엄 구독을 취소하시겠습니까?\n\n구독 취소 후 해지일(${new Date(premiumStatus.premiumRenewalDate.seconds ? premiumStatus.premiumRenewalDate.seconds * 1000 : premiumStatus.premiumRenewalDate.toDate ? premiumStatus.premiumRenewalDate.toDate() : premiumStatus.premiumRenewalDate).toLocaleDateString('ko-KR')})까지는 모든 프리미엄 혜택을 이용하실 수 있습니다.\n\n월간 구독은 7일의 유예 기간이 있으며, 이 기간 동안 결제가 실패하면 구독이 해지됩니다.`
              : t('premium_cancel_monthly_desc') || '월간 프리미엄을 해지하시겠습니까?')
            : (premiumStatus.premiumRenewalDate
              ? `연간 프리미엄 구독을 취소하시겠습니까?\n\n구독 취소 후 해지일(${new Date(premiumStatus.premiumRenewalDate.seconds ? premiumStatus.premiumRenewalDate.seconds * 1000 : premiumStatus.premiumRenewalDate.toDate ? premiumStatus.premiumRenewalDate.toDate() : premiumStatus.premiumRenewalDate).toLocaleDateString('ko-KR')})까지는 모든 프리미엄 혜택을 이용하실 수 있습니다.\n\n연간 구독은 14일의 유예 기간이 있으며, 이 기간 동안 결제가 실패하면 구독이 해지됩니다.`
              : t('premium_cancel_yearly_desc') || '연간 프리미엄을 해지하시겠습니까?')
        }
        onCancel={() => setCancelModal(false)}
        onConfirm={doCancelPremium}
        confirmText={t('premium_cancel_button') || '구독 해지'}
      />

      <Navigation />
    </Container>
  );
}

export default Premium;

