import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { BentoGallery } from '@/components/bento-gallery';
import { StickyMobileBar } from '@/components/sticky-mobile-bar';
import { InquirySection } from '@/components/inquiry-section';
import { MapPin, Star, Mountain, Wifi, Flame, CookingPot, TrendingUp, MessageSquare, Sunrise, Leaf } from 'lucide-react';
import { getTrustSignalLabel, type TrustSignal } from '@/lib/trustSignals';

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
import type { Homestay } from '@/src/lib/api/models/homestay';

function toYouTubeEmbedUrl(rawUrl?: string) {
    if (!rawUrl) {
        return null;
    }

    try {
        const url = new URL(rawUrl);
        if (url.hostname.includes('youtu.be')) {
            const videoId = url.pathname.replace('/', '').trim();
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }

        if (url.hostname.includes('youtube.com')) {
            const videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }
    } catch {
        return null;
    }

    return null;
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

        // Fire-and-forget telemetry: view
        apiFetch(`/homestays/${id}/view`, { method: 'POST' }).catch(() => {});

        console.log("[HOMESTAY PAGE] Fetched homestay:", homestay.id, homestay.name);
        if (!homestay?.id) return notFound();
    } catch {
        return notFound();
    }

    const vibeScore = homestay.vibeScore || 4.5;
    const vibeClass = vibeScore >= 4.5 ? 'vibe-high' : vibeScore >= 3.5 ? 'vibe-mid' : 'vibe-low';
    const homestayId = homestay.id;
    const homestayName = homestay.name || 'Homestay';
    const locationName = homestay.locationName || 'North Bengal';
    const galleryMediaUrls = (homestay.media ?? []).map(media => media.url).filter((url): url is string => Boolean(url));
    const pricePerNight = typeof homestay.pricePerNight === 'number' ? homestay.pricePerNight : null;

    const trustSignals = ((homestay.trustSignals ?? []) as TrustSignal[]).slice(0, 2);
    const spaces = (homestay.spaces ?? []).filter(space => (space.media?.length ?? 0) > 0 || space.name || space.description);
    const videos = (homestay.videos ?? [])
        .map(video => ({ ...video, embedUrl: toYouTubeEmbedUrl(video.url) }))
        .filter(video => video.url && video.embedUrl);
    const attractions = (homestay.attractions ?? []).filter(item => item.name);
    const mustVisit = attractions.filter(item => item.highlight);
    const otherAttractions = attractions.filter(item => !item.highlight);

    const isPriceUnset = pricePerNight !== null && pricePerNight <= 1;

    // Build trip board item for sticky bar
    const tripBoardItem = {
        id: homestayId,
        name: homestayName,
        imageUrl: homestay.media?.[0]?.url || '',
        locationName,
        pricePerNight: pricePerNight ?? undefined,
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
    const experienceCards: { title: string; subtitle: string; icon: React.ReactNode }[] = [];
    if (homestay.amenities?.['Mountain View']) {
        experienceCards.push({
            title: 'Sunrise balcony view',
            subtitle: 'Wake up to ridgelines and golden-hour light, right from your room.',
            icon: <Sunrise className="w-5 h-5 text-amber-600" />
        });
    }
    if (homestay.amenities?.['Bonfire (Extra)']) {
        experienceCards.push({
            title: 'Bonfire evenings',
            subtitle: 'Slow nights, warm conversations, and mountain air under the stars.',
            icon: <Flame className="w-5 h-5 text-rose-600" />
        });
    }
    if (homestay.mealConfig?.mealsIncludedPerDay && homestay.mealConfig.mealsIncludedPerDay > 0) {
        experienceCards.push({
            title: 'Organic village meals',
            subtitle: 'Home-cooked comfort—simple, seasonal, and deeply local.',
            icon: <Leaf className="w-5 h-5 text-emerald-700" />
        });
    }
    if (homestay.amenities?.['Wifi'] || homestay.amenities?.['Free Wi-Fi']) {
        experienceCards.push({
            title: 'Work-friendly comfort',
            subtitle: 'A calm corner and reliable Wi‑Fi for unhurried remote days.',
            icon: <Wifi className="w-5 h-5 text-sky-700" />
        });
    }
    if (experienceCards.length === 0) {
        experienceCards.push({
            title: 'Nature retreat',
            subtitle: 'A quiet base for slow mornings, forest walks, and fresh air.',
            icon: <Mountain className="w-5 h-5 text-emerald-800" />
        });
    }

    // Extract Owner Name
    const ownerNameDisplay = homestay.host?.name || 'Host';

    return (
        <div className="min-h-screen bg-background pb-28 md:pb-10">
            {/* ═══════ GALLERY ═══════ */}
            <div className="md:container md:mx-auto md:px-4 md:pt-6">
                <BentoGallery
                    mediaUrls={galleryMediaUrls}
                    name={homestayName}
                    locationName={locationName}
                    editorialLead={homestay.editorialLead}
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
                            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                                {homestayName}
                            </h1>
                            {homestay.editorialLead && (
                                <p className="text-xl text-gray-700 font-medium italic mt-3 mb-4 leading-relaxed tracking-wide">
                                    {homestay.editorialLead}
                                </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-gray-600 text-sm font-medium flex-wrap">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-primary flex-none" />
                                    <span className="underline underline-offset-4 decoration-gray-300 font-semibold">{locationName}</span>
                                </span>
                                {/* Desktop inline rating */}
                                <span className="hidden md:flex items-center gap-1 text-sm">
                                    <Star className="w-4 h-4 fill-gray-900 text-gray-900" />
                                    <span className="font-bold">{vibeScore.toFixed(1)}</span>
                                </span>
                                {/* Desktop inline price */}
                                <span className="hidden md:inline text-sm text-gray-500">·</span>
                                <span className="hidden md:inline text-sm font-semibold text-gray-900">
                                    {isPriceUnset
                                        ? 'Contact host for price'
                                        : <>₹{homestay.pricePerNight.toLocaleString()}<span className="text-gray-500 font-medium"> / night</span></>}
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
                    <div className="flex items-baseline gap-1.5 mb-6 md:hidden">
                        {isPriceUnset ? (
                            <span className="text-xl font-extrabold text-gray-900">Contact host for price</span>
                        ) : (
                            <>
                                <span className="text-3xl font-extrabold text-gray-900">
                                    ₹{homestay.pricePerNight.toLocaleString()}
                                </span>
                                <span className="text-gray-600 font-medium tracking-wide text-sm">/ night</span>
                            </>
                        )}
                    </div>

                    <hr className="border-gray-200 mb-0" />

                    {/* ── Stay Story (Editorial) ── */}
                    {homestay.editorialLead || homestay.description ? (
                        <section className="py-10 border-t border-b border-gray-200 mt-6">
                            <h2 className="text-[22px] font-bold text-gray-900 mb-5 tracking-tight">Stay Story</h2>
                            <div className="pl-5 py-2 border-l-[4px] border-primary/40 bg-gray-50/50 rounded-r-2xl shadow-sm">
                                <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-line font-medium italic">
                                    {homestay.editorialLead || homestay.description}
                                </p>
                            </div>
                        </section>
                    ) : null}

                    {/* ── Property Tour ── */}
                    {videos.length > 0 && (
                        <section id="videos" className="py-10 border-b border-gray-200">
                            <h2 className="text-[22px] font-bold text-gray-900 mb-5 tracking-tight">Property tour</h2>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {videos.map((video, index) => (
                                    <div key={`${video.url}-${index}`} className="min-w-[320px] md:min-w-[420px]">
                                        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-black shadow-sm">
                                            <iframe
                                                src={video.embedUrl || undefined}
                                                title={video.title || `Homestay video ${index + 1}`}
                                                className="h-[220px] w-full md:h-[260px]"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <div className="mt-3 px-1">
                                            <p className="text-sm font-bold text-gray-900">{video.title || 'Property tour'}</p>
                                            {video.type && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mt-1">{video.type}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ── Highlights ── */}
                    <Highlights items={highlightsItems} />

                    {/* ── Experience Highlights ── */}
                    <section id="experience" className="py-10 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">Experience Highlights</h3>
                        {spaces.length > 0 ? (
                            <div className="space-y-6">
                                {spaces.map((space, index) => (
                                    <div key={`${space.type}-${space.name || index}`} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_10px_26px_rgba(0,0,0,0.06)]">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{space.type}</p>
                                                <h4 className="text-lg font-bold text-gray-900 mt-1">{space.name || 'Space details'}</h4>
                                                {space.description && <p className="text-sm text-gray-600 mt-2 max-w-2xl">{space.description}</p>}
                                            </div>
                                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                                                {(space.media?.length ?? 0)} photo{(space.media?.length ?? 0) === 1 ? '' : 's'}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {(space.media ?? []).map((media, mediaIndex) => (
                                                <div key={media.fileId || `${space.name}-${mediaIndex}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                                                    <img src={media.url} alt={media.caption || space.name || 'Homestay space'} className="h-40 w-full object-cover" loading="lazy" decoding="async" />
                                                    {media.caption && <p className="px-3 py-2 text-xs font-medium text-gray-600">{media.caption}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {experienceCards.slice(0, 4).map((card) => (
                                    <div
                                        key={card.title}
                                        className="rounded-2xl border border-gray-200 bg-white shadow-[0_6px_18px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_26px_rgba(0,0,0,0.08)] transition-shadow p-5"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-none">
                                                {card.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-base font-bold text-gray-900 tracking-tight">{card.title}</p>
                                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{card.subtitle}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── Visual Rhythm: Image Break ── */}
                    {homestay.media && homestay.media.length > 1 && (
                        <section className="py-6 border-b border-gray-200">
                            <div className="rounded-2xl overflow-hidden h-[200px] md:h-[280px] relative">
                                <img
                                    src={homestay.media[1]?.url}
                                    alt={`${homestayName} — atmosphere`}
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

                    {/* ── Visual Rhythm: Secondary Image Break ── */}
                    {homestay.media && homestay.media.length > 2 && (
                        <section className="py-8 border-b border-gray-200">
                            <div className="rounded-2xl overflow-hidden h-[200px] md:h-[260px] relative shadow-sm">
                                <img
                                    src={homestay.media[2]?.url}
                                    alt={`${homestayName} — details`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>
                        </section>
                    )}

                    {/* ── Meals & Dining ── */}
                    {homestay.mealConfig && (
                        <MealsSection mealConfig={{
                            ...homestay.mealConfig,
                            mealPlanLabel: homestay.mealPlanLabel || homestay.mealConfig.mealPlanLabel,
                        }} />
                    )}

                    {/* ── Meet Your Host ── */}
                    {homestay.hostDetails && Object.keys(homestay.hostDetails).length > 0 && (
                        <HostProfile ownerId={homestay.ownerId} ownerName={ownerNameDisplay} hostDetails={homestay.hostDetails} />
                    )}

                    {/* ── Map ── */}
                    <LocationMapSection
                        latitude={homestay.latitude}
                        longitude={homestay.longitude}
                        locationName={locationName}
                        nearbyHighlights={homestay.nearbyHighlights}
                    />

                    {attractions.length > 0 && (
                        <section id="attractions" className="py-10 border-b border-gray-200">
                            <h2 className="text-[22px] font-bold text-gray-900 mb-5 tracking-tight">Nearby places</h2>
                            <div className="space-y-6">
                                {mustVisit.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Must visit</h3>
                                        {mustVisit.map((attraction, index) => (
                                            <div key={`must-${attraction.name}-${index}`} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-base font-bold text-gray-900">{attraction.name}</p>
                                                        <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">Highlight</span>
                                                        {attraction.type && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">{attraction.type}</span>}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {[attraction.distance, attraction.time].filter(Boolean).join(' • ') || 'Near the property'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {otherAttractions.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500">More nearby</h3>
                                        {otherAttractions.map((attraction, index) => (
                                            <div key={`other-${attraction.name}-${index}`} className="rounded-2xl border border-gray-200 bg-white px-4 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-base font-bold text-gray-900">{attraction.name}</p>
                                                        {attraction.type && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600">{attraction.type}</span>}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {[attraction.distance, attraction.time].filter(Boolean).join(' • ') || 'Near the property'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

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
                        <HomestayQASection homestayId={homestayId} />
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
                                    {isPriceUnset ? (
                                        <span className="text-lg font-extrabold text-gray-900 leading-tight">Contact host for price</span>
                                    ) : (
                                        <>
                                            <span className="text-[32px] font-extrabold text-gray-900 leading-tight">
                                                ₹{homestay.pricePerNight.toLocaleString()}
                                            </span>
                                            <span className="text-gray-600 font-medium tracking-wide">/ night</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1 font-bold text-gray-900">
                                        <Star className="w-4 h-4 fill-gray-900" />
                                        <span>{vibeScore.toFixed(1)}</span>
                                    </div>
                                    <div className="text-xs font-semibold text-gray-500">
                                        {(typeof homestay.totalReviews === 'number' && homestay.totalReviews > 0)
                                            ? `${homestay.totalReviews} reviews`
                                            : 'New stay'}
                                    </div>
                                </div>
                            </div>

                            {/* Trust signals (dynamic, max 2) */}
                            {trustSignals.length > 0 && (
                                <div className="mb-5 space-y-2 relative z-10">
                                    {trustSignals.map((sig) => (
                                        <div
                                            key={sig}
                                            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/70 border border-gray-200"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-xs font-semibold text-gray-900">{getTrustSignalLabel(sig)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {homestay.offers?.type && homestay.offers?.title && (
                                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 relative z-10">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                                            {homestay.offers.type}
                                        </span>
                                        <p className="text-sm font-bold text-amber-950">{homestay.offers.title}</p>
                                    </div>
                                    {homestay.offers.description && <p className="text-sm text-amber-900 mt-2">{homestay.offers.description}</p>}
                                    {homestay.offers.validity && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 mt-2">{homestay.offers.validity}</p>}
                                </div>
                            )}

                            <hr className="border-gray-200 mb-6" />

                            <InquirySection homestayId={homestayId} homestayName={homestayName} />

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                                >
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile QA Section */}
                <div className="md:hidden w-full" id="qa-mobile">
                    <HomestayQASection homestayId={homestayId} />
                </div>
            </div>

            {/* ═══════ STICKY MOBILE ACTION BAR ═══════ */}
            <div className="md:hidden">
                <StickyMobileBar
                    homestayName={homestayName}
                    tripBoardItem={tripBoardItem}
                />
            </div>
        </div>
    );
}
