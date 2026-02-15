'use client';

import * as React from 'react';
import Link from 'next/link';
import { MapPin, Star, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompareStore } from '@/store/useCompareStore';
import { cn } from '@/lib/utils'; // Assuming this exists, based on booking-form.tsx

export interface HomestaySummary {
    id: string;
    name: string;
    description: string;
    pricePerNight: number;
    latitude: number;
    longitude: number;
    amenities: Record<string, boolean>;
    photoUrls: string[];
    vibeScore: number;
    status: string;
}

interface HomestayCardProps {
    homestay: HomestaySummary;
}

export function HomestayCard({ homestay }: HomestayCardProps) {
    const { addToCompare, selectedIds } = useCompareStore();
    const isSelected = selectedIds.includes(homestay.id);

    const handleCompare = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation
        addToCompare(homestay.id);
    };

    return (
        <Link href={`/homestays/${homestay.id}`} className="group block relative">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 h-full flex flex-col">
                <div className="h-64 w-full bg-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <img
                        src={homestay.photoUrls?.[0] || `https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3`}
                        alt={homestay.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Vibe Score Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold flex items-center shadow-sm z-10">
                        <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                        {homestay.vibeScore || 4.5}
                    </div>

                    {/* Compare Button */}
                    <Button
                        variant="secondary"
                        size="icon"
                        className={cn(
                            "absolute top-4 left-4 z-20 h-8 w-8 rounded-full shadow-md transition-all",
                            isSelected ? "bg-green-500 text-white hover:bg-green-600" : "bg-white/90 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100"
                        )}
                        onClick={handleCompare}
                        title="Add to Compare"
                    >
                        <Scale className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-green-600 transition-colors">
                            {homestay.name}
                        </h3>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        North Bengal Hills
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        <div>
                            <span className="text-lg font-bold text-gray-900">₹{homestay.pricePerNight}</span>
                            <span className="text-gray-500 text-sm"> / night</span>
                        </div>
                        <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details →
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
