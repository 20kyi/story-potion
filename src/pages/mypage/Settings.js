import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useTheme } from '../../ThemeContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
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
    const [premiumStatus, setPremiumStatus] = useState({
        isMonthlyPremium: false,
        isYearlyPremium: false,
        premiumType: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [logoutModal, setLogoutModal] = useState(false);



    // 프리미엄 상태 조회
    useEffect(() => {
        const fetchPremiumStatus = async () => {
            try {
                const user = auth.currentUser;
                if (user?.uid) {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setPremiumStatus({
                            isMonthlyPremium: userData.isMonthlyPremium || false,
                            isYearlyPremium: userData.isYearlyPremium || false,
                            premiumType: userData.premiumType || null,
                            premiumRenewalDate: userData.premiumRenewalDate || null
                        });
                    }
                }
            } catch (error) {
                console.error('프리미엄 상태 조회 실패:', error);
            }
        };
        fetchPremiumStatus();

        // 페이지가 포커스될 때마다 프리미엄 상태 다시 조회
        const handleFocus = () => {
            fetchPremiumStatus();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleAccordion = (key) => {
        setOpen(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 프리미엄 해지 함수
    const handleCancelPremium = async () => {
        if (!auth.currentUser?.uid) return;
        setModal(true);
    };

    // 실제 해지 로직 분리
    const doCancelPremium = async () => {
        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                isMonthlyPremium: false,
                isYearlyPremium: false,
                premiumType: null,
                premiumStartDate: null,
                premiumRenewalDate: null,
                premiumCancelled: true,
                updatedAt: new Date()
            });
            setPremiumStatus({
                isMonthlyPremium: false,
                isYearlyPremium: false,
                premiumType: null,
                premiumRenewalDate: null
            });
            alert('프리미엄이 해지되었습니다.');
        } catch (error) {
            console.error('프리미엄 해지 실패:', error);
            alert(t('premium_cancel_failed'));
        } finally {
            setIsLoading(false);
            setModal(false);
        }
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
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>
                                {theme === 'light'
                                    ? t('theme_light')
                                    : theme === 'dark'
                                        ? t('theme_dark')
                                        : t('theme_system')}
                            </span>
                            <div
                                onClick={toggleTheme}
                                style={{
                                    width: '50px',
                                    height: '28px',
                                    backgroundColor: theme === 'dark' ? '#e46262' : '#ccc',
                                    borderRadius: '14px',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '2px'
                                }}
                            >
                                <div
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transform: theme === 'dark' ? 'translateX(22px)' : 'translateX(0px)',
                                        transition: 'transform 0.3s ease',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                />
                            </div>
                        </div>
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

                    {/* 구독 관리 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: 18, cursor: 'pointer' }} onClick={() => navigate('/my/shop')}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span>{t('subscription_manage')}</span>
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                    {premiumStatus.isMonthlyPremium && `💎 ${t('premium_monthly')}`}
                                    {premiumStatus.isYearlyPremium && `👑 ${t('premium_yearly')}`}
                                    {!premiumStatus.isMonthlyPremium && !premiumStatus.isYearlyPremium && `⭐ ${t('premium_basic')}`}
                                </span>
                            </div>
                        </div>
                        {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) &&
                            premiumStatus.premiumRenewalDate && (
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: 4 }}>
                                    {t('subscription_next_renewal_date')}{' '}
                                    {new Date(
                                        premiumStatus.premiumRenewalDate.seconds
                                            ? premiumStatus.premiumRenewalDate.seconds * 1000
                                            : premiumStatus.premiumRenewalDate
                                    ).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </div>
                            )
                        }
                        {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) && (
                            <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.4' }}>
                                {t('premium_cancel_notice')}
                            </div>
                        )}
                        {/* 구독 해지 버튼 */}
                        {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) && (
                            <>
                                <div className="withdraw-link" style={{ marginTop: '24px' }} onClick={(e) => e.stopPropagation()}>
                                    <span
                                        onClick={handleCancelPremium}
                                        style={{
                                            color: '#e46262',
                                            fontSize: '13px',
                                            fontWeight: 400,
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            opacity: isLoading ? 0.6 : 1
                                        }}
                                    >
                                        {isLoading ? t('processing') : t('premium_cancel_button')}
                                    </span>
                                </div>
                                <ConfirmModal
                                    open={modal}
                                    title={premiumStatus.isMonthlyPremium ? t('premium_cancel_monthly_title') : t('premium_cancel_yearly_title')}
                                    description={premiumStatus.isMonthlyPremium ? t('premium_cancel_monthly_desc') : t('premium_cancel_yearly_desc')}
                                    onCancel={() => setModal(false)}
                                    onConfirm={doCancelPremium}
                                    confirmText={t('premium_cancel_button')}
                                />
                            </>
                        )}
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