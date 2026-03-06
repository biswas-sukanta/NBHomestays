'use client';

import { cn } from '@/lib/utils';

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
            'backdrop-blur-xl bg-zinc-950/80 border-b border-white/5',
            className
        )}>
            <div className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible no-scrollbar gap-2 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {options.map((opt) => (
                    <button
                        key={opt.value ?? '__all__'}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'whitespace-nowrap px-5 py-2.5 rounded-full border text-xs font-black uppercase tracking-widest transition-all duration-300 shrink-0',
                            activeValue === opt.value
                                ? 'bg-green-600 text-white border-green-500 shadow-[0_0_20px_rgba(22,163,74,0.4)] scale-[1.05]'
                                : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-white/20 hover:bg-zinc-800 hover:text-white'
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
