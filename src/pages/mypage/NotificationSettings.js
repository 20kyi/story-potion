import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import storageManager from '../../utils/storage';
import './NotificationSettings.css';

function NotificationSettings({ user }) {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        enabled: false,
        time: '21:00',
        message: '오늘의 일기를 작성해보세요! 📝'
    });
    const [loading, setLoading] = useState(true);

    // 사용자의 알림 설정 불러오기
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
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, [user]);

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

    const handleToggle = () => {
        const newSettings = { ...settings, enabled: !settings.enabled };
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
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div className="notification-settings-container">
                <h2 className="notification-settings-title">알림 설정</h2>
                
                <div className="notification-section">
                    <div className="notification-item">
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
                </div>

                {settings.enabled && (
                    <div className="notification-details">
                        <div className="notification-item">
                            <span className="notification-label">알림 시간</span>
                            <input
                                type="time"
                                value={settings.time}
                                onChange={handleTimeChange}
                                className="time-input"
                            />
                        </div>
                        
                        <div className="notification-item">
                            <span className="notification-label">알림 메시지</span>
                            <input
                                type="text"
                                value={settings.message}
                                onChange={handleMessageChange}
                                placeholder="알림 메시지를 입력하세요"
                                className="message-input"
                                maxLength={50}
                            />
                        </div>
                    </div>
                )}

                <div className="notification-info">
                    <h3>알림 정보</h3>
                    <ul>
                        <li>• 매일 설정된 시간에 알림이 표시됩니다</li>
                        <li>• 이미 일기를 작성한 날에는 알림이 표시되지 않습니다</li>
                        <li>• 알림을 끄면 더 이상 알림을 받지 않습니다</li>
                    </ul>
                </div>
            </div>
            <Navigation />
        </>
    );
}

export default NotificationSettings; 