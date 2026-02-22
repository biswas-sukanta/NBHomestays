'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface CommentAuthor { id: string; firstName?: string; lastName?: string; avatarUrl?: string; }
interface Comment {
    id: string;
    body: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    createdAt: string;
    replies?: Comment[];
    replyCount?: number;
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

interface SingleCommentProps {
    comment: Comment;
    postId: string;
    depth?: number;
    onDelete: (id: string) => void;
    currentUserId?: string;
    token?: string;
}

function SingleComment({ comment, postId, depth = 0, onDelete, currentUserId, token }: SingleCommentProps) {
    const [showReplies, setShowReplies] = useState(false);
    const [replying, setReplying] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies || []);
    const [submitting, setSubmitting] = useState(false);

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

    const isOwner = currentUserId === comment.authorId;
    const totalReplies = localReplies.length;

    return (
        <div className={cn('group', depth > 0 && 'ml-8 mt-3 pl-3 border-l-2 border-border/50')}>
            <div className="flex gap-2.5">
                <Initials name={comment.authorName} />
                <div className="flex-1 min-w-0">
                    {/* Bubble */}
                    <div className="bg-secondary/60 rounded-xl px-3 py-2.5 text-sm">
                        <span className="font-semibold text-foreground text-xs mr-1.5">{comment.authorName}</span>
                        <span className="text-foreground leading-relaxed">{comment.body}</span>
                    </div>
                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-1 px-1">
                        <span className="text-[11px] text-muted-foreground">{formatTime(comment.createdAt)}</span>
                        {depth === 0 && (
                            <button
                                onClick={() => setReplying(r => !r)}
                                className="text-[11px] font-semibold text-primary hover:text-primary/80"
                            >Reply</button>
                        )}
                        {isOwner && (
                            <button
                                onClick={() => onDelete(comment.id)}
                                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                                aria-label="Delete comment"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
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
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

// ── Public API ────────────────────────────────────────────────
export function CommentsSection({ postId }: { postId: string }) {
    const { isAuthenticated, user } = useAuth() as any;
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwtToken') : null;
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
        fetch(`${API}/api/posts/${postId}/comments?page=0&size=20`)
            .then(r => r.json())
            .then(data => setComments(data.content ?? data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [postId, open]);

    const submitComment = async () => {
        if (!newComment.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ body: newComment.trim() }),
            });
            if (res.ok) {
                const c: Comment = await res.json();
                setComments(prev => [...prev, c]);
                setNewComment('');
            }
        } finally { setSubmitting(false); }
    };

    const deleteComment = async (commentId: string) => {
        try {
            await fetch(`${API}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (e) { console.error(e); }
    };

    return (
        <div className="mt-2">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
                <MessageCircle className="w-4 h-4" />
                <span>{open ? 'Hide comments' : `Comments (${comments.length})`}</span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-4"
                    >
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2].map(i => <div key={i} className="h-10 rounded-xl skeleton-shimmer" />)}
                            </div>
                        ) : (
                            comments.map(c => (
                                <SingleComment
                                    key={c.id}
                                    comment={c}
                                    postId={postId}
                                    onDelete={deleteComment}
                                    currentUserId={user?.id}
                                    token={token || undefined}
                                />
                            ))
                        )}

                        {/* New comment input */}
                        {isAuthenticated && (
                            <div className="flex gap-2 pt-2">
                                <input
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitComment()}
                                    placeholder="Add a comment..."
                                    className="flex-1 text-sm bg-secondary/60 border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                                <button
                                    onClick={submitComment}
                                    disabled={!newComment.trim() || submitting}
                                    className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
                                    aria-label="Post comment"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {!isAuthenticated && (
                            <p className="text-xs text-muted-foreground text-center py-1">
                                <a href="/login" className="text-primary font-semibold hover:underline">Login</a> to join the conversation
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
