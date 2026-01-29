'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type AccentColor = 'magenta' | 'cyan' | 'purple' | 'blue' | 'orange' | 'teal' | 'red';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [accentColor, setAccentColorState] = useState<AccentColor>('magenta');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load persisted settings
        const storedTheme = localStorage.getItem('trip_theme') as Theme;
        const storedColor = localStorage.getItem('trip_accent') as AccentColor;

        if (storedTheme) setThemeState(storedTheme);
        if (storedColor) setAccentColorState(storedColor);
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('trip_theme', theme);

        // Apply theme class
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme, mounted]);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('trip_accent', accentColor);

        // Apply CSS variables for colors
        const root = document.documentElement;

        let primary, secondary, light, gradientFrom, gradientTo;

        switch (accentColor) {
            case 'cyan':
                primary = '#0891B2'; // Cyan 600
                secondary = '#FF0087'; // Magenta
                light = '#CFFAFE'; // Cyan 100
                gradientFrom = '#0891B2';
                gradientTo = '#FF0087';
                break;
            case 'purple':
                primary = '#9333EA'; // Purple 600
                secondary = '#F472B6'; // Pink 400
                light = '#F3E8FF'; // Purple 100
                gradientFrom = '#9333EA';
                gradientTo = '#F472B6';
                break;
            case 'blue':
                primary = '#2563EB'; // Blue 600
                secondary = '#4ADE80'; // Green 400
                light = '#DBEAFE'; // Blue 100
                gradientFrom = '#2563EB';
                gradientTo = '#4ADE80';
                break;
            case 'orange':
                primary = '#EA580C'; // Orange 600
                secondary = '#FDBA74'; // Orange 300
                light = '#FFEDD5'; // Orange 100
                gradientFrom = '#EA580C';
                gradientTo = '#FDBA74';
                break;
            case 'teal':
                primary = '#0D9488'; // Teal 600
                secondary = '#2DD4BF'; // Teal 400
                light = '#CCFBF1'; // Teal 100
                gradientFrom = '#0D9488';
                gradientTo = '#2DD4BF';
                break;
            case 'red':
                primary = '#DC2626'; // Red 600
                secondary = '#F87171'; // Red 400
                light = '#FEE2E2'; // Red 100
                gradientFrom = '#DC2626'; // Red 600
                gradientTo = '#F87171'; // Red 400
                break;
            case 'magenta':
            default:
                primary = '#FF0087'; // Brand Magenta
                secondary = '#FF7DB0'; // Brand Pink (Changed from Cyan to avoid green look)
                light = '#FFE4E6'; // Rose 100
                gradientFrom = '#FF0087';
                gradientTo = '#FF7DB0';
                break;
        }

        root.style.setProperty('--color-brand-magenta', primary);
        root.style.setProperty('--color-brand-cyan', secondary);
        // Note: You might want to define more granular vars like --color-brand-primary, --color-brand-secondary in globals.css
        // But since the config uses brand-magenta and brand-cyan specifically, we override them.

    }, [accentColor, mounted]);

    const setTheme = (t: Theme) => setThemeState(t);
    const setAccentColor = (c: AccentColor) => setAccentColorState(c);

    // Always render provider to ensure useTheme works during SSR/Static Generation
    return (
        <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
