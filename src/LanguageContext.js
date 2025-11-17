import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import ko from './locales/ko.json';
import en from './locales/en.json';

const LanguageContext = createContext(null);

const resources = {
    ko,
    en,
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        if (typeof window === 'undefined') return 'ko';
        return localStorage.getItem('language') || 'ko';
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('language', language);
    }, [language]);

    const value = useMemo(() => {
        const t = (key, vars) => {
            const dict = resources[language] || {};
            let value = dict[key] || key;

            // 간단한 템플릿 치환: {{var}} 형태를 vars에 따라 대체
            if (vars && typeof value === 'string') {
                Object.entries(vars).forEach(([k, v]) => {
                    const pattern = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
                    value = value.replace(pattern, String(v));
                });
            }

            return value;
        };
        return {
            language,
            setLanguage,
            t,
        };
    }, [language]);

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return ctx;
};

export const useTranslation = () => {
    const { t } = useLanguage();
    return { t };
};


