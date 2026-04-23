'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import type { MessageKey } from '../i18n/messages';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

export function MapDepartmentSummaryDialog({
  open,
  onClose,
  anchorRef,
  departmentTitle,
  departmentId,
  mapSummary,
  titleKey,
  emptyKey,
  closeKey,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  departmentTitle: string;
  departmentId?: number | null;
  mapSummary?: string | null;
  titleKey: MessageKey;
  emptyKey: MessageKey;
  closeKey: MessageKey;
}) {
  const { language } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    const measure = () => {
      const btn = anchorRef.current;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const margin = 8;
      const w = Math.min(360, window.innerWidth - margin * 2);
      let left = r.right - w;
      left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
      const maxH = Math.min(320, window.innerHeight - margin * 2);
      let top = r.bottom + 6;
      if (top + maxH > window.innerHeight - margin) {
        top = Math.max(margin, r.top - maxH - 6);
      }
      setBox({ top, left, width: w, maxHeight: maxH });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined' || !box) return null;

  const body = mapSummary?.trim() ? mapSummary : t(emptyKey, language);
  const portalTarget = (document.fullscreenElement as HTMLElement | null) ?? document.body;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-dept-summary-title"
      className="fixed z-[10000] rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/25 ring-1 ring-black/5"
      style={{
        top: box.top,
        left: box.left,
        width: box.width,
        maxHeight: box.maxHeight,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t(closeKey, language)}
        title={t(closeKey, language)}
        className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <h2 id="map-dept-summary-title" className="text-sm font-semibold text-slate-900">
        {t(titleKey, language)}
      </h2>
      <p className="mt-0.5 text-xs font-medium text-slate-600">{departmentTitle}</p>
      <div
        className="mt-3 overflow-y-auto text-xs leading-relaxed text-slate-700 whitespace-pre-wrap"
        style={{ maxHeight: Math.min(180, box.maxHeight - 84) }}
      >
        {body}
      </div>
      {departmentId ? (
        <Link
          href={`/departments/${departmentId}/summary`}
          className="mt-3 inline-flex items-center rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
        >
          View full department summary
        </Link>
      ) : null}
    </div>,
    portalTarget,
  );
}
