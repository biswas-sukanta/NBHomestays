import React from 'react';
import { Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTopContributors } from '@/lib/api/feed';

export function CommunitySidebar() {
    const { data: topContributors = [] } = useQuery({
        queryKey: ['community', 'top-contributors'],
        queryFn: () => getTopContributors(3),
        staleTime: 60000,
    });

    return (
        <aside className="hidden lg:flex flex-col gap-6 sticky top-24">

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6 text-neutral-900 border-b border-neutral-100 pb-4">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold font-heading text-lg tracking-tight">Trending Travelers</h3>
                </div>
                <div className="space-y-4">
                    {topContributors.map((user, i) => (
                        <div key={user.id ?? i} className="flex items-center gap-3 cursor-pointer group">
                            <div className="w-7 text-[11px] font-black text-neutral-400 group-hover:text-neutral-600 transition-colors">
                                #{i + 1}
                            </div>
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-emerald-200 transition-all" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-emerald-200 transition-all">
                                    {(user.name || 'NB').slice(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors leading-tight truncate">{user.name}</p>
                                <p className="text-[11px] text-neutral-500 font-black uppercase tracking-widest">{user.postCount} stories</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </aside>
    );
}
