'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>
});

export default function AddHomestayWizard() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pricePerNight: '',
        latitude: null as number | null,
        longitude: null as number | null,
        locationName: '',
        amenities: [] as string[],
        photoUrls: ''
    });

    const amenitiesList = ['WiFi', 'Parking', 'Breakfast', 'Geyser', 'AC', 'Mountain View', 'Fireplace'];

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const toggleAmenity = (amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleLocationSelect = (lat: number, lng: number, address: string) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            locationName: address
        }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.pricePerNight) {
            toast.error("Name and Price are required");
            return;
        }
        if (!formData.latitude || !formData.longitude) {
            toast.error("Please select a location on the map");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                pricePerNight: parseFloat(formData.pricePerNight),
                latitude: formData.latitude,
                longitude: formData.longitude,
                locationName: formData.locationName,
                amenities: formData.amenities.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}),
                photoUrls: formData.photoUrls.split(',').map(u => u.trim()).filter(Boolean)
            };

            await api.post('/api/homestays', payload);
            toast.success("Homestay created successfully!");
            router.push('/host/dashboard');
        } catch (error: any) {
            console.error("Submission Error:", error.response?.data || error.message);
            toast.error("Failed to create homestay: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8 text-center">List Your Homestay</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Step {step} of 4</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name">Homestay Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Cloud 9 Villa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your property..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price">Price per Night (₹)</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.pricePerNight}
                                    onChange={e => setFormData({ ...formData, pricePerNight: e.target.value })}
                                    placeholder="2500"
                                />
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <Label>Location</Label>
                            <p className="text-sm text-gray-500 mb-2">Search for your area and drag the pin to the exact spot.</p>
                            <LocationPicker
                                onLocationSelect={handleLocationSelect}
                                initialLat={formData.latitude || undefined}
                                initialLng={formData.longitude || undefined}
                                initialAddress={formData.locationName}
                            />
                            {formData.locationName && (
                                <p className="text-xs text-green-600">Selected: {formData.locationName}</p>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-2 gap-4">
                            {amenitiesList.map(amenity => (
                                <div key={amenity} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={amenity}
                                        checked={formData.amenities.includes(amenity)}
                                        onChange={() => toggleAmenity(amenity)}
                                    />
                                    <Label htmlFor={amenity}>{amenity}</Label>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-2">
                            <Label htmlFor="photos">Photo URLs (comma separated)</Label>
                            <Textarea
                                id="photos"
                                value={formData.photoUrls}
                                onChange={e => setFormData({ ...formData, photoUrls: e.target.value })}
                                placeholder="https://example.com/photo1.jpg, https://example.com/photo2.jpg"
                            />
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={step === 1}>Back</Button>
                    {step < 4 ? (
                        <Button onClick={handleNext}>Next</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
                            {loading ? 'Submitting...' : 'Submit Listing'}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
