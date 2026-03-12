'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { 
    setAccessToken, 
    getAccessToken, 
    setRefreshToken, 
    clearTokens,
    hasTokens 
} from '@/lib/auth/tokenStore';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface DecodedToken {
    sub: string;
    role: string;
    userId: string;
    // other fields if needed
}

interface AuthContextType {
    user: User | null;
    login: (token: string, refreshToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setTokenState] = useState<string | null>(null);

    useEffect(() => {
        // Initialize from tokenStore (memory/sessionStorage)
        const storedToken = getAccessToken();
        if (storedToken) {
            try {
                const decoded = jwtDecode<DecodedToken>(storedToken);
                setUser({
                    id: decoded.userId || '',
                    firstName: '',
                    lastName: '',
                    email: decoded.sub,
                    role: decoded.role
                });
                setIsAuthenticated(true);
                setTokenState(storedToken);
            } catch (e) {
                console.error("Invalid token", e);
                clearTokens();
            }
        }
        setIsLoading(false);
    }, []);

    const login = (accessToken: string, refreshToken: string) => {
        // Store tokens using AI-safe storage
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
        
        const decoded = jwtDecode<DecodedToken>(accessToken);
        setUser({
            id: decoded.userId || '',
            firstName: '',
            lastName: '',
            email: decoded.sub,
            role: decoded.role
        });
        setIsAuthenticated(true);
        setTokenState(accessToken);
        router.refresh();
    };

    const logout = () => {
        clearTokens();
        setUser(null);
        setIsAuthenticated(false);
        setTokenState(null);
        router.push('/login');
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated,
            isLoading,
            token
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
