import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // 로컬스토리지에서 테마 불러오기, 기본값은 'system'
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved : 'system';
    });

    // 실제 적용될 테마 (시스템 설정일 때는 시스템 테마를 감지)
    const [actualTheme, setActualTheme] = useState('light');

    // 폰트 패밀리 상태 추가
    const [fontFamily, setFontFamily] = useState(() => {
        const saved = localStorage.getItem('fontFamily');
        return saved ? saved : 'system-ui, sans-serif';
    });

    // 시스템 테마 감지
    const getSystemTheme = () => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    // 시스템 테마 변경 감지
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
            if (theme === 'system') {
                setActualTheme(getSystemTheme());
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // 테마 변경 시 실제 테마 업데이트
    useEffect(() => {
        if (theme === 'system') {
            setActualTheme(getSystemTheme());
        } else {
            setActualTheme(theme);
        }
    }, [theme]);

    // 실제 테마가 변경될 때 body에 적용
    useEffect(() => {
        document.body.className = actualTheme;
        localStorage.setItem('theme', theme);
    }, [actualTheme, theme]);

    // 폰트 패밀리가 변경될 때 localStorage에 저장
    useEffect(() => {
        localStorage.setItem('fontFamily', fontFamily);
    }, [fontFamily]);

    const setThemeMode = (mode) => {
        setTheme(mode);
    };

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            actualTheme, 
            setThemeMode,
            toggleTheme: () => setThemeMode(theme === 'light' ? 'dark' : 'light'),
            fontFamily,
            setFontFamily
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
} 