'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { homestayApi } from '@/lib/api-client';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import { VibeFilterPills } from '@/components/vibe-filter-pills';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';

// ── Shimmer skeleton card ──────────────────────────
function SkeletonCard() {
    return (
        <div className="rounded-2xl overflow-hidden border border-gray-100">
            <div className="h-60 skeleton-shimmer" />
            <div className="p-4 space-y-3">
                <div className="h-3 w-20 rounded skeleton-shimmer" />
                <div className="h-5 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-full rounded skeleton-shimmer" />
                <div className="h-3 w-2/3 rounded skeleton-shimmer" />
            </div>
        </div>
    );
}

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || '';
    const [homestays, setHomestays] = useState<HomestaySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(query);

    useEffect(() => {
        setSearchTerm(query); // sync pill selection → input
    }, [query]);

    useEffect(() => {
        const fetchHomestays = async () => {
            setLoading(true);
            try {
                const res = await homestayApi.search(query || undefined);
                const data: HomestaySummary[] = (res.data as any[]).map((h: any) => ({
                    id: h.id,
                    name: h.name || '',
                    description: h.description || '',
                    pricePerNight: h.pricePerNight || 0,
                    latitude: h.latitude || 0,
                    longitude: h.longitude || 0,
                    amenities: h.amenities || {},
                    photoUrls: h.photoUrls || [],
                    vibeScore: h.vibeScore || 0,
                    status: h.status || 'APPROVED',
                }));
                setHomestays(data);
            } catch (error) {
                console.error('Failed to fetch homestays', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHomestays();
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* ── Search banner ── */}
            <div className="relative bg-gradient-to-br from-[oklch(0.20_0.10_150)] to-[oklch(0.30_0.14_160)] py-12 px-4 overflow-hidden">
                {/* Decorative blur blob */}
                <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
                <div className="container mx-auto max-w-4xl relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <p className="text-white/60 text-sm font-semibold tracking-widest uppercase">
                            {query ? `Results for` : 'Explore all'}
                        </p>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            {query ? `"${query}"` : 'All Homestays'}
                        </h1>
                    </motion.div>

                    {/* Search bar */}
                    <motion.form
                        onSubmit={handleSearch}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-6 flex gap-2"
                    >
                        <div className="flex-1 flex items-center gap-3 glass-card px-4 py-3 rounded-xl">
                            <Search className="w-4 h-4 text-muted-foreground flex-none" />
                            <input
                                type="text"
                                placeholder="Search homestays..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm font-medium"
                                aria-label="Search homestays"
                            />
                        </div>
                        <button
                            type="submit"
                            id="search-submit-btn"
                            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm"
                        >
                            Search
                        </button>
                    </motion.form>
                </div>
            </div>

            {/* ── Vibe Filter Pills ── */}
            <div className="container mx-auto max-w-5xl px-4 pt-5 pb-2">
                <Suspense fallback={null}>
                    <VibeFilterPills />
                </Suspense>
            </div>

            {/* ── Grid ── */}
            <div className="container mx-auto max-w-5xl px-4 py-6">
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
                    </div>
                ) : homestays.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-24 text-center gap-4"
                    >
                        <div className="text-5xl">🏡</div>
                        <h2 className="text-xl font-bold text-foreground">No homestays found</h2>
                        <p className="text-muted-foreground">Try a different destination or vibe filter.</p>
                        <button
                            onClick={() => router.push('/search')}
                            className="mt-2 px-6 py-2.5 rounded-full border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors"
                        >
                            Clear filters
                        </button>
                    </motion.div>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground mb-5 font-medium">
                            {homestays.length} {homestays.length === 1 ? 'stay' : 'stays'} found
                        </p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {homestays.map((homestay, i) => (
                                <HomestayCard key={homestay.id} homestay={homestay} index={i} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto max-w-5xl px-4 py-12">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="rounded-2xl overflow-hidden">
                            <div className="h-60 skeleton-shimmer" />
                            <div className="p-4 space-y-3">
                                <div className="h-3 w-20 rounded skeleton-shimmer" />
                                <div className="h-5 w-3/4 rounded skeleton-shimmer" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        }>
            <SearchResults />
        </Suspense>
    );
}
