'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export interface MapBlockOption {
  value: string;
  label: string;
}

export function MapBlockFilter({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  options: MapBlockOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? options[0]?.label ?? '',
    [options, value],
  );

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-auto relative flex items-center gap-2 rounded-sm bg-white/95 px-2 py-1.5 shadow-sm ring-1 ring-slate-200"
    >
      <label className="text-xs font-medium text-slate-600">
        {language === 'or' ? 'ବ୍ଲକ' : 'Block'}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className="flex min-w-[170px] items-center justify-between rounded border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-slate-400 disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <ChevronDown size={14} className={`ml-2 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="absolute left-[56px] top-full z-40 mt-1 min-w-[170px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
          <div role="listbox" className="max-h-60 overflow-y-auto py-1 text-sm">
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left ${active ? 'bg-primary text-primary-foreground' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
