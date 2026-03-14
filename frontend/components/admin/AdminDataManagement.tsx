'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, DatabaseZap, Loader2, Home, MessageSquare } from 'lucide-react';
import { adminApi } from '@/lib/api/adminApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WipeResult {
    postsDeleted: number;
    mediaFilesDeleted: number;
    mediaFilesFailed: number;
    likesDeleted: number;
}

interface BatchWipeResult {
    deletedCount: number;
    hasMore: boolean;
    mediaFilesDeleted: number;
    mediaFilesFailed: number;
}

export default function AdminDataManagement() {
    // Homestay States
    const [homestayDeleteCount, setHomestayDeleteCount] = useState<number | ''>('');
    const [homestaySeedCount, setHomestaySeedCount] = useState<number | ''>('');
    const [isDeletingHomestays, setIsDeletingHomestays] = useState(false);
    const [isDeletingAllHomestays, setIsDeletingAllHomestays] = useState(false);
    const [isSeedingHomestays, setIsSeedingHomestays] = useState(false);

    // Post States
    const [postDeleteCount, setPostDeleteCount] = useState<number | ''>('');
    const [postSeedCount, setPostSeedCount] = useState<number | ''>('');
    const [isDeletingPosts, setIsDeletingPosts] = useState(false);
    const [isDeletingAllPosts, setIsDeletingAllPosts] = useState(false);
    const [isSeedingPosts, setIsSeedingPosts] = useState(false);

    // Batch wipe progress state
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
    const [batchWipeSummary, setBatchWipeSummary] = useState<{ posts: number; media: number; failed: number } | null>(null);

    // Confirmation Modal State
    const [showHomestayWipeModal, setShowHomestayWipeModal] = useState(false);
    const [showPostWipeModal, setShowPostWipeModal] = useState(false);
    const [wipeResult, setWipeResult] = useState<WipeResult | null>(null);

    // ═══════════════════════════════════════════════════════════════════════════
    // HOMESTAY HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleDeleteHomestaysSpecific = async () => {
        if (!homestayDeleteCount || homestayDeleteCount <= 0) {
            toast.error('Please enter a valid number to delete.');
            return;
        }
        setIsDeletingHomestays(true);
        try {
            const res = await adminApi.deleteHomestaysLimit(homestayDeleteCount);
            if (res.status === 200) {
                toast.success(`Successfully deleted ${res.data.deletedCount} homestays!`);
                setHomestayDeleteCount('');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete homestays.');
        } finally {
            setIsDeletingHomestays(false);
        }
    };

    const handleDeleteAllHomestays = async () => {
        setIsDeletingAllHomestays(true);
        setShowHomestayWipeModal(false);
        try {
            const res = await adminApi.deleteAllHomestays();
            if (res.status === 200) {
                toast.success('All homestays deleted successfully.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete all homestays.');
        } finally {
            setIsDeletingAllHomestays(false);
        }
    };

    const handleSeedHomestays = async () => {
        if (!homestaySeedCount || homestaySeedCount <= 0) {
            toast.error('Please enter a valid number of homestays to generate.');
            return;
        }
        setIsSeedingHomestays(true);
        try {
            const res = await adminApi.seedHomestays(homestaySeedCount);
            if (res.status === 200) {
                toast.success(`Successfully generated ${res.data.insertedCount} homestays!`);
                setHomestaySeedCount('');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate homestays.');
        } finally {
            setIsSeedingHomestays(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // POST HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleDeletePostsSpecific = async () => {
        if (!postDeleteCount || postDeleteCount <= 0) {
            toast.error('Please enter a valid number to delete.');
            return;
        }
        setIsDeletingPosts(true);
        try {
            let totalDeleted = 0;
            let remaining = postDeleteCount;
            
            while (remaining > 0) {
                const batchLimit = Math.min(remaining, 100);
                const res = await adminApi.wipePostsBatch(batchLimit);
                if (res.status === 200) {
                    totalDeleted += res.data.deletedCount;
                    remaining -= res.data.deletedCount;
                    if (!res.data.hasMore || res.data.deletedCount === 0) break;
                }
            }
            
            toast.success(`Successfully deleted ${totalDeleted} posts!`);
            setPostDeleteCount('');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete posts.');
        } finally {
            setIsDeletingPosts(false);
        }
    };

    const handleDeleteAllPosts = async () => {
        setIsDeletingAllPosts(true);
        setShowPostWipeModal(false);
        try {
            const res = await adminApi.wipeAllPosts();
            if (res.status === 200) {
                setWipeResult(res.data);
                toast.success('All posts deleted successfully.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete all posts.');
        } finally {
            setIsDeletingAllPosts(false);
        }
    };

    const handleSeedPosts = async () => {
        if (!postSeedCount || postSeedCount <= 0) {
            toast.error('Please enter a valid number of posts to generate.');
            return;
        }
        setIsSeedingPosts(true);
        try {
            const res = await adminApi.seedPosts(postSeedCount);
            if (res.status === 200) {
                toast.success(`Successfully generated ${res.data.insertedCount} community posts!`);
                setPostSeedCount('');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate posts.');
        } finally {
            setIsSeedingPosts(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                    <DatabaseZap className="w-6 h-6 text-primary" /> Data Management
                </h2>
                <p className="text-muted-foreground">Perform bulk data operations directly on the database. Proceed with caution.</p>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                HOMESTAY MANAGEMENT SECTION
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <Home className="w-5 h-5 text-primary" />
                    <span>Homestay Management</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CARD 1: Purge Specific Homestays */}
                    <Card className="bg-white border-gray-200 shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-gray-500" /> Purge Specific
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-4">Delete a specific number of homestay records from the system.</p>
                                <Input
                                    type="number"
                                    placeholder="e.g., 5"
                                    min={1}
                                    value={homestayDeleteCount}
                                    onChange={(e) => setHomestayDeleteCount(parseInt(e.target.value) || '')}
                                    disabled={isDeletingHomestays}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-red-500 text-red-600 hover:bg-red-50"
                                onClick={handleDeleteHomestaysSpecific}
                                disabled={isDeletingHomestays}
                            >
                                {isDeletingHomestays ? 'Deleting...' : `Delete ${homestayDeleteCount || 'X'} Homestays`}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* CARD 2: Purge All Homestays */}
                    <Card className="bg-white border-red-100 shadow-sm flex flex-col ring-1 ring-red-100">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-5 h-5" /> Purge All
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                            <p className="text-sm text-red-800/80">WARNING: This will permanently delete every single homestay record in the database.</p>
                            <Button
                                variant="destructive"
                                className="w-full bg-red-600 hover:bg-red-700 font-bold"
                                onClick={() => setShowHomestayWipeModal(true)}
                                disabled={isDeletingAllHomestays}
                            >
                                {isDeletingAllHomestays ? 'Wiping...' : 'Delete All Homestays'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* CARD 3: Seed Homestays */}
                    <Card className="bg-white border-gray-200 shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                                <DatabaseZap className="w-5 h-5" /> Seed Realistic Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-4">Generate hyper-realistic homestays distributed across North Bengal.</p>
                                <Input
                                    type="number"
                                    placeholder="e.g., 10"
                                    min={1}
                                    value={homestaySeedCount}
                                    onChange={(e) => setHomestaySeedCount(parseInt(e.target.value) || '')}
                                    disabled={isSeedingHomestays}
                                />
                            </div>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                                onClick={handleSeedHomestays}
                                disabled={isSeedingHomestays}
                            >
                                {isSeedingHomestays ? 'Generating...' : `Generate Homestays`}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                COMMUNITY POST MANAGEMENT SECTION
            ═══════════════════════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>Community Post Management</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CARD 1: Purge Specific Posts */}
                    <Card className="bg-white border-gray-200 shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-gray-500" /> Purge Specific
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-4">Delete a specific number of community posts from the system.</p>
                                <Input
                                    type="number"
                                    placeholder="e.g., 10"
                                    min={1}
                                    value={postDeleteCount}
                                    onChange={(e) => setPostDeleteCount(parseInt(e.target.value) || '')}
                                    disabled={isDeletingPosts}
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="w-full border-red-500 text-red-600 hover:bg-red-50"
                                onClick={handleDeletePostsSpecific}
                                disabled={isDeletingPosts}
                            >
                                {isDeletingPosts ? 'Deleting...' : `Delete ${postDeleteCount || 'X'} Posts`}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* CARD 2: Purge All Posts */}
                    <Card className="bg-white border-orange-100 shadow-sm flex flex-col ring-1 ring-orange-100">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                                <AlertTriangle className="w-5 h-5" /> Purge All
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                            <p className="text-sm text-orange-800/80">DEEP CLEAN: Deletes ALL posts, comments, likes, and media files. This is irreversible.</p>
                            <Button
                                variant="destructive"
                                className="w-full bg-orange-600 hover:bg-orange-700 font-bold"
                                onClick={() => setShowPostWipeModal(true)}
                                disabled={isDeletingAllPosts}
                            >
                                {isDeletingAllPosts ? 'Wiping...' : 'Delete All Posts'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* CARD 3: Seed Posts */}
                    <Card className="bg-white border-gray-200 shadow-sm flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                                <DatabaseZap className="w-5 h-5" /> Seed Realistic Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-4">Generate hyper-realistic posts with comments, tags, and media.</p>
                                <Input
                                    type="number"
                                    placeholder="e.g., 10"
                                    min={1}
                                    value={postSeedCount}
                                    onChange={(e) => setPostSeedCount(parseInt(e.target.value) || '')}
                                    disabled={isSeedingPosts}
                                />
                            </div>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                                onClick={handleSeedPosts}
                                disabled={isSeedingPosts}
                            >
                                {isSeedingPosts ? 'Generating...' : `Generate Posts`}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Wipe Result Display */}
                {wipeResult && (
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                            <CardTitle className="text-lg text-green-700">Deep Wipe Complete</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Posts Deleted</p>
                                    <p className="text-2xl font-bold text-green-700">{wipeResult.postsDeleted}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Media Files Deleted</p>
                                    <p className="text-2xl font-bold text-green-700">{wipeResult.mediaFilesDeleted}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Likes Deleted</p>
                                    <p className="text-2xl font-bold text-green-700">{wipeResult.likesDeleted}</p>
                                </div>
                                {wipeResult.mediaFilesFailed > 0 && (
                                    <div>
                                        <p className="text-muted-foreground">Failed Media</p>
                                        <p className="text-2xl font-bold text-orange-600">{wipeResult.mediaFilesFailed}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                CONFIRMATION MODALS
            ═══════════════════════════════════════════════════════════════════════════ */}

            {/* Homestay Wipe Confirmation Modal */}
            {showHomestayWipeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <Card className="w-full max-w-md bg-white shadow-xl border-red-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600 text-xl font-bold">
                                <AlertTriangle className="w-6 h-6" /> Nuclear Option
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700">Are you absolutely sure you want to delete <strong>ALL</strong> homestays? This action cannot be undone.</p>
                            <div className="flex gap-3 justify-end pt-4">
                                <Button variant="outline" onClick={() => setShowHomestayWipeModal(false)} disabled={isDeletingAllHomestays}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteAllHomestays} disabled={isDeletingAllHomestays}>Yes, Wipe Everything</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Post Wipe Confirmation Modal */}
            {showPostWipeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <Card className="w-full max-w-md bg-white shadow-xl border-orange-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-600 text-xl font-bold">
                                <AlertTriangle className="w-6 h-6" /> Deep Wipe Posts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700">This will permanently delete:</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                <li><strong>All posts</strong> (including soft-deleted)</li>
                                <li><strong>All comments</strong> and nested replies</li>
                                <li><strong>All likes</strong></li>
                                <li><strong>All media files</strong> from ImageKit storage</li>
                            </ul>
                            <p className="text-red-600 font-medium">This action cannot be undone!</p>
                            <div className="flex gap-3 justify-end pt-4">
                                <Button variant="outline" onClick={() => setShowPostWipeModal(false)} disabled={isDeletingAllPosts}>Cancel</Button>
                                <Button variant="destructive" className="bg-orange-600 hover:bg-orange-700" onClick={handleDeleteAllPosts} disabled={isDeletingAllPosts}>Yes, Wipe All Posts</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
