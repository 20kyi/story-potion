import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
// import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signInWithCustomToken, updateProfile } from 'firebase/auth';
import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signInWithCustomToken, updateProfile } from 'firebase/auth';
import { auth, db, onFcmMessage } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { TextZoom } from '@capacitor/text-zoom';
import { checkPhotoPermission, requestPhotoPermission } from './utils/permissions';
import pushNotificationManager from './utils/pushNotification';

// 페이지 및 컴포넌트 임포트 생략 (기존 그대로)
import Home from './pages/Home';
import WriteDiary from './pages/diary/WriteDiary';
import Diary from './pages/diary/Diary';
import NovelList from './pages/novel/NovelList';
import DiaryView from './pages/diary/DiaryView';
import Novel from './pages/novel/Novel';
import Navigation from './components/Navigation';
import MyPage from './pages/mypage/MyPage';
import NovelCreate from './pages/novel/NovelCreate';
import NovelView from './pages/novel/NovelView';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TermsAgreement from './pages/TermsAgreement';
import NovelListByGenre from './pages/novel/NovelListByGenre';
import { ToastProvider } from './components/ui/ToastProvider';
import { RiKakaoTalkFill } from 'react-icons/ri';
import Statistics from './pages/mypage/Statistics';
import CompletedNovels from './pages/mypage/CompletedNovels';
import Settings from './pages/mypage/Settings';
import NotificationSettings from './pages/mypage/NotificationSettings';
import Notice from './pages/mypage/Notice';
import Support from './pages/mypage/Support';
import TutorialList from './pages/mypage/TutorialList';
import FAQ from './pages/mypage/FAQ';
import Social from './pages/mypage/Social';
import Friend from './pages/mypage/Friend';
import PotionGift from './pages/mypage/PotionGift';
import Shop from './pages/mypage/Shop';
import Premium from './pages/mypage/Premium';
import NoticeDetail from './pages/mypage/NoticeDetail';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { useNotification } from './hooks/useNotification';
import NotificationToast from './components/NotificationToast';
import PointHistory from './pages/mypage/PointHistory';
import PotionShop from './pages/mypage/PotionShop';
import PointCharge from './pages/mypage/PointCharge';
import AdminMain from './pages/admin/AdminMain';
import UserList from './pages/admin/UserList';
import CSManagement from './pages/admin/CSManagement';
import NotificationManagement from './pages/admin/NotificationManagement';
import AdminTools from './pages/admin/AdminTools';
import ProfileFix from './pages/mypage/ProfileFix';
import ProfileEdit from './pages/mypage/ProfileEdit';
import './utils/runPointUpdate'; // 포인트 일괄 지급 스크립트 로드
import './utils/syncAuthUsers'; // 사용자 동기화 스크립트 로드
import './utils/debugUsers'; // 사용자 디버깅 스크립트 로드
import './utils/adminAuth'; // 관리자 권한 체크 스크립트 로드
import './utils/updateGoogleProfileImages'; // 구글 프로필 이미지 업데이트 스크립트 로드
import './utils/fixGoogleProfiles'; // 구글 프로필 문제 해결 스크립트 로드
import './utils/runPotionHistoryCleanup'; // 포션 사용 내역 정리 스크립트 로드
import FriendNovelList from './pages/novel/FriendNovelList';
import PurchasedNovels from './pages/novel/PurchasedNovels';
import AppInfo from './pages/mypage/AppInfo';
import TermsOfService from './pages/mypage/TermsOfService';
import PrivacyPolicy from './pages/mypage/PrivacyPolicy';
import { inAppPurchaseService } from './utils/inAppPurchase';
import DebugPanel from './components/DebugPanel';
import { checkAndRenewMonthlyPremium } from './utils/premiumRenewal';
import { convertKakaoImageUrlToHttps } from './utils/profileImageUtils';
import LoadingScreen from './components/LoadingScreen';
import LoadingTest from './pages/LoadingTest';
import PointAnimationTest from './pages/test/PointAnimationTest';
import { scheduleNovelCreationNotification } from './utils/novelCreationNotification';

const AppLayout = ({ user, isLoading }) => {
    const location = useLocation();
    const showNavigation = !['/login', '/signup', '/terms-agreement'].includes(location.pathname);
    const { notification, hideNotification } = useNotification(user);

    // 페이지 전환 시 스크롤을 맨 위로 초기화
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    if (isLoading) {
        return <LoadingScreen fullscreen={true} darkMode={false} text="로딩 중..." />;
    }

    return (
        <div className="App">
            <NotificationToast notification={notification} onClose={hideNotification} />
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/terms-agreement" element={!user ? <TermsAgreement /> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
                <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
                <Route path="/" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
                <Route path="/home" element={user ? <Home user={user} /> : <Navigate to="/login" />} />
                <Route path="/write" element={user ? <WriteDiary user={user} /> : <Navigate to="/login" />} />
                <Route path="/write/:date" element={user ? <WriteDiary user={user} /> : <Navigate to="/login" />} />
                <Route path="/diaries" element={user ? <Diary user={user} /> : <Navigate to="/login" />} />
                <Route path="/novels" element={user ? <NovelList user={user} /> : <Navigate to="/login" />} />
                <Route path="/diary/date/:date" element={user ? <DiaryView user={user} /> : <Navigate to="/login" />} />
                <Route path="/novel" element={user ? <Novel user={user} /> : <Navigate to="/login" />} />
                <Route path="/my" element={user ? <MyPage user={user} /> : <Navigate to="/login" />} />
                <Route path="/novel/create" element={user ? <NovelCreate user={user} /> : <Navigate to="/login" />} />
                <Route path="/novel/:id" element={user ? <NovelView user={user} /> : <Navigate to="/login" />} />
                <Route path="/novels/genre/:genre" element={user ? <NovelListByGenre user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/statistics" element={user ? <Statistics user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/completed-novels" element={user ? <CompletedNovels user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/app-info" element={user ? <AppInfo user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/terms-of-service" element={user ? <TermsOfService user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/privacy-policy" element={user ? <PrivacyPolicy user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notification-settings" element={user ? <NotificationSettings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notice" element={user ? <Notice user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notice/:id" element={user ? <NoticeDetail user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/support" element={user ? <Support user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/tutorial" element={user ? <TutorialList user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/faq" element={user ? <FAQ user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/social" element={user ? <Social user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/friend" element={user ? <Friend user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/potion-gift" element={user ? <PotionGift user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/shop" element={user ? <Shop user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/shop/charge" element={user ? <PointCharge user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/premium" element={user ? <Premium user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/point-history" element={<PointHistory user={user} />} />
                <Route path="/my/potion-shop" element={user ? <PotionShop user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/profile-fix" element={user ? <ProfileFix user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/profile-edit" element={user ? <ProfileEdit user={user} /> : <Navigate to="/login" />} />
                <Route path="/friend-novels" element={user ? <FriendNovelList user={user} /> : <Navigate to="/login" />} />
                <Route path="/purchased-novels" element={user ? <PurchasedNovels user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin" element={user ? <AdminMain user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/users" element={user ? <UserList user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/cs" element={user ? <CSManagement user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/notifications" element={user ? <NotificationManagement user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/tools" element={user ? <AdminTools user={user} /> : <Navigate to="/login" />} />
                <Route path="/loading-test" element={user ? <LoadingTest user={user} /> : <Navigate to="/login" />} />
                <Route path="/test/point-animation" element={user ? <PointAnimationTest user={user} /> : <Navigate to="/login" />} />
            </Routes>
            {showNavigation && user && <Navigation user={user} />}
            <DebugPanel />
        </div>
    );
};

// 카카오 콜백 처리 컴포넌트
const KakaoCallback = () => {
    useEffect(() => {
        // 전역 플래그로 중복 실행 방지 (React Strict Mode 대응)
        if (window.__kakaoCallbackHandled) {
            console.log('⚠️ 카카오 콜백이 이미 처리되었습니다. 중복 실행 방지');
            return;
        }

        console.log('🔍 KakaoCallback 컴포넌트 마운트됨');
        console.log('현재 경로:', window.location.pathname);
        console.log('현재 플랫폼:', Capacitor.getPlatform());
        console.log('URL 전체:', window.location.href);
        console.log('URL 검색 파라미터:', window.location.search);

        // 모바일 환경에서 Capacitor Browser로 열린 경우 앱으로 리다이렉트
        const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isMobilePlatform = Capacitor.getPlatform() !== 'web';

        // 모바일 디바이스이거나 모바일 플랫폼인 경우 딥링크로 리다이렉트
        if (isMobileDevice || isMobilePlatform) {
            console.log('📱 모바일 환경 감지, 앱으로 리다이렉트');
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');

            if (code) {
                // URL 파라미터를 딥링크로 변환
                const deepLink = `storypotion://auth/kakao/callback?code=${code}${state ? `&state=${state}` : ''}`;
                console.log('딥링크 생성:', deepLink);

                // 앱으로 리다이렉트
                setTimeout(() => {
                    window.location.href = deepLink;
                }, 100);
                return;
            }
        }

        // 웹 환경에서 카카오 콜백 처리 (중복 실행 방지)
        if (Capacitor.getPlatform() === 'web') {
            console.log('✅ 카카오 콜백 경로 감지됨');
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            console.log('인증 코드:', code);

            if (!code) {
                // code가 없으면 처리하지 않음
                console.warn('⚠️ 인증 코드가 없습니다.');
                return;
            }

            // 이미 처리된 code인지 확인 (sessionStorage 사용)
            const processedCodeKey = `kakao_processed_code_${code}`;
            try {
                if (sessionStorage.getItem(processedCodeKey)) {
                    console.log('⚠️ 이미 처리된 인증 코드입니다.');
                    window.location.href = '/';
                    return;
                }
                sessionStorage.setItem(processedCodeKey, 'true');
            } catch (e) {
                console.warn('⚠️ sessionStorage 접근 불가');
            }

            // 이미 처리 중인지 확인
            if (window.__kakaoCallbackProcessing) {
                console.log('⚠️ 카카오 콜백이 이미 처리 중입니다.');
                return;
            }

            // 전역 플래그 설정 (중복 실행 방지)
            window.__kakaoCallbackProcessing = true;
            window.__kakaoCallbackHandled = true;

            const handleKakaoCallback = async () => {
                try {
                    const state = urlParams.get('state');

                    if (code) {
                        console.log('🔗 웹 환경 카카오 콜백 처리');

                        // state 검증
                        try {
                            const savedState = sessionStorage.getItem('kakao_oauth_state');
                            if (state && savedState && state !== savedState) {
                                console.error('❌ state 불일치 - CSRF 공격 가능성');
                                window.location.href = '/login';
                                return;
                            }
                            sessionStorage.removeItem('kakao_oauth_state');
                        } catch (e) {
                            console.warn('⚠️ sessionStorage 접근 불가, state 검증 건너뜀');
                        }

                        // Firebase Functions를 통해 카카오 인증 처리
                        const functions = getFunctions();
                        const kakaoAuth = httpsCallable(functions, 'kakaoAuth');

                        const redirectUri = window.location.origin + '/auth/kakao/callback';
                        console.log('전송할 리다이렉트 URI:', redirectUri);
                        console.log('인증 코드:', code);

                        console.log('📞 Firebase Functions kakaoAuth 호출 시작');
                        let result;
                        try {
                            result = await kakaoAuth({
                                code,
                                redirectUri: redirectUri
                            });
                            console.log('✅ Firebase Functions 응답 받음:', {
                                success: result.data?.success,
                                hasUserInfo: !!result.data?.userInfo,
                                hasCustomToken: !!result.data?.customToken,
                                hasUid: !!result.data?.uid
                            });
                        } catch (functionsError) {
                            console.error('❌ Firebase Functions 호출 실패:', functionsError);
                            console.error('에러 코드:', functionsError.code);
                            console.error('에러 메시지:', functionsError.message);
                            alert('카카오 로그인 처리 중 오류가 발생했습니다: ' + (functionsError.message || '알 수 없는 오류'));
                            window.__kakaoCallbackProcessing = false;
                            window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                            window.location.href = '/login';
                            return;
                        }

                        if (result.data.success && result.data.userInfo) {
                            const uid = result.data.uid;
                            console.log('사용자 UID:', uid);

                            // 커스텀 토큰이 있으면 Firebase Auth로 로그인
                            if (result.data.customToken) {
                                try {
                                    const userCredential = await signInWithCustomToken(auth, result.data.customToken);
                                    const user = userCredential.user;

                                    // Firestore에서 사용자 정보 확인
                                    const userRef = doc(db, 'users', user.uid);
                                    const userSnap = await getDoc(userRef);

                                    if (userSnap.exists()) {
                                        const userData = userSnap.data();
                                        if (userData.status === '정지') {
                                            console.error('❌ 정지된 계정입니다.');
                                            await auth.signOut();
                                            window.__kakaoCallbackProcessing = false;
                                            window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                                            window.location.href = '/login';
                                            return;
                                        }

                                        // Firestore에 저장된 프로필 정보로 Firebase Auth 프로필 업데이트
                                        if (userData.photoURL && userData.photoURL !== user.photoURL) {
                                            await updateProfile(user, {
                                                displayName: userData.displayName || user.displayName,
                                                photoURL: userData.photoURL
                                            });
                                            // 사용자 정보 갱신 (프로필이 즉시 반영되도록)
                                            await user.reload();
                                        }
                                    }

                                    console.log('✅ 카카오 로그인 성공 (Firebase Auth)');
                                    // 로딩 상태 해제를 위한 전역 이벤트 발생
                                    window.dispatchEvent(new Event('kakaoLoginSuccess'));
                                    window.__kakaoCallbackProcessing = false;
                                    window.__kakaoCallbackHandled = false; // 성공 시 플래그 리셋
                                    window.location.href = '/';
                                } catch (authError) {
                                    console.error('Firebase Auth 로그인 실패:', authError);
                                    // 커스텀 토큰 로그인 실패 시에도 Firestore에 사용자 정보는 저장되어 있음
                                    // 사용자에게 안내
                                    alert('로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                                    window.__kakaoCallbackProcessing = false;
                                    window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                                    window.location.href = '/login';
                                }
                            } else {
                                // 커스텀 토큰이 없는 경우 (권한 문제)
                                console.warn('⚠️ 커스텀 토큰이 없습니다.');

                                if (!uid) {
                                    console.error('❌ UID가 없습니다. 로그인할 수 없습니다.');
                                    alert('로그인 처리 중 오류가 발생했습니다. UID를 받지 못했습니다.');
                                    window.__kakaoCallbackProcessing = false;
                                    window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                                    window.location.href = '/login';
                                    return;
                                }

                                // Firestore에서 사용자 정보 확인
                                try {
                                    const userRef = doc(db, 'users', uid);
                                    const userSnap = await getDoc(userRef);

                                    if (userSnap.exists()) {
                                        const userData = userSnap.data();
                                        console.log('Firestore 사용자 정보:', userData);

                                        if (userData.status === '정지') {
                                            console.error('❌ 정지된 계정입니다.');
                                            window.__kakaoCallbackProcessing = false;
                                            window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                                            window.location.href = '/login';
                                            return;
                                        }

                                        // 권한 문제로 커스텀 토큰을 받지 못한 경우
                                        // Firebase Auth 없이는 로그인할 수 없으므로 안내 메시지 표시
                                        console.error('❌ 커스텀 토큰 생성 권한이 없습니다. Firebase Functions 권한 설정이 필요합니다.');
                                        alert('로그인 권한 설정이 필요합니다. 관리자에게 문의해주세요.\n\n에러: 커스텀 토큰을 생성할 수 없습니다.');
                                        window.__kakaoCallbackProcessing = false;
                                        window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                                        window.location.href = '/login';
                                    } else {
                                        console.error('❌ Firestore에 사용자 정보가 없습니다.');
                                        alert('사용자 정보를 찾을 수 없습니다.');
                                        window.__kakaoCallbackProcessing = false;
                                        window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                                        window.location.href = '/login';
                                    }
                                } catch (firestoreError) {
                                    console.error('❌ Firestore 조회 실패:', firestoreError);
                                    alert('사용자 정보 조회 중 오류가 발생했습니다.');
                                    window.__kakaoCallbackProcessing = false;
                                    window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                                    window.location.href = '/login';
                                }
                            }
                        } else {
                            console.error('❌ 카카오 인증 실패:', result.data);
                            const errorMessage = result.data?.error || result.data?.message || '알 수 없는 오류';
                            console.error('에러 상세:', errorMessage);
                            alert('카카오 로그인에 실패했습니다: ' + errorMessage);
                            window.__kakaoCallbackProcessing = false;
                            window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                            window.location.href = '/login';
                        }
                    } else {
                        console.warn('⚠️ 카카오 code를 찾을 수 없습니다.');
                        window.__kakaoCallbackProcessing = false;
                        window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                        window.location.href = '/login';
                    }
                } catch (error) {
                    console.error('❌ 카카오 콜백 처리 실패:', error);
                    console.error('에러 타입:', error.constructor?.name);
                    console.error('에러 메시지:', error.message);
                    console.error('에러 스택:', error.stack);
                    console.error('전체 에러 객체:', JSON.stringify(error, null, 2));

                    const errorMessage = error.message || error.toString() || '알 수 없는 오류';
                    alert('카카오 로그인 처리 중 오류가 발생했습니다:\n\n' + errorMessage);

                    window.__kakaoCallbackProcessing = false;
                    window.__kakaoCallbackHandled = false; // 실패 시 플래그 리셋
                    window.location.href = '/login';
                }
            };

            handleKakaoCallback();

            // cleanup 함수: 컴포넌트 언마운트 시 플래그 제거
            return () => {
                window.__kakaoCallbackProcessing = false;
            };
        }
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '32px',
                animation: 'fadeIn 0.3s ease-in-out'
            }}>
                {/* 카카오 아이콘 */}
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FEE500 0%, #FDD835 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3c1e1e',
                    boxShadow: '0 8px 24px rgba(254, 229, 0, 0.3)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                }}>
                    <RiKakaoTalkFill size={70} /> {/* 카카오 아이콘 크기 */}
                </div>

                {/* 로딩 텍스트 */}
                <div style={{
                    textAlign: 'center',
                    color: '#333'
                }}>
                    <h2 style={{
                        margin: '0 0 12px 0',
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#3c1e1e'
                    }}>
                        카카오 로그인 처리 중
                    </h2>
                    <p style={{
                        margin: 0,
                        fontSize: '16px',
                        color: '#666',
                        opacity: 0.8
                    }}>
                        잠시만 기다려주세요
                    </p>
                </div>

                {/* 로딩 인디케이터 */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {[0, 1, 2].map((index) => (
                        <div
                            key={index}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#FEE500',
                                animation: `bounce 1.4s ease-in-out infinite`,
                                animationDelay: `${index * 0.2}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 8px 24px rgba(254, 229, 0, 0.3);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 12px 32px rgba(254, 229, 0, 0.4);
                    }
                }

                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: scale(0.8);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1.2);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [videoPlayed, setVideoPlayed] = useState(false);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        // 시스템 글자 크기 설정을 무시하고 1배율(100%)로 고정
        // 모바일 환경에서만 적용 (웹에서는 불필요)
        if (Capacitor.getPlatform() !== 'web') {
            const lockTextZoom = async () => {
                try {
                    await TextZoom.set({ value: 1 });
                    console.log('✅ 텍스트 줌이 1배율(100%)로 고정되었습니다.');
                } catch (error) {
                    console.error('텍스트 줌 설정 실패:', error);
                }
            };
            lockTextZoom();
        }

        // 주의: 커스텀 OAuth 플로우를 사용하므로 getRedirectResult는 호출하지 않음
        // 실제 구글 로그인은 appUrlOpen 이벤트 핸들러에서 처리됨
        // getRedirectResult를 호출하면 "missing initial state" 에러가 발생할 수 있으며,
        // 이는 실제 로그인 플로우에 영향을 줄 수 있으므로 완전히 제거함

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setAuthReady(true);

                // 사용자 로그인 시 월간 프리미엄 갱신일 확인 및 자동 갱신
                if (user?.uid) {
                    // 앱 시작 시 최근 접속일 업데이트 (Firestore에 직접 기록)
                    try {
                        const userRef = doc(db, 'users', user.uid);
                        const userDoc = await getDoc(userRef);
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const lastLoginAt = userData.lastLoginAt;
                            
                            // 1분 이상 지났을 때만 업데이트 (너무 빈번한 업데이트 방지)
                            let shouldUpdate = false;
                            if (!lastLoginAt) {
                                shouldUpdate = true;
                            } else {
                                const lastLoginTime = lastLoginAt.toDate ? lastLoginAt.toDate() : new Date(lastLoginAt);
                                const now = new Date();
                                const minutesSinceLastLogin = (now - lastLoginTime) / (1000 * 60);
                                if (minutesSinceLastLogin >= 1) {
                                    shouldUpdate = true;
                                }
                            }
                            
                            if (shouldUpdate) {
                                const updateData = {
                                    lastLoginAt: new Date(),
                                    updatedAt: new Date()
                                };
                                
                                // 이전 접속일 저장 (lastLoginAt이 있으면 previousLoginAt에 저장)
                                if (lastLoginAt) {
                                    updateData.previousLoginAt = lastLoginAt;
                                }
                                
                                await updateDoc(userRef, updateData);
                                console.log('✅ 앱 시작 시 최근 접속일 업데이트 완료');
                            }
                        }
                    } catch (error) {
                        console.error('최근 접속일 업데이트 실패:', error);
                    }

                    try {
                        await checkAndRenewMonthlyPremium(user.uid);
                    } catch (error) {
                        console.error('프리미엄 갱신 확인 중 오류:', error);
                    }

                    // 소설 생성 알림 스케줄링
                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            if (userData.novelCreationEnabled) {
                                const notificationTime = userData.reminderTime || '21:00';
                                await scheduleNovelCreationNotification(user.uid, notificationTime);
                            }
                        }
                    } catch (error) {
                        console.error('소설 생성 알림 스케줄링 실패:', error);
                    }

                // 구독 상태 동기화 (Google Play와 Firebase 동기화)
                try {
                    await inAppPurchaseService.syncSubscriptionStatus(user.uid);
                    console.log('✅ 구독 상태 동기화 완료');
                } catch (error) {
                    console.error('구독 상태 동기화 실패:', error);
                }

                // 앱 환경에서 권한 요청 및 FCM 토큰 자동 등록
                if (Capacitor.getPlatform() !== 'web') {
                    try {
                        // 1. 알림 권한 확인 및 요청
                        const permStatus = await PushNotifications.checkPermissions();
                        if (permStatus.receive === 'granted') {
                            // 이미 등록되어 있는지 확인
                            const registration = await PushNotifications.register();
                            console.log('푸시 알림 등록:', registration);

                            // 토큰 등록 리스너 (한 번만 등록)
                            if (!window.__pushRegListenerAdded) {
                                window.__pushRegListenerAdded = true;
                                PushNotifications.addListener('registration', async (token) => {
                                    console.log('FCM 토큰 발급:', token.value);
                                    // auth.currentUser를 사용하여 항상 최신 사용자 정보 가져오기
                                    const currentUser = auth.currentUser;
                                    if (currentUser && token.value) {
                                        try {
                                            await setDoc(doc(db, "users", currentUser.uid), {
                                                fcmToken: token.value
                                            }, { merge: true });
                                            console.log('앱 FCM 토큰 Firestore 저장 완료:', token.value);
                                        } catch (error) {
                                            console.error('FCM 토큰 Firestore 저장 실패:', error);
                                        }
                                    } else {
                                        console.warn('FCM 토큰이 발급되었지만 사용자가 로그인하지 않았습니다.');
                                    }
                                });

                                // 토큰 갱신 리스너
                                PushNotifications.addListener('registrationError', (error) => {
                                    console.error('FCM 토큰 등록 오류:', error);
                                });
                            }
                        } else {
                            // 권한이 없으면 무조건 권한 요청 다이얼로그 띄우기
                            console.log('푸시 알림 권한이 없습니다. 권한을 요청합니다.');
                            try {
                                const requestResult = await PushNotifications.requestPermissions();
                                if (requestResult.receive === 'granted') {
                                    console.log('푸시 알림 권한이 허용되었습니다.');
                                    // 권한 허용 후 등록
                                    const registration = await PushNotifications.register();
                                    console.log('푸시 알림 등록:', registration);

                                    // 토큰 등록 리스너 (한 번만 등록)
                                    if (!window.__pushRegListenerAdded) {
                                        window.__pushRegListenerAdded = true;
                                        PushNotifications.addListener('registration', async (token) => {
                                            console.log('FCM 토큰 발급:', token.value);
                                            const currentUser = auth.currentUser;
                                            if (currentUser && token.value) {
                                                try {
                                                    await setDoc(doc(db, "users", currentUser.uid), {
                                                        fcmToken: token.value
                                                    }, { merge: true });
                                                    console.log('앱 FCM 토큰 Firestore 저장 완료:', token.value);
                                                } catch (error) {
                                                    console.error('FCM 토큰 Firestore 저장 실패:', error);
                                                }
                                            }
                                        });

                                        PushNotifications.addListener('registrationError', (error) => {
                                            console.error('FCM 토큰 등록 오류:', error);
                                        });
                                    }
                                } else {
                                    console.log('푸시 알림 권한이 거부되었습니다.');
                                }
                            } catch (error) {
                                console.error('알림 권한 요청 실패:', error);
                            }
                        }

                        // 2. 사진 액세스 권한 확인 및 요청
                        try {
                            const photoPermission = await checkPhotoPermission();
                            if (!photoPermission.granted) {
                                console.log('사진 액세스 권한이 없습니다. 권한을 요청합니다.');
                                const photoRequestResult = await requestPhotoPermission();
                                if (photoRequestResult.granted) {
                                    console.log('사진 액세스 권한이 허용되었습니다.');
                                } else {
                                    console.log('사진 액세스 권한이 거부되었습니다.');
                                }
                            } else {
                                console.log('사진 액세스 권한이 이미 허용되어 있습니다.');
                            }
                        } catch (error) {
                            console.error('사진 권한 확인/요청 실패:', error);
                        }
                    } catch (error) {
                        console.error('권한 요청 중 오류:', error);
                    }
                }
            }
        });

        // 앱이 포그라운드로 돌아올 때 상태 확인 및 구독 상태 동기화
        CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
            if (isActive) {
                console.log('📱 앱이 활성화되었습니다. 로그인 상태 확인 중...');
                // 앱이 활성화될 때 현재 사용자 상태 확인
                const currentUser = auth.currentUser;
                if (currentUser) {
                    console.log('✅ 사용자가 이미 로그인되어 있습니다:', currentUser.email);
                    
                    // 앱이 포그라운드로 돌아올 때 최근 접속일 업데이트 (Firestore에 직접 기록)
                    try {
                        const userRef = doc(db, 'users', currentUser.uid);
                        const userDoc = await getDoc(userRef);
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            const lastLoginAt = userData.lastLoginAt;
                            
                            // 1분 이상 지났을 때만 업데이트 (너무 빈번한 업데이트 방지)
                            let shouldUpdate = false;
                            if (!lastLoginAt) {
                                shouldUpdate = true;
                            } else {
                                const lastLoginTime = lastLoginAt.toDate ? lastLoginAt.toDate() : new Date(lastLoginAt);
                                const now = new Date();
                                const minutesSinceLastLogin = (now - lastLoginTime) / (1000 * 60);
                                if (minutesSinceLastLogin >= 1) {
                                    shouldUpdate = true;
                                }
                            }
                            
                            if (shouldUpdate) {
                                const updateData = {
                                    lastLoginAt: new Date(),
                                    updatedAt: new Date()
                                };
                                
                                // 이전 접속일 저장 (lastLoginAt이 있으면 previousLoginAt에 저장)
                                if (lastLoginAt) {
                                    updateData.previousLoginAt = lastLoginAt;
                                }
                                
                                await updateDoc(userRef, updateData);
                                console.log('✅ 앱 활성화 시 최근 접속일 업데이트 완료');
                            }
                        }
                    } catch (error) {
                        console.error('앱 활성화 시 최근 접속일 업데이트 실패:', error);
                    }
                    
                    // 구독 상태 동기화
                    try {
                        await inAppPurchaseService.syncSubscriptionStatus(currentUser.uid);
                        console.log('✅ 앱 활성화 시 구독 상태 동기화 완료');
                    } catch (error) {
                        console.error('앱 활성화 시 구독 상태 동기화 실패:', error);
                    }
                }
            }
        });

        // 🔧 개발용 테스트 함수 등록 (브라우저 콘솔에서 사용 가능)
        if (typeof window !== 'undefined') {
            window.testKakaoDeepLink = (code = 'test_code_123', state = 'test_state_456') => {
                const deepLink = `storypotion://auth/kakao/callback?code=${code}${state ? `&state=${state}` : ''}`;
                console.log('🧪 테스트 딥링크 생성:', deepLink);
                console.log('💡 실제 앱에서는 appUrlOpen 이벤트가 발생합니다.');
                console.log('💡 웹에서는 window.location.href로 시뮬레이션할 수 있습니다.');

                // 웹 환경에서는 실제로 이동하지 않고 로그만 출력
                if (Capacitor.getPlatform() === 'web') {
                    console.log('⚠️ 웹 환경에서는 실제 딥링크가 작동하지 않습니다.');
                    console.log('💡 모바일 앱에서 테스트하거나, 아래 코드를 콘솔에서 실행하세요:');
                    console.log(`   window.location.href = "${deepLink}";`);
                    return deepLink;
                } else {
                    // 모바일 환경에서는 실제 딥링크 시뮬레이션
                    window.location.href = deepLink;
                    return deepLink;
                }
            };

            window.testKakaoCallback = (code = 'test_code_123', state = 'test_state_456') => {
                console.log('🧪 카카오 콜백 테스트 시작');
                console.log('📋 파라미터:', { code, state });

                // 실제 콜백 URL 시뮬레이션
                const callbackUrl = `https://story-potion.web.app/auth/kakao/callback?code=${code}${state ? `&state=${state}` : ''}`;
                console.log('🔗 콜백 URL:', callbackUrl);

                // 모바일 환경 감지 테스트
                const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isMobilePlatform = Capacitor.getPlatform() !== 'web';
                console.log('📱 모바일 디바이스:', isMobileDevice);
                console.log('📱 모바일 플랫폼:', isMobilePlatform);
                console.log('📱 Capacitor 플랫폼:', Capacitor.getPlatform());

                if (isMobileDevice || isMobilePlatform) {
                    const deepLink = `storypotion://auth/kakao/callback?code=${code}${state ? `&state=${state}` : ''}`;
                    console.log('✅ 모바일 환경 감지됨 → 딥링크 생성:', deepLink);
                    return deepLink;
                } else {
                    console.log('⚠️ 웹 환경 → 웹 콜백 처리');
                    return callbackUrl;
                }
            };

            console.log('🧪 카카오 로그인 테스트 함수 등록됨:');
            console.log('  - testKakaoDeepLink(code, state): 딥링크 테스트');
            console.log('  - testKakaoCallback(code, state): 콜백 URL 테스트');
        }

        // 🔐 딥링크 및 HTTPS 리디렉션 처리
        CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
            console.log('🔗 appUrlOpen 이벤트 발생:', url);

            // 커스텀 스킴 처리 (storypotion://auth)
            if (url.startsWith('storypotion://auth')) {
                // 카카오 콜백 딥링크 처리
                if (url.includes('/auth/kakao/callback')) {
                    console.log('🔗 카카오 콜백 딥링크 감지');
                    try {
                        // URL에서 code와 state 추출
                        let code = null;
                        let state = null;

                        if (url.includes('?')) {
                            const query = url.split('?')[1].split('#')[0];
                            const params = new URLSearchParams(query);
                            code = params.get('code');
                            state = params.get('state');
                        }

                        if (code) {
                            console.log('✅ 카카오 code 추출 성공 (딥링크)');

                            // state 검증
                            try {
                                const savedState = sessionStorage.getItem('kakao_oauth_state');
                                if (state && savedState && state !== savedState) {
                                    console.error('❌ state 불일치 - CSRF 공격 가능성');
                                    return;
                                }
                                sessionStorage.removeItem('kakao_oauth_state');
                            } catch (e) {
                                console.warn('⚠️ sessionStorage 접근 불가, state 검증 건너뜀');
                            }

                            // Firebase Functions를 통해 카카오 인증 처리
                            const functions = getFunctions();
                            const kakaoAuth = httpsCallable(functions, 'kakaoAuth');

                            const redirectUri = 'https://story-potion.web.app/auth/kakao/callback';
                            console.log('딥링크 - 전송할 리다이렉트 URI:', redirectUri);
                            console.log('딥링크 - 인증 코드:', code);

                            const result = await kakaoAuth({
                                code,
                                redirectUri: redirectUri
                            });

                            if (result.data.success && result.data.userInfo) {
                                const kakaoUserInfo = result.data.userInfo;

                                // 카카오 사용자 정보로 Firebase 사용자 생성 또는 로그인
                                const kakaoId = kakaoUserInfo.id.toString();
                                const kakaoEmail = kakaoUserInfo.kakao_account?.email || `kakao_${kakaoId}@kakao.temp`;
                                const kakaoNickname = kakaoUserInfo.kakao_account?.profile?.nickname || kakaoUserInfo.properties?.nickname || '카카오 사용자';
                                const rawKakaoPhotoURL = kakaoUserInfo.kakao_account?.profile?.profile_image_url || kakaoUserInfo.properties?.profile_image || process.env.PUBLIC_URL + '/default-profile.svg';
                                // 카카오 이미지 URL을 HTTPS로 변환 (모바일 앱에서 HTTP 이미지 로드 문제 해결)
                                const kakaoPhotoURL = convertKakaoImageUrlToHttps(rawKakaoPhotoURL) || rawKakaoPhotoURL;

                                // 먼저 커스텀 토큰으로 로그인 (Firestore 쓰기 전에 인증 필요)
                                if (!result.data.customToken) {
                                    console.error('❌ 커스텀 토큰이 없습니다.');
                                    return;
                                }

                                const userCredential = await signInWithCustomToken(auth, result.data.customToken);
                                const user = userCredential.user;
                                console.log('✅ Firebase Auth 로그인 완료:', user.uid);

                                // 로그인 후 Firestore에서 카카오 ID로 기존 사용자 찾기
                                const usersRef = collection(db, 'users');
                                const q = query(usersRef, where('kakaoId', '==', kakaoId));
                                const snapshot = await getDocs(q);

                                if (!snapshot.empty) {
                                    // 기존 사용자
                                    const existingUserDoc = snapshot.docs[0];
                                    const userRef = doc(db, 'users', existingUserDoc.id);
                                    const userData = existingUserDoc.data();

                                    if (userData.status === '정지') {
                                        console.error('❌ 정지된 계정입니다.');
                                        await auth.signOut();
                                        return;
                                    }

                                    // 프로필 정보 업데이트 (로그인 후이므로 가능)
                                    await updateDoc(userRef, {
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL,
                                        authProvider: 'kakao',
                                        lastLoginAt: new Date(),
                                        updatedAt: new Date()
                                    });

                                    // Firebase Auth 프로필도 업데이트
                                    await updateProfile(user, {
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL
                                    });

                                    // 사용자 정보 갱신 (프로필이 즉시 반영되도록)
                                    await user.reload();

                                    console.log('✅ 카카오 로그인 성공 (기존 사용자, 딥링크)');
                                    // 로딩 상태 해제를 위한 전역 이벤트 발생
                                    window.dispatchEvent(new Event('kakaoLoginSuccess'));
                                } else {
                                    // 신규 사용자 - Firestore에 사용자 정보 저장
                                    const userRef = doc(db, 'users', user.uid);

                                    await updateProfile(user, {
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL
                                    });

                                    await setDoc(userRef, {
                                        email: kakaoEmail,
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL,
                                        point: 100,
                                        createdAt: new Date(),
                                        authProvider: 'kakao',
                                        kakaoId: kakaoId,
                                        emailVerified: false,
                                        isActive: true,
                                        lastLoginAt: new Date(),
                                        updatedAt: new Date()
                                    });

                                    // 회원가입 축하 포인트 히스토리 추가
                                    await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                                        type: 'earn',
                                        amount: 100,
                                        desc: '회원가입 축하 포인트',
                                        createdAt: new Date()
                                    });

                                    // 사용자 정보 갱신 (프로필이 즉시 반영되도록)
                                    await user.reload();

                                    console.log('✅ 카카오 로그인 성공 (신규 사용자, 딥링크)');
                                    // 로딩 상태 해제를 위한 전역 이벤트 발생
                                    window.dispatchEvent(new Event('kakaoLoginSuccess'));
                                }
                            } else {
                                console.error('❌ 카카오 인증 실패:', result.data.error);
                                // 로딩 상태 해제를 위한 전역 이벤트 발생
                                window.dispatchEvent(new Event('kakaoLoginFailed'));
                            }
                        } else {
                            console.warn('⚠️ 카카오 code를 찾을 수 없습니다.');
                            // 로딩 상태 해제를 위한 전역 이벤트 발생
                            window.dispatchEvent(new Event('kakaoLoginFailed'));
                        }
                    } catch (error) {
                        console.error('❌ 카카오 콜백 딥링크 처리 실패:', error);
                        // 로딩 상태 해제를 위한 전역 이벤트 발생
                        window.dispatchEvent(new Event('kakaoLoginFailed'));
                    }
                    return;
                }

                // 구글 로그인 처리 (기존 코드)
                const hash = url.split('#')[1];
                const params = new URLSearchParams(hash);
                const idToken = params.get('id_token');

                if (idToken) {
                    try {
                        const credential = GoogleAuthProvider.credential(idToken);
                        const result = await signInWithCredential(auth, credential);

                        // 구글 로그인 성공 후 사용자 정보 처리
                        const user = result.user;
                        const userRef = doc(db, 'users', user.uid);
                        const userSnap = await getDoc(userRef);

                        if (!userSnap.exists()) {
                            // 구글 프로필 정보 사용 (displayName과 photoURL 모두 구글에서 가져온 값 사용)
                            const googleDisplayName = user.displayName || user.email?.split('@')[0] || '사용자';
                            const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;

                            // Firebase Auth의 프로필 정보 업데이트 (구글 정보 유지)
                            await updateProfile(user, {
                                displayName: googleDisplayName,
                                photoURL: googlePhotoURL
                            });

                            await setDoc(userRef, {
                                email: user.email || '',
                                displayName: googleDisplayName,
                                photoURL: googlePhotoURL,
                                point: 100,
                                createdAt: new Date(),
                                authProvider: 'google.com',
                                emailVerified: user.emailVerified || false,
                                isActive: true,
                                lastLoginAt: new Date(),
                                updatedAt: new Date()
                            });

                            // 회원가입 축하 포인트 히스토리 추가
                            await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                                type: 'earn',
                                amount: 100,
                                desc: '회원가입 축하 포인트',
                                createdAt: new Date()
                            });
                        } else {
                            const userData = userSnap.data();
                            if (userData.status === '정지') {
                                console.error('❌ 정지된 계정입니다.');
                                await auth.signOut();
                                return;
                            }

                            // 기존 사용자의 경우 구글 프로필 정보로 업데이트 (photoURL이 비어있거나 기본 이미지인 경우)
                            if (!userData.photoURL || userData.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
                                const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;
                                await updateDoc(userRef, {
                                    photoURL: googlePhotoURL,
                                    authProvider: 'google.com',
                                    lastLoginAt: new Date(),
                                    updatedAt: new Date()
                                });

                                // Firebase Auth도 업데이트
                                await updateProfile(user, {
                                    photoURL: googlePhotoURL
                                });
                            }
                        }

                        console.log('✅ Firebase 로그인 성공 (커스텀 스킴)');
                    } catch (error) {
                        console.error('❌ Firebase 로그인 실패:', error);
                    }
                }
            }

            // HTTPS redirect URI 처리 (story-potion.web.app 도메인)
            // /oauth2redirect 경로 또는 루트 경로 모두 처리
            if (url.includes('story-potion.web.app')) {
                console.log('🔗 OAuth redirect URI 감지:', url);

                // 카카오 콜백 처리
                if (url.includes('/auth/kakao/callback')) {
                    console.log('🔗 카카오 콜백 URL 감지');
                    try {
                        // URL에서 code와 state 추출
                        let code = null;
                        let state = null;

                        if (url.includes('?')) {
                            const query = url.split('?')[1].split('#')[0];
                            const params = new URLSearchParams(query);
                            code = params.get('code');
                            state = params.get('state');
                        }

                        if (code) {
                            console.log('✅ 카카오 code 추출 성공');

                            // state 검증
                            try {
                                const savedState = sessionStorage.getItem('kakao_oauth_state');
                                if (state && savedState && state !== savedState) {
                                    console.error('❌ state 불일치 - CSRF 공격 가능성');
                                    return;
                                }
                                sessionStorage.removeItem('kakao_oauth_state');
                            } catch (e) {
                                console.warn('⚠️ sessionStorage 접근 불가, state 검증 건너뜀');
                            }

                            // Firebase Functions를 통해 카카오 인증 처리
                            const functions = getFunctions();
                            const kakaoAuth = httpsCallable(functions, 'kakaoAuth');

                            const redirectUri = 'https://story-potion.web.app/auth/kakao/callback';
                            console.log('모바일 - 전송할 리다이렉트 URI:', redirectUri);
                            console.log('모바일 - 인증 코드:', code);

                            const result = await kakaoAuth({
                                code,
                                redirectUri: redirectUri
                            });

                            if (result.data.success && result.data.userInfo) {
                                const kakaoUserInfo = result.data.userInfo;

                                // 카카오 사용자 정보로 Firebase 사용자 생성 또는 로그인
                                const kakaoId = kakaoUserInfo.id.toString();
                                const kakaoEmail = kakaoUserInfo.kakao_account?.email || `kakao_${kakaoId}@kakao.temp`;
                                const kakaoNickname = kakaoUserInfo.kakao_account?.profile?.nickname || kakaoUserInfo.properties?.nickname || '카카오 사용자';
                                const rawKakaoPhotoURL = kakaoUserInfo.kakao_account?.profile?.profile_image_url || kakaoUserInfo.properties?.profile_image || process.env.PUBLIC_URL + '/default-profile.svg';
                                // 카카오 이미지 URL을 HTTPS로 변환 (모바일 앱에서 HTTP 이미지 로드 문제 해결)
                                const kakaoPhotoURL = convertKakaoImageUrlToHttps(rawKakaoPhotoURL) || rawKakaoPhotoURL;

                                // 먼저 커스텀 토큰으로 로그인 (Firestore 쓰기 전에 인증 필요)
                                if (!result.data.customToken) {
                                    console.error('❌ 커스텀 토큰이 없습니다.');
                                    return;
                                }

                                const userCredential = await signInWithCustomToken(auth, result.data.customToken);
                                const user = userCredential.user;
                                console.log('✅ Firebase Auth 로그인 완료:', user.uid);

                                // 로그인 후 Firestore에서 카카오 ID로 기존 사용자 찾기
                                const usersRef = collection(db, 'users');
                                const q = query(usersRef, where('kakaoId', '==', kakaoId));
                                const snapshot = await getDocs(q);

                                if (!snapshot.empty) {
                                    // 기존 사용자
                                    const existingUserDoc = snapshot.docs[0];
                                    const userRef = doc(db, 'users', existingUserDoc.id);
                                    const userData = existingUserDoc.data();

                                    if (userData.status === '정지') {
                                        console.error('❌ 정지된 계정입니다.');
                                        await auth.signOut();
                                        return;
                                    }

                                    // 프로필 정보 업데이트 (로그인 후이므로 가능)
                                    await updateDoc(userRef, {
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL,
                                        authProvider: 'kakao',
                                        lastLoginAt: new Date(),
                                        updatedAt: new Date()
                                    });

                                    // Firebase Auth 프로필도 업데이트
                                    await updateProfile(user, {
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL
                                    });

                                    // 사용자 정보 갱신 (프로필이 즉시 반영되도록)
                                    await user.reload();

                                    console.log('✅ 카카오 로그인 성공 (기존 사용자)');
                                    // 로딩 상태 해제를 위한 전역 이벤트 발생
                                    window.dispatchEvent(new Event('kakaoLoginSuccess'));
                                } else {
                                    // 신규 사용자 - Firestore에 사용자 정보 저장
                                    const userRef = doc(db, 'users', user.uid);

                                    await updateProfile(user, {
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL
                                    });

                                    await setDoc(userRef, {
                                        email: kakaoEmail,
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL,
                                        point: 100,
                                        createdAt: new Date(),
                                        authProvider: 'kakao',
                                        kakaoId: kakaoId,
                                        emailVerified: false,
                                        isActive: true,
                                        lastLoginAt: new Date(),
                                        updatedAt: new Date()
                                    });

                                    // 회원가입 축하 포인트 히스토리 추가
                                    await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                                        type: 'earn',
                                        amount: 100,
                                        desc: '회원가입 축하 포인트',
                                        createdAt: new Date()
                                    });

                                    // 사용자 정보 갱신 (프로필이 즉시 반영되도록)
                                    await user.reload();

                                    console.log('✅ 카카오 로그인 성공 (신규 사용자)');
                                    // 로딩 상태 해제를 위한 전역 이벤트 발생
                                    window.dispatchEvent(new Event('kakaoLoginSuccess'));
                                }
                            } else {
                                console.error('❌ 카카오 인증 실패:', result.data.error);
                                // 로딩 상태 해제를 위한 전역 이벤트 발생
                                window.dispatchEvent(new Event('kakaoLoginFailed'));
                            }
                        } else {
                            console.warn('⚠️ 카카오 code를 찾을 수 없습니다.');
                            // 로딩 상태 해제를 위한 전역 이벤트 발생
                            window.dispatchEvent(new Event('kakaoLoginFailed'));
                        }
                    } catch (error) {
                        console.error('❌ 카카오 콜백 처리 실패:', error);
                        // 로딩 상태 해제를 위한 전역 이벤트 발생
                        window.dispatchEvent(new Event('kakaoLoginFailed'));
                    }
                    return; // 카카오 콜백 처리 완료
                }

                try {
                    // URL에서 id_token 추출 (구글 로그인용)
                    let idToken = null;

                    // Fragment (#) 방식
                    if (url.includes('#')) {
                        const hash = url.split('#')[1];
                        const params = new URLSearchParams(hash);
                        idToken = params.get('id_token');
                    }

                    // Query (? ) 방식 (백업)
                    if (!idToken && url.includes('?')) {
                        const query = url.split('?')[1].split('#')[0];
                        const params = new URLSearchParams(query);
                        idToken = params.get('id_token');
                    }

                    if (idToken) {
                        console.log('✅ id_token 추출 성공, 길이:', idToken.length);
                        const credential = GoogleAuthProvider.credential(idToken);
                        const result = await signInWithCredential(auth, credential);
                        console.log('✅ Firebase credential 인증 성공, 사용자:', result.user.email);

                        // 구글 로그인 성공 후 사용자 정보 처리 (App.js의 기존 로직 재사용)
                        const user = result.user;
                        const userRef = doc(db, 'users', user.uid);
                        const userSnap = await getDoc(userRef);

                        if (!userSnap.exists()) {
                            const googleDisplayName = user.displayName || user.email?.split('@')[0] || '사용자';
                            const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;

                            await updateProfile(user, {
                                displayName: googleDisplayName,
                                photoURL: googlePhotoURL
                            });

                            await setDoc(userRef, {
                                email: user.email || '',
                                displayName: googleDisplayName,
                                photoURL: googlePhotoURL,
                                point: 100,
                                createdAt: new Date(),
                                authProvider: 'google.com',
                                emailVerified: user.emailVerified || false,
                                isActive: true,
                                lastLoginAt: new Date(),
                                updatedAt: new Date()
                            });

                            await addDoc(collection(db, 'users', user.uid, 'pointHistory'), {
                                type: 'earn',
                                amount: 100,
                                desc: '회원가입 축하 포인트',
                                createdAt: new Date()
                            });
                        } else {
                            const userData = userSnap.data();
                            if (userData.status === '정지') {
                                console.error('❌ 정지된 계정입니다.');
                                await auth.signOut();
                                return;
                            }

                            if (!userData.photoURL || userData.photoURL === process.env.PUBLIC_URL + '/default-profile.svg') {
                                const googlePhotoURL = user.photoURL || `https://lh3.googleusercontent.com/a/${user.uid}=s96-c`;
                                await updateDoc(userRef, {
                                    photoURL: googlePhotoURL,
                                    authProvider: 'google.com',
                                    lastLoginAt: new Date(),
                                    updatedAt: new Date()
                                });

                                await updateProfile(user, {
                                    photoURL: googlePhotoURL
                                });
                            } else {
                                await updateDoc(userRef, {
                                    lastLoginAt: new Date(),
                                    updatedAt: new Date()
                                });
                            }
                        }

                        console.log('✅ Firebase 로그인 성공 (HTTPS redirect)');
                    } else {
                        console.warn('⚠️ id_token을 찾을 수 없습니다. URL 구조 확인 필요');
                        console.log('전체 URL:', url);
                        console.log('Fragment 포함 여부:', url.includes('#'));
                        console.log('Query 포함 여부:', url.includes('?'));
                        // id_token이 없으면 OAuth 플로우가 완료되지 않은 것이므로 처리하지 않음
                    }
                } catch (error) {
                    console.error('❌ HTTPS redirect 처리 실패:', error);
                }
            }
        });

        // 뒤로가기 버튼 처리 (모바일 환경에서만)
        if (Capacitor.getPlatform() !== 'web') {
            const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                // 현재 경로 확인
                const currentPath = window.location.pathname;

                // 홈 화면에서 뒤로가기를 누르면 앱 종료 확인
                if (currentPath === '/' || currentPath === '/home') {
                    if (window.confirm('앱을 종료하시겠습니까?')) {
                        CapacitorApp.exitApp();
                    }
                } else {
                    // 다른 화면에서는 기본 뒤로가기 동작
                    window.history.back();
                }
            });

            // 컴포넌트 언마운트 시 리스너 제거
            return () => {
                unsubscribe();
                backButtonListener.remove();
            };
        }

        // FCM 푸시 알림 수신 리스너 등록
        let pushReceivedListener = null;
        let pushActionListener = null;
        let localNotificationListener = null;
        let fcmMessageUnsubscribe = null;

        // 웹 환경: Firebase Messaging 포그라운드 메시지 수신
        if (Capacitor.getPlatform() === 'web') {
            if (!window.__fcmMessageListenerAdded) {
                window.__fcmMessageListenerAdded = true;
                try {
                    fcmMessageUnsubscribe = onFcmMessage((payload) => {
                        console.log('포그라운드 FCM 메시지 수신:', payload);
                        
                        const title = payload.notification?.title || payload.data?.title || 'Story Potion';
                        const body = payload.notification?.body || payload.data?.body || payload.data?.message || '새로운 알림이 있습니다!';
                        
                        // 브라우저 알림 표시
                        if (pushNotificationManager.isPushSupported() && 
                            pushNotificationManager.getPermissionStatus() === 'granted') {
                            pushNotificationManager.showLocalNotification(title, {
                                body: body,
                                icon: '/app_logo/logo.png',
                                badge: '/app_logo/logo.png',
                                tag: 'fcm-notification',
                                requireInteraction: false,
                                data: payload.data || {}
                            });
                        }
                    });
                    console.log('웹 포그라운드 FCM 메시지 리스너 등록 완료');
                } catch (error) {
                    console.error('FCM 메시지 리스너 등록 실패:', error);
                }
            }
        }

        // 모바일 환경: Capacitor PushNotifications
        if (Capacitor.getPlatform() !== 'web') {
            // 포그라운드에서 푸시 알림 수신 시 처리 (한 번만 등록)
            if (!window.__pushReceivedListenerAdded) {
                window.__pushReceivedListenerAdded = true;
                pushReceivedListener = PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                    console.log('포그라운드 푸시 알림 수신:', notification);

                    // 포그라운드에서도 LocalNotifications로 시스템 알림 표시
                    try {
                        const permissionStatus = await LocalNotifications.requestPermissions();
                        if (permissionStatus.display === 'granted') {
                            await LocalNotifications.schedule({
                                notifications: [{
                                    title: notification.title || '일기 작성 리마인더',
                                    body: notification.body || notification.data?.message || '오늘의 일기를 잊지 마세요!',
                                    id: Math.floor(Math.random() * 1000000),
                                    sound: 'default',
                                    extra: notification.data || {},
                                }]
                            });
                            console.log('포그라운드 알림 표시 완료');
                        } else {
                            console.warn('LocalNotifications 권한이 없습니다.');
                            // LocalNotifications 권한이 없으면 fallback으로 alert 사용
                            alert((notification.title || '일기 작성 리마인더') + '\n' + (notification.body || notification.data?.message || '오늘의 일기를 잊지 마세요!'));
                        }
                    } catch (error) {
                        console.error('포그라운드 알림 표시 실패:', error);
                        // LocalNotifications 실패 시 fallback으로 alert 사용
                        alert((notification.title || '일기 작성 리마인더') + '\n' + (notification.body || notification.data?.message || '오늘의 일기를 잊지 마세요!'));
                    }
                });
            }

            // 알림 클릭/액션 처리 (한 번만 등록)
            if (!window.__pushActionListenerAdded) {
                window.__pushActionListenerAdded = true;
                pushActionListener = PushNotifications.addListener('pushNotificationActionPerformed', async (action) => {
                    console.log('푸시 알림 액션:', action);
                    const data = action.notification.data;

                    // 리마인더 알림인 경우 일기 작성 페이지로 이동
                    if (data?.type === 'diary_reminder') {
                        window.location.href = '/write-diary';
                    }
                });
            }

            // LocalNotifications 클릭 처리 (한 번만 등록)
            if (!window.__localNotificationListenerAdded) {
                window.__localNotificationListenerAdded = true;
                localNotificationListener = LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
                    console.log('로컬 알림 액션:', action);
                    const data = action.notification.extra;

                    // 리마인더 알림인 경우 일기 작성 페이지로 이동
                    if (data?.type === 'diary_reminder') {
                        window.location.href = '/write-diary';
                    }
                });
            }
        }

        // 인앱 결제 초기화 (모바일 환경에서만)
        if (Capacitor.getPlatform() !== 'web') {
            inAppPurchaseService.initialize().then(success => {
                if (success) {
                    console.log('✅ 인앱 결제 초기화 완료');
                } else {
                    console.log('⚠️ 인앱 결제 초기화 실패');
                }
            });
        }

        // 동영상 재생 이벤트 리스너
        const handleVideoPlaying = () => {
            console.log('동영상 재생 시작됨, 최소 2초 후 로딩 화면 종료');
            setVideoPlayed(true);
        };

        window.addEventListener('loadingVideoPlaying', handleVideoPlaying);

        // 컴포넌트 언마운트 시 리스너 정리
        return () => {
            unsubscribe();
            window.removeEventListener('loadingVideoPlaying', handleVideoPlaying);
            if (pushReceivedListener) {
                pushReceivedListener.remove();
            }
            if (pushActionListener) {
                pushActionListener.remove();
            }
            if (localNotificationListener) {
                localNotificationListener.remove();
            }
            if (fcmMessageUnsubscribe) {
                fcmMessageUnsubscribe();
            }
        };
    }, []);

    // 로딩 화면 종료 조건: 인증 완료 + (동영상 재생 또는 3초 경과)
    useEffect(() => {
        if (!authReady) return;

        let timeoutId;

        if (videoPlayed) {
            // 동영상이 재생되면 최소 2초 후 종료
            console.log('동영상 재생됨, 2초 후 로딩 화면 종료');
            timeoutId = setTimeout(() => {
                setIsLoading(false);
            }, 2000);
        } else {
            // 동영상이 재생되지 않으면 3초 후 종료
            console.log('동영상 미재생, 3초 후 로딩 화면 종료');
            timeoutId = setTimeout(() => {
                setIsLoading(false);
            }, 3000);
        }

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [authReady, videoPlayed]);

    if (Capacitor.getPlatform() !== 'web') {
        StatusBar.setOverlaysWebView({ overlay: false });
        StatusBar.setStyle({ style: Style.Light });
        Keyboard.setScroll({ isDisabled: false });
        Keyboard.setResizeMode({ mode: 'body' });
    }

    return (
        <Router>
            <ThemeProvider>
                <ThemeConsumerWrapper user={user}>
                    <ToastProvider>
                        <AppLayout user={user} isLoading={isLoading} />
                    </ToastProvider>
                </ThemeConsumerWrapper>
            </ThemeProvider>
        </Router>
    );
}

const GlobalStyle = createGlobalStyle`
    /* 시스템 폰트 크기 설정의 영향을 받지 않도록 설정 */
    /* html의 font-size를 사용자가 선택한 값으로 동적 설정하여 전체 앱의 폰트 크기를 비율적으로 조절 */
    html {
        font-size: ${props => props.fontSize || '16'}px !important;
        -webkit-text-size-adjust: 100% !important;
        -moz-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
    }
    
    body {
        font-size: ${props => props.fontSize || '16'}px !important;
        -webkit-text-size-adjust: 100% !important;
        -moz-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
    }
    
    * {
        font-family: ${props => props.fontFamily} !important;
    }
    
    
    /* 모든 요소가 시스템 폰트 크기 설정의 영향을 받지 않도록 강제 적용 */
    *, *::before, *::after {
        -webkit-text-size-adjust: 100% !important;
        -moz-text-size-adjust: 100% !important;
        -ms-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
    }
    
    /* Header와 Navigation의 폰트 크기도 html font-size에 비례하여 조절됨 */
    /* LogoText: 28px (기준 16px일 때) -> 12px 선택 시 21px, 20px 선택 시 35px */
    /* TitleText: 20px (기준 16px일 때) -> 12px 선택 시 15px, 20px 선택 시 25px */
`;

function ThemeConsumerWrapper({ children, user }) {
    const { actualTheme, fontFamily, fontSize, theme, setThemeMode } = useTheme();
    // 다이어리 테마일 때 body 배경색 직접 설정
    useEffect(() => {
        if (actualTheme === 'diary') {
            document.body.style.background = '#faf8f3';
            document.body.style.backgroundImage = `
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 0, 0, 0.02) 2px,
                    rgba(0, 0, 0, 0.02) 4px
                ),
                repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 0, 0, 0.02) 2px,
                    rgba(0, 0, 0, 0.02) 4px
                )
            `;
        } else if (actualTheme === 'glass') {
            // 글래스 모피즘 테마: 하늘색에서 연보라색으로 그라데이션 (#e1bee7, #d1c4e9 포함)
            document.body.style.background = 'linear-gradient(135deg, #bfe9ff 0%, #a7c3ff 33%, #e1bee7 66%, #d1c4e9 100%)';
            document.body.style.backgroundAttachment = 'fixed';
            document.body.style.backgroundSize = '200% 200%';
            document.body.style.animation = 'gradientShift 20s ease infinite';
        } else {
            document.body.style.background = '';
            document.body.style.backgroundImage = '';
            document.body.style.backgroundAttachment = '';
            document.body.style.backgroundSize = '';
            document.body.style.animation = '';
        }
    }, [actualTheme]);

    // 프리미엄 해지 시 테마 자동 변경
    useEffect(() => {
        if (user?.uid) {
            const userRef = doc(db, 'users', user.uid);
            let prevIsPremium = null;
            
            const unsubscribe = onSnapshot(userRef, (userDoc) => {
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const currentIsPremium = data.isMonthlyPremium || data.isYearlyPremium || false;
                    
                    // 프리미엄이 해지되었고, 이전에는 프리미엄이었던 경우
                    if (prevIsPremium === true && !currentIsPremium) {
                        // 현재 테마가 프리미엄 전용 테마인 경우 라이트 테마로 변경
                        if (theme === 'diary' || theme === 'glass') {
                            setThemeMode('light');
                            console.log('프리미엄 구독이 해지되어 테마를 라이트 모드로 변경했습니다.');
                        }
                    }
                    
                    prevIsPremium = currentIsPremium;
                } else {
                    // 문서가 없는 경우
                    if (prevIsPremium === true) {
                        // 이전에 프리미엄이었는데 문서가 없어진 경우
                        if (theme === 'diary' || theme === 'glass') {
                            setThemeMode('light');
                            console.log('프리미엄 구독이 해지되어 테마를 라이트 모드로 변경했습니다.');
                        }
                    }
                    prevIsPremium = false;
                }
            }, (error) => {
                console.error('프리미엄 상태 조회 실패:', error);
            });

            return () => unsubscribe();
        }
    }, [user, theme, setThemeMode]);

    // 테마 선택 로직
    const getTheme = () => {
        if (actualTheme === 'dark') return darkTheme;
        return lightTheme;
    };

    return (
        <StyledThemeProvider theme={getTheme()}>
            <GlobalStyle fontFamily={fontFamily} fontSize={fontSize} />
            {children}
        </StyledThemeProvider>
    );
}

export default App;
