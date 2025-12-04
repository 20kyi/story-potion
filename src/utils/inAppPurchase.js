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

  // 소비성 상품 소비 처리 (재구매 가능하도록)
  async consumePurchase(purchaseToken) {
    console.log('[인앱결제] consumePurchase 시작', { purchaseToken: purchaseToken?.substring(0, 20) + '...' });

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      console.warn('[인앱결제] 네이티브 플랫폼이 아님 - 소비 처리 불가');
      return false;
    }

    if (!purchaseToken) {
      console.error('[인앱결제] purchaseToken이 없음');
      throw new Error('purchaseToken is required');
    }

    try {
      console.log('[인앱결제] Billing.consumePurchase 호출');
      const result = await Billing.consumePurchase({
        purchaseToken: purchaseToken
      });

      console.log('[인앱결제] Billing.consumePurchase 결과', result);

      if (result && result.success) {
        console.log('[인앱결제] 소비 성공');
        return true;
      } else {
        console.error('[인앱결제] 소비 실패 - result.success가 false', result);
        throw new Error('소비 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('[인앱결제] 소비 처리 실패:', error);
      console.error('[인앱결제] 에러 상세:', {
        message: error.message,
        stack: error.stack,
        purchaseToken: purchaseToken?.substring(0, 20) + '...'
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
      return { isActive: false, isAutoRenewing: false, exists: false };
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
          // 구독이 존재함
          // ProductDetails에서 구독 기간 정보 가져와서 만료일 계산
          let expiryTimeMillis = subscription.expiryTimeMillis || null;
          try {
            const productDetails = await Billing.queryProductDetails({
              productIds: [productId],
              productType: 'subs'
            });

            if (productDetails.products && productDetails.products.length > 0) {
              const product = productDetails.products[0];
              // 구독 기간 정보는 ProductDetails에 직접 포함되지 않으므로
              // purchaseTime을 기준으로 계산해야 함
              // 하지만 정확한 만료일은 Google Play Developer API를 통해 가져와야 함
              // 일단 purchaseTime만 반환하고, JavaScript에서 계산
              console.log('[구독 상태] ProductDetails 조회 성공', { productId });
            }
          } catch (error) {
            console.warn('[구독 상태] ProductDetails 조회 실패:', error);
          }

          // 구독이 활성화되어 있는지 확인
          // isAcknowledged가 true이고, expiryTimeMillis가 없거나 현재 시간보다 미래이면 활성화됨
          const now = Date.now();
          const isActive = subscription.isAcknowledged &&
            (expiryTimeMillis === null || expiryTimeMillis > now);

          console.log('[구독 상태] 구독 상태 확인', {
            productId,
            isAcknowledged: subscription.isAcknowledged,
            expiryTimeMillis,
            now,
            isActive,
            isAutoRenewing: subscription.isAutoRenewing
          });

          return {
            isActive: isActive,
            isAutoRenewing: subscription.isAutoRenewing || false,
            exists: true,
            purchaseToken: subscription.purchaseToken,
            purchaseTime: subscription.purchaseTime,
            expiryTimeMillis: expiryTimeMillis
          };
        }
      }
      // Google Play Store에서 구독을 찾을 수 없음
      console.log(`[구독 상태] ${productId} 구독을 Google Play Store에서 찾을 수 없음`);
      return { isActive: false, isAutoRenewing: false, exists: false };
    } catch (error) {
      console.error('구독 상태 확인 실패:', error);
      return { isActive: false, isAutoRenewing: false, exists: false };
    }
  }

  // 웹에서 구독 상태 동기화 (웹에서는 Google Play Store API를 직접 호출할 수 없으므로 동기화하지 않음)
  async syncSubscriptionStatusWeb(userId) {
    if (!userId) {
      return;
    }

    // 웹에서는 Google Play Store 상태를 직접 확인할 수 없으므로 동기화하지 않음
    // 네이티브 플랫폼에서만 Google Play Store 상태를 확인하여 동기화
    console.log('[구독 동기화 - 웹] 웹 플랫폼에서는 Google Play Store 상태를 직접 확인할 수 없으므로 동기화하지 않음');
  }

  // 구독 상태 동기화 (Google Play와 Firebase 동기화)
  async syncSubscriptionStatus(userId) {
    if (!userId) {
      return;
    }

    // 웹에서는 Google Play Store 상태를 직접 확인할 수 없으므로 동기화하지 않음
    if (!this.isAvailable) {
      console.log('[구독 동기화] 웹 플랫폼에서는 Google Play Store 상태를 직접 확인할 수 없으므로 동기화하지 않음');
      return;
    }

    try {
      const { doc, getDoc, updateDoc, collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      console.log('[구독 동기화] 시작', { userId });
      console.log('[구독 동기화] ⚠️ 주의: Google Play Billing API는 기기에서 로그인한 Google 계정의 구독만 반환합니다.');
      console.log('[구독 동기화] ⚠️ 앱에서 로그인한 Firebase 사용자와 Google Play 계정이 다를 수 있습니다.');

      // Google Play에서 구독 상태 확인
      const monthlyStatus = await this.getSubscriptionStatus(PRODUCT_IDS.MONTHLY_PREMIUM);
      const yearlyStatus = await this.getSubscriptionStatus(PRODUCT_IDS.YEARLY_PREMIUM);
      
      console.log('[구독 동기화] Google Play 구독 상태', {
        monthly: { isActive: monthlyStatus.isActive, hasToken: !!monthlyStatus.purchaseToken },
        yearly: { isActive: yearlyStatus.isActive, hasToken: !!yearlyStatus.purchaseToken }
      });

      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return;
      }

      const userData = userDoc.data();
      const updates = {};

      // 현재 사용자의 구매 내역에서 구독 purchaseToken 확인하는 함수
      const checkPurchaseToken = async (purchaseToken) => {
        if (!purchaseToken) return false;
        try {
          const purchasesRef = collection(db, 'users', userId, 'purchases');
          const q = query(purchasesRef, where('purchaseToken', '==', purchaseToken));
          const querySnapshot = await getDocs(q);
          return !querySnapshot.empty;
        } catch (error) {
          console.error('[구독 동기화] 구매 내역 확인 실패:', error);
          return false;
        }
      };

      // 월간 구독 상태 확인
      // Google Play Store에서 구독 상태를 확인하여 앱 상태와 동기화
      if (monthlyStatus.isActive) {
        // 현재 사용자가 구매한 구독인지 확인
        const isUserPurchase = await checkPurchaseToken(monthlyStatus.purchaseToken);
        
        if (!isUserPurchase) {
          console.warn('[구독 동기화] ⚠️ 월간 구독이 Google Play에서 활성화되어 있지만 현재 Firebase 사용자의 구매 내역에 없음');
          console.warn('[구독 동기화] ⚠️ 이는 다음 중 하나일 수 있습니다:');
          console.warn('[구독 동기화] ⚠️ 1. 기기에서 로그인한 Google 계정과 앱에서 로그인한 Firebase 사용자가 다른 경우');
          console.warn('[구독 동기화] ⚠️ 2. 다른 계정에서 구매한 구독이 기기에 남아있는 경우');
          console.warn('[구독 동기화] ⚠️ 이 구독은 무시되며, 현재 사용자의 구독 상태는 변경되지 않습니다.');
          
          // 다른 계정에서 구매한 구독이므로 무시
          // 현재 사용자가 이미 프리미엄으로 설정되어 있고, Google Play에서도 활성화되어 있지만
          // 구매 내역에 없으면 다른 계정의 구독이므로 해지하지 않음 (안전을 위해)
          // 단, Google Play에서 구독이 없고 Firebase에만 있으면 해지는 아래 로직에서 처리됨
        } else {
          // Google Play Store에서 활성화되어 있고, 현재 사용자의 구매 내역에 있으면 프리미엄 활성화
          console.log('[구독 동기화] 월간 구독 활성화됨 - 현재 사용자의 구매 내역 확인됨 - 프리미엄 활성화');

          // Firebase 상태와 다르면 업데이트
          if (!userData.isMonthlyPremium || userData.premiumType !== 'monthly') {
          const now = new Date();
          updates.isMonthlyPremium = true;
          updates.isYearlyPremium = false;
          updates.premiumType = 'monthly';
          updates.premiumStartDate = Timestamp.fromDate(now);
          }
        }
      } else if (userData.isMonthlyPremium) {
        // Google Play에서 비활성화되었는데 Firebase에는 활성화되어 있으면
        // Google Play Store 상태를 기준으로 해지 처리
        console.log('[구독 동기화] 월간 구독 비활성화 감지 - Google Play Store 상태 확인', {
          isActive: monthlyStatus.isActive,
          isAutoRenewing: monthlyStatus.isAutoRenewing,
          exists: monthlyStatus.exists
        });

        // Google Play Store에서 구독이 없거나 비활성화되어 있으면 해지 처리
        if (!monthlyStatus.exists || !monthlyStatus.isActive) {
          console.log('[구독 동기화] 월간 구독이 Google Play Store에 없거나 비활성화됨 - 일반 회원으로 전환');
          updates.isMonthlyPremium = false;
          updates.isYearlyPremium = false;
          updates.premiumType = null;
          updates.premiumStartDate = null;
          updates.premiumRenewalDate = null;
          updates.premiumCancelled = false;
        }
      }

      // 연간 구독 상태 확인
      if (yearlyStatus.isActive) {
        // 현재 사용자가 구매한 구독인지 확인
        const isUserPurchase = await checkPurchaseToken(yearlyStatus.purchaseToken);
        
        if (!isUserPurchase) {
          console.warn('[구독 동기화] ⚠️ 연간 구독이 Google Play에서 활성화되어 있지만 현재 Firebase 사용자의 구매 내역에 없음');
          console.warn('[구독 동기화] ⚠️ 이는 다음 중 하나일 수 있습니다:');
          console.warn('[구독 동기화] ⚠️ 1. 기기에서 로그인한 Google 계정과 앱에서 로그인한 Firebase 사용자가 다른 경우');
          console.warn('[구독 동기화] ⚠️ 2. 다른 계정에서 구매한 구독이 기기에 남아있는 경우');
          console.warn('[구독 동기화] ⚠️ 이 구독은 무시되며, 현재 사용자의 구독 상태는 변경되지 않습니다.');
          
          // 다른 계정에서 구매한 구독이므로 무시
          // 현재 사용자가 이미 프리미엄으로 설정되어 있고, Google Play에서도 활성화되어 있지만
          // 구매 내역에 없으면 다른 계정의 구독이므로 해지하지 않음 (안전을 위해)
          // 단, Google Play에서 구독이 없고 Firebase에만 있으면 해지는 아래 로직에서 처리됨
        } else {
          // Google Play Store에서 활성화되어 있고, 현재 사용자의 구매 내역에 있으면 프리미엄 활성화
          console.log('[구독 동기화] 연간 구독 활성화됨 - 현재 사용자의 구매 내역 확인됨 - 프리미엄 활성화');

          // Firebase 상태와 다르면 업데이트
          if (!userData.isYearlyPremium || userData.premiumType !== 'yearly') {
            const now = new Date();
            updates.isMonthlyPremium = false;
            updates.isYearlyPremium = true;
            updates.premiumType = 'yearly';
            updates.premiumStartDate = Timestamp.fromDate(now);
          }
        }
      } else if (userData.isYearlyPremium) {
        // Google Play에서 비활성화되었는데 Firebase에는 활성화되어 있으면
        // Google Play Store 상태를 기준으로 해지 처리
        console.log('[구독 동기화] 연간 구독 비활성화 감지 - Google Play Store 상태 확인', {
          isActive: yearlyStatus.isActive,
          isAutoRenewing: yearlyStatus.isAutoRenewing,
          exists: yearlyStatus.exists
        });

        // Google Play Store에서 구독이 없거나 비활성화되어 있으면 해지 처리
        if (!yearlyStatus.exists || !yearlyStatus.isActive) {
          console.log('[구독 동기화] 연간 구독이 Google Play Store에 없거나 비활성화됨 - 일반 회원으로 전환');
          updates.isMonthlyPremium = false;
          updates.isYearlyPremium = false;
          updates.premiumType = null;
          updates.premiumStartDate = null;
          updates.premiumRenewalDate = null;
          updates.premiumCancelled = false;
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await updateDoc(userRef, updates);
        console.log('[구독 동기화] ✅ 구독 상태 업데이트 완료', updates);
      } else {
        console.log('[구독 동기화] ✅ 구독 상태 변경 사항 없음');
      }
      
      console.log('[구독 동기화] 완료', { userId });
    } catch (error) {
      console.error('[구독 동기화] ❌ 구독 상태 동기화 실패:', error);
      console.error('[구독 동기화] 에러 상세:', {
        message: error.message,
        stack: error.stack,
        userId
      });
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

  // Google Play Store의 구독 관리 페이지 열기
  async openSubscriptionManagement() {
    if (!this.isAvailable) {
      console.warn('[인앱결제] 구독 관리 페이지는 앱에서만 사용 가능합니다.');
      return false;
    }

    try {
      console.log('[인앱결제] 구독 관리 페이지 열기 시작');
      console.log('[인앱결제] Billing 객체:', Billing);

      if (!Billing || typeof Billing.openSubscriptionManagement !== 'function') {
        console.error('[인앱결제] Billing.openSubscriptionManagement 메서드를 찾을 수 없습니다.');
        return false;
      }

      const result = await Billing.openSubscriptionManagement();
      console.log('[인앱결제] 구독 관리 페이지 열기 결과:', result);
      console.log('[인앱결제] result.success:', result?.success);

      return result && result.success;
    } catch (error) {
      console.error('[인앱결제] 구독 관리 페이지 열기 실패:', error);
      console.error('[인앱결제] 에러 상세:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      return false;
    }
  }

  // 미소비 포인트 구매 자동 소비 처리
  async consumeUnconsumedPointPurchases() {
    console.log('[인앱결제] 미소비 포인트 구매 확인 시작');

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      console.log('[인앱결제] 네이티브 플랫폼이 아님 - 미소비 구매 확인 건너뜀');
      return;
    }

    try {
      // 모든 미소비 구매 조회
      const purchases = await this.getPurchaseHistory('inapp');
      console.log('[인앱결제] 미소비 구매 목록:', purchases);

      if (!purchases || purchases.length === 0) {
        console.log('[인앱결제] 미소비 구매 없음');
        return;
      }

      // 포인트 상품 ID 목록
      const pointProductIds = [
        PRODUCT_IDS.POINTS_100,
        PRODUCT_IDS.POINTS_500,
        PRODUCT_IDS.POINTS_1000,
        PRODUCT_IDS.POINTS_2000
      ];

      // 포인트 상품만 필터링하여 소비 처리
      for (const purchase of purchases) {
        const productIds = purchase.products || [];
        const isPointProduct = productIds.some(productId => pointProductIds.includes(productId));

        if (isPointProduct && purchase.purchaseToken) {
          console.log('[인앱결제] 미소비 포인트 구매 발견, 소비 처리 시작', {
            productIds,
            orderId: purchase.orderId,
            purchaseToken: purchase.purchaseToken?.substring(0, 20) + '...'
          });

          try {
            // 이미 포인트가 지급되었는지 확인하기 위해 Firebase에서 구매 내역 확인
            // 하지만 중복 체크 없이 일단 소비 처리만 진행
            // (이미 포인트가 지급된 경우라도 소비는 필요하므로)
            await this.consumePurchase(purchase.purchaseToken);
            console.log('[인앱결제] 미소비 포인트 구매 소비 처리 완료', {
              productIds,
              orderId: purchase.orderId
            });
          } catch (consumeError) {
            console.error('[인앱결제] 미소비 포인트 구매 소비 처리 실패:', consumeError);
            // 하나 실패해도 계속 진행
          }
        }
      }

      console.log('[인앱결제] 미소비 포인트 구매 확인 및 소비 처리 완료');
    } catch (error) {
      console.error('[인앱결제] 미소비 포인트 구매 확인 실패:', error);
      // 에러가 발생해도 앱 동작에는 영향 없음
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
export const consumePurchase = (purchaseToken) => inAppPurchaseService.consumePurchase(purchaseToken);
export const consumeUnconsumedPointPurchases = () => inAppPurchaseService.consumeUnconsumedPointPurchases();
