import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    width?: number; // Optional ImageKit constraints
    quality?: number;
    /** Media variants for responsive srcset */
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
}

export function OptimizedImage({ 
    src, 
    alt, 
    className, 
    width, 
    quality = 80,
    thumbnail,
    small,
    medium,
    large,
    ...props 
}: OptimizedImageProps) {
    // 1. Transform ImageKit URLs directly for next-gen formats and compression
    let optimizedSrc = src;

    // Only optimize if it's our ImageKit domain (prevent mangling external/blob URLs)
    if (src.includes('ik.imagekit.io')) {
        const basePath = src.split('?')[0]; // strip existing query params if any

        const params = new URLSearchParams();
        params.append('tr', `f-auto,q-${quality}${width ? `,w-${width}` : ''}`);

        optimizedSrc = `${basePath}?${params.toString()}`;
    }

    // Build srcset from variants if available
    const srcSet = (small && medium && large) 
        ? `${small} 480w, ${medium} 800w, ${large} 1200w`
        : undefined;

    const sizes = srcSet ? '(max-width: 640px) 480px, (max-width: 1024px) 800px, 1200px' : undefined;

    return (
        <img
            src={optimizedSrc}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            className={cn('object-cover w-full h-full transition-opacity duration-300', className)}
            decoding="async"
            loading="lazy"
            {...props}
        />
    );
}
