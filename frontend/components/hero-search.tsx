'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export function HeroSearch() {
    const router = useRouter();
    const [location, setLocation] = React.useState('');
    const [date, setDate] = React.useState<Date>();
    const [guests, setGuests] = React.useState(1);

    const handleSearch = () => {
        if (!location.trim()) {
            toast.error("Please enter a destination to search.");
            return;
        }

        const params = new URLSearchParams();
        params.set('query', location);
        if (date) params.set('date', date.toISOString());
        params.set('guests', guests.toString());

        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="relative h-screen w-full overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 h-full w-full bg-cover bg-center"
                style={{ backgroundImage: "url('/hero_background.jpg')" }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-6 text-4xl font-bold text-white md:text-6xl lg:text-7xl"
                >
                    Find Your Vibe in North Bengal
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mb-10 text-lg text-white/90 md:text-xl"
                >
                    Discover unique homestays with verified vibes.
                </motion.p>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex w-full max-w-4xl flex-col items-center gap-2 rounded-3xl bg-white p-2 shadow-2xl md:flex-row md:pl-6"
                >
                    {/* Location Input */}
                    <div className="flex w-full items-center gap-2 border-b border-gray-100 p-2 md:w-1/3 md:border-b-0 md:border-r">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Where to?"
                            className="border-none bg-transparent text-gray-800 placeholder:text-gray-400 focus-visible:ring-0"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    {/* Date Picker */}
                    <div className="flex w-full items-center gap-2 border-b border-gray-100 p-2 md:w-1/3 md:border-b-0 md:border-r">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        'w-full justify-start text-left font-normal hover:bg-transparent',
                                        !date && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Guest Counter */}
                    <div className="flex w-full items-center gap-2 p-2 md:w-1/4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-left font-normal hover:bg-transparent"
                                >
                                    <Users className="mr-2 h-5 w-5 text-gray-400" />
                                    <span>{guests} Guest{guests !== 1 ? 's' : ''}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Guests</span>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setGuests(Math.max(1, guests - 1))}
                                            disabled={guests <= 1}
                                        >
                                            -
                                        </Button>
                                        <span className="w-4 text-center">{guests}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setGuests(guests + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Search Button */}
                    <Button
                        size="lg"
                        className="w-full rounded-2xl md:w-auto md:rounded-full px-8 py-6 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg transition-all hover:scale-105 active:scale-95"
                        onClick={handleSearch}
                    >
                        <Search className="mr-2 h-5 w-5" />
                        Search
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
