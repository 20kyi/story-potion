// 저장소 추상화 레이어
// 웹에서는 localStorage, 앱에서는 AsyncStorage를 사용

class StorageManager {
    constructor() {
        this.isWeb = typeof window !== 'undefined' && window.localStorage;
        this.isApp = false; // React Native 환경 감지 (나중에 수정)
    }

    // 저장소에 데이터 저장
    async setItem(key, value) {
        try {
            if (this.isWeb) {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } else if (this.isApp) {
                // React Native AsyncStorage 사용
                // const AsyncStorage = require('@react-native-async-storage/async-storage');
                // await AsyncStorage.setItem(key, JSON.stringify(value));
                // return true;
                console.log('앱 환경에서는 AsyncStorage를 사용합니다');
                return false;
            }
        } catch (error) {
            console.error('저장소 저장 실패:', error);
            return false;
        }
    }

    // 저장소에서 데이터 불러오기
    async getItem(key) {
        try {
            if (this.isWeb) {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } else if (this.isApp) {
                // React Native AsyncStorage 사용
                // const AsyncStorage = require('@react-native-async-storage/async-storage');
                // const item = await AsyncStorage.getItem(key);
                // return item ? JSON.parse(item) : null;
                console.log('앱 환경에서는 AsyncStorage를 사용합니다');
                return null;
            }
        } catch (error) {
            console.error('저장소 불러오기 실패:', error);
            return null;
        }
    }

    // 저장소에서 데이터 삭제
    async removeItem(key) {
        try {
            if (this.isWeb) {
                localStorage.removeItem(key);
                return true;
            } else if (this.isApp) {
                // React Native AsyncStorage 사용
                // const AsyncStorage = require('@react-native-async-storage/async-storage');
                // await AsyncStorage.removeItem(key);
                // return true;
                console.log('앱 환경에서는 AsyncStorage를 사용합니다');
                return false;
            }
        } catch (error) {
            console.error('저장소 삭제 실패:', error);
            return false;
        }
    }

    // 저장소 초기화
    async clear() {
        try {
            if (this.isWeb) {
                localStorage.clear();
                return true;
            } else if (this.isApp) {
                // React Native AsyncStorage 사용
                // const AsyncStorage = require('@react-native-async-storage/async-storage');
                // await AsyncStorage.clear();
                // return true;
                console.log('앱 환경에서는 AsyncStorage를 사용합니다');
                return false;
            }
        } catch (error) {
            console.error('저장소 초기화 실패:', error);
            return false;
        }
    }
}

// 싱글톤 인스턴스 생성
const storageManager = new StorageManager();

export default storageManager; 