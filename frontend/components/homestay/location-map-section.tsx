'use client';

import HomestayMapWrapper from '@/components/HomestayMapWrapper';
import { MapPin } from 'lucide-react';

interface LocationMapSectionProps {
    latitude: number;
    longitude: number;
    locationName: string;
}

export function LocationMapSection({ latitude, longitude, locationName }: LocationMapSectionProps) {
    if (!latitude || !longitude) return null;

    return (
        <section className="py-8 border-b border-gray-200">
            <h2 className="text-[22px] font-bold text-gray-900 mb-6 tracking-tight">Where you'll be</h2>

            {/* 
              CRITICAL Z-INDEX FIX: 
              relative z-0 isolates the map stack into its own containing block,
              preventing Leaflet's high z-index tiles from bleeding over the fixed z-50 Navbar. 
            */}
            <div className="relative z-0 rounded-[24px] overflow-hidden shadow-sm border border-gray-200 h-[300px] md:h-[500px] w-full bg-gray-100">
                <HomestayMapWrapper
                    latitude={latitude}
                    longitude={longitude}
                    locationName={locationName}
                />

                {/* Stunning Frosted Glass Overlay */}
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-80 bg-white/85 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/50 z-[10]">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0 text-primary mt-0.5">
                            <MapPin className="w-5 h-5 fill-primary/20" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-[17px] leading-tight mb-1">Neighborhood</h3>
                            <p className="text-gray-700 text-sm font-medium leading-snug">
                                {locationName || 'North Bengal'}
                            </p>
                            <p className="text-gray-500 text-[13px] mt-2">
                                Exact location provided after booking.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
