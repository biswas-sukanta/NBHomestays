'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Send, X, Scissors, Share2, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { postApi } from '@/lib/api/posts';
import { axiosInstance as api } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CustomCombobox } from '@/components/ui/combobox';
import { useHomestaySearch } from '@/hooks/useHomestaySearch';
import { CommunityPost, QuotePost } from './types';
import { StagedFile } from '@/components/host/ImageDropzone';

const ImageCropModal = dynamic(() => import('@/components/host/ImageCropModal').then(m => m.ImageCropModal), { ssr: false });

type Post = CommunityPost;

const VIBE_TAGS = [
    { label: '❓ Question', value: 'Question' },
    { label: '📝 Trip Report', value: 'Trip Report' },
    { label: '⭐ Review', value: 'Review' },
    { label: '⚠️ Alert', value: 'Alert' },
    { label: '✨ Hidden Gem', value: 'Hidden Gem' },
    { label: '🏔️ Offbeat', value: 'Offbeat' },
    { label: '🚗 Transport', value: 'Transport' },
] as const;

interface RepostTarget { id: string; authorName: string; textContent: string; }

interface CreatePostModalProps {
    postData?: Post;
    repostTarget?: RepostTarget;
    onSuccess: (post: Post) => void;
    onCancel: () => void;
}

export function CreatePostModal({ postData, repostTarget, onSuccess, onCancel }: CreatePostModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [text, setText] = useState(postData?.caption || '');
    const [location, setLocation] = useState(postData?.location || '');
    const [submitting, setSubmitting] = useState(false);
    const [existingMedia, setExistingMedia] = useState<{ url: string; fileId?: string }[]>(postData?.imageUrl ? [{ url: postData.imageUrl }] : []);
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [cropTarget, setCropTarget] = useState<StagedFile | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Unified homestay search hook
    const { data: homestays = [] } = useHomestaySearch();
    const [selectedHomestay, setSelectedHomestay] = useState(postData?.homestayId || '');
    const [selectedTags, setSelectedTags] = useState<string[]>(postData?.tags || []);
    const [error, setError] = useState('');

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : prev.length < 3 ? [...prev, tag] : prev
        );
    };

    useEffect(() => {
        if (postData) {
            setText(postData.caption || '');
            setLocation(postData.location || '');
            setExistingMedia(postData.imageUrl ? [{ url: postData.imageUrl }] : []);
            setSelectedHomestay(postData.homestayId || '');
            setSelectedTags(postData.tags || []);
        }
    }, [postData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const newStaged = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file)
        }));
        setStagedFiles(prev => [...prev, ...newStaged].slice(0, 10));
        if (fileRef.current) fileRef.current.value = '';
    };

    const removeStaged = (id: string) => {
        setStagedFiles(prev => {
            const f = prev.find(item => item.id === id);
            if (f) URL.revokeObjectURL(f.previewUrl);
            return prev.filter(item => item.id !== id);
        });
    };

    const handleSubmit = async () => {
        if (!text.trim() && stagedFiles.length === 0 && existingMedia.length === 0) {
            setError("Please add some text or a photo to share.");
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            let uploadedMedia: { url: string; fileId?: string }[] = [];
            if (stagedFiles.length > 0) {
                const form = new FormData();
                stagedFiles.forEach(staged => form.append('files', staged.file));
                const upres = await api.post('/upload', form);
                uploadedMedia = upres.data;
            }

            const payload: any = {
                textContent: text,
                locationName: location || 'North Bengal',
                media: [...existingMedia, ...uploadedMedia],
                tags: selectedTags.length > 0 ? selectedTags : undefined,
            };

            if (selectedHomestay) payload.homestayId = selectedHomestay;
            if (repostTarget) payload.repostedFromPostId = repostTarget.id;

            const formData = new FormData();
            formData.append('request', new Blob([JSON.stringify(payload)], { type: "application/json" }));

            toast.info(postData ? "Updating story..." : "Sharing story...");
            const res = postData
                ? await postApi.update(postData.id, formData)
                : await postApi.create(formData);

            // Optimistic update
            if (!postData) {
                queryClient.setQueryData(['community-posts'], (old: any) => {
                    if (!old || !old.pages) return old;
                    const newPages = [...old.pages];
                    if (newPages.length > 0) {
                        newPages[0] = {
                            ...newPages[0],
                            content: [res.data, ...(newPages[0].content || [])]
                        };
                    }
                    return { ...old, pages: newPages };
                });
            } else {
                queryClient.setQueryData(['community-posts'], (old: any) => {
                    if (!old || !old.pages) return old;
                    const newPages = old.pages.map((page: any) => ({
                        ...page,
                        content: (page.content || []).map((p: any) => p.id === postData.id ? res.data : p)
                    }));
                    return { ...old, pages: newPages };
                });
            }

            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            if (postData) {
                queryClient.invalidateQueries({ queryKey: ['post', postData.id] });
            }

            onSuccess(res.data);
            stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
        } catch (err: any) {
            console.error('Post failed', err);
            toast.error(err.response?.data?.message || "Failed to share story.");
        } finally {
            setSubmitting(false);
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4">
            <div className="hidden md:block absolute inset-0 -z-10" onClick={onCancel} />
            <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
                className="bg-zinc-950 w-full md:w-[620px] max-h-[90dvh] md:max-h-[85vh] flex flex-col rounded-t-[2rem] md:rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden relative z-10 border-t border-white/5 md:border ring-1 ring-white/10"
            >
                <div className="flex-none pt-6 pb-5 px-6 md:px-8 flex justify-between items-center border-b border-white/5 bg-zinc-950">
                    <h2 className="text-2xl font-bold font-serif text-white tracking-tight">
                        {postData ? 'Edit Your Story' : repostTarget ? 'Repost Story' : 'Share Your Journey'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2.5 bg-zinc-900/50 hover:bg-zinc-800 rounded-full transition-all flex-shrink-0 border border-white/10 shadow-xl group active:scale-90"
                        aria-label="Close"
                    >
                        <X size={18} className="text-zinc-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950 pb-8 scroll-smooth hide-scrollbar">
                    <div className="p-6 md:p-8 flex flex-col gap-7">
                        {repostTarget && (
                            <div className="border border-green-500/30 rounded-2xl p-5 bg-green-500/5 relative overflow-hidden">
                                <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Share2 className="w-3.5 h-3.5" /> Reposting {repostTarget.authorName}&apos;s story
                                </p>
                                <p className="text-base font-serif text-zinc-200 line-clamp-3 italic leading-relaxed">&quot;{repostTarget.textContent}&quot;</p>
                            </div>
                        )}

                        <Textarea
                            data-testid="post-textarea"
                            value={text}
                            onChange={e => {
                                setText(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder={repostTarget ? 'Add your thoughts...' : "What's the atmosphere like? Tell the community..."}
                            className="w-full min-h-[120px] md:min-h-[160px] p-5 bg-zinc-900/40 border border-white/10 rounded-3xl focus:bg-zinc-900 focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 resize-y text-lg md:text-xl font-medium text-white placeholder-zinc-600 transition-all duration-300 shadow-inner"
                            error={error}
                        />

                        {(stagedFiles.length > 0 || existingMedia.length > 0) && (
                            <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory hide-scrollbar">
                                {existingMedia.map((mediaObj, i) => (
                                    <div key={`ex-${i}`} className="flex-none snap-start relative w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden group shadow-xl bg-zinc-900 ring-1 ring-white/10">
                                        <OptimizedImage src={mediaObj.url} alt="existing" className="w-full h-full object-cover" width={300} />
                                        <button onClick={() => setExistingMedia(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black backdrop-blur-md rounded-full transition-all">
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ))}
                                {stagedFiles.map((staged, i) => (
                                    <div key={staged.id} className="flex-none snap-start relative w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden group shadow-xl bg-zinc-900 ring-1 ring-green-500/30">
                                        <OptimizedImage src={staged.previewUrl} alt="preview" className="w-full h-full object-cover" width={300} />
                                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            <button onClick={() => removeStaged(staged.id)} className="p-2 bg-black/60 hover:bg-rose-500 backdrop-blur-md rounded-full transition-all text-white shadow-lg"><X className="w-4 h-4" /></button>
                                        </div>
                                        <div className="absolute bottom-3 right-3">
                                            <button onClick={() => setCropTarget(staged)} className="p-2 bg-black/60 hover:bg-white hover:text-black backdrop-blur-md rounded-full transition-all text-white shadow-lg"><Scissors className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row shadow-2xl items-center gap-3">
                            <input data-testid="image-upload-input" ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                            <button data-testid="add-photo-btn" onClick={() => fileRef.current?.click()} disabled={submitting}
                                className="w-full sm:w-auto flex-[0.7] flex justify-center items-center gap-2 border border-white/10 rounded-2xl py-3.5 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-white/20 transition-all font-bold uppercase tracking-wider text-[11px]" title="Add Photos">
                                <ImageIcon className="w-4 h-4" />
                                <span>Media</span>
                            </button>
                            <div className="w-full sm:w-auto flex-[2] relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500/70 group-focus-within:text-green-400 transition-colors" />
                                <input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="Location (e.g. Darjeeling)"
                                    className="w-full border border-white/10 bg-zinc-900/50 text-white placeholder-zinc-600 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="border border-white/10 rounded-2xl shadow-2xl overflow-hidden bg-zinc-900/50 isolate z-10">
                            <CustomCombobox
                                options={homestays}
                                value={selectedHomestay}
                                onChange={setSelectedHomestay}
                                placeholder="Tag a specific Homestay..."
                            />
                        </div>

                        <div className="pt-2">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Post Category {selectedTags.length > 0 && <span className="text-green-500">({selectedTags.length}/3)</span>}</p>
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {VIBE_TAGS.map(tag => {
                                    const isSelected = selectedTags.includes(tag.value);
                                    const isDisabled = !isSelected && selectedTags.length >= 3;
                                    return (
                                        <button
                                            key={tag.value}
                                            type="button"
                                            onClick={() => toggleTag(tag.value)}
                                            disabled={isDisabled}
                                            className={cn(
                                                'px-3.5 py-2 md:px-4 md:py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-widest border transition-all duration-300 select-none shadow-xl flex-grow md:flex-grow-0',
                                                isSelected
                                                    ? 'bg-green-600 text-white border-green-500 shadow-[0_0_15px_rgba(22,163,74,0.2)]'
                                                    : isDisabled
                                                        ? 'bg-zinc-900 text-zinc-700 border-white/5 opacity-50 cursor-not-allowed'
                                                        : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-white/20 hover:text-white hover:bg-zinc-800'
                                            )}
                                        >
                                            {tag.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-none p-5 md:p-6 bg-zinc-950 border-t border-white/5 z-20 relative shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                    <button data-testid="submit-post-btn" onClick={handleSubmit} disabled={submitting || (!text.trim() && stagedFiles.length === 0 && existingMedia.length === 0)}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100 transition-all text-xs md:text-sm">
                        {submitting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                        {submitting ? 'Publishing...' : (postData ? 'Update Story' : repostTarget ? 'Publish Repost' : 'Publish Story')}
                    </button>
                </div>
            </motion.div>

            {cropTarget && (
                <ImageCropModal
                    isOpen={!!cropTarget}
                    imageSrc={cropTarget?.previewUrl || ''}
                    onCropComplete={(blob) => {
                        if (cropTarget) {
                            const newFile = new File([blob], cropTarget.file.name, { type: 'image/jpeg' });
                            const newPreview = URL.createObjectURL(newFile);
                            setStagedFiles(prev => prev.map(f => f.id === cropTarget.id ? { ...f, file: newFile, previewUrl: newPreview } : f));
                            URL.revokeObjectURL(cropTarget.previewUrl);
                        }
                        setCropTarget(null);
                    }}
                    onClose={() => setCropTarget(null)}
                />
            )}
        </div>,
        document.body
    );
}
