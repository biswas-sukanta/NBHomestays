'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getIcon } from '@/lib/amenity-icons';
import { X } from 'lucide-react';

const AMENITY_CATEGORIES = {
    Highlights: ['Mountain View', 'Hot water', 'Free Wi-Fi', 'Water Dispenser', 'Common hangout area', 'Cafe', 'In-house Activities', 'Bedside Lamps', 'Breakfast (Extra)', 'UPI Payment Accepted', 'Pets Allowed', 'Parking (public)', 'Charging Points', 'Power Backup', 'Indoor Games', 'Bonfire (Extra)'],
    Bathroom: ['Bath', 'Hairdryer', 'Cleaning products', 'Shampoo', 'Body soap', 'Shower gel'],
    'Bedroom & Laundry': ['Free washer', 'Free dryer', 'Essentials (Towels, bed sheets, soap, TP)', 'Hangers', 'Bed linen', 'Cotton linen', 'Extra pillows/blankets', 'Room-darkening blinds', 'Iron', 'Clothes drying rack', 'Clothes storage'],
    'Entertainment & Family': ['Books/reading material', "Children's books / toys", 'Fireplace guards'],
    'Heating & Cooling': ['Indoor fireplace', 'Portable fans', 'Heating'],
    'Home Safety': ['Smoke alarm'],
    'Internet & Office': ['Wifi', 'Dedicated workspace'],
    'Kitchen & Dining': ['Kitchen', 'Cooking space', 'Fridge', 'Microwave', 'Cooking basics', 'Crockery/cutlery', 'Freezer', 'Dishwasher', 'Gas cooker', 'Oven', 'Kettle', 'Coffee maker', 'Wine glasses', 'Toaster', 'Blender', 'Dining table'],
    Services: ['Luggage drop-off allowed', 'Host greets you'],
    Unavailable: ['Lock on bedroom door', 'Exterior security cameras', 'TV', 'Air conditioning', 'Carbon monoxide alarm']
};

const CATEGORY_EMOJIS: Record<string, string> = {
    Highlights: '✨',
    Bathroom: '🚿',
    'Bedroom & Laundry': '🛏️',
    'Entertainment & Family': '🎮',
    'Heating & Cooling': '🔥',
    'Home Safety': '🛡️',
    'Internet & Office': '💻',
    'Kitchen & Dining': '🍳',
    Services: '🤝',
    Unavailable: '❌',
};

interface AmenitiesSectionProps {
    providedAmenities: Record<string, boolean>;
}

export function AmenitiesSection({ providedAmenities }: AmenitiesSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPortalRoot(document.body);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';

            // Focus trap
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') setIsOpen(false);
                if (e.key === 'Tab' && modalRef.current) {
                    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        e.preventDefault();
                        last?.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        e.preventDefault();
                        first?.focus();
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                document.body.style.overflow = 'unset';
            };
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    if (!providedAmenities) return null;
    const allAvailable = Object.keys(providedAmenities).filter(k => providedAmenities[k]);
    if (allAvailable.length === 0) return null;

    const previewList = allAvailable.slice(0, 8);

    const modal = isOpen && portalRoot ? createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    ref={modalRef}
                    initial={{ y: "100%", opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0.5 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    className="bg-white w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] flex flex-col relative z-10"
                    role="dialog"
                    aria-modal="true"
                    aria-label="All amenities"
                >
                    <div className="flex items-center justify-start p-4 sm:p-6 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-3"
                            aria-label="Close modal"
                            autoFocus
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>
                        <h3 className="text-xl font-bold">Amenities</h3>
                    </div>

                    <div className="p-4 sm:p-6 sm:px-8 overflow-y-auto overscroll-contain flex-1">
                        {Object.entries(AMENITY_CATEGORIES).map(([category, items], index) => {
                            const availableInCategory = items.filter(i => allAvailable.includes(i));
                            const unavailableInCategory = items.filter(i => !allAvailable.includes(i) && category === 'Unavailable');

                            if (availableInCategory.length === 0 && unavailableInCategory.length === 0) return null;

                            return (
                                <div key={category} className="mb-8">
                                    <h4 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2.5">
                                        <span className="text-xl">{CATEGORY_EMOJIS[category] || '📋'}</span>
                                        {category === 'Unavailable' ? 'Not included' : category}
                                    </h4>

                                    <div className="flex flex-col gap-3">
                                        {availableInCategory.map(item => (
                                            <div key={item} className="flex items-center gap-4 text-gray-700 py-1.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                                                <span className="text-2xl leading-none w-8" aria-hidden="true" role="img">{getIcon(item)}</span>
                                                <span className="text-sm sm:text-base font-medium">{item}</span>
                                            </div>
                                        ))}

                                        {unavailableInCategory.map(item => (
                                            <div key={item} className="flex items-center gap-4 text-gray-400 line-through py-1.5 px-3 rounded-xl">
                                                <span className="text-xl leading-none w-8 text-center" aria-hidden="true" role="img">❌</span>
                                                <span className="text-sm sm:text-base">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {index < Object.entries(AMENITY_CATEGORIES).length - 1 && (
                                        <hr className="mt-6 border-gray-100" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        portalRoot
    ) : null;

    return (
        <section id="amenities">
            <h2 className="text-[22px] font-bold mb-6 text-gray-900">🧰 Amenities</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-6">
                {previewList.map(item => (
                    <div key={item} className="flex items-center gap-4 text-gray-700 py-1">
                        <span className="text-2xl leading-none" aria-hidden="true" role="img">{getIcon(item)}</span>
                        <span className="text-sm font-medium">{item}</span>
                    </div>
                ))}
            </div>

            {allAvailable.length > 8 && (
                <Button
                    variant="outline"
                    className="w-full sm:w-auto px-6 py-6 border-gray-900 border font-semibold text-gray-900 hover:bg-gray-50 rounded-xl text-base"
                    onClick={() => setIsOpen(true)}
                >
                    Show all {allAvailable.length} amenities
                </Button>
            )}

            {modal}
        </section>
    );
}
