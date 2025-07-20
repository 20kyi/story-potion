/**
 * 기존 사용자들에게 포인트 일괄 지급 유틸리티
 * 
 * Firebase에 이미 가입된 사용자들에게 기본 포인트를 지급하고
 * 포인트 히스토리에 적립 내역을 기록하는 도구
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  addDoc,
  Timestamp,
  increment 
} from 'firebase/firestore';

/**
 * 모든 기존 사용자 조회
 * @returns {Promise<Array>} 사용자 목록
 */
export const getAllExistingUsers = async () => {
  try {
    console.log('🔍 기존 사용자 조회 중...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${users.length}명의 사용자를 찾았습니다.`);
    return users;
  } catch (error) {
    console.error('❌ 사용자 조회 실패:', error);
    throw error;
  }
};

/**
 * 특정 사용자에게 포인트 지급
 * @param {string} uid - 사용자 ID
 * @param {number} points - 지급할 포인트
 * @param {string} reason - 지급 사유
 * @returns {Promise<boolean>} 성공 여부
 */
export const givePointsToUser = async (uid, points, reason = '기본 포인트 지급') => {
  try {
    // 1. 사용자 포인트 업데이트
    await updateDoc(doc(db, 'users', uid), {
      point: increment(points),
      updatedAt: Timestamp.now()
    });

    // 2. 포인트 히스토리에 적립 내역 추가
    await addDoc(collection(db, 'users', uid, 'pointHistory'), {
      type: 'earn',
      amount: points,
      desc: reason,
      createdAt: Timestamp.now()
    });

    console.log(`✅ 사용자 ${uid}에게 ${points}포인트 지급 완료`);
    return true;
  } catch (error) {
    console.error(`❌ 사용자 ${uid} 포인트 지급 실패:`, error);
    return false;
  }
};

/**
 * 모든 기존 사용자에게 포인트 일괄 지급
 * @param {number} points - 지급할 포인트 (기본값: 500)
 * @param {string} reason - 지급 사유
 * @returns {Promise<Object>} 결과 통계
 */
export const givePointsToAllUsers = async (points = 500, reason = '기본 포인트 지급') => {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    usersWithPoints: 0,
    usersWithoutPoints: 0
  };

  try {
    console.log(`🚀 모든 사용자에게 ${points}포인트 일괄 지급 시작...`);
    
    // 1. 모든 사용자 조회
    const users = await getAllExistingUsers();
    results.total = users.length;

    // 2. 포인트가 없는 사용자 필터링 (중복 지급 방지)
    const usersWithoutPoints = users.filter(user => !user.point || user.point === 0);
    const usersWithPoints = users.filter(user => user.point && user.point > 0);
    
    results.usersWithPoints = usersWithPoints.length;
    results.usersWithoutPoints = usersWithoutPoints.length;

    console.log(`📊 포인트 현황: ${usersWithPoints.length}명 보유, ${usersWithoutPoints.length}명 미보유`);

    // 3. 포인트가 없는 사용자들에게만 지급
    for (const user of usersWithoutPoints) {
      const success = await givePointsToUser(user.uid, points, reason);
      if (success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`사용자 ${user.displayName || user.email} (${user.uid}) 지급 실패`);
      }
      
      // Firebase 요청 제한을 피하기 위한 지연
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 포인트 지급 완료: 성공 ${results.success}명, 실패 ${results.failed}명`);
    return results;

  } catch (error) {
    console.error('❌ 포인트 일괄 지급 실패:', error);
    throw error;
  }
};

/**
 * 특정 조건의 사용자들에게 포인트 지급
 * @param {Object} condition - 조건 객체 {field, operator, value}
 * @param {number} points - 지급할 포인트
 * @param {string} reason - 지급 사유
 * @returns {Promise<Object>} 결과 통계
 */
export const givePointsToUsersByCondition = async (condition, points = 500, reason = '조건부 포인트 지급') => {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };

  try {
    console.log(`🔍 조건부 사용자 검색: ${condition.field} ${condition.operator} ${condition.value}`);
    
    // 조건에 맞는 사용자 조회
    const { getUsersByCondition } = await import('./userMigration');
    const targetUsers = await getUsersByCondition(condition.field, condition.operator, condition.value);
    
    results.total = targetUsers.length;
    console.log(`📊 조건에 맞는 사용자: ${targetUsers.length}명`);

    // 포인트 지급
    for (const user of targetUsers) {
      const success = await givePointsToUser(user.uid, points, reason);
      if (success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`사용자 ${user.displayName || user.email} (${user.uid}) 지급 실패`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 조건부 포인트 지급 완료: 성공 ${results.success}명, 실패 ${results.failed}명`);
    return results;

  } catch (error) {
    console.error('❌ 조건부 포인트 지급 실패:', error);
    throw error;
  }
};

/**
 * 사용자 포인트 현황 조회
 * @returns {Promise<Object>} 포인트 현황 통계
 */
export const getPointsStatistics = async () => {
  try {
    const users = await getAllExistingUsers();
    
    const stats = {
      totalUsers: users.length,
      usersWithPoints: 0,
      usersWithoutPoints: 0,
      totalPoints: 0,
      averagePoints: 0,
      maxPoints: 0,
      minPoints: 0,
      pointDistribution: {
        '0': 0,
        '1-100': 0,
        '101-500': 0,
        '501-1000': 0,
        '1000+': 0
      }
    };

    users.forEach(user => {
      const points = user.point || 0;
      stats.totalPoints += points;
      
      if (points > 0) {
        stats.usersWithPoints++;
      } else {
        stats.usersWithoutPoints++;
      }

      // 포인트 분포 계산
      if (points === 0) {
        stats.pointDistribution['0']++;
      } else if (points <= 100) {
        stats.pointDistribution['1-100']++;
      } else if (points <= 500) {
        stats.pointDistribution['101-500']++;
      } else if (points <= 1000) {
        stats.pointDistribution['501-1000']++;
      } else {
        stats.pointDistribution['1000+']++;
      }

      // 최대/최소 포인트 업데이트
      if (points > stats.maxPoints) stats.maxPoints = points;
      if (points < stats.minPoints || stats.minPoints === 0) stats.minPoints = points;
    });

    stats.averagePoints = stats.totalUsers > 0 ? Math.round(stats.totalPoints / stats.totalUsers) : 0;

    console.log('📊 포인트 현황 통계:', stats);
    return stats;

  } catch (error) {
    console.error('❌ 포인트 통계 조회 실패:', error);
    throw error;
  }
};

// 사용 예시 함수들
export const pointUpdateExamples = {
  // 모든 사용자에게 500포인트 지급
  give500PointsToAll: async () => {
    return await givePointsToAllUsers(500, '기본 포인트 지급');
  },

  // 포인트가 0인 사용자에게만 500포인트 지급
  give500PointsToZeroUsers: async () => {
    return await givePointsToUsersByCondition(
      { field: 'point', operator: '==', value: 0 }, 
      500, 
      '기본 포인트 지급'
    );
  },

  // 포인트가 100 미만인 사용자에게 400포인트 추가 지급
  give400PointsToLowUsers: async () => {
    return await givePointsToUsersByCondition(
      { field: 'point', operator: '<', value: 100 }, 
      400, 
      '추가 포인트 지급'
    );
  },

  // 활성 사용자에게 300포인트 지급
  give300PointsToActiveUsers: async () => {
    return await givePointsToUsersByCondition(
      { field: 'isActive', operator: '==', value: true }, 
      300, 
      '활성 사용자 보너스'
    );
  }
}; 