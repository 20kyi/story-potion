import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
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
import Premium from './pages/mypage/Premium';
import NoticeDetail from './pages/mypage/NoticeDetail';
import { ThemeProvider, useTheme } from './ThemeContext';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './theme';
import { useNotification } from './hooks/useNotification';
import NotificationToast from './components/NotificationToast';
import ThemeSettings from './pages/mypage/ThemeSettings';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';

const AppLayout = ({ user, isLoading }) => {
    const location = useLocation();
    const showNavigation = !['/login', '/signup'].includes(location.pathname);
    const { notification, hideNotification } = useNotification(user);

    if (isLoading) {
        return <div>로딩 중...</div>; // 간단한 로딩 인디케이터
    }

    return (
        <div className="App">
            <NotificationToast
                notification={notification}
                onClose={hideNotification}
            />
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
                <Route path="/my/premium" element={user ? <Premium user={user} /> : <Navigate to="/login" />} />
                <Route path="/my/theme-settings" element={user ? <ThemeSettings user={user} /> : <Navigate to="/login" />} />
            </Routes>
            {showNavigation && user && <Navigation user={user} />}
        </div>
    );
}

function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsLoading(false);
        });

        // 딥링크 복귀 시 access_token 파싱
        CapacitorApp.addListener('appUrlOpen', (data) => {
            const url = data.url;
            if (url.startsWith('myapp://auth')) {
                const params = new URLSearchParams(url.split('#')[1]);
                const accessToken = params.get('access_token');
                console.log('구글 access_token:', accessToken);
                // accessToken을 이용해 추가 인증 처리 가능
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    if (window.Capacitor) {
        StatusBar.setOverlaysWebView({ overlay: false });
        StatusBar.setStyle({ style: Style.Light });
        Keyboard.setScroll({ isDisabled: false });
        Keyboard.setResizeMode({ mode: 'body' }); // 'native'에서 'body'로 변경
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

// ThemeContext의 theme 값을 받아서 styled-components ThemeProvider로 전달하는 래퍼 컴포넌트
function ThemeConsumerWrapper({ children }) {
    const { actualTheme } = useTheme();
    return (
        <StyledThemeProvider theme={actualTheme === 'dark' ? darkTheme : lightTheme}>
            {children}
        </StyledThemeProvider>
    );
}

export default App; 