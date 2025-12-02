import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useTheme } from '../../ThemeContext';
import './Settings.css';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useLanguage } from '../../LanguageContext';
import CustomDropdown from '../../components/ui/CustomDropdown';

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
                        <CustomDropdown
                            value={theme}
                            onChange={setThemeMode}
                            options={[
                                { label: t('theme_light') || '라이트 모드', value: 'light' },
                                { label: t('theme_dark') || '다크 모드', value: 'dark' },
                                { label: t('theme_diary') || '다이어리', value: 'diary' },
                                { label: t('theme_glass') || '포션', value: 'glass' }
                            ]}
                            width="160px"
                            padding="8px 12px"
                            fontSize="14px"
                            borderRadius="6px"
                        />
                    </li>
                    {/* 언어 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>{t('language')}</span>
                        <CustomDropdown
                            value={language}
                            onChange={setLanguage}
                            options={[
                                { label: '한국어', value: 'ko' },
                                { label: 'English', value: 'en' }
                            ]}
                            width="160px"
                            padding="6px 12px"
                            fontSize="14px"
                            borderRadius="8px"
                        />
                    </li>
                    {/* 폰트 선택 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>{t('font')}</span>
                        <CustomDropdown
                            value={fontFamily}
                            onChange={setFontFamily}
                            options={FONT_OPTIONS}
                            width="200px"
                            padding="6px 12px"
                            fontSize="14px"
                            borderRadius="8px"
                        />
                    </li>
                    {/* 폰트 크기 선택 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>{t('font_size')}</span>
                        <CustomDropdown
                            value={fontSize}
                            onChange={setFontSize}
                            options={FONT_SIZE_OPTIONS}
                            width="160px"
                            padding="6px 12px"
                            fontSize="14px"
                            borderRadius="8px"
                        />
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