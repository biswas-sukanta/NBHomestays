'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare, Star } from 'lucide-react';
import { toast } from 'sonner';

interface InquirySectionProps {
    homestayName: string;
}

export function InquirySection({ homestayName }: InquirySectionProps) {
    return (
        <div className="border-t pt-8 space-y-4">
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                <h3 className="text-xl font-bold text-green-900 mb-2">Love this vibe?</h3>
                <p className="text-green-800 mb-6">Connect directly with the host to check availability and plan your trip.</p>

                <div className="grid grid-cols-1 gap-3">
                    <Button
                        size="lg"
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl py-7 text-lg font-bold shadow-md transition-all hover:scale-[1.02]"
                        onClick={() => window.open(`https://wa.me/919999999999?text=Hi, I found your homestay "${homestayName}" on NBH and I'm interested in visiting!`, '_blank')}
                    >
                        <MessageSquare className="mr-2 h-6 w-6" />
                        Enquire via WhatsApp
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full border-2 border-primary text-primary hover:bg-primary/5 rounded-xl py-7 text-lg font-bold transition-all"
                        onClick={() => toast.success("Added to your Trip Board!")}
                    >
                        <Star className="mr-2 h-5 w-5" />
                        Save to Trip Board
                    </Button>
                </div>
            </div>
        </div>
    );
}
