import React from 'react';
import { motion } from 'framer-motion';
import { NormalizedPost } from '@/lib/adapters/normalizePost';
import { MapPin, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface TrendingStoriesProps {
    stories: NormalizedPost[];
}

function extractTitle(text: string): string {
    if (!text) return '';
    let cleaned = text.replace(/^[\s#\u{1F300}-\u{1F9FF}]+/iu, '').trim();
    const words = cleaned.split(/\s+/);
    const titleWordCount = Math.min(12, Math.max(8, Math.ceil(words.length * 0.3)));
    return words.slice(0, titleWordCount).join(' ');
}

export function TrendingStories({ stories }: TrendingStoriesProps) {
    if (!stories || stories.length === 0) return null;

    // Isolate top 3 stories for the grid
    const featured = stories[0];
    const sideStories = stories.slice(1, 3);

    return (
        <section className="py-12 md:py-16 bg-neutral-50">
            <div className="container mx-auto px-4 lg:px-6">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shadow-sm">
                        <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold font-heading tracking-tight text-neutral-900">Trending Stories</h2>
                        <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest">Captured by the community</p>
                    </div>
                </div>
                <div className="lg:hidden -mx-4 px-4 overflow-x-auto">
                    <div className="flex gap-4 snap-x snap-mandatory scroll-px-4 pb-2">
                        {stories.slice(0, 3).map((story, idx) => (
                            <Link
                                key={story.id}
                                href={`/community#post-${story.id}`}
                                className="snap-start shrink-0 w-[80vw] max-w-[420px]"
                            >
                                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-neutral-200 bg-white">
                                    <div className="relative aspect-[4/5]">
                                        {story.imageUrl ? (
                                            <OptimizedImage
                                                src={story.imageUrl}
                                                alt={story.location}
                                                width={900}
                                                className="w-full h-full"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center p-8">
                                                <p className="text-neutral-500 font-heading italic text-center text-lg">&quot;{story.caption}&quot;</p>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-neutral-700 uppercase tracking-wider">
                                                {idx === 0 ? 'Feature' : 'Trending'}
                                            </span>
                                            <span className="flex items-center gap-1 text-white/90 text-xs font-semibold">
                                                <MapPin className="w-3.5 h-3.5" /> {story.location}
                                            </span>
                                        </div>
                                        <p className="text-xl font-bold text-white leading-tight font-heading mb-3 line-clamp-3 [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)]">
                                            {extractTitle(story.caption)}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-white/30 overflow-hidden">
                                                {story.authorAvatar ? (
                                                    <img src={story.authorAvatar} alt={story.authorName} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                                        {story.authorName ? story.authorName.slice(0, 2).toUpperCase() : 'NB'}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-white/90 truncate">{story.authorName || 'Explorer'}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="hidden lg:grid grid-cols-12 gap-6 h-auto min-h-[500px]">
                    <Link href={`/community#post-${featured.id}`} className="lg:col-span-7">
                        <div className="h-full relative group rounded-2xl overflow-hidden shadow-lg cursor-pointer border border-neutral-200 bg-white">
                            {featured.imageUrl ? (
                                <OptimizedImage
                                    src={featured.imageUrl}
                                    alt={featured.location}
                                    width={900}
                                    className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center p-8">
                                    <p className="text-neutral-500 font-heading italic text-center text-lg">&quot;{featured.caption}&quot;</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-neutral-700 uppercase tracking-wider">
                                        Feature
                                    </span>
                                    <span className="flex items-center gap-1 text-white/90 text-sm font-medium">
                                        <MapPin className="w-4 h-4" /> {featured.location}
                                    </span>
                                </div>
                                <p className="text-2xl md:text-3xl font-bold text-white leading-tight font-heading mb-4 line-clamp-3 [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)]">
                                    {extractTitle(featured.caption)}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/30 shadow-md overflow-hidden">
                                        {featured.authorAvatar ? <img src={featured.authorAvatar} alt={featured.authorName} className="w-full h-full object-cover rounded-full" /> : (featured.authorName ? featured.authorName.slice(0, 2).toUpperCase() : 'NB')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{featured.authorName || 'Explorer'}</p>
                                        <p className="text-xs text-white/70 font-bold uppercase tracking-wider">Top Contributor</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {sideStories.map((story) => (
                            <Link key={story.id} href={`/community#post-${story.id}`} className="flex-1">
                                <div className="h-full relative group rounded-2xl overflow-hidden shadow-md cursor-pointer border border-neutral-200 bg-white">
                                    {story.imageUrl ? (
                                        <OptimizedImage
                                            src={story.imageUrl}
                                            alt={story.location}
                                            width={450}
                                            className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-neutral-100 border border-neutral-200 flex items-center justify-center p-6">
                                            <p className="text-neutral-500 font-heading italic text-center text-sm">&quot;{story.caption}&quot;</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                                    <div className="absolute inset-x-0 bottom-0 p-5">
                                        <span className="flex items-center gap-1 text-white/90 text-xs font-semibold mb-2 uppercase tracking-wide">
                                            <MapPin className="w-3.5 h-3.5" /> {story.location}
                                        </span>
                                        <p className="text-lg font-bold text-white leading-snug font-heading mb-3 line-clamp-2">
                                            {extractTitle(story.caption)}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/30 overflow-hidden">
                                                {story.authorAvatar ? <img src={story.authorAvatar} alt={story.authorName} className="w-full h-full object-cover rounded-full" /> : (story.authorName ? story.authorName.slice(0, 2).toUpperCase() : 'TR')}
                                            </div>
                                            <p className="text-sm font-bold text-white/90">{story.authorName || 'Explorer'}</p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {sideStories.length === 0 && (
                            <div className="flex-1 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 flex flex-col items-center justify-center text-neutral-400 p-6 text-center">
                                <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                                <p className="font-medium">More trending stories will appear here soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
