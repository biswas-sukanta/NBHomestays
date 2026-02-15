'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface User {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface DecodedToken {
    sub: string;
    role: string;
    // other fields if needed
}

interface AuthContextType {
    user: User | null;
    login: (token: string, refreshToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token);
                // We might not have full user details from token, but we have role
                // ideally we fetch /me, but for now let's set what we can
                setUser({
                    firstName: '', // fetch or decoded?
                    lastName: '',
                    email: decoded.sub,
                    role: decoded.role
                });
                setIsAuthenticated(true);
            } catch (e) {
                console.error("Invalid token", e);
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, refreshToken: string) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        const decoded = jwtDecode<DecodedToken>(token);
        setUser({
            firstName: '',
            lastName: '',
            email: decoded.sub,
            role: decoded.role
        });
        setIsAuthenticated(true);
        router.refresh();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsAuthenticated(false);
        router.push('/login');
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated,
            isLoading
        }}>
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
