'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface FilterOption {
    label: string;
    value: string | null;
}

interface FilterMatrixProps {
    options: FilterOption[];
    activeValue: string | null;
    onChange: (value: string | null) => void;
    className?: string;
}

export function FilterMatrix({ options, activeValue, onChange, className }: FilterMatrixProps) {
    return (
        <div className={cn(
            'sticky top-[64px] z-30 -mx-4 px-4 py-4',
            'bg-white/95 backdrop-blur-md border-b border-neutral-200/50',
            className
        )}>
            {/* Sleek horizontally scrollable filter track */}
            <div 
                className="flex overflow-x-auto snap-x snap-mandatory gap-3 py-1 scrollbar-hide" 
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {options.map((opt) => {
                    const isActive = activeValue === opt.value;
                    return (
                        <motion.button
                            key={opt.value ?? '__all__'}
                            onClick={() => onChange(opt.value)}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                'whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 shrink-0 snap-start',
                                'min-h-[36px] flex items-center justify-center',
                                // Inactive State: Minimalist pill
                                !isActive && [
                                    'bg-transparent',
                                    'border border-neutral-200',
                                    'text-neutral-500',
                                    'hover:border-neutral-300 hover:text-neutral-700'
                                ],
                                // Active State: Sophisticated brand highlight
                                isActive && [
                                    'bg-emerald-50',
                                    'border border-emerald-200',
                                    'text-emerald-700',
                                    'font-semibold'
                                ]
                            )}
                        >
                            {opt.label}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
