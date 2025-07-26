/**
 * 기존 사용자들의 빈 photoURL을 기본 프로필 이미지로 업데이트하는 유틸리티
 */

import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc,
  query,
  where
} from 'firebase/firestore';

/**
 * photoURL이 비어있는 사용자들을 찾아서 기본 프로필 이미지로 업데이트
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateEmptyProfileImages = async () => {
  try {
    console.log('🔍 빈 프로필 이미지를 가진 사용자 조회 중...');
    
    // photoURL이 비어있거나 null인 사용자들 조회
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('photoURL', 'in', ['', null, undefined])
    );
    
    const snapshot = await getDocs(q);
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`✅ ${users.length}명의 사용자를 찾았습니다.`);
    
    if (users.length === 0) {
      return { success: true, updatedCount: 0, message: '업데이트할 사용자가 없습니다.' };
    }
    
    // 각 사용자의 photoURL을 기본 프로필 이미지로 업데이트
    const updatePromises = users.map(user => {
      const userRef = doc(db, 'users', user.uid);
      return updateDoc(userRef, {
        photoURL: process.env.PUBLIC_URL + '/default-profile.svg',
        updatedAt: new Date()
      });
    });
    
    await Promise.all(updatePromises);
    
    console.log(`✅ ${users.length}명의 사용자 프로필 이미지 업데이트 완료!`);
    
    return { 
      success: true, 
      updatedCount: users.length, 
      message: `${users.length}명의 사용자 프로필 이미지가 업데이트되었습니다.` 
    };
    
  } catch (error) {
    console.error('❌ 프로필 이미지 업데이트 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '프로필 이미지 업데이트에 실패했습니다.' 
    };
  }
};

/**
 * 모든 사용자의 photoURL을 확인하고 빈 값이 있으면 기본 프로필 이미지로 설정
 * @returns {Promise<Object>} 업데이트 결과
 */
export const checkAndUpdateAllProfileImages = async () => {
  try {
    console.log('🔍 모든 사용자 프로필 이미지 확인 중...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      // photoURL이 비어있거나 null이거나 undefined인 경우
      if (!userData.photoURL || userData.photoURL === '' || userData.photoURL === null) {
        users.push({
          uid: doc.id,
          ...userData
        });
      }
    });
    
    console.log(`✅ ${users.length}명의 사용자가 업데이트 대상입니다.`);
    
    if (users.length === 0) {
      return { success: true, updatedCount: 0, message: '모든 사용자가 이미 프로필 이미지를 가지고 있습니다.' };
    }
    
    // 각 사용자의 photoURL을 기본 프로필 이미지로 업데이트
    const updatePromises = users.map(user => {
      const userRef = doc(db, 'users', user.uid);
      return updateDoc(userRef, {
        photoURL: process.env.PUBLIC_URL + '/default-profile.svg',
        updatedAt: new Date()
      });
    });
    
    await Promise.all(updatePromises);
    
    console.log(`✅ ${users.length}명의 사용자 프로필 이미지 업데이트 완료!`);
    
    return { 
      success: true, 
      updatedCount: users.length, 
      message: `${users.length}명의 사용자 프로필 이미지가 업데이트되었습니다.` 
    };
    
  } catch (error) {
    console.error('❌ 프로필 이미지 업데이트 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '프로필 이미지 업데이트에 실패했습니다.' 
    };
  }
};

/**
 * displayName이 비어있는 사용자들을 찾아서 이메일의 앞부분으로 업데이트
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateEmptyDisplayNames = async () => {
  try {
    console.log('🔍 빈 displayName을 가진 사용자 조회 중...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      // displayName이 비어있거나 null이거나 undefined인 경우
      if (!userData.displayName || userData.displayName === '' || userData.displayName === null) {
        users.push({
          uid: doc.id,
          ...userData
        });
      }
    });
    
    console.log(`✅ ${users.length}명의 사용자를 찾았습니다.`);
    
    if (users.length === 0) {
      return { success: true, updatedCount: 0, message: '업데이트할 사용자가 없습니다.' };
    }
    
    // 각 사용자의 displayName을 이메일의 앞부분으로 업데이트
    const updatePromises = users.map(user => {
      const userRef = doc(db, 'users', user.uid);
      const defaultDisplayName = user.email?.split('@')[0] || '사용자';
      return updateDoc(userRef, {
        displayName: defaultDisplayName,
        updatedAt: new Date()
      });
    });
    
    await Promise.all(updatePromises);
    
    console.log(`✅ ${users.length}명의 사용자 displayName 업데이트 완료!`);
    
    return { 
      success: true, 
      updatedCount: users.length, 
      message: `${users.length}명의 사용자 displayName이 업데이트되었습니다.` 
    };
    
  } catch (error) {
    console.error('❌ displayName 업데이트 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'displayName 업데이트에 실패했습니다.' 
    };
  }
};

/**
 * 모든 사용자의 displayName과 photoURL을 확인하고 빈 값이 있으면 기본값으로 설정
 * @returns {Promise<Object>} 업데이트 결과
 */
export const checkAndUpdateAllUserProfiles = async () => {
  try {
    console.log('🔍 모든 사용자 프로필 정보 확인 중...');
    
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    
    snapshot.forEach(doc => {
      const userData = doc.data();
      // displayName이나 photoURL이 비어있는 경우
      const needsDisplayNameUpdate = !userData.displayName || userData.displayName === '' || userData.displayName === null;
      const needsPhotoURLUpdate = !userData.photoURL || userData.photoURL === '' || userData.photoURL === null;
      
      if (needsDisplayNameUpdate || needsPhotoURLUpdate) {
        users.push({
          uid: doc.id,
          ...userData,
          needsDisplayNameUpdate,
          needsPhotoURLUpdate
        });
      }
    });
    
    console.log(`✅ ${users.length}명의 사용자가 업데이트 대상입니다.`);
    
    if (users.length === 0) {
      return { success: true, updatedCount: 0, message: '모든 사용자가 이미 완전한 프로필 정보를 가지고 있습니다.' };
    }
    
    // 각 사용자의 프로필 정보 업데이트
    const updatePromises = users.map(user => {
      const userRef = doc(db, 'users', user.uid);
      const updateData = { updatedAt: new Date() };
      
      if (user.needsDisplayNameUpdate) {
        updateData.displayName = user.email?.split('@')[0] || '사용자';
      }
      
      if (user.needsPhotoURLUpdate) {
        updateData.photoURL = process.env.PUBLIC_URL + '/default-profile.svg';
      }
      
      return updateDoc(userRef, updateData);
    });
    
    await Promise.all(updatePromises);
    
    console.log(`✅ ${users.length}명의 사용자 프로필 정보 업데이트 완료!`);
    
    return { 
      success: true, 
      updatedCount: users.length, 
      message: `${users.length}명의 사용자 프로필 정보가 업데이트되었습니다.` 
    };
    
  } catch (error) {
    console.error('❌ 프로필 정보 업데이트 실패:', error);
    return { 
      success: false, 
      error: error.message,
      message: '프로필 정보 업데이트에 실패했습니다.' 
    };
  }
}; 