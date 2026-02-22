'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

// Fix for default marker icons in Next.js/Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
    onLocationSelect?: (lat: number, lng: number, address: string) => void;
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
    readonly?: boolean;
}

function LocationMarker({ position, setPosition, onLocationSelect, readonly }: any) {
    const map = useMapEvents({
        click(e) {
            if (readonly) return;
            handleLocationChange(e.latlng);
        },
    });

    const handleLocationChange = async (latlng: L.LatLng) => {
        setPosition(latlng);
        map.flyTo(latlng, map.getZoom());

        // Reverse Geocode
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`, {
                headers: {
                    'User-Agent': 'NorthBengalHomestays/1.0 (Contact: biswas-sukanta/NBHomestays github)'
                }
            });
            const data = await res.json();
            if (onLocationSelect) {
                onLocationSelect(latlng.lat, latlng.lng, data.display_name || '');
            }
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            if (onLocationSelect) {
                onLocationSelect(latlng.lat, latlng.lng, '');
            }
        }
    };

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker
            position={position}
            draggable={!readonly}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    handleLocationChange(pos);
                }
            }}
        >
            <Popup>Selected Location</Popup>
        </Marker>
    );
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng, initialAddress, readonly = false }: LocationPickerProps) {
    const [position, setPosition] = useState<L.LatLng | null>(initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Default center (North Bengal approx)
    const defaultCenter = [26.7271, 88.3953]; // Siliguri

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`, {
                headers: {
                    'User-Agent': 'NorthBengalHomestays/1.0 (Contact: biswas-sukanta/NBHomestays github)'
                }
            });
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newPos = new L.LatLng(parseFloat(lat), parseFloat(lon));
                setPosition(newPos);
                if (onLocationSelect) {
                    onLocationSelect(parseFloat(lat), parseFloat(lon), display_name);
                }
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-4">
            {!readonly && (
                <div className="flex gap-2">
                    <Input
                        placeholder="Search area (e.g., Darjeeling, Kalimpong)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching} type="button">
                        {isSearching ? 'Searching...' : <Search className="w-4 h-4" />}
                    </Button>
                </div>
            )}

            <div className="h-[400px] w-full rounded-md overflow-hidden border">
                <MapContainer
                    center={position || defaultCenter as L.LatLngExpression}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        onLocationSelect={onLocationSelect}
                        readonly={readonly}
                    />
                </MapContainer>
            </div>

            {/* Hidden inputs for Automation */}
            <input data-testid="lat-input" type="hidden" value={position?.lat || ''} />
            <input data-testid="lng-input" type="hidden" value={position?.lng || ''} />
        </div>
    );
}
