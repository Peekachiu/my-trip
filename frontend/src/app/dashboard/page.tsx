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

    if (!user) return <p>Loading...</p>;

    return (
        <div className="p-4">
            <h1 className="mb-4 text-2xl font-bold">My Trips</h1>
            <div className="grid gap-4">
                {trips.length === 0 ? (
                    <p>No trips assigned yet.</p>
                ) : (
                    trips.map(t => (
                        <Link key={t.id} href={`/trip/${t.id}`}>
                            <div className="rounded-lg border bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
                                <h3 className="text-xl font-semibold">{t.title}</h3>
                                <p className="text-gray-600">{t.destination}</p>
                                <div className="mt-2 text-sm text-gray-400">
                                    {t.startDate} - {t.endDate}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
