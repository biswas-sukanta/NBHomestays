// ==============================================================================
// ⚠️ ARCHITECTURE PROTECTION NOTICE
// ==============================================================================
// This map system is highly optimized. 
//
// Major behavior depends on:
//  - React.memo markers
//  - supercluster clustering
//  - debounced map queries
//  - dragend event handling
//  - IntersectionObserver mobile sync
//
// Do not rewrite the map architecture without reviewing the Map Architecture Documentation.
// ==============================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HomestaySummary } from './homestay-card';
import { Button } from './ui/button';
import { Crosshair, Map as MapIcon, Plus, Minus, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import useSupercluster from 'use-supercluster';
import { MemoizedHomestayMarker } from './MemoizedHomestayMarker';

// Fix for default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

interface HomestayMapViewProps {
    homestays: HomestaySummary[];
    onMapChange?: (bounds: L.LatLngBounds) => void;
    hoveredHomestayId?: string | null;
    selectedHomestayId?: string | null;
    setSelectedHomestayId?: (id: string | null) => void;
    onMarkerHover?: (id: string) => void;
    onMarkerLeave?: () => void;
    onCloseMap?: () => void;
}

function MapHoverPan({ homestays, hoveredHomestayId, selectedHomestayId }: { homestays: HomestaySummary[], hoveredHomestayId?: string | null, selectedHomestayId?: string | null }) {
    const map = useMap();
    useEffect(() => {
        const targetId = selectedHomestayId || hoveredHomestayId;
        if (targetId) {
            const h = homestays.find(x => x.id === targetId);
            if (h && h.latitude && h.longitude) {
                const targetZoom = Math.max(map.getZoom(), 13);

                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    const mapSize = map.getSize();
                    // push center upward so marker sits above bottom card overlay
                    const verticalOffset = mapSize.y * 0.18;

                    const paddedPoint = map.project([h.latitude, h.longitude], targetZoom)
                        .subtract([0, verticalOffset]);

                    const paddedLatLng = map.unproject(paddedPoint, targetZoom);

                    map.flyTo(paddedLatLng, targetZoom, { animate: true, duration: 0.8 });
                } else {
                    map.flyTo([h.latitude, h.longitude], targetZoom, { animate: true, duration: 1.5 });
                }
            }
        }
    }, [hoveredHomestayId, homestays, map]);
    return null;
}

function MapMobileControls({ onCloseMap }: { onCloseMap?: () => void }) {
    const map = useMap();
    const handleLocateMe = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                map.flyTo([latitude, longitude], 14, { animate: true, duration: 1.5 });
            });
        }
    };

    return (
        <>
            {onCloseMap && (
                <button
                    onClick={onCloseMap}
                    className="absolute top-4 left-4 z-[400] lg:hidden bg-white text-gray-900 p-2.5 rounded-full shadow-lg border border-gray-100 hover:scale-105 transition-transform"
                    aria-label="Close Map"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
            <div className="absolute bottom-8 right-4 z-[800] flex flex-col gap-3">
                <div className="flex flex-col bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden">
                    <button
                        onClick={handleLocateMe}
                        className="p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
                        aria-label="Locate me"
                    >
                        <Navigation className="w-5 h-5 text-blue-600" />
                    </button>
                    <button
                        onClick={() => map.zoomIn()}
                        className="p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
                        aria-label="Zoom in"
                    >
                        <Plus className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                        onClick={() => map.zoomOut()}
                        className="p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-100"
                        aria-label="Zoom out"
                    >
                        <Minus className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                        onClick={() => map.setZoom(10)}
                        className="p-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                        aria-label="Recenter Map"
                    >
                        <Crosshair className="w-5 h-5 text-gray-700" />
                    </button>
                </div>
            </div>
        </>
    );
}

function ClusteredMarkers({ homestays, hoveredHomestayId, selectedHomestayId, setSelectedHomestayId, onMarkerHover, onMarkerLeave, totalRenders }: any) {
    const map = useMap();
    const [bounds, setBounds] = useState<[number, number, number, number] | null>(null);
    const [zoom, setZoom] = useState(10);

    const updateMapState = useCallback(() => {
        const b = map.getBounds();
        setBounds([
            b.getWest(),
            b.getSouth(),
            b.getEast(),
            b.getNorth()
        ]);
        setZoom(map.getZoom());
    }, [map]);

    useMapEvents({
        moveend: updateMapState,
        zoomend: updateMapState,
    });

    useEffect(() => {
        updateMapState();
    }, [updateMapState]);

    const points = useMemo(() => {
        return homestays
            .filter((h: any) => h.latitude && h.longitude)
            .map((h: any) => ({
                type: 'Feature',
                properties: {
                    cluster: false,
                    homestayId: h.id,
                    price: h.pricePerNight,
                    vibeScore: h.vibeScore,
                    homestay: h
                },
                geometry: {
                    type: 'Point',
                    coordinates: [h.longitude, h.latitude]
                }
            }));
    }, [homestays]);

    const { clusters, supercluster } = useSupercluster({
        points,
        bounds: bounds || undefined,
        zoom,
        options: { radius: 60, maxZoom: 17 }
    });

    // Performance Tracking: Cluster Distribution
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && clusters.length > 0) {
            const clusterCount = clusters.filter((c: any) => c.properties.cluster).length;
            const singleCount = clusters.filter((c: any) => !c.properties.cluster).length;
        }
    }, [clusters, zoom]);

    return (
        <>
            {clusters.map((cluster: any) => {
                const [longitude, latitude] = cluster.geometry.coordinates;
                const { cluster: isCluster, point_count: pointCount } = cluster.properties;

                if (isCluster) {
                    return (
                        <Marker
                            key={`cluster-${cluster.id}`}
                            position={[latitude, longitude]}
                            icon={L.divIcon({
                                html: `<div class="flex items-center justify-center w-10 h-10 bg-gray-900 text-white rounded-full shadow-lg font-bold text-sm border-2 border-white transition-transform duration-300 hover:scale-110">${pointCount}</div>`,
                                className: 'custom-cluster-marker',
                                iconSize: [40, 40],
                                iconAnchor: [20, 20]
                            })}
                            eventHandlers={{
                                click: () => {
                                    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 17);
                                    map.flyTo([latitude, longitude], expansionZoom, { duration: 0.6 });
                                }
                            }}
                        />
                    );
                }

                const h = cluster.properties.homestay;
                const homestayId = h.id;

                return (
                    <MemoizedHomestayMarker
                        key={`homestay-${homestayId}`}
                        h={h}
                        latitude={latitude}
                        longitude={longitude}
                        isActive={homestayId === hoveredHomestayId || homestayId === selectedHomestayId}
                        isSelected={homestayId === selectedHomestayId}
                        onMarkerHover={onMarkerHover}
                        onMarkerLeave={onMarkerLeave}
                        onMarkerClick={() => {
                            if (setSelectedHomestayId) setSelectedHomestayId(homestayId);
                        }}
                        totalRenders={totalRenders}
                    />
                );
            })}
        </>
    );
}

function MapUpdater({ homestays, onMapChange, searchAsIMove, onManualMove }: { homestays: HomestaySummary[], onMapChange?: (bounds: L.LatLngBounds) => void, searchAsIMove: boolean, onManualMove?: (bounds: L.LatLngBounds | null) => void }) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleInteraction = () => {
        if (searchAsIMove && onMapChange) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                onMapChange(map.getBounds());
            }, 500);
        } else if (!searchAsIMove && onManualMove) {
            onManualMove(map.getBounds());
        }
    };

    const map = useMapEvents({
        dragend: handleInteraction,
        zoomend: handleInteraction
    });

    useEffect(() => {
        return () => {

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, []);

    useEffect(() => {
        if (homestays.length > 0) {
            const validHomestays = homestays.filter(h => h.latitude && h.longitude);
            if (validHomestays.length > 0) {
                const bounds = L.latLngBounds(validHomestays.map(h => [h.latitude as number, h.longitude as number]));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true, duration: 1.5 });

                // Clear the manual "Search this area" button if fitBounds triggered zoomend programmatically
                if (onManualMove) {
                    setTimeout(() => onManualMove(null), 1600);
                }
            }
        }
    }, [homestays, map, onManualMove]);

    return null;
}

// ═══════════════════════════════════════════════════════════════════════
// MAP PERFORMANCE MONITORING GUIDE (Development Only)
// ═══════════════════════════════════════════════════════════════════════
// This component outputs precise runtime benchmarks securely stripped from built bundles.
//
// 1. Rendering Optimization:
//    - Open React DevTools -> Profiler -> Record.
//    - Hover right-hand homestay cards rapidly.
//    - Verify: only `<MemoizedHomestayMarker>` boundaries re-render. All array iterations skip.
//
// 2. Network Drag Limits:
//    - Drag map continuously.
//
// 3. Leaflet Hydration bounds: tracked via `performance.now()`.
// ═══════════════════════════════════════════════════════════════════════

export default function HomestayMapView({ homestays, onMapChange, hoveredHomestayId, selectedHomestayId, setSelectedHomestayId, onMarkerHover, onMarkerLeave, onCloseMap }: HomestayMapViewProps) {
    const [searchAsIMove, setSearchAsIMove] = useState(false);
    const [pendingBounds, setPendingBounds] = useState<L.LatLngBounds | null>(null);
    const defaultCenter: L.LatLngExpression = [26.7271, 88.3953];

    useEffect(() => {
        setPendingBounds(null);
    }, [searchAsIMove, homestays]);

    // Performance Tracking: Map Render Timing
    const initTime = useRef(0);
    const totalRenders = useRef(0);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            initTime.current = performance.now();
        }
    }, []);

    return (
        <div className="relative h-full w-full lg:rounded-2xl overflow-hidden border border-border shadow-inner bg-secondary/20">
            <MapContainer
                center={defaultCenter}
                zoom={10}
                className="h-full w-full z-[100]"
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                <ClusteredMarkers
                    homestays={homestays}
                    hoveredHomestayId={hoveredHomestayId}
                    selectedHomestayId={selectedHomestayId}
                    setSelectedHomestayId={setSelectedHomestayId}
                    onMarkerHover={onMarkerHover}
                    onMarkerLeave={onMarkerLeave}
                    totalRenders={totalRenders}
                />

                <MapHoverPan homestays={homestays} hoveredHomestayId={hoveredHomestayId} selectedHomestayId={selectedHomestayId} />
                <MapUpdater
                    homestays={homestays}
                    onMapChange={onMapChange}
                    searchAsIMove={searchAsIMove}
                    onManualMove={setPendingBounds}
                />
                <MapMobileControls onCloseMap={onCloseMap} />
            </MapContainer>

            {/* Floating Top Right Recenter & Search As I Move */}
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
                            "rounded-full shadow-xl backdrop-blur-md px-5 py-6 whitespace-nowrap transition-all duration-300 border h-10 flex items-center gap-2 lg:flex",
                            searchAsIMove
                                ? 'bg-gray-900 border-gray-900 text-white ring-4 ring-gray-900/20'
                                : 'bg-white/90 border-white/40 text-gray-900 hover:bg-white'
                        )}
                        onClick={() => setSearchAsIMove(!searchAsIMove)}
                    >
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-500",
                            searchAsIMove ? 'bg-white animate-pulse' : 'bg-gray-300'
                        )} />
                        <span className="font-bold tracking-tight hidden sm:inline">{searchAsIMove ? 'Searching as you move' : 'Search as I move'}</span>
                        <span className="font-bold tracking-tight sm:hidden">{searchAsIMove ? 'Searching' : 'Search area'}</span>
                    </Button>
                </motion.div>
            </div>

            <AnimatePresence>
                {!searchAsIMove && pendingBounds && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="absolute top-6 left-1/2 z-[400]"
                    >
                        <Button
                            variant="outline"
                            className="rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 px-6 py-2.5 h-auto font-bold text-sm tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 border border-gray-100"
                            onClick={() => {
                                if (onMapChange) onMapChange(pendingBounds);
                                setPendingBounds(null);
                            }}
                        >
                            Search this area
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
