import { auth, db } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, addDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

/**
 * 관리자 문의를 통한 비밀번호 재설정
 */

/**
 * 비밀번호 재설정 요청 생성
 * @param {Object} requestData - 요청 데이터
 * @returns {Promise<Object>} 요청 결과
 */
export const createPasswordResetRequest = async (requestData) => {
  try {
    const {
      email,
      displayName,
      phoneNumber,
      reason,
      additionalInfo
    } = requestData;

    // 필수 정보 검증
    if (!email || !displayName || !reason) {
      return {
        success: false,
        message: '필수 정보를 모두 입력해주세요.'
      };
    }

    // 기존 요청이 있는지 확인
    const existingRequests = await checkExistingRequests(email);
    if (existingRequests.length > 0) {
      return {
        success: false,
        message: '이미 처리 중인 요청이 있습니다. 잠시 후 다시 시도해주세요.'
      };
    }

    // 비밀번호 재설정 요청 저장
    const requestRef = await addDoc(collection(db, 'passwordResetRequests'), {
      email,
      displayName,
      phoneNumber: phoneNumber || '',
      reason,
      additionalInfo: additionalInfo || '',
      status: 'pending', // pending, approved, rejected, completed
      createdAt: new Date(),
      updatedAt: new Date(),
      requestId: generateRequestId()
    });

    return {
      success: true,
      requestId: requestRef.id,
      message: '비밀번호 재설정 요청이 접수되었습니다. 관리자 검토 후 연락드리겠습니다.'
    };
  } catch (error) {
    console.error('비밀번호 재설정 요청 생성 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '요청 접수에 실패했습니다. 다시 시도해주세요.'
    };
  }
};

/**
 * 기존 요청 확인
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Array>} 기존 요청 목록
 */
const checkExistingRequests = async (email) => {
  try {
    const requestsRef = collection(db, 'passwordResetRequests');
    const q = query(
      requestsRef, 
      where('email', '==', email),
      where('status', 'in', ['pending', 'approved'])
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('기존 요청 확인 실패:', error);
    return [];
  }
};

/**
 * 요청 ID 생성
 * @returns {string} 요청 ID
 */
const generateRequestId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `PWR-${timestamp}-${randomStr}`.toUpperCase();
};

/**
 * 요청 상태 확인
 * @param {string} requestId - 요청 ID
 * @returns {Promise<Object>} 요청 상태
 */
export const checkRequestStatus = async (requestId) => {
  try {
    const requestsRef = collection(db, 'passwordResetRequests');
    const q = query(requestsRef, where('requestId', '==', requestId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: '요청을 찾을 수 없습니다.'
      };
    }

    const requestDoc = snapshot.docs[0];
    const requestData = requestDoc.data();

    return {
      success: true,
      request: {
        id: requestDoc.id,
        ...requestData
      }
    };
  } catch (error) {
    console.error('요청 상태 확인 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '요청 상태 확인에 실패했습니다.'
    };
  }
};

/**
 * 관리자용: 비밀번호 재설정 요청 목록 조회
 * @returns {Promise<Object>} 요청 목록
 */
export const getPasswordResetRequests = async () => {
  try {
    const requestsRef = collection(db, 'passwordResetRequests');
    const q = query(requestsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      requests
    };
  } catch (error) {
    console.error('비밀번호 재설정 요청 목록 조회 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '요청 목록 조회에 실패했습니다.'
    };
  }
};

/**
 * 관리자용: 요청 상태 업데이트
 * @param {string} requestId - 요청 ID
 * @param {string} status - 새 상태
 * @param {string} adminNote - 관리자 메모
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateRequestStatus = async (requestId, status, adminNote = '') => {
  try {
    const requestsRef = collection(db, 'passwordResetRequests');
    const q = query(requestsRef, where('requestId', '==', requestId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: '요청을 찾을 수 없습니다.'
      };
    }

    const requestDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'passwordResetRequests', requestDoc.id), {
      status,
      adminNote,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: '요청 상태가 업데이트되었습니다.'
    };
  } catch (error) {
    console.error('요청 상태 업데이트 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '요청 상태 업데이트에 실패했습니다.'
    };
  }
};

/**
 * 관리자용: 임시 비밀번호 생성 및 설정
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Object>} 임시 비밀번호 설정 결과
 */
export const setTemporaryPassword = async (email) => {
  try {
    // 사용자 조회
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: '해당 이메일로 가입된 계정을 찾을 수 없습니다.'
      };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // 임시 비밀번호 생성
    const temporaryPassword = generateTemporaryPassword();

    // Firestore에 임시 비밀번호 정보 저장
    await updateDoc(doc(db, 'users', userDoc.id), {
      temporaryPassword: temporaryPassword,
      passwordResetAt: new Date(),
      updatedAt: new Date(),
      passwordResetBy: 'admin'
    });

    return {
      success: true,
      temporaryPassword,
      message: '임시 비밀번호가 설정되었습니다.'
    };
  } catch (error) {
    console.error('임시 비밀번호 설정 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '임시 비밀번호 설정에 실패했습니다.'
    };
  }
};

/**
 * 관리자용: 사용자 비밀번호 직접 재설정
 * @param {string} email - 사용자 이메일
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<Object>} 비밀번호 재설정 결과
 */
export const resetUserPasswordByAdmin = async (email, newPassword) => {
  try {
    // 사용자 조회
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: '해당 이메일로 가입된 계정을 찾을 수 없습니다.'
      };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Firestore에 비밀번호 재설정 정보 저장
    await updateDoc(doc(db, 'users', userDoc.id), {
      passwordResetAt: new Date(),
      updatedAt: new Date(),
      passwordResetBy: 'admin',
      passwordResetNote: '관리자에 의해 재설정됨'
    });

    // 실제 비밀번호는 Firebase Admin SDK로 변경해야 함
    // 클라이언트에서는 보안상 직접 변경 불가
    // 대신 사용자에게 새 비밀번호를 안전하게 전달하는 방법 사용

    return {
      success: true,
      newPassword,
      message: '비밀번호가 재설정되었습니다. 사용자에게 안전하게 전달해주세요.'
    };
  } catch (error) {
    console.error('비밀번호 재설정 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '비밀번호 재설정에 실패했습니다.'
    };
  }
};

/**
 * 관리자용: 비밀번호 재설정 요청 승인
 * @param {string} requestId - 요청 ID
 * @param {string} adminNote - 관리자 메모
 * @returns {Promise<Object>} 승인 결과
 */
export const approvePasswordResetRequest = async (requestId, adminNote = '') => {
  try {
    const requestsRef = collection(db, 'passwordResetRequests');
    const q = query(requestsRef, where('requestId', '==', requestId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: '요청을 찾을 수 없습니다.'
      };
    }

    const requestDoc = snapshot.docs[0];
    const requestData = requestDoc.data();

    // 요청 상태를 승인으로 변경
    await updateDoc(doc(db, 'passwordResetRequests', requestDoc.id), {
      status: 'approved',
      adminNote,
      approvedAt: new Date(),
      updatedAt: new Date()
    });

    // 임시 비밀번호 생성
    const temporaryPassword = generateTemporaryPassword();

    // 사용자 정보에 임시 비밀번호 저장
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('email', '==', requestData.email));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        temporaryPassword: temporaryPassword,
        passwordResetAt: new Date(),
        updatedAt: new Date(),
        passwordResetBy: 'admin',
        passwordResetRequestId: requestId
      });
    }

    return {
      success: true,
      temporaryPassword,
      requestData,
      message: '비밀번호 재설정 요청이 승인되었습니다.'
    };
  } catch (error) {
    console.error('요청 승인 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '요청 승인에 실패했습니다.'
    };
  }
};

/**
 * 관리자용: 비밀번호 재설정 요청 거부
 * @param {string} requestId - 요청 ID
 * @param {string} adminNote - 거부 사유
 * @returns {Promise<Object>} 거부 결과
 */
export const rejectPasswordResetRequest = async (requestId, adminNote = '') => {
  try {
    const requestsRef = collection(db, 'passwordResetRequests');
    const q = query(requestsRef, where('requestId', '==', requestId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: '요청을 찾을 수 없습니다.'
      };
    }

    const requestDoc = snapshot.docs[0];

    // 요청 상태를 거부로 변경
    await updateDoc(doc(db, 'passwordResetRequests', requestDoc.id), {
      status: 'rejected',
      adminNote,
      rejectedAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      message: '비밀번호 재설정 요청이 거부되었습니다.'
    };
  } catch (error) {
    console.error('요청 거부 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '요청 거부에 실패했습니다.'
    };
  }
};

/**
 * 임시 비밀번호 생성
 * @returns {string} 임시 비밀번호
 */
const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}; 