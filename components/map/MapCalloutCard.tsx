'use client';

import type { ReactNode } from 'react';

export interface MapCalloutAction {
  label: string;
  onClick: () => void;
}

export interface MapCalloutCardProps {
  /** Primary heading (facility name, road name, etc.) */
  title: string;
  /**
   * Category / type chip under the title. Pass a string for the default pill style,
   * or a ReactNode for full control.
   */
  badge?: ReactNode;
  /** Secondary content: address, codes, sector lines */
  meta?: ReactNode;
  /** Full-width primary button (e.g. View profile) */
  action?: MapCalloutAction;
  className?: string;
}

/**
 * Content card for Google Maps InfoWindows (and any compact map popovers).
 * Uses AMA GOPALPUR orange accent; single surface — no nested “box in a box”.
 */
export function MapCalloutCard({ title, badge, meta, action, className = '' }: MapCalloutCardProps) {
  return (
    <div
      className={[
        'min-w-[220px] max-w-[288px] overflow-hidden rounded-xl border border-slate-200/95',
        'bg-white shadow-[0_10px_40px_-10px_rgba(15,23,42,0.18),0_0_0_1px_rgba(15,23,42,0.04)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500"
        aria-hidden
      />
      <div className="px-4 pb-4 pt-3.5">
        <h3 className="text-[15px] font-bold leading-snug tracking-tight text-slate-900">{title}</h3>

        {badge != null && badge !== '' && (
          <div className="mt-2.5">
            {typeof badge === 'string' ? (
              <span className="inline-flex max-w-full rounded-lg border border-orange-200/90 bg-gradient-to-b from-orange-50 to-amber-50/80 px-2.5 py-1 text-[11px] font-semibold text-orange-950">
                {badge}
              </span>
            ) : (
              badge
            )}
          </div>
        )}

        {meta != null && meta !== false && (
          <div className="mt-3 space-y-2 text-[12px] leading-relaxed text-slate-600">{meta}</div>
        )}

        {action != null && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-orange-600/25 outline-none transition hover:from-orange-600 hover:to-orange-700 focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/** Optional: consistent muted line for codes / address inside `meta`. */
export function MapCalloutMetaRow({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={['text-[12px] text-slate-600', className].filter(Boolean).join(' ')}>{children}</p>;
}

export function MapCalloutMetaMuted({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <p className="text-[11px] text-slate-500">
      <span className="font-semibold text-slate-500">{label}</span> {children}
    </p>
  );
}
