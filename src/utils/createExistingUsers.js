/**
 * 기존 Firebase Authentication 사용자들을 Firestore에 생성하는 스크립트
 * 
 * Firebase 콘솔에서 확인한 5명의 사용자 정보를 바탕으로
 * Firestore users 컬렉션에 동기화
 */

import { createManualUser } from './syncAuthUsers';

/**
 * Firebase 콘솔에서 확인한 기존 사용자 데이터
 * Authentication에 가입된 5명의 사용자 정보
 */
const existingAuthUsers = [
  {
    uid: 'sTNdHQGHiSM6d5KGrQBkOTSuA2g2', // 실제 UID로 교체 필요
    email: 'acho180201@naver.com',
    displayName: 'acho180201',
    point: 500,
    authProvider: 'password',
    emailVerified: true,
    createdAt: new Date('2025-07-04'),
    lastLoginAt: new Date('2025-07-04')
  },
  {
    uid: 'QyYqrG9Sz4XDf5QxhgPmEqyf5BG2', // 실제 UID로 교체 필요
    email: '20kyi@naver.com',
    displayName: '20kyi',
    point: 500,
    authProvider: 'password',
    emailVerified: true,
    createdAt: new Date('2025-07-01'),
    lastLoginAt: new Date('2025-07-16')
  },
  {
    uid: 'DHd8TQojuHPBXMSBWuUbjSMma5t2', // 실제 UID로 교체 필요
    email: 'acho1821@gmail.com',
    displayName: 'acho1821',
    point: 500,
    authProvider: 'google.com',
    emailVerified: true,
    createdAt: new Date('2025-06-20'),
    lastLoginAt: new Date('2025-07-15')
  },
  {
    uid: 'KQnHgTGuBtXXJRM0ih6LWzqw9UJ2', // 실제 UID로 교체 필요
    email: 'hyejin@sungkyul.ac.kr',
    displayName: 'hyejin',
    point: 500,
    authProvider: 'google.com',
    emailVerified: true,
    createdAt: new Date('2025-06-20'),
    lastLoginAt: new Date('2025-06-20')
  },
  {
    uid: 'R3COmbg8u3V3pq7aBGsLERAFwO23', // 실제 UID로 교체 필요
    email: '0521kimyi@gmail.com',
    displayName: '0521kimyi',
    point: 500,
    authProvider: 'google.com',
    emailVerified: true,
    createdAt: new Date('2025-06-20'),
    lastLoginAt: new Date('2025-07-16')
  }
];

/**
 * 실제 UID를 사용한 기존 사용자 데이터
 * Firebase 콘솔에서 각 사용자의 실제 UID를 확인하여 입력
 */
const existingAuthUsersWithRealUIDs = [
  {
    uid: 'sTNdHQGHiSM6d5KGrQBkOTSuA2g2', // 실제 UID (예시)
    email: 'acho180201@naver.com',
    displayName: 'acho180201',
    point: 500,
    authProvider: 'password',
    emailVerified: true,
    createdAt: new Date('2025-07-04'),
    lastLoginAt: new Date('2025-07-04')
  },
  {
    uid: 'QyYqrG9Sz4XDf5QxhgPmEqyf5BG2', // 실제 UID (예시)
    email: '20kyi@naver.com',
    displayName: '20kyi',
    point: 500,
    authProvider: 'password',
    emailVerified: true,
    createdAt: new Date('2025-07-01'),
    lastLoginAt: new Date('2025-07-16')
  },
  {
    uid: 'DHd8TQojuHPBXMSBWuUbjSMma5t2', // 실제 UID로 교체 필요
    email: 'acho1821@gmail.com',
    displayName: 'acho1821',
    point: 500,
    authProvider: 'google.com',
    emailVerified: true,
    createdAt: new Date('2025-06-20'),
    lastLoginAt: new Date('2025-07-15')
  },
  {
    uid: 'KQnHgTGuBtXXJRM0ih6LWzqw9UJ2', // 실제 UID로 교체 필요
    email: 'hyejin@sungkyul.ac.kr',
    displayName: 'hyejin',
    point: 500,
    authProvider: 'google.com',
    emailVerified: true,
    createdAt: new Date('2025-06-20'),
    lastLoginAt: new Date('2025-06-20')
  },
  {
    uid: 'R3COmbg8u3V3pq7aBGsLERAFwO23', // 실제 UID로 교체 필요
    email: '0521kimyi@gmail.com',
    displayName: '0521kimyi',
    point: 500,
    authProvider: 'google.com',
    emailVerified: true,
    createdAt: new Date('2025-06-20'),
    lastLoginAt: new Date('2025-07-16')
  }
];

/**
 * 기존 사용자들을 Firestore에 일괄 생성
 * @param {Array} users - 사용자 데이터 배열
 * @returns {Promise<Object>} 생성 결과
 */
export const createExistingUsers = async (users = existingAuthUsersWithRealUIDs) => {
  const results = {
    total: users.length,
    success: 0,
    failed: 0,
    errors: [],
    skipped: 0
  };

  console.log(`🚀 ${users.length}명의 기존 사용자 생성 시작...`);

  for (const userData of users) {
    try {
      const result = await createManualUser(userData);
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
          console.log(`⏭️ 사용자 ${userData.email}은 이미 존재합니다.`);
        } else {
          results.success++;
          console.log(`✅ 사용자 ${userData.email} 생성 완료`);
        }
      } else {
        results.failed++;
        results.errors.push(`${userData.email}: ${result.error}`);
        console.error(`❌ 사용자 ${userData.email} 생성 실패:`, result.error);
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${userData.email}: ${error.message}`);
      console.error(`❌ 사용자 ${userData.email} 생성 중 오류:`, error);
    }
    
    // Firebase 요청 제한을 피하기 위한 지연
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`📊 기존 사용자 생성 완료:`);
  console.log(`  - 성공: ${results.success}명`);
  console.log(`  - 실패: ${results.failed}명`);
  console.log(`  - 건너뜀: ${results.skipped}명`);
  
  if (results.errors.length > 0) {
    console.log(`  - 오류 목록:`, results.errors);
  }

  return results;
};

/**
 * 특정 사용자만 생성
 * @param {string} email - 생성할 사용자 이메일
 * @returns {Promise<Object>} 생성 결과
 */
export const createSpecificUser = async (email) => {
  const user = existingAuthUsersWithRealUIDs.find(u => u.email === email);
  if (!user) {
    throw new Error(`사용자 ${email}을 찾을 수 없습니다.`);
  }
  
  console.log(`🎯 특정 사용자 생성: ${email}`);
  return await createManualUser(user);
};

/**
 * 이메일 목록으로 사용자 생성
 * @param {Array} emails - 생성할 사용자 이메일 배열
 * @returns {Promise<Object>} 생성 결과
 */
export const createUsersByEmails = async (emails) => {
  const users = existingAuthUsersWithRealUIDs.filter(u => emails.includes(u.email));
  if (users.length === 0) {
    throw new Error('해당하는 사용자를 찾을 수 없습니다.');
  }
  
  console.log(`📧 이메일로 사용자 생성: ${emails.join(', ')}`);
  return await createExistingUsers(users);
};

/**
 * 실제 UID를 입력받아 사용자 생성
 * @param {Object} userData - 사용자 데이터 (실제 UID 포함)
 * @returns {Promise<Object>} 생성 결과
 */
export const createUserWithRealUID = async (userData) => {
  if (!userData.uid || !userData.email) {
    throw new Error('UID와 이메일은 필수입니다.');
  }
  
  console.log(`🔑 실제 UID로 사용자 생성: ${userData.email} (${userData.uid})`);
  return await createManualUser(userData);
};

// 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.createExistingUsers = createExistingUsers;
  window.createSpecificUser = createSpecificUser;
  window.createUsersByEmails = createUsersByEmails;
  window.createUserWithRealUID = createUserWithRealUID;
  
  console.log('🎯 기존 사용자 생성 함수들이 준비되었습니다!');
  console.log('💡 사용법:');
  console.log('  - createExistingUsers() : 모든 기존 사용자 생성');
  console.log('  - createSpecificUser("email@example.com") : 특정 사용자 생성');
  console.log('  - createUsersByEmails(["email1@example.com", "email2@example.com"]) : 이메일로 사용자 생성');
  console.log('  - createUserWithRealUID({uid: "실제UID", email: "email@example.com", ...}) : 실제 UID로 사용자 생성');
  console.log('');
  console.log('⚠️ 주의: 실제 UID를 사용하려면 Firebase 콘솔에서 각 사용자의 UID를 확인하세요!');
} 