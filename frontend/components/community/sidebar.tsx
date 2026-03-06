import React, { useMemo } from 'react';
import { Bookmark, Flame, MapPin, Award } from 'lucide-react';
import { NormalizedPost } from '@/lib/adapters/normalizePost';

export function CommunitySidebar({ posts = [] }: { posts?: NormalizedPost[] }) {
    // Compute Top Contributors
    const topContributors = useMemo(() => {
        const counts: Record<string, { count: number, id: string; name: string, avatar: string | null }> = {};
        posts.forEach(p => {
            const authorName = p.authorName || 'Traveller';
            if (!counts[authorName]) {
                counts[authorName] = { count: 0, id: p.authorId || '', name: authorName, avatar: p.authorAvatar };
            }
            counts[authorName].count += 1;
        });
        const sorted = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 3);

        return sorted.map(u => ({
            name: u.name,
            role: "Top Contributor",
            initials: u.name.slice(0, 2).toUpperCase(),
            color: "from-emerald-500 to-teal-700",
            count: u.count,
            avatar: u.avatar
        }));
    }, [posts]);

    // Compute Trending Tags
    const trendingTags = useMemo(() => {
        const tags: Record<string, number> = {};
        posts.forEach(p => {
            (p.tags || []).forEach(tag => {
                tags[tag] = (tags[tag] || 0) + 1;
            });
        });
        const sorted = Object.entries(tags).sort((a, b) => b[1] - a[1]).map(t => t[0]).slice(0, 6);
        return sorted.length > 0 ? sorted : ['DarjeelingDiaries', 'WinterTrek', 'HiddenGem', 'HomestayHost', 'Offbeat'];
    }, [posts]);

    // Compute Editor's Pick (Most liked post as fallback for Editor's Pick if not explicitly tagged)
    const editorPick = useMemo(() => {
        if (!posts || posts.length === 0) return null;
        return [...posts].sort((a, b) => b.likes - a.likes)[0];
    }, [posts]);

    return (
        <aside className="hidden lg:flex flex-col gap-6 sticky top-24">

            {/* Top Contributors */}
            <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 ring-1 ring-white/10 shadow-2xl p-6">
                <div className="flex items-center gap-2 mb-6 text-white border-b border-white/5 pb-4">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold font-serif text-lg tracking-tight">Top Contributors</h3>
                </div>
                <div className="space-y-4">
                    {topContributors.map((user, i) => (
                        <div key={i} className="flex items-center gap-3 cursor-pointer group">
                            {user.avatar && user.avatar !== "/images/default-avatar.webp" ? (
                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-gray-200 transition-all" />
                            ) : (
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-gray-200 transition-all`}>
                                    {user.initials}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-bold text-white group-hover:text-green-400 transition-colors leading-tight">{user.name}</p>
                                <p className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">{user.count} stories</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 ring-1 ring-white/10 shadow-2xl p-6">
                <div className="flex items-center gap-2 mb-6 text-white border-b border-white/5 pb-4">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold font-serif text-lg tracking-tight">Trending Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {trendingTags.map(tag => (
                        <span key={tag} className="inline-block px-3 py-1.5 bg-zinc-800/80 text-zinc-300 text-xs font-bold rounded-lg border border-white/5 hover:border-green-500/50 hover:text-white cursor-pointer transition-all shadow-lg active:scale-95">
                            {(tag.startsWith('#') || tag.startsWith('❓') || tag.startsWith('📝') || tag.startsWith('⭐') || tag.startsWith('⚠️') || tag.startsWith('✨') || tag.startsWith('🏔️') || tag.startsWith('🚗')) ? tag : `#${tag}`}
                        </span>
                    ))}
                </div>
            </div>

            {/* Editor's Pick */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm h-56 cursor-pointer group">
                <img
                    src={editorPick?.imageUrl ? `${editorPick.imageUrl}?tr=w-800,q-70,f-webp` : "https://ik.imagekit.io/y4v82f1t1/tr:w-800,q-70,f-webp/https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop"}
                    alt="Promo"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 opacity-90 text-amber-400">
                            <Bookmark className="w-4 h-4" fill="currentColor" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Editor&apos;s Pick</span>
                        </div>
                    </div>
                    <p className="font-bold font-serif text-lg leading-snug line-clamp-2 drop-shadow-md">
                        {editorPick ? editorPick.caption : "The 5 Best Homestays in Kurseong"}
                    </p>
                    {editorPick && (
                        <div className="flex items-center gap-1.5 mt-2 opacity-80">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            <span className="text-xs font-semibold">{editorPick.location}</span>
                        </div>
                    )}
                </div>
            </div>

        </aside>
    );
}
