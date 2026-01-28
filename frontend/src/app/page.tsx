'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (!success) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white/80 backdrop-blur-md p-8 shadow-xl border border-white/50">
        <h1 className="mb-6 text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-magenta to-brand-cyan">
          Trip App Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-brand-cyan/30 p-2 shadow-sm focus:border-brand-magenta focus:ring-brand-magenta bg-white/50 text-gray-900 placeholder-gray-500"
              placeholder="admin or user1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-brand-cyan/30 p-2 shadow-sm focus:border-brand-magenta focus:ring-brand-magenta bg-white/50 text-gray-900 placeholder-gray-500"
              placeholder="password"
            />
          </div>
          {error && <p className="text-sm text-brand-magenta font-semibold">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-brand-cyan to-brand-magenta px-4 py-2 text-white font-bold shadow-lg hover:opacity-90 transition-all"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Demo Credentials:</p>
          <p>Admin: admin / password</p>
          <p>User: user1 / password</p>
        </div>
      </div>
    </div>
  );
}
