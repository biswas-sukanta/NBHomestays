'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Twitter, Mail, Mountain } from 'lucide-react';

const NAV_COLUMNS = [
    {
        heading: 'Wander',
        links: [
            { label: 'West Bengal', href: '/state/west-bengal' },
            { label: 'Sikkim', href: '/state/sikkim' },
            { label: 'Assam', href: '/state/assam' },
            { label: 'Meghalaya', href: '/state/meghalaya' },
        ],
    },
    {
        heading: 'Discover',
        links: [
            { label: 'Offbeat Stays', href: '/search?tag=Offbeat' },
            { label: 'Workations', href: '/search?tag=Workation' },
            { label: 'Heritage', href: '/search?tag=Heritage' },
            { label: 'Trending', href: '/search?tag=Trending' },
        ],
    },
    {
        heading: 'For Hosts',
        links: [
            { label: 'Join as a Host', href: '/host/add-homestay' },
            { label: 'Host Guidelines', href: '/community' },
            { label: 'Host Dashboard', href: '/host/dashboard' },
        ],
    },
    {
        heading: 'Support',
        links: [
            { label: 'Contact on WhatsApp', href: 'https://wa.me/919800000000', external: true },
            { label: 'FAQs', href: '/community' },
            { label: 'About NBH', href: '/community' },
        ],
    },
];

export function Footer() {
    return (
        <footer className="bg-stone-50 border-t border-stone-200 w-full">
            {/* ── Soul Section ── */}
            <div className="w-full max-w-6xl mx-auto px-6 pt-16 pb-4 text-center">
                <div className="inline-flex items-center gap-2 mb-5">
                    <Mountain className="w-5 h-5 text-emerald-700" />
                    <span className="text-xs font-bold tracking-[0.25em] uppercase text-emerald-700">
                        North Bengal Homestays
                    </span>
                </div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 leading-tight">
                    Crafted by a traveler.<br className="hidden sm:block" /> Dedicated to the offbeat soul. 🏔️
                </h2>
                <p className="text-stone-500 text-base mt-4 max-w-xl mx-auto leading-relaxed">
                    Discover places with character across the East. Skip the corporate lobbies — find your next great story.
                </p>
            </div>

            {/* ── Navigation Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 w-full max-w-6xl mx-auto px-6">
                {NAV_COLUMNS.map((col) => (
                    <div key={col.heading}>
                        <p className="font-semibold text-stone-800 mb-4 text-sm tracking-wide">
                            {col.heading}
                        </p>
                        <ul className="space-y-2.5">
                            {col.links.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        target={(link as any).external ? '_blank' : undefined}
                                        rel={(link as any).external ? 'noopener noreferrer' : undefined}
                                        className="text-sm text-stone-500 hover:text-stone-900 transition-colors duration-200"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* ── Baseline ── */}
            <div className="border-t border-stone-200 mt-12">
                <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-4 w-full max-w-6xl mx-auto px-6">
                    <p className="text-xs text-stone-400">
                        © {new Date().getFullYear()} NBHomestays. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5 text-xs text-stone-400">
                        <Link href="/community" className="hover:text-stone-800 transition-colors">
                            Terms of Service
                        </Link>
                        <span>·</span>
                        <Link href="/community" className="hover:text-stone-800 transition-colors">
                            Privacy Policy
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-stone-400 hover:text-stone-800 transition-colors duration-200">
                            <Instagram className="w-4 h-4" />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="text-stone-400 hover:text-stone-800 transition-colors duration-200">
                            <Twitter className="w-4 h-4" />
                        </a>
                        <a href="mailto:hello@nbhomestays.com" aria-label="Email" className="text-stone-400 hover:text-stone-800 transition-colors duration-200">
                            <Mail className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
