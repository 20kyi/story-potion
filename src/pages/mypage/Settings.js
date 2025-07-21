import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../../ThemeContext';
import notificationTest from '../../utils/notificationTest';
import './Settings.css';

function Settings() {
    const navigate = useNavigate();
    const { theme, setThemeMode } = useTheme();
    const [open, setOpen] = useState({
        notification: false,
        theme: false,
        language: false,
    });
    const [language, setLanguage] = useState('한국어');
    const [notificationStatus, setNotificationStatus] = useState({
        supported: false,
        granted: false,
        message: '확인 중...'
    });

    // 알림 상태 확인
    useEffect(() => {
        const checkNotificationStatus = async () => {
            try {
                const status = await notificationTest.checkPermission();
                setNotificationStatus(status);
            } catch (error) {
                console.error('알림 상태 확인 실패:', error);
                setNotificationStatus({
                    supported: false,
                    granted: false,
                    message: '상태 확인 실패'
                });
            }
        };

        checkNotificationStatus();
    }, []);

    const handleAccordion = (key) => {
        setOpen(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 알림 상태에 따른 스타일 반환
    const getStatusStyle = () => {
        if (!notificationStatus.supported) {
            return { color: '#999', fontSize: '12px' };
        }

        if (notificationStatus.granted) {
            return { color: '#4CAF50', fontSize: '12px' };
        } else {
            return { color: '#FF9800', fontSize: '12px' };
        }
    };

    // 알림 상태 텍스트 반환
    const getStatusText = () => {
        if (!notificationStatus.supported) {
            return '지원 안됨';
        }

        if (notificationStatus.granted) {
            return '권한 허용됨';
        } else {
            return '권한 필요';
        }
    };

    // 알림 테스트 함수
    const handleNotificationTest = async () => {
        try {
            // 먼저 권한 확인 없이 알림 전송 시도
            await notificationTest.sendTestNotification();
            // 성공 시 별도 메시지 없음
        } catch (error) {
            if (error.message === 'PERMISSION_REQUIRED') {
                // 권한이 필요한 경우 안내 메시지 표시
                const guideMessage = notificationTest.getPermissionGuideMessage();
                const userConfirmed = window.confirm(guideMessage);

                if (userConfirmed) {
                    try {
                        // 사용자가 확인하면 권한 요청 후 알림 전송
                        await notificationTest.sendTestNotificationWithPermission();
                        // 성공 시 별도 메시지 없음

                        // 권한 상태 다시 확인
                        const newStatus = await notificationTest.checkPermission();
                        setNotificationStatus(newStatus);
                    } catch (permissionError) {
                        console.error('권한 요청 후 알림 전송 실패:', permissionError);
                        alert(`알림 전송 실패: ${permissionError.message}`);
                    }
                }
            } else {
                console.error('알림 테스트 실패:', error);
                alert(`알림 테스트 실패: ${error.message}`);
            }
        }
    };

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="개인설정" />
            <div className="settings-container">
                <ul className="settings-list">
                    {/* 알림설정 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', paddingBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => navigate('/my/notification-settings')}>
                            <span>알림 설정</span>
                        </div>
                    </li>

                    {/* 알림 테스트 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span>알림 테스트</span>
                                <span style={getStatusStyle()}>
                                    {getStatusText()}
                                </span>
                            </div>
                            <button
                                onClick={handleNotificationTest}
                                disabled={!notificationStatus.supported}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: notificationStatus.supported ? '#e46262' : '#ccc',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: notificationStatus.supported ? 'pointer' : 'not-allowed'
                                }}
                            >
                                테스트
                            </button>
                        </div>
                    </li>

                    {/* 테마 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', paddingBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => navigate('/my/theme-settings')}>
                            <span>테마</span>
                        </div>
                    </li>
                    {/* 언어 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>언어</span>
                        <select
                            className="settings-select"
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            style={{ marginLeft: 'auto', width: 160, fontSize: 18, padding: '6px 12px', borderRadius: 8 }}
                        >
                            <option value="한국어">한국어</option>
                            <option value="English">English</option>
                        </select>
                    </li>
                </ul>
                <button
                    className="logout-button"
                    onClick={async () => {
                        try {
                            await signOut(auth);
                            alert('로그아웃 되었습니다.');
                        } catch (error) {
                            alert('로그아웃에 실패했습니다.');
                        }
                    }}
                >
                    로그아웃
                </button>
                <div className="withdraw-link">
                    <span>탈퇴하기</span>
                </div>
            </div>
            <Navigation />
        </>
    );
}

export default Settings; 