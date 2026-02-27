'use client';

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Combobox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown, MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    id: string;
    name: string;
}

interface ComboboxProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function CustomCombobox({ options, value, onChange, placeholder = "Tag Homestay", className }: ComboboxProps) {
    const [query, setQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

    const selectedOption = options.find((opt) => opt.id === value) || null;

    useEffect(() => { setMounted(true); }, []);

    const filteredOptions =
        query === ''
            ? options
            : options.filter((opt) => opt.name.toLowerCase().includes(query.toLowerCase()));

    // Recalculate position whenever the combobox opens
    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: Math.max(rect.width, 280),
        });
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setQuery('');
    };

    // ── Selected Pill View ───────────────────────────────────────
    if (selectedOption) {
        return (
            <div className={cn("relative", className)}>
                <div
                    data-testid="homestay-selected-pill"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 pl-3 pr-2 py-2 rounded-full text-sm font-semibold shadow-sm border border-green-200/60 hover:shadow-md transition-all duration-200 cursor-default group"
                >
                    <MapPin className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <span className="max-w-[200px] sm:max-w-[260px] truncate">{selectedOption.name}</span>
                    <button
                        onClick={handleClear}
                        data-testid="homestay-clear-btn"
                        className="w-5 h-5 rounded-full bg-green-200/70 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors duration-150 ml-0.5 flex-shrink-0"
                        aria-label="Clear homestay tag"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            </div>
        );
    }

    // ── Search Combobox View ─────────────────────────────────────
    return (
        <div className={cn("relative w-full", className)} ref={triggerRef}>
            <Combobox value={selectedOption} onChange={(opt: Option | null) => { onChange(opt ? opt.id : ''); setQuery(''); }}>
                {({ open }) => {
                    // Update portal position when opening
                    if (open) {
                        // Schedule position update after render
                        setTimeout(updatePosition, 0);
                    }
                    return (
                        <>
                            <div className="relative w-full">
                                <Combobox.Input
                                    data-testid="homestay-combobox-input"
                                    className="w-full bg-emerald-50/80 border border-emerald-200/50 rounded-full pl-9 pr-10 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 text-gray-800 placeholder:text-emerald-600/60 transition-all duration-200 hover:bg-emerald-50"
                                    displayValue={(opt: Option) => opt?.name || ''}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder={placeholder}
                                    autoComplete="off"
                                />
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                                <Combobox.Button
                                    data-testid="homestay-combobox-btn"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                >
                                    <ChevronsUpDown className="h-4 w-4 text-emerald-500/80" aria-hidden="true" />
                                </Combobox.Button>
                            </div>

                            {/* ── Portal-Rendered Dropdown ─────────────── */}
                            {mounted && createPortal(
                                <Transition
                                    as={Fragment}
                                    show={open}
                                    enter="transition ease-out duration-150"
                                    enterFrom="opacity-0 translate-y-1"
                                    enterTo="opacity-100 translate-y-0"
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100 translate-y-0"
                                    leaveTo="opacity-0 translate-y-1"
                                    afterEnter={updatePosition}
                                >
                                    <Combobox.Options
                                        static
                                        data-testid="homestay-dropdown"
                                        className="fixed max-h-60 overflow-auto rounded-xl bg-white py-1.5 text-base shadow-2xl shadow-black/10 ring-1 ring-black/5 focus:outline-none sm:text-sm backdrop-blur-sm"
                                        style={{
                                            top: menuPos.top,
                                            left: menuPos.left,
                                            width: menuPos.width,
                                            zIndex: 99999,
                                            maxWidth: 'calc(100vw - 2rem)',
                                        }}
                                    >
                                        {filteredOptions.length === 0 && query !== '' ? (
                                            <div className="relative cursor-default select-none px-4 py-3 text-gray-500 text-sm italic">
                                                No homestays match &ldquo;{query}&rdquo;
                                            </div>
                                        ) : (
                                            filteredOptions.map((opt) => (
                                                <Combobox.Option
                                                    key={opt.id}
                                                    data-testid={`combobox-option-${opt.id}`}
                                                    className={({ active }) =>
                                                        cn(
                                                            'relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors duration-100',
                                                            active ? 'bg-green-50 text-green-900' : 'text-gray-800'
                                                        )
                                                    }
                                                    value={opt}
                                                >
                                                    {({ selected, active }) => (
                                                        <>
                                                            <span className={cn(
                                                                'block whitespace-normal break-words text-sm leading-snug',
                                                                selected ? 'font-semibold text-green-700' : 'font-normal'
                                                            )}>
                                                                {opt.name}
                                                            </span>
                                                            {selected && (
                                                                <span className={cn(
                                                                    'absolute inset-y-0 left-0 flex items-center pl-3',
                                                                    active ? 'text-green-700' : 'text-green-600'
                                                                )}>
                                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </Combobox.Option>
                                            ))
                                        )}
                                    </Combobox.Options>
                                </Transition>,
                                document.body
                            )}
                        </>
                    );
                }}
            </Combobox>
        </div>
    );
}
