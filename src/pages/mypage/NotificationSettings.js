/**
 * NotificationSettings.js - 알림 설정 페이지 컴포넌트
 * 
 * 주요 기능:
 * - 푸시 알림 권한 관리
 * - 일기 작성 리마인더 알림 설정
 * - 이벤트 알림 설정
 * - 마케팅 알림 설정
 * - 알림 시간 및 메시지 커스터마이징
 * - FCM 토큰 관리 및 Firestore 저장
 * - 로컬 스토리지와 Firestore 동기화
 * 
 * 데이터 저장:
 * - 로컬 스토리지: 즉시 접근 가능한 설정
 * - Firestore: 서버 동기화 및 백업
 * 
 * 사용된 라이브러리:
 * - firebase: FCM 토큰, Firestore
 * - utils/storage: 로컬 스토리지 관리
 * - utils/pushNotification: 푸시 알림 관리
 */

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth, db, getFcmToken } from '../../firebase';
import storageManager from '../../utils/storage';
import pushNotificationManager from '../../utils/pushNotification';
import './NotificationSettings.css';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useTranslation } from '../../LanguageContext';

/**
 * 알림 설정 페이지 컴포넌트
 * @param {Object} user - 현재 로그인한 사용자 정보
 */
function NotificationSettings({ user }) {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // 알림 설정 상태
    const [settings, setSettings] = useState({
        enabled: false, // 알림 활성화 여부
        time: '21:00', // 알림 시간 (기본값: 오후 9시)
        message: '오늘의 일기를 작성해보세요! 📝' // 알림 메시지
    });

    // UI 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [pushPermission, setPushPermission] = useState('default'); // 푸시 권한 상태
    const [isPushSupported, setIsPushSupported] = useState(false); // 푸시 알림 지원 여부

    // 추가 알림 설정
    const [eventEnabled, setEventEnabled] = useState(false); // 이벤트 알림
    const [marketingEnabled, setMarketingEnabled] = useState(false); // 마케팅 알림

    // 사용자의 알림 설정 불러오기
    useEffect(() => {
        const loadSettings = async () => {
            if (!user) return;
            try {
                // Firestore에서 알림 설정 불러오기
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setSettings({
                        enabled: !!data.reminderEnabled,
                        time: data.reminderTime || '21:00',
                        message: data.message || '오늘의 일기를 작성해보세요! 📝'
                    });
                    setEventEnabled(!!data.eventEnabled);
                    setMarketingEnabled(!!data.marketingEnabled);
                }
            } catch (error) {
                console.error('알림 설정 Firestore 불러오기 실패:', error);
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

    /**
     * FCM 토큰을 Firestore에 저장
     * @param {string} uid - 사용자 ID
     * @param {string} token - FCM 토큰
     */
    const saveFcmTokenToFirestore = async (uid, token) => {
        try {
            await setDoc(doc(db, "users", uid), { fcmToken: token }, { merge: true });
        } catch (error) {
            console.error('FCM 토큰 Firestore 저장 실패:', error);
        }
    };

    /**
     * 푸시 알림 권한 요청 및 FCM 토큰 발급
     * 사용자에게 브라우저 알림 권한을 요청하고, 허용 시 FCM 토큰을 발급받아 저장
     */
    const requestPushPermission = async () => {
        if (Capacitor.getPlatform() !== 'web') {
            const permStatus = await PushNotifications.requestPermissions();
            if (permStatus.receive === 'granted') {
                await PushNotifications.register();
                if (!window.__pushRegListenerAdded) {
                    window.__pushRegListenerAdded = true;
                    await PushNotifications.addListener('registration', async (token) => {
                        alert('FCM 토큰: ' + token.value + '\nuser: ' + JSON.stringify(user));
                        console.log('FCM 토큰:', token.value, 'user:', user);
                        if (user && token.value) {
                            await saveFcmTokenToFirestore(user.uid, token.value);
                            console.log('앱 FCM 토큰 Firestore 저장 완료:', token.value);
                        }
                    });
                }
                setPushPermission('granted');
                await pushNotificationManager.subscribeToPush();
                alert('푸시 알림 권한이 허용되었습니다!');
            } else {
                alert('푸시 알림 권한이 필요합니다. 앱 설정에서 알림을 허용해주세요.');
            }
        } else {
            // 웹 환경: 기존 방식 유지
            const granted = await pushNotificationManager.requestPermission();
            if (granted) {
                setPushPermission('granted');
                await pushNotificationManager.subscribeToPush();
                if (user) {
                    try {
                        const token = await getFcmToken();
                        if (token) {
                            await saveFcmTokenToFirestore(user.uid, token);
                            console.log('FCM 토큰 Firestore 저장 완료:', token);
                        }
                    } catch (error) {
                        console.error('FCM 토큰 Firestore 저장 중 오류:', error);
                    }
                }
                alert('푸시 알림 권한이 허용되었습니다!');
            } else {
                alert('푸시 알림 권한이 필요합니다. 브라우저 설정에서 알림을 허용해주세요.');
            }
        }
    };

    // Firestore에 알림 설정 저장 함수 수정 (undefined 방지)
    const saveSettingsToFirestore = async (uid, newSettings) => {
        try {
            const data = {
                reminderEnabled: newSettings.enabled ?? false,
                reminderTime: newSettings.time ?? '',
                eventEnabled: newSettings.eventEnabled ?? false,
                marketingEnabled: newSettings.marketingEnabled ?? false,
                reminderTimezone: newSettings.reminderTimezone ?? 'Asia/Seoul',
            };
            await setDoc(doc(db, "users", uid), data, { merge: true });
        } catch (error) {
            console.error('Firestore 저장 실패:', error);
        }
    };

    // 알림 설정 저장 함수도 웹/앱 분기 명확히 적용
    const saveSettings = async (newSettings) => {
        if (!user) {
            alert('사용자 정보를 찾을 수 없습니다.');
            return;
        }
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const safeSettings = {
                ...newSettings,
                eventEnabled: newSettings.eventEnabled ?? false,
                marketingEnabled: newSettings.marketingEnabled ?? false,
                reminderTimezone: timezone,
            };
            const success = await storageManager.setItem(`notificationSettings_${user.uid}`, safeSettings);
            if (success) {
                setSettings(safeSettings);
                console.log('알림 설정이 성공적으로 저장되었습니다:', safeSettings);
                await saveSettingsToFirestore(user.uid, safeSettings);
                // FCM 토큰 저장은 환경별로 분기
                if (Capacitor.getPlatform() === 'web') {
                    try {
                        const token = await getFcmToken();
                        if (token) {
                            await saveFcmTokenToFirestore(user.uid, token);
                            console.log('FCM 토큰 Firestore 저장 완료:', token);
                        }
                    } catch (error) {
                        console.error('FCM 토큰 Firestore 저장 중 오류:', error);
                    }
                } // 앱 환경에서는 이미 registration 리스너에서 저장됨
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
        alert('handleSaveAll 실행됨');
        console.log('handleSaveAll 실행됨');
        if (!user) {
            console.log('user 없음');
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
                await saveSettingsToFirestore(user.uid, newSettings);

                // 디버깅 로그 추가
                console.log('알림 상태:', newSettings.enabled, '권한:', pushPermission);

                if (newSettings.enabled && pushPermission === 'granted') {
                    console.log('FCM 토큰 발급 시도');
                    const token = await getFcmToken();
                    console.log('발급된 FCM 토큰:', token);
                    if (token) {
                        await saveFcmTokenToFirestore(user.uid, token);
                        console.log('FCM 토큰 Firestore 저장 완료:', token);
                    } else {
                        console.error('FCM 토큰 발급 실패');
                    }
                }
            } else {
                alert('저장에 실패했습니다.');
            }
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <>
                <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('notification')} />
                <div className="notification-settings-container">
                    <div>{t('loading')}</div>
                </div>
                <Navigation />
            </>
        );
    }

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('notification')} />
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