'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, MessageCircle, Share2, Heart } from 'lucide-react';
import { CommunityPost } from './types';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

function extractTitleAndExcerpt(text: string): { title: string; excerpt: string } {
    if (!text) return { title: '', excerpt: '' };
    let cleaned = text.replace(/^[\s#\u{1F300}-\u{1F9FF}]+/iu, '').trim();
    const words = cleaned.split(/\s+/);
    const titleWordCount = Math.min(12, Math.max(8, Math.ceil(words.length * 0.3)));
    const title = words.slice(0, titleWordCount).join(' ');
    const excerpt = words.slice(titleWordCount).join(' ').trim();
    return { title, excerpt: excerpt.slice(0, 200) };
}

export function FeaturedStoryCard({ post }: { post: CommunityPost }) {
    const { title, excerpt } = useMemo(() => extractTitleAndExcerpt(post.caption), [post.caption]);
    const hasImage = !!post.imageUrl || (post.images && post.images.length > 0);
    const mainImage = post.imageUrl || post.images?.[0]?.url;
    const [expanded, setExpanded] = useState(false);
    const hasLongContent = (post.caption?.length || 0) > 200;

    return (
        <Link href={`/community#post-${post.id}`} className="block">
            <article className={cn(
                'relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
                'transition-transform duration-180 hover:-translate-y-[2px]'
            )}>
                {/* Hero Image with Overlay */}
                <div className="relative aspect-[16/9] max-h-[460px] overflow-hidden group">
                    {hasImage && mainImage ? (
                        <OptimizedImage
                            src={mainImage}
                            alt={post.location || 'Featured story'}
                            width={900}
                            className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-neutral-100 flex items-center justify-center p-10">
                            <p className="text-neutral-600 font-heading italic text-center text-xl">&quot;{title}&quot;</p>
                        </div>
                    )}
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
                    
                    {/* Text overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-3">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/90 text-white">Featured Story</span>
                            {post.location && (
                                <span className="inline-flex items-center gap-1.5 text-white/80">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[60ch]">{post.location}</span>
                                </span>
                            )}
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight leading-tight mb-2 line-clamp-2">
                            {title || 'Untitled story'}
                        </h3>

                        {excerpt && (
                            <p className="text-sm text-white/80 leading-relaxed line-clamp-2">
                                {excerpt}
                            </p>
                        )}
                    </div>
                </div>

                {/* Meta Row below image */}
                <div className="p-4 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 overflow-hidden shrink-0">
                            {post.authorAvatar ? (
                                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                    {(post.authorName || 'NB').slice(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-neutral-900 truncate">{post.authorName || 'Explorer'}</p>
                            <div className="flex items-center gap-4 text-xs text-neutral-500 font-semibold mt-1">
                                <span className="inline-flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {post.likes || 0}</span>
                                <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {post.comments || 0}</span>
                                <span className="inline-flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> {post.shareCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
