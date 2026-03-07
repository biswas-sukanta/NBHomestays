'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'meals', label: 'Meals' },
    { id: 'location', label: 'Location' },
    { id: 'host', label: 'Host' },
    { id: 'qa', label: 'Q&A' },
];

export function SectionNav() {
    const [activeId, setActiveId] = React.useState('overview');
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        // Show nav only after scrolling past the gallery area
        const handleScroll = () => {
            setIsVisible(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    React.useEffect(() => {
        const observers: IntersectionObserver[] = [];

        SECTIONS.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (!el) return;

            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setActiveId(id);
                    }
                },
                { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
            );

            observer.observe(el);
            observers.push(observer);
        });

        return () => {
            observers.forEach(o => o.disconnect());
        };
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = 120; // account for sticky nav + page nav
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    return (
        <nav
            className={cn(
                'hidden md:block sticky top-[64px] z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all duration-300',
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
            )}
        >
            <div className="container mx-auto max-w-[1280px] px-6">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0">
                    {SECTIONS.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => scrollTo(id)}
                            className={cn(
                                'px-4 py-3.5 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 hover:text-gray-900',
                                activeId === id
                                    ? 'text-gray-900 border-gray-900 font-semibold'
                                    : 'text-gray-500 border-transparent hover:border-gray-300'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}
