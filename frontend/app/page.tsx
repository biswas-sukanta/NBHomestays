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
      <section className="py-32 bg-background border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader
            pillText="WANDER BY REGION"
            title={<span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">Choose your state of mind</span>}
            subtitle="From misty hills to sacred lakes — each region holds its own magic."
          />
          <WanderByRegion />
        </div>
      </section>

      {/* ── Discover Destinations ── */}
      <section className="py-32 bg-[#FDFCFB] border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <SectionHeader
            pillText="DISCOVER DESTINATIONS"
            title={<span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Where will you go next?</span>}
            subtitle="Unwind in the most sought-after hills, valleys, and hidden hamlets of the East."
          />
          <DestinationDiscovery />
        </div>
      </section>

      {/* ── NEW CONSOLIDATED SECTION 1: The Authentic Marketplace ── */}
      <section className="py-32 bg-zinc-50 border-t overflow-hidden relative">
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <SectionHeader
            pillText={
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent font-black tracking-[0.2em] text-sm md:text-xs uppercase">
                THE AUTHENTIC MARKETPLACE
              </span>
            }
            title={
              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 bg-clip-text text-transparent block mb-8 px-4">
                TRUST THE Vibe | Crafted for Direct Connection
              </span>
            }
            subtitle={
              <span className="text-slate-600 block text-lg md:text-xl font-medium leading-relaxed max-w-4xl mx-auto px-4">
                Crafted by a traveler, dedicated to the offbeat soul. Forget corporate lobbies. We built a direct marketplace for authenticity, allowing direct host-to-traveler communication and direct-to-host negotiation with zero hidden fees. Curated. Community-driven. Period.
              </span>
            }
          />

          <div className="mt-20 flex justify-center mb-24 relative z-20">
            <Link href="/search" className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold text-white transition-all duration-500 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:shadow-[0_0_80px_rgba(251,113,133,0.8)] hover:scale-110 overflow-hidden ring-4 ring-rose-400/50">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Explore All Stays <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-12 md:p-16 rounded-[32px] hover:scale-105 shadow-md ring-2 ring-gray-100/50 hover:ring-rose-500 hover:ring-offset-4 hover:shadow-[0_0_80px_rgba(251,113,133,0.5)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30 group-hover:shadow-[0_0_40px_rgba(251,113,133,0.8)] w-24 h-24 rounded-3xl flex flex-none items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110">
                <HeartPulse className="w-12 h-12 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight font-serif">Crafted by Travelers</h4>
              <p className="text-slate-600 text-xl font-medium leading-relaxed">Dedicated to the offbeat soul. We verified the vibe so you don't have to.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-12 md:p-16 rounded-[32px] hover:scale-105 shadow-md ring-2 ring-gray-100/50 hover:ring-blue-500 hover:ring-offset-4 hover:shadow-[0_0_80px_rgba(59,130,246,0.5)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg shadow-rose-500/30 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] w-24 h-24 rounded-3xl flex flex-none items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:from-blue-400 group-hover:to-cyan-500">
                <ShieldCheck className="w-12 h-12 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight font-serif">Zero Hidden Fees</h4>
              <p className="text-slate-600 text-xl font-medium leading-relaxed">No corporate markups or sneaky service charges. Pay the actual worth.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-12 md:p-16 rounded-[32px] hover:scale-105 shadow-md ring-2 ring-gray-100/50 hover:ring-yellow-400 hover:ring-offset-4 hover:shadow-[0_0_80px_rgba(250,204,21,0.5)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg shadow-purple-500/30 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.8)] w-24 h-24 rounded-3xl flex flex-none items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:from-yellow-400 group-hover:to-amber-500">
                <MessageCircle className="w-12 h-12 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight font-serif">Direct Negotiation</h4>
              <p className="text-slate-600 text-xl font-medium leading-relaxed">Direct host-to-traveler communication. Get the WhatsApp and build a connection.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NEW CONSOLIDATED SECTION 2: The Community Hub ── */}
      <section className="py-24 bg-gradient-to-br from-[#0a0f18] via-[#101b2b] to-[#0d1522] border-t relative overflow-hidden">
        {/* Abstract Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <SectionHeader
            pillText={
              <span className="text-cyan-300 font-black tracking-[0.2em] text-sm md:text-xs uppercase">
                THE COMMUNITY HUB
              </span>
            }
            title={
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent block mb-8 px-4">
                JOIN THE Hub | One Umbrella for the Offbeat
              </span>
            }
            subtitle={
              <span className="text-blue-100/90 block text-lg md:text-xl font-medium leading-relaxed max-w-4xl mx-auto px-4">
                Fragmented travel groups are over. No more multiple travel FB groups. Post your query and get direct unfiltered answers from real travelers and experts—all under one roof. Curated. Community-driven. Period.
              </span>
            }
          />

          <div className="mt-20 flex justify-center mb-24 relative z-20">
            <Link href="/community" className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-bold text-white transition-all duration-500 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:shadow-[0_0_80px_rgba(59,130,246,0.8)] hover:scale-110 overflow-hidden ring-4 ring-blue-500/50">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Join the Community Hub <Users className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 md:p-16 rounded-[32px] hover:scale-105 hover:bg-white/10 hover:border-blue-500 hover:shadow-[0_0_80px_rgba(59,130,246,0.5)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-blue-500/40 to-indigo-500/40 group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-cyan-500 group-hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] border border-blue-400/40 group-hover:border-transparent w-24 h-24 rounded-3xl flex flex-none items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110">
                <Umbrella className="w-12 h-12 text-blue-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-3xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-serif">Under One Roof</h4>
              <p className="text-blue-100 text-xl font-medium leading-relaxed">Forget fragmented FB groups. Experience verified stays and real advice all in one curated hub.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 md:p-16 rounded-[32px] hover:scale-105 hover:bg-white/10 hover:border-rose-500 hover:shadow-[0_0_80px_rgba(251,113,133,0.5)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-indigo-500/40 to-purple-500/40 group-hover:bg-gradient-to-br group-hover:from-rose-400 group-hover:to-pink-500 group-hover:shadow-[0_0_40px_rgba(251,113,133,0.8)] border border-indigo-400/40 group-hover:border-transparent w-24 h-24 rounded-3xl flex flex-none items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110">
                <Users className="w-12 h-12 text-indigo-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-3xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-serif">Real Travelers</h4>
              <p className="text-blue-100 text-xl font-medium leading-relaxed">Engage directly with experts and hosts. Absolute authenticity and zero corporate walls.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 md:p-16 rounded-[32px] hover:scale-105 hover:bg-white/10 hover:border-yellow-400 hover:shadow-[0_0_80px_rgba(250,204,21,0.5)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-purple-500/40 to-fuchsia-500/40 group-hover:bg-gradient-to-br group-hover:from-yellow-400 group-hover:to-amber-500 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.8)] border border-purple-400/40 group-hover:border-transparent w-24 h-24 rounded-3xl flex flex-none items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110">
                <MessageSquare className="w-12 h-12 text-purple-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-3xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-serif">Unfiltered Queries</h4>
              <p className="text-blue-100 text-xl font-medium leading-relaxed">Ask anything. Get straight, unfiltered answers immediately from the community source.</p>
            </motion.div>
          </div>
        </div>
      </section>



    </div>
  );
}
