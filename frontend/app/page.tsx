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

      {/* ── NEW CONSOLIDATED SECTION 1: The Authentic Marketplace ── */}
      <section className="py-24 bg-zinc-50 border-t overflow-hidden relative">
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <SectionHeader
            pillText={
              <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent font-black tracking-[0.2em] text-sm md:text-xs uppercase">
                THE AUTHENTIC MARKETPLACE
              </span>
            }
            title={
              <span className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 bg-clip-text text-transparent text-5xl md:text-6xl font-black tracking-tight font-heading block mb-6 px-4">
                TRUST THE Vibe | Crafted for Direct Connection
              </span>
            }
            subtitle={
              <span className="text-slate-600 block text-lg md:text-xl font-medium leading-relaxed max-w-4xl mx-auto px-4">
                Crafted by a traveler, dedicated to the offbeat soul. Forget corporate lobbies. We built a direct marketplace for authenticity, allowing direct host-to-traveler communication and direct-to-host negotiation with zero hidden fees. Curated. Community-driven. Period.
              </span>
            }
          />

          <div className="mt-12 flex justify-center mb-16 relative z-20">
            <Link href="/search" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:shadow-[0_0_60px_rgba(244,63,94,0.7)] hover:scale-105 overflow-hidden ring-2 ring-white/30">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Explore All Stays <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-10 md:p-12 rounded-[32px] hover:scale-[1.02] shadow-sm ring-1 ring-gray-100 hover:ring-amber-400/60 hover:shadow-[0_0_40px_rgba(218,165,32,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] w-20 h-20 rounded-2xl flex flex-none items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110">
                <HeartPulse className="w-10 h-10 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight font-heading">Crafted by Travelers</h4>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">Dedicated to the offbeat soul. We verified the vibe so you don't have to.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-10 md:p-12 rounded-[32px] hover:scale-[1.02] shadow-sm ring-1 ring-gray-100 hover:ring-rose-400/60 hover:shadow-[0_0_40px_rgba(244,63,94,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 shadow-md shadow-rose-500/20 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] w-20 h-20 rounded-2xl flex flex-none items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110">
                <ShieldCheck className="w-10 h-10 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight font-heading">Zero Hidden Fees</h4>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">No corporate markups or sneaky service charges. Pay the actual worth.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-10 md:p-12 rounded-[32px] hover:scale-[1.02] shadow-sm ring-1 ring-gray-100 hover:ring-purple-400/60 hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-indigo-400 to-purple-500 shadow-md shadow-purple-500/20 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] w-20 h-20 rounded-2xl flex flex-none items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110">
                <MessageCircle className="w-10 h-10 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight font-heading">Direct Negotiation</h4>
              <p className="text-slate-600 text-lg font-medium leading-relaxed">Direct host-to-traveler communication. Get the WhatsApp and build a connection.</p>
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
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent text-5xl md:text-6xl font-black tracking-tight font-heading block mb-6 px-4">
                JOIN THE Hub | One Umbrella for the Offbeat
              </span>
            }
            subtitle={
              <span className="text-blue-100/90 block text-lg md:text-xl font-medium leading-relaxed max-w-4xl mx-auto px-4">
                Fragmented travel groups are over. No more multiple travel FB groups. Post your query and get direct unfiltered answers from real travelers and experts—all under one roof. Curated. Community-driven. Period.
              </span>
            }
          />

          <div className="mt-12 flex justify-center mb-16 relative z-20">
            <Link href="/community" className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white transition-all duration-300 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:shadow-[0_0_60px_rgba(139,92,246,0.7)] hover:scale-105 overflow-hidden ring-2 ring-white/30">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Join the Community Hub <Users className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-[32px] hover:scale-[1.02] hover:bg-white/10 hover:border-amber-400/60 hover:shadow-[0_0_40px_rgba(218,165,32,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-blue-500/30 to-indigo-500/30 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_30px_rgba(218,165,32,0.6)] border border-blue-400/40 group-hover:border-transparent w-20 h-20 rounded-2xl flex flex-none items-center justify-center mb-8 transition-all duration-500">
                <Umbrella className="w-10 h-10 text-blue-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-heading">Under One Roof</h4>
              <p className="text-blue-200/80 text-lg font-medium leading-relaxed">Forget fragmented FB groups. Experience verified stays and real advice all in one curated hub.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-[32px] hover:scale-[1.02] hover:bg-white/10 hover:border-amber-400/60 hover:shadow-[0_0_40px_rgba(218,165,32,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-indigo-500/30 to-purple-500/30 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_30px_rgba(218,165,32,0.6)] border border-indigo-400/40 group-hover:border-transparent w-20 h-20 rounded-2xl flex flex-none items-center justify-center mb-8 transition-all duration-500">
                <Users className="w-10 h-10 text-indigo-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-heading">Real Travelers</h4>
              <p className="text-blue-200/80 text-lg font-medium leading-relaxed">Engage directly with experts and hosts. Absolute authenticity and zero corporate walls.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-[32px] hover:scale-[1.02] hover:bg-white/10 hover:border-amber-400/60 hover:shadow-[0_0_40px_rgba(218,165,32,0.3)] group transition-all duration-500"
            >
              <div className="bg-gradient-to-br from-purple-500/30 to-fuchsia-500/30 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:shadow-[0_0_30px_rgba(218,165,32,0.6)] border border-purple-400/40 group-hover:border-transparent w-20 h-20 rounded-2xl flex flex-none items-center justify-center mb-8 transition-all duration-500">
                <MessageSquare className="w-10 h-10 text-purple-300 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-4 tracking-tight drop-shadow-sm font-heading">Unfiltered Queries</h4>
              <p className="text-blue-200/80 text-lg font-medium leading-relaxed">Ask anything. Get straight, unfiltered answers immediately from the community source.</p>
            </motion.div>
          </div>
        </div>
      </section>



    </div>
  );
}
