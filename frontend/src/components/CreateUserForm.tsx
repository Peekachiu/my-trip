'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.post('/users', { username, password, role });
        setUsername('');
        setPassword('');
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-brand-cyan/20 p-6 bg-white/80 backdrop-blur shadow-lg">
            <h3 className="mb-4 font-bold text-gray-800 border-b border-gray-100 pb-2">Create New User</h3>
            <div className="space-y-4">
                <input
                    className="w-full rounded-md border border-gray-200 p-2 focus:border-brand-cyan focus:ring-brand-cyan text-gray-900 placeholder-gray-500"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
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
