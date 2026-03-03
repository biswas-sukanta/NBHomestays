import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
    pillText: React.ReactNode;
    title: React.ReactNode; // Allows strings and JSX for e.g. italicising words
    subtitle?: React.ReactNode;
    className?: string;
    align?: 'center' | 'left'; // Defaults to center
}

export function SectionHeader({
    pillText,
    title,
    subtitle,
    className,
    align = 'center',
}: SectionHeaderProps) {
    const isCentered = align === 'center';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn('mb-10', isCentered && 'text-center', className)}
        >
            {/* ── Anchored Pill ── */}
            <div
                className={cn(
                    'flex items-center w-full mx-auto mb-6',
                    isCentered ? 'justify-center max-w-3xl' : 'justify-start'
                )}
            >
                {isCentered && <div className="h-px bg-border/60 flex-grow" />}
                <span className="px-5 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-emerald-800 bg-emerald-50/50 border border-emerald-100/50 rounded-full py-1.5 mx-4 shrink-0 whitespace-nowrap">
                    {pillText}
                </span>
                <div className="h-px bg-border/60 flex-grow" />
            </div>

            {/* ── Title ── */}
            <h2
                className={cn(
                    'text-4xl md:text-5xl font-bold tracking-tight font-heading text-gray-900',
                    isCentered ? 'text-center' : 'text-left'
                )}
            >
                {title}
            </h2>

            {/* ── Subtitle ── */}
            {subtitle && (
                <p
                    className={cn(
                        'mt-4 text-muted-foreground text-base md:text-lg font-medium max-w-2xl',
                        isCentered ? 'mx-auto text-center' : 'text-left'
                    )}
                >
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
}
