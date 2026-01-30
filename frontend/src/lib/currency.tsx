'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type CurrencyContextType = {
    currency: string;
    setCurrency: (c: string) => void;
    rates: Record<string, number>;
    convert: (amount: number, from: string) => number;
    format: (amount: number, from: string) => string;
    loading: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const FLAG_MAP: Record<string, string> = {
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', MYR: '🇲🇾',
    SGD: '🇸🇬', CNY: '🇨🇳', AUD: '🇦🇺', CAD: '🇨🇦', KRW: '🇰🇷'
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState('MYR');
    const [rates, setRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load preference
        const saved = localStorage.getItem('currency');
        if (saved) setCurrency(saved);

        // Fetch rates (Base USD)
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
            .then(res => res.json())
            .then(data => {
                setRates(data.rates);
                setLoading(false);
            })
            .catch(err => console.error('Failed to fetch rates', err));
    }, []);

    const updateCurrency = (c: string) => {
        setCurrency(c);
        localStorage.setItem('currency', c);
    };

    const convert = (amount: number, from: string) => {
        if (!rates[from] || !rates[currency]) return amount;
        // Convert to USD then to Target
        const inUSD = amount / rates[from];
        return inUSD * rates[currency];
    };

    const format = (amount: number, from: string) => {
        const val = convert(amount, from);
        return `${currency} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency: updateCurrency, rates, convert, format, loading }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
    return context;
};

export const FLAGS = FLAG_MAP;
