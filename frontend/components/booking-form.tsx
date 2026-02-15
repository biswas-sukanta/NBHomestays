'use client';

import * as React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface BookingFormProps {
    homestayId: string;
    pricePerNight: number;
}

export function BookingForm({ homestayId, pricePerNight }: BookingFormProps) {
    const [date, setDate] = React.useState<DateRange | undefined>();
    const [guests, setGuests] = React.useState(1);
    const router = useRouter();
    const queryClient = useQueryClient();

    // Calculate stats
    const nights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
    const totalPrice = nights * pricePerNight;

    const mutation = useMutation({
        mutationFn: async () => {
            if (!date?.from || !date?.to) throw new Error("Please select dates");

            const response = await api.post('/bookings', {
                homestayId,
                checkInDate: format(date.from, 'yyyy-MM-dd'),
                checkOutDate: format(date.to, 'yyyy-MM-dd'),
                guests
            });
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: "Booking Request Sent!",
                description: "Your host will review your request shortly.",
            });
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            router.push('/bookings');
        },
        onError: (error: any) => {
            toast({
                title: "Booking Failed",
                description: error.response?.data?.message || "Something went wrong.",
                variant: "destructive"
            });
        }
    });

    const handleBook = () => {
        if (!date?.from || !date?.to) {
            toast({
                title: "Select Dates",
                description: "Please select a check-in and check-out date.",
                variant: "destructive"
            });
            return;
        }
        mutation.mutate();
    };

    return (
        <div className="rounded-xl border bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-baseline justify-between">
                <div>
                    <span className="text-2xl font-bold">₹{pricePerNight}</span>
                    <span className="text-gray-500"> / night</span>
                </div>
                <div className="text-sm font-medium underline">12 reviews</div>
            </div>

            <div className="grid gap-4">
                {/* Date Picker */}
                <div className="grid gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                disabled={(date) => date < new Date()}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Guests */}
                <div className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-medium">Guests</span>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => setGuests(Math.max(1, guests - 1))} disabled={guests <= 1}>-</Button>
                        <span>{guests}</span>
                        <Button variant="outline" size="sm" onClick={() => setGuests(guests + 1)}>+</Button>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <Button
                    className="w-full bg-primary text-lg"
                    size="lg"
                    onClick={handleBook}
                    disabled={mutation.isPending}
                >
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mutation.isPending ? "Booking..." : "Reserve"}
                </Button>
            </div>

            {nights > 0 && (
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                        <span>₹{pricePerNight} x {nights} nights</span>
                        <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-gray-900">
                        <span>Total</span>
                        <span>₹{totalPrice}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
