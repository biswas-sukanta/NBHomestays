'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, MessageCircle, Share2, Heart } from 'lucide-react';
import Image from 'next/image';
import { CommunityPost } from './types';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
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

interface CollagePostCardProps {
    post: CommunityPost;
    onOpenComments?: (postId: string) => void;
}

export function CollagePostCard({ post, onOpenComments }: CollagePostCardProps) {
    const { title, excerpt } = useMemo(() => extractTitleAndExcerpt(post.caption), [post.caption]);
    const images = post.images || [];
    const imageCount = images.length;
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [expanded, setExpanded] = useState(false);
    const hasLongContent = (post.caption?.length || 0) > 200;

    const renderCollage = () => {
        if (imageCount === 0) return null;

        // 1 IMAGE: aspect-[4/5], max-h-420px
        if (imageCount === 1) {
            return (
                <div className="relative w-full aspect-[4/5] max-h-[420px] overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxIndex(0)}>
                    <Image src={images[0].url} alt={post.location || 'Post image'} fill sizes="(min-width: 768px) 720px, 100vw" className="object-cover" loading="lazy" />
                </div>
            );
        }

        // 2 IMAGES: grid-cols-2, aspect-square, max-h-300px
        if (imageCount === 2) {
            return (
                <div className="grid grid-cols-2 gap-2 max-h-[300px]">
                    {images.slice(0, 2).map((img, idx) => (
                        <div key={idx} className="relative aspect-square overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                            <Image src={img.url} alt={`${post.location} - ${idx + 1}`} fill sizes="50vw" className="object-cover" loading="lazy" />
                        </div>
                    ))}
                </div>
            );
        }

        // 3 IMAGES: left row-span-2 aspect-[4/5], right stacked squares
        if (imageCount === 3) {
            return (
                <div className="grid grid-cols-2 gap-2 max-h-[420px]">
                    <div className="relative row-span-2 aspect-[4/5] overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxIndex(0)}>
                        <Image src={images[0].url} alt={`${post.location} - 1`} fill sizes="50vw" className="object-cover" loading="lazy" />
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxIndex(1)}>
                        <Image src={images[1].url} alt={`${post.location} - 2`} fill sizes="50vw" className="object-cover" loading="lazy" />
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxIndex(2)}>
                        <Image src={images[2].url} alt={`${post.location} - 3`} fill sizes="50vw" className="object-cover" loading="lazy" />
                    </div>
                </div>
            );
        }

        // 4+ IMAGES: 2x2 grid, aspect-square
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-2 max-h-[420px]">
                {images.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                        <Image src={img.url} alt={`${post.location} - ${idx + 1}`} fill sizes="50vw" className="object-cover" loading="lazy" />
                        {idx === 3 && imageCount > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                                <span className="text-white font-bold text-xl">+{imageCount - 4}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                whileHover={{ y: -2 }}
                className="relative bg-white overflow-hidden rounded-2xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-transform duration-180"
            >
                {/* Image Collage */}
                <div className="p-4">
                    {renderCollage()}
                </div>

                {/* Content Block */}
                <div className="px-4 pb-4">
                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1">
                            Collage
                        </span>
                        {(post.tags ?? []).slice(0, 2).map(tag => (
                            <span key={tag} className="inline-flex items-center bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Headline */}
                    <h3 className="text-xl font-bold font-heading text-neutral-900 leading-tight tracking-tight mb-2 line-clamp-2">
                        {title || 'Untitled story'}
                    </h3>

                    {/* Excerpt with Read more */}
                    <div className="text-sm text-neutral-800 leading-relaxed mb-3">
                        <span className={expanded ? '' : 'line-clamp-3'}>
                            {excerpt || post.caption}
                        </span>
                        {hasLongContent && (
                            <button onClick={() => setExpanded(!expanded)} className="ml-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                            {post.authorAvatar ? (
                                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                            ) : (post.authorName || 'NB').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900 truncate">{post.authorName || 'Explorer'}</p>
                            <p className="text-xs text-neutral-500">{post.location}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-500 font-semibold">
                            <span className="inline-flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likes || 0}</span>
                            <span className="inline-flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.comments || 0}</span>
                        </div>
                    </div>
                </div>
            </motion.article>

            {lightboxIndex !== null && (
                <ImageLightbox images={images.map(img => img.url)} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}
        </>
    );
}
