'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Mountain, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/authenticate', { email, password });
            login(res.data.accessToken, res.data.refreshToken);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#FDFCFB]">
            {/* Left Column: Cinematic Visual (Desktop Only) / Full Background (Mobile) */}
            <div className="relative w-full md:w-1/2 h-[40vh] md:h-screen overflow-hidden">
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    <img
                        src="/_static/images/login-hero.png"
                        alt="Himalayan Sunup"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 md:bg-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                </motion.div>

                {/* Branding Overlay */}
                <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center">
                        <Mountain className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white font-heading text-xl tracking-tight hidden md:block">NBHomestays</span>
                </div>

                {/* Poetic Subtext (Desktop) */}
                <div className="absolute bottom-12 left-12 z-10 max-w-sm hidden md:block">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-white text-4xl font-heading leading-tight mb-4"
                    >
                        Every trail has a story.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.8 }}
                        className="text-white/80 font-sans text-lg leading-relaxed"
                    >
                        Join our community of explorers discovering the hidden magic of the Himalayas.
                    </motion.p>
                </div>
            </div>

            {/* Right Column: Minimalist Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12 md:p-24 relative overflow-hidden">
                {/* Mobile Background Elements */}
                <div className="md:hidden absolute inset-0 -z-10 bg-[#FDFCFB]" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-md w-full"
                >
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-heading text-zinc-900 mb-3">Welcome Back</h2>
                        <p className="text-zinc-500 font-sans text-lg">Enter your details to continue your journey.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
                                <Input
                                    type="email"
                                    name="email"
                                    required
                                    className="h-14 border-zinc-200 bg-white shadow-sm focus:ring-green-500 rounded-2xl"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    error={error && error.toLowerCase().includes('email') ? error : undefined}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Password</label>
                                    <Link href="/forgot-password" title="Coming soon" className="text-xs font-semibold text-green-600 hover:text-green-700">Forgot Password?</Link>
                                </div>
                                <Input
                                    type="password"
                                    name="password"
                                    required
                                    className="h-14 border-zinc-200 bg-white shadow-sm focus:ring-green-500 rounded-2xl"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={error && (error.toLowerCase().includes('password') || error.toLowerCase().includes('credentials')) ? error : undefined}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-14 bg-zinc-950 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-xl hover:shadow-green-900/10 active:scale-[0.98] disabled:opacity-70 group"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Sign In
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center pt-8">
                            <p className="text-zinc-500 font-medium">
                                New to the Himalayas?{' '}
                                <Link href="/register" className="text-zinc-950 font-bold hover:underline underline-offset-4 decoration-zinc-300">
                                    Create an Account
                                </Link>
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
