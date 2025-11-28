'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { apiFetch, AuthResponse } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface UserData {
    id: string;
    email: string;
    role: 'user' | 'admin';
}

interface AuthContextType {
    user: UserData | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuthFromToken = () => {
            const token = Cookies.get('healthify-admin-token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const parts = token.split('.');
                if (parts.length !== 3) {
                    logout();
                    setLoading(false);
                    return;
                }

                const payload = JSON.parse(atob(parts[1]));
                const role = payload.role as UserData['role'] | undefined;
                const id = payload.id as string | undefined;
                const email = payload.email as string | undefined;

                if (role === 'admin' && id && email) {
                    setUser({ id, email, role });
                } else {
                    logout();
                }
            } catch (error) {
                console.error('Failed to parse auth token:', error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        checkAuthFromToken();
    }, []);

    const login = async (email: string, password: string) => {
        const loginData = { email, password };
        try {
            const data = await apiFetch<AuthResponse>('/auth/login', 'POST', loginData);
            Cookies.set('healthify-admin-token', data.token, { expires: 7, secure: false }); // Store for 7 days
            setUser(data.user);
            router.push('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        Cookies.remove('healthify-admin-token');
        setUser(null);
        // Do not use router.push inside useEffect or lifecycle hook, 
        // rely on the layout check or manual push if needed.
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
