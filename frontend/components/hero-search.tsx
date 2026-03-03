'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Compass, Mountain, Clock, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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

                {/* Headline — Large multicolor gradient */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2 }}
                    className="mb-5 max-w-5xl text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl font-heading"
                    style={{ textShadow: '0 4px 30px rgba(0,0,0,0.4)' }}
                >
                    <span className="text-white">DISCOVER YOUR</span>
                    <br />
                    <span className="bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                        UNFILTERED Vibe
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

                {/* ── Etched Integrated Search Bar ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="w-full max-w-3xl"
                >
                    <div
                        className={`
                            bg-white/10 backdrop-blur-xl border border-white/20
                            px-3 py-2.5 rounded-2xl
                            flex flex-col md:flex-row items-center gap-2
                            transition-all duration-300
                            ${focused ? 'bg-white/15 border-amber-400/50 shadow-[0_0_30px_rgba(218,165,32,0.2)]' : ''}
                        `}
                    >
                        {/* Destination input */}
                        <div className="flex items-center gap-3 w-full md:flex-1 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
                            <Compass className="h-5 w-5 text-amber-400 flex-none" />
                            <div className="flex flex-col flex-1">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300/80">Destination</span>
                                <Input
                                    id="hero-search-input"
                                    type="text"
                                    placeholder="Darjeeling, Kalimpong, Mirik..."
                                    className="border-none bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 text-base font-medium p-0 h-auto shadow-none"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    aria-label="Search destination"
                                />
                            </div>
                        </div>

                        {/* Stay type hint */}
                        <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10">
                            <Mountain className="h-5 w-5 text-emerald-400 flex-none" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-300/80">Stay Type</span>
                                <span className="text-white/50 text-sm font-medium">Homestays</span>
                            </div>
                        </div>

                        {/* Duration hint */}
                        <div className="hidden md:flex items-center gap-3 px-3 py-2 rounded-xl bg-white/10">
                            <Clock className="h-5 w-5 text-violet-400 flex-none" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold tracking-widest uppercase text-violet-300/80">Duration</span>
                                <span className="text-white/50 text-sm font-medium">Any</span>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="
                                w-full md:w-auto flex items-center justify-center gap-2.5
                                bg-gradient-to-r from-amber-500 to-amber-600 text-white
                                px-8 py-3.5 rounded-xl font-bold text-base
                                shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40
                                transition-all duration-300
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
                            "
                            onClick={handleSearch}
                            aria-label="Search homestays"
                        >
                            <Search className="w-5 h-5" />
                            Explore Stays
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
