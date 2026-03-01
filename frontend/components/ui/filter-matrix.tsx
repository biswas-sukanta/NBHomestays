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
            'sticky top-[64px] z-30 -mx-4 px-4 py-3',
            'backdrop-blur-md bg-white/80 border-b border-gray-200/50',
            className
        )}>
            <div className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible no-scrollbar gap-2 pb-0.5" style={{ scrollbarWidth: 'none' }}>
                {options.map((opt) => (
                    <button
                        key={opt.value ?? '__all__'}
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'whitespace-nowrap px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 shrink-0',
                            activeValue === opt.value
                                ? 'bg-[#004d00] text-white border-[#004d00] shadow-md scale-[1.03]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#004d00]/30 hover:bg-green-50/60'
                        )}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
