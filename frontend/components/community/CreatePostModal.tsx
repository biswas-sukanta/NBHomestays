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
import { useQueryClient } from '@tanstack/react-query';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CustomCombobox } from '@/components/ui/combobox';
import { useHomestaySearch } from '@/hooks/useHomestaySearch';
import { CommunityPost, QuotePost } from './types';
import { StagedFile } from '@/components/host/ImageDropzone';
import { IMAGE_UPLOAD_HELPER_TEXT, processImages } from '@/lib/utils/imageUploadPipeline';
import { queryKeys } from '@/lib/queryKeys';
import { axiosInstance as api } from '@/lib/api-client';
import { resolveAvatarUrl } from '@/lib/avatar';

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

const ALLOWED_VIBE_TAGS = [
    { label: 'Hidden Gem', value: 'Hidden Gem' },
    { label: 'Offbeat', value: 'Offbeat' },
    { label: 'Sunrise', value: 'Sunrise' },
    { label: 'Heritage', value: 'Heritage' },
    { label: 'Food', value: 'Food' },
    { label: 'Local Tips', value: 'Local Tips' },
    { label: 'Transport', value: 'Transport' },
] as const;

const POST_TYPES = [
    { label: 'Question', value: 'Question' },
    { label: 'Trip Report', value: 'Trip Report' },
    { label: 'Review', value: 'Review' },
    { label: 'Alert', value: 'Alert' },
    { label: 'Photo', value: 'Photo' },
    { label: 'Story', value: 'Story' },
] as const;

interface CreatePostModalProps {
    postData?: Post;
    repostTarget?: RepostTarget;
    onSuccess: (post: Post) => void;
    onCancel: () => void;
}

export function CreatePostModal({ postData, repostTarget, onSuccess, onCancel }: CreatePostModalProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const viewerId = user?.id ?? null;
    const communityFeedPrefix = ['community', 'posts'] as const;
    const trendingQueryKey = queryKeys.community.trending(viewerId);
    const currentUserAvatarUrl = resolveAvatarUrl(
        user?.id,
        (user as any)?.avatarUrl,
        [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email
    );
    const [text, setText] = useState(postData?.caption || '');
    const [location, setLocation] = useState(postData?.location || '');
    const [submitting, setSubmitting] = useState(false);
    const [existingMedia, setExistingMedia] = useState<{ url: string; fileId?: string }[]>(
        postData?.images?.length
            ? postData.images.map(img => ({ url: img.url, fileId: img.fileId }))
            : (postData?.imageUrl ? [{ url: postData.imageUrl }] : [])
    );
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [uploadState, setUploadState] = useState<Record<string, { status: 'queued' | 'uploading' | 'done' | 'error'; progress: number; fileId?: string; url?: string }>>({});
    const [cropTarget, setCropTarget] = useState<StagedFile | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Unified homestay search hook
    const { data: homestays = [], isLoading: homestaysLoading, isFetching: homestaysFetching } = useHomestaySearch();
    const homestaysBusy = homestaysLoading || homestaysFetching;
    const [selectedHomestay, setSelectedHomestay] = useState(postData?.homestayId || '');
    const [selectedTags, setSelectedTags] = useState<string[]>((postData?.tags || []).filter(tag => ALLOWED_VIBE_TAGS.some(option => option.value === tag)));
    const [selectedPostType, setSelectedPostType] = useState<string>(postData?.postType || 'Story');
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
            setExistingMedia(
                postData.images?.length
                    ? postData.images.map(img => ({ url: img.url, fileId: img.fileId }))
                    : (postData.imageUrl ? [{ url: postData.imageUrl }] : [])
            );
            setSelectedHomestay(postData.homestayId || '');
            setSelectedTags((postData.tags || []).filter(tag => ALLOWED_VIBE_TAGS.some(option => option.value === tag)));
            setSelectedPostType(postData.postType || 'Story');
        }
    }, [postData]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        try {
            const processed = await processImages(files);
            const currentCount = existingMedia.length + stagedFiles.length;
            if (currentCount + processed.length > 5) {
                throw new Error('Maximum 5 images allowed.');
            }
            const currentSize = stagedFiles.reduce((sum, staged) => sum + staged.file.size, 0);
            const newSize = processed.reduce((sum, file) => sum + file.size, 0);
            if (currentSize + newSize > 10 * 1024 * 1024) {
                throw new Error('Total upload size must be under 10MB.');
            }

            const newStaged = processed.map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                previewUrl: URL.createObjectURL(file)
            }));
            setStagedFiles(prev => [...prev, ...newStaged]);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Image validation failed.';
            toast.error(message);
        } finally {
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const removeStaged = (id: string) => {
        setStagedFiles(prev => {
            const f = prev.find(item => item.id === id);
            if (f) URL.revokeObjectURL(f.previewUrl);
            return prev.filter(item => item.id !== id);
        });
        setUploadState(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const uploadToImageKit = async (staged: StagedFile): Promise<{ fileId: string; url: string }> => {
        setUploadState(prev => ({
            ...prev,
            [staged.id]: { status: 'uploading', progress: 0 }
        }));

        const form = new FormData();
        form.append('files', staged.file);

        const res = await api.post('/images/upload-multiple', form, {
            onUploadProgress: (evt) => {
                const total = evt.total ?? 0;
                if (!total) return;
                const pct = Math.round((evt.loaded / total) * 100);
                setUploadState(prev => ({
                    ...prev,
                    [staged.id]: { ...(prev[staged.id] || { status: 'uploading' as const }), status: 'uploading', progress: pct }
                }));
            }
        });

        const first = Array.isArray(res.data) ? res.data[0] : null;
        if (!first?.url) {
            throw new Error('Image upload failed');
        }

        const uploaded = { fileId: first.fileId, url: first.url };
        setUploadState(prev => ({
            ...prev,
            [staged.id]: { status: 'done', progress: 100, fileId: uploaded.fileId, url: uploaded.url }
        }));
        return uploaded;
    };

    const handleSubmit = async () => {
        if (!text.trim() && stagedFiles.length === 0 && existingMedia.length === 0) {
            setError("Please add some text or a photo to share.");
            return;
        }
        setError('');
        setSubmitting(true);
        const latestFeedKey = queryKeys.community.feed(undefined, 'latest', viewerId);
        const previousFeed = queryClient.getQueryData(latestFeedKey);
        const tempId = `temp-${Date.now()}`;
        const previewMedia = stagedFiles.map(staged => ({ url: staged.previewUrl }));
        const optimisticMedia = [...existingMedia, ...previewMedia];

        await queryClient.cancelQueries({ queryKey: communityFeedPrefix });

        const optimisticPost = {
            id: postData?.id ?? tempId,
            author: {
                id: user?.id,
                name: user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'You',
                role: user?.role ?? 'ROLE_USER',
                avatarUrl: currentUserAvatarUrl,
                isVerifiedHost: (user as any)?.isVerifiedHost ?? false
            },
            locationName: location || 'North Bengal',
            textContent: text,
            media: optimisticMedia,
            tags: selectedTags.length > 0 ? selectedTags : [],
            postType: selectedPostType,
            loveCount: 0,
            shareCount: 0,
            commentCount: 0,
            isLikedByCurrentUser: false,
            createdAt: new Date().toISOString(),
            homestayId: selectedHomestay || null
        };

        queryClient.setQueryData(latestFeedKey, (old: any) => {
            if (!old || !old.pages) return old;
            const newPages = [...old.pages];
            if (postData) {
                return {
                    ...old,
                    pages: newPages.map((page: any) => ({
                        ...page,
                        content: (page.content || []).map((p: any) => p.id === postData.id ? optimisticPost : p)
                    }))
                };
            }
            if (newPages.length > 0) {
                newPages[0] = {
                    ...newPages[0],
                    content: [optimisticPost, ...(newPages[0].content || [])]
                };
            }
            return { ...old, pages: newPages };
        });

        // Track uploaded media for potential rollback
        let uploadedMedia: { url: string; fileId?: string }[] = [];

        try {
            if (stagedFiles.length > 0) {
                const results = await Promise.all(
                    stagedFiles.map(async (staged) => {
                        try {
                            return await uploadToImageKit(staged);
                        } catch (e) {
                            setUploadState(prev => ({
                                ...prev,
                                [staged.id]: { status: 'error', progress: prev[staged.id]?.progress ?? 0 }
                            }));
                            throw e;
                        }
                    })
                );
                uploadedMedia = results.map(r => ({ url: r.url, fileId: r.fileId }));
            }

            const payload: any = {
                textContent: text,
                locationName: location || 'North Bengal',
                media: [...existingMedia, ...uploadedMedia],
                tags: selectedTags.length > 0 ? selectedTags : undefined,
                postType: selectedPostType,
            };

            if (selectedHomestay) payload.homestayId = selectedHomestay;
            if (repostTarget) payload.repostedFromPostId = repostTarget.id;

            const formData = new FormData();
            formData.append('request', new Blob([JSON.stringify(payload)], { type: "application/json" }));

            toast.info(postData ? "Updating story..." : "Sharing story...");
            const res = postData
                ? await postApi.update(postData.id, formData)
                : await postApi.create(formData);

            queryClient.setQueryData(latestFeedKey, (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        content: (page.content || []).map((p: any) => {
                            const targetId = postData?.id ?? tempId;
                            return p.id === targetId ? res.data : p;
                        })
                    }))
                };
            });

            queryClient.invalidateQueries({ queryKey: communityFeedPrefix });
            queryClient.invalidateQueries({ queryKey: trendingQueryKey });
            if (postData) {
                queryClient.invalidateQueries({ queryKey: ['post', postData.id] });
            }

            onSuccess(res.data);
            stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
        } catch (err: any) {
            console.error('Post failed', err);
            queryClient.setQueryData(latestFeedKey, previousFeed);
            toast.error(err.response?.data?.message || "Failed to share story.");

            // Rollback: Delete uploaded media files to prevent orphans
            const uploadedFileIds = uploadedMedia
                .map((m) => m.fileId)
                .filter((id): id is string => id !== undefined);
            if (uploadedFileIds.length > 0) {
                try {
                    await postApi.rollbackMedia(uploadedFileIds);
                } catch (rollbackErr) {
                    console.error('Rollback failed', rollbackErr);
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4">
            <div className="hidden md:block absolute inset-0 -z-10" onClick={onCancel} />
            <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300, mass: 0.8 }}
                className="bg-white w-full md:w-[620px] max-h-[90dvh] md:max-h-[85vh] flex flex-col rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden relative z-10 border border-neutral-200"
            >
                <div className="flex-none pt-6 pb-5 px-6 md:px-8 flex justify-between items-center border-b border-neutral-200 bg-white">
                    <h2 className="text-2xl font-bold font-heading text-neutral-900 tracking-tight">
                        {postData ? 'Edit Your Story' : repostTarget ? 'Repost Story' : 'Share Your Journey'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all flex-shrink-0 border border-neutral-200 shadow-sm group active:scale-90"
                        aria-label="Close"
                    >
                        <X size={18} className="text-neutral-500 group-hover:text-neutral-900 transition-colors" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-white pb-8 scroll-smooth hide-scrollbar">
                    <div className="p-6 md:p-8 flex flex-col gap-7">
                        {repostTarget && (
                            <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50 relative overflow-hidden">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <Share2 className="w-3.5 h-3.5" /> Reposting {repostTarget.authorName}&apos;s story
                                </p>
                                <p className="text-base font-heading text-neutral-700 line-clamp-3 italic leading-relaxed">&quot;{repostTarget.textContent}&quot;</p>
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
                            className="w-full min-h-[120px] md:min-h-[160px] p-5 bg-neutral-50 border border-neutral-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 resize-y text-lg md:text-xl font-medium text-neutral-900 placeholder-neutral-400 transition-all duration-300"
                            error={error}
                        />

                        {(stagedFiles.length > 0 || existingMedia.length > 0) && (
                            <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory hide-scrollbar">
                                {existingMedia.map((mediaObj, i) => (
                                    <div key={`ex-${i}`} className="flex-none snap-start relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden group shadow-lg bg-neutral-100 border border-neutral-200">
                                        <OptimizedImage src={mediaObj.url} alt="existing" className="w-full h-full object-cover" width={300} />
                                        <button onClick={() => setExistingMedia(prev => prev.filter((_, idx) => idx !== i))}
                                            className="absolute top-3 right-3 p-2 bg-neutral-900/60 hover:bg-neutral-900 backdrop-blur-md rounded-full transition-all">
                                            <X className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                ))}
                                {stagedFiles.map((staged, i) => (
                                    <div key={staged.id} className="flex-none snap-start relative w-40 h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden group shadow-lg bg-neutral-100 border border-emerald-200">
                                        <OptimizedImage src={staged.previewUrl} alt="preview" className="w-full h-full object-cover" width={300} />
                                        {uploadState[staged.id]?.status === 'uploading' && (
                                            <div className="absolute inset-x-0 bottom-0 p-3 bg-neutral-900/60 backdrop-blur-sm">
                                                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${uploadState[staged.id]?.progress ?? 0}%` }} />
                                                </div>
                                                <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-white/80">Uploading {uploadState[staged.id]?.progress ?? 0}%</p>
                                            </div>
                                        )}
                                        {uploadState[staged.id]?.status === 'error' && (
                                            <div className="absolute inset-x-0 bottom-0 p-3 bg-rose-600/70 backdrop-blur-sm">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white">Upload failed</p>
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                                            <button onClick={() => removeStaged(staged.id)} className="p-2 bg-neutral-900/60 hover:bg-rose-500 backdrop-blur-md rounded-full transition-all text-white shadow-lg"><X className="w-4 h-4" /></button>
                                        </div>
                                        <div className="absolute bottom-3 right-3">
                                            <button onClick={() => setCropTarget(staged)} className="p-2 bg-neutral-900/60 hover:bg-white hover:text-neutral-900 backdrop-blur-md rounded-full transition-all text-white shadow-lg"><Scissors className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row shadow-lg items-center gap-3">
                            <input data-testid="image-upload-input" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} />
                            <button data-testid="add-photo-btn" onClick={() => fileRef.current?.click()} disabled={submitting}
                                className="w-full sm:w-auto flex-[0.7] flex justify-center items-center gap-2 border border-neutral-200 rounded-2xl py-3.5 bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 hover:border-neutral-300 transition-all font-bold uppercase tracking-wider text-[11px]" title="Add Photos">
                                <ImageIcon className="w-4 h-4" />
                                <span>Media</span>
                            </button>
                            <div className="w-full sm:w-auto flex-[2] relative group">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/70 group-focus-within:text-emerald-400 transition-colors" />
                                <input
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    placeholder="Location (e.g. Darjeeling)"
                                    className="w-full border border-neutral-200 bg-neutral-50 text-neutral-900 placeholder-neutral-400 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{IMAGE_UPLOAD_HELPER_TEXT}</p>

                        <div className="border border-neutral-200 rounded-2xl shadow-lg overflow-hidden bg-neutral-50 isolate z-10">
                            <CustomCombobox
                                options={homestays}
                                value={selectedHomestay}
                                onChange={setSelectedHomestay}
                                placeholder="Tag a specific Homestay..."
                                loading={homestaysBusy}
                                disabled={!homestaysBusy && homestays.length === 0}
                            />
                        </div>

                        <div className="pt-2">
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Post Type</p>
                            <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
                                {POST_TYPES.map(type => {
                                    const isSelected = selectedPostType === type.value;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setSelectedPostType(type.value)}
                                            className={cn(
                                                'px-3.5 py-2 md:px-4 md:py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-widest border transition-all duration-300 select-none shadow-sm flex-grow md:flex-grow-0',
                                                isSelected
                                                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                                                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-neutral-900'
                                            )}
                                        >
                                            {type.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Vibe Tags {selectedTags.length > 0 && <span className="text-emerald-600">({selectedTags.length}/3)</span>}</p>
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {ALLOWED_VIBE_TAGS.map(tag => {
                                    const isSelected = selectedTags.includes(tag.value);
                                    const isDisabled = !isSelected && selectedTags.length >= 3;
                                    return (
                                        <button
                                            key={tag.value}
                                            type="button"
                                            onClick={() => toggleTag(tag.value)}
                                            disabled={isDisabled}
                                            className={cn(
                                                'px-3.5 py-2 md:px-4 md:py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-widest border transition-all duration-300 select-none shadow-sm flex-grow md:flex-grow-0',
                                                isSelected
                                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                                    : isDisabled
                                                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 opacity-50 cursor-not-allowed'
                                                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50'
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

                <div className="flex-none p-5 md:p-6 bg-white border-t border-neutral-200 z-20 relative shadow-lg">
                    <button data-testid="submit-post-btn" onClick={handleSubmit} disabled={submitting || (!text.trim() && stagedFiles.length === 0 && existingMedia.length === 0)}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-neutral-900 hover:bg-neutral-800 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100 transition-all text-xs md:text-sm">
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
