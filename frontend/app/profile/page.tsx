'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api/users';
import { postApi } from '@/lib/api/posts';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/optimized-image';

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
    id: string; name: string; pricePerNight: number; media?: { url: string; fileId?: string }[]; vibeScore?: number;
}

const FALLBACK = '/images/hero_background.jpg';

const TABS = [
    { key: 'boards', label: 'Trip Boards', icon: Heart },
    { key: 'posts', label: 'My Stories', icon: FileText },
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
                        <Link href={`/homestays/${item.id}`} className="block relative aspect-video">
                            <OptimizedImage
                                src={item.imageUrl || FALLBACK}
                                alt={item.name}
                                width={400}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {typeof item.pricePerNight === 'number'
                                    ? <>₹{item.pricePerNight.toLocaleString()} / night</>
                                    : 'Contact host for price'}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ── My Posts Tab ──────────────────────────────────────────────
function MyPostsTab() {
    const { data, isPending, isError } = useQuery({
        queryKey: ['my-posts'],
        queryFn: async () => {
            const res = await postApi.getMyPosts();
            return res.data;
        }
    });

    if (isPending) return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl skeleton-shimmer" />)}</div>;
    if (isError) return <div className="py-20 text-center text-red-500 font-medium">Failed to load posts. Please try again.</div>;

    // Safe extraction
    const posts = data?.pages ? data.pages.flatMap((p: any) => p.content || p.data || []) : (data?.content || data || []);

    if (posts.length === 0) return <p className="text-center py-20 text-muted-foreground font-medium">You haven't shared any stories yet. <Link href="/community" className="text-green-600 font-bold hover:underline">Share your experience →</Link></p>;

    return (

        <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((post: Post) => (
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
    const [pending, setPending] = useState<string | null>(null);
    
    const updateField = async (field: string, value: any) => {
        setPending(field);
        try {
            await userApi.updateProfile({ [field]: value });
            toast.success('Profile updated!');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setPending(null);
        }
    };
    
    return (
        <div className="max-w-md space-y-6">
            {/* Display Name */}
            <div className="bg-secondary/40 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Display Name</h3>
                <input
                    type="text"
                    placeholder="How should we call you?"
                    defaultValue={user?.displayName || ''}
                    className="w-full bg-white border border-border/50 rounded-lg px-3 py-2 text-sm"
                    onBlur={(e) => updateField('displayName', e.target.value)}
                    disabled={pending === 'displayName'}
                />
            </div>
            
            {/* Location */}
            <div className="bg-secondary/40 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Location</h3>
                <input
                    type="text"
                    placeholder="Where are you based?"
                    defaultValue={user?.location || ''}
                    className="w-full bg-white border border-border/50 rounded-lg px-3 py-2 text-sm"
                    onBlur={(e) => updateField('location', e.target.value)}
                    disabled={pending === 'location'}
                />
            </div>
            
            {/* Bio */}
            <div className="bg-secondary/40 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Public Bio</h3>
                <Textarea
                    placeholder="Tell the community about yourself..."
                    defaultValue={user?.bio}
                    className="bg-white border-border/50 text-sm italic"
                    onBlur={(e) => updateField('bio', e.target.value)}
                    disabled={pending === 'bio'}
                />
            </div>
            
            {/* Traveller Type */}
            <div className="bg-secondary/40 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-sm text-foreground">Traveller Type</h3>
                <select
                    defaultValue={user?.travellerType || ''}
                    className="w-full bg-white border border-border/50 rounded-lg px-3 py-2 text-sm"
                    onChange={(e) => updateField('travellerType', e.target.value || null)}
                    disabled={pending === 'travellerType'}
                >
                    <option value="">Select your travel style</option>
                    <option value="SOLO">Solo Traveller</option>
                    <option value="COUPLE">Couple</option>
                    <option value="FAMILY">Family</option>
                    <option value="GROUP">Group</option>
                    <option value="BUSINESS">Business</option>
                    <option value="DIGITAL_NOMAD">Digital Nomad</option>
                    <option value="BACKPACKER">Backpacker</option>
                    <option value="LUXURY">Luxury</option>
                </select>
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
    const { isAuthenticated, isLoading, user, logout } = useAuth() as any;
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabKey>('boards');

    useEffect(() => {
        // Only redirect after loading is complete and user is not authenticated
        if (!isLoading && !isAuthenticated) router.replace('/login');
    }, [isLoading, isAuthenticated]);

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

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
