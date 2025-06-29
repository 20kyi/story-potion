import React from 'react';
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
    
    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" />
            <div className="settings-container">
                <h2 className="settings-title">개인설정</h2>
                <ul className="settings-list">
                    <li className="settings-item">
                        <span>알림 설정</span>
                        <button className="settings-button" onClick={() => navigate('/my/notification-settings')}>관리</button>
                    </li>
                    <li className="settings-item-expanded">
                        <div className="settings-item-title">
                            <span>테마</span>
                        </div>
                        <div className="theme-options">
                            <label className="theme-option">
                                <input
                                    type="radio"
                                    name="theme"
                                    value="system"
                                    checked={theme === 'system'}
                                    onChange={(e) => setThemeMode(e.target.value)}
                                    className="theme-radio"
                                />
                                <span>시스템 설정</span>
                            </label>
                            <label className="theme-option">
                                <input
                                    type="radio"
                                    name="theme"
                                    value="light"
                                    checked={theme === 'light'}
                                    onChange={(e) => setThemeMode(e.target.value)}
                                    className="theme-radio"
                                />
                                <span>라이트모드</span>
                            </label>
                            <label className="theme-option">
                                <input
                                    type="radio"
                                    name="theme"
                                    value="dark"
                                    checked={theme === 'dark'}
                                    onChange={(e) => setThemeMode(e.target.value)}
                                    className="theme-radio"
                                />
                                <span>다크모드</span>
                            </label>
                        </div>
                    </li>
                    <li className="settings-item">
                        <span>언어</span>
                        <button className="settings-button">한국어</button>
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