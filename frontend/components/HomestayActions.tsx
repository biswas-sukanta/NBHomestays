'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface HomestayActionsProps {
    homestayId: string;
    ownerEmail: string;
}

export default function HomestayActions({ homestayId, ownerEmail }: HomestayActionsProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!user) return null;

    // Check permissions
    // Note: Backend uses "ROLE_ADMIN". Frontend User object might use "ADMIN".
    // Check AuthContext implementation or printed user object.
    // Usually user.role is "ADMIN" or "HOST".
    const isAdmin = user.role === 'ADMIN' || user.role === 'ROLE_ADMIN';
    const isOwner = user.email === ownerEmail;

    if (!isAdmin && !isOwner) return null;

    const handleDelete = async () => {
        setLoading(true);
        try {
            await api.delete(`/homestays/${homestayId}`);
            toast.success("Homestay deleted successfully");
            router.push('/'); // Or dashboard
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete homestay");
        } finally {
            setLoading(false);
            setIsDeleteOpen(false);
        }
    };

    const handleEdit = () => {
        // For now, redirect to dashboard or show NotImplemented
        // Or implement edit page.
        // Dashboard has edit modal.
        router.push('/host/dashboard');
        toast.info("Please edit from your dashboard");
    };

    return (
        <>
            <div className="flex gap-2 mb-6">
                <Button variant="outline" onClick={handleEdit}>
                    <Pencil className="w-4 h-4 mr-2" /> Edit Output
                </Button>
                <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
            </div>

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this listing? (Admin Override Enabled)</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
