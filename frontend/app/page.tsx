'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HeroSearch } from '@/components/hero-search';
import {
  ShieldCheck,
  MessageCircle,
  Mountain,
} from 'lucide-react';
import { WanderByRegion } from '@/components/wander-by-region';
import { DestinationDiscovery } from '@/components/destination-discovery';
import { SectionHeader } from '@/components/ui/section-header';

export default function Home() {
  return (
    <div className="relative -mt-[68px]">
      {/* ── Hero ── */}
      <HeroSearch />

      {/* ── Wander by Region (States) ── */}
      <section className="py-20 bg-background border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader
            pillText="WANDER BY REGION"
            title={<>Choose your <em>state of mind</em></>}
            subtitle="From misty hills to sacred lakes — each region holds its own magic."
          />
          <WanderByRegion />
        </div>
      </section>

      {/* ── Discover Destinations ── */}
      <section className="py-20 bg-[#FDFCFB] border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader
            pillText="DISCOVER DESTINATIONS"
            title="Where will you go next?"
            subtitle="Unwind in the most sought-after hills, valleys, and hidden hamlets of the East."
          />
          <DestinationDiscovery />
        </div>
      </section>

      {/* ── "Travel that feels personal" — 2 Large Bento Feature Cards ── */}
      <section className="py-24 bg-white border-t">
        <div className="container mx-auto px-4 max-w-6xl">
          <SectionHeader
            pillText="WHY NBHOMESTAYS"
            title="Travel that feels personal"
            subtitle="We believe the best memories come from authentic places and genuine connections."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 — Verified & Curated (warm linen) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50/30 border border-amber-200/60 rounded-[28px] p-10 md:p-12 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
            >
              {/* Subtle texture overlay */}
              <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzk5OCIvPjwvc3ZnPg==')]" />

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-amber-400 to-yellow-500 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Mountain className="w-7 h-7 text-white" />
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight font-heading">
                Verified. Curated.<br />Zero Middleman.
              </h3>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                We physically visit every property. No hidden fees, no platform markups. Every stay is scored for mountain views, jungle retreats, and local charm — our Vibe Score.
              </p>

              {/* Gold leaf accent */}
              <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-gradient-to-tl from-amber-300/20 to-transparent rounded-full blur-2xl" />
            </motion.div>

            {/* Card 2 — Direct to Host (deep navy) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/30 rounded-[28px] p-10 md:p-12 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-gradient-to-br from-violet-400 to-indigo-500 w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageCircle className="w-9 h-9 text-white" />
                </div>
              </div>

              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4 tracking-tight leading-tight font-heading">
                Talk Directly.<br />No Corporate Buffers.
              </h3>
              <p className="text-indigo-200/80 text-base md:text-lg leading-relaxed">
                Get the host&apos;s direct WhatsApp number. Negotiate, ask questions, and build a genuine connection before you even arrive. Powered by travelers, for travelers.
              </p>

              {/* Glow accent */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-tl from-violet-500/15 to-transparent rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
