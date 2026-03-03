'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function HeroSearch() {
    const router = useRouter();
    const [location, setLocation] = React.useState('');
    const [focused, setFocused] = React.useState(false);

    const handleSearch = () => {
        if (!location.trim()) {
            toast.error('Please enter a destination to search.');
            return;
        }
        router.push(`/search?query=${encodeURIComponent(location.trim())}`);
    };

    return (
        <div className="relative min-h-[70vh] md:min-h-[80vh] pb-16 w-full overflow-hidden select-none">
            {/* ── Ken Burns background ── */}
            <div className="absolute inset-0 h-full w-full animate-ken-burns" aria-hidden="true">
                <Image
                    src="/hero_background.jpg"
                    alt="North Bengal Homestays Background"
                    fill
                    priority
                    quality={100}
                    sizes="100vw"
                    className="object-cover"
                />
            </div>

            {/* ── Dramatic velvet gradient overlays ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d2818]/95 via-[#1a0a2e]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d2818]/40 via-transparent to-[#1a0a2e]/30" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

            {/* ── Content ── */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center pt-28 md:pt-32 lg:pt-36 pb-12 px-4 text-center">

                {/* Eyebrow label */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 text-white/90 text-sm font-bold tracking-[0.2em] uppercase"
                >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    North Bengal Homestays
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2 }}
                    className="mb-8 max-w-5xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl lg:text-[5.5rem] font-heading"
                    style={{ textShadow: '0 4px 30px rgba(0,0,0,0.4)' }}
                >
                    <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                        DISCOVER YOUR UNFILTERED Vibe
                    </span>
                </motion.h1>

                {/* Sub-headline */}
                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.35 }}
                    className="mb-12 max-w-xl text-lg text-white/75 md:text-xl font-medium tracking-wide"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
                >
                    Skip the tourist traps. Find stays with actual soul.
                </motion.p>

                {/* ── Unified Command Bar (Single Pill) ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="w-full max-w-[92%] sm:max-w-xl mx-auto"
                >
                    <div
                        className={cn(
                            "flex items-center p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.05),0_10px_30px_rgba(0,0,0,0.2)] transition-all duration-300",
                            focused && "ring-4 ring-amber-400/40 shadow-[0_0_40px_rgba(218,165,32,0.25)]"
                        )}
                    >
                        <Search className="w-5 h-5 text-gray-500 flex-none ml-4 mr-2" />
                        <input
                            id="hero-search-input"
                            type="text"
                            placeholder="Where to next?"
                            className="flex-1 min-w-0 bg-transparent text-gray-900 placeholder:text-gray-500 focus:outline-none text-base sm:text-lg font-medium px-2"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            aria-label="Search destination"
                        />
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="
                                flex-none flex items-center justify-center gap-2
                                bg-gradient-to-r from-amber-500 to-amber-600 text-white
                                px-5 py-2.5 sm:px-7 sm:py-3 rounded-full font-bold text-sm sm:text-base
                                shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40
                                transition-all duration-300
                            "
                            onClick={handleSearch}
                            aria-label="Search homestays"
                        >
                            Search
                        </motion.button>
                    </div>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="mt-10 flex flex-wrap items-center justify-center gap-8 text-white/60 text-sm"
                >
                    {[
                        { icon: '✦', text: 'Verified Stays' },
                        { icon: '✦', text: 'Direct Inquiry' },
                        { icon: '✦', text: 'No Hidden Fees' },
                    ].map((t) => (
                        <span key={t.text} className="font-semibold flex items-center gap-1.5 tracking-wide">
                            <span className="text-amber-400 text-xs">{t.icon}</span>{t.text}
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                aria-hidden="true"
            >
                <span className="text-white/40 text-xs uppercase tracking-widest font-medium">Scroll</span>
                <motion.div
                    className="w-0.5 h-10 bg-gradient-to-b from-amber-400/60 to-transparent rounded-full"
                    animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>
        </div>
    );
}
