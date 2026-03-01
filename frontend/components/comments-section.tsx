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

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-none">
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
            const res = await fetch(`${API}/api/posts/${postId}/comments/${comment.id}/replies`, {
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
            const res = await fetch(`${API}/api/posts/${postId}/comments/${comment.id}`, {
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
                            <div className="bg-secondary/60 rounded-xl px-3 py-2.5 text-sm">
                                <span className="font-semibold text-foreground text-xs mr-1.5">{comment.author?.name || 'User'}</span>
                                {isEditing ? (
                                    <div className="mt-1 flex flex-col gap-2">
                                        <textarea
                                            autoFocus
                                            className="w-full bg-background border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px]"
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
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setIsEditing(false); setEditBody(comment.body); }} className="text-[11px] text-muted-foreground hover:text-foreground">Cancel</button>
                                            <button onClick={handleEditSubmit} disabled={submitting} className="text-[11px] bg-primary text-primary-foreground px-2 py-0.5 rounded">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-foreground leading-relaxed whitespace-pre-line">{comment.body}</span>
                                )}
                                {comment.media && comment.media.length > 0 && (
                                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                                        <ImageCollage images={comment.media.map(m => m.url)} onImageClick={(i) => setLightboxIndex(i)} />
                                    </div>
                                )}
                            </div>

                            {/* Meta row - EXPLICIT ACTIONS ON THE RIGHT */}
                            <div className="flex items-center justify-between w-full mt-1 px-1">
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] text-muted-foreground">{formatTime(comment.createdAt)}</span>
                                    {depth === 0 && (
                                        <button
                                            onClick={() => setReplying(r => !r)}
                                            className="text-[11px] font-semibold text-green-600 hover:text-green-700"
                                        >Reply</button>
                                    )}
                                </div>

                                {canModify && !isEditing && (
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => onDelete(comment.id)}
                                            className="text-[11px] font-semibold text-red-600 hover:text-red-800"
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
                        className="ml-8 mt-2 flex gap-2"
                    >
                        <input
                            autoFocus
                            value={replyBody}
                            onChange={e => setReplyBody(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
                            placeholder="Write a reply..."
                            className="flex-1 text-sm bg-secondary/60 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                            onClick={submitReply}
                            disabled={!replyBody.trim() || submitting}
                            className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
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
                    className="ml-8 mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80"
                >
                    {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newStaged = Array.from(e.target.files).map(f => ({
            id: Math.random().toString(36).substring(7),
            file: f,
            previewUrl: URL.createObjectURL(f)
        }));
        setStagedFiles(prev => [...prev, ...newStaged]);
        if (fileRef.current) fileRef.current.value = '';
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
        fetch(`${API}/api/posts/${postId}/comments?page=0&size=20`)
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
                const uploadRes = await fetch(`${API}/api/images/upload-multiple`, {
                    method: 'POST',
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error('Image upload failed');
                finalUrls = await uploadRes.json();
            }

            // 2. Submit Comment
            const res = await fetch(`${API}/api/posts/${postId}/comments`, {
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
            const res = await fetch(`${API}/api/comments/${commentId}`, {
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
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span>{`Comments (${comments.length})`}</span>
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
                            className="relative z-10 w-full max-w-[700px] h-[90dvh] max-h-[90vh] md:max-h-[85vh] bg-white rounded-t-3xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Header — flex-none: NEVER shrinks or grows under zoom */}
                            <div className="flex-none flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
                                <h2 className="font-extrabold text-lg text-gray-900">Comments</h2>
                                <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all" aria-label="Close comments">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body — flex-1 min-h-0: only tier that flexes */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50/50 overscroll-contain min-h-0 space-y-4">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => <CommentSkeleton key={i} />)}
                                    </div>
                                ) : comments.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50/50">
                                            <MessageCircle className="w-10 h-10 text-green-600" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1">No comments yet</h3>
                                        <p className="text-sm text-gray-500 max-w-[200px]">Be the first to share your thoughts on this story!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
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
                            <div className="flex-none p-3 border-t border-gray-200 bg-white">
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

                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 flex-none rounded-full bg-gradient-to-tr from-green-500 to-green-700 flex items-center justify-center text-white text-[13px] font-bold shadow-sm">
                                                {user?.firstName?.[0] || 'U'}
                                            </div>
                                            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-gray-300 focus-within:bg-white transition-all shadow-inner relative">
                                                <input data-testid="comment-image-input" ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                                                <input
                                                    data-testid="comment-input"
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitComment())}
                                                    placeholder="Add a comment..."
                                                    className="flex-1 bg-transparent text-[15px] font-medium text-gray-900 focus:outline-none placeholder:text-gray-500"
                                                />
                                                <button data-testid="comment-attach-btn" onClick={() => fileRef.current?.click()} className="text-gray-400 hover:text-green-600 transition-colors ml-2" aria-label="Attach photo">
                                                    <ImageIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <button
                                                data-testid="comment-send-btn"
                                                onClick={submitComment}
                                                disabled={(!newComment.trim() && stagedFiles.length === 0) || submitting}
                                                className="w-10 h-10 flex-none rounded-full bg-green-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-green-700 transition-all shadow-md active:scale-95"
                                            >
                                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                            </button>
                                        </div>
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
