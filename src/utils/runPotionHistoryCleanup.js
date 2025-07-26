import { deleteAllPotionUsageHistory, getPotionUsageHistoryStats } from './deletePotionUsageHistory.js';

/**
 * 포션 사용 내역 정리 실행 스크립트
 * 
 * 사용법:
 * 1. 먼저 통계를 확인: await checkPotionUsageStats()
 * 2. 삭제 실행: await cleanupPotionUsageHistory()
 */

// 포션 사용 내역 통계 확인
export const checkPotionUsageStats = async () => {
  console.log('📊 포션 사용 내역 통계 확인 중...');
  try {
    const stats = await getPotionUsageHistoryStats();
    console.log('✅ 통계 확인 완료');
    return stats;
  } catch (error) {
    console.error('❌ 통계 확인 실패:', error);
    throw error;
  }
};

// 포션 사용 내역 삭제 실행
export const cleanupPotionUsageHistory = async () => {
  console.log('🧹 포션 사용 내역 정리 시작...');
  try {
    const result = await deleteAllPotionUsageHistory();
    console.log('✅ 포션 사용 내역 정리 완료');
    return result;
  } catch (error) {
    console.error('❌ 포션 사용 내역 정리 실패:', error);
    throw error;
  }
};

// 전체 프로세스 실행 (통계 확인 후 삭제)
export const runFullCleanup = async () => {
  console.log('🚀 포션 사용 내역 전체 정리 프로세스 시작');
  
  try {
    // 1. 먼저 통계 확인
    console.log('\n📊 1단계: 현재 포션 사용 내역 통계 확인');
    const stats = await checkPotionUsageStats();
    
    if (stats.totalPotionUsage === 0) {
      console.log('✅ 삭제할 포션 사용 내역이 없습니다.');
      return { stats, deleted: { processedUsers: 0, totalDeleted: 0 } };
    }
    
    // 2. 삭제 실행
    console.log('\n🧹 2단계: 포션 사용 내역 삭제 실행');
    const deleted = await cleanupPotionUsageHistory();
    
    // 3. 삭제 후 통계 확인
    console.log('\n📊 3단계: 삭제 후 통계 확인');
    const afterStats = await checkPotionUsageStats();
    
    console.log('\n🎉 전체 정리 프로세스 완료!');
    console.log(`📈 삭제 전: ${stats.totalPotionUsage}개`);
    console.log(`📉 삭제 후: ${afterStats.totalPotionUsage}개`);
    console.log(`🗑️ 삭제된 내역: ${deleted.totalDeleted}개`);
    
    return { stats, deleted, afterStats };
    
  } catch (error) {
    console.error('❌ 전체 정리 프로세스 실패:', error);
    throw error;
  }
};

// 브라우저 콘솔에서 실행할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.checkPotionUsageStats = checkPotionUsageStats;
  window.cleanupPotionUsageHistory = cleanupPotionUsageHistory;
  window.runFullCleanup = runFullCleanup;
  
  // 더 간단한 함수들도 추가
  window.checkStats = checkPotionUsageStats;
  window.cleanup = cleanupPotionUsageHistory;
  window.cleanupAll = runFullCleanup;
  
  console.log('🔧 포션 사용 내역 정리 함수가 전역으로 등록되었습니다.');
  console.log('사용법:');
  console.log('- checkStats() : 통계 확인');
  console.log('- cleanup() : 삭제 실행');
  console.log('- cleanupAll() : 전체 프로세스 실행');
  console.log('');
  console.log('또는 await를 사용:');
  console.log('- await checkPotionUsageStats() : 통계 확인');
  console.log('- await cleanupPotionUsageHistory() : 삭제 실행');
  console.log('- await runFullCleanup() : 전체 프로세스 실행');
} 