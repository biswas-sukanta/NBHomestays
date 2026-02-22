'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Home, Search, MessageSquare, UserCircle, Hotel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const { isAuthenticated, user, logout } = useAuth();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Explore', href: '/search', icon: Search },
        { name: 'Community', href: '/community', icon: MessageSquare },
    ];

    // Role-based menu items
    if (isAuthenticated) {
        if (user?.role === 'ROLE_ADMIN') {
            navLinks.push({ name: 'Admin Console', href: '/admin', icon: Hotel });
        } else if (user?.role === 'ROLE_HOST') {
            navLinks.push({ name: 'My Listings', href: '/host/dashboard', icon: Hotel });
        } else {
            navLinks.push({ name: 'Become a Host', href: '/host/add-homestay', icon: Hotel });
        }
        navLinks.push({ name: 'Profile', href: '/profile', icon: UserCircle });
    }

    return (
        <nav
            className={cn(
                'sticky top-0 w-full z-[9999] transition-all duration-300',
                isScrolled || pathname !== '/'
                    ? 'bg-white/85 backdrop-blur-xl shadow-sm border-b border-gray-100 py-3'
                    : 'bg-transparent py-5'
            )}
        >
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                <Link
                    href="/"
                    className={cn("text-2xl font-bold tracking-tighter transition-colors",
                        isScrolled || pathname !== '/' ? "text-green-800" : "text-white"
                    )}
                >
                    NBHomestays
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-2">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    "relative px-4 py-2 text-sm font-semibold transition-colors flex items-center space-x-1.5 rounded-full",
                                    isActive
                                        ? (isScrolled || pathname !== '/' ? "text-green-800" : "text-white")
                                        : (isScrolled || pathname !== '/' ? "text-gray-500 hover:text-green-700 hover:bg-green-50/50" : "text-white/80 hover:text-white hover:bg-white/10")
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-indicator"
                                        className={cn(
                                            "absolute inset-0 rounded-full -z-10",
                                            isScrolled || pathname !== '/' ? "bg-green-100/80" : "bg-white/20 backdrop-blur-sm"
                                        )}
                                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                    />
                                )}
                                <link.icon className="w-4 h-4" />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}

                    <div className="flex items-center space-x-4 pl-4 ml-2 border-l border-gray-300/30">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <span className={cn("text-sm font-semibold tracking-tight",
                                    isScrolled || pathname !== '/' ? "text-gray-800" : "text-white drop-shadow-sm"
                                )}>
                                    {user?.firstName ? `Welcome back, ${user.firstName}` : 'Welcome back'}
                                </span>
                                <button
                                    onClick={logout}
                                    className={cn("px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all",
                                        isScrolled || pathname !== '/'
                                            ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                            : "bg-white/10 text-white hover:bg-red-500/90 backdrop-blur-sm"
                                    )}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className={cn("px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all",
                                isScrolled || pathname !== '/'
                                    ? "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                                    : "bg-white text-green-800 hover:bg-green-50 hover:scale-105"
                            )}>
                                Login
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 rounded-md active:scale-95 transition-transform"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <X className={cn("w-6 h-6", isScrolled || pathname !== '/' ? "text-gray-800" : "text-white")} />
                    ) : (
                        <Menu className={cn("w-6 h-6", isScrolled || pathname !== '/' ? "text-gray-800" : "text-white")} />
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:hidden bg-white/95 backdrop-blur-2xl border-t border-gray-100 px-4 py-6 absolute w-full shadow-2xl"
                >
                    <div className="flex flex-col space-y-2">
                        {isAuthenticated && (
                            <div className="pb-4 mb-2 border-b border-gray-100 px-3">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Signed in as</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {user?.firstName ? `Welcome back, ${user.firstName}` : 'Welcome back'}
                                </p>
                            </div>
                        )}

                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={cn(
                                        "px-4 py-3 rounded-xl font-bold flex items-center space-x-3 transition-colors",
                                        isActive ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
                                    )}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <link.icon className={cn("w-5 h-5", isActive ? "text-green-600" : "text-gray-400")} />
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}

                        <div className="pt-4 mt-2 border-t border-gray-100">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsOpen(false);
                                    }}
                                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3.5 rounded-xl font-bold transition-colors"
                                >
                                    Logout
                                </button>
                            ) : (
                                <Link
                                    href="/login"
                                    className="text-center w-full block bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold shadow-md transition-all active:scale-95"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </nav>
    );
}
