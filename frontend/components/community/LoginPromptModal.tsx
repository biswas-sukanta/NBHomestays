import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    action?: 'love' | 'comment' | 'repost' | 'share';
}

export function LoginPromptModal({ isOpen, onClose, action = 'love' }: LoginPromptModalProps) {
    const router = useRouter();

    const actionData = {
        love: {
            title: "Show some love ❤️",
            description: "Join our community of Himalayan explorers to like and save your favorite stories.",
            icon: <Heart className="w-12 h-12 text-rose-500" />
        },
        comment: {
            title: "Join the conversation",
            description: "Sign in to share your thoughts and connect with other travelers.",
            icon: <MessageCircle className="w-12 h-12 text-blue-500" />
        },
        repost: {
            title: "Share the journey",
            description: "Help others discover offbeat gems by reposting this story to your profile.",
            icon: <Share2 className="w-12 h-12 text-emerald-500" />
        },
        share: {
            title: "Spread the magic",
            description: "Join us to share these untold stories with the world.",
            icon: <Share2 className="w-12 h-12 text-zinc-400" />
        }
    };

    const current = actionData[action];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-zinc-100 rounded-3xl overflow-hidden p-0">
                {/* Visual Header */}
                <div className="h-32 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/_static/patterns/grid.svg')] opacity-20" />
                    <div className="relative z-10 p-4 bg-zinc-950/50 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                        {current.icon}
                    </div>
                </div>

                <div className="p-8 pt-6">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-2xl font-serif font-bold tracking-tight mb-2">
                            {current.title}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-base leading-relaxed">
                            {current.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 mt-8">
                        <Button
                            onClick={() => router.push('/login')}
                            className="bg-white text-black hover:bg-zinc-200 font-bold h-12 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign In
                        </Button>
                        <Button
                            onClick={() => router.push('/register')}
                            variant="outline"
                            className="border-zinc-800 hover:bg-zinc-900 font-bold h-12 rounded-xl transition-all"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create Account
                        </Button>
                    </div>

                    <p className="text-center text-xs text-zinc-500 mt-6 font-medium">
                        Discover the Himalayas, one story at a time.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
