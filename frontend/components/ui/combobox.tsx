'use client';

import React, { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

export function CustomCombobox({ options, value, onChange, placeholder = "Select option...", className }: ComboboxProps) {
    const [query, setQuery] = useState('');

    const selectedOption = options.find((opt) => opt.id === value) || null;

    const filteredOptions =
        query === ''
            ? options
            : options.filter((opt) => {
                return opt.name.toLowerCase().includes(query.toLowerCase());
            });

    return (
        <div className={cn("relative w-full", className)}>
            <Combobox value={selectedOption} onChange={(opt: Option | null) => onChange(opt ? opt.id : '')}>
                <div className="relative w-full">
                    <Combobox.Input
                        className="w-full bg-emerald-50 border-none rounded-full pl-4 pr-10 py-2 text-sm font-semibold focus:outline-none focus:ring-0 text-emerald-700 placeholder:text-emerald-600/70 shadow-inner transition-all"
                        displayValue={(opt: Option) => opt?.name || ''}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={placeholder}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronsUpDown className="h-4 w-4 text-emerald-600/70" aria-hidden="true" />
                    </Combobox.Button>
                </div>

                <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                    {filteredOptions.length === 0 && query !== '' ? (
                        <div className="relative cursor-default select-none px-4 py-2 text-gray-700 text-sm">
                            Nothing found.
                        </div>
                    ) : (
                        filteredOptions.map((opt) => (
                            <Combobox.Option
                                key={opt.id}
                                className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 break-words whitespace-normal text-sm transition-colors ${active ? 'bg-green-50 text-green-900 font-medium' : 'text-gray-900'
                                    }`
                                }
                                value={opt}
                            >
                                {({ selected, active }) => (
                                    <>
                                        <span className={`block truncate ${selected ? 'font-medium text-green-700' : 'font-normal'}`}>
                                            {opt.name}
                                        </span>
                                        {selected ? (
                                            <span
                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-green-700' : 'text-green-600'
                                                    }`}
                                            >
                                                <Check className="h-4 w-4" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </Combobox.Option>
                        ))
                    )}
                </Combobox.Options>
            </Combobox>
        </div>
    );
}
