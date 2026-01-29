'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import CreateUserForm from '@/components/CreateUserForm';
import CreateTripForm from '@/components/CreateTripForm';

type User = { id: string; username: string; role: string };
type Trip = { id: string; title: string; destination: string; budget: number; };

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showCreateTrip, setShowCreateTrip] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userTrips, setUserTrips] = useState<Trip[]>([]);

    const refreshData = () => {
        api.get('/users').then(setUsers);
        api.get('/trips').then(setTrips);
    };

    const handleUserClick = async (u: User) => {
        setSelectedUser(u);
        try {
            const res = await api.get(`/trips/user/${u.id}`);
            setUserTrips(res);
        } catch (e) {
            console.error(e);
            setUserTrips([]);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    if (!user || user.role !== 'admin') return <p>Access Denied</p>;

    return (
        <div className="p-4 min-h-screen">
            <section className="mb-8 mt-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-800">Users</h2>
                    <button onClick={() => setShowCreateUser(!showCreateUser)} className="text-sm bg-brand-cyan text-white font-bold px-4 py-1 rounded-full shadow hover:bg-brand-cyan/80 transition-colors">
                        {showCreateUser ? 'Cancel' : '+ Create User'}
                    </button>
                </div>
                {showCreateUser && <CreateUserForm onSuccess={() => { setShowCreateUser(false); refreshData(); }} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {users.map(u => (
                        <div key={u.id} onClick={() => handleUserClick(u)} className="glass-card p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-800 text-lg">{u.username}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-brand-magenta font-bold uppercase tracking-wider bg-brand-light-magenta/20 px-2 py-0.5 rounded-full">{u.role}</span>
                                </div>
                            </div>
                            <div className="text-gray-400 group-hover:text-brand-magenta transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
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
                        <Link key={t.id} href={`/trip/${t.id}`}>
                            <div className="glass-card p-4 hover:shadow-lg transition-all hover:scale-[1.01] cursor-pointer">
                                <p className="font-bold text-lg text-gray-800">{t.title}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-brand-magenta font-medium">{t.destination}</span>
                                    <span className="text-brand-cyan font-bold bg-brand-light-cyan/50 px-2 py-1 rounded-md">${t.budget}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
            {selectedUser && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
                    <div className="glass-card bg-white/90 p-6 w-full max-w-md m-4 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 font-bold">✕</button>
                        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-magenta to-brand-cyan mb-1">{selectedUser.username}</h3>
                        <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider font-bold">{selectedUser.role}</p>
                        <div className="text-xs text-gray-400 mb-4">ID: {selectedUser.id}</div>

                        <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-200 pb-1">Assigned Trips</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                            {userTrips.length === 0 ? (
                                <p className="text-gray-500 text-sm">No trips assigned.</p>
                            ) : (
                                userTrips.map(t => (
                                    <div key={t.id} className="border border-gray-100 rounded-lg p-3 bg-white/50 hover:bg-white transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{t.title}</p>
                                                <p className="text-xs text-brand-magenta">{t.destination}</p>
                                            </div>
                                            <span className="text-xs font-bold text-brand-cyan">${t.budget}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedUser.id !== user?.id && (
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                        await api.delete(`/users/${selectedUser.id}`);
                                        setSelectedUser(null);
                                        refreshData();
                                    }
                                }}
                                className="w-full rounded-md bg-red-50 text-red-600 border border-red-200 p-2 font-bold hover:bg-red-100 transition-colors text-sm"
                            >
                                Delete User
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
