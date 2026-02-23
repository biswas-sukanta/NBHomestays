import React, { ReactNode } from 'react';

interface SharedPageBannerProps {
    title: string;
    subtitle?: string | ReactNode;
    children?: ReactNode;
    align?: 'center' | 'left';
}

export function SharedPageBanner({ title, subtitle, children, align = 'center' }: SharedPageBannerProps) {
    return (
        <div className={`w-full bg-[#004d00] text-white py-12 md:py-16 px-4 flex flex-col justify-center ${align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
            <div className="w-full max-w-3xl mx-auto flex flex-col gap-4 relative z-10 w-full">
                {align === 'center' ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">{title}</h1>
                        {subtitle && (typeof subtitle === 'string' ? <p className="text-white/80 font-medium text-lg leading-snug">{subtitle}</p> : subtitle)}
                    </div>
                ) : (
                    <div className="flex flex-col items-start justify-center gap-2">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">{title}</h1>
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
