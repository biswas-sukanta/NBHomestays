import React from 'react';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import { CarouselWrapper } from '@/components/ui/carousel-wrapper';

interface HomestaySwimlaneProps {
    title: string;
    emoji: string;
    homestays: HomestaySummary[];
}

export function HomestaySwimlane({ title, emoji, homestays }: HomestaySwimlaneProps) {
    if (!homestays || homestays.length === 0) return null;

    return (
        <CarouselWrapper
            headerLeft={
                <div className="flex items-center gap-3">
                    <span className="text-3xl" aria-hidden="true">{emoji}</span>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">{title}</h2>
                </div>
            }
        >
            {homestays.map((homestay, idx) => (
                <div key={homestay.id} className="w-[260px] sm:w-[280px] shrink-0 snap-start">
                    <HomestayCard homestay={homestay} index={idx} />
                </div>
            ))}
        </CarouselWrapper>
    );
}
