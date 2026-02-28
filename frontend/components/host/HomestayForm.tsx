'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import ImageDropzone, { StagedFile } from '@/components/host/ImageDropzone';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center rounded-xl border">Loading Map...</div>
});

// --- Constants ---
const AMENITY_CATEGORIES = {
    Highlights: ['Mountain View', 'Hot water', 'Free Wi-Fi', 'Water Dispenser', 'Common hangout area', 'Cafe', 'In-house Activities', 'Bedside Lamps', 'Breakfast (Extra)', 'UPI Payment Accepted', 'Pets Allowed', 'Parking (public)', 'Charging Points', 'Power Backup', 'Indoor Games', 'Bonfire (Extra)'],
    Bathroom: ['Bath', 'Hairdryer', 'Cleaning products', 'Shampoo', 'Body soap', 'Shower gel'],
    'Bedroom & Laundry': ['Free washer', 'Free dryer', 'Essentials (Towels, bed sheets, soap, TP)', 'Hangers', 'Bed linen', 'Cotton linen', 'Extra pillows/blankets', 'Room-darkening blinds', 'Iron', 'Clothes drying rack', 'Clothes storage'],
    'Entertainment & Family': ['Books/reading material', 'Children’s books/toys', 'Fireplace guards'],
    'Heating & Cooling': ['Indoor fireplace', 'Portable fans', 'Heating'],
    'Home Safety': ['Smoke alarm'],
    'Internet & Office': ['Wifi', 'Dedicated workspace'],
    'Kitchen & Dining': ['Kitchen', 'Cooking space', 'Fridge', 'Microwave', 'Cooking basics', 'Crockery/cutlery', 'Freezer', 'Dishwasher', 'Gas cooker', 'Oven', 'Kettle', 'Coffee maker', 'Wine glasses', 'Toaster', 'Blender', 'Dining table'],
    Services: ['Luggage drop-off allowed', 'Host greets you'],
    Unavailable: ['Lock on bedroom door', 'Exterior security cameras', 'TV', 'Air conditioning', 'Carbon monoxide alarm']
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
    const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
    const [location, setLocation] = useState({ latitude: null as number | null, longitude: null as number | null, locationName: '' });
    const [topDestination, setTopDestination] = useState<string>('');
    const [amenities, setAmenities] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);

    // Host Details
    const [hostDetails, setHostDetails] = useState({
        reviewsCount: '', rating: '', yearsHosting: '', school: '', work: '', languages: '', currentLocation: '', bio: ''
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
            api.get(`/api/homestays/${id}`).then(res => {
                const data = res.data;
                console.log("[EDIT FLOW] API Success. Data received:", data);
                // ... rest of mapping
                setBasicInfo({ name: data.name || '', description: data.description || '', pricePerNight: data.pricePerNight?.toString() || '' });
                setLocation({ latitude: data.latitude, longitude: data.longitude, locationName: data.locationName || '' });
                if (data.tags && data.tags.length > 0) {
                    setTopDestination(data.tags.find((t: string) => ['Darjeeling', 'Kalimpong', 'Kurseong', 'Mirik', 'Sittong', 'Dooars', 'Siliguri', 'Lava', 'Lolegaon'].includes(t)) || '');
                    setTags(data.tags.filter((t: string) => !['Darjeeling', 'Kalimpong', 'Kurseong', 'Mirik', 'Sittong', 'Dooars', 'Siliguri', 'Lava', 'Lolegaon'].includes(t)));
                }
                setAmenities(Object.keys(data.amenities || {}).filter(k => data.amenities[k]));
                setPolicies(data.policies || []);
                setExistingPhotoUrls(data.photoUrls || []);
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
                        languages: (data.hostDetails.languages || []).join(', '),
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
            if (!basicInfo.pricePerNight || parseFloat(basicInfo.pricePerNight) <= 0) {
                newErrors.price = "Valid price per night is required.";
            }
        } else if (currentStep === 2) {
            if (!topDestination) newErrors.topDestination = "Please select a Top Destination segment.";
            if (!location.latitude || !location.longitude) {
                newErrors.location = "Please pin your exact location on the map.";
            }
        } else if (currentStep === 3) {
            if (existingPhotoUrls.length + imageFiles.length === 0) {
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
                media: existingPhotoUrls.map(url => ({
                    // Retained photoUrls need to be mapped to the generic 'media' list for the diff check.
                    url: url,
                    fileId: url.split('/').pop()?.split('?')[0] // Attempt to extract fileId from ImageKit URL format. If it fails, backend relies on DB ID.
                })),
                tags: Array.from(new Set([...tags, topDestination])),
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
                    languages: hostDetails.languages.split(',').map(l => l.trim()).filter(Boolean),
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
                await api.put(`/api/homestays/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success("Homestay updated successfully!");
                queryClient.invalidateQueries({ queryKey: ['homestay', id] });
            } else {
                await api.post('/api/homestays', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success("Homestay created successfully!");
            }
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
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={basicInfo.description}
                                    onChange={e => setBasicInfo({ ...basicInfo, description: e.target.value })}
                                    placeholder="Describe the vibe and surroundings..."
                                    className="h-32 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none"
                                    error={errors.description}
                                />
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
                                <Label>Top Destination Segment *</Label>
                                <Select value={topDestination} onValueChange={setTopDestination}>
                                    <SelectTrigger error={errors.topDestination}><SelectValue placeholder="Select primary locality (e.g. Darjeeling)" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Darjeeling">Darjeeling</SelectItem>
                                        <SelectItem value="Kalimpong">Kalimpong</SelectItem>
                                        <SelectItem value="Kurseong">Kurseong</SelectItem>
                                        <SelectItem value="Mirik">Mirik</SelectItem>
                                        <SelectItem value="Sittong">Sittong</SelectItem>
                                        <SelectItem value="Dooars">Dooars</SelectItem>
                                        <SelectItem value="Siliguri">Siliguri</SelectItem>
                                        <SelectItem value="Lava">Lava</SelectItem>
                                        <SelectItem value="Lolegaon">Lolegaon</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Search for your area and drag the pin to the exact spot. This ensures guests can find you via GPS.</p>
                                <LocationPicker
                                    onLocationSelect={(lat, lng, addr) => setLocation({ latitude: lat, longitude: lng, locationName: addr })}
                                    initialLat={location.latitude || undefined}
                                    initialLng={location.longitude || undefined}
                                    initialAddress={location.locationName}
                                />
                                {errors.location && <p className="text-red-500 text-xs mt-2 font-medium">{errors.location}</p>}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Amenities & Photos */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Label className="text-lg font-bold">Property Photos</Label>
                                <ImageDropzone files={imageFiles} setFiles={setImageFiles} existingUrls={existingPhotoUrls} setExistingUrls={setExistingPhotoUrls} maxFiles={10} />
                                {errors.photos && <p className="text-red-500 text-xs mt-2 font-medium">{errors.photos}</p>}
                            </div>

                            <div className="space-y-4">
                                <Label className="text-lg font-bold">Amenities & Features</Label>
                                <ScrollArea className="h-[400px] border rounded-lg p-2 bg-muted/10">
                                    {Object.entries(AMENITY_CATEGORIES).map(([category, items]) => (
                                        <div key={category} className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-lg text-primary">{category}</h3>
                                                <div className="flex space-x-2 items-center">
                                                    <button onClick={() => selectAllAmenitiesPreview(items)} className="text-xs text-green-700 hover:underline font-medium">Select All</button>
                                                    <span className="text-gray-300">|</span>
                                                    <button onClick={() => selectNoneAmenitiesPreview(items)} className="text-xs text-gray-500 hover:underline font-medium">Select None</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {items.map(item => (
                                                    <div key={item} className="flex items-start space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={item}
                                                            checked={amenities.includes(item)}
                                                            onChange={() => toggleAmenity(item)}
                                                            className={`mt-1 h-4 w-4 rounded border-gray-300 text-green-700 accent-green-700 focus:ring-green-700 transition-all ${category === 'Unavailable' ? 'text-destructive accent-destructive border-destructive focus:ring-destructive' : ''}`}
                                                        />
                                                        <Label htmlFor={item} className={`text-sm leading-snug cursor-pointer font-medium text-gray-700 ${category === 'Unavailable' && amenities.includes(item) ? 'line-through text-muted-foreground' : ''}`}>{item}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </ScrollArea>
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
                                <Input
                                    placeholder="e.g. Remote, Village Center"
                                    value={quickFacts.locationType}
                                    onChange={e => setQuickFacts({ ...quickFacts, locationType: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none"
                                    error={errors.locationType}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Hike / Walk to Property</Label>
                                <Input placeholder="e.g. 150m hike, None" value={quickFacts.hike} onChange={e => setQuickFacts({ ...quickFacts, hike: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none" />
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
                                    <Label>Languages Spoken (Comma separated)</Label>
                                    <Input value={hostDetails.languages} onChange={e => setHostDetails({ ...hostDetails, languages: e.target.value })} placeholder="English, Hindi, Bengali" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#004d00]/20 focus:border-[#004d00] transition-all outline-none" />
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

