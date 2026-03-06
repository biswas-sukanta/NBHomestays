'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Trash2, Plus, Wifi, Mountain, Droplets, Zap, Coffee, UtensilsCrossed, Car, PawPrint,
    Bed, Bath, Flame, Wind, ShieldCheck, Laptop, ChefHat, Package, BellRing, Ban,
    Gamepad2, Tv2, Snowflake, Drumstick, BookOpen, Shirt, Thermometer, Camera, Sparkles
} from 'lucide-react';
import ImageDropzone, { StagedFile } from '@/components/host/ImageDropzone';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center rounded-xl border">Loading Map...</div>
});

// --- Constants ---
const AMENITY_CATEGORIES: Record<string, string[]> = {
    '⭐ Highlights': ['Mountain View', 'Hot water', 'Free Wi-Fi', 'Water Dispenser', 'Common hangout area', 'Cafe', 'In-house Activities', 'Bedside Lamps', 'Breakfast (Extra)', 'UPI Payment Accepted', 'Pets Allowed', 'Parking (public)', 'Charging Points', 'Power Backup', 'Indoor Games', 'Bonfire (Extra)'],
    '🚿 Bathroom': ['Bath', 'Hairdryer', 'Cleaning products', 'Shampoo', 'Body soap', 'Shower gel'],
    '🛏 Bedroom & Laundry': ['Free washer', 'Free dryer', 'Essentials (Towels, bed sheets, soap, TP)', 'Hangers', 'Bed linen', 'Cotton linen', 'Extra pillows/blankets', 'Room-darkening blinds', 'Iron', 'Clothes drying rack', 'Clothes storage'],
    '🎭 Entertainment': ['Books/reading material', 'Children\'s books/toys', 'Fireplace guards'],
    '🌡 Heating & Cooling': ['Indoor fireplace', 'Portable fans', 'Heating'],
    '🔒 Safety': ['Smoke alarm'],
    '💻 Internet & Office': ['Wifi', 'Dedicated workspace'],
    '🍳 Kitchen & Dining': ['Kitchen', 'Cooking space', 'Fridge', 'Microwave', 'Cooking basics', 'Crockery/cutlery', 'Freezer', 'Dishwasher', 'Gas cooker', 'Oven', 'Kettle', 'Coffee maker', 'Wine glasses', 'Toaster', 'Blender', 'Dining table'],
    '🛎 Services': ['Luggage drop-off allowed', 'Host greets you'],
    '🚫 Unavailable': ['Lock on bedroom door', 'Exterior security cameras', 'TV', 'Air conditioning', 'Carbon monoxide alarm']
};

const LOCATION_TYPE_OPTIONS = ['Remote', 'Village Center', 'Hill Station', 'Forest Retreat', 'Riverside', 'Town Outskirts'];
const HIKE_OPTIONS = ['None', 'Short walk < 5 min', '5–15 min walk', '15–30 min hike', '30 min+ trail'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Bengali', 'Nepali', 'Assamese', 'Khasi', 'Garo', 'Bodo', 'Tibetan', 'Sikkimese'];

// Lucide icon map for amenity pills — falls back gracefully if an amenity has no icon
const AMENITY_ICONS: Record<string, React.ReactNode> = {
    'Mountain View': <Mountain className="w-3.5 h-3.5" />,
    'Hot water': <Droplets className="w-3.5 h-3.5" />,
    'Free Wi-Fi': <Wifi className="w-3.5 h-3.5" />,
    'Wifi': <Wifi className="w-3.5 h-3.5" />,
    'Power Backup': <Zap className="w-3.5 h-3.5" />,
    'Cafe': <Coffee className="w-3.5 h-3.5" />,
    'Breakfast (Extra)': <UtensilsCrossed className="w-3.5 h-3.5" />,
    'Parking (public)': <Car className="w-3.5 h-3.5" />,
    'Pets Allowed': <PawPrint className="w-3.5 h-3.5" />,
    'Bed linen': <Bed className="w-3.5 h-3.5" />,
    'Bath': <Bath className="w-3.5 h-3.5" />,
    'Indoor fireplace': <Flame className="w-3.5 h-3.5" />,
    'Bonfire (Extra)': <Flame className="w-3.5 h-3.5" />,
    'Portable fans': <Wind className="w-3.5 h-3.5" />,
    'Smoke alarm': <ShieldCheck className="w-3.5 h-3.5" />,
    'Dedicated workspace': <Laptop className="w-3.5 h-3.5" />,
    'Kitchen': <ChefHat className="w-3.5 h-3.5" />,
    'Cooking space': <ChefHat className="w-3.5 h-3.5" />,
    'Fridge': <Package className="w-3.5 h-3.5" />,
    'Host greets you': <BellRing className="w-3.5 h-3.5" />,
    'TV': <Tv2 className="w-3.5 h-3.5" />,
    'Air conditioning': <Snowflake className="w-3.5 h-3.5" />,
    'Hairdryer': <Wind className="w-3.5 h-3.5" />,
    'Indoor Games': <Gamepad2 className="w-3.5 h-3.5" />,
    'Books/reading material': <BookOpen className="w-3.5 h-3.5" />,
    'Iron': <Shirt className="w-3.5 h-3.5" />,
    'Heating': <Thermometer className="w-3.5 h-3.5" />,
    'Exterior security cameras': <Camera className="w-3.5 h-3.5" />,
    'In-house Activities': <Sparkles className="w-3.5 h-3.5" />,
};

const TAG_CATEGORIES = [
    {
        title: "Vibe & Atmosphere",
        subtitle: "What does it feel like to stay here?",
        tags: ['Mountain View', 'Explore Offbeat', 'Nature & Eco', 'Heritage', 'Riverfront', 'Peaceful', 'Party', 'Rustic']
    },
    {
        title: "Purpose & Ideal For",
        subtitle: "Who is this space best suited for?",
        tags: ['Workation', 'Long Stays', 'Pet Friendly', 'Couples Getaway', 'Group Friendly', 'Digital Nomads', 'Families']
    },
    {
        title: "Hype & Unique Selling Points",
        subtitle: "What makes this place go viral?",
        tags: ['Trending Now', 'Featured Stays', 'Top Rated', 'Budget Friendly', 'Premium', 'Infinity Pool', 'Glasshouse', '360° Views']
    }
];

const DEFAULT_POLICIES = [
    '50% advance payment required; balance at check-in.',
    'Standard Check-in: 1 PM, Check-out: 10 AM (Early/late subject to fee).',
    'Open for families, groups, couples. Age 13+ considered adult.',
    'Govt ID mandatory (No local IDs).',
    'No outsiders permitted.',
    'Self-help (No luggage assistance or room service).',
    'Pet friendly.',
    'Alcohol allowed (not sold on property).',
    'Drugs/substances strictly banned.',
    'Quiet Hours: 10 PM to 8 AM.',
    'Warm clothes advised (9000 ft altitude).',
    'Minimal luggage advised (small trail walk).',
    'UPI/Cash/Bank transfer only (No Credit Cards).',
    'Property not liable for lost belongings.',
    'Payment gateway fees apply and are non-refundable.',
    'Right to admission reserved.'
];

export interface HomestayFormProps {
    id?: string;
    isEditMode?: boolean;
}

export default function HomestayForm({ id, isEditMode = false }: { id?: string; isEditMode?: boolean }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(isEditMode);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // --- State Models ---
    const [basicInfo, setBasicInfo] = useState({ name: '', description: '', pricePerNight: '' });
    const [imageFiles, setImageFiles] = useState<StagedFile[]>([]);
    const [existingMedia, setExistingMedia] = useState<{ url: string; fileId?: string }[]>([]);
    const [location, setLocation] = useState({ latitude: null as number | null, longitude: null as number | null, locationName: '' });
    const [destinationId, setDestinationId] = useState<string>('');
    const [amenities, setAmenities] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [mapAutoSearch, setMapAutoSearch] = useState<string | undefined>(undefined);

    const { data: destinations } = useQuery({
        queryKey: ['destinations-form'],
        queryFn: () => api.get('/destinations').then(res => res.data)
    });

    // Host Details
    const [hostDetails, setHostDetails] = useState({
        reviewsCount: '', rating: '', yearsHosting: '', school: '', work: '', languages: [] as string[], currentLocation: '', bio: ''
    });

    // Policies
    const [policies, setPolicies] = useState<string[]>([...DEFAULT_POLICIES]);

    // Quick Facts
    const [quickFacts, setQuickFacts] = useState({
        checkIn: '13:00', checkOut: '10:00', locationType: 'Remote', alcohol: 'Allowed only in common area', hike: 'None', mobileNetwork: 'Good Connectivity', outsiders: 'Not Allowed'
    });

    console.log("[EDIT FLOW] Extracted ID from Props:", id);
    console.log("[EDIT FLOW] Mode:", isEditMode ? "EDIT" : "CREATE");

    useEffect(() => {
        if (isEditMode && id) {
            setIsFetching(true);
            api.get(`/homestays/${id}`).then(res => {
                const data = res.data;
                console.log("[EDIT FLOW] API Success. Data received:", data);
                // ... rest of mapping
                setBasicInfo({ name: data.name || '', description: data.description || '', pricePerNight: data.pricePerNight?.toString() || '' });
                setLocation({ latitude: data.latitude, longitude: data.longitude, locationName: data.locationName || '' });
                if (data.destination) {
                    setDestinationId(data.destination.id);
                }
                if (data.tags && data.tags.length > 0) {
                    setTags(data.tags);
                }
                setAmenities(Object.keys(data.amenities || {}).filter(k => data.amenities[k]));
                setPolicies(data.policies || []);
                setExistingMedia(data.media || []);
                if (data.quickFacts) {
                    setQuickFacts({
                        checkIn: data.quickFacts['Check-in'] || '13:00',
                        checkOut: data.quickFacts['Check-out'] || '10:00',
                        locationType: data.quickFacts['Location'] || 'Remote',
                        alcohol: data.quickFacts['Alcohol'] || 'Allowed only in common area',
                        hike: data.quickFacts['Hike'] || 'None',
                        mobileNetwork: data.quickFacts['Mobile Network'] || 'Good Connectivity',
                        outsiders: data.quickFacts['Outsiders'] || 'Not Allowed'
                    });
                }
                if (data.hostDetails) {
                    setHostDetails({
                        reviewsCount: data.hostDetails.reviewsCount?.toString() || '',
                        rating: data.hostDetails.rating?.toString() || '',
                        yearsHosting: data.hostDetails.yearsHosting?.toString() || '',
                        school: data.hostDetails.school || '',
                        work: data.hostDetails.work || '',
                        languages: Array.isArray(data.hostDetails.languages) ? data.hostDetails.languages : [],
                        currentLocation: data.hostDetails.currentLocation || '',
                        bio: data.hostDetails.bio || ''
                    });
                }
            }).catch(err => {
                console.error("[EDIT FLOW] API Error:", err);
                toast.error("Failed to load homestay data.");
            }).finally(() => {
                setIsFetching(false);
            });
        } else if (isEditMode && !id) {
            console.error("[EDIT FLOW] Logic Error: Mount in Edit mode but ID is missing.");
            toast.error("Invalid homestay ID.");
            setIsFetching(false);
        }
    }, [isEditMode, id]);

    const validateStep = (currentStep: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (currentStep === 1) {
            if (!basicInfo.name.trim()) newErrors.name = "Property name is required.";
            if (!basicInfo.description.trim()) {
                newErrors.description = "Description is required.";
            } else if (basicInfo.description.trim().length < 20) {
                newErrors.description = "Description must be at least 20 characters.";
            } else if (basicInfo.description.trim().length > 2000) {
                newErrors.description = "Description cannot exceed 2000 characters.";
            }
            if (!basicInfo.pricePerNight || parseFloat(basicInfo.pricePerNight) < 1) {
                newErrors.price = "Price must be at least ₹1 per night.";
            }
        } else if (currentStep === 2) {
            if (!destinationId) newErrors.destinationId = "Please select a Destination.";
            if (!location.latitude || !location.longitude) {
                newErrors.location = "Please pin your exact location on the map.";
            }
            if (!location.locationName.trim()) {
                newErrors.locationName = "Location name is required. Search for your area on the map.";
            }
        } else if (currentStep === 3) {
            if (existingMedia.length + imageFiles.length === 0) {
                newErrors.photos = "Please upload at least 1 property photo.";
            }
        } else if (currentStep === 7) {
            if (hostDetails.yearsHosting && parseInt(hostDetails.yearsHosting) < 0) {
                newErrors.yearsHosting = "Years hosting cannot be negative.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(prev => prev + 1);
            setErrors({});
        }
    };
    const handleBack = () => {
        if (step === 1) {
            router.push('/host/dashboard'); // Route back completely
        } else {
            setStep(prev => prev - 1);
        }
    };

    const toggleAmenity = (amenity: string) => {
        setAmenities(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
    };

    const selectAllAmenitiesPreview = (categoryItems: string[]) => {
        setAmenities(prev => Array.from(new Set([...prev, ...categoryItems])));
    };

    const selectNoneAmenitiesPreview = (categoryItems: string[]) => {
        setAmenities(prev => prev.filter(a => !categoryItems.includes(a)));
    };

    const toggleTag = (tag: string) => {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const addPolicy = () => setPolicies(prev => [...prev, '']);
    const updatePolicy = (index: number, val: string) => {
        const newP = [...policies];
        newP[index] = val;
        setPolicies(newP);
    };
    const removePolicy = (index: number) => setPolicies(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        // Re-validate all critical steps before submission to guard against any desync
        const step1Valid = validateStep(1);
        if (!step1Valid) {
            setStep(1);
            return;
        }
        const step2Valid = validateStep(2);
        if (!step2Valid) {
            setStep(2);
            return;
        }
        const step3Valid = validateStep(3);
        if (!step3Valid) {
            setStep(3);
            return;
        }
        if (!validateStep(7)) return;

        setLoading(true);
        try {
            // STEP A: Prepare the Homestay DTO Payload
            const payload = {
                name: basicInfo.name,
                description: basicInfo.description,
                pricePerNight: parseFloat(basicInfo.pricePerNight),
                latitude: location.latitude,
                longitude: location.longitude,
                locationName: location.locationName,
                media: existingMedia,
                destinationId: destinationId,
                tags: Array.from(new Set(tags)),
                // JSONB Conversions
                amenities: amenities.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}),
                policies: policies.filter(p => p.trim() !== ''),
                quickFacts: {
                    "Check-in": quickFacts.checkIn,
                    "Check-out": quickFacts.checkOut,
                    "Location": quickFacts.locationType,
                    "Alcohol": quickFacts.alcohol,
                    "Hike": quickFacts.hike,
                    "Mobile Network": quickFacts.mobileNetwork,
                    "Outsiders": quickFacts.outsiders
                },
                hostDetails: {
                    reviewsCount: parseInt(hostDetails.reviewsCount) || 0,
                    rating: parseFloat(hostDetails.rating) || 0.0,
                    yearsHosting: parseInt(hostDetails.yearsHosting) || 0,
                    school: hostDetails.school,
                    work: hostDetails.work,
                    languages: hostDetails.languages.join(', ').trim() ? hostDetails.languages : [],
                    currentLocation: hostDetails.currentLocation,
                    bio: hostDetails.bio
                }
            };

            // STEP B: Compile into Multipart FormData
            const formData = new FormData();
            formData.append('request', new Blob([JSON.stringify(payload)], { type: "application/json" }));

            if (imageFiles.length > 0) {
                imageFiles.forEach(staged => {
                    formData.append('files', staged.file);
                });
            }

            toast.info(isEditMode ? "Updating homestay..." : "Creating homestay...");

            if (isEditMode) {
                await api.put(`/homestays/${id}`, formData);
                toast.success("Homestay updated successfully!");
                queryClient.invalidateQueries({ queryKey: ['homestay', id] });
            } else {
                await api.post('/homestays', formData);
                toast.success("Homestay created successfully!");
            }
            // Invalidate both lists to ensure the new thumbnail propagates everywhere
            queryClient.invalidateQueries({ queryKey: ['homestays'] });
            queryClient.invalidateQueries({ queryKey: ['my-listings'] });
            router.push('/host/dashboard');
        } catch (error: any) {
            console.error("Submission Error:", error.response?.data || error.message);
            toast.error("Failed to create homestay. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004d00] mb-4"></div>
                <p className="text-muted-foreground font-medium animate-pulse">Loading Homestay Data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <h1 className="text-3xl font-extrabold mb-6 text-center tracking-tight">
                {isEditMode ? 'Edit Your Homestay' : 'List Your Homestay'}
            </h1>

            {/* Progress Bar */}
            <div className="w-full bg-secondary h-2 rounded-full mb-8 overflow-hidden">
                <div className="bg-[#004d00] h-full transition-all duration-500 ease-in-out" style={{ width: `${(step / 7) * 100}%` }} />
            </div>

            <Card className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-12 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <CardTitle className="text-xl">
                        {step === 1 && "Basic Information"}
                        {step === 2 && "Location Pin"}
                        {step === 3 && "Amenities & Photos"}
                        {step === 4 && "Homestay Tags & Vibes"}
                        {step === 5 && "Property Policies"}
                        {step === 6 && "Quick Facts / Know Before You Go"}
                        {step === 7 && "Meet Your Host Profile"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 md:p-8">
                    {/* STEP 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Property Name *</Label>
                                <Input
                                    id="name"
                                    value={basicInfo.name}
                                    onChange={e => setBasicInfo({ ...basicInfo, name: e.target.value })}
                                    placeholder="e.g. Cloud 9 Villa"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none"
                                    error={errors.name}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description * <span className="text-xs text-muted-foreground font-normal">(20–2000 chars)</span></Label>
                                <Textarea
                                    id="description"
                                    value={basicInfo.description}
                                    onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })}
                                    placeholder="Describe the vibe, views, and surroundings in at least 20 characters..."
                                    className="h-36 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none"
                                    error={errors.description}
                                />
                                <div className="flex justify-between items-center">
                                    {errors.description
                                        ? <p className="text-red-500 text-xs font-medium">{errors.description}</p>
                                        : <span />}
                                    <p className={`text-xs ml-auto ${basicInfo.description.length > 2000 ? 'text-red-500' :
                                        basicInfo.description.length >= 20 ? 'text-green-600' : 'text-muted-foreground'
                                        }`}>{basicInfo.description.length}/2000</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price per Night (₹) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={basicInfo.pricePerNight}
                                    onChange={e => setBasicInfo({ ...basicInfo, pricePerNight: e.target.value })}
                                    placeholder="2500"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none"
                                    error={errors.price}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Location */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Select Destination *</Label>
                                <Select value={destinationId} onValueChange={(val) => {
                                    setDestinationId(val);
                                    // Auto-sync map: find dest name+district and pass to LocationPicker
                                    const dest = destinations?.find((d: any) => d.id === val);
                                    if (dest) setMapAutoSearch(`${dest.name}, ${dest.district}`);
                                }}>
                                    <SelectTrigger error={errors.destinationId}><SelectValue placeholder="Choose a destination..." /></SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-[300px]">
                                            {destinations?.map((dest: any) => (
                                                <SelectItem key={dest.id} value={dest.id}>
                                                    {dest.name} ({dest.district})
                                                </SelectItem>
                                            ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Your destination is pre-centered on the map. Drag the pin to nail the exact spot.</p>
                                <LocationPicker
                                    onLocationSelect={(lat, lng, addr) => setLocation({ latitude: lat, longitude: lng, locationName: addr })}
                                    initialLat={location.latitude || undefined}
                                    initialLng={location.longitude || undefined}
                                    initialAddress={location.locationName}
                                    autoSearchQuery={mapAutoSearch}
                                />
                                {errors.location && <p className="text-red-500 text-xs mt-2 font-medium">{errors.location}</p>}
                                {errors.locationName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.locationName}</p>}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Amenities & Photos */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Label className="text-lg font-bold">Property Photos</Label>
                                <ImageDropzone files={imageFiles} setFiles={setImageFiles} existingUrls={existingMedia.map(m => m.url)} setExistingUrls={(urls) => setExistingMedia(prev => prev.filter(m => (urls as unknown as string[]).includes(m.url)))} maxFiles={10} />
                                {errors.photos && <p className="text-red-500 text-xs mt-2 font-medium">{errors.photos}</p>}
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base font-bold">Amenities & Features</Label>
                                <div className="space-y-6">
                                    {Object.entries(AMENITY_CATEGORIES).map(([category, items]) => (
                                        <div key={category} className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="font-semibold text-sm text-gray-800">{category}</h3>
                                                <div className="flex gap-3">
                                                    <button type="button" onClick={() => selectAllAmenitiesPreview(items)} className="text-xs text-emerald-700 hover:underline font-medium">All</button>
                                                    <button type="button" onClick={() => selectNoneAmenitiesPreview(items)} className="text-xs text-gray-400 hover:underline font-medium">None</button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {items.map(item => {
                                                    const isUnavailable = category === '🚫 Unavailable';
                                                    const selected = amenities.includes(item);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={item}
                                                            onClick={() => toggleAmenity(item)}
                                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer ${selected
                                                                ? isUnavailable
                                                                    ? 'bg-red-50 text-red-700 border-red-200 line-through'
                                                                    : 'bg-emerald-700 text-white border-emerald-700'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:bg-emerald-50'
                                                                }`}
                                                        >
                                                            {AMENITY_ICONS[item] && <span className="opacity-80">{AMENITY_ICONS[item]}</span>}
                                                            {item}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Tags & Vibes */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <p className="text-sm text-muted-foreground mb-4">Select tags to help guests discover your property through high-visibility category swimlanes.</p>
                            <ScrollArea className="h-[400px] pr-4">
                                {TAG_CATEGORIES.map((category) => (
                                    <div key={category.title} className="mb-6 bg-muted/20 p-5 rounded-2xl border border-border/50 shadow-sm">
                                        <h3 className="font-bold text-xl text-gray-800">{category.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">{category.subtitle}</p>
                                        <div className="flex flex-wrap gap-3">
                                            {category.tags.map(item => (
                                                <button
                                                    key={item}
                                                    onClick={() => toggleTag(item)}
                                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer border ${tags.includes(item) ? 'bg-[#004d00] text-white border-[#004d00]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#004d00] hover:bg-[#004d00]/5'}`}
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    )}

                    {/* STEP 5: Policies */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground mb-4">Edit or remove the default policies, or add your own custom rules.</p>
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-3">
                                    {policies.map((policy, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <Input value={policy} onChange={e => updatePolicy(idx, e.target.value)} className="flex-1" />
                                            <Button variant="outline" size="icon" onClick={() => removePolicy(idx)} className="text-destructive hover:bg-destructive/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" onClick={addPolicy} className="w-full mt-4 border-dashed border-2">
                                        <Plus className="w-4 h-4 mr-2" /> Add Rule
                                    </Button>
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* STEP 6: Quick Facts */}
                    {step === 6 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Check-in Time</Label>
                                <Input type="time" value={quickFacts.checkIn} onChange={e => setQuickFacts({ ...quickFacts, checkIn: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none" />
                            </div>
                            <div className="space-y-2">
                                <Label>Check-out Time</Label>
                                <Input type="time" value={quickFacts.checkOut} onChange={e => setQuickFacts({ ...quickFacts, checkOut: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none" />
                            </div>
                            <div className="space-y-2">
                                <Label>Location Type</Label>
                                <Select value={quickFacts.locationType} onValueChange={v => setQuickFacts({ ...quickFacts, locationType: v })}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {LOCATION_TYPE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Hike / Walk to Property</Label>
                                <Select value={quickFacts.hike} onValueChange={v => setQuickFacts({ ...quickFacts, hike: v })}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {HIKE_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Alcohol</Label>
                                <Select value={quickFacts.alcohol} onValueChange={v => setQuickFacts({ ...quickFacts, alcohol: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Allowed only in common area">Allowed only in common area</SelectItem>
                                        <SelectItem value="Allowed anywhere">Allowed anywhere</SelectItem>
                                        <SelectItem value="Strictly Prohibited">Strictly Prohibited</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Mobile Network</Label>
                                <Select value={quickFacts.mobileNetwork} onValueChange={v => setQuickFacts({ ...quickFacts, mobileNetwork: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Good Connectivity">Good (All Networks)</SelectItem>
                                        <SelectItem value="Low Connectivity">Low (Jio/Airtel only)</SelectItem>
                                        <SelectItem value="No Connectivity">No Mobile Signal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Outsiders</Label>
                                <Select value={quickFacts.outsiders} onValueChange={v => setQuickFacts({ ...quickFacts, outsiders: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Not Allowed">Not Allowed</SelectItem>
                                        <SelectItem value="Approval Required">Prior Approval Required</SelectItem>
                                        <SelectItem value="Allowed">Allowed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* STEP 7: Host Details */}
                    {step === 7 && (
                        <div className="space-y-5">
                            <p className="text-sm text-muted-foreground mb-4">Introduce yourself to guests. This builds trust and increases bookings.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Years Hosting (Number)</Label>
                                    <Input
                                        type="number"
                                        value={hostDetails.yearsHosting}
                                        onChange={e => setHostDetails({ ...hostDetails, yearsHosting: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none"
                                        error={errors.yearsHosting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Reviews Count (Dummy/Migration)</Label>
                                    <Input type="number" value={hostDetails.reviewsCount} onChange={e => setHostDetails({ ...hostDetails, reviewsCount: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <Label>School / Education</Label>
                                    <Input value={hostDetails.school} onChange={e => setHostDetails({ ...hostDetails, school: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Work / Profession</Label>
                                    <Input value={hostDetails.work} onChange={e => setHostDetails({ ...hostDetails, work: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Languages Spoken</Label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {LANGUAGE_OPTIONS.map(lang => {
                                            const selected = hostDetails.languages.includes(lang);
                                            return (
                                                <button
                                                    type="button"
                                                    key={lang}
                                                    onClick={() => setHostDetails(prev => ({
                                                        ...prev,
                                                        languages: selected
                                                            ? prev.languages.filter(l => l !== lang)
                                                            : [...prev.languages, lang]
                                                    }))}
                                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${selected
                                                        ? 'bg-[#004d00] text-white border-[#004d00]'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#004d00] hover:bg-[#004d00]/5'
                                                        }`}
                                                >
                                                    {lang}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Current Origin Location</Label>
                                    <Input value={hostDetails.currentLocation} onChange={e => setHostDetails({ ...hostDetails, currentLocation: e.target.value })} placeholder="e.g. Siliguri, India" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Bio / Tagline</Label>
                                    <Textarea
                                        value={hostDetails.bio}
                                        onChange={e => setHostDetails({ ...hostDetails, bio: e.target.value })}
                                        placeholder="A short welcoming message to your guests..."
                                        className="h-24 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none"
                                        error={errors.bio}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/10 border-t border-border/50 p-6">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1} className="w-24">Back</Button>
                    {step < 7 ? (
                        <Button onClick={handleNext} className="w-24">Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading} className="w-32 bg-green-600 hover:bg-green-700 font-bold transition-all">
                            {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Homestay' : 'List Homestay')}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

