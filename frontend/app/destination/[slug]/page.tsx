'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { SharedPageBanner } from '@/components/shared-page-banner'; // Assuming this exists for hero
import { HomestayCard } from '@/components/homestay-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { MapPin, Info } from 'lucide-react';

export default function DestinationPage() {
    const { slug } = useParams();

    const { data: destination, isLoading: destLoading } = useQuery({
        queryKey: ['destination', slug],
        queryFn: () => api.get(`/api/destinations/${slug}`).then(res => res.data)
    });

    const { data: homestaysPage, isLoading: homestaysLoading } = useQuery({
        queryKey: ['destination-homestays', slug],
        queryFn: async () => {
            const res = await api.get(`/api/destinations/${slug}/homestays`);
            // Safely extract the array whether it's wrapped in a Page object or not
            return res.data.content ? res.data.content : res.data;
        }
    });

    if (destLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB]">
                <div className="h-[60vh] bg-secondary/10 animate-pulse" />
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <Skeleton className="h-12 w-64 mb-6" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-3/4 mb-12" />
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!destination) return <div className="p-20 text-center">Destination not found</div>;

    const homestays = Array.isArray(homestaysPage) ? homestaysPage : [];

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Edge-to-Edge Hero Banner */}
            <div className="relative h-[70vh] w-full overflow-hidden">
                <img
                    src={`/destinations/${destination.localImageName}`}
                    alt={destination.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=1600';
                    }}
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-sm font-medium mb-4">
                            Explore {destination.district}
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl italic tracking-tight">
                            {destination.heroTitle}
                        </h1>
                        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light drop-shadow">
                            {destination.description}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-gray-100 pb-8">
                    <div>
                        <div className="flex items-center gap-2 text-[#004d00] font-medium mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{destination.name}, {destination.district}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Available Homestays</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {destination.tags.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {homestaysLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-3xl" />)}
                    </div>
                ) : homestays.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {homestays.map((homestay: any) => (
                            <HomestayCard key={homestay.id} homestay={homestay} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <Info className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-600 mb-2">No listings yet in {destination.name}</h3>
                        <p className="text-gray-400">Be the first to host a stay here!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
