import { auth, db } from '../firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from 'firebase/auth';

/**
 * 회원가입용 SMS 인증 유틸리티
 */

// reCAPTCHA 인스턴스 저장
let recaptchaVerifier = null;

/**
 * reCAPTCHA 초기화
 * @param {string} containerId - reCAPTCHA를 렌더링할 컨테이너 ID
 */
export const initializeRecaptchaForSignup = (containerId) => {
  if (!window.recaptchaVerifierSignup) {
    window.recaptchaVerifierSignup = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response) => {
        console.log('reCAPTCHA 인증 성공 (회원가입)');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA 인증 만료 (회원가입)');
      }
    });
  }
  recaptchaVerifier = window.recaptchaVerifierSignup;
};

/**
 * SMS 인증 코드 발송 (회원가입용)
 * @param {string} phoneNumber - 휴대폰 번호 (국가 코드 포함, 예: +821012345678)
 * @returns {Promise<Object>} 인증 결과
 */
export const sendSMSCodeForSignup = async (phoneNumber) => {
  try {
    // 휴대폰 번호 형식 확인 및 변환
    let formattedPhone = phoneNumber.trim();
    
    // 한국 번호 형식인 경우 (010-1234-5678 또는 01012345678)
    if (formattedPhone.startsWith('010')) {
      // 하이픈 제거
      formattedPhone = formattedPhone.replace(/-/g, '');
      // 국가 코드 추가
      if (!formattedPhone.startsWith('+82')) {
        formattedPhone = '+82' + formattedPhone.substring(1); // 0 제거 후 +82 추가
      }
    }
    
    // 이미 +로 시작하지 않으면 +82 추가
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+82' + formattedPhone;
    }
    
    if (!recaptchaVerifier) {
      // recaptcha-container가 없으면 임시로 생성
      let container = document.getElementById('recaptcha-container-signup');
      if (!container) {
        container = document.createElement('div');
        container.id = 'recaptcha-container-signup';
        container.style.display = 'none';
        document.body.appendChild(container);
      }
      initializeRecaptchaForSignup('recaptcha-container-signup');
    }

    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    
    return {
      success: true,
      confirmationResult,
      message: '인증 코드가 발송되었습니다.'
    };
  } catch (error) {
    console.error('SMS 발송 실패:', error);
    let message = 'SMS 발송에 실패했습니다.';
    
    if (error.code === 'auth/invalid-phone-number') {
      message = '유효하지 않은 휴대폰 번호입니다.';
    } else if (error.code === 'auth/too-many-requests') {
      message = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.code === 'auth/quota-exceeded') {
      message = '일일 SMS 발송 한도를 초과했습니다.';
    }
    
    return {
      success: false,
      error: error.message,
      message
    };
  }
};

/**
 * SMS 인증 코드 확인 (회원가입용)
 * @param {Object} confirmationResult - SMS 발송 결과
 * @param {string} smsCode - 사용자가 입력한 인증 코드
 * @returns {Promise<Object>} 인증 결과
 */
export const verifySMSCodeForSignup = async (confirmationResult, smsCode) => {
  try {
    const result = await confirmationResult.confirm(smsCode);
    
    return {
      success: true,
      phoneNumber: result.user.phoneNumber,
      message: '인증이 완료되었습니다.'
    };
  } catch (error) {
    console.error('SMS 인증 실패:', error);
    let message = '인증에 실패했습니다.';
    
    if (error.code === 'auth/invalid-verification-code') {
      message = '잘못된 인증 코드입니다.';
    } else if (error.code === 'auth/code-expired') {
      message = '인증 코드가 만료되었습니다.';
    } else if (error.code === 'auth/session-expired') {
      message = '인증 세션이 만료되었습니다. 다시 인증해주세요.';
    }
    
    return {
      success: false,
      error: error.message,
      message
    };
  }
};

/**
 * 닉네임 자동 생성
 * @returns {string} 생성된 닉네임
 */
export const generateRandomNickname = () => {
  const randomNum = Math.floor(Math.random() * 10000);
  return `포션 유저${randomNum}`;
};

