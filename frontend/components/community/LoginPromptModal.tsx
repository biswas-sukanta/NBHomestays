import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Compass, Mountain } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    action?: 'love' | 'comment' | 'repost' | 'share';
}

export function LoginPromptModal({ isOpen, onClose, action = 'love' }: LoginPromptModalProps) {
    const router = useRouter();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <AnimatePresence>
                {isOpen && (
                    <DialogContent
                        forceMount
                        className="sm:max-w-[500px] bg-transparent border-none text-zinc-100 p-0 overflow-hidden shadow-none focus:outline-none"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                        >
                            {/* Visual Header with Editorial Flair */}
                            <div className="h-48 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/_static/patterns/grid.svg')] opacity-10" />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />

                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <div className="p-5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                                        <Mountain className="w-12 h-12 text-zinc-100" />
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/5">
                                        <Compass className="w-3 h-3 text-zinc-400 animate-pulse" />
                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">Hidden Himalayas</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 pt-8 text-center">
                                <DialogHeader className="space-y-4">
                                    <DialogTitle className="text-4xl font-heading font-normal tracking-tight leading-tight">
                                        Share your journey
                                    </DialogTitle>
                                    <DialogDescription className="text-zinc-400 text-lg font-sans leading-relaxed max-w-[280px] mx-auto">
                                        Every trail has a story. Join explorers uncovering the hidden Himalayas.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid grid-cols-1 gap-4 mt-10">
                                    <Button
                                        onClick={() => router.push('/login')}
                                        className="bg-zinc-100 text-zinc-950 hover:bg-white font-bold h-14 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl text-base"
                                    >
                                        <LogIn className="w-5 h-5 mr-3" />
                                        Sign In
                                    </Button>
                                    <Button
                                        onClick={() => router.push('/register')}
                                        variant="outline"
                                        className="bg-white/5 border-white/10 text-zinc-100 hover:bg-white/10 h-14 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
                                    >
                                        <UserPlus className="w-5 h-5 mr-3" />
                                        Create Account
                                    </Button>
                                </div>

                                <p className="text-zinc-500 text-sm mt-8 font-serif italic">
                                    Discover the Himalayas, one story at a time.
                                </p>
                            </div>
                        </motion.div>
                    </DialogContent>
                )}
            </AnimatePresence>
        </Dialog>
    );
}
