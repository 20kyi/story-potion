import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
// import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential, updateProfile } from 'firebase/auth';
import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential, updateProfile } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

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
import Statistics from './pages/mypage/Statistics';
import Settings from './pages/mypage/Settings';
import NotificationSettings from './pages/mypage/NotificationSettings';
import Notice from './pages/mypage/Notice';
import Support from './pages/mypage/Support';
import FAQ from './pages/mypage/FAQ';
import Social from './pages/mypage/Social';
import Friend from './pages/mypage/Friend';
import PotionGift from './pages/mypage/PotionGift';
import Shop from './pages/mypage/Shop';
import NoticeDetail from './pages/mypage/NoticeDetail';
import ThemeSettings from './pages/mypage/ThemeSettings';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ThemeProvider as StyledThemeProvider, createGlobalStyle } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { useNotification } from './hooks/useNotification';
import NotificationToast from './components/NotificationToast';
import PointHistory from './pages/mypage/PointHistory';
import PotionShop from './pages/mypage/PotionShop';
import PointCharge from './pages/mypage/PointCharge';
import UserManagement from './pages/admin/UserManagement';
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
import { checkAndRenewMonthlyPremium } from './utils/premiumRenewal';
import LoadingScreen from './components/LoadingScreen';
import LoadingTest from './pages/LoadingTest';

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
                <Route path="/my/app-info" element={user ? <AppInfo user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/terms-of-service" element={user ? <TermsOfService user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/privacy-policy" element={user ? <PrivacyPolicy user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notification-settings" element={user ? <NotificationSettings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notice" element={user ? <Notice user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notice/:id" element={user ? <NoticeDetail user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/support" element={user ? <Support user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/faq" element={user ? <FAQ user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/social" element={user ? <Social user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/friend" element={user ? <Friend user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/potion-gift" element={user ? <PotionGift user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/shop" element={user ? <Shop user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/shop/charge" element={user ? <PointCharge user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/theme-settings" element={user ? <ThemeSettings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/point-history" element={<PointHistory user={user} />} />
                <Route path="/my/potion-shop" element={user ? <PotionShop user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/profile-fix" element={user ? <ProfileFix user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/profile-edit" element={user ? <ProfileEdit user={user} /> : <Navigate to="/login" />} />
                <Route path="/friend-novels" element={user ? <FriendNovelList user={user} /> : <Navigate to="/login" />} />
                <Route path="/purchased-novels" element={user ? <PurchasedNovels user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/users" element={user ? <UserManagement user={user} /> : <Navigate to="/login" />} />
                <Route path="/loading-test" element={user ? <LoadingTest user={user} /> : <Navigate to="/login" />} />
            </Routes>
            {showNavigation && user && <Navigation user={user} />}
        </div>
    );
};

function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 웹 환경에서 카카오 콜백 처리
        if (Capacitor.getPlatform() === 'web' && window.location.pathname === '/auth/kakao/callback') {
            const handleKakaoCallback = async () => {
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const code = urlParams.get('code');
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
                        const result = await kakaoAuth({
                            code,
                            redirectUri: window.location.origin + '/auth/kakao/callback'
                        });

                        if (result.data.success && result.data.userInfo) {
                            const kakaoUserInfo = result.data.userInfo;

                            // 카카오 사용자 정보로 Firebase 사용자 생성 또는 로그인
                            const kakaoId = kakaoUserInfo.id.toString();
                            const kakaoEmail = kakaoUserInfo.kakao_account?.email || `kakao_${kakaoId}@kakao.temp`;
                            const kakaoNickname = kakaoUserInfo.kakao_account?.profile?.nickname || kakaoUserInfo.properties?.nickname || '카카오 사용자';
                            const kakaoPhotoURL = kakaoUserInfo.kakao_account?.profile?.profile_image_url || kakaoUserInfo.properties?.profile_image || process.env.PUBLIC_URL + '/default-profile.svg';

                            // Firestore에서 카카오 ID로 기존 사용자 찾기
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
                                    window.location.href = '/login';
                                    return;
                                }

                                // 프로필 정보 업데이트
                                await updateDoc(userRef, {
                                    displayName: kakaoNickname,
                                    photoURL: kakaoPhotoURL,
                                    authProvider: 'kakao',
                                    lastLoginAt: new Date(),
                                    updatedAt: new Date()
                                });

                                // 커스텀 토큰으로 로그인
                                if (result.data.customToken) {
                                    await auth.signInWithCustomToken(result.data.customToken);
                                    console.log('✅ 카카오 로그인 성공 (기존 사용자)');
                                    window.location.href = '/';
                                }
                            } else {
                                // 신규 사용자 - 커스텀 토큰으로 사용자 생성
                                if (result.data.customToken) {
                                    const userCredential = await auth.signInWithCustomToken(result.data.customToken);
                                    const user = userCredential.user;
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

                                    console.log('✅ 카카오 로그인 성공 (신규 사용자)');
                                    window.location.href = '/';
                                }
                            }
                        } else {
                            console.error('❌ 카카오 인증 실패:', result.data.error);
                            window.location.href = '/login';
                        }
                    } else {
                        console.warn('⚠️ 카카오 code를 찾을 수 없습니다.');
                        window.location.href = '/login';
                    }
                } catch (error) {
                    console.error('❌ 카카오 콜백 처리 실패:', error);
                    window.location.href = '/login';
                }
            };

            handleKakaoCallback();
        }

        // 주의: 커스텀 OAuth 플로우를 사용하므로 getRedirectResult는 호출하지 않음
        // 실제 구글 로그인은 appUrlOpen 이벤트 핸들러에서 처리됨
        // getRedirectResult를 호출하면 "missing initial state" 에러가 발생할 수 있으며,
        // 이는 실제 로그인 플로우에 영향을 줄 수 있으므로 완전히 제거함

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setIsLoading(false);

            // 사용자 로그인 시 월간 프리미엄 갱신일 확인 및 자동 갱신
            if (user?.uid) {
                try {
                    await checkAndRenewMonthlyPremium(user.uid);
                } catch (error) {
                    console.error('프리미엄 갱신 확인 중 오류:', error);
                }

                // 앱 환경에서 FCM 토큰 자동 등록
                if (Capacitor.getPlatform() !== 'web') {
                    try {
                        // 권한 확인
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
                            console.log('푸시 알림 권한이 없습니다. 사용자가 알림 설정에서 권한을 허용해야 합니다.');
                        }
                    } catch (error) {
                        console.error('FCM 토큰 등록 중 오류:', error);
                    }
                }
            }
        });

        // 앱이 포그라운드로 돌아올 때 상태 확인
        CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
            if (isActive) {
                console.log('📱 앱이 활성화되었습니다. 로그인 상태 확인 중...');
                // 앱이 활성화될 때 현재 사용자 상태 확인
                const currentUser = auth.currentUser;
                if (currentUser) {
                    console.log('✅ 사용자가 이미 로그인되어 있습니다:', currentUser.email);
                }
            }
        });

        // 🔐 딥링크 및 HTTPS 리디렉션 처리
        CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
            console.log('🔗 appUrlOpen 이벤트 발생:', url);

            // 커스텀 스킴 처리 (storypotion://auth)
            if (url.startsWith('storypotion://auth')) {
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
                            const result = await kakaoAuth({ code, redirectUri: 'https://story-potion.web.app/auth/kakao/callback' });

                            if (result.data.success && result.data.userInfo) {
                                const kakaoUserInfo = result.data.userInfo;

                                // 카카오 사용자 정보로 Firebase 사용자 생성 또는 로그인
                                const kakaoId = kakaoUserInfo.id.toString();
                                const kakaoEmail = kakaoUserInfo.kakao_account?.email || `kakao_${kakaoId}@kakao.temp`;
                                const kakaoNickname = kakaoUserInfo.kakao_account?.profile?.nickname || kakaoUserInfo.properties?.nickname || '카카오 사용자';
                                const kakaoPhotoURL = kakaoUserInfo.kakao_account?.profile?.profile_image_url || kakaoUserInfo.properties?.profile_image || process.env.PUBLIC_URL + '/default-profile.svg';

                                // Firestore에서 카카오 ID로 기존 사용자 찾기
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

                                    // 프로필 정보 업데이트
                                    await updateDoc(userRef, {
                                        displayName: kakaoNickname,
                                        photoURL: kakaoPhotoURL,
                                        authProvider: 'kakao',
                                        lastLoginAt: new Date(),
                                        updatedAt: new Date()
                                    });

                                    // 커스텀 토큰으로 로그인
                                    if (result.data.customToken) {
                                        await auth.signInWithCustomToken(result.data.customToken);
                                        console.log('✅ 카카오 로그인 성공 (기존 사용자)');
                                    }
                                } else {
                                    // 신규 사용자 - 커스텀 토큰으로 사용자 생성
                                    if (result.data.customToken) {
                                        const userCredential = await auth.signInWithCustomToken(result.data.customToken);
                                        const user = userCredential.user;
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

                                        console.log('✅ 카카오 로그인 성공 (신규 사용자)');
                                    }
                                }
                            } else {
                                console.error('❌ 카카오 인증 실패:', result.data.error);
                            }
                        } else {
                            console.warn('⚠️ 카카오 code를 찾을 수 없습니다.');
                        }
                    } catch (error) {
                        console.error('❌ 카카오 콜백 처리 실패:', error);
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

        // FCM 푸시 알림 수신 리스너 등록 (모바일 환경에서만)
        let pushReceivedListener = null;
        let pushActionListener = null;
        let localNotificationListener = null;

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

        // 컴포넌트 언마운트 시 리스너 정리
        return () => {
            unsubscribe();
            if (pushReceivedListener) {
                pushReceivedListener.remove();
            }
            if (pushActionListener) {
                pushActionListener.remove();
            }
            if (localNotificationListener) {
                localNotificationListener.remove();
            }
        };
    }, []);

    if (Capacitor.getPlatform() !== 'web') {
        StatusBar.setOverlaysWebView({ overlay: false });
        StatusBar.setStyle({ style: Style.Light });
        Keyboard.setScroll({ isDisabled: false });
        Keyboard.setResizeMode({ mode: 'body' });
    }

    return (
        <Router>
            <ThemeProvider>
                <ThemeConsumerWrapper>
                    <ToastProvider>
                        <AppLayout user={user} isLoading={isLoading} />
                    </ToastProvider>
                </ThemeConsumerWrapper>
            </ThemeProvider>
        </Router>
    );
}

const GlobalStyle = createGlobalStyle`
    * {
        font-family: ${props => props.fontFamily} !important;
    }
    
    /* 폰트 크기 적용 - 모든 요소에 직접 적용 */
    * {
        font-size: ${props => props.fontSize}px !important;
    }
    
    /* Header와 Navigation은 제외 - 각 요소에 이미 !important로 명시적 폰트 크기가 설정되어 있어 자동으로 override됨 */
    /* LogoText: 28px, TitleText: 20px, Nickname: 18px, NavText: 12px 등이 이미 !important로 설정되어 있음 */
`;

function ThemeConsumerWrapper({ children }) {
    const { actualTheme, fontFamily, fontSize } = useTheme();
    return (
        <StyledThemeProvider theme={actualTheme === 'dark' ? darkTheme : lightTheme}>
            <GlobalStyle fontFamily={fontFamily} fontSize={fontSize} />
            {children}
        </StyledThemeProvider>
    );
}

export default App;
