import React from 'react';
import { useTheme } from '../../ThemeContext';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

function ThemeSettings() {
    const { theme, setThemeMode } = useTheme();
    const navigate = useNavigate();

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title="테마 설정" />
            <div className="settings-container">
                <div className="theme-options" style={{ marginTop: 16 }}>
                    <label className="theme-option">
                        <span>시스템 설정</span>
                        <input
                            type="radio"
                            name="theme"
                            value="system"
                            checked={theme === 'system'}
                            onChange={e => setThemeMode(e.target.value)}
                            className="theme-radio"
                        />
                    </label>
                    <label className="theme-option">
                        <span>라이트모드</span>
                        <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={theme === 'light'}
                            onChange={e => setThemeMode(e.target.value)}
                            className="theme-radio"
                        />
                    </label>
                    <label className="theme-option">
                        <span>다크모드</span>
                        <input
                            type="radio"
                            name="theme"
                            value="dark"
                            checked={theme === 'dark'}
                            onChange={e => setThemeMode(e.target.value)}
                            className="theme-radio"
                        />
                    </label>
                    <label className="theme-option">
                        <span>다이어리 테마</span>
                        <input
                            type="radio"
                            name="theme"
                            value="diary"
                            checked={theme === 'diary'}
                            onChange={e => setThemeMode(e.target.value)}
                            className="theme-radio"
                        />
                    </label>
                    <label className="theme-option">
                        <span>글래스모피즘 테마</span>
                        <input
                            type="radio"
                            name="theme"
                            value="glass"
                            checked={theme === 'glass'}
                            onChange={e => setThemeMode(e.target.value)}
                            className="theme-radio"
                        />
                    </label>
                </div>
            </div>
        </>
    );
}
export default ThemeSettings; 