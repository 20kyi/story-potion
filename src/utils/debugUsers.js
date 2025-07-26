/**
 * Firestore 사용자 현황 디버깅 유틸리티
 * 
 * 현재 Firestore에 있는 사용자들과 생성되지 않은 사용자들을 확인
 * 문제 원인을 파악하고 해결 방법 제시
 */

import { auth, db } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

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
 * 모든 사용자의 프로필 사진 상태를 확인
 */
export const checkAllUserProfiles = async () => {
  try {
    console.log('🔍 모든 사용자 프로필 사진 상태 확인 중...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ 총 ${users.length}명의 사용자를 확인했습니다.`);
    
    // 구글 사용자와 일반 사용자 분류
    const googleUsers = users.filter(user => 
      user.authProvider === 'google.com' || 
      (user.email && user.email.includes('@gmail.com'))
    );
    
    const regularUsers = users.filter(user => 
      user.authProvider !== 'google.com' && 
      (!user.email || !user.email.includes('@gmail.com'))
    );
    
    console.log(`\n📊 사용자 분류:`);
    console.log(`- 구글 사용자: ${googleUsers.length}명`);
    console.log(`- 일반 사용자: ${regularUsers.length}명`);
    
    // 구글 사용자 프로필 사진 상태 분석
    let googleHasProfile = 0;
    let googleHasDefault = 0;
    let googleNoImage = 0;
    
    googleUsers.forEach(user => {
      if (user.photoURL && user.photoURL !== process.env.PUBLIC_URL + '/default-profile.svg') {
        googleHasProfile++;
      } else if (user.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
        googleHasDefault++;
      } else {
        googleNoImage++;
      }
    });
    
    console.log(`\n📸 구글 사용자 프로필 사진 상태:`);
    console.log(`- 프로필 사진 있음: ${googleHasProfile}명`);
    console.log(`- 기본 이미지: ${googleHasDefault}명`);
    console.log(`- 이미지 없음: ${googleNoImage}명`);
    
    // 문제가 있는 구글 사용자 목록
    const problematicGoogleUsers = googleUsers.filter(user => 
      !user.photoURL || user.photoURL === process.env.PUBLIC_URL + '/default-profile.svg'
    );
    
    if (problematicGoogleUsers.length > 0) {
      console.log(`\n⚠️ 프로필 사진 문제가 있는 구글 사용자:`);
      problematicGoogleUsers.forEach(user => {
        console.log(`- ${user.email}: photoURL = ${user.photoURL || '없음'}`);
      });
    }
    
    return {
      success: true,
      totalUsers: users.length,
      googleUsers: googleUsers.length,
      regularUsers: regularUsers.length,
      problematicGoogleUsers: problematicGoogleUsers.length,
      message: `${users.length}명의 사용자 중 ${googleUsers.length}명이 구글 사용자이고, ${problematicGoogleUsers.length}명의 구글 사용자에게 프로필 사진 문제가 있습니다.`
    };
    
  } catch (error) {
    console.error('❌ 사용자 프로필 확인 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '사용자 프로필 확인에 실패했습니다.' 
    };
  }
};

/**
 * 구글 사용자들의 프로필 사진을 수동으로 복구
 */
export const fixGoogleUserProfiles = async () => {
  try {
    console.log('🔧 구글 사용자 프로필 사진 복구 시작...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    // 구글 사용자 식별
    const googleUsers = users.filter(user => 
      user.authProvider === 'google.com' || 
      (user.email && user.email.includes('@gmail.com'))
    );
    
    console.log(`🔍 ${googleUsers.length}명의 구글 사용자를 찾았습니다.`);
    
    let updatedCount = 0;
    let authProviderUpdated = 0;
    
    for (const user of googleUsers) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const updateData = { updatedAt: new Date() };
        let needsUpdate = false;
        
        // authProvider 필드가 없으면 추가
        if (!user.authProvider) {
          updateData.authProvider = 'google.com';
          authProviderUpdated++;
          needsUpdate = true;
          console.log(`✅ 사용자 ${user.email}의 authProvider를 'google.com'으로 설정`);
        }
        
        // 프로필 사진이 기본 이미지이거나 없는 경우
        if (!user.photoURL || user.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
          // 현재 Firebase Auth에서 사용자 정보 가져오기
          const currentUser = auth.currentUser;
          
          if (currentUser && currentUser.uid === user.uid && currentUser.photoURL) {
            updateData.photoURL = currentUser.photoURL;
            needsUpdate = true;
            console.log(`✅ 사용자 ${user.email}의 프로필 사진 업데이트 완료`);
          } else {
            console.log(`⏭️ 사용자 ${user.email}은 현재 로그인하지 않았거나 프로필 사진이 없습니다.`);
          }
        }
        
        if (needsUpdate) {
          await updateDoc(userRef, updateData);
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`❌ 사용자 ${user.email} 업데이트 실패:`, error);
      }
    }
    
    console.log(`\n✅ 구글 사용자 프로필 복구 완료!`);
    console.log(`- 총 업데이트된 사용자: ${updatedCount}명`);
    console.log(`- authProvider 설정된 사용자: ${authProviderUpdated}명`);
    
    return { 
      success: true, 
      totalGoogleUsers: googleUsers.length,
      updatedCount: updatedCount,
      authProviderUpdated: authProviderUpdated,
      message: `${googleUsers.length}명의 구글 사용자 중 ${updatedCount}명의 프로필이 업데이트되었습니다.` 
    };
    
  } catch (error) {
    console.error('❌ 구글 사용자 프로필 복구 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '구글 사용자 프로필 복구에 실패했습니다.' 
    };
  }
};

/**
 * 개발자용: 브라우저 콘솔에서 실행할 수 있는 함수들
 */
if (typeof window !== 'undefined') {
  // 브라우저 환경에서만 전역 함수로 등록
  window.getAllFirestoreUsers = getAllFirestoreUsers;
  window.checkUserExists = checkUserExists;
  window.checkAllUserProfiles = checkAllUserProfiles;
  window.fixGoogleUserProfiles = fixGoogleUserProfiles;
  
  console.log('🔧 사용자 디버깅 도구가 등록되었습니다:');
  console.log('- getAllFirestoreUsers(): 모든 Firestore 사용자 조회');
  console.log('- checkUserExists(uid): 특정 사용자 존재 여부 확인');
  console.log('- checkAllUserProfiles(): 모든 사용자 프로필 상태 확인');
  console.log('- fixGoogleUserProfiles(): 구글 사용자 프로필 사진 복구');
} 