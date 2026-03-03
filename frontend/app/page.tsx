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
      <section className="py-32 bg-slate-900 border-t border-slate-800 overflow-hidden relative">
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <SectionHeader
            titleClassName="text-3xl md:text-4xl"
            pillText={
              <span className="text-amber-400 font-black tracking-[0.2em] text-sm md:text-xs uppercase drop-shadow-sm">
                THE AUTHENTIC MARKETPLACE
              </span>
            }
            title={
              <span className="text-white block mb-6 px-4">
                TRUST THE <span className="bg-gradient-to-r from-amber-500 to-rose-500 bg-clip-text text-transparent">Vibe</span> | Crafted for Direct Connection
              </span>
            }
            subtitle={
              <span className="text-slate-300 block text-base md:text-lg leading-relaxed max-w-2xl mx-auto px-4">
                Skip the corporate lobbies. We built a direct marketplace for authenticity—no hidden fees, just direct host connections.
              </span>
            }
          />

          <div className="mt-12 flex justify-center mb-16 relative z-20">
            <Link href="/search" className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all duration-500 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_60px_rgba(251,113,133,0.7)] hover:scale-105 overflow-hidden ring-2 ring-rose-400/50">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Explore All Stays <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[32px] hover:scale-105 hover:bg-white/10 hover:border-rose-400/50 hover:shadow-[0_0_60px_rgba(251,113,133,0.3)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20 group-hover:shadow-[0_0_30px_rgba(251,113,133,0.6)] w-12 h-12 rounded-2xl flex flex-none items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110">
                <HeartPulse className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 tracking-tight font-serif">Crafted by Travelers</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Dedicated to the offbeat soul. We verified the vibe so you don't have to.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[32px] hover:scale-105 hover:bg-white/10 hover:border-blue-400/50 hover:shadow-[0_0_60px_rgba(59,130,246,0.3)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-rose-400 to-pink-500 shadow-md shadow-rose-500/20 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] w-12 h-12 rounded-2xl flex flex-none items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:from-blue-400 group-hover:to-cyan-500">
                <ShieldCheck className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 tracking-tight font-serif">Zero Hidden Fees</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">No corporate markups or sneaky service charges. Pay the actual worth.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[32px] hover:scale-105 hover:bg-white/10 hover:border-yellow-400/50 hover:shadow-[0_0_60px_rgba(250,204,21,0.3)] group transition-all duration-500 relative"
            >
              <div className="bg-gradient-to-br from-indigo-400 to-purple-500 shadow-md shadow-purple-500/20 group-hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] w-12 h-12 rounded-2xl flex flex-none items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:from-yellow-400 group-hover:to-amber-500">
                <MessageCircle className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 tracking-tight font-serif">Direct Negotiation</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">Direct host-to-traveler communication. Get the WhatsApp and build a connection.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── NEW CONSOLIDATED SECTION 2: The Community Hub ── */}
      <section className="py-24 bg-white border-t border-slate-100 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">
          <SectionHeader
            titleClassName="text-3xl md:text-4xl"
            pillText={
              <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-black tracking-[0.2em] text-sm md:text-xs uppercase">
                THE COMMUNITY HUB
              </span>
            }
            title={
              <span className="text-slate-900 block mb-6 px-4">
                JOIN THE <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Hub</span> | One Umbrella for the Offbeat
              </span>
            }
            subtitle={
              <span className="text-slate-600 block text-base leading-relaxed max-w-2xl mx-auto px-4">
                Ditch the fragmented groups. Get unfiltered answers from verified travelers and offbeat experts, all under one roof.
              </span>
            }
          />

          <div className="mt-12 flex justify-center mb-16 relative z-20">
            <Link href="/community" className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all duration-500 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(59,130,246,0.7)] hover:scale-105 overflow-hidden ring-2 ring-blue-500/50">
              <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                Join the Community Hub <Users className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white border border-slate-100 shadow-sm p-6 md:p-8 rounded-[32px] hover:-translate-y-1 hover:shadow-xl group transition-all duration-300 relative"
            >
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 group-hover:bg-gradient-to-br group-hover:from-blue-400 group-hover:to-cyan-400 w-12 h-12 rounded-2xl flex flex-none items-center justify-center mb-6 transition-all duration-300">
                <Umbrella className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-tight drop-shadow-sm font-serif">Under One Roof</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Forget fragmented FB groups. Experience verified stays and real advice all in one curated hub.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-slate-100 shadow-sm p-6 md:p-8 rounded-[32px] hover:-translate-y-1 hover:shadow-xl group transition-all duration-300 relative"
            >
              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 group-hover:bg-gradient-to-br group-hover:from-rose-400 group-hover:to-pink-400 w-12 h-12 rounded-2xl flex flex-none items-center justify-center mb-6 transition-all duration-300">
                <Users className="w-6 h-6 text-indigo-500 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-tight drop-shadow-sm font-serif">Real Travelers</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Engage directly with experts and hosts. Absolute authenticity and zero corporate walls.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-100 shadow-sm p-6 md:p-8 rounded-[32px] hover:-translate-y-1 hover:shadow-xl group transition-all duration-300 relative"
            >
              <div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 group-hover:bg-gradient-to-br group-hover:from-yellow-400 group-hover:to-amber-500 w-12 h-12 rounded-2xl flex flex-none items-center justify-center mb-6 transition-all duration-300">
                <MessageSquare className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 tracking-tight drop-shadow-sm font-serif">Unfiltered Queries</h4>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Ask anything. Get straight, unfiltered answers immediately from the community source.</p>
            </motion.div>
          </div>
        </div>
      </section>



    </div>
  );
}
