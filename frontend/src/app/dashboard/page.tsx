'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/language';
import { useCurrency } from '@/lib/currency';
import Link from 'next/link';
import CurrencyWidget from '@/components/CurrencyWidget';
import CreateUserForm from '@/components/CreateUserForm';
import CreateTripForm from '@/components/CreateTripForm';
import HeroBanner from '@/components/home/HeroBanner';
import TrendingDestinations from '@/components/home/TrendingDestinations';
import TravelStats from '@/components/home/TravelStats';
import NextTripCountdown from '@/components/home/NextTripCountdown';

type Trip = {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    isCompleted?: boolean;
    deletedAt?: string | null;
};

type AdminTrip = {
    id: string;
    title: string;
    destination: string;
    budget: number;
    baseCurrency: string;
};

type AdminUser = { id: string; username: string; role: string };

type FilterKey = 'all' | 'upcoming' | 'ongoing' | 'completed' | 'deleted';

export default function UserDashboard() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { format } = useCurrency();

    // ===== Personal trips (every user) =====
    const [trips, setTrips] = useState<Trip[]>([]);
    const [filter, setFilter] = useState<FilterKey>('all');

    // ===== Admin-only state =====
    const isAdmin = user?.role === 'admin';
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [adminTrips, setAdminTrips] = useState<AdminTrip[]>([]);
    const [showAdminPanel, setShowAdminPanel] = useState(true);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showCreateTrip, setShowCreateTrip] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [userTrips, setUserTrips] = useState<AdminTrip[]>([]);

    useEffect(() => {
        if (user) {
            // Dashboard hides soft-deleted trips; they live in /archive
            api.get(`/trips/user/${user.id}`)
                .then(data => setTrips(Array.isArray(data) ? data : []))
                .catch(err => {
                    console.error('Failed to load trips:', err);
                    setTrips([]);
                });
        }
    }, [user]);

    const refreshAdminData = () => {
        api.get('/users').then(setAdminUsers).catch(() => setAdminUsers([]));
        api.get('/trips').then(setAdminTrips).catch(() => setAdminTrips([]));
    };

    useEffect(() => {
        if (isAdmin) refreshAdminData();
    }, [isAdmin]);

    const handleAdminUserClick = async (u: AdminUser) => {
        setSelectedUser(u);
        try {
            const res = await api.get(`/trips/user/${u.id}`);
            setUserTrips(Array.isArray(res) ? res : []);
        } catch (e) {
            console.error(e);
            setUserTrips([]);
        }
    };

    // Effective status takes is_completed and deleted_at into account
    const getEffectiveStatus = (trip: Trip): FilterKey => {
        if (trip.deletedAt) return 'deleted';
        if (trip.isCompleted) return 'completed';
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        if (now > endDate) return 'completed';
        if (now >= startDate && now <= endDate) return 'ongoing';
        return 'upcoming';
    };

    const getStatusBadge = (trip: Trip) => {
        const status = getEffectiveStatus(trip);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        switch (status) {
            case 'deleted':
                return { label: t('trip.status.deleted'), color: 'bg-red-100 text-red-500', isUpcoming: false };
            case 'completed':
                return { label: t('trip.status.completed'), color: 'bg-gray-100 text-gray-500', isUpcoming: false };
            case 'ongoing':
                return { label: t('trip.status.ongoing'), color: 'bg-green-100 text-green-600', isUpcoming: false };
            case 'upcoming':
            default: {
                const startDate = new Date(trip.startDate);
                const diffTime = Math.abs(startDate.getTime() - now.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return {
                    label: t('trip.status.upcoming'),
                    color: 'bg-brand-cyan/10 text-brand-cyan',
                    isUpcoming: true,
                    daysLeft: diffDays === 0 ? t('trip.status.today') : `${diffDays} ${t('trip.status.daysLeft')}`
                };
            }
        }
    };

    // Counts per filter for tab badges (deleted ones already filtered server-side)
    const counts = useMemo(() => {
        const c: Record<FilterKey, number> = { all: 0, upcoming: 0, ongoing: 0, completed: 0, deleted: 0 };
        trips.forEach(tr => {
            const s = getEffectiveStatus(tr);
            c[s]++;
            if (s !== 'deleted') c.all++;
        });
        return c;
    }, [trips]);

    const visibleTrips = useMemo(() => {
        if (filter === 'all') {
            return trips.filter(tr => getEffectiveStatus(tr) !== 'deleted');
        }
        return trips.filter(tr => getEffectiveStatus(tr) === filter);
    }, [trips, filter]);

    if (!user) return <p className="p-4 text-brand-magenta">{t('common.loading')}</p>;

    const filterTabs: { key: FilterKey; labelKey: string; emoji: string }[] = [
        { key: 'all', labelKey: 'filter.all', emoji: '🌐' },
        { key: 'upcoming', labelKey: 'filter.upcoming', emoji: '⏳' },
        { key: 'ongoing', labelKey: 'filter.ongoing', emoji: '✈️' },
        { key: 'completed', labelKey: 'filter.completed', emoji: '✅' },
    ];

    return (
        <div className="min-h-screen bg-transparent pt-24 pb-20 px-4 animate-fadeIn">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

                {/* Main Content */}
                <div className="flex-1">
                    {/* ====== USER-ONLY HOME EXPERIENCE ====== */}
                    {!isAdmin && (
                        <>
                            <HeroBanner />
                            <NextTripCountdown trips={trips} />
                            <TravelStats trips={trips} />
                            <TrendingDestinations />
                        </>
                    )}

                    <div id="my-trips" className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-black text-gray-800 dark:text-white drop-shadow-sm tracking-tight">{t('dashboard.myTrips')}</h1>
                        <Link href="/archive" className="text-sm font-bold text-gray-400 hover:text-brand-magenta transition-colors">
                            🗑️ {t('archive.title')} →
                        </Link>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="mb-6 overflow-x-auto pb-1">
                        <div className="inline-flex bg-white/70 backdrop-blur-sm rounded-full p-1 shadow-sm border border-gray-100 flex-nowrap whitespace-nowrap">
                            {filterTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${filter === tab.key
                                        ? 'bg-brand-magenta text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    <span>{tab.emoji}</span>
                                    <span>{t(`${tab.labelKey}` as any) || tab.labelKey}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${filter === tab.key ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {counts[tab.key]}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                        {visibleTrips.length === 0 ? (
                            <div className="col-span-full text-center py-20">
                                <p className="text-gray-400 text-lg font-medium">
                                    {filter === 'all' && !isAdmin
                                        ? t('dashboard.noTrips')
                                        : t('filter.empty')}
                                </p>
                            </div>
                        ) : (
                            visibleTrips.map(tr => {
                                const status = getStatusBadge(tr);
                                const isDeleted = !!tr.deletedAt;
                                return (
                                    <Link key={tr.id} href={`/trip/${tr.id}`}>
                                        <div className={`group relative glass-card p-5 hover:shadow-lg transition-all hover:-translate-y-1 hover:border-brand-cyan/40 h-48 flex flex-col justify-between ${isDeleted ? 'opacity-60 grayscale' : ''}`}>
                                            <div className="absolute top-4 right-4 z-10">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 line-clamp-1 mb-1">{tr.title}</h3>
                                                <p className="text-brand-magenta font-medium text-sm flex items-center gap-1">
                                                    📍 {tr.destination}
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
                                                    <span>{new Date(tr.startDate).toLocaleDateString()}</span>
                                                    <span className="mx-2">—</span>
                                                    <span>{new Date(tr.endDate).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })
                        )}
                    </div>

                    {/* ====== ADMIN PANEL (visible only to admins) ====== */}
                    {isAdmin && (
                        <div className="mt-12 pt-8 border-t-2 border-dashed border-brand-magenta/20">
                            <button
                                onClick={() => setShowAdminPanel(!showAdminPanel)}
                                className="w-full flex justify-between items-center mb-4 group"
                            >
                                <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight flex items-center gap-2">
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-brand-magenta text-white uppercase tracking-wider">Admin</span>
                                    {t('dashboard.adminPanel')}
                                </h2>
                                <span className={`text-brand-magenta text-2xl transition-transform ${showAdminPanel ? 'rotate-180' : ''}`}>⌄</span>
                            </button>

                            {showAdminPanel && (
                                <div className="space-y-8 animate-fadeIn">
                                    {/* Users section */}
                                    <section>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.users')}</h3>
                                            <button
                                                onClick={() => setShowCreateUser(!showCreateUser)}
                                                className="text-sm bg-brand-cyan text-white font-bold px-4 py-1 rounded-full shadow hover:bg-brand-cyan/80 transition-colors"
                                            >
                                                {showCreateUser ? t('common.cancel') : `+ ${t('dashboard.createUser')}`}
                                            </button>
                                        </div>
                                        {showCreateUser && (
                                            <CreateUserForm onSuccess={() => { setShowCreateUser(false); refreshAdminData(); }} />
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                            {adminUsers.map(u => (
                                                <div
                                                    key={u.id}
                                                    onClick={() => handleAdminUserClick(u)}
                                                    className="glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
                                                >
                                                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform bg-gradient-to-br from-brand-cyan to-brand-magenta">
                                                        {u.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{u.username}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-brand-magenta font-bold uppercase tracking-wider bg-brand-light-magenta/20 px-2 py-0.5 rounded-full">
                                                                {t(`roles.${u.role}` as any)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-gray-400 dark:text-gray-500 group-hover:text-brand-magenta transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* All trips section */}
                                    <section>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.allTrips')}</h3>
                                            <button
                                                onClick={() => setShowCreateTrip(!showCreateTrip)}
                                                className="text-sm bg-brand-magenta text-white font-bold px-4 py-1 rounded-full shadow hover:bg-brand-magenta/80 transition-colors"
                                            >
                                                {showCreateTrip ? t('common.cancel') : `+ ${t('dashboard.createTrip')}`}
                                            </button>
                                        </div>
                                        {showCreateTrip && (
                                            <CreateTripForm onSuccess={() => { setShowCreateTrip(false); refreshAdminData(); }} />
                                        )}

                                        <div className="grid gap-4 mt-4">
                                            {adminTrips.map(tr => (
                                                <Link key={tr.id} href={`/trip/${tr.id}`}>
                                                    <div className="glass-card p-4 hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer">
                                                        <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{tr.title}</p>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-brand-magenta font-medium">{tr.destination}</span>
                                                            <span className="text-brand-cyan font-bold bg-brand-light-cyan/50 px-2 py-1 rounded-md">
                                                                {format(tr.budget, tr.baseCurrency || 'MYR')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Widget Area */}
                <div className="w-full lg:w-80 shrink-0 space-y-6">
                    <CurrencyWidget />

                    <div className="glass-card p-6 border-brand-pink/20 bg-gradient-to-br from-brand-pink/5 to-transparent">
                        <h3 className="text-brand-pink text-sm font-bold uppercase tracking-wider mb-2">🚀 {t('nav.settings') || 'Quick Access'}</h3>
                        <Link href="/settings" className="block p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors text-sm font-bold text-gray-700 mb-2">
                            ⚙️ {t('nav.settings') || 'Settings'}
                        </Link>
                        <Link href="/archive" className="block p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors text-sm font-bold text-gray-700">
                            🗑️ {t('archive.title')}
                        </Link>
                    </div>
                </div>

            </div>

            {/* ====== Admin user-detail modal ====== */}
            {isAdmin && selectedUser && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
                    <div className="glass-card bg-white/90 dark:bg-gray-900/95 p-6 w-full max-w-md m-4 relative shadow-2xl dark:border-gray-700" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-bold">✕</button>
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-magenta to-brand-cyan mb-1">{selectedUser.username}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider font-bold">{t(`roles.${selectedUser.role}` as any)}</p>
                        <div className="text-xs text-gray-400 mb-4">ID: {selectedUser.id}</div>

                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">{t('dashboard.assignedTrips')}</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                            {userTrips.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.noAssignedTrips')}</p>
                            ) : (
                                userTrips.map(tr => (
                                    <div key={tr.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{tr.title}</p>
                                                <p className="text-xs text-brand-magenta">{tr.destination}</p>
                                            </div>
                                            <span className="text-xs font-bold text-brand-cyan">{format(tr.budget, tr.baseCurrency || 'MYR')}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedUser.id !== user?.id && (
                            <button
                                onClick={async () => {
                                    if (confirm(t('dashboard.deleteUserConfirm'))) {
                                        await api.delete(`/users/${selectedUser.id}`);
                                        setSelectedUser(null);
                                        refreshAdminData();
                                    }
                                }}
                                className="w-full rounded-md bg-red-50 text-red-600 border border-red-200 p-2 font-bold hover:bg-red-100 transition-colors text-sm"
                            >
                                {t('dashboard.deleteUser')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
