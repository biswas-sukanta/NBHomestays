'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Repeat2, X, Send, Image as ImageIcon, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CustomCombobox } from '@/components/ui/combobox';
import { useHomestaySearch } from '@/hooks/useHomestaySearch';
import { QuotePost, CommunityPost } from './types';

interface RepostModalProps {
    quote: QuotePost;
    onSuccess: (post?: CommunityPost) => void;
    onCancel: () => void;
}

export function RepostModal({ quote, onSuccess, onCancel }: RepostModalProps) {
    const queryClient = useQueryClient();
    const [text, setText] = useState('');
    const [location, setLocation] = useState('North Bengal');
    const [submitting, setSubmitting] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<{ id: string; file: File; previewUrl: string }[]>([]);

    // Unified homestay search hook
    const { data: homestays = [] } = useHomestaySearch();
    const [selectedHomestay, setSelectedHomestay] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newStaged = files.map(f => ({
            id: Math.random().toString(36).slice(2),
            file: f,
            previewUrl: URL.createObjectURL(f)
        }));
        setStagedFiles(prev => [...prev, ...newStaged].slice(0, 6));
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            let finalMedia: { url: string; fileId?: string }[] = [];
            if (stagedFiles.length > 0) {
                const form = new FormData();
                stagedFiles.forEach(f => form.append('files', f.file));
                const up = await api.post('/upload', form);
                finalMedia = up.data;
            }
            const payload: any = {
                textContent: text,
                locationName: location || 'North Bengal',
                media: finalMedia,
                repostedFromPostId: quote.id,
            };
            if (selectedHomestay) payload.homestayId = selectedHomestay;

            const formData = new FormData();
            formData.append('request', new Blob([JSON.stringify(payload)], { type: "application/json" }));

            const res = await api.post('/posts', formData);
            toast.success('Reposted!');

            // Optimistic update
            queryClient.setQueryData(['community-posts'], (old: any) => {
                if (!old || !old.pages) return old;
                const newPages = [...old.pages];
                if (newPages.length > 0) {
                    newPages[0] = { ...newPages[0], content: [res.data, ...(newPages[0].content || [])] };
                }
                return { ...old, pages: newPages };
            });

            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
            onSuccess(res.data);
        } catch (err) {
            console.error('Repost failed', err);
            toast.error('Repost failed');
        } finally {
            setSubmitting(false);
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex flex-col justify-end md:justify-center md:items-center">
            <div className="hidden md:block absolute inset-0 -z-10" onClick={onCancel} />
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-zinc-950 w-full h-[100dvh] flex flex-col md:w-[620px] md:h-auto md:max-h-[85vh] md:rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 border border-white/5 ring-1 ring-white/10"
            >
                <div className="flex-none pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-6 pb-6 px-8 flex justify-between items-center border-b border-white/5 bg-zinc-950">
                    <p className="font-bold text-white text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-3">
                        <Repeat2 className="w-5 h-5 text-green-500" /> Repost Story
                    </p>
                    <button onClick={onCancel} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all border border-white/10 flex-shrink-0 active:scale-90" aria-label="Close">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col gap-8 bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <div className="border border-green-500/30 rounded-2xl p-5 bg-green-500/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Repeat2 className="w-3.5 h-3.5" /> Reposting {quote.authorName}&apos;s story
                        </p>
                        <p className="text-base font-serif text-zinc-200 line-clamp-3 italic leading-relaxed">&quot;{quote.textContent}&quot;</p>
                    </div>

                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add your thoughts..."
                        className="w-full h-32 md:h-40 p-6 bg-zinc-900/50 border border-white/10 rounded-3xl shadow-2xl focus:bg-zinc-900 focus:ring-4 focus:ring-green-500/20 focus:border-green-500/50 resize-none text-lg font-medium text-white placeholder:text-zinc-600 transition-all duration-300"
                    />

                    {stagedFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {stagedFiles.map((f, i) => (
                                <div key={f.id} className="relative aspect-square rounded-2xl overflow-hidden group shadow-2xl bg-zinc-900 ring-1 ring-white/10">
                                    <OptimizedImage src={f.previewUrl} alt="preview" className="w-full h-full object-cover" width={200} />
                                    <button onClick={() => { URL.revokeObjectURL(f.previewUrl); setStagedFiles(p => p.filter((_, j) => j !== i)); }}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <X className="w-7 h-7 text-white drop-shadow-2xl" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                        <button onClick={() => fileRef.current?.click()} disabled={submitting} className="w-full sm:w-auto flex-[0.7] flex justify-center items-center gap-2 border border-white/10 rounded-2xl py-4 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-white/20 shadow-2xl transition-all active:scale-95 text-sm font-bold uppercase tracking-wider">
                            <ImageIcon className="w-5 h-5" /> Visuals
                        </button>
                        <div className="w-full sm:w-auto flex-[2] relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-green-400 transition-colors" />
                            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Where did this happen?" className="w-full border border-white/10 bg-zinc-900/50 text-white placeholder-zinc-600 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 shadow-2xl transition-all outline-none" />
                        </div>
                    </div>

                    <div className="pt-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Tagged Homestay
                        </p>
                        <div className="border border-white/10 rounded-2xl shadow-2xl overflow-hidden bg-zinc-900/50 isolate z-10">
                            <CustomCombobox options={homestays} value={selectedHomestay} onChange={setSelectedHomestay} placeholder="Tag a specific Homestay" />
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-3 py-5 bg-white hover:bg-zinc-100 text-zinc-950 font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] disabled:opacity-30 mt-2 text-sm">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {submitting ? 'Publishing...' : 'Publish Repost'}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
