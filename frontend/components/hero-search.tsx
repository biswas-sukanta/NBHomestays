'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { MapPin, Search } from 'lucide-react';
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
        <div className="relative min-h-[60vh] md:min-h-[70vh] pb-16 w-full overflow-hidden select-none">
            {/* ── Ken Burns background ── */}
            <div
                className="absolute inset-0 h-full w-full bg-cover bg-center animate-ken-burns"
                style={{ backgroundImage: "url('/hero_background.jpg')" }}
                aria-hidden="true"
            />

            {/* ── Layered overlays for editorial depth ── */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10" />

            {/* ── Content ── */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center pt-32 md:pt-48 lg:pt-64 pb-12 px-4 text-center">

                {/* Eyebrow label */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="mb-6 inline-flex items-center gap-2 rounded-full glass-dark px-4 py-1.5 text-white/90 text-sm font-semibold tracking-widest uppercase"
                >
                    🌿 North Bengal Homestays
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2 }}
                    className="mb-5 max-w-4xl text-4xl font-extrabold text-white leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
                    style={{ textShadow: '0 2px 20px rgba(0,0,0,0.35)' }}
                >
                    Find Your Vibe<br className="hidden md:block" /> in North Bengal
                </motion.h1>

                {/* Sub-headline */}
                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.35 }}
                    className="mb-10 max-w-xl text-base text-white/80 md:text-xl font-medium"
                    style={{ textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}
                >
                    Unique, verified homestays with mountain views, jungle retreats & river escapes.
                </motion.p>

                {/* ── Glassmorphism Search Bar ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="w-full max-w-2xl"
                >
                    <div
                        className={`
                            glass-card px-4 py-3 rounded-2xl
                            flex flex-col md:flex-row items-center gap-3
                            transition-all duration-300
                            ${focused ? 'ring-2 ring-primary/60 shadow-[0_0_0_4px_rgba(53,130,90,0.15)]' : ''}
                        `}
                    >
                        <div className="flex items-center gap-3 w-full md:flex-1 px-2">
                            <MapPin className="h-5 w-5 text-primary flex-none" />
                            <Input
                                id="hero-search-input"
                                type="text"
                                placeholder="Where to? (e.g. Darjeeling, Kalimpong)"
                                className="border-none bg-transparent text-gray-900 placeholder:text-gray-400 focus-visible:ring-0 text-lg font-medium p-0 h-auto shadow-none"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                aria-label="Search destination"
                            />
                        </div>

                        {/* Divider (desktop only) */}
                        <div className="hidden md:block w-px h-8 bg-gray-200 flex-none" />

                        {/* CTA Button */}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="
                                w-full md:w-auto flex items-center justify-center gap-2
                                bg-primary text-primary-foreground
                                px-8 py-3.5 rounded-xl font-bold text-base
                                shadow-lg hover:bg-primary/90 transition-colors duration-150
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
                            "
                            onClick={handleSearch}
                            aria-label="Search homestays"
                        >
                            <Search className="w-5 h-5" />
                            Explore Vibey Stays
                        </motion.button>
                    </div>
                </motion.div>

                {/* Trust indicators */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.8 }}
                    className="mt-8 flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm"
                >
                    {['✓ Verified Stays', '✓ Direct Inquiry', '✓ No Hidden Fees'].map((t) => (
                        <span key={t} className="font-medium">{t}</span>
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
                <span className="text-white/50 text-xs uppercase tracking-widest">Scroll</span>
                <motion.div
                    className="w-0.5 h-10 bg-gradient-to-b from-white/60 to-transparent rounded-full"
                    animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>
        </div>
    );
}
