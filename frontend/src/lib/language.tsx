'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const storedLanguage = localStorage.getItem('trip_language') as Language;
        if (storedLanguage && translations[storedLanguage]) {
            setLanguageState(storedLanguage);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('trip_language', language);
    }, [language, mounted]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (!value) break;
        }

        return value || key; // Return key if translation not found
    };

    // Prevent hydration mismatch by rendering children only after mount, 
    // or you could accept a flash of default content. 
    // For simplicity with persistence, we'll render immediately but `language` might update.
    // Ideally, for Critical UI, we might want to block, but for client-side app this is fine.

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
