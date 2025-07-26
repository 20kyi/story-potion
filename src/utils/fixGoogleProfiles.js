/**
 * 기존 구글 로그인 사용자들의 프로필 사진 문제를 해결하는 스크립트
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
 * 구글 로그인 사용자들의 프로필 사진 상태를 확인하고 보고
 */
export const checkGoogleUserProfiles = async () => {
  try {
    console.log('🔍 구글 로그인 사용자 프로필 사진 상태 확인 중...');
    
    // 구글 로그인 사용자 목록 조회 (authProvider가 'google.com'인 사용자)
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
    
    console.log(`\n📊 구글 로그인 사용자 현황:`);
    console.log(`- 총 구글 사용자 수: ${users.length}명`);
    
    // 프로필 사진 상태 분석
    let hasProfileImage = 0;
    let hasDefaultImage = 0;
    let noImage = 0;
    
    users.forEach(user => {
      if (user.photoURL && user.photoURL !== process.env.PUBLIC_URL + '/default-profile.svg') {
        hasProfileImage++;
      } else if (user.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
        hasDefaultImage++;
      } else {
        noImage++;
      }
    });
    
    console.log(`- 프로필 사진 있음: ${hasProfileImage}명`);
    console.log(`- 기본 이미지: ${hasDefaultImage}명`);
    console.log(`- 이미지 없음: ${noImage}명`);
    
    // 업데이트 대상 확인
    const problematicUsers = users.filter(user => 
      !user.photoURL || user.photoURL === process.env.PUBLIC_URL + '/default-profile.svg'
    );
    
    console.log(`\n📋 업데이트 대상: ${problematicUsers.length}명`);
    console.log(`💡 ${problematicUsers.length}명의 구글 사용자가 프로필 사진 업데이트가 필요합니다.`);
    
    console.log('\n✅ 구글 사용자 프로필 상태 확인 완료!');
    
  } catch (error) {
    console.error('❌ 구글 사용자 프로필 확인 실패:', error);
  }
};

/**
 * 모든 사용자 중에서 구글 로그인 사용자를 식별하고 프로필 사진 복구
 * authProvider 필드가 없어도 구글 이메일 패턴으로 식별
 */
export const identifyAndFixGoogleUsers = async () => {
  try {
    console.log('🔍 모든 사용자 중 구글 로그인 사용자 식별 중...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        uid: doc.id,
        ...userData
      });
    });
    
    console.log(`✅ 총 ${users.length}명의 사용자를 확인했습니다.`);
    
    // 구글 사용자 식별 (authProvider가 'google.com'이거나 구글 이메일 패턴)
    const googleUsers = users.filter(user => {
      return user.authProvider === 'google.com' || 
             (user.email && user.email.includes('@gmail.com'));
    });
    
    console.log(`🔍 구글 사용자로 식별된 사용자: ${googleUsers.length}명`);
    
    let updatedCount = 0;
    
    for (const user of googleUsers) {
      try {
        // authProvider 필드가 없으면 추가
        if (!user.authProvider) {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            authProvider: 'google.com',
            updatedAt: new Date()
          });
          console.log(`✅ 사용자 ${user.email}의 authProvider를 'google.com'으로 설정`);
        }
        
        // 프로필 사진이 기본 이미지이거나 없는 경우 구글에서 가져온 사진으로 업데이트
        if (!user.photoURL || user.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
          // 현재 Firebase Auth에서 사용자 정보 가져오기
          const currentUser = auth.currentUser;
          
          if (currentUser && currentUser.uid === user.uid && currentUser.photoURL) {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
              photoURL: currentUser.photoURL,
              updatedAt: new Date()
            });
            
            console.log(`✅ 사용자 ${user.email}의 프로필 사진 업데이트 완료`);
            updatedCount++;
          } else {
            console.log(`⏭️ 사용자 ${user.email}은 현재 로그인하지 않았거나 프로필 사진이 없습니다.`);
          }
        }
      } catch (error) {
        console.error(`❌ 사용자 ${user.email} 업데이트 실패:`, error);
      }
    }
    
    console.log(`✅ ${updatedCount}명의 구글 사용자 프로필 사진 업데이트 완료!`);
    
    return { 
      success: true, 
      totalGoogleUsers: googleUsers.length,
      updatedCount: updatedCount, 
      message: `${googleUsers.length}명의 구글 사용자 중 ${updatedCount}명의 프로필 사진이 업데이트되었습니다.` 
    };
    
  } catch (error) {
    console.error('❌ 구글 사용자 식별 및 복구 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '구글 사용자 식별 및 복구에 실패했습니다.' 
    };
  }
};

/**
 * 개발자용: 브라우저 콘솔에서 실행할 수 있는 함수들
 */
if (typeof window !== 'undefined') {
  // 브라우저 환경에서만 전역 함수로 등록
  window.checkGoogleProfiles = checkGoogleUserProfiles;
  window.identifyAndFixGoogleUsers = identifyAndFixGoogleUsers;
  
  console.log('🔧 구글 프로필 관련 유틸리티 함수들이 등록되었습니다:');
  console.log('- checkGoogleProfiles(): 구글 사용자 프로필 상태 확인');
  console.log('- identifyAndFixGoogleUsers(): 구글 사용자 식별 및 프로필 사진 복구');
} 