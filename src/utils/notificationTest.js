import { Capacitor } from '@capacitor/core';
// 추가: Capacitor PushNotifications import
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

/**
 * 알림 테스트 유틸리티
 * 웹과 앱 환경 모두에서 사용 가능
 */
class NotificationTest {
    constructor() {
        this.isWeb = Capacitor.getPlatform() === 'web';
        this.isAndroid = Capacitor.getPlatform() === 'android';
        this.isIOS = Capacitor.getPlatform() === 'ios';
    }

    /**
     * 알림 권한 확인
     */
    async checkPermission() {
        if (this.isWeb) {
            // 웹 환경: 브라우저 알림 권한 확인
            if (!('Notification' in window)) {
                return { supported: false, granted: false, message: '브라우저가 알림을 지원하지 않습니다.' };
            }

            const permission = Notification.permission;
            return {
                supported: true,
                granted: permission === 'granted',
                permission: permission,
                message: this.getPermissionMessage(permission)
            };
        } else {
            // 앱 환경: 기본적으로 권한이 있다고 가정 (실제로는 더 정확한 확인 필요)
            return {
                supported: true,
                granted: true,
                permission: 'granted',
                message: '앱 환경에서 알림이 지원됩니다.'
            };
        }
    }

    /**
     * 알림 권한 요청 (사용자 확인 후)
     */
    async requestPermission() {
        if (this.isWeb) {
            if (!('Notification' in window)) {
                throw new Error('브라우저가 알림을 지원하지 않습니다.');
            }

            const permission = await Notification.requestPermission();
            return {
                granted: permission === 'granted',
                permission: permission,
                message: this.getPermissionMessage(permission)
            };
        } else if (this.isAndroid) {
            // 안드로이드 앱 환경: 명시적으로 알림 권한 요청
            const result = await PushNotifications.requestPermissions();
            return {
                granted: result.receive === 'granted',
                permission: result.receive,
                message: result.receive === 'granted' ? '알림 권한이 허용되었습니다.' : '알림 권한이 거부되었습니다.'
            };
        } else {
            // 기타 앱 환경에서는 권한이 이미 있다고 가정
            return {
                granted: true,
                permission: 'granted',
                message: '앱 환경에서 알림이 지원됩니다.'
            };
        }
    }

    /**
     * 권한 상태에 따른 안내 메시지 반환
     */
    getPermissionGuideMessage() {
        if (this.isWeb) {
            if (!('Notification' in window)) {
                return '브라우저가 알림을 지원하지 않습니다.';
            }

            const permission = Notification.permission;
            switch (permission) {
                case 'granted':
                    return '알림 권한이 허용되어 있습니다.';
                case 'denied':
                    return '알림 권한이 거부되었습니다.\n브라우저 설정에서 권한을 허용해주세요.';
                case 'default':
                    return '알림 테스트를 위해 권한이 필요합니다.\n"확인"을 누르면 권한 요청 창이 나타납니다.';
                default:
                    return '알림 권한 상태를 확인할 수 없습니다.';
            }
        } else {
            return '앱 환경에서 알림이 지원됩니다.';
        }
    }

    /**
     * 테스트 알림 보내기 (권한 확인 포함)
     */
    async sendTestNotification(title = 'Story Potion 테스트', body = '알림 기능이 정상적으로 작동합니다! 🎉') {
        try {
            // 권한 확인
            const permissionCheck = await this.checkPermission();

            if (!permissionCheck.supported) {
                throw new Error(permissionCheck.message);
            }

            if (!permissionCheck.granted) {
                // 권한이 없으면 에러를 던져서 상위에서 처리하도록 함
                throw new Error('PERMISSION_REQUIRED');
            }

            // 권한이 있으면 알림 보내기
            if (this.isWeb) {
                return await this.sendWebNotification(title, body);
            } else {
                return await this.sendAppNotification(title, body);
            }
        } catch (error) {
            console.error('알림 전송 실패:', error);
            throw error;
        }
    }

    /**
     * 권한 요청 후 테스트 알림 보내기
     */
    async sendTestNotificationWithPermission(title = 'Story Potion 테스트', body = '알림 기능이 정상적으로 작동합니다! 🎉') {
        try {
            // 권한 요청
            const permissionResult = await this.requestPermission();
            if (!permissionResult.granted) {
                throw new Error('알림 권한이 거부되었습니다.');
            }

            // 알림 보내기
            if (this.isWeb) {
                return await this.sendWebNotification(title, body);
            } else {
                return await this.sendAppNotification(title, body);
            }
        } catch (error) {
            console.error('알림 전송 실패:', error);
            throw error;
        }
    }

    /**
     * 웹 알림 보내기
     */
    async sendWebNotification(title, body) {
        return new Promise((resolve, reject) => {
            try {
                const notification = new Notification(title, {
                    body: body,
                    icon: '/app_logo/logo.png',
                    badge: '/app_logo/logo.png',
                    tag: 'test-notification',
                    requireInteraction: false,
                    silent: false
                });

                notification.onclick = () => {
                    console.log('웹 알림 클릭됨');
                    notification.close();
                    resolve(true);
                };

                notification.onshow = () => {
                    console.log('웹 알림 표시됨');
                };

                notification.onerror = (error) => {
                    console.error('웹 알림 오류:', error);
                    reject(error);
                };

                // 5초 후 자동으로 닫기
                setTimeout(() => {
                    notification.close();
                    resolve(true);
                }, 5000);

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 앱 알림 보내기 (향후 Capacitor 플러그인 추가 시 구현)
     */
    async sendAppNotification(title = 'Story Potion 테스트', body = '알림 기능이 정상적으로 작동합니다! 🎉') {
        if (this.isAndroid) {
            // Capacitor LocalNotifications 사용
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id: Math.floor(Date.now() % 1000000),
                        // schedule: { at: new Date(Date.now() + 1000) }, // 즉시 알림을 위해 제거
                        sound: null,
                        attachments: null,
                        actionTypeId: "",
                        extra: null
                    }
                ]
            });
            return true;
        } else {
            // 기존 웹 알림 방식
            return await this.sendWebNotification(title, body);
        }
    }

    /**
     * 권한 상태에 따른 메시지 반환
     */
    getPermissionMessage(permission) {
        switch (permission) {
            case 'granted':
                return '알림 권한이 허용되었습니다.';
            case 'denied':
                return '알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
            case 'default':
                return '알림 권한이 요청되지 않았습니다.';
            default:
                return '알림 권한 상태를 확인할 수 없습니다.';
        }
    }

    /**
     * 현재 환경 정보 반환
     */
    getEnvironmentInfo() {
        return {
            platform: Capacitor.getPlatform(),
            isWeb: this.isWeb,
            isAndroid: this.isAndroid,
            isIOS: this.isIOS,
            userAgent: navigator.userAgent
        };
    }
}

// 싱글톤 인스턴스 생성
const notificationTest = new NotificationTest();
export default notificationTest; 