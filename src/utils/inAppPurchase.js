import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';
import { doc, addDoc, collection, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Billing 플러그인 등록
// Capacitor 7에서는 네이티브 플러그인이 자동으로 등록되어야 하지만,
// UNIMPLEMENTED 에러가 발생하는 경우 플러그인이 빌드에 포함되지 않았을 수 있습니다
const Billing = registerPlugin('Billing', {
  // Android는 네이티브 플러그인이 자동으로 등록되어야 합니다
  // web 구현만 명시적으로 지정
  web: () => import('./billing.web').then(m => new m.BillingWeb()),
});

// 상품 ID 정의
export const PRODUCT_IDS = {
  POINTS_100: 'points_100',
  POINTS_500: 'points_500',
  POINTS_1000: 'points_1000',
  POINTS_2000: 'points_2000',
  MONTHLY_PREMIUM: 'premium_monthly',
  YEARLY_PREMIUM: 'premium_yearly',
  POTION_ROMANCE: 'potion_romance',
  POTION_FANTASY: 'potion_fantasy',
  POTION_MYSTERY: 'potion_mystery',
  POTION_HORROR: 'potion_horror',
  POTION_HISTORICAL: 'potion_historical',
  POTION_FAIRYTALE: 'potion_fairytale',
  POTION_SET: 'potion_set_6'
};

// 상품 정보
export const PRODUCT_INFO = {
  [PRODUCT_IDS.POINTS_100]: {
    name: '포인트 100개',
    price: 100,
    description: '100포인트를 충전합니다'
  },
  [PRODUCT_IDS.POINTS_500]: {
    name: '포인트 500개',
    price: 500,
    description: '500포인트를 충전합니다 (+50 보너스)'
  },
  [PRODUCT_IDS.POINTS_1000]: {
    name: '포인트 1000개',
    price: 1000,
    description: '1000포인트를 충전합니다 (+150 보너스)'
  },
  [PRODUCT_IDS.POINTS_2000]: {
    name: '포인트 2000개',
    price: 2000,
    description: '2000포인트를 충전합니다 (+400 보너스)'
  },
  [PRODUCT_IDS.MONTHLY_PREMIUM]: {
    name: '월간 프리미엄',
    price: 0,
    description: '월간 프리미엄 구독'
  },
  [PRODUCT_IDS.YEARLY_PREMIUM]: {
    name: '연간 프리미엄',
    price: 0,
    description: '연간 프리미엄 구독'
  },
  [PRODUCT_IDS.POTION_ROMANCE]: {
    name: '로맨스 포션',
    price: 100,
    description: '로맨스 장르 소설 생성 포션'
  },
  [PRODUCT_IDS.POTION_FANTASY]: {
    name: '판타지 포션',
    price: 100,
    description: '판타지 장르 소설 생성 포션'
  },
  [PRODUCT_IDS.POTION_MYSTERY]: {
    name: '미스터리 포션',
    price: 100,
    description: '미스터리 장르 소설 생성 포션'
  },
  [PRODUCT_IDS.POTION_HORROR]: {
    name: '호러 포션',
    price: 100,
    description: '호러 장르 소설 생성 포션'
  },
  [PRODUCT_IDS.POTION_HISTORICAL]: {
    name: '역사 포션',
    price: 100,
    description: '역사 장르 소설 생성 포션'
  },
  [PRODUCT_IDS.POTION_FAIRYTALE]: {
    name: '동화 포션',
    price: 100,
    description: '동화 장르 소설 생성 포션'
  },
  [PRODUCT_IDS.POTION_SET]: {
    name: '포션 6종 세트',
    price: 500,
    description: '모든 장르 포션 6종 세트'
  }
};

class InAppPurchaseService {
  constructor() {
    this.isInitialized = false;
    this.isAvailable = Capacitor.isNativePlatform();
  }

  // 초기화
  async initialize() {
    console.log('[인앱결제] initialize 시작', {
      isAvailable: this.isAvailable,
      platform: Capacitor.getPlatform(),
      hasBilling: !!Billing
    });

    if (!this.isAvailable) {
      console.log('[인앱결제] 네이티브 플랫폼이 아님 - 인앱 결제는 네이티브 플랫폼에서만 사용 가능합니다.');
      return false;
    }

    // Billing 플러그인 존재 여부 확인
    if (!Billing) {
      console.error('[인앱결제] Billing 플러그인을 찾을 수 없습니다.');
      return false;
    }

    // 플러그인 메서드 존재 여부 확인
    if (typeof Billing.initialize !== 'function') {
      console.error('[인앱결제] Billing.initialize 메서드를 찾을 수 없습니다.', Billing);
      return false;
    }

    try {
      console.log('[인앱결제] Billing.initialize 호출');
      const result = await Billing.initialize();
      console.log('[인앱결제] Billing.initialize 결과', result);

      if (result && result.success) {
        this.isInitialized = true;
        console.log('[인앱결제] 초기화 완료');
        return true;
      } else {
        console.error('[인앱결제] 초기화 실패 - result.success가 false', result);
        return false;
      }
    } catch (error) {
      console.error('[인앱결제] 초기화 실패 - 예외 발생:', error);
      console.error('[인앱결제] 에러 상세:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        errorName: error.name
      });

      // UNIMPLEMENTED 에러인 경우 특별 처리
      if (error.code === 'UNIMPLEMENTED' || error.message?.includes('not implemented')) {
        console.error('[인앱결제] ⚠️ 플러그인이 구현되지 않았습니다. 다음을 확인하세요:');
        console.error('[인앱결제] 1. BillingPlugin.java가 빌드에 포함되었는지 확인');
        console.error('[인앱결제] 2. Android Studio에서 Clean & Rebuild 실행');
        console.error('[인앱결제] 3. Android Logcat에서 BillingPlugin 로드 로그 확인');
      }

      return false;
    }
  }

  // 상품 정보 조회
  async getProducts(productIds, productType = 'inapp') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return [];
    }

    try {
      const result = await Billing.queryProductDetails({
        productIds: productIds,
        productType: productType
      });
      return result.products || [];
    } catch (error) {
      console.error('상품 정보 조회 실패:', error);
      return [];
    }
  }

  // 구매 시작
  async purchaseProduct(productId, productType = 'inapp') {
    console.log('[인앱결제] purchaseProduct 시작', { productId, productType, isInitialized: this.isInitialized, isAvailable: this.isAvailable });

    if (!this.isInitialized) {
      console.log('[인앱결제] 초기화되지 않음, 초기화 시도');
      await this.initialize();
    }

    if (!this.isAvailable) {
      console.error('[인앱결제] 네이티브 플랫폼이 아님');
      throw new Error('인앱 결제는 네이티브 플랫폼에서만 사용 가능합니다.');
    }

    try {
      console.log('[인앱결제] Billing.purchaseProduct 호출 시작', { productId, productType });
      const result = await Billing.purchaseProduct({
        productId: productId,
        productType: productType
      });

      console.log('[인앱결제] Billing.purchaseProduct 결과', { result, hasPurchase: !!result?.purchase });

      if (result.purchase) {
        // purchase 객체의 유효성 검증
        if (!result.purchase.purchaseToken || !result.purchase.orderId) {
          console.error('[인앱결제] purchase 객체가 유효하지 않음 - purchaseToken 또는 orderId가 없음', {
            hasPurchaseToken: !!result.purchase.purchaseToken,
            hasOrderId: !!result.purchase.orderId,
            purchase: result.purchase
          });
          throw new Error('인앱 결제 정보가 유효하지 않습니다. purchaseToken 또는 orderId가 없습니다.');
        }

        console.log('[인앱결제] 구매 성공, handlePurchaseSuccess 호출', {
          orderId: result.purchase.orderId,
          purchaseToken: result.purchase.purchaseToken?.substring(0, 20) + '...',
          isAcknowledged: result.purchase.isAcknowledged
        });

        try {
          // 구매 완료 처리
          await this.handlePurchaseSuccess(result.purchase);
          console.log('[인앱결제] handlePurchaseSuccess 완료');
          return result.purchase;
        } catch (handleError) {
          console.error('[인앱결제] handlePurchaseSuccess 실패:', handleError);
          // handlePurchaseSuccess 실패 시에도 purchase는 반환하지 않음
          throw new Error('구매 완료 처리 중 오류가 발생했습니다: ' + handleError.message);
        }
      }

      console.warn('[인앱결제] result.purchase가 null 또는 undefined', { result });

      // 더 자세한 에러 정보 제공
      if (result && result.error) {
        console.error('[인앱결제] result에 에러 정보 있음', result.error);
        throw new Error(result.error || '인앱 결제가 완료되지 않았습니다.');
      }

      throw new Error('인앱 결제 창이 표시되지 않았거나 사용자가 취소했습니다.');
    } catch (error) {
      console.error('[인앱결제] 구매 실패:', error);
      console.error('[인앱결제] 에러 상세:', {
        message: error.message,
        stack: error.stack,
        productId,
        productType,
        errorName: error.name
      });

      // 에러 메시지 개선
      let errorMessage = error.message;

      // 일반적인 에러 메시지 개선
      if (errorMessage.includes('Failed to get product details')) {
        errorMessage = '상품 정보를 가져올 수 없습니다. Google Play Console에서 상품이 등록되어 있는지 확인해주세요.';
      } else if (errorMessage.includes('Billing service not connected')) {
        errorMessage = '인앱 결제 서비스에 연결할 수 없습니다. 앱을 재시작해주세요.';
      } else if (errorMessage.includes('User canceled')) {
        errorMessage = '인앱 결제가 취소되었습니다.';
      } else if (errorMessage.includes('Failed to launch billing flow')) {
        errorMessage = '결제 창을 열 수 없습니다. Google Play 서비스를 확인해주세요.';
      }

      const improvedError = new Error(errorMessage);
      improvedError.originalError = error;
      throw improvedError;
    }
  }

  // 구매 완료 처리
  async handlePurchaseSuccess(purchase) {
    console.log('[인앱결제] handlePurchaseSuccess 시작', purchase);

    try {
      // 구매 확인 (acknowledge)
      if (purchase.purchaseToken && !purchase.isAcknowledged) {
        console.log('[인앱결제] acknowledgePurchase 호출', { purchaseToken: purchase.purchaseToken });
        await Billing.acknowledgePurchase({
          purchaseToken: purchase.purchaseToken
        });
        console.log('[인앱결제] acknowledgePurchase 완료');
      } else {
        console.log('[인앱결제] acknowledgePurchase 건너뜀', {
          hasToken: !!purchase.purchaseToken,
          isAcknowledged: purchase.isAcknowledged
        });
      }

      // 구매 내역 저장 (Firebase)
      console.log('[인앱결제] Firebase에 구매 내역 저장 시작');
      await this.savePurchaseToFirebase(purchase);
      console.log('[인앱결제] Firebase에 구매 내역 저장 완료');

      console.log('[인앱결제] 구매 완료 처리됨:', purchase);
    } catch (error) {
      console.error('[인앱결제] 구매 완료 처리 실패:', error);
      console.error('[인앱결제] 에러 상세:', {
        message: error.message,
        stack: error.stack,
        purchase
      });
      throw error;
    }
  }

  // Firebase에 구매 내역 저장
  async savePurchaseToFirebase(purchase) {
    try {
      // 현재 사용자 정보 가져오기
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.warn('사용자가 로그인되지 않아 구매 내역을 저장할 수 없습니다.');
        return;
      }

      // 구매 내역 저장
      await addDoc(collection(db, 'users', currentUser.uid, 'purchases'), {
        orderId: purchase.orderId,
        purchaseToken: purchase.purchaseToken,
        products: purchase.products || [],
        purchaseTime: Timestamp.fromMillis(purchase.purchaseTime || Date.now()),
        isAcknowledged: purchase.isAcknowledged || false,
        isAutoRenewing: purchase.isAutoRenewing || false,
        createdAt: Timestamp.now()
      });

      console.log('Firebase에 구매 내역 저장 완료:', purchase);
    } catch (error) {
      console.error('Firebase에 구매 내역 저장 실패:', error);
      // 저장 실패해도 구매는 완료된 것으로 처리
    }
  }

  // 구독 상태 확인 (Google Play에서 실제 구독 상태 확인)
  async getSubscriptionStatus(productId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return false;
    }

    try {
      const result = await Billing.queryPurchases({
        productType: 'subs'
      });

      if (result.purchases && result.purchases.length > 0) {
        const subscription = result.purchases.find(p =>
          p.products && p.products.includes(productId)
        );
        if (subscription) {
          // isAutoRenewing이 false면 취소 예정 상태
          // 하지만 유예 기간 중이거나 해지일 전까지는 구독이 유지됨
          return {
            isActive: subscription.isAcknowledged,
            isAutoRenewing: subscription.isAutoRenewing || false,
            purchaseToken: subscription.purchaseToken,
            purchaseTime: subscription.purchaseTime
          };
        }
      }
      return { isActive: false, isAutoRenewing: false };
    } catch (error) {
      console.error('구독 상태 확인 실패:', error);
      return { isActive: false, isAutoRenewing: false };
    }
  }

  // 구독 상태 동기화 (Google Play와 Firebase 동기화)
  async syncSubscriptionStatus(userId) {
    if (!this.isAvailable || !userId) {
      return;
    }

    try {
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      // Google Play에서 구독 상태 확인
      const monthlyStatus = await this.getSubscriptionStatus(PRODUCT_IDS.MONTHLY_PREMIUM);
      const yearlyStatus = await this.getSubscriptionStatus(PRODUCT_IDS.YEARLY_PREMIUM);

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return;
      }

      const userData = userDoc.data();
      const updates = {};

      // 월간 구독 상태 확인
      if (monthlyStatus.isActive) {
        // Google Play에서 활성화되어 있으면 취소 상태 해제 (취소 철회)
        if (userData.premiumCancelled && monthlyStatus.isAutoRenewing) {
          updates.premiumCancelled = false;
        }
      } else if (userData.isMonthlyPremium) {
        // Google Play에서 비활성화되었는데 Firebase에는 활성화되어 있으면
        // 유예 기간 종료 또는 실제 해지 확인
        const renewalDate = userData.premiumRenewalDate;
        if (renewalDate) {
          let renewal;
          if (renewalDate.seconds) {
            renewal = new Date(renewalDate.seconds * 1000);
          } else if (renewalDate.toDate) {
            renewal = renewalDate.toDate();
          } else {
            renewal = new Date(renewalDate);
          }

          const now = new Date();
          // 해지일이 지났으면 실제 해지 처리
          if (renewal <= now) {
            updates.isMonthlyPremium = false;
            updates.premiumType = null;
            updates.premiumFreeNovelCount = 0;
          }
        }
      }

      // 연간 구독 상태 확인
      if (yearlyStatus.isActive) {
        if (userData.premiumCancelled && yearlyStatus.isAutoRenewing) {
          updates.premiumCancelled = false;
        }
      } else if (userData.isYearlyPremium) {
        const renewalDate = userData.premiumRenewalDate;
        if (renewalDate) {
          let renewal;
          if (renewalDate.seconds) {
            renewal = new Date(renewalDate.seconds * 1000);
          } else if (renewalDate.toDate) {
            renewal = renewalDate.toDate();
          } else {
            renewal = new Date(renewalDate);
          }

          const now = new Date();
          if (renewal <= now) {
            updates.isYearlyPremium = false;
            updates.premiumType = null;
            updates.premiumFreeNovelCount = 0;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await updateDoc(userRef, updates);
      }
    } catch (error) {
      console.error('구독 상태 동기화 실패:', error);
    }
  }

  // 구매 내역 조회
  async getPurchaseHistory(productType = 'inapp') {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return [];
    }

    try {
      const result = await Billing.queryPurchases({
        productType: productType
      });
      return result.purchases || [];
    } catch (error) {
      console.error('구매 내역 조회 실패:', error);
      return [];
    }
  }

  // 구독 취소
  async cancelSubscription(productId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 구독 취소는 Google Play Console에서 처리
      // 앱에서는 구독 상태만 확인
      console.log('구독 취소는 Google Play Console에서 처리하세요.');
      return true;
    } catch (error) {
      console.error('구독 취소 실패:', error);
      return false;
    }
  }

  // 테스트 모드 확인
  isTestMode() {
    return process.env.NODE_ENV === 'development';
  }
}

// 싱글톤 인스턴스
export const inAppPurchaseService = new InAppPurchaseService();

// 편의 함수들
export const initializeInAppPurchase = () => inAppPurchaseService.initialize();
export const purchaseProduct = (productId) => inAppPurchaseService.purchaseProduct(productId);
export const getProducts = (productIds) => inAppPurchaseService.getProducts(productIds);
export const getSubscriptionStatus = (productId) => inAppPurchaseService.getSubscriptionStatus(productId);
