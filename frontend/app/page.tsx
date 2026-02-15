'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { HeroSearch } from '@/components/hero-search';

export default function Home() {
  return (
    <div className="relative -mt-[68px]">
      {/* Hero Section */}
      <HeroSearch />

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Choose Us?</h2>
            <p className="text-gray-600">We verify every homestay to ensure you have the best experience.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Authentic Experience", desc: "Live like a local with our handpicked hosts." },
              { title: "Verified Listings", desc: "Every home is physically verified by our team." },
              { title: "Community Driven", desc: "Join a community of travelers and hosts." }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
