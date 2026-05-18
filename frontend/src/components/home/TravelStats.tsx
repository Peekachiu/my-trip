'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/lib/language';

type Trip = {
    id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    isCompleted?: boolean;
    deletedAt?: string | null;
};

/**
 * Best-effort country extraction from a destination string.
 * Handles common patterns like "Tokyo, Japan" / "Bali - Indonesia" / "Paris".
 * If we can't reliably split it we fall back to the whole string so users
 * with single-word destinations still get counted as one country.
 */
function extractCountry(dest: string): string {
    if (!dest) return '';
    const trimmed = dest.trim();
    // Try comma split first ("City, Country")
    if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
        return (parts[parts.length - 1] || trimmed).toLowerCase();
    }
    // Then dash / hyphen
    if (trimmed.includes(' - ')) {
        const parts = trimmed.split(' - ').map(p => p.trim()).filter(Boolean);
        return (parts[parts.length - 1] || trimmed).toLowerCase();
    }
    return trimmed.toLowerCase();
}

function getStatus(trip: Trip): 'upcoming' | 'ongoing' | 'completed' | 'deleted' {
    if (trip.deletedAt) return 'deleted';
    if (trip.isCompleted) return 'completed';
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (now > end) return 'completed';
    if (now >= start && now <= end) return 'ongoing';
    return 'upcoming';
}

export default function TravelStats({ trips }: { trips: Trip[] }) {
    const { t } = useLanguage();

    const stats = useMemo(() => {
        const active = trips.filter(tr => !tr.deletedAt);
        const completed = active.filter(tr => getStatus(tr) === 'completed');
        const upcoming = active.filter(tr => getStatus(tr) === 'upcoming');

        // Distinct countries from completed trips only
        const countrySet = new Set(
            completed
                .map(tr => extractCountry(tr.destination))
                .filter(Boolean)
        );

        return {
            countries: countrySet.size,
            total: active.length,
            completed: completed.length,
            upcoming: upcoming.length,
        };
    }, [trips]);

    const items = [
        {
            icon: '🌍',
            value: stats.countries,
            labelKey: 'home.statsCountries',
            gradient: 'from-emerald-400 to-teal-500',
        },
        {
            icon: '✈️',
            value: stats.total,
            labelKey: 'home.statsTotal',
            gradient: 'from-brand-cyan to-blue-500',
        },
        {
            icon: '✅',
            value: stats.completed,
            labelKey: 'home.statsCompleted',
            gradient: 'from-violet-500 to-fuchsia-500',
        },
        {
            icon: '📅',
            value: stats.upcoming,
            labelKey: 'home.statsUpcoming',
            gradient: 'from-brand-magenta to-pink-500',
        },
    ];

    return (
        <section className="mb-10">
            <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight mb-4">
                📊 {t('home.statsTitle' as any)}
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {items.map(item => (
                    <div
                        key={item.labelKey}
                        className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${item.gradient} shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}
                    >
                        {/* Decorative blob */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20 blur-2xl" />

                        <div className="relative">
                            <div className="text-3xl mb-1">{item.icon}</div>
                            <div className="text-4xl font-black tabular-nums">
                                {item.value}
                            </div>
                            <div className="text-xs font-bold uppercase tracking-wider opacity-90 mt-1">
                                {t(item.labelKey as any)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
