'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import CreateUserForm from '@/components/CreateUserForm';
import CreateTripForm from '@/components/CreateTripForm';

type User = { id: string; username: string; role: string };
type Trip = { id: string; title: string; destination: string; budget: number; };

export default function AdminDashboard() {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showCreateTrip, setShowCreateTrip] = useState(false);

    const refreshData = () => {
        api.get('/users').then(setUsers);
        api.get('/trips').then(setTrips);
    };

    useEffect(() => {
        refreshData();
    }, []);

    if (!user || user.role !== 'admin') return <p>Access Denied</p>;

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <span className="text-sm text-gray-500">Logged in as {user.username}</span>
            </div>

            <section className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold">Users</h2>
                    <button onClick={() => setShowCreateUser(!showCreateUser)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">
                        {showCreateUser ? 'Cancel' : 'Create User'}
                    </button>
                </div>
                {showCreateUser && <CreateUserForm onSuccess={() => { setShowCreateUser(false); refreshData(); }} />}

                <div className="grid gap-4 mt-4">
                    {users.map(u => (
                        <div key={u.id} className="rounded-md border p-4 shadow-sm bg-white flex justify-between">
                            <div>
                                <p className="font-medium">{u.username}</p>
                                <p className="text-sm text-gray-500">{u.role}</p>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 p-1 rounded h-fit">{u.id.substring(0, 4)}...</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="pb-20">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold">All Trips</h2>
                    <button onClick={() => setShowCreateTrip(!showCreateTrip)} className="text-sm bg-blue-600 text-white px-3 py-1 rounded">
                        {showCreateTrip ? 'Cancel' : 'Create Trip'}
                    </button>
                </div>
                {showCreateTrip && <CreateTripForm onSuccess={() => { setShowCreateTrip(false); refreshData(); }} />}

                <div className="grid gap-4 mt-4">
                    {trips.map(t => (
                        <div key={t.id} className="rounded-md border p-4 shadow-sm bg-white">
                            <p className="font-bold text-lg">{t.title}</p>
                            <p>{t.destination}</p>
                            <p className="text-gray-600">Budget: ${t.budget}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
