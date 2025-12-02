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

    // 언어에 따라 폰트 옵션 생성
    const FONT_OPTIONS = [
        { label: t('font_system_default'), value: 'system-ui, sans-serif' },
        { label: t('font_seoul_hangang'), value: "SeoulHangang, sans-serif" },
        { label: t('font_cinema'), value: "Cinema, sans-serif" },
        { label: t('font_mom_letter'), value: "MomLetter, sans-serif" },
        { label: t('font_nanum_gothic'), value: 'NanumGothic, sans-serif' },
        { label: t('font_human_beomseok_neo'), value: 'HumanBeomseokNeo, sans-serif' },
        { label: t('font_adult_kid'), value: 'Adultkid, sans-serif' },
        { label: t('font_sagak'), value: 'Sagak-sagak, sans-serif' },
    ];

    // 언어에 따라 폰트 크기 옵션 생성
    const FONT_SIZE_OPTIONS = [
        { label: t('font_size_small'), value: '12' },
        { label: t('font_size_smaller'), value: '14' },
        { label: t('font_size_default'), value: '16' },
        { label: t('font_size_larger'), value: '18' },
        { label: t('font_size_large'), value: '20' },
    ];



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
                            isFontDropdown={true}
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