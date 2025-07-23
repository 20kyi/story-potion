import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// 앱 환경 설정 관리
// 웹과 앱 환경에서 공통으로 사용할 설정들

export const APP_CONFIG = {
    // 앱 정보
    APP_NAME: 'Story Potion',
    APP_VERSION: '1.0.0',

    // 저장소 키들
    STORAGE_KEYS: {
        NOTIFICATION_SETTINGS: 'notificationSettings',
        DIARY: 'diary',
        NOVEL: 'novel',
        USER_PREFERENCES: 'userPreferences',
        THEME: 'theme'
    },

    // 알림 설정 기본값
    DEFAULT_NOTIFICATION_SETTINGS: {
        enabled: false,
        time: '21:00',
        message: '오늘의 일기를 작성해보세요! 📝'
    },

    // 테마 설정
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system'
    },

    // 앱 환경 감지
    ENVIRONMENT: {
        isWeb: typeof window !== 'undefined' && window.localStorage,
        isApp: false, // React Native 환경 감지 (나중에 수정)
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production'
    }
};

// 환경별 설정
export const getEnvironmentConfig = () => {
    if (APP_CONFIG.ENVIRONMENT.isWeb) {
        return {
            storage: 'localStorage',
            notifications: 'browser',
            platform: 'web'
        };
    } else if (APP_CONFIG.ENVIRONMENT.isApp) {
        return {
            storage: 'AsyncStorage',
            notifications: 'push',
            platform: 'mobile'
        };
    }

    return {
        storage: 'localStorage',
        notifications: 'browser',
        platform: 'web'
    };
};

// 앱 전환 시 마이그레이션 도구
export const migrateData = async (fromStorage, toStorage) => {
    try {
        // 기존 데이터 백업
        const backup = await fromStorage.getAllKeys();

        // 새 저장소로 데이터 이전
        for (const key of backup) {
            const data = await fromStorage.getItem(key);
            if (data) {
                await toStorage.setItem(key, data);
            }
        }

        console.log('데이터 마이그레이션이 완료되었습니다.');
        return true;
    } catch (error) {
        console.error('데이터 마이그레이션 실패:', error);
        return false;
    }
};

// Firestore에서 정책값을 읽는 함수
export async function getPointPolicy(key, defaultValue) {
    const docRef = doc(db, 'config', 'pointPolicies');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data()[key] !== undefined) {
        return docSnap.data()[key];
    }
    return defaultValue;
}

// Firestore에 정책값을 저장하는 함수 (관리자용)
export async function setPointPolicy(key, value) {
    const docRef = doc(db, 'config', 'pointPolicies');
    await setDoc(docRef, { [key]: value }, { merge: true });
} 