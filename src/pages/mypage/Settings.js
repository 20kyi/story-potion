import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { useTheme } from '../../ThemeContext';
import './Settings.css';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useLanguage } from '../../LanguageContext';
import CustomDropdown from '../../components/ui/CustomDropdown';
import pushNotificationManager from '../../utils/pushNotification';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { doc, onSnapshot } from 'firebase/firestore';

const FontSizeSlider = styled.input`
    flex: 1;
    margin: 0 12px;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
    background: ${({ $actualTheme }) => {
        if ($actualTheme === 'dark') return 'rgba(255, 255, 255, 0.2)';
        if ($actualTheme === 'glass') return 'rgba(255, 255, 255, 0.3)';
        if ($actualTheme === 'diary') return 'rgba(139, 111, 71, 0.2)';
        return 'rgba(0, 0, 0, 0.1)';
    }};
    outline: none;
    
    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${({ $actualTheme }) => {
        if ($actualTheme === 'dark') return '#cb6565';
        if ($actualTheme === 'glass') return 'rgba(255, 255, 255, 0.2)';
        if ($actualTheme === 'diary') return '#8B6F47';
        return '#cb6565';
    }};
        backdrop-filter: ${({ $actualTheme }) => {
        if ($actualTheme === 'glass') return 'blur(10px)';
        return 'none';
    }};
        -webkit-backdrop-filter: ${({ $actualTheme }) => {
        if ($actualTheme === 'glass') return 'blur(10px)';
        return 'none';
    }};
        border: ${({ $actualTheme }) => {
        if ($actualTheme === 'glass') return '2px solid rgba(255, 255, 255, 0.8)';
        return 'none';
    }};
        box-shadow: ${({ $actualTheme }) => {
        if ($actualTheme === 'glass') return '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        return 'none';
    }};
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
            transform: scale(1.1);
        }
    }
    
    &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${({ $actualTheme }) => {
        if ($actualTheme === 'dark') return '#cb6565';
        if ($actualTheme === 'glass') return 'rgba(255, 255, 255, 0.2)';
        if ($actualTheme === 'diary') return '#8B6F47';
        return '#cb6565';
    }};
        backdrop-filter: ${({ $actualTheme }) => {
        if ($actualTheme === 'glass') return 'blur(10px)';
        return 'none';
    }};
        -webkit-backdrop-filter: ${({ $actualTheme }) => {
        if ($actualTheme === 'glass') return 'blur(10px)';
        return 'none';
    }};
        border: ${({ $actualTheme }) => {
        if ($actualTheme === 'glass') return '2px solid rgba(255, 255, 255, 0.8)';
        return 'none';
    }};
        box-shadow: ${({ $actualTheme }) => {
        if ($actualTheme === 'glass') return '0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        return 'none';
    }};
        cursor: pointer;
    }
`;

const FontSizeValue = styled.span`
    min-width: 40px;
    text-align: right;
    font-size: 14px;
    color: ${({ $actualTheme }) => {
        if ($actualTheme === 'dark') return '#e8e8e8';
        if ($actualTheme === 'glass') return '#000000';
        if ($actualTheme === 'diary') return '#8B6F47';
        return '#333';
    }};
    font-weight: 500;
`;

const FontSizeContainer = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    max-width: 200px;
    margin-left: auto;
`;

function Settings({ user }) {
    const navigate = useNavigate();
    const { theme, setThemeMode, toggleTheme, fontFamily, setFontFamily, fontSize, setFontSize, actualTheme } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [open, setOpen] = useState({
        notification: false,
        theme: false,
        language: false,
    });
    const [logoutModal, setLogoutModal] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [isPremium, setIsPremium] = useState(false);

    // 언어에 따라 폰트 옵션 생성
    const FONT_OPTIONS = [
        { label: t('font_system_default'), value: 'system-ui, sans-serif' },
        { label: t('font_seoul_hangang'), value: "SeoulHangang, sans-serif" },
        { label: t('font_nanum_gothic'), value: 'NanumGothic, sans-serif' },
        { label: t('font_human_beomseok_neo'), value: 'HumanBeomseokNeo, sans-serif' },
        { label: t('font_adult_kid'), value: 'Adultkid, sans-serif' },
        { label: t('font_sagak'), value: 'Sagak-sagak, sans-serif' },
    ];

    // 폰트 크기 슬라이더 설정 (5단계)
    const FONT_SIZE_MIN = 12;
    const FONT_SIZE_MAX = 20;
    const FONT_SIZE_STEP = 2; // 12, 14, 16, 18, 20 (5단계)

    // 현재 폰트 크기를 숫자로 변환
    const currentFontSize = parseInt(fontSize) || 16;

    // 폰트 크기를 레이블로 변환 (XS, S, M, L, XL)
    const getFontSizeLabel = (size) => {
        const sizeMap = {
            12: 'XS',
            14: 'S',
            16: 'M',
            18: 'L',
            20: 'XL'
        };
        return sizeMap[size] || 'M';
    };

    // 폰트 크기 변경 핸들러
    const handleFontSizeChange = (e) => {
        const newSize = e.target.value;
        setFontSize(newSize.toString());
    };



    // 프리미엄 회원 상태 확인
    useEffect(() => {
        if (user?.uid) {
            const userRef = doc(db, 'users', user.uid);
            const unsubscribe = onSnapshot(userRef, (userDoc) => {
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setIsPremium(data.isMonthlyPremium || data.isYearlyPremium || false);
                } else {
                    setIsPremium(false);
                }
            }, (error) => {
                console.error('프리미엄 상태 조회 실패:', error);
                setIsPremium(false);
            });

            return () => unsubscribe();
        }
    }, [user]);

    // 알림 권한 상태 확인
    useEffect(() => {
        const checkNotificationPermission = async () => {
            if (Capacitor.getPlatform() !== 'web') {
                try {
                    const permStatus = await PushNotifications.checkPermissions();
                    setNotificationPermission(permStatus.receive || 'default');
                } catch (error) {
                    console.error('알림 권한 확인 실패:', error);
                    setNotificationPermission('default');
                }
            } else {
                const permission = pushNotificationManager.getPermissionStatus();
                setNotificationPermission(permission);
            }
        };
        checkNotificationPermission();
    }, []);

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
                            <span style={{
                                fontSize: '14px',
                                color: notificationPermission === 'granted' ? '#4CAF50' : '#999',
                                marginRight: '8px'
                            }}>
                                {notificationPermission === 'granted' ? '권한 허용' : '권한 비허용'}
                            </span>
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
                                { 
                                    label: t('theme_diary') || '다이어리', 
                                    value: 'diary',
                                    disabled: !isPremium,
                                    icon: !isPremium ? <span>👑</span> : null
                                },
                                { 
                                    label: t('theme_glass') || '포션', 
                                    value: 'glass',
                                    disabled: !isPremium,
                                    icon: !isPremium ? <span>👑</span> : null
                                }
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
                        <FontSizeContainer>
                            <FontSizeSlider
                                type="range"
                                min={FONT_SIZE_MIN}
                                max={FONT_SIZE_MAX}
                                step={FONT_SIZE_STEP}
                                value={currentFontSize}
                                onChange={handleFontSizeChange}
                                $actualTheme={actualTheme}
                            />
                            <FontSizeValue $actualTheme={actualTheme}>
                                {getFontSizeLabel(currentFontSize)}
                            </FontSizeValue>
                        </FontSizeContainer>
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