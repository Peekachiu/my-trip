'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import Link from 'next/link';
import CurrencyWidget from '@/components/CurrencyWidget';

type Trip = { id: string; title: string; destination: string; startDate: string; endDate: string; };

export default function UserDashboard() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [trips, setTrips] = useState<Trip[]>([]);

    useEffect(() => {
        if (user) {
            api.get(`/trips/user/${user.id}`).then(setTrips);
        }
    }, [user]);

    const getTripStatus = (start: string, end: string) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (now > endDate) return { label: t('trip.status.completed'), color: 'bg-gray-100 text-gray-500', isUpcoming: false };
        if (now >= startDate && now <= endDate) return { label: t('trip.status.ongoing'), color: 'bg-green-100 text-green-600', isUpcoming: false };

        const diffTime = Math.abs(startDate.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            label: t('trip.status.upcoming'),
            color: 'bg-brand-cyan/10 text-brand-cyan',
            isUpcoming: true,
            daysLeft: diffDays === 0 ? t('trip.status.today') : `${diffDays} ${t('trip.status.daysLeft')}`
        };
    };

    if (!user) return <p className="p-4 text-brand-magenta">{t('common.loading')}</p>;

    return (
        <div className="min-h-screen bg-transparent pt-24 pb-20 px-4 animate-fadeIn">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

                {/* Main Content */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-black text-gray-800 dark:text-white drop-shadow-sm tracking-tight">{t('dashboard.myTrips')}</h1>
                        {user.role === 'admin' && (
                            <Link href="/admin" className="text-sm font-bold text-brand-cyan hover:text-brand-magenta transition-colors">
                                {t('nav.admin')} →
                            </Link>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                        {trips.length === 0 && user.role !== 'admin' ? (
                            <div className="col-span-full text-center py-20">
                                <p className="text-gray-400 text-lg font-medium">{t('dashboard.noTrips')}</p>
                            </div>
                        ) : (
                            trips.map(t => {
                                const status = getTripStatus(t.startDate, t.endDate);
                                return (
                                    <Link key={t.id} href={`/trip/${t.id}`}>
                                        <div className="group relative glass-card p-5 hover:shadow-lg transition-all hover:-translate-y-1 hover:border-brand-cyan/40 h-48 flex flex-col justify-between">
                                            <div className="absolute top-4 right-4 z-10">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 line-clamp-1 mb-1">{t.title}</h3>
                                                <p className="text-brand-magenta font-medium text-sm flex items-center gap-1">
                                                    📍 {t.destination}
                                                </p>
                                            </div>

                                            <div className="mt-auto">
                                                {status.isUpcoming && status.daysLeft && (
                                                    <div className="mb-2">
                                                        <span className="text-xs font-bold text-brand-cyan bg-brand-cyan/5 px-2 py-1 rounded-md">
                                                            ⏳ {status.daysLeft}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                                                    <span>{new Date(t.startDate).toLocaleDateString()}</span>
                                                    <span className="mx-2">—</span>
                                                    <span>{new Date(t.endDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Sidebar Widget Area */}
                <div className="w-full lg:w-80 shrink-0 space-y-6">
                    <CurrencyWidget />

                    {/* Placeholder for future widgets like Weather or Quick Actions */}
                    <div className="glass-card p-6 border-brand-pink/20 bg-gradient-to-br from-brand-pink/5 to-transparent">
                        <h3 className="text-brand-pink text-sm font-bold uppercase tracking-wider mb-2">🚀 {t('nav.settings') || 'Quick Access'}</h3>
                        <Link href="/settings" className="block p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors text-sm font-bold text-gray-700 mb-2">
                            ⚙️ {t('nav.settings') || 'Settings'}
                        </Link>
                    </div>
                </div>

            </div>

        </div>
    );
}
