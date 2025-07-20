/**
 * 포인트 일괄 지급 실행 스크립트
 * 
 * 브라우저 콘솔에서 바로 실행할 수 있는 스크립트
 * 기존 Firebase 사용자들에게 포인트를 일괄 지급
 */

import { givePointsToAllUsers, getPointsStatistics } from './bulkPointUpdate';

/**
 * 모든 기존 사용자에게 500포인트 지급 (메인 함수)
 */
export const runPointUpdate = async () => {
  console.log('🚀 포인트 일괄 지급 시작...');
  
  try {
    // 1. 현재 포인트 통계 확인
    console.log('📊 현재 포인트 통계 확인 중...');
    const beforeStats = await getPointsStatistics();
    console.log('지급 전 통계:', beforeStats);
    
    // 2. 포인트가 없는 사용자들에게 500포인트 지급
    console.log('💰 포인트 지급 중...');
    const result = await givePointsToAllUsers(500, '기본 포인트 지급');
    console.log('지급 결과:', result);
    
    // 3. 지급 후 통계 확인
    console.log('📊 지급 후 포인트 통계 확인 중...');
    const afterStats = await getPointsStatistics();
    console.log('지급 후 통계:', afterStats);
    
    // 4. 결과 요약
    const summary = {
      totalUsers: result.total,
      usersWithPointsBefore: beforeStats.usersWithPoints,
      usersWithPointsAfter: afterStats.usersWithPoints,
      pointsGiven: result.success * 500,
      successCount: result.success,
      failedCount: result.failed
    };
    
    console.log('✅ 포인트 일괄 지급 완료!');
    console.log('📋 결과 요약:', summary);
    
    return {
      success: true,
      result,
      beforeStats,
      afterStats,
      summary
    };
    
  } catch (error) {
    console.error('❌ 포인트 일괄 지급 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 브라우저 콘솔에서 바로 실행할 수 있는 함수
 * 개발자 도구 콘솔에서 runPointUpdate() 호출
 */
if (typeof window !== 'undefined') {
  window.runPointUpdate = runPointUpdate;
  console.log('🎯 포인트 일괄 지급 함수가 준비되었습니다!');
  console.log('💡 브라우저 콘솔에서 runPointUpdate() 를 호출하세요.');
}

export default runPointUpdate; 