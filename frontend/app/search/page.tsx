'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { homestayApi } from '@/lib/api-client';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import type { Response as HomestayResponse } from '@/src/lib/api/models';


function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || '';
    const [homestays, setHomestays] = useState<HomestaySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(query);

    useEffect(() => {
        const fetchHomestays = async () => {
            setLoading(true);
            try {
                const res = await homestayApi.search(query || undefined);
                // Map generated Response to HomestaySummary
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

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 max-w-2xl">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search homestays..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Search
                    </button>
                </form>
            </div>

            <h1 className="text-3xl font-bold mb-8 text-gray-800">
                {query ? `Stays in "${query}"` : 'All Homestays'}
            </h1>

            {homestays.length === 0 ? (
                <div className="text-center py-20">
                    <h2 className="text-xl text-gray-500">No homestays found matching your search.</h2>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {homestays.map((homestay) => (
                        <HomestayCard key={homestay.id} homestay={homestay} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div>Loading search...</div>}>
            <SearchResults />
        </Suspense>
    );
}

