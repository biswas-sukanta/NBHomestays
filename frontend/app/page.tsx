'use client';

import { motion } from 'framer-motion';
import { HeroSearch } from '@/components/hero-search';
import { MapPin, Star, Shield, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  {
    emoji: '🏔️',
    title: 'Curated by Vibe',
    desc: 'Every stay is handpicked and scored for its unique character — mountain views, jungle retreats, river vibes.',
    color: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
  },
  {
    emoji: '✅',
    title: 'Verified Listings',
    desc: 'Our team physically visits and verifies every property so you can book with complete confidence.',
    color: 'from-amber-50 to-yellow-50',
    border: 'border-amber-100',
  },
  {
    emoji: '💬',
    title: 'Direct to Host',
    desc: 'No middlemen. Enquire via WhatsApp and connect directly with your host for the best, most personal experience.',
    color: 'from-green-50 to-lime-50',
    border: 'border-green-100',
  },
];

const VIBES = [
  { label: '🏔️ Mountain', href: '/search?query=Mountain' },
  { label: '🌿 Forest', href: '/search?query=Forest' },
  { label: '🏞️ River', href: '/search?query=River' },
  { label: '🌄 Sunrise', href: '/search?query=Sunrise' },
];

export default function Home() {
  return (
    <div className="relative -mt-[68px]">
      {/* ── Hero ── */}
      <HeroSearch />

      {/* ── Explore by Vibe strip ── */}
      <section className="py-12 bg-secondary/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-7"
          >
            <h2 className="text-2xl font-extrabold text-foreground">Explore by Vibe</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">Pick your kind of escape</p>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {VIBES.map((v, i) => (
              <motion.div
                key={v.href}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={v.href} className="pill pill-default text-base hover:shadow-sm">
                  {v.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/8 px-3 py-1 rounded-full">
              Why NBHomestays
            </span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
              Travel that feels personal
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              We believe the best memories come from authentic places and genuine connections.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
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
                                    transition-shadow duration-300 overflow-hidden
                                `}
              >
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 bg-gradient-to-br from-primary to-[oklch(0.28_0.14_155)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center max-w-2xl"
        >
          <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">
            Ready to find your vibe?
          </h2>
          <p className="text-white/75 mb-8 text-lg">
            Dozens of verified homestays waiting to be discovered in North Bengal.
          </p>
          <Link
            href="/search"
            id="explore-cta-btn"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-4 rounded-full text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200"
          >
            Explore All Stays <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
