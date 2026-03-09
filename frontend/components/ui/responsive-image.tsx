import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  alt: string;
  thumbnail?: string;
  small?: string;
  medium?: string;
  large?: string;
  className?: string;
  sizes?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
}

/**
 * Responsive image component with srcset and lazy loading.
 * Uses ImageKit media variants for optimal device resolution.
 * 
 * Usage:
 * <ResponsiveImage
 *   src={media.originalUrl}
 *   thumbnail={media.thumbnail}
 *   small={media.small}
 *   medium={media.medium}
 *   large={media.large}
 *   alt="Post image"
 *   sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
 * />
 */
export function ResponsiveImage({
  src,
  alt,
  thumbnail,
  small,
  medium,
  large,
  className,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  aspectRatio = 'auto',
  ...props
}: ResponsiveImageProps) {
  // Build srcset from available variants
  const srcSet = [
    thumbnail && `${thumbnail} 200w`,
    small && `${small} 480w`,
    medium && `${medium} 800w`,
    large && `${large} 1200w`,
    src && `${src} 1920w`,
  ].filter(Boolean).join(', ');

  // Fallback to original src if no variants
  const fallbackSrc = medium || small || thumbnail || src;

  // Aspect ratio classes
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    auto: '',
  };

  return (
    <img
      src={fallbackSrc}
      srcSet={srcSet || undefined}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(
        'object-cover w-full h-auto transition-opacity duration-300',
        aspectClasses[aspectRatio],
        className
      )}
      {...props}
    />
  );
}

/**
 * Responsive image gallery for post media.
 * Handles 1-4 images with appropriate layouts.
 */
interface MediaGalleryProps {
  media: Array<{
    id: string;
    originalUrl: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  }>;
  className?: string;
}

export function MediaGallery({ media, className }: MediaGalleryProps) {
  if (!media || media.length === 0) return null;

  // Single image - full width
  if (media.length === 1) {
    const img = media[0];
    return (
      <div className={cn('w-full', className)}>
        <ResponsiveImage
          src={img.originalUrl}
          thumbnail={img.thumbnail}
          small={img.small}
          medium={img.medium}
          large={img.large}
          alt="Post image"
          aspectRatio="video"
          sizes="100vw"
        />
      </div>
    );
  }

  // Two images - side by side
  if (media.length === 2) {
    return (
      <div className={cn('grid grid-cols-2 gap-1', className)}>
        {media.map((img, idx) => (
          <ResponsiveImage
            key={img.id}
            src={img.originalUrl}
            thumbnail={img.thumbnail}
            small={img.small}
            medium={img.medium}
            large={img.large}
            alt={`Post image ${idx + 1}`}
            aspectRatio="square"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ))}
      </div>
    );
  }

  // Three images - 2/3 left, 1/3 right stacked
  if (media.length === 3) {
    return (
      <div className={cn('grid grid-cols-3 gap-1 h-64', className)}>
        <div className="col-span-2">
          <ResponsiveImage
            src={media[0].originalUrl}
            thumbnail={media[0].thumbnail}
            small={media[0].small}
            medium={media[0].medium}
            large={media[0].large}
            alt="Post image 1"
            className="h-full"
            aspectRatio="auto"
            sizes="66vw"
          />
        </div>
        <div className="flex flex-col gap-1">
          <ResponsiveImage
            src={media[1].originalUrl}
            thumbnail={media[1].thumbnail}
            small={media[1].small}
            medium={media[1].medium}
            large={media[1].large}
            alt="Post image 2"
            className="h-1/2"
            aspectRatio="auto"
            sizes="33vw"
          />
          <ResponsiveImage
            src={media[2].originalUrl}
            thumbnail={media[2].thumbnail}
            small={media[2].small}
            medium={media[2].medium}
            large={media[2].large}
            alt="Post image 3"
            className="h-1/2"
            aspectRatio="auto"
            sizes="33vw"
          />
        </div>
      </div>
    );
  }

  // Four+ images - 2x2 grid, show first 4
  return (
    <div className={cn('grid grid-cols-2 gap-1 h-64', className)}>
      {media.slice(0, 4).map((img, idx) => (
        <ResponsiveImage
          key={img.id}
          src={img.originalUrl}
          thumbnail={img.thumbnail}
          small={img.small}
          medium={img.medium}
          large={img.large}
          alt={`Post image ${idx + 1}`}
          className={cn('h-32', idx >= 3 && media.length > 4 && 'opacity-50')}
          aspectRatio="auto"
          sizes="50vw"
        />
      ))}
      {media.length > 4 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-sm px-2 py-1 rounded">
          +{media.length - 4} more
        </div>
      )}
    </div>
  );
}
