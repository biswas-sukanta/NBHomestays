'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Twitter, Mail, Mountain, Compass, Binoculars, Key, HeartPulse, ArrowRight, Sparkles } from 'lucide-react';

const NAV_COLUMNS = [
    {
        heading: 'Wander',
        icon: Compass,
        iconColor: 'text-emerald-400',
        links: [
            { label: 'West Bengal', href: '/state/west-bengal' },
            { label: 'Sikkim', href: '/state/sikkim' },
            { label: 'Assam', href: '/state/assam' },
            { label: 'Meghalaya', href: '/state/meghalaya' },
        ],
    },
    {
        heading: 'Discover',
        icon: Binoculars,
        iconColor: 'text-amber-400',
        links: [
            { label: 'Offbeat Stays', href: '/search?tag=Offbeat' },
            { label: 'Workations', href: '/search?tag=Workation' },
            { label: 'Heritage', href: '/search?tag=Heritage' },
            { label: 'Trending', href: '/search?tag=Trending' },
        ],
    },
    {
        heading: 'For Hosts',
        icon: Key,
        iconColor: 'text-violet-400',
        links: [
            { label: 'Join as a Host', href: '/host/add-homestay' },
            { label: 'Host Guidelines', href: '/community' },
            { label: 'Host Dashboard', href: '/host/dashboard' },
        ],
    },
    {
        heading: 'Support',
        icon: HeartPulse,
        iconColor: 'text-rose-400',
        links: [
            { label: 'Contact on WhatsApp', href: 'https://wa.me/919800000000', external: true },
            { label: 'FAQs', href: '/community' },
            { label: 'About NBH', href: '/community' },
        ],
    },
];

export function Footer() {
    return (
        <footer className="bg-gradient-to-br from-[#0d2818] via-[#102e1c] to-[#091f12] w-full">
            {/* ── Soul Section ── */}
            <div className="w-full max-w-6xl mx-auto px-6 pt-20 pb-6 text-center">
                <div className="inline-flex items-center gap-2.5 mb-6">
                    <Mountain className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold tracking-[0.25em] uppercase text-emerald-400/80">
                        North Bengal Homestays
                    </span>
                </div>
                <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 leading-tight">
                    Crafted by a traveler.<br className="hidden sm:block" /> Dedicated to the offbeat soul. 🏔️
                </h2>
            </div>

            {/* ── Premium Host Partnership ── */}
            <div className="w-full bg-slate-900 border-y border-white/5 py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzk5OCIvPjwvc3ZnPg==')] opacity-[0.05]" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                <div className="w-full max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight font-heading">
                        Join the Inner Circle
                    </h3>
                    <p className="text-slate-300 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
                        Have a property that fits the vibe? Join our invite-only network of authentic hosts.
                    </p>
                    <Link
                        href="/host"
                        className="group relative inline-flex items-center justify-center gap-3 px-10 py-4 text-lg font-bold text-slate-900 transition-all duration-300 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 rounded-full shadow-[0_0_40px_rgba(253,230,138,0.4)] hover:shadow-[0_0_60px_rgba(253,230,138,0.6)] hover:scale-105 overflow-hidden ring-4 ring-amber-500/20"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Host on NBH <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </Link>
                </div>
            </div>

            {/* ── Navigation Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 w-full max-w-6xl mx-auto px-6">
                {NAV_COLUMNS.map((col) => {
                    const Icon = col.icon;
                    return (
                        <div key={col.heading}>
                            <div className="flex items-center gap-2.5 mb-5">
                                <Icon className={`w-6 h-6 ${col.iconColor}`} />
                                <p className="font-bold text-white text-base tracking-wide">
                                    {col.heading}
                                </p>
                            </div>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            target={(link as any).external ? '_blank' : undefined}
                                            rel={(link as any).external ? 'noopener noreferrer' : undefined}
                                            className="text-sm text-emerald-100/50 hover:text-white transition-colors duration-200 font-medium"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* ── Baseline ── */}
            <div className="border-t border-emerald-800/40 mt-14">
                <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-4 w-full max-w-6xl mx-auto px-6">
                    <p className="text-xs text-emerald-100/30">
                        © {new Date().getFullYear()} NBHomestays. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5 text-xs text-emerald-100/30">
                        <Link href="/community" className="hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                        <span>·</span>
                        <Link href="/community" className="hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                    </div>
                    <div className="flex items-center gap-5">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-emerald-100/40 hover:text-white transition-colors duration-200">
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="text-emerald-100/40 hover:text-white transition-colors duration-200">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="mailto:hello@nbhomestays.com" aria-label="Email" className="text-emerald-100/40 hover:text-white transition-colors duration-200">
                            <Mail className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
