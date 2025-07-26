/**
 * 기존 구글 로그인 사용자들의 프로필 사진 문제를 해결하는 스크립트
 */

import { listGoogleUsers, checkAndUpdateAllGoogleUserProfiles } from './updateGoogleProfileImages';

/**
 * 구글 로그인 사용자들의 프로필 사진 상태를 확인하고 보고
 */
export const checkGoogleUserProfiles = async () => {
  try {
    console.log('🔍 구글 로그인 사용자 프로필 사진 상태 확인 중...');
    
    // 구글 로그인 사용자 목록 조회
    const result = await listGoogleUsers();
    
    if (!result.success) {
      console.error('❌ 구글 사용자 목록 조회 실패:', result.message);
      return;
    }
    
    console.log(`\n📊 구글 로그인 사용자 현황:`);
    console.log(`- 총 구글 사용자 수: ${result.count}명`);
    
    // 프로필 사진 상태 분석
    let hasProfileImage = 0;
    let hasDefaultImage = 0;
    let noImage = 0;
    
    result.users.forEach(user => {
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
    const updateResult = await checkAndUpdateAllGoogleUserProfiles();
    
    if (updateResult.success) {
      console.log(`\n📋 업데이트 대상: ${updateResult.targetCount || 0}명`);
      console.log(`💡 ${updateResult.message}`);
    }
    
    console.log('\n✅ 구글 사용자 프로필 상태 확인 완료!');
    
  } catch (error) {
    console.error('❌ 구글 사용자 프로필 확인 실패:', error);
  }
};

/**
 * 개발자용: 브라우저 콘솔에서 실행할 수 있는 함수들
 */
if (typeof window !== 'undefined') {
  // 브라우저 환경에서만 전역 함수로 등록
  window.checkGoogleProfiles = checkGoogleUserProfiles;
  window.listGoogleUsers = listGoogleUsers;
  window.checkAndUpdateAllGoogleUserProfiles = checkAndUpdateAllGoogleUserProfiles;
  
  console.log('🔧 구글 프로필 관련 유틸리티 함수들이 등록되었습니다:');
  console.log('- checkGoogleProfiles(): 구글 사용자 프로필 상태 확인');
  console.log('- listGoogleUsers(): 구글 사용자 목록 조회');
  console.log('- checkAndUpdateAllGoogleUserProfiles(): 업데이트 대상 확인');
} 