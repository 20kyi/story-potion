/**
 * 프로필 이미지 URL 처리 유틸리티
 */

/**
 * 카카오 프로필 이미지 URL을 HTTPS로 변환
 * @param {string} photoURL - 원본 카카오 프로필 이미지 URL
 * @returns {string} HTTPS로 변환된 이미지 URL
 */
export const convertKakaoImageUrlToHttps = (photoURL) => {
  if (!photoURL || typeof photoURL !== 'string') {
    return null;
  }

  // 카카오 이미지 URL인지 확인 (k.kakaocdn.net 또는 dn.kakaocdn.net)
  if (photoURL.includes('kakaocdn.net')) {
    // HTTP를 HTTPS로 변환
    if (photoURL.startsWith('http://')) {
      return photoURL.replace('http://', 'https://');
    }
  }

  return photoURL;
};

/**
 * Google 프로필 이미지 URL을 정리하여 반환
 * @param {string} photoURL - 원본 Google 프로필 이미지 URL
 * @returns {string} 정리된 이미지 URL
 */
export const cleanGoogleProfileImageUrl = (photoURL) => {
  if (!photoURL || typeof photoURL !== 'string') {
    return null;
  }

  // Google 프로필 이미지 URL인지 확인
  if (photoURL.includes('lh3.googleusercontent.com')) {
    // 크기 제한 파라미터 제거 (s96-c, s400-c 등)
    const cleanedUrl = photoURL.replace(/=s\d+-c$/, '');
    return cleanedUrl;
  }

  return photoURL;
};

/**
 * 프로필 이미지 URL이 유효한지 확인
 * @param {string} photoURL - 프로필 이미지 URL
 * @returns {boolean} 유효성 여부
 */
export const isValidProfileImageUrl = (photoURL) => {
  if (!photoURL || typeof photoURL !== 'string') {
    return false;
  }

  // 빈 문자열, null, undefined 체크
  if (photoURL.trim() === '' || photoURL === 'null' || photoURL === 'undefined') {
    return false;
  }

  // 기본 프로필 이미지인지 체크
  if (photoURL.includes('default-profile.svg')) {
    return false;
  }

  return true;
};

/**
 * 프로필 이미지 URL을 안전하게 처리하여 반환
 * @param {string} photoURL - 원본 프로필 이미지 URL
 * @param {string} fallbackUrl - 대체 이미지 URL (기본값: default-profile.svg)
 * @returns {string} 안전한 이미지 URL
 */
export const getSafeProfileImageUrl = (photoURL, fallbackUrl = '/default-profile.svg') => {
  if (!isValidProfileImageUrl(photoURL)) {
    return fallbackUrl;
  }

  // 카카오 프로필 이미지인 경우 HTTPS로 변환
  if (photoURL.includes('kakaocdn.net')) {
    const httpsUrl = convertKakaoImageUrlToHttps(photoURL);
    return httpsUrl || fallbackUrl;
  }

  // Google 프로필 이미지인 경우 정리
  const cleanedUrl = cleanGoogleProfileImageUrl(photoURL);
  
  return cleanedUrl || fallbackUrl;
};

/**
 * 이미지 로드 에러 핸들러
 * @param {Event} event - 이미지 로드 에러 이벤트
 * @param {string} fallbackUrl - 대체 이미지 URL
 */
export const handleImageError = (event, fallbackUrl = '/default-profile.svg') => {
  console.log('프로필 이미지 로드 실패:', event.target.src);
  event.target.src = fallbackUrl;
  event.target.onerror = null; // 무한 루프 방지
};

/**
 * Google 프로필 이미지 URL을 더 큰 크기로 요청
 * @param {string} photoURL - 원본 Google 프로필 이미지 URL
 * @param {number} size - 원하는 이미지 크기 (기본값: 400)
 * @returns {string} 크기가 조정된 이미지 URL
 */
export const getGoogleProfileImageWithSize = (photoURL, size = 400) => {
  if (!photoURL || typeof photoURL !== 'string') {
    return null;
  }

  // Google 프로필 이미지 URL인지 확인
  if (photoURL.includes('lh3.googleusercontent.com')) {
    // 기존 크기 파라미터 제거 후 새로운 크기 추가
    const baseUrl = photoURL.replace(/=s\d+-c$/, '');
    return `${baseUrl}=s${size}-c`;
  }

  return photoURL;
}; 