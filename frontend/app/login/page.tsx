'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/auth/authenticate', { email, password });
            login(res.data.accessToken, res.data.refreshToken);
            window.location.href = '/'; // Force full reload to ensure state is clear or use router.push if available
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Input
                            type="email"
                            name="email"
                            required
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={error && error.toLowerCase().includes('email') ? error : undefined}
                        />
                        <Input
                            type="password"
                            name="password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={error && (error.toLowerCase().includes('password') || error.toLowerCase().includes('credentials')) ? error : undefined}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Sign in
                        </button>
                    </div>
                    <div className="text-center text-sm">
                        <Link href="/register" className="font-medium text-green-600 hover:text-green-500">
                            Don't have an account? Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
