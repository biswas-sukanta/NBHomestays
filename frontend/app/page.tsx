'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { HeroSearch } from '@/components/hero-search';
import { CategoryFilterBar } from '@/components/category-filter-bar';
import { HomestayCarousel } from '@/components/homestay-carousel';
import { HomestaySummary, HomestayCard } from '@/components/homestay-card';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowRight, MountainSnow, ShieldCheck, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// --- Features ---
const FEATURES = [
  {
    icon: MountainSnow,
    title: 'Curated by Vibe',
    desc: 'Every stay is handpicked and scored for its unique character — mountain views, jungle retreats, river vibes.',
    color: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Listings',
    desc: 'Our team physically visits and verifies every property so you can book with complete confidence.',
    color: 'from-amber-50 to-yellow-50',
    border: 'border-amber-100',
  },
  {
    icon: HeartHandshake,
    title: 'Direct to Host',
    desc: 'No middlemen. Enquire via WhatsApp and connect directly with your host for the best experience.',
    color: 'from-blue-50 to-indigo-50',
    border: 'border-blue-100',
  },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const currentTag = searchParams?.get('tag');

  const [loading, setLoading] = useState(true);
  const [searchGrid, setSearchGrid] = useState<HomestaySummary[]>([]);

  // Swimlane States
  const [trending, setTrending] = useState<HomestaySummary[]>([]);
  const [workations, setWorkations] = useState<HomestaySummary[]>([]);
  const [offbeat, setOffbeat] = useState<HomestaySummary[]>([]);

  useEffect(() => {
    const fetchFeeds = async () => {
      setLoading(true);
      try {
        if (currentTag) {
          const res = await api.get(`/api/homestays/search?tag=${encodeURIComponent(currentTag)}`);
          setSearchGrid(res.data);
        } else {
          const [res1, res2, res3] = await Promise.all([
            api.get('/api/homestays/search?tag=Trending Now'),
            api.get('/api/homestays/search?tag=Workation'),
            api.get('/api/homestays/search?tag=Explore Offbeat'),
          ]);
          setTrending(res1.data);
          setWorkations(res2.data);
          setOffbeat(res3.data);
        }
      } catch (err) {
        console.error("Failed to fetch feeds:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, [currentTag]);

  return (
    <div className="relative -mt-[68px]">
      {/* ── Hero ── */}
      <HeroSearch />

      {/* ── Global Category Filter ── */}
      <CategoryFilterBar />

      {/* ── Dynamic Content Feed ── */}
      <div className="min-h-[500px] py-10">
        {loading ? (
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[250px] w-full rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : currentTag ? (
          /* TAG SELECTED: Grid Feed View */
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                {currentTag}
              </h2>
              <span className="text-muted-foreground">{searchGrid.length} stays found</span>
            </div>

            {searchGrid.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchGrid.map((h, i) => (
                  <div key={h.id} className="h-full">
                    <HomestayCard homestay={h} index={i} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                <h3 className="text-xl font-bold mb-2 text-foreground">No stays found for this vibe</h3>
                <p className="text-muted-foreground">Try selecting a different category or exploring our trending stays.</p>
              </div>
            )}
          </div>
        ) : (
          /* NO TAG: Swimlane Layout */
          <div className="space-y-4">
            <HomestayCarousel
              title="🔥 Trending Now"
              description="The most booked and highly rated stays in North Bengal."
              homestays={trending}
            />
            <HomestayCarousel
              title="💻 Perfect for Workations"
              description="High-speed WiFi and dedicated workspaces amidst nature."
              homestays={workations}
            />
            <HomestayCarousel
              title="⛰️ Explore Offbeat"
              description="Hidden gems far away from the commercial hustle."
              homestays={offbeat}
            />
          </div>
        )}
      </div>

      {/* ── Why NBHomestays Features ── */}
      {!currentTag && (
        <section className="py-20 bg-background border-t">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/8 px-3 py-1 rounded-full">
                Why NBHomestays?
              </span>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
                Travel that feels personal
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We believe the best memories come from authentic places and genuine connections.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 }}
                    whileHover={{ y: -6, transition: { duration: 0.2 } }}
                    className={`
                                        relative bg-gradient-to-br ${f.color}
                                        border ${f.border}
                                        rounded-2xl p-7 shadow-sm hover:shadow-lg
                                        transition-shadow duration-300 overflow-hidden group
                                    `}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Banner ── */}
      {!currentTag && (
        <section className="py-20 bg-gradient-to-br from-primary to-[oklch(0.28_0.14_155)] border-t border-primary/20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="container mx-auto px-4 text-center max-w-2xl"
          >
            <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight">
              Ready to find your vibe?
            </h2>
            <p className="text-white/80 mb-10 text-lg">
              Dozens of verified homestays waiting to be discovered in the serene heights of North Bengal.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-white text-primary rounded-full hover:bg-gray-50 h-14 px-8 text-base shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <Link href="/search" className="gap-2 font-bold">
                See all listings <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </section>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-gray-50 flex items-center justify-center">Loading NBHomestays...</div>}>
      <HomeContent />
    </Suspense>
  );
}
