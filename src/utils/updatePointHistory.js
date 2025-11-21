/**
 * 포인트 히스토리 데이터 업데이트 유틸리티
 * 
 * 이미 저장된 포인트 히스토리 데이터를 일괄 업데이트하는 도구
 */

import { db } from '../firebase';
import { 
  collection, 
  collectionGroup,
  query, 
  where,
  getDocs, 
  updateDoc,
  doc
} from 'firebase/firestore';

/**
 * 모든 사용자의 포인트 히스토리에서 특정 desc를 찾아 업데이트
 * @param {string} oldDesc - 변경할 기존 desc
 * @param {string} newDesc - 새로운 desc
 * @returns {Promise<Object>} 업데이트 결과 통계
 */
export const updatePointHistoryDesc = async (oldDesc, newDesc) => {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    updatedItems: []
  };

  try {
    console.log(`🚀 포인트 히스토리 업데이트 시작: "${oldDesc}" -> "${newDesc}"`);
    
    // collectionGroup을 사용하여 모든 사용자의 pointHistory 조회
    const historyRef = collectionGroup(db, 'pointHistory');
    const q = query(historyRef, where('desc', '==', oldDesc));
    const querySnapshot = await getDocs(q);
    
    results.total = querySnapshot.size;
    console.log(`📊 업데이트 대상: ${results.total}건`);

    // 각 문서 업데이트
    for (const historyDoc of querySnapshot.docs) {
      try {
        // collectionGroup에서 가져온 문서의 경로를 사용하여 업데이트
        const docPath = historyDoc.ref.path;
        await updateDoc(doc(db, docPath), {
          desc: newDesc
        });
        
        results.success++;
        results.updatedItems.push({
          id: historyDoc.id,
          path: docPath,
          userId: historyDoc.ref.parent.parent?.id || 'unknown'
        });
        
        // Firebase 요청 제한을 피하기 위한 지연
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push({
          id: historyDoc.id,
          path: historyDoc.ref.path,
          error: error.message
        });
        console.error(`❌ 업데이트 실패 (${historyDoc.id}):`, error.message);
      }
    }

    console.log(`✅ 포인트 히스토리 업데이트 완료: 성공 ${results.success}건, 실패 ${results.failed}건`);
    return results;

  } catch (error) {
    console.error('❌ 포인트 히스토리 업데이트 실패:', error);
    throw error;
  }
};

/**
 * "친구 소설 열람"을 "친구 소설 구매"로 업데이트
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateNovelPurchaseHistory = async () => {
  return await updatePointHistoryDesc('친구 소설 열람', '친구 소설 구매');
};

/**
 * 모든 사용자를 순회하면서 포인트 히스토리 업데이트 (collectionGroup 미지원 시 대안)
 * @param {string} oldDesc - 변경할 기존 desc
 * @param {string} newDesc - 새로운 desc
 * @returns {Promise<Object>} 업데이트 결과 통계
 */
export const updatePointHistoryDescByUser = async (oldDesc, newDesc) => {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    updatedItems: []
  };

  try {
    console.log(`🚀 포인트 히스토리 업데이트 시작 (사용자별): "${oldDesc}" -> "${newDesc}"`);
    
    // 1. 모든 사용자 조회
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({ uid: doc.id });
    });
    
    console.log(`📊 사용자 수: ${users.length}명`);

    // 2. 각 사용자의 pointHistory 조회 및 업데이트
    for (const user of users) {
      try {
        const historyRef = collection(db, 'users', user.uid, 'pointHistory');
        const q = query(historyRef, where('desc', '==', oldDesc));
        const historySnapshot = await getDocs(q);
        
        if (historySnapshot.empty) {
          continue;
        }

        // 해당 사용자의 히스토리 업데이트
        for (const historyDoc of historySnapshot.docs) {
          try {
            await updateDoc(doc(db, 'users', user.uid, 'pointHistory', historyDoc.id), {
              desc: newDesc
            });
            
            results.total++;
            results.success++;
            results.updatedItems.push({
              id: historyDoc.id,
              userId: user.uid
            });
            
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            results.total++;
            results.failed++;
            results.errors.push({
              id: historyDoc.id,
              userId: user.uid,
              error: error.message
            });
          }
        }
      } catch (error) {
        console.error(`❌ 사용자 ${user.uid} 히스토리 조회 실패:`, error.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ 포인트 히스토리 업데이트 완료: 성공 ${results.success}건, 실패 ${results.failed}건`);
    return results;

  } catch (error) {
    console.error('❌ 포인트 히스토리 업데이트 실패:', error);
    throw error;
  }
};

/**
 * "친구 소설 열람"을 "친구 소설 구매"로 업데이트 (사용자별 순회 방식)
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateNovelPurchaseHistoryByUser = async () => {
  return await updatePointHistoryDescByUser('친구 소설 열람', '친구 소설 구매');
};

