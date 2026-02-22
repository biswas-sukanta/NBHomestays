'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTripBoard, TripBoardItem } from '@/store/useTripBoard';
import { cn } from '@/lib/utils';

interface TripBoardButtonProps {
    item: TripBoardItem;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function TripBoardButton({ item, className, size = 'md' }: TripBoardButtonProps) {
    const { toggleSave, isSaved } = useTripBoard();
    const saved = isSaved(item.id);
    const [popped, setPopped] = React.useState(false);

    const sizeMap = {
        sm: { icon: 'w-3.5 h-3.5', btn: 'w-7 h-7' },
        md: { icon: 'w-5 h-5', btn: 'w-9 h-9' },
        lg: { icon: 'w-6 h-6', btn: 'w-11 h-11' },
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave(item);
        setPopped(true);
        setTimeout(() => setPopped(false), 450);
    };

    return (
        <button
            onClick={handleClick}
            aria-label={saved ? 'Remove from Trip Board' : 'Save to Trip Board'}
            className={cn(
                'flex items-center justify-center rounded-full shadow-md transition-all duration-200',
                'glass focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                sizeMap[size].btn,
                className
            )}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={saved ? 'saved' : 'unsaved'}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.6 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                    <Heart
                        className={cn(
                            sizeMap[size].icon,
                            'transition-colors duration-200',
                            saved
                                ? 'fill-rose-500 stroke-rose-500'
                                : 'fill-transparent stroke-gray-700',
                            popped && 'animate-heart-pop'
                        )}
                    />
                </motion.div>
            </AnimatePresence>
        </button>
    );
}
