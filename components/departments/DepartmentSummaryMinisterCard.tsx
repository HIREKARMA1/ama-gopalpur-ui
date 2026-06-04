'use client';

import { useState } from 'react';
import { Images, X } from 'lucide-react';
import type { DepartmentSummaryMinister } from '../../lib/departmentSummaryMinisters';
import { localizedMinisterField, type SummaryLang } from '../../lib/departmentSummaryMinisters';

type Props = {
  minister: DepartmentSummaryMinister;
  language: SummaryLang;
};

export function DepartmentSummaryMinisterCard({ minister, language }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const name = localizedMinisterField(minister, 'name', language);
  const designation = localizedMinisterField(minister, 'designation', language);
  const photo = (minister.photo_url || '').trim();
  const displayTitle = name || designation || '—';
  const showDesignationLine = Boolean(name && designation);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] transition-shadow hover:shadow-md">
      <div className="h-1 shrink-0 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300" />
      <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5">
        <button
          type="button"
          onClick={() => photo && setModalOpen(true)}
          disabled={!photo}
          className="relative mx-auto shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-2 ring-slate-100 ring-offset-2 transition group-hover:ring-orange-200/80 sm:mx-0"
          aria-label={photo ? `View photo of ${displayTitle}` : 'No photo'}
        >
          <div className="h-36 w-28 sm:h-40 sm:w-32">
            {photo ? (
              <img src={photo} alt={displayTitle} className="h-full w-full object-cover object-top" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400">
                <Images className="h-7 w-7" />
                <span className="text-[10px] font-medium">—</span>
              </div>
            )}
          </div>
        </button>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">{displayTitle}</p>
          {showDesignationLine ? (
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{designation}</p>
          ) : null}
        </div>
      </div>

      {modalOpen && photo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
          role="presentation"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setModalOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={photo}
            alt={displayTitle}
            className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </article>
  );
}
