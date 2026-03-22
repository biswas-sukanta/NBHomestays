'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';

const createPriceMarker = (h: any, isSelected: boolean = false, isActive: boolean = false) => {
    return L.divIcon({
        className: 'custom-price-marker',
        html: `
            <div class="flex items-center justify-center ${isSelected ? 'bg-gray-900 text-white scale-110 shadow-2xl z-[1000]' : isActive ? 'bg-white text-gray-900 ring-2 ring-gray-900 scale-105 shadow-xl' : 'bg-white text-gray-900 shadow-md'} rounded-full px-3 py-1.5 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.08] relative group">
                <span class="text-xs font-black tracking-tight">₹${h.pricePerNight.toLocaleString()}</span>
                
                <!-- Pure CSS Hover Preview Card -->
                <div class="pointer-events-none absolute top-[-135px] left-1/2 -translate-x-1/2 w-44 bg-white rounded-xl shadow-2xl overflow-hidden hidden lg:block opacity-0 group-hover:opacity-100 transition-all duration-300 origin-bottom scale-90 group-hover:scale-100 z-[2000]">
                    <div class="w-full h-24 relative bg-gray-100 overflow-hidden">
                        <img src="${h.media?.[0]?.url || '/placeholder-home.jpg'}" class="w-full h-full object-cover" />
                    </div>
                    <div class="px-2.5 py-2 bg-white">
                        <div class="flex justify-between items-start gap-1">
                            <h4 class="font-bold text-[11px] text-gray-900 line-clamp-1 tracking-tight">${h.name}</h4>
                            <div class="flex items-center gap-0.5 shrink-0 text-[10px] font-bold">
                                <span>★</span> ${h.vibeScore ? h.vibeScore.toFixed(1) : 'New'}
                            </div>
                        </div>
                        <div class="text-gray-900 font-black text-xs mt-0.5">₹${h.pricePerNight.toLocaleString()} <span class="text-[10px] font-normal text-gray-500">/ night</span></div>
                    </div>
                </div>
            </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 20],
    });
};

interface MemoizedHomestayMarkerProps {
    h: any;
    latitude: number;
    longitude: number;
    isActive: boolean;
    isSelected?: boolean;
    onMarkerHover?: (id: string) => void;
    onMarkerLeave?: () => void;
    onMarkerClick?: () => void;
    totalRenders?: React.MutableRefObject<number>;
}

const HomestayMarker = ({ h, latitude, longitude, isActive, isSelected = false, onMarkerHover, onMarkerLeave, onMarkerClick, totalRenders }: MemoizedHomestayMarkerProps) => {

    // Performance Tracking: Marker Renders
    if (process.env.NODE_ENV === 'development') {
        if (totalRenders) totalRenders.current++;
    }

    return (
        <Marker
            position={[latitude, longitude]}
            icon={createPriceMarker(h, isSelected, isActive)}
            zIndexOffset={isSelected ? 2000 : isActive ? 1000 : 0}
            eventHandlers={{
                mouseover: () => {
                    if (onMarkerHover) onMarkerHover(h.id);
                },
                mouseout: () => {
                    if (onMarkerLeave) onMarkerLeave();
                },
                click: () => {
                    if (onMarkerClick) onMarkerClick();
                }
            }}
        >
            <Popup className="premium-map-popup min-w-[224px]">
                <Link href={`/homestays/${h.id}`} className="block group w-56 overflow-hidden rounded-xl">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                        <img
                            src={h.media?.[0]?.url || '/placeholder-home.jpg'}
                            alt={h.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-bold rounded-full shadow-sm">
                            ₹{h.pricePerNight.toLocaleString()}
                        </div>
                        {h.vibeScore >= 4.7 && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow-sm uppercase tracking-wider">
                                Traveler Pick
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-white">
                        <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
                            {h.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <span className="truncate">{h.locationName || 'Eastern Himalayas'}</span>
                            {h.vibeScore && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                    <span className="flex items-center gap-0.5 text-gray-900 font-bold">
                                        ★ {h.vibeScore.toFixed(1)}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </Link>
            </Popup>
        </Marker>
    );
};

export const MemoizedHomestayMarker = React.memo(HomestayMarker, (prev, next) => {
    // Only re-render if the active state changes or if it's a completely different homestay
    return prev.isActive === next.isActive && prev.h.id === next.h.id && prev.latitude === next.latitude && prev.longitude === next.longitude;
});
