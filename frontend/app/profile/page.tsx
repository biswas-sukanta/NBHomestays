'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

interface Post {
    id: string;
    textContent: string;
    locationName: string;
    createdAt: string;
}

export default function UserProfile() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [editPost, setEditPost] = useState<Post | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts/my-posts');
            setPosts(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleEditClick = (post: Post) => {
        setEditPost(post);
        setEditContent(post.textContent);
        setIsEditOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setPostToDelete(id);
        setIsDeleteOpen(true);
    };

    const handleUpdate = async () => {
        if (!editPost) return;
        try {
            await api.put(`/posts/${editPost.id}`, {
                textContent: editContent
            });
            toast.success("Post updated");
            setIsEditOpen(false);
            fetchPosts();
        } catch (error) {
            console.error(error);
            toast.error("Failed to update post");
        }
    };

    const handleDelete = async () => {
        if (!postToDelete) return;
        try {
            await api.delete(`/posts/${postToDelete}`);
            toast.success("Post deleted");
            setIsDeleteOpen(false);
            setPosts(prev => prev.filter(p => p.id !== postToDelete));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete post");
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">My Profile</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">My Posts History</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : posts.length === 0 ? (
                    <div className="text-gray-500">You haven't shared any experiences yet.</div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <Card key={post.id} className="p-4">
                                <CardContent className="p-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-900">{post.locationName}</p>
                                            <p className="text-gray-700 mt-1">{post.textContent}</p>
                                            <p className="text-xs text-gray-400 mt-2">{new Date(post.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(post)}>
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(post.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Post Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={5}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Post?</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
