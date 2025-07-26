import { auth, db } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * 보안 질문을 통한 비밀번호 재설정
 */

// 기본 보안 질문 목록
export const SECURITY_QUESTIONS = [
  "어머니의 성함은 무엇인가요?",
  "가장 좋아하는 음식은 무엇인가요?",
  "첫 번째 반려동물의 이름은 무엇인가요?",
  "가장 기억에 남는 여행지는 어디인가요?",
  "초등학교 시절 가장 친했던 친구의 이름은 무엇인가요?",
  "가장 좋아하는 색깔은 무엇인가요?",
  "태어난 도시는 어디인가요?",
  "가장 좋아하는 영화 제목은 무엇인가요?",
  "첫 번째 직장은 어디였나요?",
  "가장 기억에 남는 생일 선물은 무엇인가요?"
];

/**
 * 사용자의 보안 질문 조회
 * @param {string} email - 사용자 이메일
 * @returns {Promise<Object>} 보안 질문 정보
 */
export const getUserSecurityQuestions = async (email) => {
  try {
    // Firestore에서 이메일로 사용자 검색
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
    
    // 보안 질문이 설정되어 있는지 확인
    if (!userData.securityQuestions || userData.securityQuestions.length === 0) {
      return {
        success: false,
        message: '보안 질문이 설정되지 않았습니다. 이메일로 비밀번호를 재설정해주세요.'
      };
    }

    return {
      success: true,
      userId: userDoc.id,
      securityQuestions: userData.securityQuestions,
      userData
    };
  } catch (error) {
    console.error('보안 질문 조회 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '보안 질문 조회에 실패했습니다.'
    };
  }
};

/**
 * 보안 질문 답변 확인
 * @param {string} userId - 사용자 ID
 * @param {Array} answers - 사용자가 입력한 답변들
 * @returns {Promise<Object>} 확인 결과
 */
export const verifySecurityAnswers = async (userId, answers) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return {
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.'
      };
    }

    const userData = userSnap.data();
    const securityQuestions = userData.securityQuestions || [];
    
    // 답변 일치 여부 확인
    let correctAnswers = 0;
    for (let i = 0; i < securityQuestions.length; i++) {
      const question = securityQuestions[i];
      const userAnswer = answers[i] || '';
      
      // 대소문자 구분 없이 비교
      if (question.answer.toLowerCase().trim() === userAnswer.toLowerCase().trim()) {
        correctAnswers++;
      }
    }

    // 모든 질문에 대해 정답을 맞춰야 함
    const isCorrect = correctAnswers === securityQuestions.length;
    
    return {
      success: isCorrect,
      correctAnswers,
      totalQuestions: securityQuestions.length,
      message: isCorrect 
        ? '보안 질문 인증이 완료되었습니다.' 
        : `정답: ${correctAnswers}/${securityQuestions.length}개`
    };
  } catch (error) {
    console.error('보안 질문 확인 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '보안 질문 확인에 실패했습니다.'
    };
  }
};

/**
 * 보안 질문을 통한 비밀번호 재설정
 * @param {string} userId - 사용자 ID
 * @param {string} newPassword - 새 비밀번호
 * @returns {Promise<Object>} 재설정 결과
 */
export const resetPasswordWithSecurityQuestions = async (userId, newPassword) => {
  try {
    // 사용자 정보 조회
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return {
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.'
      };
    }

    // Firebase Auth에서 사용자 정보 가져오기
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
      return {
        success: false,
        message: '인증이 필요합니다. 다시 로그인해주세요.'
      };
    }

    // 비밀번호 변경
    await updatePassword(user, newPassword);

    // Firestore 업데이트
    await updateDoc(userRef, {
      updatedAt: new Date()
    });

    return {
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
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
 * 보안 질문 설정 (회원가입 시 사용)
 * @param {string} userId - 사용자 ID
 * @param {Array} securityQuestions - 보안 질문 배열
 * @returns {Promise<Object>} 설정 결과
 */
export const setSecurityQuestions = async (userId, securityQuestions) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      securityQuestions,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: '보안 질문이 설정되었습니다.'
    };
  } catch (error) {
    console.error('보안 질문 설정 실패:', error);
    return {
      success: false,
      error: error.message,
      message: '보안 질문 설정에 실패했습니다.'
    };
  }
}; 