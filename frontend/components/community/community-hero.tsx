import React from 'react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface CommunityHeroProps {
    onOpenComposer: () => void;
}

export function CommunityHero({ onOpenComposer }: CommunityHeroProps) {
    return (
        <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-zinc-950">
            {/* Background Image with Parallax & Ken Burns potential */}
            <motion.div
                className="absolute inset-0 z-0"
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none" />
                <img
                    src="/_static/community/community_hero_desktop.webp?tr=w-1920,q-70,f-webp"
                    className="w-full h-full object-cover hidden md:block"
                    alt="Community journeys in the Himalayas"
                    loading="lazy"
                />
                <img
                    src="/_static/community/community_hero_mobile.webp?tr=w-800,q-70,f-webp"
                    className="w-full h-full object-cover md:hidden"
                    alt="Community journeys in the Himalayas"
                    loading="lazy"
                />
            </motion.div>

            {/* Content Payload */}
            <div className="container relative z-20 px-4 md:px-6 mx-auto text-center flex flex-col items-center justify-center translate-y-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-3xl mx-auto space-y-4 md:space-y-6 flex flex-col items-center"
                >
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-white tracking-tight font-serif drop-shadow-lg [text-shadow:_0_4px_24px_rgb(0_0_0_/_60%)]">
                        Community
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 font-bold max-w-2xl mx-auto drop-shadow-md">
                        Real travelers. Real discoveries across the Himalayas.
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="pt-6 sm:pt-8"
                    >
                        <Button
                            onClick={onOpenComposer}
                            size="lg"
                            className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-6 sm:px-10 sm:py-7 text-sm sm:text-base rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95"
                        >
                            <Pencil className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Share your journey
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
