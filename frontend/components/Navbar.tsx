'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Home, Search, MessageSquare, UserCircle, Hotel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
                'sticky top-0 w-full z-50 transition-all duration-300',
                isScrolled || pathname !== '/'
                    ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 py-3'
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
                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-green-600 flex items-center space-x-1",
                                isScrolled || pathname !== '/' ? "text-gray-700" : "text-white/90 hover:text-white"
                            )}
                        >
                            <link.icon className="w-4 h-4" />
                            <span>{link.name}</span>
                        </Link>
                    ))}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <span className={cn("text-sm font-medium", isScrolled || pathname !== '/' ? "text-gray-900" : "text-white")}>
                                    {user?.firstName ? `Hi, ${user.firstName}` : 'Welcome'}
                                </span>
                                <button
                                    onClick={logout}
                                    className={cn("px-4 py-2 rounded-full font-medium transition-all",
                                        isScrolled || pathname !== '/'
                                            ? "bg-red-500 text-white hover:bg-red-600"
                                            : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
                                    )}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className={cn("px-4 py-2 rounded-full font-medium transition-all",
                                isScrolled || pathname !== '/'
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-white text-green-700 hover:bg-gray-100"
                            )}>
                                Login
                            </Link>
                        )}
                    </div>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden p-2 rounded-md"
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
                <div className="md:hidden bg-white border-t p-4 absolute w-full shadow-lg">
                    <div className="flex flex-col space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-gray-700 hover:text-green-600 font-medium flex items-center space-x-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <link.icon className="w-5 h-5" />
                                <span>{link.name}</span>
                            </Link>
                        ))}
                        <hr />
                        <hr />
                        {isAuthenticated ? (
                            <button
                                onClick={() => {
                                    logout();
                                    setIsOpen(false);
                                }}
                                className="text-center w-full block bg-red-500 text-white py-2 rounded-md font-medium"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="text-center w-full block bg-green-600 text-white py-2 rounded-md font-medium"
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
