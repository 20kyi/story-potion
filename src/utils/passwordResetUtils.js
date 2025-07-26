import { auth, db } from '../firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  updatePassword 
} from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * SMS 인증을 통한 비밀번호 재설정
 */

// reCAPTCHA 인스턴스 저장
let recaptchaVerifier = null;

/**
 * reCAPTCHA 초기화
 * @param {string} containerId - reCAPTCHA를 렌더링할 컨테이너 ID
 */
export const initializeRecaptcha = (containerId) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response) => {
        console.log('reCAPTCHA 인증 성공');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA 인증 만료');
      }
    });
  }
  recaptchaVerifier = window.recaptchaVerifier;
};

/**
 * SMS 인증 코드 발송
 * @param {string} phoneNumber - 휴대폰 번호 (국가 코드 포함)
 * @returns {Promise<Object>} 인증 결과
 */
export const sendSMSCode = async (phoneNumber) => {
  try {
    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA가 초기화되지 않았습니다.');
    }

    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return {
      success: true,
      confirmationResult,
      message: '인증 코드가 발송되었습니다.'
    };
  } catch (error) {
    console.error('SMS 발송 실패:', error);
    return {
      success: false,
      error: error.message,
      message: 'SMS 발송에 실패했습니다.'
    };
  }
};

/**
 * SMS 인증 코드 확인 및 비밀번호 재설정
 * @param {Object} confirmationResult - SMS 발송 결과
 * @param {string} smsCode - 사용자가 입력한 인증 코드
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<Object>} 재설정 결과
 */
export const verifySMSCodeAndResetPassword = async (confirmationResult, smsCode, newPassword) => {
  try {
    // SMS 코드 확인
    const result = await confirmationResult.confirm(smsCode);
    const user = result.user;

    // 새 비밀번호 설정
    await updatePassword(user, newPassword);

    // Firestore 사용자 정보 업데이트
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      updatedAt: new Date()
    });

    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    };
  } catch (error) {
    console.error('SMS 인증 실패:', error);
    let message = '인증에 실패했습니다.';
    
    if (error.code === 'auth/invalid-verification-code') {
      message = '잘못된 인증 코드입니다.';
    } else if (error.code === 'auth/code-expired') {
      message = '인증 코드가 만료되었습니다.';
    }

    return {
      success: false,
      error: error.message,
      message
    };
  }
};

/**
 * 휴대폰 번호로 사용자 찾기
 * @param {string} phoneNumber - 휴대폰 번호
 * @returns {Promise<Object>} 사용자 정보
 */
export const findUserByPhone = async (phoneNumber) => {
  try {
    // Firestore에서 휴대폰 번호로 사용자 검색
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        message: '해당 휴대폰 번호로 가입된 계정을 찾을 수 없습니다.'
      };
    }

    const userDoc = snapshot.docs[0];
    return {
      success: true,
      user: {
        uid: userDoc.id,
        ...userDoc.data()
      }
    };
  } catch (error) {
    console.error('사용자 검색 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '사용자 검색에 실패했습니다.'
    };
  }
}; 