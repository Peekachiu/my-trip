'use client';

import { useState } from 'react';
import { useCurrency, FLAGS } from '@/lib/currency';

export default function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);

    const currencies = Object.keys(FLAGS);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all text-gray-800 dark:text-white font-bold text-sm backdrop-blur-md border border-gray-200 dark:border-white/20"
            >
                <span className="text-lg">{FLAGS[currency]}</span>
                <span>{currency}</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-xl shadow-xl z-50 overflow-hidden border border-white/50 dark:border-gray-700 animate-fadeIn">
                        <div className="max-h-64 overflow-y-auto py-1">
                            {currencies.map(c => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        setCurrency(c);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-brand-cyan/10 transition-colors flex items-center gap-3 ${currency === c ? 'bg-brand-cyan/5 text-brand-cyan font-bold' : 'text-gray-700 dark:text-gray-200'}`}
                                >
                                    <span className="text-xl">{FLAGS[c]}</span>
                                    <span>{c}</span>
                                    {currency === c && <span className="ml-auto text-xs">✓</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
