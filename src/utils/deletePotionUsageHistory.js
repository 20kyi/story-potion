import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * 모든 사용자의 포션 사용 내역을 삭제하는 함수
 * 포션 사용은 포인트를 차감하지 않으므로 포인트 내역에서 제거
 */
export const deleteAllPotionUsageHistory = async () => {
  try {
    console.log('🔍 포션 사용 내역 삭제 시작...');
    
    // 모든 사용자 조회
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let totalDeleted = 0;
    let processedUsers = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`👤 사용자 ${userId} 처리 중...`);
      
      try {
        // 해당 사용자의 포인트 히스토리에서 포션 사용 내역 찾기
        const historyRef = collection(db, 'users', userId, 'pointHistory');
        const potionUsageQuery = query(
          historyRef,
          where('type', '==', 'use'),
          where('amount', '==', 0)
        );
        
        const potionUsageSnapshot = await getDocs(potionUsageQuery);
        
        // 포션 사용 내역 삭제
        for (const historyDoc of potionUsageSnapshot.docs) {
          const historyData = historyDoc.data();
          
          // 포션 사용 내역인지 확인 (amount가 0이고 desc에 '포션 사용'이 포함된 경우)
          if (historyData.amount === 0 && 
              (historyData.desc?.includes('포션 사용') || 
               historyData.desc?.includes('romance 포션') ||
               historyData.desc?.includes('historical 포션') ||
               historyData.desc?.includes('mystery 포션') ||
               historyData.desc?.includes('horror 포션') ||
               historyData.desc?.includes('fairytale 포션') ||
               historyData.desc?.includes('fantasy 포션'))) {
            
            await deleteDoc(doc(db, 'users', userId, 'pointHistory', historyDoc.id));
            totalDeleted++;
            console.log(`🗑️ 삭제: ${userId} - ${historyData.desc}`);
          }
        }
        
        processedUsers++;
        console.log(`✅ 사용자 ${userId} 처리 완료`);
        
      } catch (error) {
        console.error(`❌ 사용자 ${userId} 처리 실패:`, error);
      }
    }
    
    console.log(`🎉 포션 사용 내역 삭제 완료!`);
    console.log(`📊 처리된 사용자: ${processedUsers}명`);
    console.log(`🗑️ 삭제된 내역: ${totalDeleted}개`);
    
    return { processedUsers, totalDeleted };
    
  } catch (error) {
    console.error('❌ 포션 사용 내역 삭제 실패:', error);
    throw error;
  }
};

/**
 * 특정 사용자의 포션 사용 내역만 삭제하는 함수
 */
export const deleteUserPotionUsageHistory = async (userId) => {
  try {
    console.log(`🔍 사용자 ${userId}의 포션 사용 내역 삭제 시작...`);
    
    // 해당 사용자의 포인트 히스토리에서 포션 사용 내역 찾기
    const historyRef = collection(db, 'users', userId, 'pointHistory');
    const potionUsageQuery = query(
      historyRef,
      where('type', '==', 'use'),
      where('amount', '==', 0)
    );
    
    const potionUsageSnapshot = await getDocs(potionUsageQuery);
    let deletedCount = 0;
    
    // 포션 사용 내역 삭제
    for (const historyDoc of potionUsageSnapshot.docs) {
      const historyData = historyDoc.data();
      
      // 포션 사용 내역인지 확인
      if (historyData.amount === 0 && 
          (historyData.desc?.includes('포션 사용') || 
           historyData.desc?.includes('romance 포션') ||
           historyData.desc?.includes('historical 포션') ||
           historyData.desc?.includes('mystery 포션') ||
           historyData.desc?.includes('horror 포션') ||
           historyData.desc?.includes('fairytale 포션') ||
           historyData.desc?.includes('fantasy 포션'))) {
        
        await deleteDoc(doc(db, 'users', userId, 'pointHistory', historyDoc.id));
        deletedCount++;
        console.log(`🗑️ 삭제: ${historyData.desc}`);
      }
    }
    
    console.log(`✅ 사용자 ${userId}의 포션 사용 내역 삭제 완료!`);
    console.log(`🗑️ 삭제된 내역: ${deletedCount}개`);
    
    return deletedCount;
    
  } catch (error) {
    console.error(`❌ 사용자 ${userId} 포션 사용 내역 삭제 실패:`, error);
    throw error;
  }
};

/**
 * 포션 사용 내역 통계를 보여주는 함수
 */
export const getPotionUsageHistoryStats = async () => {
  try {
    console.log('📊 포션 사용 내역 통계 조회 중...');
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let totalPotionUsage = 0;
    let usersWithPotionUsage = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      try {
        const historyRef = collection(db, 'users', userId, 'pointHistory');
        const potionUsageQuery = query(
          historyRef,
          where('type', '==', 'use'),
          where('amount', '==', 0)
        );
        
        const potionUsageSnapshot = await getDocs(potionUsageQuery);
        let userPotionUsage = 0;
        
        for (const historyDoc of potionUsageSnapshot.docs) {
          const historyData = historyDoc.data();
          
          if (historyData.amount === 0 && 
              (historyData.desc?.includes('포션 사용') || 
               historyData.desc?.includes('romance 포션') ||
               historyData.desc?.includes('historical 포션') ||
               historyData.desc?.includes('mystery 포션') ||
               historyData.desc?.includes('horror 포션') ||
               historyData.desc?.includes('fairytale 포션') ||
               historyData.desc?.includes('fantasy 포션'))) {
            userPotionUsage++;
          }
        }
        
        if (userPotionUsage > 0) {
          usersWithPotionUsage++;
          totalPotionUsage += userPotionUsage;
          console.log(`👤 ${userId}: ${userPotionUsage}개 포션 사용 내역`);
        }
        
      } catch (error) {
        console.error(`❌ 사용자 ${userId} 통계 조회 실패:`, error);
      }
    }
    
    console.log(`📊 포션 사용 내역 통계:`);
    console.log(`👥 포션 사용 내역이 있는 사용자: ${usersWithPotionUsage}명`);
    console.log(`🗑️ 총 포션 사용 내역: ${totalPotionUsage}개`);
    
    return { usersWithPotionUsage, totalPotionUsage };
    
  } catch (error) {
    console.error('❌ 포션 사용 내역 통계 조회 실패:', error);
    throw error;
  }
}; 