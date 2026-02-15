'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
}

interface StoryCarouselProps {
    media: MediaItem[];
    vibeScore?: number;
}

export function StoryCarousel({ media, vibeScore }: StoryCarouselProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => {
        if (info.offset.y < -100 && currentIndex < media.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else if (info.offset.y > 100 && currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const nextSlide = () => {
        if (currentIndex < media.length - 1) setCurrentIndex(currentIndex + 1);
    };

    const prevSlide = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    return (
        <div className="relative h-[85vh] md:h-[600px] w-full overflow-hidden bg-black/90 md:rounded-3xl">
            <AnimatePresence initial={false} mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center p-4 md:p-0"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={handleDragEnd}
                >
                    {media[currentIndex].type === 'video' ? (
                        <video
                            src={media[currentIndex].url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="h-full w-full object-cover md:rounded-2xl"
                        />
                    ) : (
                        <div
                            className="h-full w-full bg-cover bg-center md:rounded-2xl"
                            style={{ backgroundImage: `url(${media[currentIndex].url})` }}
                        />
                    )}

                    {/* Vibe Badge */}
                    {vibeScore && vibeScore >= 8.0 && (
                        <div className="absolute top-6 right-6 z-20 flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-md">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="font-bold text-white">Verified Vibe {vibeScore}</span>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Controls (Visible on Desktop or as hint) */}
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-4 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-black/20 text-white hover:bg-black/40"
                    onClick={prevSlide}
                    disabled={currentIndex === 0}
                >
                    <ChevronUp className="h-6 w-6" />
                </Button>
                <div className="flex flex-col gap-1">
                    {media.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 w-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white h-4' : 'bg-white/50'
                                }`}
                        />
                    ))}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-black/20 text-white hover:bg-black/40"
                    onClick={nextSlide}
                    disabled={currentIndex === media.length - 1}
                >
                    <ChevronDown className="h-6 w-6" />
                </Button>
            </div>

            {/* Mobile Hint */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce md:hidden">
                Swipe Up/Down
            </div>
        </div>
    );
}
