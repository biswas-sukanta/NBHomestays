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
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-serif tracking-tight text-gray-900">Trending Right Now</h2>
                        <p className="text-sm text-gray-500 font-medium">Stories capturing the community&apos;s imagination</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto min-h-[500px]">
                    {/* Featured (Left Side) - Takes 7/12 cols */}
                    <div className="lg:col-span-7 h-[400px] lg:h-full relative group rounded-2xl overflow-hidden shadow-lg cursor-pointer">
                        <img
                            src={featured.imageUrl.startsWith('/') ? featured.imageUrl : `https://ik.imagekit.io/y4v82f1t1/tr:w-1000,q-75,f-webp/${featured.imageUrl}`}
                            alt={featured.location}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
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
                                {featured.title || featured.caption}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/50 shadow-md">
                                    {featured.authorAvatar ? <img src={featured.authorAvatar} alt={featured.author} className="w-full h-full object-cover rounded-full" /> : (featured.author ? featured.author.slice(0, 2).toUpperCase() : 'NB')}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{featured.author || 'Explorer'}</p>
                                    <p className="text-xs text-gray-300">Top Contributor</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stacked Side Stories (Right Side) - Takes 5/12 cols */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {sideStories.map((story, i) => (
                            <div key={story.id} className="flex-1 relative group rounded-2xl overflow-hidden shadow-md cursor-pointer h-[250px] lg:h-auto">
                                <img
                                    src={story.imageUrl.startsWith('/') ? story.imageUrl : `https://ik.imagekit.io/y4v82f1t1/tr:w-600,q-70,f-webp/${story.imageUrl}`}
                                    alt={story.location}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                                <div className="absolute inset-x-0 bottom-0 p-5">
                                    <span className="flex items-center gap-1 text-white/90 text-xs font-semibold mb-2 uppercase tracking-wide">
                                        <MapPin className="w-3.5 h-3.5" /> {story.location}
                                    </span>
                                    <p className="text-lg font-bold text-white leading-snug font-serif mb-3 line-clamp-2">
                                        {story.title || story.caption}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/50">
                                            {story.authorAvatar ? <img src={story.authorAvatar} alt={story.author} className="w-full h-full object-cover rounded-full" /> : (story.author ? story.author.slice(0, 2).toUpperCase() : 'TR')}
                                        </div>
                                        <p className="text-sm font-medium text-gray-100">{story.author || 'Explorer'}</p>
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
