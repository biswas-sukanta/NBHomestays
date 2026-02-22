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
    policies?: string[];
    quickFacts?: Record<string, string>;
    hostDetails?: Record<string, any>;
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

    // Process Amenities (Including Unavailable)
    const allAmenities = Object.entries(homestay.amenities || {}).map(([key, v]) => ({
        key,
        available: v,
        ...getAmenityDisplay(key)
    }));

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

                {/* ── Quick Facts ── */}
                {homestay.quickFacts && Object.keys(homestay.quickFacts).length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-xl font-bold text-foreground mb-4">Know before you go</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/30 p-5 rounded-2xl border border-border">
                            {Object.entries(homestay.quickFacts).map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{key}</span>
                                    <span className="text-sm font-medium text-foreground">{value}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Amenities ── */}
                {allAmenities.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-foreground mb-5">What this place offers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                            {allAmenities.map(({ icon, label, available }, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-4 py-3 border-b border-border/50 last:border-0 md:last:border-b ${!available && 'opacity-60 grayscale'}`}
                                >
                                    <span className="text-2xl flex-none w-8 text-center">{icon}</span>
                                    <span className={`text-[0.95rem] font-medium text-foreground ${!available && 'line-through text-muted-foreground'}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Policies ── */}
                {homestay.policies && homestay.policies.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-xl font-bold text-foreground mb-5">Property Policies</h2>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 list-disc pl-5">
                            {homestay.policies.map((policy, i) => (
                                <li key={i} className="text-[0.95rem] text-muted-foreground leading-relaxed pl-1">{policy}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ── Meet Your Host ── */}
                {homestay.hostDetails && Object.keys(homestay.hostDetails).length > 0 && (
                    <section className="mb-10">
                        <div className="bg-secondary/40 rounded-3xl p-6 md:p-8 border border-border mt-4">
                            <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center">
                                <div className="flex-none text-center">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary mb-3">
                                        {homestay.name.charAt(0)}
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">Meet your host</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Hosting since {homestay.hostDetails.yearsHosting ? new Date().getFullYear() - homestay.hostDetails.yearsHosting : 'recently'}
                                    </p>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {homestay.hostDetails.reviewsCount > 0 && (
                                            <div>
                                                <div className="text-sm font-semibold text-foreground">{homestay.hostDetails.reviewsCount}</div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Reviews</div>
                                            </div>
                                        )}
                                        {homestay.hostDetails.rating > 0 && (
                                            <div>
                                                <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                                                    {homestay.hostDetails.rating.toFixed(2)} <Star className="w-3 h-3 fill-current" />
                                                </div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wide">Rating</div>
                                            </div>
                                        )}
                                    </div>

                                    {homestay.hostDetails.bio && (
                                        <p className="text-[0.95rem] text-foreground leading-relaxed italic border-l-2 border-primary pl-4">
                                            "{homestay.hostDetails.bio}"
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
                                        {homestay.hostDetails.work && (
                                            <div className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="w-4 h-4 text-primary" /> Works as {homestay.hostDetails.work}</div>
                                        )}
                                        {homestay.hostDetails.languages && homestay.hostDetails.languages.length > 0 && (
                                            <div className="flex items-center gap-2 text-muted-foreground">🗣️ Speaks {homestay.hostDetails.languages.join(', ')}</div>
                                        )}
                                        {homestay.hostDetails.currentLocation && (
                                            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4 text-primary" /> Lives in {homestay.hostDetails.currentLocation}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
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
