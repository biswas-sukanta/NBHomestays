import React from 'react';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import { CarouselWrapper } from '@/components/ui/carousel-wrapper';

interface HomestaySwimlaneProps {
    title: string;
    homestays: HomestaySummary[];
}

export function HomestaySwimlane({ title, homestays }: HomestaySwimlaneProps) {
    if (!homestays || homestays.length === 0) return null;

    return (
        <CarouselWrapper
            headerLeft={
                <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-slate-900">{title}</h2>
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

