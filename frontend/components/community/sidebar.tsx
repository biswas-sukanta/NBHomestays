import React from 'react';
import { Bookmark, Flame, MapPin, Award } from 'lucide-react';

export function CommunitySidebar() {
    return (
        <aside className="hidden lg:flex flex-col gap-6 sticky top-24">

            {/* Top Contributors */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4 text-gray-900 border-b border-gray-100 pb-3">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold font-serif text-lg tracking-tight">Top Contributors</h3>
                </div>
                <div className="space-y-4">
                    {[
                        { name: "Rahul S.", role: "Mountain Expert", initials: "RS", color: "from-blue-500 to-indigo-600" },
                        { name: "Priya Das", role: "Offbeat Explorer", initials: "PD", color: "from-rose-500 to-pink-600" },
                        { name: "Aman K.", role: "Local Guide", initials: "AK", color: "from-emerald-500 to-teal-600" },
                    ].map((user, i) => (
                        <div key={i} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-gray-200 transition-all`}>
                                {user.initials}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-800 group-hover:text-green-700 transition-colors leading-tight">{user.name}</p>
                                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">{user.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-zinc-50 rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4 text-gray-900 border-b border-zinc-200 pb-3">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold font-serif text-lg tracking-tight">Trending Tags</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {['#DarjeelingDiaries', '#Offbeat', '#HiddenWaterfalls', '#TeaGarden', '#WinterTrek', '#HomestayLife'].map(tag => (
                        <span key={tag} className="inline-block px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:text-black cursor-pointer transition-colors shadow-sm">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Featured Destinations Promo */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm h-48 cursor-pointer group">
                <img
                    src="https://ik.imagekit.io/y4v82f1t1/tr:w-800,q-70,f-webp/https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop"
                    alt="Promo"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex items-center gap-1.5 mb-1 opacity-90">
                        <Bookmark className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Editor&apos;s Pick</span>
                    </div>
                    <p className="font-bold font-serif text-lg leading-snug">The 5 Best Homestays in Kurseong</p>
                </div>
            </div>

        </aside>
    );
}
