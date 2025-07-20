/**
 * Firebase Authentication 사용자를 Firestore에 동기화하는 유틸리티
 * 
 * Firebase Auth에 가입된 모든 사용자를 Firestore users 컬렉션에 자동으로 저장
 * 기존 사용자 데이터가 없는 경우에만 새로 생성
 */

import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';

/**
 * Firebase Auth에서 모든 사용자 목록 조회
 * @returns {Promise<Array>} Auth 사용자 목록
 */
export const getAllAuthUsers = async () => {
  try {
    console.log('🔍 Firebase Auth 사용자 조회 중...');
    
    // Firebase Admin SDK가 필요하므로, 대신 현재 로그인된 사용자 정보를 활용
    // 실제로는 Firebase Functions에서 Admin SDK를 사용해야 함
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('로그인이 필요합니다. 관리자 계정으로 로그인해주세요.');
    }
    
    console.log('⚠️ Firebase Auth 사용자 목록 조회는 Admin SDK가 필요합니다.');
    console.log('💡 대신 현재 로그인된 사용자 정보를 활용합니다.');
    
    return [currentUser];
  } catch (error) {
    console.error('❌ Auth 사용자 조회 실패:', error);
    throw error;
  }
};

/**
 * Firestore에 사용자 데이터 저장 (중복 방지)
 * @param {Object} authUser - Firebase Auth 사용자 객체
 * @param {number} defaultPoints - 기본 포인트 (기본값: 500)
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export const syncUserToFirestore = async (authUser, defaultPoints = 500) => {
  try {
    const userRef = doc(db, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);
    
    // 이미 Firestore에 데이터가 있으면 건너뛰기
    if (userSnap.exists()) {
      console.log(`⏭️ 사용자 ${authUser.email}은 이미 Firestore에 존재합니다.`);
      return { success: true, skipped: true, user: userSnap.data() };
    }
    
    // 새로운 사용자 데이터 생성
    const userData = {
      email: authUser.email || '',
      displayName: authUser.displayName || authUser.email?.split('@')[0] || '사용자',
      photoURL: authUser.photoURL || '',
      point: defaultPoints,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      fcmToken: '',
      reminderEnabled: false,
      reminderTime: '21:00',
      eventEnabled: true,
      marketingEnabled: true,
      isActive: true,
      // Auth 정보 추가
      authProvider: authUser.providerData[0]?.providerId || 'email',
      emailVerified: authUser.emailVerified || false
    };
    
    // Firestore에 저장
    await setDoc(userRef, userData);
    
    console.log(`✅ 사용자 ${authUser.email}을 Firestore에 동기화 완료`);
    return { success: true, skipped: false, user: userData };
    
  } catch (error) {
    console.error(`❌ 사용자 ${authUser.email} 동기화 실패:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * 현재 로그인된 사용자를 Firestore에 동기화
 * @param {number} defaultPoints - 기본 포인트
 * @returns {Promise<Object>} 동기화 결과
 */
export const syncCurrentUser = async (defaultPoints = 500) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('로그인이 필요합니다.');
    }
    
    console.log(`🔄 현재 사용자 동기화: ${currentUser.email}`);
    const result = await syncUserToFirestore(currentUser, defaultPoints);
    
    return {
      success: result.success,
      user: currentUser,
      firestoreData: result.user,
      skipped: result.skipped
    };
    
  } catch (error) {
    console.error('❌ 현재 사용자 동기화 실패:', error);
    throw error;
  }
};

/**
 * 수동으로 사용자 데이터 생성 (테스트용)
 * @param {Object} userData - 사용자 데이터
 * @returns {Promise<boolean>} 생성 성공 여부
 */
export const createManualUser = async (userData) => {
  try {
    const { uid, ...userInfo } = userData;
    
    // 필수 필드 확인
    if (!uid || !userInfo.email) {
      throw new Error('uid와 email은 필수입니다.');
    }
    
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log(`⏭️ 사용자 ${userInfo.email}은 이미 존재합니다.`);
      return { success: true, skipped: true };
    }
    
    // 기본값 설정
    const fullUserData = {
      ...userInfo,
      point: userInfo.point || 500,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      fcmToken: userInfo.fcmToken || '',
      reminderEnabled: userInfo.reminderEnabled || false,
      reminderTime: userInfo.reminderTime || '21:00',
      eventEnabled: userInfo.eventEnabled !== false,
      marketingEnabled: userInfo.marketingEnabled !== false,
      isActive: userInfo.isActive !== false,
      authProvider: userInfo.authProvider || 'email',
      emailVerified: userInfo.emailVerified || false
    };
    
    await setDoc(userRef, fullUserData);
    
    console.log(`✅ 수동 사용자 생성 완료: ${userInfo.email}`);
    return { success: true, skipped: false };
    
  } catch (error) {
    console.error('❌ 수동 사용자 생성 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 샘플 사용자 데이터로 테스트
 * @returns {Promise<Object>} 테스트 결과
 */
export const createTestUsers = async () => {
  const testUsers = [
    {
      uid: 'test_user_1',
      email: 'test1@example.com',
      displayName: '테스트 사용자 1',
      point: 500
    },
    {
      uid: 'test_user_2', 
      email: 'test2@example.com',
      displayName: '테스트 사용자 2',
      point: 500
    },
    {
      uid: 'test_user_3',
      email: 'test3@example.com', 
      displayName: '테스트 사용자 3',
      point: 500
    }
  ];
  
  const results = {
    total: testUsers.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  console.log('🧪 테스트 사용자 생성 시작...');
  
  for (const userData of testUsers) {
    const result = await createManualUser(userData);
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`${userData.email}: ${result.error}`);
    }
  }
  
  console.log(`📊 테스트 사용자 생성 완료: 성공 ${results.success}명, 실패 ${results.failed}명`);
  return results;
};

/**
 * Firestore users 컬렉션 현황 조회
 * @returns {Promise<Object>} 현황 통계
 */
export const getUsersCollectionStatus = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    const stats = {
      totalUsers: users.length,
      usersWithEmail: users.filter(u => u.email).length,
      usersWithPoints: users.filter(u => u.point && u.point > 0).length,
      usersWithoutPoints: users.filter(u => !u.point || u.point === 0).length,
      averagePoints: users.length > 0 ? 
        Math.round(users.reduce((sum, u) => sum + (u.point || 0), 0) / users.length) : 0,
      recentUsers: users.filter(u => {
        const createdAt = u.createdAt?.toDate?.() || new Date(u.createdAt);
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdAt > oneWeekAgo;
      }).length
    };
    
    console.log('📊 Firestore users 컬렉션 현황:', stats);
    return { stats, users };
    
  } catch (error) {
    console.error('❌ users 컬렉션 현황 조회 실패:', error);
    throw error;
  }
};

// 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.syncCurrentUser = syncCurrentUser;
  window.createTestUsers = createTestUsers;
  window.getUsersCollectionStatus = getUsersCollectionStatus;
  console.log('🎯 사용자 동기화 함수들이 준비되었습니다!');
  console.log('💡 사용법:');
  console.log('  - syncCurrentUser() : 현재 사용자 동기화');
  console.log('  - createTestUsers() : 테스트 사용자 생성');
  console.log('  - getUsersCollectionStatus() : users 컬렉션 현황 조회');
} 