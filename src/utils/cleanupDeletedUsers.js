/**
 * 탈퇴한 회원 정리 유틸리티
 * 
 * Firebase에 남아있는 탈퇴한 회원들을 찾아서 정리하는 함수들
 * - isActive가 false인 사용자
 * - 오래된 사용자 중 로그인하지 않은 사용자
 * - 관련 데이터 정리
 */

import { db, storage } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

const BATCH_LIMIT = 500; // Firestore 배치 제한

/**
 * 배치 삭제 헬퍼 함수
 */
const deleteInBatches = async (docRefs, collectionName) => {
  let totalDeleted = 0;
  for (let i = 0; i < docRefs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const batchRefs = docRefs.slice(i, i + BATCH_LIMIT);
    batchRefs.forEach((docRef) => {
      batch.delete(docRef);
    });
    await batch.commit();
    totalDeleted += batchRefs.length;
    console.log(`${collectionName} ${batchRefs.length}개 삭제 완료 (총 ${totalDeleted}/${docRefs.length})`);
  }
  return totalDeleted;
};

/**
 * 사용자의 모든 관련 데이터 삭제
 */
const deleteUserData = async (userId) => {
  let deletedCount = 0;

  try {
    // 1. Firebase Storage 파일들 삭제
    try {
      // 일기 이미지들 삭제
      const diaryImagesRef = ref(storage, `diaries/${userId}`);
      try {
        const diaryImages = await listAll(diaryImagesRef);
        for (const item of diaryImages.items) {
          try {
            await deleteObject(item);
            deletedCount++;
          } catch (error) {
            console.log('일기 이미지 삭제 실패:', error);
          }
        }
      } catch (error) {
        console.log('일기 이미지 폴더 조회 실패:', error);
      }

      // 프로필 이미지들 삭제
      const profileImageRef = ref(storage, `profile-images/${userId}`);
      try {
        const profileImages = await listAll(profileImageRef);
        for (const item of profileImages.items) {
          try {
            await deleteObject(item);
            deletedCount++;
          } catch (error) {
            console.log('프로필 이미지 삭제 실패:', error);
          }
        }
      } catch (error) {
        console.log('프로필 이미지 폴더 조회 실패:', error);
      }
    } catch (error) {
      console.log('Storage 파일 삭제 중 오류:', error);
    }

    // 2. Firestore 데이터 삭제
    // 2-1. 일기 데이터 삭제
    try {
      const diariesQuery = query(
        collection(db, 'diaries'),
        where('userId', '==', userId)
      );
      const diariesSnapshot = await getDocs(diariesQuery);
      const diaryRefs = diariesSnapshot.docs.map(doc => doc.ref);
      if (diaryRefs.length > 0) {
        deletedCount += await deleteInBatches(diaryRefs, '일기');
      }
    } catch (error) {
      console.log('일기 데이터 조회 실패:', error);
    }

    // 2-2. 소설 데이터 삭제
    try {
      const novelsQuery = query(
        collection(db, 'novels'),
        where('userId', '==', userId)
      );
      const novelsSnapshot = await getDocs(novelsQuery);
      const novelRefs = novelsSnapshot.docs.map(doc => doc.ref);
      if (novelRefs.length > 0) {
        deletedCount += await deleteInBatches(novelRefs, '소설');
      }
    } catch (error) {
      console.log('소설 데이터 조회 실패:', error);
    }

    // 2-3. 친구 관계 삭제
    try {
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', userId)
      );
      const friendshipsSnapshot = await getDocs(friendshipsQuery);
      const friendshipRefs = friendshipsSnapshot.docs.map(doc => doc.ref);
      if (friendshipRefs.length > 0) {
        deletedCount += await deleteInBatches(friendshipRefs, '친구 관계');
      }
    } catch (error) {
      console.log('친구 관계 데이터 조회 실패:', error);
    }

    // 2-4. 친구 요청 삭제 (보낸 요청)
    try {
      const sentRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', userId)
      );
      const sentRequestsSnapshot = await getDocs(sentRequestsQuery);
      const sentRequestRefs = sentRequestsSnapshot.docs.map(doc => doc.ref);
      if (sentRequestRefs.length > 0) {
        deletedCount += await deleteInBatches(sentRequestRefs, '보낸 친구 요청');
      }
    } catch (error) {
      console.log('보낸 친구 요청 조회 실패:', error);
    }

    // 2-5. 친구 요청 삭제 (받은 요청)
    try {
      const receivedRequestsQuery = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', userId)
      );
      const receivedRequestsSnapshot = await getDocs(receivedRequestsQuery);
      const receivedRequestRefs = receivedRequestsSnapshot.docs.map(doc => doc.ref);
      if (receivedRequestRefs.length > 0) {
        deletedCount += await deleteInBatches(receivedRequestRefs, '받은 친구 요청');
      }
    } catch (error) {
      console.log('받은 친구 요청 조회 실패:', error);
    }

    // 2-6. 알림 삭제
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationRefs = notificationsSnapshot.docs.map(doc => doc.ref);
      if (notificationRefs.length > 0) {
        deletedCount += await deleteInBatches(notificationRefs, '알림');
      }
    } catch (error) {
      console.log('알림 데이터 조회 실패:', error);
    }

    // 2-7. 사용자 서브컬렉션 삭제
    try {
      // pointHistory 삭제
      const pointHistoryRef = collection(db, 'users', userId, 'pointHistory');
      const pointHistorySnapshot = await getDocs(pointHistoryRef);
      const pointHistoryDocRefs = pointHistorySnapshot.docs.map(doc => doc.ref);
      if (pointHistoryDocRefs.length > 0) {
        deletedCount += await deleteInBatches(pointHistoryDocRefs, '포인트 히스토리');
      }

      // viewedNovels 삭제
      const viewedNovelsRef = collection(db, 'users', userId, 'viewedNovels');
      const viewedNovelsSnapshot = await getDocs(viewedNovelsRef);
      const viewedNovelsDocRefs = viewedNovelsSnapshot.docs.map(doc => doc.ref);
      if (viewedNovelsDocRefs.length > 0) {
        deletedCount += await deleteInBatches(viewedNovelsDocRefs, '조회한 소설');
      }
    } catch (error) {
      console.log('서브컬렉션 삭제 실패:', error);
    }

    // 2-8. 사용자 문서 삭제
    try {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
      deletedCount++;
    } catch (error) {
      console.log('사용자 문서 삭제 실패:', error);
    }

  } catch (error) {
    console.error('사용자 데이터 삭제 중 오류:', error);
    throw error;
  }

  return deletedCount;
};

/**
 * isActive가 false인 탈퇴한 회원들 찾기
 */
export const findInactiveUsers = async () => {
  try {
    console.log('🔍 비활성 사용자 조회 중...');
    
    const usersRef = collection(db, 'users');
    const inactiveQuery = query(
      usersRef,
      where('isActive', '==', false)
    );
    
    const snapshot = await getDocs(inactiveQuery);
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${users.length}명의 비활성 사용자를 찾았습니다.`);
    return {
      success: true,
      count: users.length,
      users: users,
      message: `${users.length}명의 비활성 사용자를 찾았습니다.`
    };
  } catch (error) {
    console.error('❌ 비활성 사용자 조회 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '비활성 사용자 조회에 실패했습니다.'
    };
  }
};

/**
 * 오래된 사용자 중 로그인하지 않은 사용자 찾기 (예: 1년 이상)
 */
export const findOldInactiveUsers = async (daysInactive = 365) => {
  try {
    console.log(`🔍 ${daysInactive}일 이상 로그인하지 않은 사용자 조회 중...`);
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      const lastLoginAt = userData.lastLoginAt?.toDate?.() || 
                         (userData.lastLoginAt ? new Date(userData.lastLoginAt) : null);
      
      // lastLoginAt이 없거나 오래된 경우
      if (!lastLoginAt || lastLoginAt < cutoffDate) {
        users.push({
          uid: doc.id,
          ...userData,
          lastLoginAt: lastLoginAt
        });
      }
    });
    
    console.log(`✅ ${users.length}명의 오래된 비활성 사용자를 찾았습니다.`);
    return {
      success: true,
      count: users.length,
      users: users,
      message: `${users.length}명의 오래된 비활성 사용자를 찾았습니다.`
    };
  } catch (error) {
    console.error('❌ 오래된 비활성 사용자 조회 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '오래된 비활성 사용자 조회에 실패했습니다.'
    };
  }
};

/**
 * 탈퇴한 회원들의 데이터 정리
 */
export const cleanupDeletedUsers = async (userIds, options = {}) => {
  const { 
    deleteStorage = true, 
    deleteRelatedData = true,
    dryRun = false 
  } = options;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return {
      success: false,
      message: '사용자 ID 목록이 필요합니다.'
    };
  }

  try {
    console.log(`🔧 ${userIds.length}명의 탈퇴한 회원 정리 시작...`);
    if (dryRun) {
      console.log('⚠️ DRY RUN 모드: 실제 삭제는 수행하지 않습니다.');
    }

    const results = {
      total: userIds.length,
      success: 0,
      failed: 0,
      deletedCount: 0,
      errors: []
    };

    // Firebase Functions를 통해 Auth 계정 삭제 시도
    let authDeleteResult = null;
    if (!dryRun) {
      try {
        const functions = getFunctions();
        const deleteAuthAccounts = httpsCallable(functions, 'deleteAuthAccounts');
        authDeleteResult = await deleteAuthAccounts({ userIds });
        console.log('Auth 계정 삭제 결과:', authDeleteResult.data);
      } catch (error) {
        console.warn('Firebase Functions를 통한 Auth 계정 삭제 실패 (계속 진행):', error);
        // Functions가 없거나 실패해도 Firestore 삭제는 계속 진행
      }
    }

    for (const userId of userIds) {
      try {
        if (dryRun) {
          console.log(`[DRY RUN] 사용자 ${userId} 삭제 예정`);
          results.success++;
        } else {
          const deletedCount = await deleteUserData(userId);
          results.deletedCount += deletedCount;
          results.success++;
          console.log(`✅ 사용자 ${userId} 정리 완료 (${deletedCount}개 항목 삭제)`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ userId, error: error.message });
        console.error(`❌ 사용자 ${userId} 정리 실패:`, error);
      }
    }

    // Auth 삭제 결과 반영
    if (authDeleteResult && authDeleteResult.data) {
      results.authDeleted = authDeleteResult.data.success || 0;
      results.authFailed = authDeleteResult.data.failed || 0;
    }

    console.log(`✅ 탈퇴한 회원 정리 완료: 성공 ${results.success}명, 실패 ${results.failed}명`);
    return {
      success: true,
      ...results,
      message: `탈퇴한 회원 정리 완료: 성공 ${results.success}명, 실패 ${results.failed}명`
    };
  } catch (error) {
    console.error('❌ 탈퇴한 회원 정리 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '탈퇴한 회원 정리에 실패했습니다.'
    };
  }
};

/**
 * 비활성 사용자 일괄 정리
 */
export const cleanupInactiveUsers = async (options = {}) => {
  const { daysInactive = 365, dryRun = false } = options;

  try {
    // 1. 비활성 사용자 찾기
    const inactiveResult = await findInactiveUsers();
    if (!inactiveResult.success) {
      return inactiveResult;
    }

    // 2. 오래된 비활성 사용자 찾기
    const oldInactiveResult = await findOldInactiveUsers(daysInactive);
    if (!oldInactiveResult.success) {
      return oldInactiveResult;
    }

    // 3. 중복 제거하여 모든 탈퇴 대상 사용자 수집
    const allUserIds = new Set();
    inactiveResult.users.forEach(u => allUserIds.add(u.uid));
    oldInactiveResult.users.forEach(u => allUserIds.add(u.uid));

    const userIds = Array.from(allUserIds);

    if (userIds.length === 0) {
      return {
        success: true,
        message: '정리할 탈퇴한 회원이 없습니다.',
        count: 0
      };
    }

    console.log(`📋 총 ${userIds.length}명의 탈퇴한 회원 발견`);

    // 4. 정리 실행
    return await cleanupDeletedUsers(userIds, { ...options, dryRun });
  } catch (error) {
    console.error('❌ 비활성 사용자 정리 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '비활성 사용자 정리에 실패했습니다.'
    };
  }
};

