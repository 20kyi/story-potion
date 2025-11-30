import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useTheme } from '../../ThemeContext';
import './Settings.css';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useLanguage } from '../../LanguageContext';

const FONT_OPTIONS = [
    { label: '시스템 기본', value: 'system-ui, sans-serif' },
    { label: '서울한강체', value: "'SeoulHangang', sans-serif" },
    { label: '시네마', value: "'Cinema', sans-serif" },
    { label: '엄마의편지', value: "'MomLetter', sans-serif" },
    { label: '나눔고딕', value: 'NanumGothic, sans-serif' },
    { label: '휴먼범석네오', value: 'HumanBeomseokNeo, sans-serif' },
    { label: '어른아이', value: 'Adultkid, sans-serif' },
    { label: '사각사각', value: 'Sagak-sagak, sans-serif' },
];

const FONT_SIZE_OPTIONS = [
    { label: '작게', value: '12' },
    { label: '작음', value: '14' },
    { label: '기본', value: '16' },
    { label: '큼', value: '18' },
    { label: '크게', value: '20' },
];

function Settings() {
    const navigate = useNavigate();
    const { theme, setThemeMode, toggleTheme, fontFamily, setFontFamily, fontSize, setFontSize, actualTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [open, setOpen] = useState({
        notification: false,
        theme: false,
        language: false,
    });
    const [logoutModal, setLogoutModal] = useState(false);



    const handleAccordion = (key) => {
        setOpen(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 로그아웃 모달 열기
    const handleLogoutClick = () => {
        setLogoutModal(true);
    };

    // 실제 로그아웃 실행
    const doLogout = async () => {
        try {
            await auth.signOut();
            alert(t('logout_success'));
        } catch (error) {
            alert(t('logout_failed'));
        } finally {
            setLogoutModal(false);
        }
    };

    return (
        <>
            <Header leftAction={() => navigate(-1)} leftIconType="back" title={t('personal_settings')} />
            <div className="settings-container">
                <ul className="settings-list">
                    {/* 알림설정 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'pointer', paddingBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => navigate('/my/notification-settings')}>
                            <span>{t('notification_settings')}</span>
                        </div>
                    </li>

                    {/* 테마 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>{t('theme')}</span>
                        <select
                            className="settings-select"
                            value={theme}
                            onChange={e => setThemeMode(e.target.value)}
                            style={{
                                marginLeft: 'auto',
                                width: 160,
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: `1px solid ${actualTheme === 'dark' ? '#333333' : '#ddd'}`,
                                fontSize: '14px',
                                backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff',
                                color: actualTheme === 'dark' ? '#f1f1f1' : '#222',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="light" style={{ backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff', color: actualTheme === 'dark' ? '#f1f1f1' : '#222' }}>{t('theme_light') || '라이트 모드'}</option>
                            <option value="dark" style={{ backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff', color: actualTheme === 'dark' ? '#f1f1f1' : '#222' }}>{t('theme_dark') || '다크 모드'}</option>
                            <option value="diary" style={{ backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff', color: actualTheme === 'dark' ? '#f1f1f1' : '#222' }}>다이어리 테마</option>
                            <option value="glass" style={{ backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff', color: actualTheme === 'dark' ? '#f1f1f1' : '#222' }}>글래스모피즘 테마</option>
                            <option value="system" style={{ backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff', color: actualTheme === 'dark' ? '#f1f1f1' : '#222' }}>{t('theme_system') || '시스템 설정'}</option>
                        </select>
                    </li>
                    {/* 언어 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>{t('language')}</span>
                        <select
                            className="settings-select"
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            style={{
                                marginLeft: 'auto',
                                width: 160,
                                fontSize: 18,
                                padding: '6px 12px',
                                borderRadius: 8,
                                backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff',
                                color: actualTheme === 'dark' ? '#f1f1f1' : '#222',
                                border: `1px solid ${actualTheme === 'dark' ? '#333333' : '#e0e0e0'}`
                            }}
                        >
                            <option value="ko" style={{ backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff', color: actualTheme === 'dark' ? '#f1f1f1' : '#222' }}>한국어</option>
                            <option value="en" style={{ backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff', color: actualTheme === 'dark' ? '#f1f1f1' : '#222' }}>English</option>
                        </select>
                    </li>
                    {/* 폰트 선택 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>{t('font')}</span>
                        <select
                            className="settings-select"
                            value={fontFamily}
                            onChange={e => setFontFamily(e.target.value)}
                            style={{
                                marginLeft: 'auto',
                                width: 200,
                                fontSize: 18,
                                padding: '6px 12px',
                                borderRadius: 8,
                                backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff',
                                color: actualTheme === 'dark' ? '#f1f1f1' : '#222',
                                border: `1px solid ${actualTheme === 'dark' ? '#333333' : '#e0e0e0'}`
                            }}
                        >
                            {FONT_OPTIONS.map(opt => (
                                <option
                                    key={opt.value}
                                    value={opt.value}
                                    style={{
                                        backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff',
                                        color: actualTheme === 'dark' ? '#f1f1f1' : '#222'
                                    }}
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </li>
                    {/* 폰트 크기 선택 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>{t('font_size')}</span>
                        <select
                            className="settings-select"
                            value={fontSize}
                            onChange={e => setFontSize(e.target.value)}
                            style={{
                                marginLeft: 'auto',
                                width: 160,
                                fontSize: 18,
                                padding: '6px 12px',
                                borderRadius: 8,
                                backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff',
                                color: actualTheme === 'dark' ? '#f1f1f1' : '#222',
                                border: `1px solid ${actualTheme === 'dark' ? '#333333' : '#e0e0e0'}`
                            }}
                        >
                            {FONT_SIZE_OPTIONS.map(opt => (
                                <option
                                    key={opt.value}
                                    value={opt.value}
                                    style={{
                                        backgroundColor: actualTheme === 'dark' ? '#232323' : '#fff',
                                        color: actualTheme === 'dark' ? '#f1f1f1' : '#222'
                                    }}
                                >
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </li>


                    {/* 로그아웃 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{t('logout')}</span>
                            <button
                                onClick={handleLogoutClick}
                                style={{
                                    padding: 0,
                                    backgroundColor: 'transparent',
                                    color: '#e46262',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                {t('logout')}
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
            <ConfirmModal
                open={logoutModal}
                title={t('logout')}
                description={t('confirm_logout')}
                onCancel={() => setLogoutModal(false)}
                onConfirm={doLogout}
                confirmText={t('logout')}
            />
            <Navigation />
        </>
    );
}

export default Settings; 