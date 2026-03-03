'use client';

import React from 'react';
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

      {/* ── NEW PHASE 4: Vibe Score Section ── */}
      <section className="py-24 bg-zinc-50 border-t overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader
            pillText={
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-purple-500 bg-clip-text text-transparent font-black tracking-[0.2em] text-sm uppercase">
                YOUR VIBE SCORE
              </span>
            }
            title={
              <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-purple-500 bg-clip-text text-transparent opacity-90">
                Unfiltered & Authentic
              </span>
            }
            subtitle="Forget default ratings. Vibe Score is our curated verification. We check the aura, the offbeat soul, and the authenticity, so you don't have to."
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-16 relative">
            {/* Bento Card 1 - Large spanning */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-12 lg:col-span-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-10 md:p-14 rounded-[32px] overflow-hidden relative group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] group-hover:bg-amber-500/30 transition-all duration-700" />
              <div className="relative z-10 text-white flex flex-col justify-between h-full">
                <div className="bg-gradient-to-tr from-amber-400 to-yellow-500 shadow-[0_0_30px_rgba(218,165,32,0.4)] w-20 h-20 rounded-2xl flex flex-none items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-5 font-heading">
                    The Aura Check
                  </h3>
                  <p className="text-indigo-100/90 text-lg md:text-xl leading-relaxed font-medium">
                    We personally verify the energy and vibe of every single homestay. If it feels mass-market or lacks soul, it doesn't make the cut. Period.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2 - Top Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-6 lg:col-span-3 bg-white border border-gray-100 p-8 md:p-10 rounded-[32px] shadow-sm hover:shadow-[0_0_30px_rgba(218,165,32,0.15)] hover:border-amber-300 transition-all duration-500 group flex flex-col items-start"
            >
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-md shadow-rose-500/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 transition-all duration-500">
                <HeartPulse className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900 font-heading tracking-tight leading-tight">Offbeat<br />Soul</h4>
              <p className="text-slate-600 font-medium">Built exclusively for those who seek the untamed corners of the mountains.</p>
            </motion.div>

            {/* Bento Card 3 - Bottom Right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-6 lg:col-span-3 bg-white border border-gray-100 p-8 md:p-10 rounded-[32px] shadow-sm hover:shadow-[0_0_30px_rgba(218,165,32,0.15)] hover:border-amber-300 transition-all duration-500 group flex flex-col items-start"
            >
              <div className="bg-gradient-to-br from-cyan-400 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-md shadow-blue-500/20 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 transition-all duration-500">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4 text-slate-900 font-heading tracking-tight leading-tight">No<br />BS</h4>
              <p className="text-slate-600 font-medium">100% authentic photos. 100% real stories. Zero corporate fluff.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NEW PHASE 5: Community Purpose ── */}
      <section className="py-24 bg-gradient-to-br from-[#0d1522] via-[#101b2b] to-[#0a0f18] border-t relative overflow-hidden">
        {/* Abstract Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <SectionHeader
            pillText={
              <span className="text-indigo-300 font-black tracking-[0.2em] text-sm uppercase">
                OUR COMMUNITY PURPOSE
              </span>
            }
            title={
              <span className="bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent opacity-90">
                One Umbrella for the Offbeat
              </span>
            }
            subtitle={
              <span className="text-indigo-100/70 max-w-3xl mx-auto block font-medium">
                Ditch the massive travel FB groups. Stop posting your queries in ten different places. This is the offbeat community. Connect directly. Post your queries. Get unfiltered answers from real travelers and experts—all under one roof. Curated. Community-driven. Period.
              </span>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-10 md:p-12 rounded-[32px] hover:bg-white/10 hover:border-amber-400/50 hover:shadow-[0_0_30px_rgba(218,165,32,0.2)] group transition-all duration-500"
            >
              <div className="bg-indigo-500/20 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] border border-indigo-400/30 group-hover:border-transparent w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-8 transition-all duration-500">
                <Umbrella className="w-10 h-10 text-indigo-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">Under One Roof</h4>
              <p className="text-indigo-200/70 text-lg font-medium leading-relaxed">One verified platform for stays, hidden gems, and real advice.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-10 md:p-12 rounded-[32px] hover:bg-white/10 hover:border-amber-400/50 hover:shadow-[0_0_30px_rgba(218,165,32,0.2)] group transition-all duration-500"
            >
              <div className="bg-purple-500/20 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] border border-purple-400/30 group-hover:border-transparent w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-8 transition-all duration-500">
                <Users className="w-10 h-10 text-purple-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">Real Travelers</h4>
              <p className="text-indigo-200/70 text-lg font-medium leading-relaxed">Connect directly with hosts and guests. No corporate walls.</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-10 md:p-12 rounded-[32px] hover:bg-white/10 hover:border-amber-400/50 hover:shadow-[0_0_30px_rgba(218,165,32,0.2)] group transition-all duration-500"
            >
              <div className="bg-pink-500/20 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_20px_rgba(218,165,32,0.4)] border border-pink-400/30 group-hover:border-transparent w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-8 transition-all duration-500">
                <MessageSquare className="w-10 h-10 text-pink-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">Unfiltered Queries</h4>
              <p className="text-indigo-200/70 text-lg font-medium leading-relaxed">Ask questions. Get straight answers from the source.</p>
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
