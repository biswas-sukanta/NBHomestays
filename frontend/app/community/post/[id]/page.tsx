'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Heart, MessageCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CommentsSection } from '@/components/comments-section';
import { cn } from '@/lib/utils';

interface Post {
    id: string;
    user: { id: string; firstName: string; lastName: string; avatarUrl?: string };
    locationName: string;
    textContent: string;
    imageUrls: string[];
    createdAt: string;
    likeCount?: number;
    commentCount?: number;
    isLiked?: boolean;
    homestayId?: string;
    homestayName?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function formatRelative(isoDate: string) {
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function BlurImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className={cn('relative overflow-hidden', className)}>
            <img src={src} alt={alt} className={cn('absolute inset-0 w-full h-full object-cover scale-110 blur-xl filter transition-opacity duration-700', loaded ? 'opacity-0' : 'opacity-100')} aria-hidden="true" />
            <img src={src} alt={alt} onLoad={() => setLoaded(true)} className={cn('relative w-full h-full object-cover transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0')} />
        </div>
    );
}

export default function PostDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const { isAuthenticated, getToken } = useAuth() as any;
    const [post, setPost] = useState<Post | null>(null);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const res = await fetch(`${API}/api/posts/${id}`);
                if (!res.ok) throw new Error('Not found');
                const data = await res.json();
                setPost(data);
                setLiked(data.isLiked ?? false);
                setLikeCount(data.likeCount ?? 0);
            } catch {
                // Post not found
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const toggleLike = async () => {
        if (!isAuthenticated) return;
        const prev = { liked, likeCount };
        setLiked(!liked);
        setLikeCount(c => liked ? c - 1 : c + 1);
        try {
            const token = typeof getToken === 'function' ? getToken() : null;
            await fetch(`${API}/api/posts/${id}/like`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        } catch {
            setLiked(prev.liked); setLikeCount(prev.likeCount);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
    );

    if (!post) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            <p className="text-muted-foreground text-lg">Post not found</p>
            <button onClick={() => router.push('/community')} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold">Back to Community</button>
        </div>
    );

    const authorName = [post.user?.firstName, post.user?.lastName].filter(Boolean).join(' ') || 'Traveller';
    const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="min-h-screen bg-background">
            {/* Sticky top nav */}
            <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="container mx-auto max-w-2xl flex items-center gap-3 px-4 py-3">
                    <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Go back">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-foreground">Post</span>
                </div>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6">
                {/* Post content */}
                <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden mb-6 shadow-sm">
                    {/* Images */}
                    {post.imageUrls?.length > 0 && (
                        <div className={cn('grid gap-0.5', post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                            {post.imageUrls.slice(0, 4).map((url, i) => (
                                <BlurImage key={i} src={url} alt={`Post image ${i + 1}`}
                                    className={cn(post.imageUrls.length === 1 ? 'h-80' : 'h-52', i === 0 && post.imageUrls.length >= 3 ? 'col-span-2 h-64' : '')} />
                            ))}
                        </div>
                    )}

                    <div className="p-5">
                        {/* Author */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-none">
                                {post.user?.avatarUrl ? <img src={post.user.avatarUrl} alt={authorName} className="w-full h-full rounded-full object-cover" /> : initials}
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-foreground leading-none">{authorName}</p>
                                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 flex-none" />
                                    <span>{post.locationName}</span>
                                    <span className="mx-1">·</span>
                                    <span>{formatRelative(post.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Text */}
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-4">{post.textContent}</p>

                        {/* Tagged homestay */}
                        {post.homestayName && (
                            <a href={`/homestays/${post.homestayId}`} className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-semibold mb-4 hover:bg-primary/20 transition-colors">
                                🏡 {post.homestayName}
                            </a>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-5 pt-4 border-t border-border/50">
                            <button onClick={toggleLike} className={cn('flex items-center gap-1.5 text-sm font-semibold transition-colors', liked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-400')}>
                                <Heart className={cn('w-5 h-5', liked ? 'fill-rose-500 stroke-rose-500' : '')} />
                                <span>{likeCount}</span>
                            </button>
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                                <MessageCircle className="w-5 h-5" />
                                <span>{post.commentCount ?? 0} comments</span>
                            </div>
                        </div>
                    </div>
                </motion.article>

                {/* Threaded Comments  */}
                <CommentsSection postId={id} />
            </div>
        </div>
    );
}
