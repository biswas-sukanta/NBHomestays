import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { BentoGallery } from '@/components/bento-gallery';
import { StickyMobileBar } from '@/components/sticky-mobile-bar';
import { InquirySection } from '@/components/inquiry-section';
import { MapPin, Star, UtensilsCrossed, Leaf, MessageCircle } from 'lucide-react';

// New Architecture Components
import { Highlights } from '@/components/homestay/highlights';
import { QuickFacts } from '@/components/homestay/quick-facts';
import { AmenitiesSection } from '@/components/homestay/amenities-section';
import { HostProfile } from '@/components/homestay/host-profile';
import { PoliciesSection } from '@/components/homestay/policies-section';
import { LocationMapSection } from '@/components/homestay/location-map-section';
import { HomestayQASection } from '@/components/homestay/homestay-qa-section';

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
    media?: { url: string; fileId?: string }[];
    ownerId?: string;
    ownerEmail?: string;
    mealConfig?: {
        defaultMealPlan?: string;
        mealsIncludedPerDay?: number;
        mealPricePerGuest?: number | null;
        dietTypes?: string[];
        extras?: { code: string; title: string; price: number; unit: string }[];
    };
}

export default async function HomestayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const isDev = process.env.NODE_ENV === 'development';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const fetchUrl = `${backendUrl}/api/homestays/${id}`;

    console.log("[HOMESTAY PAGE] Fetching URL:", fetchUrl);

    let homestay: Homestay;
    try {
        const res = await fetch(fetchUrl, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`[HOMESTAY PAGE] Fetch failed with status: ${res.status}`);
            return notFound();
        }

        // Ensure we handle responses that might be wrapped under `{ data: ... }` if that occurs
        const responseData = await res.json();
        homestay = responseData.data ? responseData.data : responseData;

        console.log("[HOMESTAY PAGE] Fetched homestay:", homestay.id, homestay.name);
        if (!homestay?.id && !homestay?.name) return notFound();
    } catch {
        return notFound();
    }

    const vibeScore = homestay.vibeScore || homestay.rating || 4.5;
    const vibeClass = vibeScore >= 4.5 ? 'vibe-high' : vibeScore >= 3.5 ? 'vibe-mid' : 'vibe-low';

    // Build trip board item for sticky bar
    const tripBoardItem = {
        id: homestay.id,
        name: homestay.name,
        imageUrl: homestay.media?.[0]?.url || '',
        locationName: homestay.locationName || 'North Bengal',
        pricePerNight: homestay.pricePerNight,
    };

    // Calculate dynamic highlights
    const highlightsItems = [];
    if (homestay.amenities?.['Mountain View']) {
        highlightsItems.push({ id: '1', title: 'Stunning Views', subtitle: 'Enjoy panoramic mountain views right from your property.', iconKey: 'Mountain View' });
    }
    if (homestay.amenities?.['Wifi'] || homestay.amenities?.['Free Wi-Fi']) {
        highlightsItems.push({ id: '2', title: 'Dedicated Workspace', subtitle: 'A room with wifi that’s well-suited for working.', iconKey: 'Dedicated workspace' });
    }
    if (homestay.hostDetails?.reviewsCount && homestay.hostDetails.reviewsCount > 50) {
        highlightsItems.push({ id: '3', title: 'Highly Rated Host', subtitle: `${homestay.hostDetails.reviewsCount} recent guests praised this host.`, iconKey: 'Host greets you' });
    }
    // Fallback if empty
    if (highlightsItems.length === 0) {
        highlightsItems.push({ id: '4', title: 'Great Location', subtitle: '100% of recent guests gave the location a 5-star rating.', iconKey: 'Location' });
        highlightsItems.push({ id: '5', title: 'Self check-in', subtitle: 'Check yourself in with the lockbox.', iconKey: 'Check-in' });
    }

    // Extract Owner Name
    const ownerNameDisplay = homestay.ownerEmail ? homestay.ownerEmail.split('@')[0] : 'Host';

    return (
        <div className="min-h-screen bg-background pb-28 md:pb-10">
            {/* ════════════════════════════════════════
                GALLERY (Bento desktop / Snap-scroll mobile)
            ════════════════════════════════════════ */}
            <div className="md:container md:mx-auto md:px-4 md:pt-6">
                <BentoGallery
                    mediaUrls={homestay.media?.map(m => m.url) || []}
                    name={homestay.name}
                    data-testid="bento-gallery"
                />
            </div>

            {/* ════════════════════════════════════════
                DETAILS W/ SIDEBAR ARCHITECTURE
            ════════════════════════════════════════ */}
            <div className="container mx-auto px-4 md:px-6 mt-6 md:mt-10 flex flex-col md:flex-row gap-12 lg:gap-20 max-w-[1280px]">

                {/* Main Content Column */}
                <div className="flex-1 max-w-[700px]">
                    {/* ── Header ── */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl md:text-[32px] font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                                {homestay.name}
                            </h1>
                            <div className="flex items-center gap-2 mt-2 text-gray-700 text-sm md:text-base font-medium">
                                <MapPin className="w-4 h-4 text-primary flex-none" />
                                <span className="underline underline-offset-4 decoration-gray-300 font-semibold">{homestay.locationName || 'North Bengal'}</span>
                            </div>
                        </div>

                        {/* Vibe Score badge (Desktop hidden, managed below for bigger effect) */}
                        <div className={`md:hidden flex-none flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold shadow-md ${vibeClass}`}>
                            <Star className="w-4 h-4 fill-current" />
                            <span>{vibeScore.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Price strip (Mobile Only, Desktop handled by Sidebar) */}
                    <div className="flex items-baseline gap-1.5 mb-6 md:hidden">
                        <span className="text-2xl font-extrabold text-gray-900">
                            ₹{homestay.pricePerNight.toLocaleString()}
                        </span>
                        <span className="text-gray-600 font-medium tracking-wide text-sm">/ night</span>
                    </div>

                    <hr className="border-gray-200 mb-0" />

                    {/* ── Highlights ── */}
                    <Highlights items={highlightsItems} />

                    {/* ── Description ── */}
                    <section className="py-8 border-b border-gray-200">
                        <h2 className="text-[22px] font-bold text-gray-900 mb-5">About this stay</h2>
                        <p className="text-gray-700 leading-[1.65] text-base whitespace-pre-line font-medium">
                            {homestay.description}
                        </p>
                    </section>

                    {/* ── Quick Facts ── */}
                    {homestay.quickFacts && Object.keys(homestay.quickFacts).length > 0 && (
                        <QuickFacts facts={homestay.quickFacts} />
                    )}

                    {/* ── Amenities ── */}
                    {homestay.amenities && Object.keys(homestay.amenities).length > 0 && (
                        <AmenitiesSection providedAmenities={homestay.amenities} />
                    )}

                    {/* ── Policies ── */}
                    {homestay.policies && homestay.policies.length > 0 && (
                        <PoliciesSection policies={homestay.policies} />
                    )}

                    {/* ── Meals & Dining ── */}
                    {homestay.mealConfig && homestay.mealConfig.defaultMealPlan && homestay.mealConfig.defaultMealPlan !== 'none' && (
                        <section className="py-8 border-b border-gray-200" data-testid="meals-section">
                            <h2 className="text-[22px] font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <UtensilsCrossed className="w-5 h-5 text-emerald-700" />
                                Meals & Dining
                            </h2>
                            <div className="space-y-4">
                                {/* Meal plan summary */}
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                    <p className="text-sm font-semibold text-emerald-900">
                                        {homestay.mealConfig.mealsIncludedPerDay && homestay.mealConfig.mealsIncludedPerDay > 0
                                            ? (!homestay.mealConfig.mealPricePerGuest
                                                ? `${homestay.mealConfig.mealsIncludedPerDay} meal${homestay.mealConfig.mealsIncludedPerDay > 1 ? 's' : ''}/day included in room price`
                                                : `${homestay.mealConfig.mealsIncludedPerDay} meal${homestay.mealConfig.mealsIncludedPerDay > 1 ? 's' : ''}/day available at ₹${homestay.mealConfig.mealPricePerGuest}/guest/day`)
                                            : 'Meals available on request'}
                                    </p>
                                </div>

                                {/* Diet types */}
                                {homestay.mealConfig.dietTypes && homestay.mealConfig.dietTypes.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                                            <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Diet Options
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {homestay.mealConfig.dietTypes.map((dt: string) => {
                                                const labels: Record<string, string> = { 'veg': '🥬 Veg', 'non-veg': '🍗 Non-Veg', 'jain': '🪷 Jain', 'vegan': '🌱 Vegan', 'organic': '🌿 Organic', 'children': '👶 Children' };
                                                return (
                                                    <span key={dt} className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700">
                                                        {labels[dt] || dt}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Extras */}
                                {homestay.mealConfig.extras && homestay.mealConfig.extras.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Extras</h3>
                                        <div className="space-y-2">
                                            {homestay.mealConfig.extras.map((extra: any) => (
                                                <div key={extra.code} className="flex justify-between items-center bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5">
                                                    <span className="text-sm font-medium text-gray-800">{extra.title}</span>
                                                    <span className="text-sm font-bold text-emerald-700">₹{extra.price}/{extra.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CTA */}
                                <div className="flex items-center gap-2 pt-2 text-sm text-gray-500">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Contact host for special dietary requirements or custom meals</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ── Meet Your Host ── */}
                    {homestay.hostDetails && Object.keys(homestay.hostDetails).length > 0 && (
                        <HostProfile ownerId={homestay.ownerId} ownerName={ownerNameDisplay} hostDetails={homestay.hostDetails} />
                    )}

                    {/* ── Map ── */}
                    <LocationMapSection
                        latitude={homestay.latitude}
                        longitude={homestay.longitude}
                        locationName={homestay.locationName}
                    />

                    {/* ── Desktop QA Section ── */}
                    <div className="hidden md:block">
                        <HomestayQASection homestayId={homestay.id} />
                    </div>
                </div>

                {/* Desktop Sticky Sidebar (Pricing / Inquiry) */}
                <div className="hidden md:block w-[350px] lg:w-[400px] flex-none relative">
                    <div className="sticky top-28">
                        <div className="bg-white rounded-[24px] shadow-[0_6px_24px_rgba(0,0,0,0.12)] border border-gray-200/60 p-6 object-cover overflow-hidden relative">
                            <div className="flex items-end justify-between mb-6">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-[32px] font-extrabold text-gray-900 leading-tight">
                                        ₹{homestay.pricePerNight.toLocaleString()}
                                    </span>
                                    <span className="text-gray-600 font-medium tracking-wide">/ night</span>
                                </div>
                                <div className="flex items-center gap-1 font-bold text-gray-900">
                                    <Star className="w-4 h-4 fill-gray-900" />
                                    <span>{vibeScore.toFixed(1)}</span>
                                </div>
                            </div>

                            <hr className="border-gray-200 mb-6" />

                            <InquirySection homestayName={homestay.name} />
                        </div>
                    </div>
                </div>

                {/* Mobile QA Section */}
                <div className="md:hidden w-full">
                    <HomestayQASection homestayId={homestay.id} />
                </div>
            </div>

            {/* ════════════════════════════════════════
                STICKY MOBILE ACTION BAR
            ════════════════════════════════════════ */}
            <div className="md:hidden">
                <StickyMobileBar
                    homestayName={homestay.name}
                    tripBoardItem={tripBoardItem}
                />
            </div>
        </div>
    );
}

