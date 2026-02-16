'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, MapPin, Clock, PenSquare, X } from 'lucide-react';

interface Post {
    id: string;
    userId: string;
    userName: string;
    locationName: string;
    textContent: string;
    imageUrls: string[];
    createdAt: string;
}

export default function CommunityPage() {
    const { isAuthenticated } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ locationName: '', textContent: '', imageUrls: '' });
    const [submitting, setSubmitting] = useState(false);

    // Edit/Delete state
    const [myPostIds, setMyPostIds] = useState<Set<string>>(new Set());
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isEditOpen, setIsEditOpen] = useState(false);

    const matchMyPosts = async (allPosts: Post[]) => {
        if (!isAuthenticated) return;
        try {
            const res = await api.get('/api/posts/my-posts');
            const myIds = new Set<string>(res.data.map((p: Post) => p.id));
            setMyPostIds(myIds);
        } catch (e) { console.error("Failed to fetch my posts", e); }
    };

    const fetchPosts = useCallback(async (query?: string) => {
        try {
            setLoading(true);
            const url = query ? `/api/posts/search?q=${encodeURIComponent(query)}` : '/api/posts';
            const res = await api.get(url);
            setPosts(res.data);
            if (isAuthenticated) await matchMyPosts(res.data);
        } catch (error) {
            console.error('Failed to fetch posts', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPosts(searchQuery);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.locationName.trim() || !formData.textContent.trim()) {
            toast.error('Location and text are required');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                locationName: formData.locationName.trim(),
                textContent: formData.textContent.trim(),
                imageUrls: formData.imageUrls ? formData.imageUrls.split(',').map(u => u.trim()).filter(Boolean) : [],
            };
            const res = await api.post('/api/posts', payload);
            setPosts(prev => [res.data, ...prev]);
            setShowModal(false);
            setFormData({ locationName: '', textContent: '', imageUrls: '' });
            toast.success('Experience shared!');
            if (isAuthenticated) {
                setMyPostIds(prev => new Set(prev).add(res.data.id));
            }
        } catch (error) {
            console.error('Failed to create post', error);
            toast.error('Failed to share your experience');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch { return dateStr; }
    };

    return (
        <div className="container mx-auto px-4 py-24">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">Community Experiences</h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                    Discover real stories from travelers across North Bengal
                </p>
            </div>

            {/* Search + CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="flex-1 w-full flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by location..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            id="community-search"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        />
                    </div>
                    <Button type="submit" variant="outline" id="search-btn">Search</Button>
                </form>
                {isAuthenticated && (
                    <Button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700 whitespace-nowrap" id="share-experience-btn">
                        <PenSquare className="w-4 h-4 mr-2" /> Share Experience
                    </Button>
                )}
            </div>

            {/* Feed */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading posts...</div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">No experiences shared yet. Be the first!</div>
            ) : (
                <div className="max-w-2xl mx-auto space-y-5" id="posts-feed">
                    {posts.map(post => (
                        <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow" data-post-id={post.id}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="font-semibold text-gray-800">{post.userName}</span>
                                        <span>·</span>
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.locationName}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />{formatDate(post.createdAt)}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 leading-relaxed">{post.textContent}</p>
                                {post.imageUrls && post.imageUrls.length > 0 && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto">
                                        {post.imageUrls.map((url, i) => (
                                            <img key={i} src={url} alt="" className="h-40 rounded-lg object-cover" />
                                        ))}
                                    </div>
                                )}
                                {myPostIds.has(post.id) && (
                                    <div className="mt-4 flex justify-end gap-2 border-t pt-2">
                                        <Button variant="ghost" size="sm" onClick={() => {
                                            setEditingPost(post);
                                            setEditContent(post.textContent);
                                            setIsEditOpen(true);
                                        }}>Edit</Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={async () => {
                                            if (!confirm("Delete this post?")) return;
                                            try {
                                                await api.delete(`/api/posts/${post.id}`);
                                                setPosts(prev => prev.filter(p => p.id !== post.id));
                                                toast.success("Post deleted");
                                            } catch (e) { toast.error("Failed to delete"); }
                                        }}>Delete</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {isEditOpen && editingPost && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsEditOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Edit Post</h2>
                        <textarea
                            className="w-full border rounded p-2 mb-4"
                            rows={4}
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={async () => {
                                try {
                                    await api.put(`/api/posts/${editingPost.id}`, { textContent: editContent });
                                    setPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, textContent: editContent } : p));
                                    setIsEditOpen(false);
                                    toast.success("Updated!");
                                } catch (e) { toast.error("Failed to update"); }
                            }}>Save</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-bold">Share Your Experience</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="post-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    id="post-location"
                                    type="text"
                                    placeholder="e.g. Tinchuley, Darjeeling..."
                                    value={formData.locationName}
                                    onChange={e => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="post-text" className="block text-sm font-medium text-gray-700 mb-1">Your Story</label>
                                <textarea
                                    id="post-text"
                                    rows={4}
                                    placeholder="Tell us about your experience..."
                                    value={formData.textContent}
                                    onChange={e => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="post-images" className="block text-sm font-medium text-gray-700 mb-1">Image URLs (comma-separated, optional)</label>
                                <input
                                    id="post-images"
                                    type="text"
                                    placeholder="https://..."
                                    value={formData.imageUrls}
                                    onChange={e => setFormData(prev => ({ ...prev, imageUrls: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting} id="submit-post-btn">
                                    {submitting ? 'Sharing...' : 'Share'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
