// 웹 푸시 알림 유틸리티
class PushNotificationManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.permission = 'default';
        this.subscription = null;
    }

    // 푸시 알림 지원 여부 확인
    isPushSupported() {
        return this.isSupported;
    }

    // 알림 권한 요청
    async requestPermission() {
        if (!this.isSupported) {
            console.log('푸시 알림을 지원하지 않는 브라우저입니다.');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                console.log('푸시 알림 권한이 허용되었습니다.');
                return true;
            } else {
                console.log('푸시 알림 권한이 거부되었습니다.');
                return false;
            }
        } catch (error) {
            console.error('알림 권한 요청 실패:', error);
            return false;
        }
    }

    // 서비스 워커 등록
    async registerServiceWorker() {
        if (!this.isSupported) return false;

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('서비스 워커가 등록되었습니다:', registration);
            return registration;
        } catch (error) {
            console.error('서비스 워커 등록 실패:', error);
            return false;
        }
    }

    // 푸시 구독 생성
    async subscribeToPush() {
        if (!this.isSupported || this.permission !== 'granted') {
            return false;
        }

        try {
            const registration = await this.registerServiceWorker();
            if (!registration) return false;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
            });

            this.subscription = subscription;
            console.log('푸시 구독이 생성되었습니다:', subscription);
            return subscription;
        } catch (error) {
            console.error('푸시 구독 생성 실패:', error);
            return false;
        }
    }

    // 푸시 구독 해제
    async unsubscribeFromPush() {
        if (!this.subscription) return false;

        try {
            await this.subscription.unsubscribe();
            this.subscription = null;
            console.log('푸시 구독이 해제되었습니다.');
            return true;
        } catch (error) {
            console.error('푸시 구독 해제 실패:', error);
            return false;
        }
    }

    // 로컬 알림 표시 (서비스 워커 없이)
    async showLocalNotification(title, options = {}) {
        if (!this.isSupported || this.permission !== 'granted') {
            return false;
        }

        try {
            const notification = new Notification(title, {
                icon: '/app_logo/logo.png',
                badge: '/app_logo/logo.png',
                tag: 'story-potion-notification',
                requireInteraction: false,
                silent: false,
                ...options
            });

            // 알림 클릭 이벤트
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('로컬 알림 표시 실패:', error);
            return false;
        }
    }

    // VAPID 키 변환 (Base64 → Uint8Array)
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // 현재 권한 상태 확인
    getPermissionStatus() {
        return this.permission;
    }

    // 구독 상태 확인
    isSubscribed() {
        return this.subscription !== null;
    }
}

// 싱글톤 인스턴스 생성
const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager; 