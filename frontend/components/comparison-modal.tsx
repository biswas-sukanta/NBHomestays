'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface HomestaySummary {
    id: string;
    name: string;
    pricePerNight: number;
    vibeScore: number;
    media?: { url: string; fileId?: string }[];
    description?: string;
    amenities?: Record<string, boolean>;
}

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    homestays: HomestaySummary[];
}

export function ComparisonModal({ isOpen, onClose, homestays }: ComparisonModalProps) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Comparison</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                    {homestays.map((h) => (
                        <div key={h.id} className="flex flex-col gap-4">
                            {/* Header */}
                            <div className="aspect-video w-full bg-gray-200 rounded-lg bg-cover bg-center relative"
                                style={{ backgroundImage: `url(${h.media?.[0]?.url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233'})` }}>
                                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow">
                                    ★ {h.vibeScore}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg leading-tight mb-1">{h.name}</h3>
                                <div className="text-xl font-bold text-green-600">₹{h.pricePerNight}<span className="text-sm font-normal text-gray-500">/night</span></div>
                            </div>

                            {/* Features Table */}
                            <div className="space-y-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="font-semibold mb-2">Description</div>
                                    <p className="text-gray-600 line-clamp-3">{h.description || 'No description available'}</p>
                                </div>

                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="font-semibold mb-2">Amenities</div>
                                    <ul className="space-y-1">
                                        {Object.entries(h.amenities || {}).filter(([_, v]) => v).slice(0, 5).map(([k]) => (
                                            <li key={k} className="flex items-center gap-2 capitalize">
                                                <Check className="w-3 h-3 text-green-500" />
                                                {k.replace(/([A-Z])/g, ' $1').trim()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <Button asChild className="w-full mt-auto">
                                <Link href={`/homestays/${h.id}`}>View Details</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
