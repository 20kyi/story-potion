import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

// Permissions 플러그인 등록
const Permissions = registerPlugin('Permissions', {
  // Android는 네이티브 플러그인이 자동으로 등록되어야 합니다
  // web 구현은 권한이 필요 없으므로 항상 granted 반환
  web: () => ({
    checkPhotoPermission: async () => ({ granted: true }),
    requestPhotoPermission: async () => ({ granted: true }),
  }),
});

/**
 * 사진 액세스 권한 확인
 */
export const checkPhotoPermission = async () => {
  if (Capacitor.getPlatform() === 'web') {
    // 웹에서는 항상 허용 (브라우저가 자동 처리)
    return { granted: true };
  }
  
  try {
    const result = await Permissions.checkPhotoPermission();
    return result;
  } catch (error) {
    console.error('사진 권한 확인 실패:', error);
    return { granted: false };
  }
};

/**
 * 사진 액세스 권한 요청
 */
export const requestPhotoPermission = async () => {
  if (Capacitor.getPlatform() === 'web') {
    // 웹에서는 항상 허용 (브라우저가 자동 처리)
    return { granted: true };
  }
  
  try {
    const result = await Permissions.requestPhotoPermission();
    return result;
  } catch (error) {
    console.error('사진 권한 요청 실패:', error);
    return { granted: false };
  }
};

export default {
  checkPhotoPermission,
  requestPhotoPermission,
};

