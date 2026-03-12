import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface CommunityHeroProps {
    onOpenComposer: () => void;
}

export function CommunityHero({ onOpenComposer }: CommunityHeroProps) {
    return (
        <section className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[70vh] min-h-[400px] sm:min-h-[500px] flex items-center justify-center overflow-hidden bg-neutral-100">
            {/* Background Image with Parallax & Ken Burns Effect */}
            <motion.div
                className="absolute inset-0 z-0"
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{
                    duration: 25,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
            >
                {/* Light gradient overlays for editorial feel */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 z-10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-64 sm:h-80 bg-gradient-to-t from-white via-white/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/30 to-transparent z-10 pointer-events-none" />
                
                <Image
                    src="/_static/community/community_hero_desktop.webp"
                    fill
                    sizes="100vw"
                    className="w-full h-full object-cover hidden md:block"
                    alt="Community journeys in the Eastern Himalayas"
                    priority
                />
                <Image
                    src="/_static/community/community_hero_mobile.webp"
                    fill
                    sizes="100vw"
                    className="w-full h-full object-cover md:hidden"
                    alt="Community journeys in the Eastern Himalayas"
                    priority
                />
            </motion.div>

            {/* Content Payload */}
            <div className="container relative z-20 px-4 sm:px-6 lg:px-8 mx-auto text-center flex flex-col items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    className="max-w-3xl mx-auto space-y-3 sm:space-y-5 lg:space-y-6 flex flex-col items-center"
                >
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white tracking-tight font-serif drop-shadow-lg [text-shadow:_0_4px_32px_rgb(0_0_0_/_70%)]"
                    >
                        Community
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.45 }}
                        className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-medium max-w-2xl mx-auto drop-shadow-md leading-relaxed"
                    >
                        Real travelers. Stories from the road across the Eastern Himalayas.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="pt-4 sm:pt-6 lg:pt-8"
                    >
                        <Button
                            onClick={onOpenComposer}
                            size="lg"
                            className="bg-neutral-900 text-white hover:bg-neutral-800 font-semibold px-6 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-7 text-sm sm:text-base rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
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
