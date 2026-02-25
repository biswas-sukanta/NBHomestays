'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HomestaySummary } from './homestay-card';
import Link from 'next/link';
import { Button } from './ui/button';
import { Crosshair, Map as MapIcon, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Fix for default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

const createPriceMarker = (price: number, vibeScore: number = 4.5, isActive: boolean = false) => {
    let vibeColor = 'bg-gray-400';
    if (vibeScore >= 4.7) vibeColor = 'bg-emerald-500';
    else if (vibeScore >= 4.3) vibeColor = 'bg-amber-500';
    else if (vibeScore >= 4.0) vibeColor = 'bg-orange-400';

    return L.divIcon({
        className: 'custom-price-marker',
        html: `
            <div class="flex items-center gap-2 bg-white border ${isActive ? 'border-[#004d00] scale-110 z-[1000]' : 'border-gray-100'} shadow-xl rounded-full px-3 py-1.5 transition-all duration-300 hover:scale-110 hover:border-[#004d00] group">
                <div class="w-2 h-2 rounded-full ${vibeColor} shadow-[0_0_8px_rgba(0,0,0,0.1)]"></div>
                <span class="text-xs font-black text-gray-900 group-hover:text-[#004d00]">₹${price}</span>
            </div>
        `,
        iconSize: [80, 40],
        iconAnchor: [40, 20],
    });
};

interface HomestayMapViewProps {
    homestays: HomestaySummary[];
    onMapChange?: (bounds: L.LatLngBounds) => void;
}

function MapUpdater({ homestays, onMapChange, searchAsIMove }: { homestays: HomestaySummary[], onMapChange?: (bounds: L.LatLngBounds) => void, searchAsIMove: boolean }) {
    const map = useMapEvents({
        moveend() {
            if (searchAsIMove && onMapChange) {
                onMapChange(map.getBounds());
            }
        },
    });

    useEffect(() => {
        if (homestays.length > 0) {
            const bounds = L.latLngBounds(homestays.map(h => [h.latitude || 0, h.longitude || 0]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [homestays, map]);

    return null;
}

export default function HomestayMapView({ homestays, onMapChange }: HomestayMapViewProps) {
    const [searchAsIMove, setSearchAsIMove] = useState(false);
    const defaultCenter: L.LatLngExpression = [26.7271, 88.3953]; // Siliguri

    return (
        <div className="relative h-full w-full rounded-2xl overflow-hidden border border-border shadow-inner bg-secondary/20">
            <MapContainer
                center={defaultCenter}
                zoom={10}
                className="h-full w-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {homestays.map((homestay) => (
                    homestay.latitude && homestay.longitude && (
                        <Marker
                            key={homestay.id}
                            position={[homestay.latitude, homestay.longitude]}
                            icon={createPriceMarker(homestay.pricePerNight, homestay.vibeScore)}
                        >
                            <Popup className="premium-map-popup">
                                <Link href={`/homestays/${homestay.id}`} className="block group w-56 overflow-hidden">
                                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                                        <img
                                            src={homestay.photoUrls?.[0] || '/placeholder-home.jpg'}
                                            alt={homestay.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#004d00] text-white text-[10px] font-bold rounded-full shadow-sm">
                                            ₹{homestay.pricePerNight}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white">
                                        <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-[#004d00] transition-colors">
                                            {homestay.name}
                                        </h4>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                            <span className="truncate">{homestay.locationName || 'North Bengal Hills'}</span>
                                            {homestay.vibeScore && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                                        ★ {homestay.vibeScore.toFixed(1)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            </Popup>
                        </Marker>
                    )
                ))}

                <MapUpdater homestays={homestays} onMapChange={onMapChange} searchAsIMove={searchAsIMove} />
            </MapContainer>

            {/* Floating UI */}
            <div className="absolute top-4 right-4 z-[400] flex flex-col gap-3">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Button
                        variant={searchAsIMove ? "default" : "secondary"}
                        size="sm"
                        className={cn(
                            "rounded-full shadow-xl backdrop-blur-md px-5 py-6 whitespace-nowrap transition-all duration-300 border h-10",
                            searchAsIMove
                                ? 'bg-[#004d00]/90 border-[#004d00] text-white ring-4 ring-[#004d00]/20'
                                : 'bg-white/80 border-white/40 text-gray-900 hover:bg-white'
                        )}
                        onClick={() => setSearchAsIMove(!searchAsIMove)}
                    >
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all duration-500",
                                searchAsIMove ? 'bg-white animate-pulse' : 'bg-gray-300'
                            )} />
                            <span className="font-bold tracking-tight">{searchAsIMove ? 'Searching as you move' : 'Search as I move'}</span>
                        </div>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="self-end"
                >
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full w-12 h-12 shadow-xl bg-white/80 backdrop-blur-md border border-white/40 text-gray-900 hover:bg-white transition-all hover:scale-105 active:scale-95"
                        onClick={() => {
                            // Reset logic could go here
                        }}
                    >
                        <Crosshair className="w-5 h-5" />
                    </Button>
                </motion.div>
            </div>

            <AnimatePresence>
                {!searchAsIMove && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="absolute bottom-10 left-1/2 z-[400]"
                    >
                        <Button
                            variant="default"
                            className="rounded-full shadow-2xl bg-[#004d00] hover:bg-[#003300] text-white px-8 py-6 h-12 font-bold text-sm tracking-wide transition-all hover:scale-105 active:scale-95 flex items-center gap-2 group"
                            onClick={() => {
                                // Manual refresh trigger
                            }}
                        >
                            <MapIcon className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                            Search this area
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
