import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';
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
import FriendSearch from './pages/mypage/FriendSearch';
import Premium from './pages/mypage/Premium';
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
import './utils/runPointUpdate'; // 포인트 일괄 지급 스크립트 로드
import './utils/syncAuthUsers'; // 사용자 동기화 스크립트 로드
import './utils/debugUsers'; // 사용자 디버깅 스크립트 로드
import './utils/adminAuth'; // 관리자 권한 체크 스크립트 로드
import FriendNovelList from './pages/novel/FriendNovelList';

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
                <Route path="/my/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notification-settings" element={user ? <NotificationSettings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notice" element={user ? <Notice user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/notice/:id" element={user ? <NoticeDetail user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/support" element={user ? <Support user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/social" element={user ? <Social user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/friend-search" element={user ? <FriendSearch user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/premium" element={user ? <Premium user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/theme-settings" element={user ? <ThemeSettings user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/point-history" element={<PointHistory user={user} />} />
                <Route path="/my/potion-shop" element={user ? <PotionShop user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/premium/charge" element={user ? <PointCharge user={user} /> : <Navigate to="/login" />} />
                <Route path="/friend-novels" element={<FriendNovelList />} />
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
                        await signInWithCredential(auth, credential);
                        console.log('✅ Firebase 로그인 성공');
                    } catch (error) {
                        console.error('❌ Firebase 로그인 실패:', error);
                    }
                }
            }
        });

        // FCM 푸시 알림 수신 리스너 등록
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('푸시 알림 수신:', notification);
            // TODO: 필요시 Toast 등으로 표시
            alert(notification.title + '\n' + notification.body);
        });

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
