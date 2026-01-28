'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

type Trip = { id: string; title: string; destination: string; startDate: string; endDate: string; };

export default function UserDashboard() {
    const { user } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);

    useEffect(() => {
        if (user) {
            api.get(`/trips/user/${user.id}`).then(setTrips);
        }
    }, [user]);

    if (!user) return <p className="p-4 text-brand-magenta">Loading...</p>;

    return (
        <div className="p-4 min-h-screen bg-gradient-to-br from-white to-brand-light-cyan/20">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-magenta">
                    My Trips
                </h1>
                <div className="h-8 w-8 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan font-bold border border-brand-cyan">
                    {user.username.charAt(0).toUpperCase()}
                </div>
            </div>

            <div className="grid gap-4">
                {trips.length === 0 ? (
                    <div className="text-center p-8 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No trips assigned yet.</p>
                        <p className="text-sm text-brand-magenta mt-1">Contact your admin to get started!</p>
                    </div>
                ) : (
                    trips.map(t => (
                        <Link key={t.id} href={`/trip/${t.id}`}>
                            <div className="group relative rounded-xl border border-brand-cyan/10 bg-white/60 backdrop-blur-sm p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 hover:bg-white/80 hover:border-brand-cyan/40">
                                <div className="absolute top-0 right-0 h-full w-2 rounded-r-xl bg-gradient-to-b from-brand-cyan to-brand-magenta opacity-0 transition-opacity group-hover:opacity-100" />
                                <h3 className="text-xl font-bold text-gray-800">{t.title}</h3>
                                <p className="text-brand-magenta font-medium">{t.destination}</p>
                                <div className="mt-3 flex items-center text-sm text-gray-500">
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs uppercase tracking-wide">
                                        {t.startDate} - {t.endDate}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
