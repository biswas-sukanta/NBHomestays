import React, { ReactNode } from 'react';

interface SharedPageBannerProps {
    title: string;
    subtitle?: string | ReactNode;
    children?: ReactNode;
    align?: 'center' | 'left';
}

export function SharedPageBanner({ title, subtitle, children, align = 'center' }: SharedPageBannerProps) {
    return (
        <div className={`w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12 md:py-16 px-4 flex flex-col justify-center ${align === 'center' ? 'items-center text-center' : 'items-start text-left'} relative overflow-hidden`}>
            {/* Subtle radial highlight for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.05)_0%,_transparent_60%)]" />

            <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 relative z-10 w-full">
                {align === 'center' ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-sm font-heading">{title}</h1>
                        {subtitle && (typeof subtitle === 'string' ? <p className="text-white/80 font-medium text-lg leading-snug">{subtitle}</p> : subtitle)}
                    </div>
                ) : (
                    <div className="flex flex-col items-start justify-center gap-2">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight drop-shadow-sm font-heading">{title}</h1>
                        {subtitle && (typeof subtitle === 'string' ? <p className="text-white/80 font-medium text-lg leading-snug">{subtitle}</p> : subtitle)}
                    </div>
                )}

                {children && (
                    <div className="mt-4 w-full">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
