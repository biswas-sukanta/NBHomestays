'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeroSearch } from '@/components/hero-search';
import {
  ShieldCheck,
  MessageCircle,
  Mountain,
  Sparkles,
  HeartPulse,
  Zap,
  Umbrella,
  Users,
  MessageSquare,
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

      {/* ── NEW CONSOLIDATED SECTION 1: The Trust & Product Vibe ── */}
      <section className="py-24 bg-zinc-50 border-t overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader
            pillText={
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent font-black tracking-[0.2em] text-sm md:text-xs uppercase">
                TRUST THE UNFILTERED Vibe
              </span>
            }
            title={
              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                Origin & Direct Access
              </span>
            }
            subtitle="Crafted by a traveler, dedicated to the offbeat soul. Forget corporate lobbies. We built a direct marketplace for authenticity, allowing direct host-to-traveler communication and direct-to-host negotiation with zero hidden fees. Curated. Community-driven. Period."
          />

          <div className="mt-12 flex justify-center mb-16 relative z-20">
            <Link href="/search" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-gradient-to-r from-orange-500 to-blue-600 rounded-full shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] hover:scale-105 overflow-hidden ring-2 ring-white/20">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Explore All Stays <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
            {/* Bento Card 1 - The Origin */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-12 lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-10 md:p-14 rounded-[32px] overflow-hidden relative group hover:scale-[1.02] transition-transform duration-500 ring-1 ring-white/10 hover:ring-amber-500/50 hover:shadow-[0_0_40px_rgba(218,165,32,0.2)]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] group-hover:bg-amber-500/40 transition-all duration-700" />
              <div className="relative z-10 text-white flex flex-col justify-between h-full">
                <div className="bg-gradient-to-tr from-amber-500 to-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.5)] w-20 h-20 rounded-2xl flex flex-none items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                  <HeartPulse className="w-10 h-10 text-white drop-shadow-md" />
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 font-heading">
                    Crafted by Travelers
                  </h3>
                  <p className="text-indigo-100/90 text-lg md:text-xl leading-relaxed font-medium">
                    We've slept in these beds, eaten the local food, and verified the vibe. Every stay is handpicked for the untamed offbeat soul.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2 - Top Right (No Fees) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-6 lg:col-span-3 bg-white p-8 md:p-10 rounded-[32px] shadow-sm hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] ring-1 ring-gray-100 hover:ring-amber-400 transition-all duration-500 group flex flex-col items-start"
            >
              <div className="bg-gradient-to-br from-emerald-400 to-teal-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-md shadow-emerald-500/20 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 transition-all duration-500">
                <ShieldCheck className="w-8 h-8 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900 font-heading tracking-tight leading-tight">Zero<br />Platform Fees</h4>
              <p className="text-slate-600 font-medium">No corporate markups or hidden service charges. Pay exactly what the stay is worth.</p>
            </motion.div>

            {/* Bento Card 3 - Bottom Right (Direct Nego) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-6 lg:col-span-3 bg-white p-8 md:p-10 rounded-[32px] shadow-sm hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] ring-1 ring-gray-100 hover:ring-amber-400 transition-all duration-500 group flex flex-col items-start"
            >
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-md shadow-blue-500/20 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 transition-all duration-500">
                <MessageCircle className="w-8 h-8 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900 font-heading tracking-tight leading-tight">Direct<br />Negotiation</h4>
              <p className="text-slate-600 font-medium">Get the host's WhatsApp immediately. Talk, negotiate, and build a relationship before you pack.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NEW CONSOLIDATED SECTION 2: The Community Vibe Hub ── */}
      <section className="py-24 bg-gradient-to-br from-[#0d1522] via-[#101b2b] to-[#0a0f18] border-t relative overflow-hidden">
        {/* Abstract Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <SectionHeader
            pillText={
              <span className="text-indigo-300 font-black tracking-[0.2em] text-sm md:text-xs uppercase">
                JOIN THE OFFBEAT COMMUNITY Hub
              </span>
            }
            title={
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                One Umbrella for the Offbeat
              </span>
            }
            subtitle={
              <span className="text-indigo-100/80 max-w-3xl mx-auto block font-medium leading-relaxed">
                Fragmented travel groups are over. No more posting in ten different FB groups. Ask your query and get direct, unfiltered answers from real travelers and verified hosts—all under one roof. Curated. Community-driven. Period.
              </span>
            }
          />

          <div className="mt-12 flex justify-center mb-16 relative z-20">
            <Link href="/community" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-[0_0_40px_rgba(236,72,153,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 overflow-hidden ring-2 ring-white/20">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Join the Community Hub <Users className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Community Info Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-[32px] hover:scale-[1.02] hover:bg-white/10 hover:border-amber-400/60 hover:shadow-[0_0_40px_rgba(218,165,32,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-indigo-500/30 to-blue-500/30 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_30px_rgba(218,165,32,0.5)] border border-indigo-400/40 group-hover:border-transparent w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-8 transition-all duration-500">
                <Umbrella className="w-10 h-10 text-indigo-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-heading">The Single Roof</h4>
              <p className="text-indigo-200/80 text-lg font-medium leading-relaxed">One verified platform for stays, hidden gems, and real advice. No more platform-hopping.</p>
            </motion.div>

            {/* Community Info Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-[32px] hover:scale-[1.02] hover:bg-white/10 hover:border-amber-400/60 hover:shadow-[0_0_40px_rgba(218,165,32,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_30px_rgba(218,165,32,0.5)] border border-purple-400/40 group-hover:border-transparent w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-8 transition-all duration-500">
                <Users className="w-10 h-10 text-purple-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-heading">Real Travelers</h4>
              <p className="text-indigo-200/80 text-lg font-medium leading-relaxed">Connect directly with hosts and previous guests. Pure authenticity, zero corporate walls.</p>
            </motion.div>

            {/* Community Info Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-[32px] hover:scale-[1.02] hover:bg-white/10 hover:border-amber-400/60 hover:shadow-[0_0_40px_rgba(218,165,32,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-pink-500/30 to-rose-500/30 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_30px_rgba(218,165,32,0.5)] border border-pink-400/40 group-hover:border-transparent w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-8 transition-all duration-500">
                <MessageSquare className="w-10 h-10 text-pink-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-heading">Unfiltered Queries</h4>
              <p className="text-indigo-200/80 text-lg font-medium leading-relaxed">Ask anything. Is the road to Sandakphu open? Get straight answers from the source.</p>
            </motion.div>
          </div>
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
