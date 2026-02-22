'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PoliciesSectionProps {
    policies?: string[];
}

export function PoliciesSection({ policies }: PoliciesSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!policies || policies.length === 0) return null;

    const limit = 5;
    const isExpandable = policies.length > limit;
    const visiblePolicies = isExpanded ? policies : policies.slice(0, limit);

    return (
        <div className="py-8 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900">House rules & Policies</h2>
            <div className="flex flex-col text-gray-700">
                <AnimatePresence initial={false}>
                    {visiblePolicies.map((policy, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-start gap-4 mb-4"
                        >
                            <span className="bg-primary/10 p-1 rounded-full shrink-0">
                                <Check className="w-4 h-4 text-primary" strokeWidth={3} />
                            </span>
                            <span className="text-base text-gray-800 leading-snug">{policy}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {isExpandable && (
                <Button
                    variant="ghost"
                    className="mt-2 p-0 h-auto font-semibold text-gray-900 flex items-center gap-1 hover:bg-transparent hover:underline text-base"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? 'Show less' : `Read more (${policies.length - limit})`}
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
            )}
        </div>
    );
}
