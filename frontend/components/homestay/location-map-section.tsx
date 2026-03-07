'use client';

import HomestayMapWrapper from '@/components/HomestayMapWrapper';
import { MapPin, Navigation, Clock, ExternalLink } from 'lucide-react';

interface LocationMapSectionProps {
    latitude: number;
    longitude: number;
    locationName: string;
    nearbyHighlights?: string[];
}

export function LocationMapSection({ latitude, longitude, locationName, nearbyHighlights }: LocationMapSectionProps) {
    if (!latitude || !longitude) return null;

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    return (
        <section id="location" className="py-10 border-b border-gray-200">
            <h2 className="text-[22px] font-bold text-gray-900 mb-6 tracking-tight">Where you'll be</h2>

            {/* Map */}
            <div className="isolate relative z-0 rounded-2xl overflow-hidden shadow-sm border border-gray-200 h-[300px] md:h-[450px] w-full bg-gray-100 [&_.leaflet-container]:!z-0 [&_.leaflet-pane]:!z-0">
                <HomestayMapWrapper
                    latitude={latitude}
                    longitude={longitude}
                    locationName={locationName}
                />

                {/* Frosted Glass Overlay */}
                <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:w-80 bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-white/60 z-[10]">
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-full flex-shrink-0 text-primary mt-0.5">
                            <MapPin className="w-5 h-5 fill-primary/20" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-[17px] leading-tight mb-1">{locationName || 'North Bengal'}</h3>
                            <p className="text-gray-500 text-[13px] font-medium">Exact location provided after booking</p>
                        </div>
                    </div>
                    {/* Get Directions link */}
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                        <Navigation className="w-3.5 h-3.5" />
                        Get Directions
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                </div>
            </div>

            {/* Nearby Highlights - Render only if backend returns them */}
            {nearbyHighlights && nearbyHighlights.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Nearby highlights</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {nearbyHighlights.map((highlight, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                <span className="text-2xl">📍</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{highlight}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
