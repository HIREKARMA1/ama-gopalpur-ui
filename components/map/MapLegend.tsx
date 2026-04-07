'use client';

import type { ReactNode, MouseEventHandler } from 'react';
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
  count,
  dotClassName,
}: {
  label: ReactNode;
  dotColor: string;
  isSelected: boolean;
  onClick: MouseEventHandler<HTMLButtonElement>;
  title: string;
  /** Roads-style legend uses a short wide chip */
  roundedRect?: boolean;
  /** When set, label is shown as "label: count" (counts from loaded map data / API). */
  count?: number;
  /** Optional extra classes for the color swatch (e.g. size). */
  dotClassName?: string;
}) {
  const dotShape = roundedRect ? 'h-2 w-3 rounded-sm' : 'h-2 w-2 rounded-full';
  const dot = (
    <span
      className={`inline-block shrink-0 ${dotShape} ${dotClassName ?? ''}`}
      style={{ backgroundColor: dotColor }}
    />
  );
  const text =
    count !== undefined ? (
      <span className="tabular-nums">
        {label}: {count}
      </span>
    ) : (
      label
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
        {text}
      </button>
    </li>
  );
}
