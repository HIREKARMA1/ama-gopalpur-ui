'use client';

import { useState } from 'react';
import { Images } from 'lucide-react';
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
  // const message = localizedMinisterField(minister, 'message', language);
  const photo = (minister.photo_url || '').trim();
  const displayTitle = name || designation || '—';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={() => photo && setModalOpen(true)}
          className="mx-auto h-40 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:mx-0 sm:h-44 sm:w-36"
          aria-label={photo ? `View photo of ${name}` : 'No photo'}
          disabled={!photo}
        >
          {photo ? (
            <img src={photo} alt={name} className="h-full w-full object-contain object-center" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <Images className="h-6 w-6 text-slate-400" />
              <span className="text-[10px] text-slate-500">—</span>
            </div>
          )}
        </button>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-lg font-bold text-slate-900">{displayTitle}</p>
          {name && designation ? <p className="mt-1 text-sm leading-snug text-slate-600">{designation}</p> : null}
          {/* Minister message — hidden for now; re-enable when needed
          {message ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-700">&ldquo;{message}&rdquo;</p>
          ) : null}
          */}
        </div>
      </div>

      {modalOpen && photo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4"
          onClick={() => setModalOpen(false)}
          role="presentation"
        >
          <img
            src={photo}
            alt={name}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </article>
  );
}
