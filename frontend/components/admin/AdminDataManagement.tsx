'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, DatabaseZap, FileText, Loader2 } from 'lucide-react';
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
    // States
    const [deleteCount, setDeleteCount] = useState<number | ''>('');
    const [seedCount, setSeedCount] = useState<number | ''>('');
    const [batchSize, setBatchSize] = useState<number>(20);

    const [isDeletingSpecific, setIsDeletingSpecific] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isWipingPosts, setIsWipingPosts] = useState(false);
    const [isBatchWipingPosts, setIsBatchWipingPosts] = useState(false);

    // Batch wipe progress state
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
    const [batchWipeSummary, setBatchWipeSummary] = useState<{ posts: number; media: number; failed: number } | null>(null);

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showWipePostsModal, setShowWipePostsModal] = useState(false);
    const [showBatchWipeModal, setShowBatchWipeModal] = useState(false);
    const [wipeResult, setWipeResult] = useState<WipeResult | null>(null);

    const handleDeleteSpecific = async () => {
        if (!deleteCount || deleteCount <= 0) {
            toast.error('Please enter a valid number to delete.');
            return;
        }
        setIsDeletingSpecific(true);
        try {
            const res = await adminApi.deleteHomestaysLimit(deleteCount);
            if (res.status === 200) {
                toast.success(`Successfully deleted ${res.data.deletedCount} homestays!`);
                setDeleteCount('');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete specific records.');
        } finally {
            setIsDeletingSpecific(false);
        }
    };

    const handleDeleteAll = async () => {
        setIsDeletingAll(true);
        setShowConfirmModal(false);
        try {
            const res = await adminApi.deleteAllHomestays();
            if (res.status === 200) {
                toast.success('Nuclear wipe executed: All homestays deleted.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to execute nuclear wipe.');
        } finally {
            setIsDeletingAll(false);
        }
    };

    const handleSeedData = async () => {
        if (!seedCount || seedCount <= 0) {
            toast.error('Please enter a valid number of homestays to generate.');
            return;
        }
        setIsSeeding(true);
        try {
            const res = await adminApi.seedHomestays(seedCount);
            if (res.status === 200) {
                toast.success(`Successfully generated ${res.data.insertedCount} hyper-realistic homestays!`);
                setSeedCount('');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to generate seed data.');
        } finally {
            setIsSeeding(false);
        }
    };

    const handleWipeAllPosts = async () => {
        setIsWipingPosts(true);
        setShowWipePostsModal(false);
        try {
            const res = await adminApi.wipeAllPosts();
            if (res.status === 200) {
                setWipeResult(res.data);
                toast.success('Deep wipe complete! All posts, comments, likes, and media files deleted.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to wipe posts.');
        } finally {
            setIsWipingPosts(false);
        }
    };

    /**
     * Batch wipe with recursive loop - calls wipe-batch endpoint repeatedly until hasMore is false.
     * Shows progress feedback to the admin.
     */
    const handleBatchWipeAllPosts = async () => {
        setIsBatchWipingPosts(true);
        setShowBatchWipeModal(false);
        setBatchProgress({ current: 0, total: 0 });
        setBatchWipeSummary(null);
        
        let totalDeleted = 0;
        let totalMediaDeleted = 0;
        let totalMediaFailed = 0;
        let batchNumber = 1;
        
        try {
            let hasMore = true;
            
            while (hasMore) {
                setBatchProgress(prev => ({ 
                    current: batchNumber, 
                    total: prev?.total || 0 
                }));
                
                const res = await adminApi.wipePostsBatch(batchSize);
                
                if (res.status === 200) {
                    const data: BatchWipeResult = res.data;
                    totalDeleted += data.deletedCount;
                    totalMediaDeleted += data.mediaFilesDeleted;
                    totalMediaFailed += data.mediaFilesFailed;
                    hasMore = data.hasMore;
                    
                    setBatchProgress({ current: batchNumber, total: totalDeleted });
                    batchNumber++;
                    
                    // Small delay between batches to avoid overwhelming the server
                    if (hasMore) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                } else {
                    throw new Error('Batch wipe request failed');
                }
            }
            
            setBatchWipeSummary({
                posts: totalDeleted,
                media: totalMediaDeleted,
                failed: totalMediaFailed
            });
            
            toast.success(`Batch wipe complete! ${totalDeleted} posts deleted in ${batchNumber - 1} batches.`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to batch wipe posts.');
        } finally {
            setIsBatchWipingPosts(false);
            setBatchProgress(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                    <DatabaseZap className="w-6 h-6 text-primary" /> Data Management
                </h2>
                <p className="text-muted-foreground">Perform bulk data operations directly on the database. Proceed with caution.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* CARD 1: Purge Specific */}
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
                                value={deleteCount}
                                onChange={(e) => setDeleteCount(parseInt(e.target.value) || '')}
                                disabled={isDeletingSpecific}
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="w-full border-red-500 text-red-600 hover:bg-red-50"
                            onClick={handleDeleteSpecific}
                            disabled={isDeletingSpecific}
                        >
                            {isDeletingSpecific ? 'Deleting...' : `Delete ${deleteCount || 'X'} Records`}
                        </Button>
                    </CardContent>
                </Card>

                {/* CARD 2: Nuclear Wipe (Purge All) */}
                <Card className="bg-white border-red-100 shadow-sm flex flex-col ring-1 ring-red-100">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" /> Purge All
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                        <p className="text-sm text-red-800/80">WARNING: This is a destructive operation. It will permanently delete every single homestay record in the entire database.</p>
                        <Button
                            variant="destructive"
                            className="w-full bg-red-600 hover:bg-red-700 font-bold"
                            onClick={() => setShowConfirmModal(true)}
                            disabled={isDeletingAll}
                        >
                            {isDeletingAll ? 'Wiping Database...' : 'Delete All Homestays'}
                        </Button>
                    </CardContent>
                </Card>

                {/* CARD 3: Seed Realistic Data */}
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
                                value={seedCount}
                                onChange={(e) => setSeedCount(parseInt(e.target.value) || '')}
                                disabled={isSeeding}
                            />
                        </div>
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                            onClick={handleSeedData}
                            disabled={isSeeding}
                        >
                            {isSeeding ? 'Generating...' : `Generate Homestays`}
                        </Button>
                    </CardContent>
                </Card>

                {/* CARD 4: Wipe All Posts (Deep Clean) */}
                <Card className="bg-white border-orange-100 shadow-sm flex flex-col ring-1 ring-orange-100">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                            <FileText className="w-5 h-5" /> Wipe All Posts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                        <p className="text-sm text-orange-800/80">DEEP CLEAN: Deletes ALL community posts, comments, likes, and physical media files from ImageKit. This is irreversible.</p>
                        <Button
                            variant="destructive"
                            className="w-full bg-orange-600 hover:bg-orange-700 font-bold"
                            onClick={() => setShowWipePostsModal(true)}
                            disabled={isWipingPosts || isBatchWipingPosts}
                        >
                            {isWipingPosts ? 'Wiping Posts...' : 'Wipe All Posts (Deep Clean)'}
                        </Button>
                    </CardContent>
                </Card>

                {/* CARD 5: Batch Wipe Posts (Recommended) */}
                <Card className="bg-white border-blue-100 shadow-sm flex flex-col ring-1 ring-blue-100">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
                            <Trash2 className="w-5 h-5" /> Batch Wipe Posts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4 flex-1 justify-between">
                        <div>
                            <p className="text-sm text-blue-800/80 mb-3">RECOMMENDED: Deletes posts in manageable batches to avoid timeouts. Shows progress feedback.</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Batch size:</span>
                                <Input
                                    type="number"
                                    placeholder="20"
                                    min={1}
                                    max={100}
                                    value={batchSize}
                                    onChange={(e) => setBatchSize(Math.min(100, Math.max(1, parseInt(e.target.value) || 20)))}
                                    className="w-20 h-8"
                                    disabled={isBatchWipingPosts}
                                />
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 font-bold"
                            onClick={() => setShowBatchWipeModal(true)}
                            disabled={isWipingPosts || isBatchWipingPosts}
                        >
                            {isBatchWipingPosts && batchProgress ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Batch {batchProgress.current}... ({batchProgress.total} deleted)
                                </span>
                            ) : 'Batch Wipe All Posts'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Batch Wipe Progress Display */}
            {isBatchWipingPosts && batchProgress && (
                <Card className="bg-blue-50 border-blue-200 mt-6">
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            <div>
                                <p className="text-blue-700 font-medium">Batch wipe in progress...</p>
                                <p className="text-sm text-blue-600">Processing batch #{batchProgress.current} • {batchProgress.total} posts deleted so far</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Batch Wipe Summary Display */}
            {batchWipeSummary && (
                <Card className="bg-green-50 border-green-200 mt-6">
                    <CardHeader>
                        <CardTitle className="text-lg text-green-700">Batch Wipe Complete</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Posts Deleted</p>
                                <p className="text-2xl font-bold text-green-700">{batchWipeSummary.posts}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Media Files Deleted</p>
                                <p className="text-2xl font-bold text-green-700">{batchWipeSummary.media}</p>
                            </div>
                            {batchWipeSummary.failed > 0 && (
                                <div>
                                    <p className="text-muted-foreground">Failed Media</p>
                                    <p className="text-2xl font-bold text-orange-600">{batchWipeSummary.failed}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Wipe Result Display */}
            {wipeResult && (
                <Card className="bg-green-50 border-green-200 mt-6">
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

            {/* Confirmation Modal */}
            {showConfirmModal && (
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
                                <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isDeletingAll}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeletingAll}>Yes, Wipe Everything</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Wipe Posts Confirmation Modal */}
            {showWipePostsModal && (
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
                                <Button variant="outline" onClick={() => setShowWipePostsModal(false)} disabled={isWipingPosts}>Cancel</Button>
                                <Button variant="destructive" className="bg-orange-600 hover:bg-orange-700" onClick={handleWipeAllPosts} disabled={isWipingPosts}>Yes, Wipe All Posts</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Batch Wipe Confirmation Modal */}
            {showBatchWipeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <Card className="w-full max-w-md bg-white shadow-xl border-blue-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-600 text-xl font-bold">
                                <Trash2 className="w-6 h-6" /> Batch Wipe Posts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700">This will delete all posts in batches of <strong>{batchSize}</strong> to avoid timeouts:</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                                <li><strong>All posts</strong> (including soft-deleted)</li>
                                <li><strong>All comments</strong> and nested replies</li>
                                <li><strong>All likes</strong></li>
                                <li><strong>All media files</strong> from ImageKit storage</li>
                            </ul>
                            <p className="text-blue-600 font-medium">Progress will be shown as batches are processed.</p>
                            <div className="flex gap-3 justify-end pt-4">
                                <Button variant="outline" onClick={() => setShowBatchWipeModal(false)} disabled={isBatchWipingPosts}>Cancel</Button>
                                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleBatchWipeAllPosts} disabled={isBatchWipingPosts}>Yes, Batch Wipe All Posts</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
