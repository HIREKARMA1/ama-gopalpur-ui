'use client';

import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type RoadConditionLightboxState = {
  side: 'before' | 'after' | 'all';
  images: string[];
  index: number;
};

type Props = {
  state: RoadConditionLightboxState | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function RoadConditionImageLightbox({ state, onClose, onIndexChange }: Props) {
  const images = state?.images ?? [];
  const index = state?.index ?? 0;
  const hasMultiple = images.length > 1;
  const current = images[index] ?? null;
  const title =
    state?.side === 'before' ? 'Before' : state?.side === 'after' ? 'After' : state?.side === 'all' ? 'All photos' : '';

  const goPrev = useCallback(() => {
    if (!state || images.length < 2) return;
    onIndexChange((index - 1 + images.length) % images.length);
  }, [state, images.length, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (!state || images.length < 2) return;
    onIndexChange((index + 1) % images.length);
  }, [state, images.length, index, onIndexChange]);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, onClose, goPrev, goNext]);

  if (!state || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} condition images`}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex w-full items-center justify-between gap-2 text-sm text-white">
          <span className="font-semibold">
            {title}
            {images.length > 1 ? ` · ${index + 1} / ${images.length}` : ''}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="relative flex w-full items-center justify-center">
          {hasMultiple ? (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 sm:left-2"
              aria-label="Previous image"
            >
              <ChevronLeft size={22} />
            </button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt={`${title} condition ${index + 1}`}
            className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-xl"
          />
          {hasMultiple ? (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 sm:right-2"
              aria-label="Next image"
            >
              <ChevronRight size={22} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
