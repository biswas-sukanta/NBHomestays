import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    width?: number; // Optional ImageKit constraints
    quality?: number;
}

export function OptimizedImage({ src, alt, className, width, quality = 80, ...props }: OptimizedImageProps) {
    // 1. Transform ImageKit URLs directly for next-gen formats and compression
    let optimizedSrc = src;

    // Only optimize if it's our ImageKit domain (prevent mangling external/blob URLs)
    if (src.includes('ik.imagekit.io')) {
        const basePath = src.split('?')[0]; // strip existing query params if any

        const params = new URLSearchParams();
        params.append('tr', `f-auto,q-${quality}${width ? `,w-${width}` : ''}`);

        optimizedSrc = `${basePath}?${params.toString()}`;
    }

    return (
        <img
            src={optimizedSrc}
            alt={alt}
            className={cn('object-cover w-full h-full transition-opacity duration-300', className)}
            decoding="async"
            loading="lazy"
            {...props}
        />
    );
}
