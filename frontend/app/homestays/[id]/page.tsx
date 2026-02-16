import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { StoryCarousel } from '@/components/story-carousel';
import { BookingForm } from '@/components/booking-form';
import { QASection } from '@/components/qa-section';
import { MapPin, Star, ShieldCheck } from 'lucide-react';
import HomestayMapWrapper from '@/components/HomestayMapWrapper';
import HomestayActions from '@/components/HomestayActions';

interface MediaItem {
    id: string;
    type: 'image' | 'video';
    url: string;
}

interface Homestay {
    id: string;
    name: string;
    description: string;
    locationName: string;
    latitude: number;
    longitude: number;
    pricePerNight: number;
    rating: number; // calculated or placeholder
    vibeScore: number;
    amenities: Record<string, boolean>;
    photoUrls: string[];
    ownerId?: string;
    ownerEmail?: string;
}

async function getHomestay(id: string): Promise<Homestay | null> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080/api';
    try {
        const res = await fetch(`${apiUrl}/homestays/${id}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            console.error(`[SERVER] Failed to fetch homestay ${id}: ${res.status} ${res.statusText}`);
            console.error(`[SERVER] API URL used: ${apiUrl}/homestays/${id}`);
            return null;
        }

        const data = await res.json();
        if (!data) return null;
        return data;
    } catch (error) {
        console.error('[SERVER] Error fetching homestay:', error);
        console.error(`[SERVER] API URL used: ${apiUrl}/homestays/${id}`);
        return null;
    }
}

export default async function HomestayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const homestay = await getHomestay(id);

    if (!homestay) {
        notFound();
    }

    // Transform photos for carousel
    const media: MediaItem[] = (homestay.photoUrls || []).map((url, index) => ({
        id: `media-${index}`,
        type: 'image', // Backend currently only stores string URLs, assume images
        url: url
    }));

    // Fallback media if none
    if (media.length === 0) {
        media.push({
            id: 'default',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1965&auto=format&fit=crop'
        });
    }

    // Transform amenities to array
    const amenitiesList = Object.entries(homestay.amenities || {})
        .filter(([_, value]) => value)
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

    return (
        <div className="min-h-screen pb-24 md:pb-0">
            <div className="md:container md:mx-auto md:p-4">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Story Carousel Section */}
                    <div className="h-[85vh] md:h-auto sticky top-0 md:top-24 self-start" data-testid="story-carousel">
                        <StoryCarousel media={media} vibeScore={homestay.vibeScore} />
                    </div>

                    {/* Details Section */}
                    <div className="p-4 md:p-0 flex flex-col pt-4 md:pt-0">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-3xl font-bold">{homestay.name}</h1>
                            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-semibold">{homestay.rating || 4.5}</span>
                            </div>
                        </div>

                        <HomestayActions homestayId={homestay.id} ownerEmail={homestay.ownerEmail || ""} />

                        <div className="flex items-center text-gray-500 mb-6">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{homestay.locationName || "North Bengal"}</span>
                        </div>

                        <p className="text-gray-600 mb-8 leading-relaxed whitespace-pre-line">
                            {homestay.description}
                        </p>

                        <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {amenitiesList.length > 0 ? amenitiesList.map((amenity) => (
                                <div key={amenity} className="flex items-center gap-2 text-gray-700 bg-gray-50 p-2 rounded-lg capitalize">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                    {amenity}
                                </div>
                            )) : (
                                <div className="text-gray-400">No specific amenities listed.</div>
                            )}
                        </div>

                        {/* Map Section */}
                        {(homestay.latitude && homestay.longitude) && (
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold mb-4">Location</h3>
                                <HomestayMapWrapper
                                    latitude={homestay.latitude}
                                    longitude={homestay.longitude}
                                    locationName={homestay.locationName}
                                />
                            </div>
                        )}

                        {/* Booking Form */}
                        <div className="border-t pt-8">
                            <BookingForm homestayId={homestay.id} pricePerNight={homestay.pricePerNight} />
                        </div>

                        {/* Q&A Section */}
                        <div className="mt-8">
                            <QASection homestayId={homestay.id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
