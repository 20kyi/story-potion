/**
 * 구글 로그인 사용자들의 프로필 사진을 복구하는 유틸리티
 */

import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc,
  query,
  where
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

/**
 * 구글 로그인 사용자들의 프로필 사진을 복구
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateGoogleUserProfileImages = async () => {
  try {
    console.log('🔍 구글 로그인 사용자 조회 중...');
    
    // 구글 로그인 사용자들 조회 (authProvider가 'google.com'인 사용자)
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('authProvider', '==', 'google.com')
    );
    
    const snapshot = await getDocs(q);
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${users.length}명의 구글 로그인 사용자를 찾았습니다.`);
    
    if (users.length === 0) {
      return { success: true, updatedCount: 0, message: '구글 로그인 사용자가 없습니다.' };
    }
    
    let updatedCount = 0;
    
    // 각 사용자의 프로필 사진 확인 및 업데이트
    for (const user of users) {
      try {
        // 현재 Firebase Auth에서 사용자 정보 가져오기
        const currentUser = auth.currentUser;
        
        // 현재 로그인한 사용자가 아니면 건너뛰기 (보안상의 이유)
        if (!currentUser || currentUser.uid !== user.uid) {
          console.log(`⏭️ 사용자 ${user.email}은 현재 로그인하지 않았습니다. 건너뜁니다.`);
          continue;
        }
        
        // 구글에서 가져온 프로필 사진이 있고, 현재 저장된 사진이 기본 이미지인 경우
        if (currentUser.photoURL && 
            currentUser.photoURL !== process.env.PUBLIC_URL + '/default-profile.svg' &&
            (!user.photoURL || user.photoURL === process.env.PUBLIC_URL + '/default-profile.svg')) {
          
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            photoURL: currentUser.photoURL,
            updatedAt: new Date()
          });
          
          console.log(`✅ 사용자 ${user.email}의 프로필 사진 업데이트 완료`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ 사용자 ${user.email} 업데이트 실패:`, error);
      }
    }
    
    console.log(`✅ ${updatedCount}명의 사용자 프로필 사진 업데이트 완료!`);
    
    return { 
      success: true, 
      updatedCount: updatedCount, 
      message: `${updatedCount}명의 구글 사용자 프로필 사진이 업데이트되었습니다.` 
    };
    
  } catch (error) {
    console.error('❌ 구글 사용자 프로필 사진 업데이트 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '구글 사용자 프로필 사진 업데이트에 실패했습니다.' 
    };
  }
};

/**
 * 모든 구글 로그인 사용자의 프로필 정보를 확인하고 업데이트
 * @returns {Promise<Object>} 업데이트 결과
 */
export const checkAndUpdateAllGoogleUserProfiles = async () => {
  try {
    console.log('🔍 모든 구글 로그인 사용자 프로필 정보 확인 중...');
    
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('authProvider', '==', 'google.com')
    );
    
    const snapshot = await getDocs(q);
    const users = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      // photoURL이 비어있거나 기본 이미지인 경우
      if (!userData.photoURL || userData.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
        users.push({
          uid: doc.id,
          ...userData
        });
      }
    });
    
    console.log(`✅ ${users.length}명의 구글 사용자가 업데이트 대상입니다.`);
    
    if (users.length === 0) {
      return { success: true, updatedCount: 0, message: '모든 구글 사용자가 이미 프로필 사진을 가지고 있습니다.' };
    }
    
    return { 
      success: true, 
      targetCount: users.length, 
      message: `${users.length}명의 구글 사용자가 업데이트 대상입니다. 이 사용자들은 다음 로그인 시 프로필 사진이 자동으로 업데이트됩니다.` 
    };
    
  } catch (error) {
    console.error('❌ 구글 사용자 프로필 확인 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '구글 사용자 프로필 확인에 실패했습니다.' 
    };
  }
};

/**
 * 개발자용: 구글 로그인 사용자 목록 출력
 * @returns {Promise<Object>} 사용자 목록
 */
export const listGoogleUsers = async () => {
  try {
    console.log('🔍 구글 로그인 사용자 목록 조회 중...');
    
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('authProvider', '==', 'google.com')
    );
    
    const snapshot = await getDocs(q);
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${users.length}명의 구글 로그인 사용자를 찾았습니다.`);
    
    // 사용자 정보 출력 (개발용)
    users.forEach(user => {
      console.log(`- ${user.email}: photoURL = ${user.photoURL || '없음'}`);
    });
    
    return { 
      success: true, 
      count: users.length, 
      users: users,
      message: `${users.length}명의 구글 로그인 사용자를 찾았습니다.` 
    };
    
  } catch (error) {
    console.error('❌ 구글 사용자 목록 조회 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '구글 사용자 목록 조회에 실패했습니다.' 
    };
  }
}; 