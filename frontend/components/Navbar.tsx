'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, MessageSquare, UserCircle, Hotel, LogOut, ChevronDown, LayoutDashboard, Plus, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefetchSearch } from '@/hooks/usePrefetchSearch';

export default function Navbar() {
    usePrefetchSearch();
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();
    const isHome = pathname === '/';

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close avatar dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
                setAvatarOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Minimal primary nav — Home + Explore + Community
    const primaryLinks = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Explore', href: '/search', icon: Search },
        { name: 'Community', href: '/community', icon: MessageSquare },
    ];

    // Determine color mode
    const isDark = isHome && !isScrolled;

    return (
        <nav
            className={cn(
                'sticky top-0 w-full z-[9999] transition-all duration-500',
                isScrolled || !isHome
                    ? 'bg-white/70 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-b border-gray-200/50 py-3'
                    : 'bg-black/10 backdrop-blur-md py-5'
            )}
        >
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Logo */}
                <Link
                    href="/"
                    className={cn(
                        "text-2xl font-extrabold tracking-tighter transition-colors duration-300 font-heading",
                        isDark ? "text-white" : "text-gray-900"
                    )}
                >
                    NBHomestays
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {primaryLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "relative px-4 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 rounded-full",
                                    isActive
                                        ? (isDark ? "text-white" : "text-gray-900")
                                        : (isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/80")
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className={cn(
                                            "absolute inset-0 rounded-full -z-10",
                                            isDark ? "bg-white/15 backdrop-blur-sm" : "bg-gray-100"
                                        )}
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <link.icon className="w-4 h-4" />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}

                    {/* Right side: Auth */}
                    <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-300/20">
                        {isAuthenticated ? (
                            <div className="relative" ref={avatarRef}>
                                <button
                                    onClick={() => setAvatarOpen(!avatarOpen)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 border",
                                        isDark
                                            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                            : "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300",
                                        avatarOpen && (isDark ? "bg-white/20 ring-2 ring-white/30" : "bg-gray-100 ring-2 ring-gray-300")
                                    )}
                                >
                                    <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                                        isDark ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                                    )}>
                                        {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                                    </div>
                                    <span className={cn(
                                        "hidden lg:inline text-[10px] font-bold tracking-widest uppercase",
                                        isDark ? "text-white/60" : "text-emerald-600"
                                    )}>✦ Traveler</span>
                                    <ChevronDown className={cn(
                                        "w-3.5 h-3.5 transition-transform duration-200",
                                        avatarOpen && "rotate-180"
                                    )} />
                                </button>

                                {/* Dropdown */}
                                <AnimatePresence>
                                    {avatarOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden py-2"
                                        >
                                            {/* User info */}
                                            <div className="px-4 py-3 border-b border-gray-100">
                                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Signed in as</p>
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {user?.firstName || user?.email || 'User'}
                                                </p>
                                            </div>

                                            {/* Links */}
                                            <div className="py-1">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setAvatarOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <UserCircle className="w-4 h-4 text-gray-400" />
                                                    Profile
                                                </Link>

                                                {user?.role === 'ROLE_ADMIN' && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setAvatarOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <LayoutDashboard className="w-4 h-4 text-gray-400" />
                                                        Admin Console
                                                    </Link>
                                                )}

                                                {user?.role === 'ROLE_HOST' && (
                                                    <Link
                                                        href="/host/dashboard"
                                                        onClick={() => setAvatarOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Hotel className="w-4 h-4 text-gray-400" />
                                                        My Listings
                                                    </Link>
                                                )}

                                                {user?.role !== 'ROLE_ADMIN' && user?.role !== 'ROLE_HOST' && (
                                                    <Link
                                                        href="/host/add-homestay"
                                                        onClick={() => setAvatarOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4 text-gray-400" />
                                                        Become a Host
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Logout */}
                                            <div className="border-t border-gray-100 pt-1 pb-1">
                                                <button
                                                    onClick={() => { logout(); setAvatarOpen(false); }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Log out
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className={cn(
                                    "px-5 py-2 rounded-full font-bold text-sm tracking-wide transition-all duration-300",
                                    isDark
                                        ? "bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                                        : "bg-gray-900 text-white hover:bg-gray-800 shadow-md"
                                )}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 rounded-xl active:scale-95 transition-transform"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <X className={cn("w-6 h-6", isDark ? "text-white" : "text-gray-800")} />
                    ) : (
                        <Menu className={cn("w-6 h-6", isDark ? "text-white" : "text-gray-800")} />
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-4 py-6 absolute w-full shadow-2xl"
                    >
                        <div className="flex flex-col space-y-2">
                            {isAuthenticated && (
                                <div className="pb-4 mb-2 border-b border-gray-100 px-3">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Signed in as</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {user?.firstName || 'User'}
                                    </p>
                                </div>
                            )}

                            {/* Premium Home Link */}
                            <Link
                                href="/"
                                className={cn(
                                    "px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors",
                                    isHome ? "bg-amber-50 text-amber-700" : "text-gray-900 hover:bg-gray-50"
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                <Home className={cn("w-5 h-5", isHome ? "text-amber-600" : "text-gray-500")} />
                                <span>Home</span>
                            </Link>

                            {primaryLinks.filter(l => l.name !== 'Home').map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={cn(
                                            "px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-colors",
                                            isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                                        )}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <link.icon className={cn("w-5 h-5", isActive ? "text-gray-900" : "text-gray-400")} />
                                        <span>{link.name}</span>
                                    </Link>
                                );
                            })}

                            {isAuthenticated && (
                                <>
                                    <Link href="/profile" onClick={() => setIsOpen(false)} className="px-4 py-3 rounded-xl font-bold flex items-center gap-3 text-gray-600 hover:bg-gray-50 transition-colors">
                                        <UserCircle className="w-5 h-5 text-gray-400" /> Profile
                                    </Link>
                                    {user?.role === 'ROLE_HOST' && (
                                        <Link href="/host/dashboard" onClick={() => setIsOpen(false)} className="px-4 py-3 rounded-xl font-bold flex items-center gap-3 text-gray-600 hover:bg-gray-50 transition-colors">
                                            <Hotel className="w-5 h-5 text-gray-400" /> My Listings
                                        </Link>
                                    )}
                                    {user?.role === 'ROLE_ADMIN' && (
                                        <Link href="/admin" onClick={() => setIsOpen(false)} className="px-4 py-3 rounded-xl font-bold flex items-center gap-3 text-gray-600 hover:bg-gray-50 transition-colors">
                                            <LayoutDashboard className="w-5 h-5 text-gray-400" /> Admin Console
                                        </Link>
                                    )}
                                </>
                            )}

                            <div className="pt-4 mt-2 border-t border-gray-100">
                                {isAuthenticated ? (
                                    <button
                                        onClick={() => { logout(); setIsOpen(false); }}
                                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" /> Log out
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="text-center w-full block bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-95"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
