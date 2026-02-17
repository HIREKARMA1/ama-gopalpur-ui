'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

export interface ImageSliderProps {
  /** Image URLs (e.g. from admin panel). When empty, shows a placeholder slide. */
  images?: string[];
  /** Alt text prefix for slides */
  altPrefix?: string;
  /** Auto-advance interval in ms; 0 to disable */
  autoAdvanceMs?: number;
  className?: string;
}

export function ImageSlider({
  images = [],
  altPrefix = 'Organization',
  autoAdvanceMs = 5000,
  className = '',
}: ImageSliderProps) {
  const count = Math.max(1, images.length || 1);
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (autoAdvanceMs <= 0 || count <= 1) return;
    const t = setInterval(() => go(1), autoAdvanceMs);
    return () => clearInterval(t);
  }, [autoAdvanceMs, count, go]);

  const showPlaceholder = images.length === 0;

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-slate-200 ${className}`}>
      <div
        className="relative aspect-[3/1] w-full min-h-[120px] max-h-[280px] bg-gradient-to-br from-orange-50 to-amber-50"
        style={{ aspectRatio: '3/1' }}
      >
        {showPlaceholder ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-500">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">Photo gallery</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Images can be added from the department admin panel and will appear here.
            </p>
          </div>
        ) : (
          <>
            {images.map((src, i) => (
              <div
                key={src}
                className="absolute inset-0 transition-opacity duration-500"
                style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
              >
                <Image
                  src={src}
                  alt={`${altPrefix} image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="100vw"
                  unoptimized
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Arrows – show for real images or keep hidden for single placeholder */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white"
            aria-label="Previous image"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white"
            aria-label="Next image"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
