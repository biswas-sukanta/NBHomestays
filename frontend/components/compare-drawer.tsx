'use client';

import * as React from 'react';
import { useCompareStore } from '@/store/useCompareStore';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueries } from '@tanstack/react-query';
import api from '@/lib/api';
import { ComparisonModal } from './comparison-modal';

interface HomestaySummary {
    id: string;
    name: string;
    pricePerNight: number;
    vibeScore: number;
    media?: { url: string; fileId?: string }[];
}

export function CompareDrawer() {
    const { selectedIds, removeFromCompare, clear } = useCompareStore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // Auto-open/close logic
    React.useEffect(() => {
        if (selectedIds.length > 0) setIsOpen(true);
        else setIsOpen(false);
    }, [selectedIds.length]);

    // Fetch data for selected IDs
    const homestayQueries = useQueries({
        queries: selectedIds.map((id) => ({
            queryKey: ['homestay', id],
            queryFn: async () => {
                const res = await api.get(`/homestays/${id}`);
                return res.data as HomestaySummary;
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
        })),
    });

    const isLoading = homestayQueries.some((q: any) => q.isLoading);
    const homestays = homestayQueries.map((q: any) => q.data).filter(Boolean) as HomestaySummary[];

    if (selectedIds.length === 0) return null;

    return (
        <>
            <Drawer open={isOpen} onOpenChange={setIsOpen} modal={false}>
                <DrawerContent className="bg-white border-t border-gray-200 shadow-2xl">
                    <div className="mx-auto w-full max-w-4xl">
                        <DrawerHeader>
                            <DrawerTitle>Compare Homestays ({selectedIds.length}/3)</DrawerTitle>
                            <DrawerDescription>Compare prices, ratings, and features.</DrawerDescription>
                        </DrawerHeader>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {homestays.map((homestay) => (
                                    <motion.div
                                        key={homestay.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="relative p-3 border rounded-xl bg-gray-50 flex items-center gap-3"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-500 z-10"
                                            onClick={() => removeFromCompare(homestay.id)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>

                                        <div
                                            className="h-16 w-16 bg-gray-200 rounded-lg bg-cover bg-center shrink-0"
                                            style={{ backgroundImage: `url(${homestay.media?.[0]?.url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=100'})` }}
                                        />

                                        <div className="overflow-hidden">
                                            <h3 className="font-bold truncate text-sm">{homestay.name}</h3>
                                            <div className="flex gap-2 text-xs text-gray-600">
                                                <span className="font-semibold text-green-600">₹{homestay.pricePerNight}</span>
                                                <span className="text-yellow-600 flex items-center">
                                                    ★ {homestay.vibeScore || 4.5}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Loading Skeletons */}
                            {isLoading && (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            )}

                            {/* Placeholder for "Add more" */}
                            {selectedIds.length < 3 && !isLoading && (
                                <div className="hidden md:flex items-center justify-center border-2 border-dashed rounded-xl p-4 text-gray-400 text-sm">
                                    Select {3 - selectedIds.length} more
                                </div>
                            )}
                        </div>

                        <DrawerFooter className="flex-row gap-4">
                            <Button className="flex-1" onClick={() => setIsModalOpen(true)} disabled={selectedIds.length < 2}>Compare Now</Button>
                            <Button variant="ghost" onClick={clear} className="text-red-500">Clear</Button>
                        </DrawerFooter>
                    </div>
                </DrawerContent>
            </Drawer>

            <ComparisonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                homestays={homestays}
            />
        </>
    );
}
