'use client';

import * as React from 'react';
import { MessageCircle } from 'lucide-react';
import { TripBoardButton } from '@/components/trip-board-button';
import { TripBoardItem } from '@/store/useTripBoard';
import { motion } from 'framer-motion';

interface StickyMobileBarProps {
    homestayName: string;
    ownerEmail?: string;
    tripBoardItem: TripBoardItem;
}

export function StickyMobileBar({ homestayName, ownerEmail, tripBoardItem }: StickyMobileBarProps) {
    const whatsappMessage = encodeURIComponent(
        `Hi! I found "${homestayName}" on NBHomestays and I'd love to inquire about availability. Can you help?`
    );
    // Use a generic WhatsApp link — owner can set up a number
    // If ownerEmail maps to a phone for the host in future, replace the number here
    const whatsappHref = `https://wa.me/?text=${whatsappMessage}`;

    return (
        <motion.div
            className="fixed bottom-0 inset-x-0 z-50 md:hidden animate-bounce-in-up"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.4 }}
        >
            {/* Frosted glass backdrop */}
            <div className="glass border-t border-white/40 px-4 py-3 pb-safe-area-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
                <div className="flex items-center gap-3">
                    {/* Save button */}
                    <TripBoardButton
                        item={tripBoardItem}
                        size="lg"
                        className="flex-none"
                    />

                    {/* WhatsApp CTA — full-width */}
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="whatsapp-enquire-btn"
                        className="btn-whatsapp flex-1 text-center"
                        aria-label={`Enquire about ${homestayName} via WhatsApp`}
                    >
                        <MessageCircle className="w-5 h-5 fill-white" />
                        Enquire via WhatsApp
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
