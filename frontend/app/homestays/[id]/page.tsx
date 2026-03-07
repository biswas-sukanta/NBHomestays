import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { BentoGallery } from '@/components/bento-gallery';
import { StickyMobileBar } from '@/components/sticky-mobile-bar';
import { InquirySection } from '@/components/inquiry-section';
import { MapPin, Star, Mountain, Wifi, Flame, CookingPot, TrendingUp, MessageSquare } from 'lucide-react';

// Architecture Components
import { Highlights } from '@/components/homestay/highlights';
import { QuickFacts } from '@/components/homestay/quick-facts';
import { AmenitiesSection } from '@/components/homestay/amenities-section';
import { HostProfile } from '@/components/homestay/host-profile';
import { PoliciesSection } from '@/components/homestay/policies-section';
import { LocationMapSection } from '@/components/homestay/location-map-section';
import { HomestayQASection } from '@/components/homestay/homestay-qa-section';
import { MealsSection } from '@/components/homestay/meals-section';
import { SectionNav } from '@/components/homestay/section-nav';

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
        const { apiFetch } = await import('@/lib/api-client');
        const res = await apiFetch(`/homestays/${id}`, { cache: 'no-store' });
        if (!res.ok) {
            console.error(`[HOMESTAY PAGE] Fetch failed with status: ${res.status}`);
            return notFound();
        }

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
        highlightsItems.push({ id: '2', title: 'Dedicated Workspace', subtitle: "A room with wifi that's well-suited for working.", iconKey: 'Dedicated workspace' });
    }
    if (homestay.hostDetails?.reviewsCount && homestay.hostDetails.reviewsCount > 50) {
        highlightsItems.push({ id: '3', title: 'Highly Rated Host', subtitle: `${homestay.hostDetails.reviewsCount} recent guests praised this host.`, iconKey: 'Host greets you' });
    }
    if (highlightsItems.length === 0) {
        highlightsItems.push({ id: '4', title: 'Great Location', subtitle: '100% of recent guests gave the location a 5-star rating.', iconKey: 'Location' });
        highlightsItems.push({ id: '5', title: 'Self check-in', subtitle: 'Check yourself in with the lockbox.', iconKey: 'Check-in' });
    }

    // Stay Highlights chips (data-driven from amenities)
    const stayChips: { label: string; icon: React.ReactNode }[] = [];
    if (homestay.amenities?.['Mountain View']) stayChips.push({ label: 'Mountain View', icon: <Mountain className="w-3.5 h-3.5" /> });
    if (homestay.amenities?.['Wifi'] || homestay.amenities?.['Free Wi-Fi']) stayChips.push({ label: 'Fast Wi-Fi', icon: <Wifi className="w-3.5 h-3.5" /> });
    if (homestay.amenities?.['Bonfire (Extra)']) stayChips.push({ label: 'Bonfire Evenings', icon: <Flame className="w-3.5 h-3.5" /> });
    if (homestay.mealConfig?.mealsIncludedPerDay && homestay.mealConfig.mealsIncludedPerDay > 0) stayChips.push({ label: 'Home-Cooked Meals', icon: <CookingPot className="w-3.5 h-3.5" /> });
    if (stayChips.length === 0) {
        stayChips.push({ label: 'Nature Retreat', icon: <Mountain className="w-3.5 h-3.5" /> });
    }

    // Extract Owner Name
    const ownerNameDisplay = homestay.ownerEmail ? homestay.ownerEmail.split('@')[0] : 'Host';

    return (
        <div className="min-h-screen bg-background pb-28 md:pb-10">
            {/* ═══════ GALLERY ═══════ */}
            <div className="md:container md:mx-auto md:px-4 md:pt-6">
                <BentoGallery
                    mediaUrls={homestay.media?.map(m => m.url) || []}
                    name={homestay.name}
                    locationName={homestay.locationName}
                    data-testid="bento-gallery"
                />
            </div>

            {/* ═══════ STICKY SECTION NAV ═══════ */}
            <SectionNav />

            {/* ═══════ DETAILS W/ SIDEBAR ═══════ */}
            <div className="container mx-auto px-4 md:px-6 mt-6 md:mt-10 flex flex-col md:flex-row gap-12 lg:gap-20 max-w-[1280px]">

                {/* Main Content Column */}
                <div className="flex-1 max-w-[700px]">
                    {/* ── Header ── */}
                    <div id="overview" className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl md:text-[34px] font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                                {homestay.name}
                            </h1>
                            <div className="flex items-center gap-3 mt-2 text-gray-700 text-sm md:text-base font-medium flex-wrap">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-primary flex-none" />
                                    <span className="underline underline-offset-4 decoration-gray-300 font-semibold">{homestay.locationName || 'North Bengal'}</span>
                                </span>
                                {/* Desktop inline rating */}
                                <span className="hidden md:flex items-center gap-1 text-sm">
                                    <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                                    <span className="font-bold">{vibeScore.toFixed(1)}</span>
                                </span>
                                {/* Desktop inline price */}
                                <span className="hidden md:inline text-sm text-gray-500">·</span>
                                <span className="hidden md:inline text-sm font-semibold text-gray-900">
                                    ₹{homestay.pricePerNight.toLocaleString()}<span className="text-gray-500 font-medium"> / night</span>
                                </span>
                            </div>
                        </div>

                        {/* Mobile vibe badge */}
                        <div className={`md:hidden flex-none flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold shadow-md ${vibeClass}`}>
                            <Star className="w-4 h-4 fill-current" />
                            <span>{vibeScore.toFixed(1)}</span>
                        </div>
                    </div>

                    {/* Price strip (Mobile Only) */}
                    <div className="flex items-baseline gap-1.5 mb-4 md:hidden">
                        <span className="text-2xl font-extrabold text-gray-900">
                            ₹{homestay.pricePerNight.toLocaleString()}
                        </span>
                        <span className="text-gray-600 font-medium tracking-wide text-sm">/ night</span>
                    </div>

                    {/* ── Stay Highlights Chips ── */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {stayChips.map((chip) => (
                            <span
                                key={chip.label}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary/5 border border-primary/15 rounded-full text-xs font-semibold text-primary"
                            >
                                {chip.icon}
                                {chip.label}
                            </span>
                        ))}
                    </div>

                    <hr className="border-gray-200 mb-0" />

                    {/* ── Highlights ── */}
                    <Highlights items={highlightsItems} />

                    {/* ── Stay Story (Editorial) ── */}
                    <section className="py-10 border-b border-gray-200">
                        <h2 className="text-[22px] font-bold text-gray-900 mb-5 tracking-tight">Stay Story</h2>
                        <div className="pl-4 border-l-[3px] border-primary/20">
                            <p className="text-gray-700 leading-[1.75] text-base whitespace-pre-line font-medium italic first-line:not-italic first-line:font-semibold first-line:text-gray-900">
                                {homestay.description}
                            </p>
                        </div>
                    </section>

                    {/* ── Visual Rhythm: Image Break ── */}
                    {homestay.media && homestay.media.length > 1 && (
                        <section className="py-6 border-b border-gray-200">
                            <div className="rounded-2xl overflow-hidden h-[200px] md:h-[280px] relative">
                                <img
                                    src={homestay.media[1]?.url}
                                    alt={`${homestay.name} — atmosphere`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>
                        </section>
                    )}

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
                    {homestay.mealConfig && (
                        <MealsSection mealConfig={homestay.mealConfig} />
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

                    {/* ── Social Proof / Reviews Placeholder ── */}
                    <section className="py-10 border-b border-gray-200">
                        <h2 className="text-[22px] font-bold text-gray-900 mb-5 tracking-tight flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            Guest Reviews
                        </h2>
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
                            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Be the first guest to review this stay.</p>
                            <p className="text-gray-400 text-sm mt-1">Reviews from guests help future travelers make great choices.</p>
                        </div>
                    </section>

                    {/* ── Desktop QA Section ── */}
                    <div id="qa" className="hidden md:block">
                        <HomestayQASection homestayId={homestay.id} />
                    </div>
                </div>

                {/* Desktop Sticky Sidebar (Pricing / Inquiry) */}
                <div className="hidden md:block w-[350px] lg:w-[400px] flex-none relative">
                    <div className="sticky top-28">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] shadow-[0_6px_24px_rgba(0,0,0,0.12)] border border-gray-200/60 p-6 overflow-hidden relative">
                            {/* Subtle gradient border effect */}
                            <div className="absolute inset-0 rounded-[24px] border border-transparent bg-gradient-to-br from-primary/5 via-transparent to-emerald-50/30 pointer-events-none" />

                            <div className="flex items-end justify-between mb-4 relative z-10">
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

                            {/* Demand signal */}
                            <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl relative z-10">
                                <TrendingUp className="w-4 h-4 text-rose-600" />
                                <span className="text-xs font-semibold text-rose-700">High demand this season — book early</span>
                            </div>

                            <hr className="border-gray-200 mb-6" />

                            <InquirySection homestayName={homestay.name} />
                        </div>
                    </div>
                </div>

                {/* Mobile QA Section */}
                <div className="md:hidden w-full" id="qa-mobile">
                    <HomestayQASection homestayId={homestay.id} />
                </div>
            </div>

            {/* ═══════ STICKY MOBILE ACTION BAR ═══════ */}
            <div className="md:hidden">
                <StickyMobileBar
                    homestayName={homestay.name}
                    tripBoardItem={tripBoardItem}
                />
            </div>
        </div>
    );
}
