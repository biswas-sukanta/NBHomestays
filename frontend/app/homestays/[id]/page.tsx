import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import Link from 'next/link';
import { StickyMobileBar } from '@/components/sticky-mobile-bar';
import { InquirySection } from '@/components/inquiry-section';
import { BadgeCheck, Globe2, MapPin, MessageSquare, PlayCircle, ShieldCheck, Star, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { getTrustSignalLabel, type TrustSignal } from '@/lib/trustSignals';
import { Reveal } from '@/components/ui/reveal';

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
        apiFetch(`/homestays/${id}/view`, { method: 'POST' }).catch(() => {});

        if (!homestay?.id) return notFound();
    } catch {
        return notFound();
    }

    const pageShell = 'mx-auto w-full max-w-[1240px] px-4 md:px-6';
    const narrativeSection = 'mt-20 border-t border-stone-200/80 pt-12';
    const sectionTitle = 'text-[30px] font-semibold tracking-[-0.03em] text-stone-950 md:text-[38px]';

    const homestayId = homestay.id;
    const homestayName = homestay.name || 'Homestay';
    const locationName = homestay.locationName || 'North Bengal';
    const descriptionText = homestay.description?.trim() || homestay.editorialLead?.trim() || '';
    const shortDescription = truncateText(descriptionText, 120);
    const pricePerNight = typeof homestay.pricePerNight === 'number' ? homestay.pricePerNight : null;
    const formattedPricePerNight = pricePerNight == null ? null : pricePerNight.toLocaleString();
    const isPriceUnset = pricePerNight !== null && pricePerNight <= 1;
    const statusLabel = homestay.status ? toSentenceCase(homestay.status) : null;

    const galleryMediaUrls = Array.from(
        new Set(
            (homestay.media ?? [])
                .map((media) => media.url)
                .filter((url): url is string => isValidHttpUrl(url))
        )
    );

    const visibleTags = (homestay.tags ?? []).filter((tag): tag is string => Boolean(tag && tag.trim()));
    const trustSignals = ((homestay.trustSignals ?? []) as TrustSignal[]).slice(0, 3);
    const hostLanguages = Array.isArray(homestay.hostDetails?.languages)
        ? homestay.hostDetails.languages.filter((language: unknown): language is string => typeof language === 'string' && language.trim().length > 0)
        : [];
    const hostYearsHosting = typeof homestay.hostDetails?.yearsHosting === 'number' ? homestay.hostDetails.yearsHosting : null;
    const hostReviewsCount = typeof homestay.hostDetails?.reviewsCount === 'number' ? homestay.hostDetails.reviewsCount : null;
    const vibeScore = typeof homestay.vibeScore === 'number' ? homestay.vibeScore : null;

    const spaces = (homestay.spaces ?? [])
        .map((space) => ({
            ...space,
            media: (space.media ?? []).filter((media) => isValidHttpUrl(media.url)),
        }))
        .filter((space) => (space.media?.length ?? 0) > 0 || space.name || space.description);

    const stayOptions = spaces.filter((space) => {
        const normalizedName = space.name?.trim().toLowerCase();
        return space.type !== 'outdoor' && normalizedName !== 'outdoor';
    });

    const videos = (homestay.videos ?? [])
        .map((video) => ({ ...video, embedUrl: toYouTubeEmbedUrl(video.url) }))
        .filter((video) => video.url && video.embedUrl);

    const attractions = (homestay.attractions ?? []).filter((item) => item.name);
    const mustVisit = attractions.filter((item) => item.highlight);
    const otherAttractions = attractions.filter((item) => !item.highlight);

    const usedTags = new Set<string>();
    const usedImages = new Set<string>();

    const claimImage = (preferred?: string | null) => {
        if (!preferred || usedImages.has(preferred)) {
            return null;
        }
        usedImages.add(preferred);
        return preferred;
    };

    const claimNextImage = () => {
        const nextImage = galleryMediaUrls.find((url) => !usedImages.has(url));
        return claimImage(nextImage);
    };

    const heroImage = claimImage(galleryMediaUrls[0]) || null;
    const highlightLabels = [...visibleTags, ...trustSignals.map((signal) => getTrustSignalLabel(signal))]
        .filter((label, index, array) => array.indexOf(label) === index);
    const experienceHighlights = highlightLabels
        .map((label) => {
            if (usedTags.has(label)) {
                return null;
            }
            const imageUrl = claimNextImage();
            if (!imageUrl) {
                return null;
            }
            usedTags.add(label);
            return { label, imageUrl };
        })
        .filter((item): item is { label: string; imageUrl: string } => Boolean(item))
        .slice(0, 4);
    const remainingGalleryImages = galleryMediaUrls.filter((url) => !usedImages.has(url));
    const quickInfo = [
        statusLabel ? { label: 'Listing', value: statusLabel } : null,
        stayOptions.length > 0 ? { label: 'Stay options', value: `${stayOptions.length} available` } : null,
        videos.length > 0 ? { label: 'Tour', value: `${videos.length} video${videos.length > 1 ? 's' : ''}` } : null,
        attractions.length > 0 ? { label: 'Nearby places', value: `${attractions.length} listed` } : null,
    ].filter((item): item is { label: string; value: string } => Boolean(item));

    const uniquePoints = [
        vibeScore
            ? { icon: Star, text: `Vibe score ${vibeScore.toFixed(1)} / 5 gives the stay its overall atmosphere.` }
            : null,
        hostLanguages.length > 0
            ? { icon: Globe2, text: `The host supports guests in ${hostLanguages.slice(0, 3).join(', ')}${hostLanguages.length > 3 ? ` and ${hostLanguages.length - 3} more languages` : ''}.` }
            : null,
        hostYearsHosting
            ? { icon: BadgeCheck, text: `Hosting has been part of this place since ${hostYearsHosting}.` }
            : null,
        trustSignals[0]
            ? { icon: ShieldCheck, text: getTrustSignalLabel(trustSignals[0]) }
            : null,
        homestay.mealPlanLabel
            ? { icon: UtensilsCrossed, text: `${homestay.mealPlanLabel} is part of the stay setup.` }
            : null,
        hostReviewsCount && hostReviewsCount > 0
            ? { icon: MessageSquare, text: `${hostReviewsCount} host profile reviews are already on record.` }
            : null,
    ].filter((item): item is { icon: LucideIcon; text: string } => Boolean(item)).slice(0, 5);

    const ownerNameDisplay = homestay.host?.name || 'Host';
    const tripBoardItem = {
        id: homestayId,
        name: homestayName,
        imageUrl: heroImage || galleryMediaUrls[0] || '',
        locationName,
        pricePerNight: pricePerNight ?? undefined,
    };

    return (
        <div className="min-h-screen bg-[#f5f1ea] pb-28 text-stone-900 md:pb-12">
            <section className="relative min-h-[78vh] overflow-hidden bg-stone-950 text-white">
                {heroImage ? (
                    <HideOnErrorImage
                        src={heroImage}
                        alt={homestayName}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                    />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12)_0%,rgba(15,23,42,0.4)_38%,rgba(15,23,42,0.88)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_35%)]" />

                <div className={`${pageShell} relative flex min-h-[78vh] items-end pb-14 pt-28 md:pb-20`}>
                    <Reveal className="max-w-3xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.34em] text-white/72">{homestayName}</p>
                        {shortDescription && (
                            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-white md:text-6xl lg:text-7xl">
                                {shortDescription}
                            </h1>
                        )}
                        <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-medium text-white/84">
                            <Link href="#booking" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-200">
                                Plan this stay
                            </Link>
                            <Link href="#stay-options" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                                See stay options
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>

            <SectionNav />

            <div className={`${pageShell} mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]`}>
                <div className="min-w-0">
                    <section id="overview" className="border-y border-stone-200/80 py-5">
                        <Reveal>
                            <div className="grid gap-4 md:grid-cols-4 md:gap-6">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">Location</p>
                                    <p className="mt-2 text-sm leading-6 text-stone-700 md:text-base">{locationName}</p>
                                </div>
                                {quickInfo.map((item) => (
                                    <div key={item.label}>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">{item.label}</p>
                                        <p className="mt-2 text-sm leading-6 text-stone-700 md:text-base">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    </section>

                    {remainingGalleryImages.length > 0 && (
                        <Reveal className="mt-10">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {remainingGalleryImages.map((imageUrl, index) => (
                                    <div key={`${imageUrl}-${index}`} className="relative overflow-hidden rounded-[22px]">
                                        <HideOnErrorImage
                                            src={imageUrl}
                                            alt={`${homestayName} photo ${index + 1}`}
                                            className="aspect-[5/4] h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                ))}
                            </div>
                        </Reveal>
                    )}

                    {descriptionText ? (
                        <section className={narrativeSection}>
                            <Reveal>
                                <h2 className={sectionTitle}>Stay Story</h2>
                                <div className="mt-6 max-w-3xl">
                                    <p className="text-lg leading-9 text-stone-700">{descriptionText}</p>
                                </div>
                            </Reveal>
                        </section>
                    ) : null}

                    {videos.length > 0 && (
                        <section id="videos" className={narrativeSection}>
                            <Reveal>
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <h2 className={sectionTitle}>Watch Property Tour</h2>
                                        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                                            Walk through the stay exactly as the host has filmed it.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                            <div className="mt-8 space-y-10">
                                {videos.map((video, index) => (
                                    <Reveal key={`${video.url}-${index}`} delay={0.05 * index}>
                                        <div className="overflow-hidden rounded-[28px] bg-stone-950">
                                            <div className="aspect-video w-full">
                                                <iframe
                                                    src={video.embedUrl || undefined}
                                                    title={video.title || `Homestay video ${index + 1}`}
                                                    className="h-full w-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </section>
                    )}
                    {experienceHighlights.length > 0 && (
                        <section id="experience" className={narrativeSection}>
                            <Reveal>
                                <h2 className={sectionTitle}>Experience Highlights</h2>
                                <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                                    A few strong cues from the listing define the tone of the stay. Each highlight owns one image and one idea.
                                </p>
                            </Reveal>
                            <div className="mt-8 grid gap-4 md:grid-cols-2">
                                {experienceHighlights.map((item, index) => (
                                    <Reveal key={`${item.label}-${index}`} delay={0.05 * index}>
                                        <article className="group relative min-h-[430px] overflow-hidden rounded-[30px] bg-stone-950">
                                            <HideOnErrorImage
                                                src={item.imageUrl}
                                                alt={item.label}
                                                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.22)_38%,rgba(0,0,0,0.82)_100%)]" />
                                            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/68">Highlight {index + 1}</p>
                                                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">{item.label}</h3>
                                            </div>
                                        </article>
                                    </Reveal>
                                ))}
                            </div>
                        </section>
                    )}

                    {uniquePoints.length > 0 && (
                        <section className={narrativeSection}>
                            <Reveal>
                                <h2 className={sectionTitle}>What Makes This Place Unique</h2>
                            </Reveal>
                            <div className="mt-8 grid gap-5 md:grid-cols-2">
                                {uniquePoints.map((point, index) => {
                                    const Icon = point.icon;
                                    return (
                                        <Reveal key={point.text} delay={0.04 * index}>
                                            <div className="flex items-start gap-4 border-t border-stone-200 pt-5">
                                                <Icon className="mt-1 h-5 w-5 text-stone-500" />
                                                <p className="text-base leading-7 text-stone-700">{point.text}</p>
                                            </div>
                                        </Reveal>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    <section id="stay-options" className={narrativeSection}>
                        <Reveal>
                            <h2 className={sectionTitle}>Stay Options</h2>
                            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                                Only the listing's actual stay units are shown here. Outdoor misclassifications are removed, and this section stays text-led so image ownership remains exclusive to the visual narrative above.
                            </p>
                        </Reveal>
                        {stayOptions.length > 0 ? (
                            <div className="mt-10 divide-y divide-stone-200 border-y border-stone-200">
                                {stayOptions.map((space, index) => (
                                    <Reveal key={`${space.type}-${space.name || index}`} delay={0.06 * index}>
                                        <article className="grid gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                                            <div>
                                                {space.type && <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">{toSentenceCase(space.type)}</p>}
                                                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-stone-950">{space.name || 'Stay option'}</h3>
                                            </div>
                                            <div className="max-w-2xl">
                                                {space.description && <p className="mt-4 text-base leading-8 text-stone-700">{space.description}</p>}
                                            </div>
                                        </article>
                                    </Reveal>
                                ))}
                            </div>
                        ) : (
                            <Reveal>
                                <div className="mt-8 border-t border-dashed border-stone-300 pt-6 text-base leading-7 text-stone-600">
                                    Room-level media is not available in the current listing payload yet.
                                </div>
                            </Reveal>
                        )}
                    </section>

                    {homestay.quickFacts && Object.keys(homestay.quickFacts).length > 0 && (
                        <Reveal className={narrativeSection}>
                            <QuickFacts facts={homestay.quickFacts} />
                        </Reveal>
                    )}

                    {homestay.amenities && Object.keys(homestay.amenities).length > 0 && (
                        <Reveal className={narrativeSection}>
                            <AmenitiesSection providedAmenities={homestay.amenities} />
                        </Reveal>
                    )}

                    {homestay.mealConfig && (
                        <Reveal className={narrativeSection}>
                            <MealsSection mealConfig={{
                                ...homestay.mealConfig,
                                mealPlanLabel: homestay.mealPlanLabel || homestay.mealConfig.mealPlanLabel,
                            }} />
                        </Reveal>
                    )}
                    {homestay.policies && homestay.policies.length > 0 && (
                        <Reveal className={narrativeSection}>
                            <PoliciesSection policies={homestay.policies} />
                        </Reveal>
                    )}

                    {homestay.hostDetails && Object.keys(homestay.hostDetails).length > 0 && (
                        <Reveal className={narrativeSection}>
                            <HostProfile ownerId={homestay.ownerId} ownerName={ownerNameDisplay} hostDetails={homestay.hostDetails} />
                        </Reveal>
                    )}

                    <Reveal className={narrativeSection}>
                        <LocationMapSection
                            latitude={homestay.latitude}
                            longitude={homestay.longitude}
                            locationName={locationName}
                            nearbyHighlights={homestay.nearbyHighlights}
                        />
                    </Reveal>

                    {attractions.length > 0 && (
                        <section id="attractions" className={narrativeSection}>
                            <Reveal>
                                <h2 className={sectionTitle}>Nearby places</h2>
                            </Reveal>
                            <div className="mt-8 space-y-8">
                                {mustVisit.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Must visit</h3>
                                        {mustVisit.map((attraction, index) => (
                                            <div key={`must-${attraction.name}-${index}`} className="border-t border-stone-200 py-5 md:flex md:items-start md:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-lg font-semibold text-stone-950">{attraction.name}</p>
                                                        {attraction.type && <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{toSentenceCase(attraction.type)}</span>}
                                                    </div>
                                                    <p className="mt-2 text-sm text-stone-600">{[attraction.distance, attraction.time].filter(Boolean).join(' · ') || 'Near the property'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {otherAttractions.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-stone-500">More nearby</h3>
                                        {otherAttractions.map((attraction, index) => (
                                            <div key={`other-${attraction.name}-${index}`} className="border-t border-stone-200 py-5 md:flex md:items-start md:justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-lg font-semibold text-stone-950">{attraction.name}</p>
                                                        {attraction.type && <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{toSentenceCase(attraction.type)}</span>}
                                                    </div>
                                                    <p className="mt-2 text-sm text-stone-600">{[attraction.distance, attraction.time].filter(Boolean).join(' · ') || 'Near the property'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    <section className={narrativeSection}>
                        <Reveal>
                            <h2 className="flex items-center gap-2 text-[22px] font-bold text-stone-950 tracking-tight">
                                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                Guest Reviews
                            </h2>
                            <div className="mt-6 border-t border-stone-200 py-8 text-center">
                                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-stone-300" />
                                <p className="font-medium text-stone-500">Be the first guest to review this stay.</p>
                                <p className="mt-1 text-sm text-stone-400">Reviews from guests help future travelers make better choices.</p>
                            </div>
                        </Reveal>
                    </section>

                    <div id="qa" className="hidden md:block">
                        <HomestayQASection homestayId={homestayId} />
                    </div>
                </div>

                <div className="hidden md:block w-[350px] lg:w-[400px] flex-none relative">
                    <div id="booking" className="sticky top-28 border-l border-stone-200/80 pl-6 lg:pl-8">
                        <div className="space-y-6">
                            <div>
                                {isPriceUnset ? (
                                    <p className="text-lg font-semibold text-stone-950">Contact host for price</p>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[40px] font-semibold tracking-[-0.04em] text-stone-950">Rs {formattedPricePerNight}</span>
                                        <span className="text-sm font-medium uppercase tracking-[0.16em] text-stone-500">per night</span>
                                    </div>
                                )}
                            </div>

                            {homestay.offers?.type && homestay.offers?.title && (
                                <div className="border-t border-stone-200 pt-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Offer</p>
                                    <p className="mt-2 text-lg font-semibold text-stone-950">{homestay.offers.title}</p>
                                    {homestay.offers.description && <p className="mt-2 text-sm leading-6 text-stone-600">{homestay.offers.description}</p>}
                                    {homestay.offers.validity && <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">{homestay.offers.validity}</p>}
                                </div>
                            )}

                            <div className="border-t border-stone-200 pt-6">
                                <InquirySection homestayId={homestayId} homestayName={homestayName} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:hidden w-full" id="qa-mobile">
                    <HomestayQASection homestayId={homestayId} />
                </div>
            </div>

            <div className="md:hidden">
                <StickyMobileBar homestayName={homestayName} tripBoardItem={tripBoardItem} />
            </div>
        </div>
    );
}
