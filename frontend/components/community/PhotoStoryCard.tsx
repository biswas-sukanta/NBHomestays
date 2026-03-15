'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Heart, MessageCircle } from 'lucide-react';
import { CommunityPost } from './types';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { OptimizedImage } from '@/components/ui/optimized-image';
const ImageLightbox = dynamic(() => import('@/components/community/ImageLightbox').then(m => m.ImageLightbox), { ssr: false });

function extractTitleAndExcerpt(text: string): { title: string; excerpt: string } {
    if (!text) return { title: '', excerpt: '' };
    let cleaned = text.replace(/^[\s#\u{1F300}-\u{1F9FF}]+/iu, '').trim();
    const words = cleaned.split(/\s+/);
    const titleWordCount = Math.min(12, Math.max(8, Math.ceil(words.length * 0.3)));
    const title = words.slice(0, titleWordCount).join(' ');
    const excerpt = words.slice(titleWordCount).join(' ').trim();
    return { title, excerpt: excerpt.slice(0, 200) };
}

export function PhotoStoryCard({ post }: { post: CommunityPost }) {
    const { title } = useMemo(() => extractTitleAndExcerpt(post.caption), [post.caption]);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const images = post.images || (post.imageUrl ? [{ url: post.imageUrl }] : []);
    const mainImage = images[0]?.url;

    return (
        <>
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={cn(
                    'relative overflow-hidden rounded-2xl bg-white',
                    'shadow-lg hover:shadow-xl',
                    'border border-neutral-200 transition-all duration-300 hover:-translate-y-1'
                )}
            >
                {/* Large Image */}
                <div
                    className="relative aspect-[4/5] cursor-pointer overflow-hidden group"
                    onClick={() => setLightboxIndex(0)}
                >
                    {mainImage && (
                        <OptimizedImage
                            src={mainImage}
                            alt={post.location}
                            width={900}
                            className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                        />
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Overlay Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest">
                                Photo Story
                            </span>
                            {images.length > 1 && (
                                <span className="text-white/70 text-xs font-medium">
                                    {images.length} photos
                                </span>
                            )}
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold font-heading text-white leading-tight tracking-tight mb-2 line-clamp-2">
                            {title}
                        </h3>
                        {post.location && (
                            <div className="flex items-center gap-1.5 text-white/70 text-sm">
                                <MapPin className="w-4 h-4" />
                                <span>{post.location}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Minimal Meta Bar */}
                <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                            {post.authorAvatar ? (
                                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                            ) : post.authorName?.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-neutral-900">{post.authorName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-neutral-500 text-sm">
                        <span className="inline-flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likes || 0}</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.comments || 0}</span>
                    </div>
                </div>
            </motion.article>

            {lightboxIndex !== null && images.length > 0 && (
                <ImageLightbox images={images.map(img => img.url)} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}
        </>
    );
}
