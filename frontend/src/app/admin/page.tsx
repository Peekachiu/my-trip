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
        <div className="p-4 bg-gradient-to-br from-gray-50 to-brand-light-cyan/30 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-magenta to-brand-cyan">Admin Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 font-medium hidden sm:inline">Logged in as {user.username}</span>
                    <button onClick={() => { useAuth().logout(); }} className="text-sm text-brand-magenta hover:underline font-bold">
                        Logout
                    </button>
                </div>
            </div>

            <section className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-800">Users</h2>
                    <button onClick={() => setShowCreateUser(!showCreateUser)} className="text-sm bg-brand-cyan text-white font-bold px-4 py-1 rounded-full shadow hover:bg-brand-cyan/80 transition-colors">
                        {showCreateUser ? 'Cancel' : '+ Create User'}
                    </button>
                </div>
                {showCreateUser && <CreateUserForm onSuccess={() => { setShowCreateUser(false); refreshData(); }} />}

                <div className="grid gap-4 mt-4">
                    {users.map(u => (
                        <div key={u.id} className="rounded-xl border border-brand-cyan/20 p-4 shadow-sm bg-white/80 backdrop-blur flex justify-between items-center hover:shadow-md transition-shadow">
                            <div>
                                <p className="font-bold text-gray-800">{u.username}</p>
                                <p className="text-sm text-brand-magenta font-medium uppercase tracking-wider">{u.role}</p>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-100 p-1 rounded-md">{u.id.substring(0, 4)}...</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="pb-20">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-800">All Trips</h2>
                    <button onClick={() => setShowCreateTrip(!showCreateTrip)} className="text-sm bg-brand-magenta text-white font-bold px-4 py-1 rounded-full shadow hover:bg-brand-magenta/80 transition-colors">
                        {showCreateTrip ? 'Cancel' : '+ Create Trip'}
                    </button>
                </div>
                {showCreateTrip && <CreateTripForm onSuccess={() => { setShowCreateTrip(false); refreshData(); }} />}

                <div className="grid gap-4 mt-4">
                    {trips.map(t => (
                        <div key={t.id} className="rounded-xl border border-brand-pink/30 p-4 shadow-sm bg-white/90 backdrop-blur hover:shadow-lg transition-all">
                            <p className="font-bold text-lg text-gray-800">{t.title}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-brand-magenta font-medium">{t.destination}</span>
                                <span className="text-brand-cyan font-bold bg-brand-light-cyan/50 px-2 py-1 rounded-md">${t.budget}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
