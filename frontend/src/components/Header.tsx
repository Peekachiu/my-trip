'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="fixed top-0 left-0 w-full z-[100] glass !bg-white/80 px-6 py-3 flex justify-between items-center transition-all duration-300">
            <Link href={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-magenta flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:rotate-12 transition-transform">
                    P
                </div>
                <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-magenta to-brand-cyan">
                    peeKaTrip
                </span>
            </Link>

            {user && (
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-sm font-bold text-gray-700">{user.username}</span>
                        <span className="text-[10px] uppercase font-bold text-brand-magenta tracking-wider bg-brand-pink/10 px-1.5 rounded-full">
                            {user.role}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        className="text-sm font-bold text-gray-500 hover:text-brand-magenta transition-colors bg-white/50 px-3 py-1.5 rounded-full border border-white/50 hover:bg-white hover:shadow-sm"
                    >
                        Logout
                    </button>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-cyan to-brand-light-cyan border-2 border-white shadow-sm flex items-center justify-center text-brand-magenta font-bold">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}
        </header>
    );
}
