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
                        className="sm:max-w-[500px] bg-transparent border-none text-neutral-900 p-0 overflow-hidden shadow-none focus:outline-none"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="bg-white border border-neutral-200 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                        >
                            {/* Visual Header with Editorial Flair */}
                            <div className="h-48 bg-gradient-to-br from-emerald-50 via-neutral-100 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('/_static/patterns/grid.svg')] opacity-10" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />

                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <div className="p-5 bg-white shadow-lg rounded-full border border-neutral-200">
                                        <Mountain className="w-12 h-12 text-emerald-600" />
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white shadow-sm rounded-full border border-neutral-200">
                                        <Compass className="w-3 h-3 text-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-500">Eastern Himalayas</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 pt-8 text-center">
                                <DialogHeader className="space-y-4">
                                    <DialogTitle className="text-4xl font-heading font-normal tracking-tight leading-tight text-neutral-900">
                                        Share your journey
                                    </DialogTitle>
                                    <DialogDescription className="text-neutral-500 text-lg font-sans leading-relaxed max-w-[280px] mx-auto">
                                        Every trail has a story. Join travelers uncovering the Eastern Himalayas.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid grid-cols-1 gap-4 mt-10">
                                    <Button
                                        onClick={() => router.push('/login')}
                                        className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold h-14 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl text-base"
                                    >
                                        <LogIn className="w-5 h-5 mr-3" />
                                        Sign In
                                    </Button>
                                    <Button
                                        onClick={() => router.push('/register')}
                                        variant="outline"
                                        className="bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50 h-14 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] text-base"
                                    >
                                        <UserPlus className="w-5 h-5 mr-3" />
                                        Create Account
                                    </Button>
                                </div>

                                <p className="text-neutral-400 text-sm mt-8 font-heading italic">
                                    Discover the Eastern Himalayas, one story at a time.
                                </p>
                            </div>
                        </motion.div>
                    </DialogContent>
                )}
            </AnimatePresence>
        </Dialog>
    );
}
