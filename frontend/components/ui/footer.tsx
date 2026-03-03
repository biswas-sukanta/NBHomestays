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
        <footer className="bg-[#0B1C14] w-full pt-24 pb-12">
            {/* ── Soul Section ── */}
            <div className="w-full max-w-6xl mx-auto px-6 pb-20 text-center">
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
