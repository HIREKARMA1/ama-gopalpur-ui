'use client';

import { useEffect, useRef, useState } from 'react';

export interface SearchableSelectOption {
  value: number | string;
  label: string;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: number | string | '';
  onChange: (value: number | string | '') => void;
  placeholder: string;
  required?: boolean;
  className?: string;
  /** Optional id for the trigger (for form validation / required). */
  id?: string;
  /** Text when search has no results (e.g. translated "No matches"). */
  noResultsText?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  id,
  noResultsText = 'No matches',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = value !== '' ? options.find((o) => o.value === value) : null;
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const searchLower = search.trim().toLowerCase();
  const filteredOptions =
    searchLower === ''
      ? options
      : options.filter((o) => o.label.toLowerCase().includes(searchLower));

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  const handleSelect = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-amber-300 bg-white px-3 py-2 text-left text-slate-800 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={placeholder}
      >
        <span className={selectedOption ? 'font-medium' : 'text-slate-500'}>
          {displayLabel}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-1 max-h-72 overflow-hidden rounded-md border border-amber-200 bg-white shadow-lg"
          role="listbox"
        >
          <div className="sticky top-0 border-b border-amber-100 bg-amber-50/80 p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              autoFocus
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500">{noResultsText}</li>
            ) : (
              filteredOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === opt.value}
                    onClick={() => handleSelect(opt)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${value === opt.value
                        ? 'bg-amber-100 font-medium text-amber-900'
                        : 'text-slate-800 hover:bg-amber-50'
                      }`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

    </div>
  );
}

