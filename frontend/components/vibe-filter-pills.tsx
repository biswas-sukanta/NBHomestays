'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

const VIBE_FILTERS = [
    { label: '🏔️ Mountain', query: 'Mountain' },
    { label: '🌿 Forest', query: 'Forest' },
    { label: '🏞️ River', query: 'River' },
    { label: '🌄 Sunrise', query: 'Sunrise' },
    { label: '🌺 Tea Garden', query: 'Tea Garden' },
    { label: '❄️ Snow View', query: 'Snow View' },
    { label: '🦚 Wildlife', query: 'Wildlife' },
    { label: '🕌 Heritage', query: 'Heritage' },
];

interface VibeFilterPillsProps {
    className?: string;
}

export function VibeFilterPills({ className }: VibeFilterPillsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentQuery = searchParams.get('query') || '';

    const handlePill = (query: string) => {
        // Toggle: if same query, clear filter
        const next = currentQuery === query ? '' : query;
        router.push(next ? `/search?query=${encodeURIComponent(next)}` : '/search');
    };

    return (
        <div className={cn('snap-row py-1 px-1', className)}>
            {VIBE_FILTERS.map((f) => (
                <button
                    key={f.query}
                    onClick={() => handlePill(f.query)}
                    className={cn(
                        'pill',
                        currentQuery === f.query ? 'pill-active' : 'pill-default'
                    )}
                >
                    {f.label}
                </button>
            ))}
        </div>
    );
}
