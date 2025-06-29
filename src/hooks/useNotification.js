import { useState, useEffect } from 'react';
import storageManager from '../utils/storage';
import pushNotificationManager from '../utils/pushNotification';

export const useNotification = (user) => {
    const [notification, setNotification] = useState(null);
    const [settings, setSettings] = useState(null);

    // 알림 설정 불러오기
    useEffect(() => {
        const loadSettings = async () => {
            if (!user) return;
            
            try {
                const localSettings = await storageManager.getItem(`notificationSettings_${user.uid}`);
                if (localSettings) {
                    setSettings(localSettings);
                }
            } catch (error) {
                console.error('알림 설정 불러오기 실패:', error);
            }
        };

        loadSettings();
    }, [user]);

    // 알림 표시 함수 (인앱 토스트)
    const showNotification = (message, type = 'info') => {
        setNotification({
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        });

        // 5초 후 자동으로 알림 제거
        setTimeout(() => {
            setNotification(null);
        }, 5000);
    };

    // 푸시 알림 표시 함수
    const showPushNotification = async (title, message, options = {}) => {
        if (pushNotificationManager.isPushSupported() && 
            pushNotificationManager.getPermissionStatus() === 'granted') {
            
            try {
                await pushNotificationManager.showLocalNotification(title, {
                    body: message,
                    ...options
                });
                return true;
            } catch (error) {
                console.error('푸시 알림 표시 실패:', error);
                return false;
            }
        }
        return false;
    };

    // 알림 제거 함수
    const hideNotification = () => {
        setNotification(null);
    };

    // 일기 작성 리마인더 체크
    const checkDiaryReminder = async () => {
        if (!user || !settings || !settings.enabled) return;

        const now = new Date();
        const [hours, minutes] = settings.time.split(':');
        const reminderTime = new Date();
        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // 설정된 시간과 현재 시간이 일치하는지 확인 (1분 오차 허용)
        const timeDiff = Math.abs(now - reminderTime);
        if (timeDiff > 60000) return; // 1분 이상 차이나면 무시

        // 오늘 일기를 이미 작성했는지 확인 (저장소에서)
        const today = new Date().toISOString().split('T')[0];
        const todayDiary = await storageManager.getItem(`diary_${user.uid}_${today}`);
        
        if (!todayDiary) {
            // 오늘 일기를 작성하지 않았으면 알림 표시
            const pushSuccess = await showPushNotification(
                'Story Potion',
                settings.message,
                {
                    icon: '/app_logo/logo.png',
                    tag: 'diary-reminder',
                    requireInteraction: false
                }
            );
            
            // 푸시 알림이 실패하면 인앱 토스트로 대체
            if (!pushSuccess) {
                showNotification(settings.message, 'reminder');
            }
        }
    };

    // 주기적으로 알림 체크 (1분마다)
    useEffect(() => {
        if (!settings?.enabled) return;

        const interval = setInterval(checkDiaryReminder, 60000);
        return () => clearInterval(interval);
    }, [settings, user]);

    return {
        notification,
        showNotification,
        showPushNotification,
        hideNotification,
        settings
    };
}; 