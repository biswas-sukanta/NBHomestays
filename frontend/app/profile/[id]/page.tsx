'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, MapPin, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { SharedPageBanner } from '@/components/shared-page-banner';
import { HomestayCard } from '@/components/homestay-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useAuth } from '@/context/AuthContext';
import { userApi, type PublicProfile } from '@/lib/api/users';
import { queryKeys } from '@/lib/queryKeys';

const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80';

function formatCount(value: number) {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export default function PublicProfilePage() {
    const params = useParams<{ id: string }>();
    const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = useAuth();

    const profileQuery = useQuery({
        queryKey: profileId ? queryKeys.users.profile(profileId) : ['users', 'profile', 'missing-id'],
        enabled: Boolean(profileId),
        queryFn: async () => {
            const response = await userApi.getProfile(profileId!);
            return response.data;
        },
    });

    const followMutation = useMutation({
        mutationFn: async (nextIsFollowing: boolean) => {
            if (!profileId) {
                throw new Error('Missing profile id');
            }
            if (nextIsFollowing) {
                await userApi.follow(profileId);
            } else {
                await userApi.unfollow(profileId);
            }
            return nextIsFollowing;
        },
        onMutate: async (nextIsFollowing: boolean) => {
            if (!profileId) {
                return { previousProfile: undefined };
            }

            await queryClient.cancelQueries({ queryKey: queryKeys.users.profile(profileId) });
            const previousProfile = queryClient.getQueryData<PublicProfile>(queryKeys.users.profile(profileId));

            queryClient.setQueryData<PublicProfile>(queryKeys.users.profile(profileId), (current) => {
                if (!current) {
                    return current;
                }
                const followerDelta = nextIsFollowing ? 1 : -1;
                return {
                    ...current,
                    isFollowing: nextIsFollowing,
                    followersCount: Math.max(0, current.followersCount + followerDelta),
                };
            });

            return { previousProfile };
        },
        onError: (_error, _nextIsFollowing, context) => {
            if (profileId && context?.previousProfile) {
                queryClient.setQueryData(queryKeys.users.profile(profileId), context.previousProfile);
            }
            toast.error('Failed to update follow status');
        },
        onSuccess: (nextIsFollowing) => {
            toast.success(nextIsFollowing ? 'Now following this profile' : 'Unfollowed profile');
        },
        onSettled: async () => {
            if (profileId) {
                await queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(profileId) });
            }
        },
    });

    if (profileQuery.isPending) {
        return (
            <div className="min-h-screen bg-background">
                <Skeleton className="h-64 w-full" />
                <div className="container mx-auto max-w-5xl px-4 py-12">
                    <div className="flex flex-col gap-6 rounded-[2rem] border border-border/70 bg-card/80 p-8 shadow-sm md:flex-row md:items-center">
                        <Skeleton className="h-28 w-28 rounded-full" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-10 w-56" />
                            <Skeleton className="h-5 w-64" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (profileQuery.isError || !profileQuery.data) {
        return <div className="min-h-screen flex items-center justify-center">Profile not found.</div>;
    }

    const profile = profileQuery.data;
    const fullName = `${profile.firstName} ${profile.lastName}`.trim();
    const isOwnProfile = user?.id === profile.id;
    const statLine = `${formatCount(profile.followersCount)} Followers • ${formatCount(profile.followingCount)} Following • ${formatCount(profile.postCount)} Posts`;

    const handleFollowToggle = async () => {
        if (!profileId || !isAuthenticated || isOwnProfile) {
            return;
        }
        await followMutation.mutateAsync(!profile.isFollowing);
    };

    return (
        <div className="min-h-screen bg-background">
            <SharedPageBanner
                title={fullName}
                subtitle={
                    <div className="mt-4 flex flex-col items-center gap-3">
                        <span className="text-sm text-white/80">@{profile.username}</span>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {profile.badges.map((badge) => (
                                <span key={badge} className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-950 shadow-sm">
                                    <Award className="h-3 w-3" />
                                    {badge}
                                </span>
                            ))}
                            {profile.verifiedHost && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-950 shadow-sm">
                                    Verified Host
                                </span>
                            )}
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                                {profile.communityPoints} Community Points
                            </span>
                        </div>
                    </div>
                }
            />

            <main className="container mx-auto max-w-5xl px-4 py-12">
                <div className="grid gap-12 md:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="space-y-8">
                        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 shadow-sm">
                            <div className="bg-gradient-to-br from-primary/10 via-transparent to-accent/20 p-8">
                                <div className="mb-6 flex items-center gap-4">
                                    <div className="h-24 w-24 overflow-hidden rounded-full border border-white/70 bg-white shadow-md">
                                        <OptimizedImage
                                            src={profile.avatar || AVATAR_FALLBACK}
                                            alt={fullName || profile.username}
                                            width={160}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-lg font-bold text-foreground">{fullName || profile.username}</p>
                                        <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-sm text-muted-foreground">
                                    {statLine}
                                </div>

                                {!isOwnProfile && isAuthenticated && (
                                    <Button
                                        type="button"
                                        onClick={handleFollowToggle}
                                        disabled={followMutation.isPending}
                                        variant={profile.isFollowing ? 'outline' : 'default'}
                                        className={profile.isFollowing
                                            ? 'mt-4 w-full rounded-full border-border bg-background text-foreground hover:bg-secondary'
                                            : 'mt-4 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90'}
                                    >
                                        {followMutation.isPending
                                            ? (profile.isFollowing ? 'Updating...' : 'Following...')
                                            : (profile.isFollowing ? 'Following' : 'Follow')}
                                    </Button>
                                )}

                                {isOwnProfile && (
                                    <Button asChild type="button" variant="outline" className="mt-4 w-full rounded-full">
                                        <Link href="/profile">Edit Profile</Link>
                                    </Button>
                                )}

                                <p className="mt-6 rounded-2xl border border-border/60 bg-secondary/40 px-4 py-4 text-sm leading-7 text-foreground">
                                    {profile.bio || `Hi! I'm ${profile.firstName}, sharing stays, local notes, and travel moments from North Bengal.`}
                                </p>
                            </div>
                        </section>
                    </aside>

                    <div className="space-y-12">
                        <section>
                            <h2 className="mb-6 text-2xl font-black text-gray-900">Hosted Stays</h2>
                            <div className="grid gap-6 sm:grid-cols-2">
                                {profile.homestays.map((homestay, index) => (
                                    <HomestayCard key={homestay.id} homestay={homestay} index={index} />
                                ))}
                                {profile.homestays.length === 0 && (
                                    <p className="text-muted-foreground italic">No public listings yet.</p>
                                )}
                            </div>
                        </section>

                        <section className="border-t border-border pt-8">
                            <h2 className="mb-6 text-2xl font-black text-gray-900">Recent Stories</h2>
                            <div className="space-y-4">
                                {profile.posts.map((post) => (
                                    <Link key={post.id} href={`/community?postId=${post.id}`}>
                                        <div className="group cursor-pointer rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                                            <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                                                {post.postType && (
                                                    <span className="rounded-full bg-neutral-900 px-2 py-1 text-white">{post.postType}</span>
                                                )}
                                                <span className="flex items-center gap-1 rounded-full bg-primary/5 px-2 py-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {post.locationName}
                                                </span>
                                            </div>
                                            <p className="mb-4 line-clamp-2 text-gray-800 leading-relaxed">
                                                &quot;{post.textContent}&quot;
                                            </p>
                                            <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground transition-colors group-hover:text-primary">
                                                <MessageSquare className="h-3.5 w-3.5" />
                                                Read full story
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {profile.posts.length === 0 && (
                                    <p className="text-muted-foreground italic">No stories shared yet.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
