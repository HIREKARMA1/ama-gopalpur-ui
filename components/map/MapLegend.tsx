'use client';

import type { ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

const PANEL_CLASS =
  'absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 z-10';

export function MapLegendPanel({
  children,
  className = 'md:max-w-[280px]',
}: {
  children: ReactNode;
  className?: string;
}) {
  const { language } = useLanguage();
  return (
    <div className={`${PANEL_CLASS} ${className}`}>
      <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">{children}</ul>
    </div>
  );
}

export function MapLegendRow({
  label,
  dotColor,
  isSelected,
  onClick,
  title,
  roundedRect,
}: {
  label: ReactNode;
  dotColor: string;
  isSelected: boolean;
  onClick: () => void;
  title: string;
  /** Roads-style legend uses a short wide chip */
  roundedRect?: boolean;
}) {
  const dot = (
    <span
      className={`inline-block shrink-0 ${roundedRect ? 'h-2 w-3 rounded-sm' : 'h-2 w-2 rounded-full'}`}
      style={{ backgroundColor: dotColor }}
    />
  );
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${
          isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'
        }`}
      >
        {dot}
        {label}
      </button>
    </li>
  );
}
