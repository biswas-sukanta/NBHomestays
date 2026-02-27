'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
import { Heart, FileText, Settings, Pencil, Trash2, MapPin, Star, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useTripBoard } from '@/store/useTripBoard';
import { SharedPageBanner } from '@/components/shared-page-banner';

// ── Types ─────────────────────────────────────────────────────
interface Post {
    id: string; textContent: string; locationName: string; createdAt: string;
}
interface SavedHomestay {
    id: string; name: string; pricePerNight: number; photoUrls?: string[]; vibeScore?: number;
}

const FALLBACK = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80';

const TABS = [
    { key: 'boards', label: 'Trip Boards', icon: Heart },
    { key: 'posts', label: 'My Posts', icon: FileText },
    { key: 'settings', label: 'Settings', icon: Settings },
] as const;
type TabKey = typeof TABS[number]['key'];

// ── Trip Boards Tab ───────────────────────────────────────────
function TripBoardsTab() {
    const { items, remove } = useTripBoard();
    const shareUrl = typeof window !== 'undefined' && items.length > 0
        ? `${window.location.origin}/search?ids=${items.map(i => i.id).join(',')}`
        : null;

    if (items.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="text-5xl mb-4">💔</div>
                <p className="text-muted-foreground font-medium">No saved stays yet.</p>
                <Link href="/search" className="mt-4 inline-block px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Explore Stays
                </Link>
            </div>
        );
    }

    return (
        <div>
            {shareUrl && (
                <div className="mb-5 flex items-center justify-between gap-3 bg-secondary/50 rounded-xl px-4 py-3">
                    <span className="text-sm text-muted-foreground truncate">{shareUrl}</span>
                    <button
                        onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }}
                        className="flex-none text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >Copy link</button>
                </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map(item => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                        <Link href={`/homestays/${item.id}`}>
                            <img
                                src={item.imageUrl || FALLBACK}
                                alt={item.name}
                                className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </Link>
                        <button
                            onClick={() => remove(item.id)}
                            className="absolute top-2 right-2 w-7 h-7 glass rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600"
                            aria-label="Remove from board"
                        >
                            <Heart className="w-3.5 h-3.5 fill-rose-500" />
                        </button>
                        <div className="p-3">
                            <h3 className="font-semibold text-sm text-foreground line-clamp-1">{item.name}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">₹{item.pricePerNight.toLocaleString()} / night</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ── My Posts Tab ──────────────────────────────────────────────
function MyPostsTab() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/posts/my-posts')
            .then(r => setPosts(r.data))
            .catch(() => toast.error('Failed to load posts'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />)}</div>;
    if (posts.length === 0) return <p className="text-center py-20 text-muted-foreground font-medium">You haven't posted anything yet. <Link href="/community" className="text-green-600 font-bold hover:underline">Share your experience →</Link></p>;

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {posts.map(post => (
                <div key={post.id}>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="group bg-card border border-border/80 hover:border-green-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all h-full flex flex-col"
                    >
                        <div className="flex items-center gap-2 text-xs font-semibold text-green-700/80 uppercase tracking-wider mb-2">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">{post.locationName}</span>
                            <span className="mx-1 text-gray-300">•</span>
                            <span className="text-gray-500 font-medium">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-3 group-hover:text-green-900 transition-colors">
                            &quot;{post.textContent}&quot;
                        </p>
                    </motion.div>
                </div>
            ))}
        </div>
    );
}

// ── Settings Tab ──────────────────────────────────────────────
function SettingsTab() {
    const { user, logout } = useAuth() as any;
    return (
        <div className="max-w-md space-y-6">
            <div className="bg-secondary/40 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Public Bio</h3>
                <Textarea
                    placeholder="Tell the community about yourself..."
                    defaultValue={user?.bio}
                    className="bg-white border-border/50 text-sm italic"
                    onBlur={(e) => {
                        api.put('/api/users/profile', { bio: e.target.value })
                            .then(() => toast.success('Bio updated!'))
                            .catch(() => toast.error('Failed to update bio'));
                    }}
                />
            </div>
            <Button
                variant="destructive"
                className="w-full"
                onClick={logout}
            >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
        </div>
    );
}

// ── Main Profile Page ──────────────────────────────────────────
export default function ProfilePage() {
    const { isAuthenticated, user, logout } = useAuth() as any;
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>('boards');

    useEffect(() => {
        if (!isAuthenticated) router.replace('/login');
    }, [isAuthenticated]);

    if (!isAuthenticated) return null;

    const initials = [user?.firstName, user?.lastName]
        .filter(Boolean).map((n: string) => n[0]).join('').toUpperCase() || 'U';

    return (
        <div className="min-h-screen bg-background">
            {/* Profile header */}
            <SharedPageBanner
                title={`${user?.firstName} ${user?.lastName}`}
                subtitle={
                    <>
                        <p className="text-white/80 text-lg leading-snug">{user?.email}</p>
                        <span className="mt-2 inline-block text-xs font-bold uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full border border-white/10 shadow-sm">
                            {user?.role?.replace('ROLE_', '')}
                        </span>
                    </>
                }
            />

            {/* Tab bar */}
            <div className="border-b border-border bg-background sticky top-[68px] z-30">
                <div className="container mx-auto max-w-3xl px-4">
                    <div className="flex">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors
                                    ${activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="container mx-auto max-w-3xl px-4 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'boards' && <TripBoardsTab />}
                        {activeTab === 'posts' && <MyPostsTab />}
                        {activeTab === 'settings' && <SettingsTab />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
