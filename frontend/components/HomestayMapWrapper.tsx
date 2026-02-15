'use client';

import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('./LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Map...</div>
});

interface HomestayMapWrapperProps {
    latitude: number;
    longitude: number;
    locationName: string;
}

export default function HomestayMapWrapper({ latitude, longitude, locationName }: HomestayMapWrapperProps) {
    return (
        <LocationPicker
            initialLat={latitude}
            initialLng={longitude}
            initialAddress={locationName}
            readonly={true}
        />
    );
}
