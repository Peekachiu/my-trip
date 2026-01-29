'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function Header() {
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 hover:bg-white/20 p-2 rounded-full transition-all"
                    >
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-sm font-bold text-gray-700">{user.username}</span>
                            <span className="text-[10px] uppercase font-bold text-brand-magenta tracking-wider bg-brand-pink/10 px-1.5 rounded-full">
                                {user.role}
                            </span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-cyan to-brand-light-cyan border-2 border-white shadow-sm flex items-center justify-center text-brand-magenta font-bold text-lg">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/50 overflow-hidden animate-fadeIn z-[101]">
                            <div className="p-2 space-y-1">
                                <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-brand-cyan/10 hover:text-brand-cyan rounded-lg transition-colors flex items-center gap-2">
                                    🔔 Notification
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-brand-cyan/10 hover:text-brand-cyan rounded-lg transition-colors flex items-center gap-2">
                                    ⚙️ Settings
                                </button>
                            </div>
                            <div className="border-t border-gray-100 p-2">
                                <button
                                    onClick={logout}
                                    className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
