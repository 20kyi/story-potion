/**
 * 회원가입용 유틸리티
 */

/**
 * 닉네임 자동 생성
 * @returns {string} 생성된 닉네임
 */
export const generateRandomNickname = () => {
  const randomNum = Math.floor(Math.random() * 10000);
  return `포션 유저${randomNum}`;
};



