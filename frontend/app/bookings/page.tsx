'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Loader2, Calendar, IndianRupee } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Booking {
    id: string;
    homestayId: string;
    homestayTitle: string;
    checkInDate: string;
    checkOutDate: string;
    totalPrice: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export default function MyBookingsPage() {
    const { data: bookings, isLoading, error } = useQuery<Booking[]>({
        queryKey: ['my-bookings'],
        queryFn: async () => {
            const response = await api.get('/api/bookings/my-bookings');
            return response.data;
        },
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            case 'CANCELLED': return 'bg-red-100 text-red-800 hover:bg-red-100';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500">Error loading bookings</h1>
                <p className="text-gray-600">Please try again later or login again.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto min-h-screen py-10 px-4 md:px-8">
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-bold">My Bookings</h1>
                <Button asChild>
                    <Link href="/search">Book New</Link>
                </Button>
            </div>

            {bookings?.length === 0 ? (
                <Card className="text-center p-12">
                    <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                    <p className="text-gray-500 mb-6">Time to plan your next escape to the hills!</p>
                    <Button asChild>
                        <Link href="/search">Find a Homestay</Link>
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {bookings?.map((booking) => (
                        <Card key={booking.id} className="overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <CardHeader className="bg-gray-50 pb-4">
                                <div className="flex items-start justify-between">
                                    <CardTitle className="text-lg font-bold line-clamp-1" title={booking.homestayTitle}>
                                        {booking.homestayTitle}
                                    </CardTitle>
                                    <Badge className={getStatusColor(booking.status)} variant="secondary">
                                        {booking.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 grid gap-3">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>
                                        {format(new Date(booking.checkInDate), 'MMM dd')} - {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                                    </span>
                                </div>

                                <div className="flex items-center text-sm font-semibold text-gray-900">
                                    <IndianRupee className="mr-2 h-4 w-4" />
                                    <span>{booking.totalPrice}</span>
                                </div>

                                <div className="mt-2 pt-3 border-t flex justify-end">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/homestay/${booking.homestayId}`}>View Details</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
