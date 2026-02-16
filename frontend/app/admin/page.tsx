'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Homestay {
    id: string;
    name: string;
    description: string;
    pricePerNight: number;
    status: string;
    photoUrls: string[];
    ownerEmail: string;
}

type Tab = 'pending' | 'all';

export default function AdminPage() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [pendingHomestays, setPendingHomestays] = useState<Homestay[]>([]);
    const [allHomestays, setAllHomestays] = useState<Homestay[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated || user?.role !== 'ROLE_ADMIN') {
                toast.error("Access Denied. Admins only.");
                router.push('/');
                return;
            }
            fetchData();
        }
    }, [isLoading, isAuthenticated, user, router]);

    const fetchData = async () => {
        try {
            const [pendingRes, allRes] = await Promise.all([
                api.get('/api/homestays/pending'),
                api.get('/api/homestays/all'),
            ]);
            setPendingHomestays(pendingRes.data);
            setAllHomestays(allRes.data);
        } catch (error) {
            console.error("Failed to fetch homestays", error);
            toast.error("Failed to load homestays");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        // Optimistic update
        setPendingHomestays(prev => prev.filter(h => h.id !== id));
        setAllHomestays(prev => prev.map(h => h.id === id ? { ...h, status: 'APPROVED' } : h));
        toast.success("Homestay Approved!");

        try {
            await api.put(`/api/homestays/${id}/approve`);
        } catch (error) {
            console.error("Failed to approve", error);
            toast.error("Failed to approve homestay");
            fetchData(); // Revert on failure
        }
    };

    const handleReject = async (id: string) => {
        // Optimistic update
        setPendingHomestays(prev => prev.filter(h => h.id !== id));
        setAllHomestays(prev => prev.map(h => h.id === id ? { ...h, status: 'REJECTED' } : h));
        toast.success("Homestay Rejected.");

        try {
            await api.put(`/api/homestays/${id}/reject`);
        } catch (error) {
            console.error("Failed to reject", error);
            toast.error("Failed to reject homestay");
            fetchData(); // Revert on failure
        }
    };

    if (isLoading || loading) return <div className="p-8 text-center">Loading Admin Dashboard...</div>;

    const displayList = activeTab === 'pending' ? pendingHomestays : allHomestays;

    const statusColor: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
    };

    return (
        <div className="container mx-auto p-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'pending'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Pending Approval ({pendingHomestays.length})
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === 'all'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    All Listings ({allHomestays.length})
                </button>
            </div>

            {/* Content */}
            {displayList.length === 0 ? (
                <p className="text-gray-500">
                    {activeTab === 'pending' ? 'No pending homestays.' : 'No homestays found.'}
                </p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayList.map(homestay => (
                        <Card key={homestay.id}>
                            <CardHeader>
                                <CardTitle>{homestay.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-1 line-clamp-2">{homestay.description}</p>
                                <p className="text-xs text-gray-400 mb-2">Owner: {homestay.ownerEmail}</p>
                                <p className="font-bold mb-4">₹{homestay.pricePerNight} / night</p>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs px-2 py-1 rounded ${statusColor[homestay.status] || 'bg-gray-100 text-gray-800'}`}>
                                        {homestay.status}
                                    </span>
                                    {homestay.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <Button variant="destructive" size="sm" onClick={() => handleReject(homestay.id)} aria-label={`Reject ${homestay.name}`}>
                                                Reject
                                            </Button>
                                            <Button size="sm" onClick={() => handleApprove(homestay.id)} aria-label={`Approve ${homestay.name}`}>
                                                Approve
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
