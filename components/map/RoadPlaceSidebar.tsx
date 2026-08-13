'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPinned, X } from 'lucide-react';

export type RoadPlaceSidebarInfo = {
  name: string;
  code: string;
  block: string;
  gpWard: string;
  type: string;
  year: string;
  pointA: string;
  pointB: string;
  lengthKm: string;
  nameOfDivision: string;
  scheme: string;
  lastMaintenanceDate: string;
  issues: string;
  remarks: string;
  beforeRating: number | null;
  afterRating: number | null;
  beforeNotes: string;
  afterNotes: string;
  beforeImages: string[];
  afterImages: string[];
  roadImages: string[];
  sanctionAmount: string;
  sanctionDate: string;
  workCompletedDate: string;
};

type Props = {
  info: RoadPlaceSidebarInfo;
  onClose: () => void;
  onStreetView: () => void;
  onOpenLightbox: (images: string[], index: number) => void;
};

function formatRating(n: number): string {
  return Number.isInteger(n) ? `${n}.0` : String(n);
}

function StarRow({ value }: { value: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < filled ? 'opacity-100' : 'opacity-25'}>
          ★
        </span>
      ))}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const v = value.trim();
  if (!v || v === 'Requested from Road Dept' || v === 'N/A') {
    // Still show useful empty-ish rows for A/B when coords fallback used; skip pure empty
    if (!v) return null;
  }
  return (
    <div className="flex gap-2 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <span className="w-[38%] shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 flex-1 text-slate-900">{v}</span>
    </div>
  );
}

export function RoadPlaceSidebar({ info, onClose, onStreetView, onOpenLightbox }: Props) {
  const allImages = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    // Hero: after + dedicated road gallery only (never before)
    for (const url of [...(info.afterImages ?? []), ...(info.roadImages ?? [])]) {
      const u = String(url || '').trim();
      if (!u || seen.has(u)) continue;
      seen.add(u);
      out.push(u);
    }
    return out;
  }, [info.afterImages, info.roadImages]);

  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    setHeroIndex(0);
  }, [info.name, allImages.join('|')]);

  useEffect(() => {
    if (heroIndex >= allImages.length) setHeroIndex(0);
  }, [allImages.length, heroIndex]);

  const currentHero = allImages[heroIndex] ?? null;
  const hasMultiple = allImages.length > 1;
  const subtitleParts = [info.type || null, info.code || null].filter(Boolean);

  const goPrev = () => {
    if (!hasMultiple) return;
    setHeroIndex((i) => (i - 1 + allImages.length) % allImages.length);
  };
  const goNext = () => {
    if (!hasMultiple) return;
    setHeroIndex((i) => (i + 1) % allImages.length);
  };

  return (
    <aside
      className="pointer-events-auto absolute bottom-3 left-3 top-3 z-[65] flex w-[min(400px,calc(100%-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-[380px]"
      role="complementary"
      aria-label="Road overview"
    >
      <div className="relative shrink-0">
        {currentHero ? (
          <button
            type="button"
            className="group relative block h-48 w-full overflow-hidden bg-slate-100 sm:h-56"
            onClick={() => onOpenLightbox(allImages, heroIndex)}
            aria-label="Open photos"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentHero}
              alt={`${info.name} photo ${heroIndex + 1}`}
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
            {hasMultiple ? (
              <span className="absolute bottom-2 right-2 rounded bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
                {heroIndex + 1} / {allImages.length}
              </span>
            ) : null}
          </button>
        ) : (
          <div className="flex h-28 items-center justify-center bg-slate-100 text-sm text-slate-500 sm:h-32">
            No photos yet
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow hover:bg-white"
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow hover:bg-white"
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3">
        <h2 className="text-xl font-bold leading-snug tracking-tight text-slate-900">{info.name}</h2>
        {subtitleParts.length ? (
          <p className="mt-1 text-sm text-slate-600">
            {subtitleParts.map((p, i) => (
              <span key={`${p}-${i}`}>
                {i > 0 ? <span className="text-slate-400"> · </span> : null}
                {i === 1 ? <span className="font-mono text-[13px]">{p}</span> : p}
              </span>
            ))}
          </p>
        ) : null}

        {(info.beforeRating != null || info.afterRating != null) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {info.beforeRating != null ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-slate-900">{formatRating(info.beforeRating)}</span>
                <StarRow value={info.beforeRating} />
                <span className="text-slate-500">Before</span>
              </span>
            ) : null}
            {info.afterRating != null ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-slate-900">{formatRating(info.afterRating)}</span>
                <StarRow value={info.afterRating} />
                <span className="text-slate-500">After</span>
              </span>
            ) : null}
          </div>
        )}

        <button
          type="button"
          onClick={onStreetView}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
        >
          <MapPinned size={16} />
          Street View
        </button>

        <div className="mt-4">
          <DetailRow label="Point A (start)" value={info.pointA} />
          <DetailRow label="Point B (end)" value={info.pointB} />
          <DetailRow label="Length" value={info.lengthKm !== 'N/A' ? `${info.lengthKm} km` : ''} />
          <DetailRow label="Block" value={info.block} />
          <DetailRow label="GP / Ward" value={info.gpWard} />
          <DetailRow label="Division" value={info.nameOfDivision} />
          <DetailRow label="Scheme" value={info.scheme} />
          <DetailRow label="Year" value={info.year} />
          <DetailRow label="Road code" value={info.code} />
          <DetailRow label="Last maintenance" value={info.lastMaintenanceDate} />
          <DetailRow label="Issues" value={info.issues} />
          <DetailRow label="Remarks" value={info.remarks} />
          {info.beforeNotes ? <DetailRow label="Before notes" value={info.beforeNotes} /> : null}
          {info.afterNotes ? <DetailRow label="After notes" value={info.afterNotes} /> : null}
          <DetailRow label="Sanction amount" value={info.sanctionAmount} />
          <DetailRow label="Sanction date" value={info.sanctionDate} />
          <DetailRow label="Work completed" value={info.workCompletedDate} />
        </div>
      </div>
    </aside>
  );
}
