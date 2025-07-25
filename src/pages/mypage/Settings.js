import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../../ThemeContext';
import notificationTest from '../../utils/notificationTest';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './Settings.css';
import ConfirmModal from '../../components/ui/ConfirmModal';

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
    const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'system-ui, sans-serif');
    const [premiumStatus, setPremiumStatus] = useState({
        isMonthlyPremium: false,
        isYearlyPremium: false,
        premiumType: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [modal, setModal] = useState(false);

    useEffect(() => {
        document.body.style.fontFamily = fontFamily;
        localStorage.setItem('fontFamily', fontFamily);
    }, [fontFamily]);

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
                premiumStartDate: null
            });
            setPremiumStatus({
                isMonthlyPremium: false,
                isYearlyPremium: false,
                premiumType: null
            });
            alert('프리미엄이 해지되었습니다.');
        } catch (error) {
            console.error('프리미엄 해지 실패:', error);
            alert('프리미엄 해지에 실패했습니다.');
        } finally {
            setIsLoading(false);
            setModal(false);
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
                    {/* 폰트 선택 */}
                    <li className="settings-item" style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 18 }}>
                        <span>글꼴</span>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span>구독 관리</span>
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                    {premiumStatus.isMonthlyPremium && '💎 월간 프리미엄 회원'}
                                    {premiumStatus.isYearlyPremium && '👑 연간 프리미엄 회원'}
                                    {!premiumStatus.isMonthlyPremium && !premiumStatus.isYearlyPremium && '⭐ 일반 회원'}
                                </span>
                            </div>
                            {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) && (
                                <>
                                    <button
                                        onClick={handleCancelPremium}
                                        disabled={isLoading}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#e46262',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            opacity: isLoading ? 0.6 : 1
                                        }}
                                    >
                                        {isLoading ? '처리중...' : '해지하기'}
                                    </button>
                                    <ConfirmModal
                                        open={modal}
                                        title={premiumStatus.isMonthlyPremium ? '월간 프리미엄 해지' : '연간 프리미엄 해지'}
                                        description={premiumStatus.isMonthlyPremium ? '월간 프리미엄을 해지하시겠습니까?' : '연간 프리미엄을 해지하시겠습니까?'}
                                        onCancel={() => setModal(false)}
                                        onConfirm={doCancelPremium}
                                        confirmText="해지하기"
                                    />
                                </>
                            )}
                        </div>
                        {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) &&
                            premiumStatus.premiumRenewalDate && (
                                <div style={{ fontSize: '12px', color: '#888', marginBottom: 4 }}>
                                    다음 구독 갱신일: {new Date(premiumStatus.premiumRenewalDate.seconds ? premiumStatus.premiumRenewalDate.seconds * 1000 : premiumStatus.premiumRenewalDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            )
                        }
                        {(premiumStatus.isMonthlyPremium || premiumStatus.isYearlyPremium) && (
                            <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.4' }}>
                                프리미엄 해지 시 즉시 모든 프리미엄 혜택이 중단됩니다.
                            </div>
                        )}
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
                    <span
                        onClick={async () => {
                            if (!window.confirm('정말로 회원 탈퇴하시겠습니까?\n모든 데이터가 삭제됩니다.')) return;
                            try {
                                const user = auth.currentUser;
                                if (!user) throw new Error('로그인이 필요합니다.');
                                // Firestore user document 삭제
                                await deleteDoc(doc(db, 'users', user.uid));
                                // Firebase Auth 계정 삭제
                                await deleteUser(user);
                                alert('회원 탈퇴가 완료되었습니다.');
                                navigate('/');
                            } catch (error) {
                                if (error.code === 'auth/requires-recent-login') {
                                    alert('보안을 위해 다시 로그인 후 탈퇴를 시도해 주세요.');
                                } else {
                                    alert('회원 탈퇴에 실패했습니다: ' + error.message);
                                }
                            }
                        }}
                    >
                        탈퇴하기
                    </span>
                </div>
            </div>
            <Navigation />
        </>
    );
}

export default Settings; 