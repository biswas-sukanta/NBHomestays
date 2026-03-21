'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/api/adminApi';
import { homestayApi } from '@/lib/api/homestays';
import { postApi } from '@/lib/api/posts';
import { axiosInstance as api } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, FileText, Home, Star, TrendingUp, Trash2, CheckCircle, XCircle } from 'lucide-react';
import AdminDataManagement from '@/components/admin/AdminDataManagement';

interface Homestay {
    id: string; name: string; description: string; pricePerNight: number;
    status: string; media?: { url: string; fileId?: string }[]; featured?: boolean;
    host?: { name?: string | null };
}
interface Post {
    id: string; userName: string; locationName: string; textContent: string;
    media?: { url: string; fileId?: string }[]; createdAt: string;
}
interface Stats {
    totalUsers: number; totalPosts: number; totalHomestays: number;
    pendingHomestays: number; approvedHomestays: number; featuredHomestays: number;
}

type Tab = 'pending' | 'all' | 'community' | 'featured' | 'analytics' | 'data';

const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function AdminPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [pendingHomestays, setPendingHomestays] = useState<Homestay[]>([]);
    const [allHomestays, setAllHomestays] = useState<Homestay[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('pending');
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    
    // Per-tab error states for graceful degradation
    const [errors, setErrors] = useState<{
        pending?: string;
        all?: string;
        community?: string;
        stats?: string;
    }>({});

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || user?.role !== 'ROLE_ADMIN') {
                toast.error('Access Denied. Admins only.'); router.push('/'); return;
            }
            fetchData();
        }
    }, [isLoading, isAuthenticated, user, router]);

    const fetchData = async () => {
        setLoading(true);
        setErrors({});
        
        // Use Promise.allSettled for resilient fetching - each tab handles its own failure
        const results = await Promise.allSettled([
            homestayApi.getPending(),
            api.get('/admin/homestays/all'),
            postApi.getFeed('size=100'),
            adminApi.getStats(),
        ]);
        
        // Process pending homestays
        if (results[0].status === 'fulfilled') {
            const res = results[0].value;
            setPendingHomestays(res.data.content ? res.data.content : res.data);
        } else {
            console.error('Failed to fetch pending homestays:', results[0].reason);
            setErrors(prev => ({ ...prev, pending: 'Failed to load pending listings' }));
        }
        
        // Process all homestays
        if (results[1].status === 'fulfilled') {
            const res = results[1].value;
            setAllHomestays(res.data.content ? res.data.content : res.data);
        } else {
            console.error('Failed to fetch all homestays:', results[1].reason);
            setErrors(prev => ({ ...prev, all: 'Failed to load all listings' }));
        }
        
        // Process posts (community tab)
        if (results[2].status === 'fulfilled') {
            const res = results[2].value;
            // Handle both paginated and direct array responses
            const postsData = res.data?.posts ?? res.data?.content ?? (Array.isArray(res.data) ? res.data : []);
            setPosts(postsData);
        } else {
            console.error('Failed to fetch posts:', results[2].reason);
            setErrors(prev => ({ ...prev, community: 'Failed to load community posts' }));
        }
        
        // Process stats (analytics tab)
        if (results[3].status === 'fulfilled') {
            setStats(results[3].value.data);
        } else {
            console.error('Failed to fetch stats:', results[3].reason);
            setErrors(prev => ({ ...prev, stats: 'Failed to load analytics' }));
        }
        
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        setPendingHomestays(prev => prev.filter(h => h.id !== id));
        setAllHomestays(prev => prev.map(h => h.id === id ? { ...h, status: 'APPROVED' } : h));
        toast.success('Homestay Approved!');
        try { await homestayApi.approve(id); }
        catch { toast.error('Failed to approve'); fetchData(); }
    };

    const handleReject = async (id: string) => {
        setPendingHomestays(prev => prev.filter(h => h.id !== id));
        setAllHomestays(prev => prev.map(h => h.id === id ? { ...h, status: 'REJECTED' } : h));
        toast.success('Homestay Rejected.');
        try { await homestayApi.reject(id); }
        catch { toast.error('Failed to reject'); fetchData(); }
    };

    const handleDeletePost = async (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted.');
        try { await adminApi.deletePost(postId); }
        catch { toast.error('Failed to delete post'); fetchData(); }
    };

    const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
        setTogglingId(id);
        const originalState = [...allHomestays];
        setAllHomestays(prev => prev.map(h => h.id === id ? { ...h, featured: !currentFeatured } : h));
        try {
            await adminApi.featureHomestay(id);
            toast.success(currentFeatured ? 'Removed from featured.' : 'Added to featured! ⭐');
        } catch {
            toast.error('Failed to toggle featured');
            setAllHomestays(originalState);
        } finally {
            setTogglingId(null);
        }
    };

    if (isLoading || loading) return <div className="p-8 text-center">Loading Admin Dashboard...</div>;

    const TABS: { key: Tab; label: string; count?: number }[] = [
        { key: 'pending', label: 'Pending', count: pendingHomestays.length },
        { key: 'all', label: 'All Listings', count: allHomestays.length },
        { key: 'community', label: 'Community', count: posts.length },
        { key: 'featured', label: 'Featured' },
        { key: 'analytics', label: 'Analytics' },
        { key: 'data', label: 'Data Management' },
    ];

    return (
        <div className="container mx-auto p-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 mb-6 border-b border-border">
                {TABS.map(({ key, label, count }) => (
                    <button key={key} onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        {label}{count !== undefined ? ` (${count})` : ''}
                    </button>
                ))}
            </div>

            {/* ── Pending / All Listings ─────────────────────────── */}
            {(activeTab === 'pending' || activeTab === 'all') && (() => {
                const error = activeTab === 'pending' ? errors.pending : errors.all;
                const list = activeTab === 'pending' ? pendingHomestays : allHomestays;
                
                if (error) {
                    return (
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="pt-4">
                                <p className="text-red-600 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" /> {error}
                                </p>
                                <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>Retry</Button>
                            </CardContent>
                        </Card>
                    );
                }
                
                return list.length === 0 ? (
                    <p className="text-muted-foreground">{activeTab === 'pending' ? 'No pending homestays.' : 'No homestays found.'}</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {list.map(h => (
                            <Card key={h.id}>
                                <CardHeader><CardTitle className="text-base">{h.name}</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{h.description}</p>
                                    <p className="text-xs text-muted-foreground mb-2">Owner: {h.host?.name || 'Unknown host'}</p>
                                    <p className="font-bold mb-4">₹{h.pricePerNight}/night</p>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs px-2 py-1 rounded ${statusColor[h.status] || 'bg-gray-100 text-gray-800'}`}>{h.status}</span>
                                        {h.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button variant="destructive" size="sm" onClick={() => handleReject(h.id)}>Reject</Button>
                                                <Button size="sm" onClick={() => handleApprove(h.id)}>Approve</Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            })()}

            {/* ── Community Moderation ─────────────────────────── */}
            {activeTab === 'community' && (
                <div className="space-y-4">
                    {errors.community && (
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="pt-4">
                                <p className="text-red-600 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" /> {errors.community}
                                </p>
                                <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>Retry</Button>
                            </CardContent>
                        </Card>
                    )}
                    {!errors.community && posts.length === 0 && <p className="text-muted-foreground">No posts found.</p>}
                    {!errors.community && posts.map(p => (
                        <Card key={p.id}>
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold">{p.userName}</span>
                                            <span className="text-xs text-muted-foreground">· {p.locationName}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{p.textContent}</p>
                                        {p.media && p.media.length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                                {p.media.slice(0, 3).map((m, i) => (
                                                    <Image key={i} src={m.url} alt="" width={64} height={64} className="w-16 h-16 object-cover rounded-lg" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => handleDeletePost(p.id)}
                                        className="flex-none text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                        aria-label="Delete post">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Featured Homestays ────────────────────────────── */}
            {activeTab === 'featured' && (
                <div>
                    <p className="text-sm text-muted-foreground mb-4">Toggle featured status for any approved homestay. Featured stays appear prominently on the homepage.</p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {allHomestays.filter(h => h.status === 'APPROVED').map(h => (
                            <Card key={h.id} className={h.featured ? 'ring-2 ring-yellow-400' : ''}>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2">{h.name}{h.featured && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground mb-3">₹{h.pricePerNight}/night · {h.host?.name || 'Unknown host'}</p>
                                    <Button size="sm" variant={h.featured ? 'destructive' : 'default'}
                                        onClick={() => handleToggleFeatured(h.id, !!h.featured)}
                                        className="w-full"
                                        disabled={togglingId === h.id}>
                                        {togglingId === h.id ? 'Saving...' : h.featured ? 'Remove from Featured' : '⭐ Feature this Stay'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Analytics ────────────────────────────────────── */}
            {activeTab === 'analytics' && (
                <div className="space-y-4">
                    {errors.stats && (
                        <Card className="bg-red-50 border-red-200">
                            <CardContent className="pt-4">
                                <p className="text-red-600 flex items-center gap-2">
                                    <XCircle className="w-4 h-4" /> {errors.stats}
                                </p>
                                <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>Retry</Button>
                            </CardContent>
                        </Card>
                    )}
                    {!errors.stats && stats && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
                                { label: 'Community Stories', value: stats.totalPosts, icon: FileText, color: 'text-green-500' },
                                { label: 'Total Homestays', value: stats.totalHomestays, icon: Home, color: 'text-purple-500' },
                                { label: 'Pending Review', value: stats.pendingHomestays, icon: TrendingUp, color: 'text-yellow-500' },
                                { label: 'Approved Stays', value: stats.approvedHomestays, icon: CheckCircle, color: 'text-emerald-500' },
                                { label: 'Featured Stays', value: stats.featuredHomestays, icon: Star, color: 'text-orange-500' },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <Card key={label}>
                                    <CardContent className="flex items-center gap-4 pt-6">
                                        <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center ${color}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
                                            <p className="text-sm text-muted-foreground">{label}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Data Management ──────────────────────────────── */}
            {activeTab === 'data' && (
                <AdminDataManagement />
            )}
        </div>
    );
}
