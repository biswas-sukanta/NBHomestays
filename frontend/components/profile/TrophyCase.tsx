'use client';

import { useState } from 'react';
import { BadgeDto } from '@/lib/api/users';
import { userApi } from '@/lib/api/users';
import { toast } from 'sonner';

interface TrophyCaseProps {
    badges: BadgeDto[];
    onPinToggle?: (badgeId: string) => void;
    isOwner?: boolean;
}

/**
 * Trophy Case component for displaying user's badges.
 * Supports pinning badges when isOwner is true.
 */
export function TrophyCase({ 
    badges, 
    onPinToggle, 
    isOwner = false 
}: TrophyCaseProps) {
    const [pendingId, setPendingId] = useState<string | null>(null);
    
    const handlePinToggle = async (badgeId: string) => {
        if (!isOwner) return;
        
        setPendingId(badgeId);
        try {
            await userApi.toggleBadgePin(badgeId);
            onPinToggle?.(badgeId);
            toast.success('Badge pin updated!');
        } catch {
            toast.error('Failed to update badge pin');
        } finally {
            setPendingId(null);
        }
    };
    
    if (badges.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No badges yet. Keep exploring to earn your first badge!
            </div>
        );
    }
    
    return (
        <div 
            data-testid="trophy-case"
            className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
            {badges.map(badge => (
                <div
                    key={badge.id}
                    className={`relative p-4 rounded-lg border text-center cursor-pointer transition-all hover:shadow-md ${
                        badge.isPinned 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30' 
                            : 'border-border hover:border-primary/50'
                    } ${(isOwner && pendingId === badge.id) ? 'opacity-50 cursor-wait' : ''}`}
                    onClick={() => handlePinToggle(badge.id)}
                    title={isOwner ? 'Click to toggle pin status' : badge.name}
                >
                    {badge.isPinned && (
                        <div className="absolute top-1 right-1">
                            <span className="text-xs" role="img" aria-label="Pinned">
                                📌
                            </span>
                        </div>
                    )}
                    {badge.iconUrl ? (
                        <img 
                            src={badge.iconUrl} 
                            alt={badge.name}
                            className="w-10 h-10 mx-auto mb-2 object-contain"
                            onError={(e) => {
                                // Fallback to placeholder
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-lg">🏆</span>
                        </div>
                    )}
                    <div className="text-sm font-medium truncate" title={badge.name}>
                        {badge.name}
                    </div>
                    {badge.awardedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {new Date(badge.awardedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
