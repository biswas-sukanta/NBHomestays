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
    disabled?: boolean;
    loading?: boolean;
}

export function CustomCombobox({ options, value, onChange, placeholder = "Tag Homestay", className, disabled = false, loading = false }: ComboboxProps) {
    const [query, setQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

    const selectedOption = options.find((opt) => opt.id === value) || null;
    const isDisabled = disabled || loading;

    useEffect(() => { setMounted(true); }, []);

    const filteredOptions =
        query === ''
            ? options
            : options.filter((opt) => opt.name.toLowerCase().includes(query.toLowerCase()));

    // Recalculate position whenever the combobox opens — flips upward if not enough room
    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const menuHeight = 260; // max-h-60 = 15rem = 240px + buffer
        const spaceBelow = window.innerHeight - rect.bottom;
        const flipUp = spaceBelow < menuHeight && rect.top > spaceBelow;

        setMenuPos({
            top: flipUp
                ? rect.top + window.scrollY - menuHeight - 4
                : rect.bottom + window.scrollY + 4,
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
                    className="inline-flex items-center gap-2.5 bg-zinc-900 text-white pl-4 pr-2.5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300 cursor-default group ring-1 ring-white/5"
                >
                    <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="max-w-[200px] sm:max-w-[260px] truncate">{selectedOption.name}</span>
                    <button
                        onClick={handleClear}
                        data-testid="homestay-clear-btn"
                        className="w-6 h-6 rounded-full bg-zinc-800 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all duration-200 ml-1 flex-shrink-0 border border-white/5 active:scale-90"
                        aria-label="Clear homestay tag"
                    >
                        <X className="w-3.5 h-3.5" />
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
                                    className={cn(
                                        "w-full bg-zinc-900/50 border border-white/10 rounded-2xl pl-11 pr-11 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 text-white placeholder:text-zinc-600 transition-all duration-300 hover:bg-zinc-900 shadow-2xl",
                                        isDisabled && "opacity-50 cursor-not-allowed"
                                    )}
                                    displayValue={(opt: Option) => opt?.name || ''}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder={loading ? 'Loading homestays...' : placeholder}
                                    autoComplete="off"
                                    disabled={isDisabled}
                                />
                                {loading ? (
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 animate-pulse pointer-events-none" />
                                ) : (
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 pointer-events-none" />
                                )}
                                <Combobox.Button
                                    data-testid="homestay-combobox-btn"
                                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                                    disabled={isDisabled}
                                >
                                    <ChevronsUpDown className="h-4 w-4 text-zinc-500" aria-hidden="true" />
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
                                        className="fixed max-h-64 overflow-auto rounded-2xl bg-zinc-900 py-2 text-base shadow-[0_30px_90px_rgba(0,0,0,0.6)] ring-1 ring-white/10 focus:outline-none sm:text-sm backdrop-blur-3xl scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
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
                                                            'relative cursor-pointer select-none py-3.5 pl-11 pr-5 transition-all duration-200',
                                                            active ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                                                        )
                                                    }
                                                    value={opt}
                                                >
                                                    {({ selected, active }) => (
                                                        <>
                                                            <span className={cn(
                                                                'block whitespace-normal break-words text-sm font-bold tracking-tight leading-snug',
                                                                selected ? 'text-green-500' : 'text-inherit'
                                                            )}>
                                                                {opt.name}
                                                            </span>
                                                            {selected && (
                                                                <span className={cn(
                                                                    'absolute inset-y-0 left-0 flex items-center pl-4',
                                                                    active ? 'text-green-400' : 'text-green-500'
                                                                )}>
                                                                    <Check className="h-5 h-5 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" aria-hidden="true" />
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
