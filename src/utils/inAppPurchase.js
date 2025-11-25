import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';
import { doc, addDoc, collection, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Billing 플러그인 등록
const Billing = registerPlugin('Billing', {
  web: () => import('./billing.web').then(m => new m.BillingWeb()),
});

// 상품 ID 정의
// 일회성 제품: 언더스코어 사용 (points_100)
// 구독 제품: 하이픈 사용 (monthly-premium)
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
    if (!this.isAvailable) {
      console.log('인앱 결제는 네이티브 플랫폼에서만 사용 가능합니다.');
      return false;
    }

    try {
      const result = await Billing.initialize();
      if (result.success) {
        this.isInitialized = true;
        console.log('인앱 결제 초기화 완료');
        return true;
      } else {
        console.error('인앱 결제 초기화 실패');
        return false;
      }
    } catch (error) {
      console.error('인앱 결제 초기화 실패:', error);
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
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      throw new Error('인앱 결제는 네이티브 플랫폼에서만 사용 가능합니다.');
    }

    try {
      const result = await Billing.purchaseProduct({
        productId: productId,
        productType: productType
      });

      if (result.purchase) {
        // 구매 완료 처리
        await this.handlePurchaseSuccess(result.purchase);
        return result.purchase;
      }

      return null;
    } catch (error) {
      console.error('구매 실패:', error);
      throw error;
    }
  }

  // 구매 완료 처리
  async handlePurchaseSuccess(purchase) {
    try {
      // 구매 확인 (acknowledge)
      if (purchase.purchaseToken && !purchase.isAcknowledged) {
        await Billing.acknowledgePurchase({
          purchaseToken: purchase.purchaseToken
        });
      }

      // 구매 내역 저장 (Firebase)
      await this.savePurchaseToFirebase(purchase);

      console.log('구매 완료 처리됨:', purchase);
    } catch (error) {
      console.error('구매 완료 처리 실패:', error);
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

  // 구독 상태 확인
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
        return subscription ? subscription.isAcknowledged : false;
      }
      return false;
    } catch (error) {
      console.error('구독 상태 확인 실패:', error);
      return false;
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
