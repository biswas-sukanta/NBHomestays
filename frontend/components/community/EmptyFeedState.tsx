import React from 'react';
import { Button } from '@/components/ui/button';
import { Compass, Users, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type EmptyFeedReason = 'NOT_LOGGED_IN' | 'NO_FOLLOWS' | 'NO_POSTS' | 'NO_RESULTS';

interface EmptyFeedStateProps {
    reason: EmptyFeedReason;
    onLogin?: () => void;
}

export function EmptyFeedState({ reason, onLogin }: EmptyFeedStateProps) {
    const router = useRouter();

    switch (reason) {
        case 'NOT_LOGGED_IN':
            return (
                <div className="text-center py-24 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('/_static/patterns/grid.svg')] opacity-5" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-6 mx-auto shadow-lg">
                            <Compass className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-2xl text-neutral-900 mb-2 font-heading">Connect with the Community</h3>
                        <p className="text-sm text-neutral-500 max-w-xs mx-auto mb-6">
                            Sign in to see stories from travelers you follow and join the conversation.
                        </p>
                        <Button
                            onClick={onLogin || (() => router.push('/login'))}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-8 py-6 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                            Sign In to Connect
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            );

        case 'NO_FOLLOWS':
            return (
                <div className="text-center py-24 bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('/_static/patterns/grid.svg')] opacity-5" />
                    <div className="relative z-10">
                        <div className="w-20 h-20 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mb-6 mx-auto shadow-lg">
                            <Users className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-2xl text-neutral-900 mb-2 font-heading">Find Travelers to Follow</h3>
                        <p className="text-sm text-neutral-500 max-w-xs mx-auto mb-6">
                            You haven&apos;t followed anyone yet. Discover top storytellers in the community.
                        </p>
                        <Button
                            onClick={() => router.push('/community?tab=trending')}
                            variant="outline"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50 font-bold px-8 py-6 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                            Explore Trending Travelers
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            );

        case 'NO_POSTS':
        case 'NO_RESULTS':
        default:
            return (
                <div className="text-center py-24 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200 text-neutral-500 overflow-hidden relative">
                    <div className="text-6xl mb-6 opacity-30 animate-pulse">🍃</div>
                    <p className="font-bold text-2xl text-neutral-900 mb-2 font-heading">Deep silence here...</p>
                    <p className="text-sm text-neutral-500 max-w-xs mx-auto">No stories found. Be the first to share a journey or try a different filter.</p>
                </div>
            );
    }
}
