'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, MessageCircle, Share2, Heart } from 'lucide-react';
import { CommunityPost } from './types';
import { cn } from '@/lib/utils';

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

    return (
        <Link href={`/community#post-${post.id}`} className="block">
            <article className={cn(
                'relative overflow-hidden rounded-3xl ring-1 ring-white/10 bg-zinc-950 shadow-[0_12px_40px_rgba(0,0,0,0.12)]',
                'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(0,0,0,0.16)]'
            )}>
                <div className="relative aspect-[16/9] overflow-hidden group">
                    {hasImage && mainImage ? (
                        <Image
                            src={mainImage}
                            alt={post.location}
                            fill
                            sizes="(min-width: 1024px) 900px, 100vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 to-zinc-900 border border-white/10 flex items-center justify-center p-10">
                            <p className="text-zinc-300 font-serif italic text-center text-xl">&quot;{title}&quot;</p>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
                </div>

                <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 text-white/90 text-xs font-semibold uppercase tracking-widest mb-3">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">Featured Story</span>
                        {post.location && (
                            <span className="inline-flex items-center gap-1.5 text-zinc-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[60ch]">{post.location}</span>
                            </span>
                        )}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-white leading-tight mb-3 line-clamp-2">
                        {title || 'Untitled story'}
                    </h3>

                    {excerpt && (
                        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-5 line-clamp-2">
                            {excerpt}
                        </p>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-zinc-800 ring-1 ring-white/10 overflow-hidden shrink-0">
                            {post.authorAvatar ? (
                                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                    {(post.authorName || 'NB').slice(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">{post.authorName || 'Explorer'}</p>
                            <div className="flex items-center gap-4 text-xs text-zinc-400 font-semibold mt-1">
                                <span className="inline-flex items-center gap-1.5"><Heart className="w-4 h-4" /> {post.likes || 0}</span>
                                <span className="inline-flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {post.comments || 0}</span>
                                <span className="inline-flex items-center gap-1.5"><Share2 className="w-4 h-4" /> {post.shareCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}
