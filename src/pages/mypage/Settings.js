import React, { useState } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../../ThemeContext';
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

    const handleAccordion = (key) => {
        setOpen(prev => ({ ...prev, [key]: !prev[key] }));
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
                    {/* 테마 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', paddingBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => navigate('/my/theme-settings')}>
                            <span>테마</span>
                        </div>
                    </li>
                    {/* 언어 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', paddingBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setLanguage(language === '한국어' ? 'English' : '한국어')}>
                            <span>언어</span>
                        </div>
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