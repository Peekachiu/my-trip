'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language';

export default function CurrencyWidget() {
    const { t } = useLanguage();
    const [rates, setRates] = useState<any>(null);
    const [amount, setAmount] = useState(1);
    const [from, setFrom] = useState('USD');
    const [to, setTo] = useState('MYR');
    const [loading, setLoading] = useState(true);

    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'MYR', 'SGD', 'CNY', 'AUD', 'CAD', 'KRW'];

    useEffect(() => {
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
            .then(res => res.json())
            .then(data => {
                setRates(data.rates);
                setLoading(false);
            })
            .catch(err => console.error('Failed to fetch rates', err));
    }, []);

    const convert = () => {
        if (!rates) return 0;
        // Rate from base (USD)
        const rateFrom = rates[from];
        const rateTo = rates[to];
        return (amount / rateFrom) * rateTo;
    };

    if (loading) return <div className="glass-card p-4 animate-pulse h-40"></div>;

    return (
        <div className="glass-card p-6 border-brand-cyan/20">
            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                💱 {t('dashboard.currencyConverter') || 'Currency Converter'}
            </h3>

            <div className="flex items-center gap-2 mb-4">
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-1/3 p-2 bg-gray-50 rounded-lg text-gray-800 font-bold text-center border focus:border-brand-cyan outline-none"
                />
                <select
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    className="w-1/3 p-2 bg-gray-50 rounded-lg text-gray-800 font-bold border focus:border-brand-cyan outline-none"
                >
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="text-gray-400">to</span>
                <select
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    className="w-1/3 p-2 bg-gray-50 rounded-lg text-gray-800 font-bold border focus:border-brand-cyan outline-none"
                >
                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="text-center p-3 bg-brand-cyan/5 rounded-xl border border-brand-cyan/10">
                <p className="text-xs text-gray-500 mb-1">
                    {amount} {from} =
                </p>
                <p className="text-2xl font-bold text-brand-cyan">
                    {convert().toFixed(2)} {to}
                </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="text-xs text-gray-400 text-center bg-gray-50 p-2 rounded">
                    1 USD = {rates['MYR']?.toFixed(2)} MYR
                </div>
                <div className="text-xs text-gray-400 text-center bg-gray-50 p-2 rounded">
                    1 USD = {rates['JPY']?.toFixed(0)} JPY
                </div>
            </div>
        </div>
    );
}
