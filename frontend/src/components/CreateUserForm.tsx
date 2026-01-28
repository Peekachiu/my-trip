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
        <form onSubmit={handleSubmit} className="mt-4 rounded-md border p-4 bg-gray-50">
            <h3 className="mb-2 font-bold">Create New User</h3>
            <div className="space-y-2">
                <input
                    className="w-full rounded border p-2"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                />
                <input
                    className="w-full rounded border p-2"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
                <select
                    className="w-full rounded border p-2 bg-white"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button className="w-full rounded bg-green-600 p-2 text-white hover:bg-green-700">
                    Create User
                </button>
            </div>
        </form>
    );
}
