'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');

    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/users', { username, email, password, role });
            if (res.error) {
                setError(res.error);
                return;
            }
            setUsername('');
            setEmail('');
            setPassword('');
            setRole('user');
            onSuccess();
        } catch (err) {
            console.error(err);
            setError('Failed to create user. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 glass-card bg-white/80 p-6 shadow-xl">
            <h3 className="mb-4 font-bold text-gray-800 border-b border-gray-100/50 pb-2">Create New User</h3>
            {error && <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}
            <div className="space-y-4">
                <input
                    className="w-full rounded-md border border-gray-200 p-2 focus:border-brand-cyan focus:ring-brand-cyan text-gray-900 placeholder-gray-500"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                <input
                    className="w-full rounded-md border border-gray-200 p-2 focus:border-brand-cyan focus:ring-brand-cyan text-gray-900 placeholder-gray-500"
                    placeholder="Email (Optional)"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <input
                    className="w-full rounded-md border border-gray-200 p-2 focus:border-brand-cyan focus:ring-brand-cyan text-gray-900 placeholder-gray-500"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <select
                    className="w-full rounded-md border border-gray-200 p-2 bg-white focus:border-brand-cyan focus:ring-brand-cyan text-gray-900"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button className="w-full rounded-md bg-gradient-to-r from-brand-cyan to-brand-magenta p-2 text-white font-bold hover:opacity-90 transition-opacity">
                    Create User
                </button>
            </div>
        </form>
    );
}
