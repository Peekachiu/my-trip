'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language';

type Destination = {
    /** Display name */
    name: string;
    /** Country emoji-flag for fun */
    flag: string;
    /** Optional image path under /public */
    image: string;
    /** Gradient fallback when image is missing */
    gradient: string;
    /** Short tagline */
    tag: string;
};

const DESTINATIONS: Destination[] = [
    {
        name: 'Bali',
        flag: '🇮🇩',
        image: '/destinations/bali.jpg',
        gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        tag: 'Tropical Paradise',
    },
    {
        name: 'Tokyo',
        flag: '🇯🇵',
        image: '/destinations/tokyo.jpg',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        tag: 'Neon Metropolis',
    },
    {
        name: 'Paris',
        flag: '🇫🇷',
        image: '/destinations/paris.jpg',
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        tag: 'City of Lights',
    },
    {
        name: 'Kyoto',
        flag: '🇯🇵',
        image: '/destinations/kyoto.jpg',
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        tag: 'Temples & Tea',
    },
    {
        name: 'Seoul',
        flag: '🇰🇷',
        image: '/destinations/seoul.jpg',
        gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        tag: 'K-Culture Hub',
    },
    {
        name: 'Singapore',
        flag: '🇸🇬',
        image: '/destinations/singapore.jpg',
        gradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
        tag: 'Garden City',
    },
];

export default function TrendingDestinations() {
    const { t } = useLanguage();
    const [imgOk, setImgOk] = useState<boolean[]>(() => DESTINATIONS.map(() => false));

    useEffect(() => {
        DESTINATIONS.forEach((d, i) => {
            const img = new Image();
            img.src = d.image;
            img.onload = () =>
                setImgOk(prev => {
                    if (prev[i]) return prev;
                    const next = [...prev];
                    next[i] = true;
                    return next;
                });
        });
    }, []);

    return (
        <section className="mb-10">
            <div className="flex items-end justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
                        🔥 {t('home.trendingTitle' as any)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {t('home.trendingSubtitle' as any)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {DESTINATIONS.map((d, i) => (
                    <div
                        key={d.name}
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md group cursor-default"
                        style={{
                            background: imgOk[i]
                                ? `url(${d.image}) center/cover no-repeat`
                                : d.gradient,
                        }}
                    >
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity group-hover:from-black/80" />

                        {/* Flag (top right) */}
                        <span className="absolute top-2 right-2 text-2xl drop-shadow-md">
                            {d.flag}
                        </span>

                        {/* Caption */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                            <p className="font-black text-base drop-shadow-md leading-tight">
                                {d.name}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider opacity-90 font-bold">
                                {d.tag}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
