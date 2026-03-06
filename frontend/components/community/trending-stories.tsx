import React from 'react';
import { motion } from 'framer-motion';
import { NormalizedPost } from '@/lib/adapters/normalizePost';
import { MapPin, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface TrendingStoriesProps {
    stories: NormalizedPost[];
}

export function TrendingStories({ stories }: TrendingStoriesProps) {
    if (!stories || stories.length === 0) return null;

    // Isolate top 3 stories for the grid
    const featured = stories[0];
    const sideStories = stories.slice(1, 3);

    return (
        <section className="py-12 md:py-16">
            <div className="container mx-auto px-4 lg:px-6">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl">
                        <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold font-serif tracking-tight text-white">Trending Stories</h2>
                        <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Captured by the community</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto min-h-[500px]">
                    {/* Featured (Left Side) - Takes 7/12 cols */}
                    <div className="lg:col-span-7 h-[400px] lg:h-full relative group rounded-2xl overflow-hidden shadow-lg cursor-pointer">
                        {featured.imageUrl ? (
                            <img
                                src={`${featured.imageUrl}?tr=w-1000,q-75,f-webp`}
                                alt={featured.location}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-zinc-900 border border-white/10 flex items-center justify-center p-8">
                                <p className="text-zinc-500 font-serif italic text-center text-lg">&quot;{featured.caption}&quot;</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/20">
                                    Feature
                                </span>
                                <span className="flex items-center gap-1 text-white/90 text-sm font-medium">
                                    <MapPin className="w-4 h-4" /> {featured.location}
                                </span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white leading-tight font-serif mb-4 line-clamp-3 
                                [text-shadow:_0_2px_10px_rgb(0_0_0_/_40%)]">
                                {featured.caption}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/50 shadow-md overflow-hidden">
                                    {featured.authorAvatar ? <img src={featured.authorAvatar} alt={featured.authorName} className="w-full h-full object-cover rounded-full" /> : (featured.authorName ? featured.authorName.slice(0, 2).toUpperCase() : 'NB')}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{featured.authorName || 'Explorer'}</p>
                                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Top Contributor</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {sideStories.map((story, i) => (
                            <div key={story.id} className="flex-1 relative group rounded-2xl overflow-hidden shadow-md cursor-pointer h-[250px] lg:h-auto">
                                {story.imageUrl ? (
                                    <img
                                        src={`${story.imageUrl}?tr=w-600,q-70,f-webp`}
                                        alt={story.location}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-zinc-900 border border-white/5 flex items-center justify-center p-6">
                                        <p className="text-zinc-500 font-serif italic text-center text-sm">&quot;{story.caption}&quot;</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                                <div className="absolute inset-x-0 bottom-0 p-5">
                                    <span className="flex items-center gap-1 text-white/90 text-xs font-semibold mb-2 uppercase tracking-wide">
                                        <MapPin className="w-3.5 h-3.5" /> {story.location}
                                    </span>
                                    <p className="text-lg font-bold text-white leading-snug font-serif mb-3 line-clamp-2">
                                        {story.caption}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/10 overflow-hidden">
                                            {story.authorAvatar ? <img src={story.authorAvatar} alt={story.authorName} className="w-full h-full object-cover rounded-full" /> : (story.authorName ? story.authorName.slice(0, 2).toUpperCase() : 'TR')}
                                        </div>
                                        <p className="text-sm font-bold text-zinc-100">{story.authorName || 'Explorer'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {sideStories.length === 0 && (
                            <div className="flex-1 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
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
