'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from './api';

type User = {
    id: string;
    username: string;
    role: 'admin' | 'user';
};

type AuthContextType = {
    user: User | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem('trip_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (username: string, password: string) => {
        try {
            const res = await api.post('/users/login', { username, password });
            if (res.id) {
                setUser(res);
                localStorage.setItem('trip_user', JSON.stringify(res));
                // Redirect based on role
                if (res.role === 'admin') router.push('/admin');
                else router.push('/dashboard');
                return true;
            }
        } catch (e) {
            console.error(e);
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('trip_user');
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
