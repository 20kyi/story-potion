/**
 * 관리자 권한 체크 유틸리티
 * 
 * 관리자 이메일 목록을 중앙에서 관리하고
 * 관리자 권한을 체크하는 함수들을 제공
 */

// 관리자 이메일 목록 (firestore.rules와 동일하게 유지)
const ADMIN_EMAILS = [
  '0521kimyi@gmail.com',  // 메인 관리자
  'acho1821@gmail.com',   // 메인 관리자
  '20kyi@naver.com'       // 서브 관리자
];

// 메인 관리자 이메일 목록 (전체 권한)
const MAIN_ADMIN_EMAILS = [
  '0521kimyi@gmail.com',  // 메인 관리자
  'acho1821@gmail.com'    // 메인 관리자
];

/**
 * 사용자가 관리자인지 확인
 * @param {Object} user - Firebase Auth 사용자 객체
 * @returns {boolean} 관리자 여부
 */
export const isAdmin = (user) => {
  if (!user || !user.email) {
    return false;
  }
  return ADMIN_EMAILS.includes(user.email);
};

/**
 * 관리자 권한이 필요한 컴포넌트에서 사용
 * @param {Object} user - Firebase Auth 사용자 객체
 * @returns {boolean} 관리자 여부
 */
export const checkAdminAccess = (user) => {
  const hasAccess = isAdmin(user);
  
  if (!hasAccess) {
    console.warn('⚠️ 관리자 권한이 필요한 페이지에 접근했습니다.');
  }
  
  return hasAccess;
};

/**
 * 관리자 이메일 목록 반환
 * @returns {Array} 관리자 이메일 배열
 */
export const getAdminEmails = () => {
  return [...ADMIN_EMAILS];
};

/**
 * 특정 이메일이 관리자인지 확인
 * @param {string} email - 확인할 이메일
 * @returns {boolean} 관리자 여부
 */
export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email);
};

/**
 * 사용자가 메인 관리자인지 확인 (전체 권한)
 * @param {Object} user - Firebase Auth 사용자 객체
 * @returns {boolean} 메인 관리자 여부
 */
export const isMainAdmin = (user) => {
  if (!user || !user.email) {
    return false;
  }
  return MAIN_ADMIN_EMAILS.includes(user.email);
};

/**
 * 특정 이메일이 메인 관리자인지 확인
 * @param {string} email - 확인할 이메일
 * @returns {boolean} 메인 관리자 여부
 */
export const isMainAdminEmail = (email) => {
  return MAIN_ADMIN_EMAILS.includes(email);
};

/**
 * 관리자 권한이 필요한 페이지에서 리다이렉트 처리
 * @param {Object} user - Firebase Auth 사용자 객체
 * @param {Function} navigate - React Router navigate 함수
 * @returns {boolean} 관리자 여부 (true면 계속 진행, false면 리다이렉트됨)
 */
export const requireAdmin = (user, navigate) => {
  if (!checkAdminAccess(user)) {
    navigate('/my');
    return false;
  }
  return true;
};

// 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록
if (typeof window !== 'undefined') {
  window.isAdmin = isAdmin;
  window.checkAdminAccess = checkAdminAccess;
  window.getAdminEmails = getAdminEmails;
  window.isAdminEmail = isAdminEmail;
  
  console.log('🔐 관리자 권한 체크 함수들이 준비되었습니다!');
  console.log('💡 사용법:');
  console.log('  - isAdmin(user) : 사용자가 관리자인지 확인');
  console.log('  - getAdminEmails() : 관리자 이메일 목록 조회');
  console.log('  - isAdminEmail("email@example.com") : 특정 이메일이 관리자인지 확인');
} 