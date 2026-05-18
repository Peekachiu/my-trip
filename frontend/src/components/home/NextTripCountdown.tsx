'use client';

import { useEffect, useMemo, useState } from 'react';
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

export default function NextTripCountdown({ trips }: { trips: Trip[] }) {
    const { t } = useLanguage();
    const [now, setNow] = useState<Date>(() => new Date());

    // Pick the closest upcoming trip
    const nextTrip = useMemo(() => {
        const upcoming = trips
            .filter(tr => getStatus(tr) === 'upcoming')
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        return upcoming[0] || null;
    }, [trips]);

    // Tick every second only when a countdown is active.
    useEffect(() => {
        if (!nextTrip) return;
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, [nextTrip]);

    if (!nextTrip) {
        return (
            <section className="mb-10">
                <div className="rounded-3xl p-8 text-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700">
                    <div className="text-5xl mb-3">🧭</div>
                    <p className="text-gray-600 dark:text-gray-300 font-bold text-lg">
                        {t('home.countdownNone' as any)}
                    </p>
                </div>
            </section>
        );
    }

    const target = new Date(nextTrip.startDate).getTime();
    const diff = Math.max(0, target - now.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const isToday = days === 0 && hours === 0 && minutes === 0;

    const cells = [
        { value: days, label: t('home.countdownDays' as any) },
        { value: hours, label: t('home.countdownHours' as any) },
        { value: minutes, label: t('home.countdownMinutes' as any) },
        { value: seconds, label: t('home.countdownSeconds' as any) },
    ];

    return (
        <section className="mb-10">
            <div
                className="relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-xl"
                style={{
                    background:
                        'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                }}
            >
                {/* Decorative orbs */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 left-10 w-32 h-32 rounded-full bg-white/10 blur-3xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] font-bold opacity-80 mb-1">
                            ⏳ {t('home.countdownTitle' as any)}
                        </p>
                        <Link href={`/trip/${nextTrip.id}`}>
                            <h3 className="text-2xl md:text-4xl font-black hover:underline">
                                {nextTrip.title}
                            </h3>
                        </Link>
                        <p className="opacity-90 mt-1 font-medium">📍 {nextTrip.destination}</p>
                        <p className="opacity-75 text-sm mt-0.5">
                            {new Date(nextTrip.startDate).toLocaleDateString()}
                        </p>
                    </div>

                    {isToday ? (
                        <div className="text-center md:text-right">
                            <div className="text-4xl md:text-5xl font-black animate-pulse">
                                🎉
                            </div>
                            <p className="font-black text-lg mt-1">
                                {t('home.countdownToday' as any)}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 md:gap-3">
                            {cells.map(cell => (
                                <div
                                    key={cell.label}
                                    className="bg-white/20 backdrop-blur-sm rounded-2xl px-2 py-3 md:px-4 md:py-4 min-w-[60px] md:min-w-[80px] text-center"
                                >
                                    <div className="text-2xl md:text-4xl font-black tabular-nums">
                                        {String(cell.value).padStart(2, '0')}
                                    </div>
                                    <div className="text-[9px] md:text-[10px] uppercase tracking-wider font-bold opacity-90 mt-1">
                                        {cell.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
