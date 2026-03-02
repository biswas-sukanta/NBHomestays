'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HeroSearch } from '@/components/hero-search';
import {
  MountainSnow,
  ShieldCheck,
  HeartHandshake,
  ArrowRight,
  Wallet,
  MessageCircle,
  Users,
  Tent
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WanderByRegion } from '@/components/wander-by-region';
import { DestinationDiscovery } from '@/components/destination-discovery';

// --- Hard-Hitting Value Propositions ---
const VALUE_PROPS = [
  {
    icon: Wallet,
    title: 'Zero Middleman Fees',
    desc: 'Completely free to use. No hidden booking fees or platform markups. Keep your money for the trip.',
    color: 'from-emerald-50/80 to-teal-50/50',
    border: 'border-emerald-100/50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: MessageCircle,
    title: 'Direct to Host',
    desc: "No corporate buffers. Get the host's direct WhatsApp number to negotiate and connect instantly.",
    color: 'from-blue-50/80 to-indigo-50/50',
    border: 'border-blue-100/50',
    iconColor: 'text-blue-600',
  },
  {
    icon: ShieldCheck,
    title: '100% Verified Stays',
    desc: "We physically visit properties. If it’s on our platform, it exists and meets our standards.",
    color: 'from-amber-50/80 to-yellow-50/50',
    border: 'border-amber-100/50',
    iconColor: 'text-amber-600',
  },
  {
    icon: MountainSnow,
    title: 'The Vibe Score',
    desc: 'Handpicked for character. Every stay is scored for mountain views, jungle retreats, and local charm.',
    color: 'from-purple-50/80 to-fuchsia-50/50',
    border: 'border-purple-100/50',
    iconColor: 'text-purple-600',
  },
  {
    icon: Users,
    title: 'Community-Driven',
    desc: 'Powered by travelers. Get real-time alerts, hidden gems, and honest reviews from the offbeat community.',
    color: 'from-rose-50/80 to-pink-50/50',
    border: 'border-rose-100/50',
    iconColor: 'text-rose-600',
  },
  {
    icon: Tent,
    title: 'Made for Homestay Lovers',
    desc: "We don't do commercial hotels. We strictly curate authentic, soul-touching local experiences.",
    color: 'from-orange-50/80 to-amber-50/50',
    border: 'border-orange-100/50',
    iconColor: 'text-orange-600',
  },
];

export default function Home() {
  return (
    <div className="relative -mt-[68px]">
      {/* ── Hero ── */}
      <HeroSearch />



      {/* ── Wander by Region (States) ── */}
      <section className="py-20 bg-background border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center w-full max-w-3xl mx-auto mb-6">
              <div className="h-px bg-border/60 flex-grow"></div>
              <span className="px-5 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-emerald-800 bg-emerald-50/50 border border-emerald-100/50 rounded-full mx-4 py-1.5">
                Wander By Region
              </span>
              <div className="h-px bg-border/60 flex-grow"></div>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight mb-4 font-heading italic">
              Choose your state of mind
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-base md:text-lg font-medium">
              From misty hills to sacred lakes — each region holds its own magic.
            </p>
          </motion.div>
          <WanderByRegion />
        </div>
      </section>

      {/* ── Discover Destinations ── */}
      <section className="py-20 bg-[#FDFCFB] border-t">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/8 px-3 py-1 rounded-full">
              Discover Destinations
            </span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-3 font-heading">
              Where will you go next?
            </h2>
          </motion.div>
          <DestinationDiscovery />
        </div>
      </section>

      {/* ── Why NBHomestays Redesign (6-Card Grid) ── */}
      <section className="py-24 bg-white border-t">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/8 px-3 py-1 rounded-full">
              Why NBHomestays?
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4 font-heading">
              A better way to discover stays.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light">
              We built this platform to fix everything wrong with modern travel booking. No hidden fees, no fake reviews, just authentic connections.
            </p>
          </motion.div>

          {/* Bento-style 6 Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUE_PROPS.map((prop, i) => {
              const Icon = prop.icon;
              return (
                <motion.div
                  key={prop.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`
                    relative bg-gradient-to-br ${prop.color}
                    border ${prop.border}
                    rounded-3xl p-8 shadow-sm hover:shadow-xl
                    transition-all duration-300 group overflow-hidden
                  `}
                >
                  <div className="bg-white/80 backdrop-blur-sm w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className={`w-7 h-7 ${prop.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3 tracking-tight">
                    {prop.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed font-light">
                    {prop.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-20 bg-gradient-to-br from-primary to-[oklch(0.28_0.14_155)] border-t border-primary/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center max-w-2xl"
        >
          <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight font-heading">
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
            <Link href="/search" className="gap-2 font-bold" prefetch={true}>
              Explore listings <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </section>
    </div>
  );
}
