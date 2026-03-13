'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Repeat2, X, Send, Image as ImageIcon, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { postApi } from '@/lib/api/posts';
import { axiosInstance as api } from '@/lib/api-client';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CustomCombobox } from '@/components/ui/combobox';
import { useHomestaySearch } from '@/hooks/useHomestaySearch';
import { QuotePost, CommunityPost } from './types';
import { IMAGE_UPLOAD_HELPER_TEXT, processImages } from '@/lib/utils/imageUploadPipeline';
import { queryKeys } from '@/lib/queryKeys';

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        try {
            const processed = await processImages(files);
            if (stagedFiles.length + processed.length > 5) {
                throw new Error('Maximum 5 images allowed.');
            }
            const currentSize = stagedFiles.reduce((sum, staged) => sum + staged.file.size, 0);
            const newSize = processed.reduce((sum, file) => sum + file.size, 0);
            if (currentSize + newSize > 10 * 1024 * 1024) {
                throw new Error('Total upload size must be under 10MB.');
            }
            const newStaged = processed.map(f => ({
                id: Math.random().toString(36).slice(2),
                file: f,
                previewUrl: URL.createObjectURL(f)
            }));
            setStagedFiles(prev => [...prev, ...newStaged]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Image validation failed.';
            toast.error(message);
        } finally {
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        const previousFeed = queryClient.getQueryData(queryKeys.community.feed());
        const tempId = `temp-repost-${Date.now()}`;
        const previewMedia = stagedFiles.map(staged => ({ url: staged.previewUrl }));
        const optimisticPost = {
            id: tempId,
            locationName: location || 'North Bengal',
            textContent: text,
            media: previewMedia,
            tags: [],
            loveCount: 0,
            shareCount: 0,
            commentCount: 0,
            isLikedByCurrentUser: false,
            createdAt: new Date().toISOString(),
            originalPost: {
                id: quote.id,
                textContent: quote.textContent,
                locationName: location || 'North Bengal',
                media: []
            }
        };

        await queryClient.cancelQueries({ queryKey: queryKeys.community.feed() });
        queryClient.setQueryData(queryKeys.community.feed(), (old: any) => {
            if (!old || !old.pages) return old;
            const newPages = [...old.pages];
            if (newPages.length > 0) {
                newPages[0] = { ...newPages[0], content: [optimisticPost, ...(newPages[0].content || [])] };
            }
            return { ...old, pages: newPages };
        });

        try {
            let finalMedia: { url: string; fileId?: string }[] = [];
            if (stagedFiles.length > 0) {
                const form = new FormData();
                stagedFiles.forEach(f => form.append('files', f.file));
                const up = await api.post('/images/upload-multiple', form);
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

            const res = await postApi.create(formData);
            toast.success('Reposted!');

            queryClient.setQueryData(queryKeys.community.feed(), (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        content: (page.content || []).map((p: any) => p.id === tempId ? res.data : p)
                    }))
                };
            });

            queryClient.invalidateQueries({ queryKey: queryKeys.community.feed() });
            queryClient.invalidateQueries({ queryKey: queryKeys.community.trending });
            stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
            onSuccess(res.data);
        } catch (err) {
            console.error('Repost failed', err);
            queryClient.setQueryData(queryKeys.community.feed(), previousFeed);
            toast.error('Repost failed');
        } finally {
            setSubmitting(false);
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center">
            <div className="hidden md:block absolute inset-0 -z-10" onClick={onCancel} />
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-white w-full h-[100dvh] flex flex-col md:w-[620px] md:h-auto md:max-h-[85vh] md:rounded-[2rem] shadow-2xl overflow-hidden relative z-10 border border-neutral-200"
            >
                <div className="flex-none pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-6 pb-6 px-8 flex justify-between items-center border-b border-neutral-200 bg-white">
                    <p className="font-bold text-neutral-900 tracking-tight flex items-center gap-3">
                        <Repeat2 className="w-5 h-5 text-emerald-500" /> Repost Story
                    </p>
                    <button onClick={onCancel} className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all border border-neutral-200 flex-shrink-0 active:scale-90" aria-label="Close">
                        <X size={20} className="text-neutral-500" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col gap-8 bg-white">
                    <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-transparent pointer-events-none" />
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Repeat2 className="w-3.5 h-3.5" /> Reposting {quote.authorName}&apos;s story
                        </p>
                        <p className="text-base font-serif text-neutral-700 line-clamp-3 italic leading-relaxed">&quot;{quote.textContent}&quot;</p>
                    </div>

                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add your thoughts..."
                        className="w-full h-32 md:h-40 p-6 bg-neutral-50 border border-neutral-200 rounded-2xl shadow-sm focus:bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none text-lg font-medium text-neutral-900 placeholder:text-neutral-400 transition-all duration-300"
                    />

                    {stagedFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {stagedFiles.map((f, i) => (
                                <div key={f.id} className="relative aspect-square rounded-2xl overflow-hidden group shadow-lg bg-neutral-100 border border-neutral-200">
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
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} />
                        <button onClick={() => fileRef.current?.click()} disabled={submitting} className="w-full sm:w-auto flex-[0.7] flex justify-center items-center gap-2 border border-neutral-200 rounded-2xl py-4 bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 hover:border-neutral-300 shadow-sm transition-all active:scale-95 text-sm font-bold uppercase tracking-wider">
                            <ImageIcon className="w-5 h-5" /> Visuals
                        </button>
                        <div className="w-full sm:w-auto flex-[2] relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Where did this happen?" className="w-full border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm transition-all outline-none" />
                        </div>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{IMAGE_UPLOAD_HELPER_TEXT}</p>

                    <div className="pt-2">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Tagged Homestay
                        </p>
                        <div className="border border-neutral-200 rounded-2xl shadow-sm overflow-hidden bg-white isolate z-10">
                            <CustomCombobox options={homestays} value={selectedHomestay} onChange={setSelectedHomestay} placeholder="Tag a specific Homestay" />
                        </div>
                    </div>

                    <button onClick={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-3 py-5 bg-neutral-900 hover:bg-neutral-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-30 mt-2 text-sm">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {submitting ? 'Publishing...' : 'Publish Repost'}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
