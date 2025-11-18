import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { useTheme } from '../../ThemeContext';
import notificationTest from '../../utils/notificationTest';
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

function Settings() {
    const navigate = useNavigate();
    const { theme, setThemeMode, toggleTheme, fontFamily, setFontFamily } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    const [open, setOpen] = useState({
        notification: false,
        theme: false,
        language: false,
    });
    const [notificationStatus, setNotificationStatus] = useState({
        supported: false,
        granted: false,
        message: '확인 중...'
    });
    const [premiumStatus, setPremiumStatus] = useState({
        isMonthlyPremium: false,
        isYearlyPremium: false,
        premiumType: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState(false);



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
            return t('notification_status_unsupported');
        }

        if (notificationStatus.granted) {
            return t('notification_status_granted');
        } else {
            return t('notification_status_required');
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

                    {/* 알림 테스트 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span>{t('notification_test')}</span>
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
                                {t('notification_test_button')}
                            </button>
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
                            style={{ marginLeft: 'auto', width: 160, fontSize: 18, padding: '6px 12px', borderRadius: 8 }}
                        >
                            <option value="ko">한국어</option>
                            <option value="en">English</option>
                        </select>
                    </li>
                    {/* 폰트 선택 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>{t('font')}</span>
                        <select
                            className="settings-select"
                            value={fontFamily}
                            onChange={e => setFontFamily(e.target.value)}
                            style={{ marginLeft: 'auto', width: 200, fontSize: 18, padding: '6px 12px', borderRadius: 8 }}
                        >
                            {FONT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </li>

                    {/* 구독 관리 */}
                    <li className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', paddingBottom: 18 }}>
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
                                <div className="withdraw-link" style={{ marginTop: '24px' }}>
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
                </ul>
            </div>
            <Navigation />
        </>
    );
}

export default Settings; 