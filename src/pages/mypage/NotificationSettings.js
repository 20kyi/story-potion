import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import storageManager from '../../utils/storage';
import pushNotificationManager from '../../utils/pushNotification';
import './NotificationSettings.css';

function NotificationSettings({ user }) {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        enabled: false,
        time: '21:00',
        message: '오늘의 일기를 작성해보세요! 📝'
    });
    const [loading, setLoading] = useState(true);
    const [pushPermission, setPushPermission] = useState('default');
    const [isPushSupported, setIsPushSupported] = useState(false);
    const [eventEnabled, setEventEnabled] = useState(false);
    const [marketingEnabled, setMarketingEnabled] = useState(false);

    // 사용자의 알림 설정 불러오기
    useEffect(() => {
        const loadSettings = async () => {
            if (!user) return;

            try {
                const localSettings = await storageManager.getItem(`notificationSettings_${user.uid}`);
                if (localSettings) {
                    setSettings(localSettings);
                    setEventEnabled(!!localSettings.eventEnabled);
                    setMarketingEnabled(!!localSettings.marketingEnabled);
                }
            } catch (error) {
                console.error('알림 설정 불러오기 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [user]);

    // 푸시 알림 지원 여부 및 권한 상태 확인
    useEffect(() => {
        const checkPushSupport = () => {
            const supported = pushNotificationManager.isPushSupported();
            setIsPushSupported(supported);

            if (supported) {
                const permission = pushNotificationManager.getPermissionStatus();
                setPushPermission(permission);
            }
        };

        checkPushSupport();
    }, []);

    // 푸시 알림 권한 요청
    const requestPushPermission = async () => {
        const granted = await pushNotificationManager.requestPermission();
        if (granted) {
            setPushPermission('granted');
            await pushNotificationManager.subscribeToPush();
            alert('푸시 알림 권한이 허용되었습니다!');
        } else {
            alert('푸시 알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요.');
        }
    };

    // 알림 설정 저장
    const saveSettings = async (newSettings) => {
        if (!user) {
            alert('사용자 정보를 찾을 수 없습니다.');
            return;
        }

        try {
            const success = await storageManager.setItem(`notificationSettings_${user.uid}`, newSettings);
            if (success) {
                setSettings(newSettings);
                console.log('알림 설정이 성공적으로 저장되었습니다:', newSettings);
            } else {
                alert('알림 설정 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('저장소 저장 실패:', error);
            alert('알림 설정 저장에 실패했습니다. 저장소 접근 권한을 확인해주세요.');
        }
    };

    const handleToggle = async () => {
        const newSettings = { ...settings, enabled: !settings.enabled };

        // 알림을 켤 때 푸시 권한 확인
        if (newSettings.enabled && pushPermission !== 'granted') {
            const shouldRequest = window.confirm(
                '푸시 알림을 받으려면 브라우저 알림 권한이 필요합니다. 권한을 요청하시겠습니까?'
            );

            if (shouldRequest) {
                await requestPushPermission();
            } else {
                return; // 권한 요청을 거부하면 알림을 켜지 않음
            }
        }

        saveSettings(newSettings);
    };

    const handleTimeChange = (e) => {
        const newSettings = { ...settings, time: e.target.value };
        saveSettings(newSettings);
    };

    const handleMessageChange = (e) => {
        const newSettings = { ...settings, message: e.target.value };
        saveSettings(newSettings);
    };

    const handleEventToggle = () => setEventEnabled((prev) => !prev);
    const handleMarketingToggle = () => setMarketingEnabled((prev) => !prev);

    // 저장 버튼 핸들러 추가
    const handleSaveAll = async () => {
        if (!user) {
            alert('사용자 정보를 찾을 수 없습니다.');
            return;
        }
        const newSettings = {
            ...settings,
            eventEnabled,
            marketingEnabled
        };
        try {
            const success = await storageManager.setItem(`notificationSettings_${user.uid}`, newSettings);
            if (success) {
                setSettings(newSettings);
                alert('저장되었습니다.');
            } else {
                alert('저장에 실패했습니다.');
            }
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        }
    };

    if (loading) {
        return (
            <>
                <Header leftAction={() => navigate(-1)} leftIconType="back" />
                <div className="notification-settings-container">
                    <div>로딩 중...</div>
                </div>
                <Navigation />
            </>
        );
    }

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="알림 설정" />
            <div className="notification-settings-container">
                <div className="notification-card notification-section">
                    <div className="notification-item notification-toggle-row">
                        <div className="notification-item-content">
                            <span className="notification-label">일기 작성 리마인더</span>
                            <span className="notification-description">
                                매일 설정된 시간에 일기 작성을 알려드립니다
                            </span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={handleToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                    {settings.enabled && (
                        <div className="notification-item notification-row">
                            <span className="notification-label">알림 시간</span>
                            <input
                                type="time"
                                value={settings.time}
                                onChange={handleTimeChange}
                                className="time-input styled-input"
                            />
                        </div>
                    )}
                    <div className="notification-item notification-toggle-row">
                        <div className="notification-item-content">
                            <span className="notification-label">이벤트/공지 알림</span>
                            <span className="notification-description">
                                중요 공지, 이벤트, 업데이트 소식을 받아보세요
                            </span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={eventEnabled}
                                onChange={handleEventToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                    <div className="notification-item notification-toggle-row">
                        <div className="notification-item-content">
                            <span className="notification-label">마케팅/프로모션 알림</span>
                            <span className="notification-description">
                                광고성 정보, 프로모션, 할인 소식을 받아보세요
                            </span>
                        </div>
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={marketingEnabled}
                                onChange={handleMarketingToggle}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <button className="notification-save-button" style={{ width: '100%', marginTop: 10, marginBottom: 60 }} onClick={handleSaveAll}>저장</button>
                <div className="notification-card notification-info">
                    <h3>알림 정보</h3>
                    <ul>
                        <li>매일 설정된 시간에 알림이 표시됩니다</li>
                        <li>이미 일기를 작성한 날에는 알림이 표시되지 않습니다</li>
                        <li>알림을 끄면 더 이상 알림을 받지 않습니다</li>
                        <li>브라우저 알림 권한이 필요합니다</li>
                    </ul>
                </div>
            </div>
            <Navigation />
        </>
    );
}

export default NotificationSettings; 