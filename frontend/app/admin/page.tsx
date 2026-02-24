'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Users, FileText, Home, Star, TrendingUp, Trash2, CheckCircle, XCircle } from 'lucide-react';
import AdminDataManagement from '@/components/admin/AdminDataManagement';

interface Homestay {
    id: string; name: string; description: string; pricePerNight: number;
    status: string; photoUrls: string[]; ownerEmail: string; featured?: boolean;
}
interface Post {
    id: string; userName: string; locationName: string; textContent: string;
    imageUrls: string[]; createdAt: string;
}
interface Stats {
    totalUsers: number; totalPosts: number; totalHomestays: number;
    pendingHomestays: number; approvedHomestays: number; featuredHomestays: number;
}

type Tab = 'pending' | 'all' | 'community' | 'featured' | 'analytics' | 'data';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
};

export default function AdminPage() {
    const { user, isAuthenticated, isLoading, token } = useAuth() as any;
    const router = useRouter();
    const [pendingHomestays, setPendingHomestays] = useState<Homestay[]>([]);
    const [allHomestays, setAllHomestays] = useState<Homestay[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('pending');
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || user?.role !== 'ROLE_ADMIN') {
                toast.error('Access Denied. Admins only.'); router.push('/'); return;
            }
            fetchData();
        }
    }, [isLoading, isAuthenticated, user, router]);

    const fetchData = async () => {
        try {
            const [pendingRes, allRes, postsRes, statsRes] = await Promise.all([
                api.get('/api/homestays/pending'),
                api.get('/api/homestays/all'),
                api.get('/api/posts'),
                api.get('/api/admin/stats'),
            ]);
            setPendingHomestays(pendingRes.data);
            setAllHomestays(allRes.data);
            setPosts(Array.isArray(postsRes.data) ? postsRes.data : postsRes.data.content ?? []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch admin data', error);
            toast.error('Failed to load admin data');
        } finally { setLoading(false); }
    };

    const handleApprove = async (id: string) => {
        setPendingHomestays(prev => prev.filter(h => h.id !== id));
        setAllHomestays(prev => prev.map(h => h.id === id ? { ...h, status: 'APPROVED' } : h));
        toast.success('Homestay Approved!');
        try { await api.put(`/api/homestays/${id}/approve`); }
        catch { toast.error('Failed to approve'); fetchData(); }
    };

    const handleReject = async (id: string) => {
        setPendingHomestays(prev => prev.filter(h => h.id !== id));
        setAllHomestays(prev => prev.map(h => h.id === id ? { ...h, status: 'REJECTED' } : h));
        toast.success('Homestay Rejected.');
        try { await api.put(`/api/homestays/${id}/reject`); }
        catch { toast.error('Failed to reject'); fetchData(); }
    };

    const handleDeletePost = async (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted.');
        try { await api.delete(`/api/admin/posts/${postId}`); }
        catch { toast.error('Failed to delete post'); fetchData(); }
    };

    const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
        setTogglingId(id);
        const originalState = [...allHomestays];
        setAllHomestays(prev => prev.map(h => h.id === id ? { ...h, featured: !currentFeatured } : h));
        try {
            await api.put(`/api/admin/homestays/${id}/feature`);
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
                const list = activeTab === 'pending' ? pendingHomestays : allHomestays;
                return list.length === 0 ? (
                    <p className="text-muted-foreground">{activeTab === 'pending' ? 'No pending homestays.' : 'No homestays found.'}</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {list.map(h => (
                            <Card key={h.id}>
                                <CardHeader><CardTitle className="text-base">{h.name}</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{h.description}</p>
                                    <p className="text-xs text-muted-foreground mb-2">Owner: {h.ownerEmail}</p>
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
                    {posts.length === 0 && <p className="text-muted-foreground">No posts found.</p>}
                    {posts.map(p => (
                        <Card key={p.id}>
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-semibold">{p.userName}</span>
                                            <span className="text-xs text-muted-foreground">· {p.locationName}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{p.textContent}</p>
                                        {p.imageUrls?.length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                                {p.imageUrls.slice(0, 3).map((url, i) => (
                                                    <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
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
                                    <p className="text-xs text-muted-foreground mb-3">₹{h.pricePerNight}/night · {h.ownerEmail}</p>
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
            {activeTab === 'analytics' && stats && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
                        { label: 'Community Posts', value: stats.totalPosts, icon: FileText, color: 'text-green-500' },
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

            {/* ── Data Management ──────────────────────────────── */}
            {activeTab === 'data' && (
                <AdminDataManagement />
            )}
        </div>
    );
}
