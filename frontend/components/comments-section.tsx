'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, ChevronDown, ChevronUp, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ImageCollage } from '@/components/community/ImageCollage';
import dynamic from 'next/dynamic';
const ImageLightbox = dynamic(() => import('@/components/community/ImageLightbox').then(m => m.ImageLightbox), { ssr: false });
import { CommentSkeleton } from '@/components/community/CommentSkeleton';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { IMAGE_UPLOAD_HELPER_TEXT, processImages } from '@/lib/utils/imageUploadPipeline';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentAuthor { id: string; firstName?: string; lastName?: string; avatarUrl?: string; }
interface Comment {
    id: string;
    body: string;
    author: {
        id: string;
        name: string;
        role: string;
        avatarUrl?: string;
    };
    createdAt: string;
    replies?: Comment[];
    replyCount?: number;
    media?: { url: string; fileId?: string }[];
}

function formatTime(iso: string) {
    const d = (Date.now() - new Date(iso).getTime()) / 1000;
    if (d < 60) return 'just now';
    if (d < 3600) return `${Math.floor(d / 60)}m`;
    if (d < 86400) return `${Math.floor(d / 3600)}h`;
    return `${Math.floor(d / 86400)}d`;
}

function Initials({ name }: { name: string }) {
    return (
        <div className="w-9 h-9 rounded-full bg-zinc-900 border border-white/10 text-white text-xs font-black flex items-center justify-center flex-none shadow-xl tracking-tighter">
            {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
        </div>
    );
}

interface CommentsSectionProps {
    postId: string;
    hideTrigger?: boolean;
    externalOpen?: boolean;
    onExternalClose?: () => void;
    onCommentCountChange?: (count: number) => void;
    currentUserRole?: string;
}

interface SingleCommentProps {
    comment: Comment;
    postId: string;
    depth?: number;
    onDelete: (id: string) => void;
    currentUserId?: string;
    token?: string;
    currentUserRole?: string;
}

function SingleComment({ comment, postId, depth = 0, onDelete, currentUserId, token, currentUserRole }: SingleCommentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editBody, setEditBody] = useState(comment.body);
    const [showReplies, setShowReplies] = useState(false);
    const [replying, setReplying] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies || []);
    const [submitting, setSubmitting] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const submitReply = async () => {
        if (!replyBody.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await apiFetch(`/posts/${postId}/comments/${comment.id}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ body: replyBody.trim() }),
            });
            if (res.ok) {
                const newReply: Comment = await res.json();
                setLocalReplies(prev => [...prev, newReply]);
                setReplyBody('');
                setReplying(false);
                setShowReplies(true);
            }
        } finally { setSubmitting(false); }
    };

    const handleEditSubmit = async () => {
        if (!editBody.trim() || editBody === comment.body) {
            setIsEditing(false);
            return;
        }
        setSubmitting(true);
        try {
            const res = await apiFetch(`/posts/${postId}/comments/${comment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ body: editBody })
            });
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to edit comment");
            }
            comment.body = editBody;
            setIsEditing(false);
            toast.success("Comment updated");
        } catch (e: any) {
            toast.error(e.message || "Failed to edit comment");
        } finally {
            setSubmitting(false);
        }
    };

    const isOwner = String(currentUserId) === String(comment.author?.id);
    const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'ROLE_ADMIN';
    const canModify = isOwner || isAdmin;

    const totalReplies = localReplies.length;

    return (
        <div data-testid="comment-item" className={cn('group', depth > 0 && 'ml-8 mt-3 pl-3 border-l-2 border-border/50')}>
            <div className="flex gap-2.5">
                <Initials name={comment.author?.name || 'User'} />
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start w-full">
                        <div className="flex flex-col flex-1 min-w-0">
                            {/* Bubble */}
                            <div className="bg-zinc-900/80 ring-1 ring-white/5 rounded-2xl px-4 py-3.5 text-sm shadow-2xl backdrop-blur-sm">
                                <span className="font-black text-white text-[10px] uppercase tracking-widest mr-2 opacity-90">{comment.author?.name || 'User'}</span>
                                {isEditing ? (
                                    <div className="mt-2 flex flex-col gap-3">
                                        <textarea
                                            autoFocus
                                            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-green-500 min-h-[80px] shadow-inner"
                                            value={editBody}
                                            onChange={e => setEditBody(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleEditSubmit();
                                                }
                                                if (e.key === 'Escape') { setIsEditing(false); setEditBody(comment.body); }
                                            }}
                                        />
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => { setIsEditing(false); setEditBody(comment.body); }} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">Cancel</button>
                                            <button onClick={handleEditSubmit} disabled={submitting} className="text-[10px] font-black uppercase tracking-widest bg-white text-zinc-950 px-3 py-1 rounded-lg">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-zinc-100 leading-relaxed whitespace-pre-line font-medium">{comment.body}</span>
                                )}
                                {comment.media && comment.media.length > 0 && (
                                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                        <ImageCollage images={comment.media.map(m => m.url)} onImageClick={(i) => setLightboxIndex(i)} />
                                    </div>
                                )}
                            </div>

                            {/* Meta row - EXPLICIT ACTIONS ON THE RIGHT */}
                            <div className="flex items-center justify-between w-full mt-2 px-1">
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{formatTime(comment.createdAt)}</span>
                                    {depth === 0 && (
                                        <button
                                            onClick={() => setReplying(r => !r)}
                                            className="text-[10px] font-black uppercase tracking-widest text-green-500 hover:text-green-400 transition-colors"
                                        >Reply</button>
                                    )}
                                </div>

                                {canModify && !isEditing && (
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(comment.id)}
                                            className="text-[10px] font-black uppercase tracking-widest text-rose-500/70 hover:text-rose-400 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reply input */}
            <AnimatePresence>
                {replying && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-8 mt-3 flex gap-3"
                    >
                        <input
                            autoFocus
                            value={replyBody}
                            onChange={e => setReplyBody(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
                            placeholder="Write a reply..."
                            className="flex-1 text-sm bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-green-500 shadow-inner placeholder:text-zinc-600"
                        />
                        <button
                            onClick={submitReply}
                            disabled={!replyBody.trim() || submitting}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-green-600 text-white disabled:opacity-30 active:scale-95 transition-all shadow-lg"
                            aria-label="Send reply"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Replies toggle */}
            {totalReplies > 0 && depth === 0 && (
                <button
                    onClick={() => setShowReplies(s => !s)}
                    className="ml-12 mt-2.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-500 hover:text-green-400 transition-colors"
                >
                    {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showReplies ? 'Hide' : `View ${totalReplies} ${totalReplies === 1 ? 'reply' : 'replies'}`}
                </button>
            )}

            {/* Inline replies */}
            <AnimatePresence>
                {showReplies && localReplies.map(reply => (
                    <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                    >
                        <SingleComment
                            comment={reply}
                            postId={postId}
                            depth={depth + 1}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                            token={token}
                            currentUserRole={currentUserRole}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Lightbox */}
            {lightboxIndex !== null && comment.media && comment.media.length > 0 && (
                <ImageLightbox images={comment.media.map(m => m.url)} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}
        </div>
    );
}

// ── Public API ────────────────────────────────────────────────
export function CommentsSection({ postId, hideTrigger, externalOpen, onExternalClose, onCommentCountChange, currentUserRole }: CommentsSectionProps) {
    const { isAuthenticated, user } = useAuth() as any;
    // AuthContext stores under 'token'
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const [stagedFiles, setStagedFiles] = useState<{ id: string, file: File, previewUrl: string }[]>([]);
    const fileRef = React.useRef<HTMLInputElement>(null);

    // ... cleanup preview URLs
    useEffect(() => {
        return () => stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    }, [stagedFiles]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        try {
            const processed = await processImages(Array.from(e.target.files));
            if (stagedFiles.length + processed.length > 5) {
                throw new Error('Maximum 5 images allowed.');
            }
            const currentSize = stagedFiles.reduce((sum, staged) => sum + staged.file.size, 0);
            const newSize = processed.reduce((sum, file) => sum + file.size, 0);
            if (currentSize + newSize > 10 * 1024 * 1024) {
                throw new Error('Total upload size must be under 10MB.');
            }
            const newStaged = processed.map(f => ({
                id: Math.random().toString(36).substring(7),
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

    const removeStaged = (id: string) => {
        setStagedFiles(prev => {
            const f = prev.find(st => st.id === id);
            if (f) URL.revokeObjectURL(f.previewUrl);
            return prev.filter(st => st.id !== id);
        });
    };

    useEffect(() => {
        if (!open) return;
        apiFetch(`/posts/${postId}/comments?page=0&size=20`)
            .then(r => r.json())
            .then(data => setComments(data.content ?? data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [postId, open]);

    const submitComment = async () => {
        if ((!newComment.trim() && stagedFiles.length === 0) || submitting) return;
        setSubmitting(true);
        try {
            // OPTIMISTIC UPDATE if no files
            let tempId = '';
            if (stagedFiles.length === 0) {
                tempId = 'temp-' + Math.random().toString(36).substring(7);
                const optimisticComment: Comment = {
                    id: tempId,
                    body: newComment.trim(),
                    author: {
                        id: user?.id || 'anon',
                        name: (user?.firstName || 'User') + (user?.lastName ? ' ' + user?.lastName : ''),
                        role: user?.role || 'USER',
                        avatarUrl: user?.avatarUrl
                    },
                    createdAt: new Date().toISOString(),
                    media: []
                };
                setComments(prev => [...prev, optimisticComment]);
                setNewComment('');
            }

            // 1. Upload Images to ImageKit if any
            let finalUrls: { url: string, fileId?: string }[] = [];
            if (stagedFiles.length > 0) {
                const formData = new FormData();
                stagedFiles.forEach(s => formData.append('files', s.file));
                const uploadRes = await apiFetch(`/images/upload-multiple`, {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error('Image upload failed');
                finalUrls = await uploadRes.json();
            }

            // 2. Submit Comment
            const res = await apiFetch(`/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ body: newComment.trim(), media: finalUrls }),
            });
            if (res.ok) {
                const c: Comment = await res.json();
                if (tempId) {
                    setComments(prev => prev.map(comm => comm.id === tempId ? c : comm));
                } else {
                    setComments(prev => [...prev, c]);
                    setNewComment('');
                    setStagedFiles([]);
                }
                onCommentCountChange?.(comments.length + 1);
            } else {
                if (tempId) setComments(prev => prev.filter(comm => comm.id !== tempId));
                toast.error('Failed to post comment');
            }
        } catch (e: any) {
            toast.error(e.message || 'An error occurred');
        } finally { setSubmitting(false); }
    };

    const deleteComment = async (commentId: string) => {
        const confirmToast = toast.loading("Deleting comment...");
        try {
            const res = await apiFetch(`/comments/${commentId}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error("Failed to delete");

            setComments(prev => {
                const next = prev.filter(c => c.id !== commentId);
                onCommentCountChange?.(next.length);
                return next;
            });
            toast.success("Comment deleted", { id: confirmToast });
        } catch (e) {
            console.error(e);
            toast.error("Cloud sync failed", { id: confirmToast });
        }
    };

    const handleClose = () => {
        if (onExternalClose) onExternalClose();
        else setInternalOpen(false);
    };

    // ── Scroll Lock: prevent background scrolling when drawer is open ──
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = 'unset'; };
        }
    }, [open]);

    return (
        <div className={cn(hideTrigger ? "" : "mt-2")}>
            {!hideTrigger && (
                <button
                    onClick={() => setInternalOpen(true)}
                    className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-all group"
                >
                    <MessageCircle className="w-5 h-5 group-hover:fill-white/10" />
                    <span className="uppercase tracking-widest text-[11px]">{`Comments (${comments.length})`}</span>
                </button>
            )}

            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
                        {/* Backdrop — full interaction blocker */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={handleClose}
                        />

                        {/* Drawer container */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative z-10 w-full max-w-[700px] h-[90dvh] max-h-[90vh] md:max-h-[85vh] bg-zinc-950 rounded-t-[2.5rem] md:rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border border-white/5 ring-1 ring-white/10"
                        >
                            {/* Header — flex-none: NEVER shrinks or grows under zoom */}
                            <div className="flex-none flex items-center justify-between px-8 py-6 border-b border-white/5 bg-zinc-950">
                                <h2 className="font-serif font-bold text-2xl md:text-3xl text-white tracking-tight">Comments</h2>
                                <button onClick={handleClose} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all border border-white/10 group active:scale-90" aria-label="Close comments">
                                    <X className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                                </button>
                            </div>

                            {/* Body — flex-1 min-h-0: only tier that flexes */}
                            <div className="flex-1 overflow-y-auto px-8 py-6 bg-zinc-950 overscroll-contain min-h-0 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                {loading ? (
                                    <div className="space-y-6">
                                        {[1, 2, 3].map(i => <CommentSkeleton key={i} />)}
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center px-10">
                                        <div className="w-28 h-28 bg-zinc-900 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10 shadow-2xl">
                                            <MessageCircle className="w-12 h-12 text-zinc-700" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2 font-serif">Quiet on the trail...</h3>
                                        <p className="text-sm text-zinc-500 max-w-[240px] leading-relaxed">Be the first to share your thoughts and join the local conversation.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {comments.map(c => (
                                            <SingleComment
                                                key={c.id}
                                                comment={c}
                                                postId={postId}
                                                onDelete={deleteComment}
                                                currentUserId={user?.id}
                                                token={token || undefined}
                                                currentUserRole={user?.role}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer — flex-none: NEVER shrinks or grows under zoom */}
                            <div className="flex-none p-6 border-t border-white/5 bg-zinc-950">
                                {isAuthenticated ? (
                                    <div className="flex flex-col gap-3">
                                        {/* Staging Area */}
                                        {stagedFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 px-1">
                                                {stagedFiles.map(file => (
                                                    <div key={file.id} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                                        <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                                        <button onClick={() => removeStaged(file.id)} className="absolute top-1 right-1 p-0.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 flex-none rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white text-sm font-black shadow-2xl">
                                                {user?.firstName?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1 flex items-center bg-zinc-900/50 rounded-2xl px-5 py-4 border border-white/10 focus-within:border-green-500/50 focus-within:bg-zinc-900 transition-all shadow-2xl relative">
                                                <input data-testid="comment-image-input" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} />
                                                <input
                                                    data-testid="comment-input"
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitComment())}
                                                    placeholder="Add a comment..."
                                                    className="flex-1 bg-transparent text-[15px] font-bold text-white focus:outline-none placeholder:text-zinc-600"
                                                />
                                                <button data-testid="comment-attach-btn" onClick={() => fileRef.current?.click()} className="text-zinc-500 hover:text-green-500 transition-colors ml-3" aria-label="Attach photo">
                                                    <ImageIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <button
                                                data-testid="comment-send-btn"
                                                onClick={submitComment}
                                                disabled={(!newComment.trim() && stagedFiles.length === 0) || submitting}
                                                className="w-12 h-12 flex-none rounded-2xl bg-white text-zinc-950 flex items-center justify-center disabled:opacity-30 hover:bg-zinc-100 transition-all shadow-2xl active:scale-95"
                                            >
                                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                                            </button>
                                        </div>
                                        <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">{IMAGE_UPLOAD_HELPER_TEXT}</p>
                                    </div>
                                ) : (
                                    <p className="text-[13px] text-gray-500 text-center py-2 font-medium">
                                        <Link href="/login" className="text-green-600 font-bold hover:underline content-center">Login</Link> to join the conversation
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
