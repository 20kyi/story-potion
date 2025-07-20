/**
 * Firestore 사용자 현황 디버깅 유틸리티
 * 
 * 현재 Firestore에 있는 사용자들과 생성되지 않은 사용자들을 확인
 * 문제 원인을 파악하고 해결 방법 제시
 */

import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Firestore users 컬렉션의 모든 사용자 조회
 * @returns {Promise<Array>} 사용자 목록
 */
export const getAllFirestoreUsers = async () => {
  try {
    console.log('🔍 Firestore users 컬렉션 조회 중...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ Firestore에서 ${users.length}명의 사용자를 찾았습니다.`);
    return users;
  } catch (error) {
    console.error('❌ Firestore 사용자 조회 실패:', error);
    throw error;
  }
};

/**
 * 특정 UID의 사용자 존재 여부 확인
 * @param {string} uid - 확인할 사용자 UID
 * @returns {Promise<Object>} 사용자 정보 또는 null
 */
export const checkUserExists = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log(`✅ 사용자 ${uid} 존재함`);
      return { exists: true, data: userSnap.data() };
    } else {
      console.log(`❌ 사용자 ${uid} 존재하지 않음`);
      return { exists: false, data: null };
    }
  } catch (error) {
    console.error(`❌ 사용자 ${uid} 확인 중 오류:`, error);
    return { exists: false, error: error.message };
  }
};

/**
 * Firebase Auth 사용자 목록과 Firestore 사용자 목록 비교
 * @returns {Promise<Object>} 비교 결과
 */
export const compareAuthAndFirestore = async () => {
  // Firebase Auth 사용자 목록 (Firebase 콘솔에서 확인한 정보)
  const authUsers = [
    { uid: 'acho180201@naver.com_uid', email: 'acho180201@naver.com', displayName: 'acho180201' },
    { uid: '20kyi@naver.com_uid', email: '20kyi@naver.com', displayName: '20kyi' },
    { uid: 'acho1821@gmail.com_uid', email: 'acho1821@gmail.com', displayName: 'acho1821' },
    { uid: 'hyejin@sungkyul.ac.kr_uid', email: 'hyejin@sungkyul.ac.kr', displayName: 'hyejin' },
    { uid: '0521kimyi@gmail.com_uid', email: '0521kimyi@gmail.com', displayName: '0521kimyi' }
  ];

  // 실제 UID (예시 - 실제로는 Firebase 콘솔에서 확인 필요)
  const authUsersWithRealUIDs = [
    { uid: 'QyYqrG9Sz4XDf5QxhgPmEqyf5BG2', email: 'acho180201@naver.com', displayName: 'acho180201' },
    { uid: 'R3C0mbg8u3V3pq7aBGsLERAFw023', email: '20kyi@naver.com', displayName: '20kyi' },
    { uid: 'user3_uid', email: 'acho1821@gmail.com', displayName: 'acho1821' },
    { uid: 'user4_uid', email: 'hyejin@sungkyul.ac.kr', displayName: 'hyejin' },
    { uid: 'user5_uid', email: '0521kimyi@gmail.com', displayName: '0521kimyi' }
  ];

  try {
    // Firestore 사용자 목록 조회
    const firestoreUsers = await getAllFirestoreUsers();
    
    const comparison = {
      authUsers: authUsersWithRealUIDs,
      firestoreUsers: firestoreUsers,
      missingUsers: [],
      existingUsers: [],
      errors: []
    };

    // 각 Auth 사용자에 대해 Firestore 존재 여부 확인
    for (const authUser of authUsersWithRealUIDs) {
      const checkResult = await checkUserExists(authUser.uid);
      
      if (checkResult.exists) {
        comparison.existingUsers.push({
          ...authUser,
          firestoreData: checkResult.data
        });
      } else {
        comparison.missingUsers.push({
          ...authUser,
          error: checkResult.error
        });
      }
    }

    // 결과 출력
    console.log('📊 Auth vs Firestore 비교 결과:');
    console.log(`  - Auth 사용자: ${comparison.authUsers.length}명`);
    console.log(`  - Firestore 사용자: ${comparison.firestoreUsers.length}명`);
    console.log(`  - 존재하는 사용자: ${comparison.existingUsers.length}명`);
    console.log(`  - 누락된 사용자: ${comparison.missingUsers.length}명`);
    
    if (comparison.missingUsers.length > 0) {
      console.log('❌ 누락된 사용자들:');
      comparison.missingUsers.forEach(user => {
        console.log(`    - ${user.email} (UID: ${user.uid})`);
        if (user.error) {
          console.log(`      오류: ${user.error}`);
        }
      });
    }

    if (comparison.existingUsers.length > 0) {
      console.log('✅ 존재하는 사용자들:');
      comparison.existingUsers.forEach(user => {
        console.log(`    - ${user.email} (UID: ${user.uid})`);
      });
    }

    return comparison;

  } catch (error) {
    console.error('❌ 비교 중 오류:', error);
    throw error;
  }
};

/**
 * 특정 이메일로 사용자 검색
 * @param {string} email - 검색할 이메일
 * @returns {Promise<Object>} 검색 결과
 */
export const findUserByEmail = async (email) => {
  try {
    const firestoreUsers = await getAllFirestoreUsers();
    const user = firestoreUsers.find(u => u.email === email);
    
    if (user) {
      console.log(`✅ 이메일 ${email}으로 사용자 찾음:`, user);
      return { found: true, user };
    } else {
      console.log(`❌ 이메일 ${email}으로 사용자를 찾을 수 없음`);
      return { found: false, user: null };
    }
  } catch (error) {
    console.error(`❌ 이메일 ${email} 검색 중 오류:`, error);
    return { found: false, error: error.message };
  }
};

/**
 * 문제 진단 및 해결 방법 제시
 * @returns {Promise<Object>} 진단 결과
 */
export const diagnoseUserIssues = async () => {
  try {
    console.log('🔍 사용자 문제 진단 시작...');
    
    const comparison = await compareAuthAndFirestore();
    
    const diagnosis = {
      issues: [],
      solutions: [],
      recommendations: []
    };

    // 누락된 사용자가 있는 경우
    if (comparison.missingUsers.length > 0) {
      diagnosis.issues.push(`${comparison.missingUsers.length}명의 사용자가 Firestore에 없습니다.`);
      
      comparison.missingUsers.forEach(user => {
        if (user.uid.includes('_uid') || user.uid.includes('user')) {
          diagnosis.issues.push(`사용자 ${user.email}의 UID가 예시 값입니다: ${user.uid}`);
          diagnosis.solutions.push(`Firebase 콘솔에서 ${user.email}의 실제 UID를 확인하고 수동으로 생성하세요.`);
        }
      });
    }

    // Firestore에 예상보다 많은 사용자가 있는 경우
    if (comparison.firestoreUsers.length > comparison.authUsers.length) {
      diagnosis.issues.push(`Firestore에 예상보다 많은 사용자가 있습니다. (${comparison.firestoreUsers.length}명)`);
      diagnosis.recommendations.push('Firestore users 컬렉션을 확인하여 불필요한 사용자 데이터를 정리하세요.');
    }

    // 권한 문제 확인
    if (comparison.errors.length > 0) {
      diagnosis.issues.push('일부 사용자 확인 중 권한 오류가 발생했습니다.');
      diagnosis.solutions.push('Firebase 보안 규칙을 확인하고 관리자 권한으로 로그인하세요.');
    }

    // 해결 방법 제시
    if (diagnosis.issues.length === 0) {
      diagnosis.recommendations.push('모든 사용자가 정상적으로 동기화되었습니다.');
    } else {
      diagnosis.recommendations.push('관리자 페이지의 수동 사용자 생성 기능을 사용하세요.');
      diagnosis.recommendations.push('Firebase 콘솔에서 각 사용자의 실제 UID를 확인하세요.');
    }

    console.log('📋 진단 결과:');
    console.log('  문제점:', diagnosis.issues);
    console.log('  해결방법:', diagnosis.solutions);
    console.log('  권장사항:', diagnosis.recommendations);

    return diagnosis;

  } catch (error) {
    console.error('❌ 진단 중 오류:', error);
    throw error;
  }
};

// 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.getAllFirestoreUsers = getAllFirestoreUsers;
  window.checkUserExists = checkUserExists;
  window.compareAuthAndFirestore = compareAuthAndFirestore;
  window.findUserByEmail = findUserByEmail;
  window.diagnoseUserIssues = diagnoseUserIssues;
  
  console.log('🔧 사용자 디버깅 함수들이 준비되었습니다!');
  console.log('💡 사용법:');
  console.log('  - getAllFirestoreUsers() : Firestore의 모든 사용자 조회');
  console.log('  - checkUserExists("UID") : 특정 UID 사용자 존재 여부 확인');
  console.log('  - compareAuthAndFirestore() : Auth와 Firestore 사용자 비교');
  console.log('  - findUserByEmail("email@example.com") : 이메일로 사용자 검색');
  console.log('  - diagnoseUserIssues() : 문제 진단 및 해결 방법 제시');
} 