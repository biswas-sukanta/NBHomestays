'use client';

import { useEffect, useState } from 'react';
import { homestayApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

interface Homestay {
    id: string;
    name: string;
    pricePerNight: number;
    status: string;
    location: any;
}

export default function HostDashboard() {
    const router = useRouter();
    const [listings, setListings] = useState<Homestay[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [homestayToDelete, setHomestayToDelete] = useState<string | null>(null);

    const fetchListings = async () => {
        try {
            const res = await homestayApi.getMyListings();
            const responseData = res.data as any;
            const listingsArray = responseData.content ? responseData.content : responseData;
            const data: Homestay[] = listingsArray.map((h: any) => ({
                id: h.id,
                name: h.name || '',
                pricePerNight: h.pricePerNight || 0,
                status: h.status || 'PENDING',
                location: null,
            }));
            setListings(data);

        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch listings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleEditClick = (id: string) => {
        router.push(`/host/edit-homestay/${id}`);
    };

    const handleDeleteClick = (id: string) => {
        setHomestayToDelete(id);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!homestayToDelete) return;
        try {
            await homestayApi.deleteHomestay(homestayToDelete);
            toast.success("Homestay deleted");
            setIsDeleteOpen(false);
            setListings(prev => prev.filter(h => h.id !== homestayToDelete));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete homestay");
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Listings</h1>
                <Link href="/host/add-homestay">
                    <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Homestay
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : listings.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                    No listings found. Start by adding one!
                </div>
            ) : (
                <div className="grid gap-4">
                    {listings.map(homestay => (
                        <Card key={homestay.id} className="flex flex-row items-center justify-between p-4 cursor-pointer hover:border-green-300 hover:shadow-md transition-all group" onClick={() => router.push(`/homestays/${homestay.id}`)}>
                            <div>
                                <h3 className="text-xl font-semibold group-hover:text-green-700 transition-colors">{homestay.name}</h3>
                                <div className="text-sm text-gray-500">
                                    ₹{homestay.pricePerNight} / night
                                </div>
                                <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded ${homestay.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                    homestay.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`} title={
                                        homestay.status === 'PENDING' ? 'Waiting for Admin approval' :
                                            homestay.status === 'APPROVED' ? 'Live and visible to guests' :
                                                'Rejected by Admin'
                                    }>
                                    {homestay.status}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick(homestay.id); }}>
                                    <Pencil className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteClick(homestay.id); }}>
                                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this listing? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
