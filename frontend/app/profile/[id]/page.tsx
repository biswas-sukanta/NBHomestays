'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { SharedPageBanner } from '@/components/shared-page-banner';
import { HomestayCard } from '@/components/homestay-card';
import { MapPin, Star, Award, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface HostProfile {
    id: string;
    firstName: string;
    lastName: string;
    bio: string;
    communityPoints: number;
    badges: string[];
    homestays: any[];
    posts: any[];
}

export default function PublicProfilePage() {
    const { id } = useParams();
    const [profile, setProfile] = useState<HostProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.get(`/api/users/${id}/profile`)
            .then(res => setProfile(res.data))
            .catch(err => console.error("Failed to load profile", err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Skeleton className="h-64 w-full" />
                <div className="container mx-auto px-4 py-12 max-w-5xl">
                    <Skeleton className="h-12 w-48 mb-6" />
                    <Skeleton className="h-24 w-full mb-8" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return <div className="min-h-screen flex items-center justify-center">Profile not found.</div>;
    }

    const fullName = `${profile.firstName} ${profile.lastName}`;

    return (
        <div className="min-h-screen bg-background">
            <SharedPageBanner
                title={fullName}
                subtitle={
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                        {profile.badges.map(badge => (
                            <span key={badge} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full shadow-sm">
                                <Award className="w-3 h-3" />
                                {badge}
                            </span>
                        ))}
                        <span className="text-white font-bold bg-white/20 px-3 py-1 rounded-full text-xs">
                            {profile.communityPoints} Community Points
                        </span>
                    </div>
                }
            />

            <main className="container mx-auto px-4 py-12 max-w-5xl">
                <div className="grid md:grid-cols-3 gap-12">
                    {/* Left Column: Bio & Achievements */}
                    <div className="md:col-span-1 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About the host</h2>
                            <p className="text-gray-700 leading-relaxed italic border-l-4 border-primary pl-4 py-2 bg-gray-50 rounded-r-xl">
                                {profile.bio || `Hi! I'm ${profile.firstName}, a local from North Bengal. I love hosting travelers and sharing the unique vibes of our hills.`}
                            </p>
                        </section>

                        <section className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                            <h3 className="text-emerald-900 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Award className="w-4 h-4" />
                                Community Standing
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/60 p-3 rounded-xl border border-white">
                                    <span className="text-xs font-bold text-emerald-800">Scout Tier</span>
                                    <span className="text-xs font-black text-emerald-950">Level 4</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/60 p-3 rounded-xl border border-white">
                                    <span className="text-xs font-bold text-emerald-800">Vibe Keeper</span>
                                    <span className="text-xs font-black text-emerald-950">Explorer</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Listings & Stories */}
                    <div className="md:col-span-2 space-y-12">
                        {/* Stays */}
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                Stays by {profile.firstName}
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{profile.homestays.length}</span>
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-6">
                                {profile.homestays.map((h, i) => (
                                    <HomestayCard key={h.id} homestay={h} index={i} />
                                ))}
                                {profile.homestays.length === 0 && (
                                    <p className="text-gray-500 italic">No public listings yet.</p>
                                )}
                            </div>
                        </section>

                        {/* Recent Stories */}
                        <section className="pt-8 border-t border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                Recent Stories
                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{profile.posts.length}</span>
                            </h2>
                            <div className="space-y-4">
                                {profile.posts.map(post => (
                                    <Link key={post.id} href={`/community?postId=${post.id}`}>
                                        <div className="bg-white border border-gray-100 p-5 rounded-2xl hover:shadow-md transition-shadow group cursor-pointer shadow-sm">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-2 px-2 py-1 bg-primary/5 rounded-full w-fit">
                                                <MapPin className="w-3 h-3" />
                                                {post.locationName}
                                            </div>
                                            <p className="text-gray-800 font-medium line-clamp-2 leading-relaxed mb-4">
                                                "{post.textContent}"
                                            </p>
                                            <div className="text-xs font-bold text-gray-400 group-hover:text-primary transition-colors flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Read full story →
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {profile.posts.length === 0 && (
                                    <p className="text-gray-500 italic">No stories shared yet.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
