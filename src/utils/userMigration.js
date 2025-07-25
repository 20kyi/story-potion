/**
 * 사용자 데이터 마이그레이션 유틸리티
 * 
 * 기존 사용자 데이터를 Firebase Firestore에 일괄 저장하는 도구
 * 로컬 스토리지나 다른 소스에서 사용자 정보를 가져와서 Firestore에 저장
 */

import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  addDoc,
  Timestamp,
  orderBy,
  startAfter,
  limit
} from 'firebase/firestore';

/**
 * 샘플 사용자 데이터 생성 함수
 * @param {number} count - 생성할 사용자 수
 * @returns {Array} 사용자 데이터 배열
 */
export const generateSampleUsers = (count = 10) => {
  const users = [];
  const sampleNames = [
    '김철수', '이영희', '박민수', '정수진', '최동욱',
    '한미영', '송태호', '윤서연', '임재현', '강지은',
    '조현우', '백소영', '남기준', '오하나', '신동현'
  ];

  const sampleEmails = [
    'user1@example.com', 'user2@example.com', 'user3@example.com',
    'user4@example.com', 'user5@example.com', 'user6@example.com',
    'user7@example.com', 'user8@example.com', 'user9@example.com',
    'user10@example.com', 'user11@example.com', 'user12@example.com',
    'user13@example.com', 'user14@example.com', 'user15@example.com'
  ];

  for (let i = 0; i < count; i++) {
    const userId = `sample_user_${i + 1}`;
    const user = {
      uid: userId,
      displayName: sampleNames[i % sampleNames.length],
      email: sampleEmails[i % sampleEmails.length],
      photoURL: '', // 기본 프로필 이미지 URL
      point: Math.floor(Math.random() * 1000) + 100, // 100-1100 포인트
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 최근 30일 내
      fcmToken: '', // FCM 토큰은 실제 디바이스에서 생성
      reminderEnabled: Math.random() > 0.5, // 50% 확률로 알림 활성화
      reminderTime: '21:00', // 기본 알림 시간
      eventEnabled: Math.random() > 0.3, // 70% 확률로 이벤트 알림 활성화
      marketingEnabled: Math.random() > 0.4, // 60% 확률로 마케팅 알림 활성화
      lastLoginAt: new Date(),
      isActive: true
    };
    users.push(user);
  }

  return users;
};

/**
 * 단일 사용자 데이터를 Firestore에 저장
 * @param {Object} userData - 사용자 데이터
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export const saveUserToFirestore = async (userData) => {
  try {
    const { uid, ...userInfo } = userData;

    // 관리자 권한 확인
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('로그인이 필요합니다.');
    }

    // 메인 관리자 이메일 확인 (전체 권한 필요)
    const mainAdminEmails = [
      '0521kimyi@gmail.com'  // 메인 관리자만
    ];
    const isMainAdmin = mainAdminEmails.includes(currentUser.email);

    if (!isMainAdmin) {
      throw new Error('메인 관리자 권한이 필요합니다.');
    }

    // 사용자 기본 정보 저장
    await setDoc(doc(db, 'users', uid), {
      ...userInfo,
      createdAt: Timestamp.fromDate(userInfo.createdAt),
      lastLoginAt: Timestamp.fromDate(userInfo.lastLoginAt || new Date()),
      updatedAt: Timestamp.now()
    });

    // 포인트 히스토리 생성 (초기 포인트 적립)
    if (userInfo.point > 0) {
      await addDoc(collection(db, 'users', uid, 'pointHistory'), {
        type: 'earn',
        amount: userInfo.point,
        desc: '초기 포인트 지급',
        createdAt: Timestamp.fromDate(userInfo.createdAt)
      });
    }

    console.log(`✅ 사용자 ${userData.displayName} 저장 완료`);
    return true;
  } catch (error) {
    console.error(`❌ 사용자 ${userData.displayName} 저장 실패:`, error);
    return false;
  }
};

/**
 * 여러 사용자 데이터를 일괄 저장
 * @param {Array} users - 사용자 데이터 배열
 * @returns {Promise<Object>} 저장 결과 통계
 */
export const batchSaveUsers = async (users) => {
  const results = {
    total: users.length,
    success: 0,
    failed: 0,
    errors: []
  };

  console.log(`🚀 ${users.length}명의 사용자 데이터 저장 시작...`);

  for (const user of users) {
    const success = await saveUserToFirestore(user);
    if (success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`사용자 ${user.displayName} 저장 실패`);
    }

    // Firebase 요청 제한을 피하기 위한 지연
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`📊 저장 완료: 성공 ${results.success}명, 실패 ${results.failed}명`);
  return results;
};

/**
 * 기존 사용자 목록 조회
 * @returns {Promise<Array>} 사용자 목록
 */
export const getExistingUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    return users;
  } catch (error) {
    console.error('❌ 기존 사용자 조회 실패:', error);
    return [];
  }
};

/**
 * 페이지네이션, 정렬, 검색 지원 유저 조회
 * @param {Object} options - 쿼리 옵션 { limit, orderBy, orderDir, startAfter, where: [{field, op, value}] }
 * @returns {Promise<{users: Array, lastDoc: any}>} 사용자 목록과 마지막 문서
 */
export const getUsersWithQuery = async (options = {}) => {
  const {
    limit: pageLimit = 20,
    orderBy: orderField = 'createdAt',
    orderDir = 'desc',
    startAfter: startAfterDoc = null,
    where: whereArr = []
  } = options;
  try {
    let q = collection(db, 'users');
    let queryConstraints = [];
    // where 조건
    whereArr.forEach(cond => {
      queryConstraints.push(where(cond.field, cond.op, cond.value));
    });
    // 정렬
    if (orderField) {
      queryConstraints.push(orderBy(orderField, orderDir));
    }
    // 페이지네이션
    if (startAfterDoc) {
      queryConstraints.push(startAfter(startAfterDoc));
    }
    // limit
    if (pageLimit) {
      queryConstraints.push(limit(pageLimit));
    }
    const qFinal = query(q, ...queryConstraints);
    const snapshot = await getDocs(qFinal);
    const users = [];
    snapshot.forEach(doc => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    return { users, lastDoc };
  } catch (error) {
    console.error('❌ getUsersWithQuery 실패:', error);
    return { users: [], lastDoc: null };
  }
};

/**
 * 특정 조건의 사용자 조회
 * @param {string} field - 필드명
 * @param {string} operator - 연산자 ('==', '>', '<', etc.)
 * @param {any} value - 값
 * @returns {Promise<Array>} 조건에 맞는 사용자 목록
 */
export const getUsersByCondition = async (field, operator, value) => {
  try {
    const q = query(collection(db, 'users'), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    return users;
  } catch (error) {
    console.error('❌ 조건부 사용자 조회 실패:', error);
    return [];
  }
};

/**
 * 사용자 데이터 업데이트
 * @param {string} uid - 사용자 ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export const updateUserData = async (uid, updateData) => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...updateData,
      updatedAt: Timestamp.now()
    }, { merge: true });

    console.log(`✅ 사용자 ${uid} 업데이트 완료`);
    return true;
  } catch (error) {
    console.error(`❌ 사용자 ${uid} 업데이트 실패:`, error);
    return false;
  }
};

/**
 * 사용자 포인트 히스토리 추가
 * @param {string} uid - 사용자 ID
 * @param {Object} historyData - 포인트 히스토리 데이터
 * @returns {Promise<boolean>} 추가 성공 여부
 */
export const addPointHistory = async (uid, historyData) => {
  try {
    await addDoc(collection(db, 'users', uid, 'pointHistory'), {
      ...historyData,
      createdAt: Timestamp.now()
    });

    console.log(`✅ 사용자 ${uid} 포인트 히스토리 추가 완료`);
    return true;
  } catch (error) {
    console.error(`❌ 사용자 ${uid} 포인트 히스토리 추가 실패:`, error);
    return false;
  }
};

/**
 * 기존 프리미엄 유저에게 premiumRenewalDate를 세팅하는 migration 함수
 */
export const migratePremiumRenewalDate = async () => {
  const users = await getUsersByCondition('isMonthlyPremium', '==', true);
  const yearlyUsers = await getUsersByCondition('isYearlyPremium', '==', true);
  let updated = 0;
  for (const user of users) {
    const start = user.premiumStartDate?.seconds ? new Date(user.premiumStartDate.seconds * 1000) : new Date();
    const renewal = new Date(start);
    renewal.setMonth(start.getMonth() + 1);
    const ok = await updateUserData(user.uid, { premiumRenewalDate: renewal });
    if (ok) updated++;
  }
  for (const user of yearlyUsers) {
    const start = user.premiumStartDate?.seconds ? new Date(user.premiumStartDate.seconds * 1000) : new Date();
    const renewal = new Date(start);
    renewal.setFullYear(start.getFullYear() + 1);
    const ok = await updateUserData(user.uid, { premiumRenewalDate: renewal });
    if (ok) updated++;
  }
  console.log(`프리미엄 갱신일 마이그레이션 완료: ${updated}명 적용됨`);
  return updated;
};

// 사용 예시 함수들
export const migrationExamples = {
  // 샘플 사용자 10명 생성 및 저장
  createSampleUsers: async () => {
    const sampleUsers = generateSampleUsers(10);
    return await batchSaveUsers(sampleUsers);
  },

  // 활성 사용자만 조회
  getActiveUsers: async () => {
    return await getUsersByCondition('isActive', '==', true);
  },

  // 포인트가 500 이상인 사용자 조회
  getHighPointUsers: async () => {
    return await getUsersByCondition('point', '>=', 500);
  },

  // 알림이 활성화된 사용자 조회
  getNotificationEnabledUsers: async () => {
    return await getUsersByCondition('reminderEnabled', '==', true);
  }
}; 