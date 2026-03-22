import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { BentoGallery } from '@/components/bento-gallery';
import { StickyMobileBar } from '@/components/sticky-mobile-bar';
import { InquirySection } from '@/components/inquiry-section';
import { BadgeCheck, Globe2, MessageSquare, PlayCircle, ShieldCheck, Star, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { getTrustSignalLabel, type TrustSignal } from '@/lib/trustSignals';

// Architecture Components
import { QuickFacts } from '@/components/homestay/quick-facts';
import { AmenitiesSection } from '@/components/homestay/amenities-section';
import { HostProfile } from '@/components/homestay/host-profile';
import { PoliciesSection } from '@/components/homestay/policies-section';
import { LocationMapSection } from '@/components/homestay/location-map-section';
import { HomestayQASection } from '@/components/homestay/homestay-qa-section';
import { MealsSection } from '@/components/homestay/meals-section';
import { SectionNav } from '@/components/homestay/section-nav';
import { HideOnErrorImage } from '@/components/ui/hide-on-error-image';
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

function isValidHttpUrl(value?: string | null): value is string {
    return Boolean(value && value.startsWith('http'));
}

function truncateText(value?: string, maxLength = 120) {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.length <= maxLength) {
        return trimmed;
    }

    return `${trimmed.slice(0, maxLength).trimEnd()}...`;
}

function toSentenceCase(value: string) {
    return value
        .toLowerCase()
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export default async function HomestayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let homestay: Homestay;
    try {
        const { apiFetch } = await import('@/lib/api-client');
        const res = await apiFetch(`/homestays/${id}`, { cache: 'no-store' });
        if (!res.ok) {
            return notFound();
        }

        const responseData = await res.json();
        homestay = responseData.data ? responseData.data : responseData;

        // Fire-and-forget telemetry: view
        apiFetch(`/homestays/${id}/view`, { method: 'POST' }).catch(() => {});

        if (!homestay?.id) return notFound();
    } catch {
        return notFound();
    }

    const pageShell = 'mx-auto w-full max-w-[1280px] px-4 md:px-6';
    const sectionShell = 'mt-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6';
    const sectionTitle = 'text-[22px] font-bold tracking-tight text-gray-900';
    const standardizedCardShell = 'mt-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6';
    const standardizedCardReset = '[&>section]:border-0 [&>section]:py-0 [&>div]:border-0 [&>div]:py-0';

    const vibeScore = homestay.vibeScore || 4.5;
    const homestayId = homestay.id;
    const homestayName = homestay.name || 'Homestay';
    const locationName = homestay.locationName || 'North Bengal';
    const galleryMediaUrls = Array.from(
        new Set(
            (homestay.media ?? [])
                .map((media) => media.url)
                .filter((url): url is string => isValidHttpUrl(url))
        )
    );
    const descriptionText = homestay.description?.trim() || homestay.editorialLead?.trim() || '';
    const pricePerNight = typeof homestay.pricePerNight === 'number' ? homestay.pricePerNight : null;
    const formattedPricePerNight = pricePerNight == null ? null : pricePerNight.toLocaleString();
    const visibleTags = (homestay.tags ?? [])
        .filter((tag): tag is string => Boolean(tag && tag.trim()))
        .slice(0, 6);
    const hostLanguages = Array.isArray(homestay.hostDetails?.languages)
        ? homestay.hostDetails.languages.filter((language: unknown): language is string => typeof language === 'string' && language.trim().length > 0)
        : [];
    const hostYearsHosting = typeof homestay.hostDetails?.yearsHosting === 'number' ? homestay.hostDetails.yearsHosting : null;
    const hostReviewsCount = typeof homestay.hostDetails?.reviewsCount === 'number' ? homestay.hostDetails.reviewsCount : null;
    const trustSignals = ((homestay.trustSignals ?? []) as TrustSignal[]).slice(0, 3);
    const spaces = (homestay.spaces ?? [])
        .map((space) => ({
            ...space,
            media: (space.media ?? []).filter((media) => isValidHttpUrl(media.url)),
        }))
        .filter((space) => (space.media?.length ?? 0) > 0 || space.name || space.description);
    const stayOptions = spaces;
    const videos = (homestay.videos ?? [])
        .map(video => ({ ...video, embedUrl: toYouTubeEmbedUrl(video.url) }))
        .filter(video => video.url && video.embedUrl);
    const attractions = (homestay.attractions ?? []).filter(item => item.name);
    const mustVisit = attractions.filter(item => item.highlight);
    const otherAttractions = attractions.filter(item => !item.highlight);
    const highlightImagePool = galleryMediaUrls.slice(1, 5);
    const experienceHighlightCards = visibleTags.slice(0, 4).map((tag, index) => ({
        tag,
        imageUrl: highlightImagePool[index] ?? null,
        accent: index === 0 && trustSignals[0] ? getTrustSignalLabel(trustSignals[0]) : index === 1 ? `Vibe ${vibeScore.toFixed(1)}` : null,
    }));
    const uniquePoints = [
        vibeScore
            ? { icon: Star, text: `Vibe score ${vibeScore.toFixed(1)} / 5 sets the overall tone for the stay.` }
            : null,
        hostLanguages.length > 0
            ? { icon: Globe2, text: `Host support is available in ${hostLanguages.slice(0, 3).join(', ')}${hostLanguages.length > 3 ? ` +${hostLanguages.length - 3} more` : ''}.` }
            : null,
        hostYearsHosting
            ? { icon: BadgeCheck, text: `Hosting journey started in ${hostYearsHosting}.` }
            : null,
        homestay.mealPlanLabel
            ? { icon: UtensilsCrossed, text: `${homestay.mealPlanLabel} is available for this stay.` }
            : null,
        trustSignals[0]
            ? { icon: ShieldCheck, text: `Trust signal: ${getTrustSignalLabel(trustSignals[0])}.` }
            : null,
        hostReviewsCount && hostReviewsCount > 0
            ? { icon: MessageSquare, text: `${hostReviewsCount} host profile reviews are already attached to this listing.` }
            : null,
    ].filter((item): item is { icon: LucideIcon; text: string } => Boolean(item));

    const isPriceUnset = pricePerNight !== null && pricePerNight <= 1;

    // Build trip board item for sticky bar
    const tripBoardItem = {
        id: homestayId,
        name: homestayName,
        imageUrl: galleryMediaUrls[0] || '',
        locationName,
        pricePerNight: pricePerNight ?? undefined,
    };
    // Extract Owner Name
    const ownerNameDisplay = homestay.host?.name || 'Host';

    return (
        <div className="min-h-screen bg-stone-50 pb-28 md:pb-10">
            {/* ═══════ GALLERY ═══════ */}
            <div className={`${pageShell} pt-4 md:pt-6`}>
                <BentoGallery
                    mediaUrls={galleryMediaUrls}
                    name={homestayName}
                    locationName={locationName}
                    editorialLead={homestay.editorialLead}
                    tags={visibleTags}
                    data-testid="bento-gallery"
                />
            </div>

            {/* ═══════ STICKY SECTION NAV ═══════ */}
            <SectionNav />

            {/* ═══════ DETAILS W/ SIDEBAR ═══════ */}
            <div className={`${pageShell} mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]`}>

                <div className="min-w-0">
                    {/* ── Header ── */}

                    {/* ── Stay Story (Editorial) ── */}
                    {descriptionText ? (
                        <section className="mt-8 rounded-[28px] border border-stone-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-8">
                            <h2 className="text-[22px] font-bold text-gray-900 mb-5 tracking-tight">Stay Story</h2>
                            <details className="group" open>
                                <summary className="list-none cursor-pointer">
                                    <div className="pl-5 py-2 border-l-[4px] border-primary/40 bg-gray-50/50 rounded-r-2xl shadow-sm">
                                        <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-line font-medium italic md:text-base md:leading-8">
                                            {homestay.description?.trim() || homestay.editorialLead?.trim()}
                                        </p>
                                    </div>
                                    <span className="mt-4 inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-stone-700">
                                        Full description
                                    </span>
                                </summary>
                            </details>
                        </section>
                    ) : null}

                    {/* ── Property Tour ── */}
                    {videos.length > 0 && (
                        <section id="videos" className="mt-10 space-y-5">
                            <div className="flex items-center gap-3">
                                <PlayCircle className="h-6 w-6 text-primary" />
                                <h2 className={sectionTitle}>Watch Property Tour</h2>
                            </div>
                            <div className="space-y-8">
                                {videos.map((video, index) => (
                                    <div key={`${video.url}-${index}`} className="overflow-hidden rounded-[28px] bg-stone-950 shadow-[0_22px_55px_rgba(15,23,42,0.18)]">
                                        <div className="aspect-video w-full">
                                            <iframe
                                                src={video.embedUrl || undefined}
                                                title={video.title || `Homestay video ${index + 1}`}
                                                className="h-full w-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        {(video.title || video.type) && (
                                            <div className="px-6 py-5 text-white">
                                                <p className="text-lg font-semibold tracking-tight">{video.title || 'Property tour'}</p>
                                                {video.type && <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">{video.type}</p>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}


                    {/* ── Experience Highlights ── */}
                    {experienceHighlightCards.length > 0 && (
                        <section id="experience" className={sectionShell}>
                            <div className="flex items-end justify-between gap-4">
                                <h2 className={sectionTitle}>Experience Highlights</h2>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {experienceHighlightCards.map((item, index) => (
                                    <article
                                        key={`${item.tag}-${index}`}
                                        className="group relative overflow-hidden rounded-xl border border-gray-100 bg-stone-950 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="relative aspect-[4/5]">
                                            {item.imageUrl ? (
                                                <HideOnErrorImage
                                                    src={item.imageUrl}
                                                    alt={item.tag}
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-stone-900 to-stone-950" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                                                {item.accent && <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{item.accent}</p>}
                                                <h3 className="mt-2 text-xl font-bold tracking-tight">{item.tag}</h3>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    )}

                    {uniquePoints.length > 0 && (
                        <section className={sectionShell}>
                            <div className="flex items-end justify-between gap-4">
                                <h2 className={sectionTitle}>What Makes This Place Unique</h2>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {uniquePoints.slice(0, 5).map((point) => {
                                    const Icon = point.icon;
                                    return (
                                        <div key={point.text} className="flex items-start gap-4 rounded-xl border border-gray-100 bg-stone-50 px-4 py-4">
                                            <div className="rounded-2xl bg-white p-2.5 shadow-sm">
                                                <Icon className="h-5 w-5 text-primary" />
                                            </div>
                                            <p className="text-sm leading-6 text-stone-700 md:text-base">{point.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <section id="room-types" className={sectionShell}>
                        <div className="flex items-end justify-between gap-4">
                            <h3 className={sectionTitle}>Stay Options</h3>
                        </div>
                        {stayOptions.length > 0 ? (
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {stayOptions.map((space, index) => (
                                    <details
                                        key={`${space.type}-${space.name || index}`}
                                        className="group overflow-hidden rounded-xl border border-gray-100 bg-stone-950 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <summary className="list-none cursor-pointer">
                                            <div className="relative aspect-[4/3]">
                                                {space.media?.[0]?.url ? (
                                                    <HideOnErrorImage
                                                        src={space.media[0].url}
                                                        alt={space.name || 'Homestay space'}
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-stone-900 to-stone-950" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                                                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                                                    {space.type && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{toSentenceCase(space.type)}</p>}
                                                    <h4 className="mt-2 text-xl font-bold tracking-tight md:text-2xl">{space.name || 'Space details'}</h4>
                                                    {space.description && <p className="mt-3 text-sm leading-6 text-white/80">{truncateText(space.description, 110)}</p>}
                                                </div>
                                            </div>
                                        </summary>
                                        {(space.media?.length ?? 0) > 1 && (
                                            <div className="grid grid-cols-2 gap-4 bg-white p-5">
                                                {(space.media ?? []).slice(1).map((media, mediaIndex) => {
                                                    if (!media.url) {
                                                        return null;
                                                    }
                                                    return (
                                                        <div key={media.fileId || `${space.name}-${mediaIndex}`} className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                                                            <HideOnErrorImage
                                                                src={media.url}
                                                                alt={media.caption || space.name || 'Homestay space'}
                                                                className="aspect-[4/3] h-full w-full object-cover"
                                                                loading="lazy"
                                                                decoding="async"
                                                            />
                                                            {media.caption && <p className="px-3 py-2 text-xs font-medium text-gray-600">{media.caption}</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </details>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-5 py-6 text-sm leading-6 text-stone-600">
                                Stay option media is not available in the current listing payload yet.
                            </div>
                        )}
                    </section>


                    {/* ── Quick Facts ── */}
                    {homestay.quickFacts && Object.keys(homestay.quickFacts).length > 0 && (
                        <QuickFacts facts={homestay.quickFacts} />
                    )}

                    {/* ── Amenities ── */}
                    {homestay.amenities && Object.keys(homestay.amenities).length > 0 && (
                        <div className={`${standardizedCardShell} ${standardizedCardReset}`}>
                            <AmenitiesSection providedAmenities={homestay.amenities} />
                        </div>
                    )}

                    {/* ── Policies ── */}
                    {homestay.policies && homestay.policies.length > 0 && (
                        <div className={`${standardizedCardShell} ${standardizedCardReset}`}>
                            <PoliciesSection policies={homestay.policies} />
                        </div>
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
                            <div className="space-y-8">
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
                <div className="hidden lg:block w-[360px] flex-none relative">
                    <div className="sticky top-28">
                        <div className="relative overflow-hidden rounded-[28px] border border-stone-200/80 bg-white/92 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                            {/* Subtle gradient border effect */}
                            <div className="absolute inset-0 rounded-[24px] border border-transparent bg-gradient-to-br from-primary/5 via-transparent to-emerald-50/30 pointer-events-none" />

                            <div className="relative z-10 mb-6 flex items-end justify-between gap-4">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    {isPriceUnset ? (
                                        <span className="text-lg font-extrabold text-gray-900 leading-tight">Contact host for price</span>
                                    ) : (
                                        <>
                                            <span className="text-[32px] font-extrabold text-gray-900 leading-tight">
                                                ₹{formattedPricePerNight}
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

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-800 transition-all hover:-translate-y-0.5 hover:bg-stone-50"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-800 transition-all hover:-translate-y-0.5 hover:bg-stone-50"
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





