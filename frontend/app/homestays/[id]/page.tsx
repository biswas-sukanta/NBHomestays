import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { BentoGallery } from '@/components/bento-gallery';
import { QASection } from '@/components/qa-section';
import { StickyMobileBar } from '@/components/sticky-mobile-bar';
import HomestayMapWrapper from '@/components/HomestayMapWrapper';
import { InquirySection } from '@/components/inquiry-section';
import {
    MapPin, Star, ShieldCheck, Wifi, Car, Utensils, Coffee,
    Waves, TreePine, Mountain, Wind, Flame
} from 'lucide-react';

// Amenity → icon/emoji map (no backend change, purely display)
const AMENITY_ICONS: Record<string, { icon: string; label: string }> = {
    wifi: { icon: '📶', label: 'WiFi' },
    parking: { icon: '🚗', label: 'Parking' },
    kitchen: { icon: '🍳', label: 'Kitchen' },
    breakfast: { icon: '☕', label: 'Breakfast' },
    hotWater: { icon: '🚿', label: 'Hot Water' },
    pool: { icon: '🏊', label: 'Pool' },
    garden: { icon: '🌿', label: 'Garden' },
    mountainView: { icon: '🏔️', label: 'Mountain View' },
    ac: { icon: '❄️', label: 'AC' },
    fireplace: { icon: '🔥', label: 'Fireplace' },
};

function getAmenityDisplay(key: string) {
    const normalized = key.charAt(0).toLowerCase() + key.slice(1).replace(/\s/g, '');
    return AMENITY_ICONS[normalized] || { icon: '✓', label: key.replace(/([A-Z])/g, ' $1').trim() };
}

interface MediaItem { id: string; type: 'image' | 'video'; url: string; }

interface Homestay {
    id: string;
    name: string;
    description: string;
    locationName: string;
    latitude: number;
    longitude: number;
    pricePerNight: number;
    rating: number;
    vibeScore: number;
    amenities: Record<string, boolean>;
    photoUrls: string[];
    ownerId?: string;
    ownerEmail?: string;
}

export default async function HomestayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const isDev = process.env.NODE_ENV === 'development';
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || (isDev ? 'http://localhost:8080' : 'https://nb-homestay-api.onrender.com');
    const fetchUrl = `${API_BASE}/api/homestays/${id}`;

    let homestay: Homestay;
    try {
        const res = await fetch(fetchUrl, { cache: 'no-store' });
        if (!res.ok) return notFound();
        homestay = await res.json();
        if (!homestay?.id && !homestay?.name) return notFound();
    } catch {
        return notFound();
    }

    const amenitiesList = Object.entries(homestay.amenities || {})
        .filter(([_, v]) => v)
        .map(([key]) => getAmenityDisplay(key));

    const vibeScore = homestay.vibeScore || homestay.rating || 4.5;
    const vibeClass = vibeScore >= 4.5 ? 'vibe-high' : vibeScore >= 3.5 ? 'vibe-mid' : 'vibe-low';

    // Build trip board item for sticky bar
    const tripBoardItem = {
        id: homestay.id,
        name: homestay.name,
        imageUrl: homestay.photoUrls?.[0] || '',
        locationName: homestay.locationName || 'North Bengal',
        pricePerNight: homestay.pricePerNight,
    };

    return (
        <div className="min-h-screen bg-background pb-28 md:pb-10">
            {/* ════════════════════════════════════════
                GALLERY (Bento desktop / Snap-scroll mobile)
            ════════════════════════════════════════ */}
            <div className="md:container md:mx-auto md:px-4 md:pt-6">
                <BentoGallery
                    photoUrls={homestay.photoUrls || []}
                    name={homestay.name}
                    data-testid="bento-gallery"
                />
            </div>

            {/* ════════════════════════════════════════
                DETAILS
            ════════════════════════════════════════ */}
            <div className="container mx-auto px-4 md:px-6 max-w-4xl mt-6 md:mt-8">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                            {homestay.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4 text-primary flex-none" />
                            <span>{homestay.locationName || 'North Bengal'}</span>
                        </div>
                    </div>

                    {/* Vibe Score badge */}
                    <div className={`flex-none flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold shadow-md ${vibeClass}`}>
                        <Star className="w-4 h-4 fill-current" />
                        <span>{vibeScore.toFixed(1)}</span>
                    </div>
                </div>

                {/* Price strip */}
                <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-2xl font-extrabold text-foreground">
                        ₹{homestay.pricePerNight.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground font-medium">/ night</span>
                </div>

                {/* ── Divider ── */}
                <hr className="border-border mb-6" />

                {/* ── Description ── */}
                <section className="mb-8">
                    <h2 className="text-xl font-bold text-foreground mb-3">About this stay</h2>
                    <p className="text-muted-foreground leading-[1.85] text-[0.96rem] whitespace-pre-line">
                        {homestay.description}
                    </p>
                </section>

                {/* ── Amenities ── */}
                {amenitiesList.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-foreground mb-4">What this place offers</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {amenitiesList.map(({ icon, label }, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 bg-secondary/60 border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground"
                                >
                                    <span className="text-xl">{icon}</span>
                                    <span className="capitalize">{label}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Map ── */}
                {homestay.latitude && homestay.longitude && (
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-foreground mb-4">Where you'll be</h2>
                        <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                            <HomestayMapWrapper
                                latitude={homestay.latitude}
                                longitude={homestay.longitude}
                                locationName={homestay.locationName}
                            />
                        </div>
                    </section>
                )}

                {/* ── Desktop WhatsApp Inquiry Section ── */}
                <section className="mb-10 hidden md:block">
                    <div className="glass-card rounded-2xl p-6">
                        <InquirySection homestayName={homestay.name} />
                    </div>
                </section>

                {/* ── Q&A ── */}
                <section className="mb-8">
                    <QASection homestayId={homestay.id} />
                </section>
            </div>

            {/* ════════════════════════════════════════
                STICKY MOBILE ACTION BAR
            ════════════════════════════════════════ */}
            <StickyMobileBar
                homestayName={homestay.name}
                ownerEmail={homestay.ownerEmail}
                tripBoardItem={tripBoardItem}
            />
        </div>
    );
}
