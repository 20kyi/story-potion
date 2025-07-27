import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential, updateProfile } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { PushNotifications } from '@capacitor/push-notifications';

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
import NovelListByGenre from './pages/novel/NovelListByGenre';
import { ToastProvider } from './components/ui/ToastProvider';
import Statistics from './pages/mypage/Statistics';
import Settings from './pages/mypage/Settings';
import NotificationSettings from './pages/mypage/NotificationSettings';
import Notice from './pages/mypage/Notice';
import Support from './pages/mypage/Support';
import Social from './pages/mypage/Social';
import Friend from './pages/mypage/Friend';
import Shop from './pages/mypage/Shop';
import NoticeDetail from './pages/mypage/NoticeDetail';
import ThemeSettings from './pages/mypage/ThemeSettings';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { useNotification } from './hooks/useNotification';
import NotificationToast from './components/NotificationToast';
import PointHistory from './pages/mypage/PointHistory';
import PotionShop from './pages/mypage/PotionShop';
import PointCharge from './pages/mypage/PointCharge';
import UserManagement from './pages/admin/UserManagement';
import ProfileFix from './pages/mypage/ProfileFix';
import './utils/runPointUpdate'; // 포인트 일괄 지급 스크립트 로드
import './utils/syncAuthUsers'; // 사용자 동기화 스크립트 로드
import './utils/debugUsers'; // 사용자 디버깅 스크립트 로드
import './utils/adminAuth'; // 관리자 권한 체크 스크립트 로드
import './utils/updateGoogleProfileImages'; // 구글 프로필 이미지 업데이트 스크립트 로드
import './utils/fixGoogleProfiles'; // 구글 프로필 문제 해결 스크립트 로드
import './utils/runPotionHistoryCleanup'; // 포션 사용 내역 정리 스크립트 로드
import FriendNovelList from './pages/novel/FriendNovelList';
import AppInfo from './pages/mypage/AppInfo';

const AppLayout = ({ user, isLoading }) => {
    const location = useLocation();
    const showNavigation = !['/login', '/signup'].includes(location.pathname);
    const { notification, hideNotification } = useNotification(user);

    if (isLoading) return <div>로딩 중...</div>;

    return (
        <div className="App">
            <NotificationToast notification={notification} onClose={hideNotification} />
            <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
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
                <Route path="/my/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notification-settings" element={user ? <NotificationSettings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notice" element={user ? <Notice user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notice/:id" element={user ? <NoticeDetail user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/support" element={user ? <Support user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/social" element={user ? <Social user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/friend" element={user ? <Friend user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/shop" element={user ? <Shop user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/shop/charge" element={user ? <PointCharge user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/theme-settings" element={user ? <ThemeSettings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/point-history" element={<PointHistory user={user} />} />
                <Route path="/my/potion-shop" element={user ? <PotionShop user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/profile-fix" element={user ? <ProfileFix user={user} /> : <Navigate to="/login" />} />
                <Route path="/friend-novels" element={user ? <FriendNovelList user={user} /> : <Navigate to="/login" />} />
                <Route path="/admin/users" element={user ? <UserManagement user={user} /> : <Navigate to="/login" />} />
            </Routes>
            {showNavigation && user && <Navigation user={user} />}
        </div>
    );
};

function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsLoading(false);
        });

        // 🔐 딥링크 리디렉션 처리
        CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
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
                                point: 0,
                                createdAt: new Date(),
                                authProvider: 'google.com',
                                emailVerified: user.emailVerified || false,
                                isActive: true,
                                lastLoginAt: new Date(),
                                updatedAt: new Date()
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
                        
                        console.log('✅ Firebase 로그인 성공');
                    } catch (error) {
                        console.error('❌ Firebase 로그인 실패:', error);
                    }
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
        if (Capacitor.getPlatform() !== 'web') {
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('푸시 알림 수신:', notification);
                // TODO: 필요시 Toast 등으로 표시
                alert(notification.title + '\n' + notification.body);
            });
        }

        return () => unsubscribe();
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

function ThemeConsumerWrapper({ children }) {
    const { actualTheme } = useTheme();
    return (
        <StyledThemeProvider theme={actualTheme === 'dark' ? darkTheme : lightTheme}>
            {children}
        </StyledThemeProvider>
    );
}

export default App;
