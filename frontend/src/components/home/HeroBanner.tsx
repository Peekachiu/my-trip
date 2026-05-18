'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language';
import Link from 'next/link';

type Slide = {
    titleKey: string;
    subtitleKey: string;
    /**
     * Path under /public for the optional banner image.
     * If the file is missing the gradient fallback is shown.
     */
    image: string;
    /** CSS gradient used when image is not yet provided. */
    gradient: string;
};

const SLIDES: Slide[] = [
    {
        titleKey: 'home.heroTitle1',
        subtitleKey: 'home.heroSubtitle1',
        image: '/banners/banner-1.jpg',
        gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c471ed 50%, #12c2e9 100%)',
    },
    {
        titleKey: 'home.heroTitle2',
        subtitleKey: 'home.heroSubtitle2',
        image: '/banners/banner-2.jpg',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffa07a 100%)',
    },
    {
        titleKey: 'home.heroTitle3',
        subtitleKey: 'home.heroSubtitle3',
        image: '/banners/banner-3.jpg',
        gradient: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
    },
];

export default function HeroBanner() {
    const { t } = useLanguage();
    const [index, setIndex] = useState(0);
    // Tracks which slide images successfully loaded so we keep a graceful gradient fallback.
    const [imgOk, setImgOk] = useState<boolean[]>(() => SLIDES.map(() => false));

    useEffect(() => {
        const id = setInterval(() => {
            setIndex(i => (i + 1) % SLIDES.length);
        }, 6000);
        return () => clearInterval(id);
    }, []);

    // Pre-load images and remember which ones actually exist.
    useEffect(() => {
        SLIDES.forEach((s, i) => {
            const img = new Image();
            img.src = s.image;
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
        <div className="relative w-full h-[340px] md:h-[420px] rounded-3xl overflow-hidden shadow-xl mb-10 group">
            {SLIDES.map((slide, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{
                        background: imgOk[i]
                            ? `url(${slide.image}) center/cover no-repeat`
                            : slide.gradient,
                    }}
                >
                    {/* Dark overlay for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* Content */}
                    <div className="relative h-full flex flex-col justify-end p-6 md:p-12 text-white">
                        <h2 className="text-3xl md:text-5xl font-black drop-shadow-lg max-w-2xl leading-tight">
                            {t(slide.titleKey as any)}
                        </h2>
                        <p className="mt-2 md:mt-3 text-base md:text-lg font-medium opacity-90 max-w-xl">
                            {t(slide.subtitleKey as any)}
                        </p>
                        <div className="mt-4 md:mt-6">
                            <Link
                                href="#my-trips"
                                className="inline-block bg-white text-brand-magenta font-bold px-6 py-3 rounded-full shadow-lg hover:bg-brand-magenta hover:text-white transition-all hover:scale-105"
                            >
                                {t('home.heroCta' as any)} →
                            </Link>
                        </div>
                    </div>
                </div>
            ))}

            {/* Navigation dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                            }`}
                    />
                ))}
            </div>

            {/* Prev / Next arrows (visible on hover for desktop) */}
            <button
                onClick={() => setIndex(i => (i - 1 + SLIDES.length) % SLIDES.length)}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-white/40"
            >
                ‹
            </button>
            <button
                onClick={() => setIndex(i => (i + 1) % SLIDES.length)}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-white/40"
            >
                ›
            </button>
        </div>
    );
}
