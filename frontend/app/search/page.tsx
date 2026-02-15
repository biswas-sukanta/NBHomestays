'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { homestayApi } from '@/lib/api-client';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import type { Response as HomestayResponse } from '@/src/lib/api/models';


function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || '';
    const [homestays, setHomestays] = useState<HomestaySummary[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="container mx-auto px-4 py-8">
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

