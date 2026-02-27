'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Repeat2, X, MapPin, Image as ImageIcon, Send, Loader2, Scissors } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CommentsSection } from '@/components/comments-section';
import { PostCard, CommunityPost, QuotePost, formatRelative } from '@/components/community/PostCard';
import { ImageCropModal } from '@/components/host/ImageCropModal';
import { StagedFile } from '@/components/host/ImageDropzone';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── QuotedPostPreview ────────────────────────────────────────────────────────
function QuotedPostPreview({ quote, onClear }: { quote: QuotePost; onClear: () => void }) {
    return (
        <div className="relative border border-green-300 dark:border-green-700 rounded-2xl p-4 bg-green-50 dark:bg-green-950/30">
            <button
                onClick={onClear}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Remove quote"
            >
                <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Repeat2 className="w-3.5 h-3.5" /> Reposting {quote.authorName}&apos;s story
            </p>
            <p className="text-sm text-foreground/80 line-clamp-2">{quote.textContent}</p>
        </div>
    );
}

// ── MiniComposer (for Repost) ─────────────────────────────────────────────────
function MiniRepostComposer({ quote, onSuccess, onCancel }: { quote: QuotePost; onSuccess: () => void; onCancel: () => void }) {
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageIdx: number | null }>({ isOpen: false, imageIdx: null });
    const fileRef = React.useRef<HTMLInputElement>(null);

    const canSubmit = text.trim().length > 0 || stagedFiles.length > 0;

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        try {
            let imageUrls: string[] = [];
            if (stagedFiles.length > 0) {
                const form = new FormData();
                stagedFiles.forEach(f => form.append('files', f.file));
                const up = await api.post('/api/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
                imageUrls = up.data;
            }
            await api.post('/api/posts', {
                textContent: text,
                locationName: 'North Bengal',
                imageUrls,
                repostedFromPostId: quote.id,
            });
            toast.success('Reposted!');
            onSuccess();
        } catch {
            toast.error('Repost failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
        >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                    <p className="font-extrabold text-foreground flex items-center gap-2"><Repeat2 className="w-4 h-4 text-green-600" /> Repost Story</p>
                    <button onClick={onCancel} className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"><X className="w-4 h-4" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <QuotedPostPreview quote={quote} onClear={onCancel} />
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add your thoughts..."
                        rows={3}
                        className="w-full bg-secondary/30 border border-border rounded-2xl px-4 py-3 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-4 focus:ring-green-600/10 focus:border-green-600/30 transition-all"
                    />
                    {stagedFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {stagedFiles.map((f, i) => (
                                <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden group">
                                    <img src={f.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                                        <button onClick={() => setCropModal({ isOpen: true, imageIdx: i })} className="p-1.5 bg-white rounded-full text-gray-900"><Scissors className="w-3 h-3" /></button>
                                        <button onClick={() => setStagedFiles(p => { URL.revokeObjectURL(p[i].previewUrl); return p.filter((_, j) => j !== i); })} className="p-1.5 bg-rose-500 rounded-full text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => {
                        const files = Array.from(e.target.files || []).map(f => ({ id: Math.random().toString(36).slice(2), file: f, previewUrl: URL.createObjectURL(f) }));
                        setStagedFiles(p => [...p, ...files].slice(0, 4));
                        if (fileRef.current) fileRef.current.value = '';
                    }} />
                    <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-all">
                        <ImageIcon className="w-4 h-4" /> Photo
                    </button>
                    <button onClick={handleSubmit} disabled={!canSubmit || submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-extrabold hover:bg-green-700 transition-all disabled:opacity-50">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {submitting ? 'Posting...' : 'Repost'}
                    </button>
                </div>
            </div>
            {cropModal.isOpen && cropModal.imageIdx !== null && (
                <ImageCropModal
                    isOpen={cropModal.isOpen}
                    onClose={() => setCropModal({ isOpen: false, imageIdx: null })}
                    imageSrc={stagedFiles[cropModal.imageIdx].previewUrl}
                    onCropComplete={(blob) => {
                        const idx = cropModal.imageIdx!;
                        const cur = stagedFiles[idx];
                        const newFile = new File([blob], cur.file.name, { type: 'image/jpeg' });
                        URL.revokeObjectURL(cur.previewUrl);
                        setStagedFiles(p => { const n = [...p]; n[idx] = { ...n[idx], file: newFile, previewUrl: URL.createObjectURL(newFile) }; return n; });
                    }}
                />
            )}
        </motion.div>
    );
}

// ── PostDetailPage ────────────────────────────────────────────────────────────
export default function PostDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { user } = useAuth() as any;
    const [post, setPost] = useState<CommunityPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [repostQuote, setRepostQuote] = useState<QuotePost | null>(null);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await api.get(`/api/posts/${id}`);
                // Normalize: backend returns the full DTO with flat fields
                const data = res.data;
                const normalized: CommunityPost = {
                    id: data.id,
                    userId: data.userId,
                    userName: data.userName || (data.user ? `${data.user.firstName} ${data.user.lastName}` : 'Traveller'),
                    userEmail: data.userEmail,
                    locationName: data.locationName,
                    textContent: data.textContent,
                    imageUrls: data.imageUrls ?? [],
                    createdAt: data.createdAt,
                    loveCount: data.loveCount ?? 0,
                    shareCount: data.shareCount ?? 0,
                    isLikedByCurrentUser: data.isLikedByCurrentUser ?? false,
                    commentCount: data.commentCount ?? 0,
                    homestayId: data.homestayId,
                    homestayName: data.homestayName,
                };
                setPost(normalized);
            } catch {
                setPost(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
    );

    if (!post) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-2xl">🍃</p>
            <p className="text-muted-foreground text-lg font-semibold">Post not found</p>
            <button onClick={() => router.push('/community')} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-all">
                Back to Community
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Sticky back nav */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto max-w-2xl flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-foreground">Post</span>
                </div>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
                {/* Universal PostCard in detail mode — no hover lift, no card-level link */}
                <PostCard
                    post={post}
                    currentUser={user}
                    isDetailView={true}
                    onRepost={(quote) => setRepostQuote(quote)}
                />

                {/* Threaded Comments */}
                <CommentsSection postId={id} />
            </div>

            {/* Repost Composer Modal */}
            <AnimatePresence>
                {repostQuote && (
                    <MiniRepostComposer
                        quote={repostQuote}
                        onSuccess={() => { setRepostQuote(null); toast.success('Story reposted!'); }}
                        onCancel={() => setRepostQuote(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
