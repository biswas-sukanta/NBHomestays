'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryFilterBar } from '@/components/category-filter-bar';
import { HomestayCarousel } from '@/components/homestay-carousel';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import Link from 'next/link';

// --- Destination Card Component ---
const DESTINATIONS = [
    { name: 'Darjeeling', image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800' },
    { name: 'Kalimpong', image: 'https://images.unsplash.com/photo-1626621341517-bbf3e99c0b2c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Kurseong', image: 'https://plus.unsplash.com/premium_photo-1697729606869-e58f00db11ee?auto=format&fit=crop&q=80&w=800' },
    { name: 'Mirik', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=800' },
    { name: 'Sittong', image: 'https://images.unsplash.com/photo-1681285312384-cbca6f2d5930?auto=format&fit=crop&q=80&w=800' },
];

function DestinationCard({ dest }: { dest: { name: string; image: string } }) {
    return (
        <Link href={`/search?tag=${encodeURIComponent(dest.name)}`} className="block w-[200px] shrink-0 snap-start group outline-none overflow-hidden rounded-2xl relative">
            <div className="w-full aspect-square bg-gray-800 relative z-0">
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                    <h3 className="text-xl font-bold text-white drop-shadow-md text-center">{dest.name}</h3>
                </div>
            </div>
        </Link>
    );
}

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const query = searchParams?.get('query') || '';
    const tag = searchParams?.get('tag') || '';

    const [searchTerm, setSearchTerm] = useState(query);
    const [loading, setLoading] = useState(true);

    // Dynamic View Grid
    const [searchGrid, setSearchGrid] = useState<HomestaySummary[]>([]);

    // Swimlane default states
    const [trending, setTrending] = useState<HomestaySummary[]>([]);
    const [offbeat, setOffbeat] = useState<HomestaySummary[]>([]);
    const [budgetFriendly, setBudgetFriendly] = useState<HomestaySummary[]>([]);

    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (query || tag) {
                    // Standard search execution
                    const endpoint = query
                        ? `/api/homestays/search?q=${encodeURIComponent(query)}&page=0&size=50`
                        : `/api/homestays/search?tag=${encodeURIComponent(tag)}&page=0&size=50`;

                    const res = await api.get(endpoint);
                    setSearchGrid(res.data);
                } else {
                    // Default Storefront Zostel Swimlanes
                    const [res1, res2, res3] = await Promise.all([
                        api.get('/api/homestays/search?tag=Trending Now&page=0&size=6'),
                        api.get('/api/homestays/search?tag=Explore Offbeat&page=0&size=6'),
                        api.get('/api/homestays/search?tag=Budget Friendly&page=0&size=6'),
                    ]);
                    setTrending(res1.data);
                    setOffbeat(res2.data);
                    setBudgetFriendly(res3.data);
                }
            } catch (err) {
                console.error("Failed to fetch discovery feeds", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [query, tag]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
        } else {
            router.push('/search');
        }
    };

    const isStorefront = !query && !tag;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* ── Search Banner ── */}
            <div className="relative bg-gradient-to-br from-[#111] to-[#1a1a1a] py-12 px-4 overflow-hidden border-b border-[#222]">
                <div className="container mx-auto max-w-4xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <p className="text-white/50 text-sm font-semibold tracking-widest uppercase">
                            {isStorefront ? 'Discover' : 'Results'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            {query ? `"${query}"` : tag ? tag : 'Explore North Bengal'}
                        </h1>
                    </motion.div>

                    {/* Search bar */}
                    <motion.form
                        onSubmit={handleSearch}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-6 flex gap-2 max-w-2xl"
                    >
                        <div className="flex-1 flex items-center gap-3 bg-[#111] border border-[#333] px-4 py-3 rounded-xl focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                            <Search className="w-5 h-5 text-gray-500 flex-none" />
                            <input
                                type="text"
                                placeholder="Where do you want to go?"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent text-white placeholder:text-gray-500 focus:outline-none text-base"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Search
                        </button>
                    </motion.form>
                </div>
            </div>

            {/* ── Category Filter Bar ── */}
            <CategoryFilterBar />

            {/* ── Dynamic Layout ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {loading ? (
                    <div className="w-full space-y-12">
                        <div className="flex gap-6 overflow-hidden pt-4 pb-8">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex flex-col space-y-3 w-[280px] shrink-0">
                                    <Skeleton className="relative w-full aspect-[4/3] rounded-2xl bg-[#1a1a1a]" />
                                    <Skeleton className="h-5 w-3/4 bg-[#1a1a1a]" />
                                    <Skeleton className="h-4 w-1/2 bg-[#1a1a1a]" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : isStorefront ? (
                    /* ZOSTEL STOREFRONT SWIMLANES */
                    <div className="space-y-14">
                        {/* Top Destinations Section */}
                        <section>
                            <div className="mb-4">
                                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">📍 Top Destinations</h2>
                                <p className="text-gray-400 text-sm">Discover stays in the most sought-after hills.</p>
                            </div>
                            <div className="flex gap-6 overflow-x-auto snap-x hide-scrollbar pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {DESTINATIONS.map(d => <DestinationCard key={d.name} dest={d} />)}
                            </div>
                        </section>

                        <HomestayCarousel
                            title="🔥 Trending Now"
                            homestays={trending}
                        />
                        <HomestayCarousel
                            title="🍃 Explore Offbeat"
                            homestays={offbeat}
                        />
                        <HomestayCarousel
                            title="🎒 Budget Friendly"
                            homestays={budgetFriendly}
                        />
                    </div>
                ) : (
                    /* FLAT GRID RESULTS */
                    <div className="w-full">
                        {searchGrid.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-12">
                                {searchGrid.map((h, i) => (
                                    <div key={h.id} className="h-full flex justify-center">
                                        <HomestayCard homestay={h} index={i} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-[#111] rounded-3xl border border-[#222] border-dashed">
                                <span className="text-5xl mb-4 block">🏡</span>
                                <h3 className="text-2xl font-bold mb-2 text-white">No stays found</h3>
                                <p className="text-gray-400 mb-6 max-w-md mx-auto">We couldn't find any properties matching your current filters. Try changing your destination or vibe.</p>
                                <button
                                    onClick={() => router.push('/search')}
                                    className="px-6 py-2.5 rounded-full border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-colors"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading Discovery...</div>}>
            <SearchResults />
        </Suspense>
    );
}
