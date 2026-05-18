'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import Link from 'next/link';

type Trip = {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    isCompleted?: boolean;
    deletedAt?: string | null;
};

type ArchiveTab = 'completed' | 'deleted';

export default function ArchivePage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [tab, setTab] = useState<ArchiveTab>('completed');
    const [busyId, setBusyId] = useState<string | null>(null);

    const loadTrips = () => {
        if (!user) return;
        api.get(`/trips/user/${user.id}?includeDeleted=true`)
            .then(data => setTrips(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error('Failed to load trips:', err);
                setTrips([]);
            });
    };

    useEffect(() => {
        loadTrips();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // A trip is "completed" if isCompleted=true, OR endDate is past (and not deleted)
    const isEffectivelyCompleted = (trip: Trip) => {
        if (trip.deletedAt) return false;
        if (trip.isCompleted) return true;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(trip.endDate) < today;
    };

    const completedTrips = useMemo(
        () => trips.filter(isEffectivelyCompleted),
        [trips]
    );
    const deletedTrips = useMemo(
        () => trips.filter(tr => !!tr.deletedAt),
        [trips]
    );

    const visibleTrips = tab === 'completed' ? completedTrips : deletedTrips;

    const handleReopen = async (id: string) => {
        if (!confirm(t('trip.actions.confirmReopen'))) return;
        setBusyId(id);
        try {
            await api.patch(`/trips/${id}/uncomplete`, {});
            loadTrips();
        } finally {
            setBusyId(null);
        }
    };

    const handleRestore = async (id: string) => {
        if (!confirm(t('trip.actions.confirmRestore'))) return;
        setBusyId(id);
        try {
            await api.patch(`/trips/${id}/restore`, {});
            loadTrips();
        } finally {
            setBusyId(null);
        }
    };

    const handlePermanentDelete = async (id: string) => {
        if (!confirm(t('trip.actions.confirmPermanent'))) return;
        setBusyId(id);
        try {
            await api.delete(`/trips/${id}/permanent`);
            loadTrips();
        } finally {
            setBusyId(null);
        }
    };

    if (!user) return <p className="p-4 text-brand-magenta">{t('common.loading')}</p>;

    const tabs: { key: ArchiveTab; labelKey: string; emoji: string; count: number }[] = [
        { key: 'completed', labelKey: 'filter.completed', emoji: '✅', count: completedTrips.length },
        { key: 'deleted', labelKey: 'filter.deleted', emoji: '🗑️', count: deletedTrips.length },
    ];

    return (
        <div className="min-h-screen bg-transparent pt-24 pb-20 px-4 animate-fadeIn">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 dark:text-white drop-shadow-sm tracking-tight flex items-center gap-2">
                            🗄️ <span>{t('nav.archive')}</span>
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t('archive.subtitle')}
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="text-sm font-bold text-brand-cyan hover:text-brand-magenta transition-colors"
                    >
                        ← {t('nav.dashboard')}
                    </Link>
                </div>

                {/* Sub-Tabs */}
                <div className="mb-6 overflow-x-auto pb-1">
                    <div className="inline-flex bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-sm border border-gray-100 flex-nowrap whitespace-nowrap">
                        {tabs.map(tb => (
                            <button
                                key={tb.key}
                                onClick={() => setTab(tb.key)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${tab === tb.key
                                    ? 'bg-brand-magenta text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <span>{tb.emoji}</span>
                                <span>{t(`${tb.labelKey}` as any) || tb.labelKey}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${tab === tb.key ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {tb.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Trip Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {visibleTrips.length === 0 ? (
                        <div className="col-span-full text-center py-20">
                            <p className="text-gray-400 text-lg font-medium">
                                {t('filter.empty')}
                            </p>
                        </div>
                    ) : (
                        visibleTrips.map(tr => {
                            const isDeleted = !!tr.deletedAt;
                            const badgeLabel = isDeleted ? t('trip.status.deleted') : t('trip.status.completed');
                            const badgeColor = isDeleted ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500';
                            return (
                                <div
                                    key={tr.id}
                                    className={`group relative glass-card p-5 hover:shadow-lg transition-all hover:-translate-y-1 ${isDeleted ? 'opacity-70 grayscale' : ''} flex flex-col`}
                                >
                                    <div className="absolute top-4 right-4 z-10">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${badgeColor}`}>
                                            {badgeLabel}
                                        </span>
                                    </div>

                                    <Link href={`/trip/${tr.id}`} className="block mb-3">
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 line-clamp-1 mb-1 hover:text-brand-magenta transition-colors">
                                            {tr.title}
                                        </h3>
                                        <p className="text-brand-magenta font-medium text-sm flex items-center gap-1">
                                            📍 {tr.destination}
                                        </p>
                                    </Link>

                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">
                                        <span>{new Date(tr.startDate).toLocaleDateString()}</span>
                                        <span className="mx-2">—</span>
                                        <span>{new Date(tr.endDate).toLocaleDateString()}</span>
                                    </div>

                                    {/* Action buttons (admin only) */}
                                    {user.role === 'admin' && (
                                        <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            {tab === 'completed' && (
                                                <button
                                                    disabled={busyId === tr.id}
                                                    onClick={() => handleReopen(tr.id)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan hover:text-white transition-colors disabled:opacity-50"
                                                >
                                                    🔄 {t('trip.actions.reopen')}
                                                </button>
                                            )}
                                            {tab === 'deleted' && (
                                                <>
                                                    <button
                                                        disabled={busyId === tr.id}
                                                        onClick={() => handleRestore(tr.id)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-600 hover:bg-green-500 hover:text-white transition-colors disabled:opacity-50"
                                                    >
                                                        ♻️ {t('trip.actions.restore')}
                                                    </button>
                                                    <button
                                                        disabled={busyId === tr.id}
                                                        onClick={() => handlePermanentDelete(tr.id)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                                    >
                                                        🗑️ {t('trip.actions.permanentDelete')}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
