import React from 'react';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import { CarouselWrapper } from '@/components/ui/carousel-wrapper';

interface HomestaySwimlaneProps {
    title: string;
    subtitle?: string;
    homestays: HomestaySummary[];
}

export function HomestaySwimlane({ title, subtitle, homestays }: HomestaySwimlaneProps) {
    if (!homestays || homestays.length === 0) return null;

    return (
        <CarouselWrapper
            headerLeft={
                <div className="flex flex-col gap-1">
                    <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tight text-slate-900">{title}</h2>
                    {subtitle && <p className="text-slate-500 text-sm md:text-base font-medium">{subtitle}</p>}
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

