'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronUp, SlidersHorizontal } from 'lucide-react';
import type { MessageKey } from '../i18n/messages';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { MapDepartmentSummaryDialog } from './MapDepartmentSummaryDialog';

type MapTypeId = 'roadmap' | 'satellite';

export function MapViewToolbar({
  mapInstance,
  mapContainerRef,
  departmentTitle,
  mapSummary,
  /** When false, map/satellite/fullscreen still show; info button is hidden. */
  showDepartmentInfo,
  infoButtonLabelKey,
  dialogTitleKey,
  dialogEmptyKey,
  dialogCloseKey,
  mapLabelKey,
  satelliteLabelKey,
  fullscreenLabelKey,
}: {
  mapInstance: any;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  departmentTitle: string;
  mapSummary?: string | null;
  showDepartmentInfo: boolean;
  infoButtonLabelKey: MessageKey;
  dialogTitleKey: MessageKey;
  dialogEmptyKey: MessageKey;
  dialogCloseKey: MessageKey;
  mapLabelKey: MessageKey;
  satelliteLabelKey: MessageKey;
  fullscreenLabelKey: MessageKey;
}) {
  const { language } = useLanguage();
  const [mapType, setMapType] = useState<MapTypeId>('roadmap');
  const [infoOpen, setInfoOpen] = useState(false);
  const [fs, setFs] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.setMapTypeId(mapType === 'satellite' ? 'satellite' : 'roadmap');
  }, [mapInstance, mapType]);

  useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = mapContainerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [mapContainerRef]);

  const FullscreenIcon = fs ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
      />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
      />
    </svg>
  );

  const Controls = (
    <>
      {showDepartmentInfo && (
        <div className="relative shrink-0">
          <button
            ref={infoButtonRef}
            type="button"
            onClick={() => setInfoOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-500 text-sm font-bold text-white shadow-md ring-1 ring-orange-800/50 hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            title={t(infoButtonLabelKey, language)}
            aria-label={t(infoButtonLabelKey, language)}
            aria-expanded={infoOpen}
          >
            i
          </button>
          <MapDepartmentSummaryDialog
            open={infoOpen}
            onClose={() => setInfoOpen(false)}
            anchorRef={infoButtonRef}
            departmentTitle={departmentTitle}
            mapSummary={mapSummary}
            titleKey={dialogTitleKey}
            emptyKey={dialogEmptyKey}
            closeKey={dialogCloseKey}
          />
        </div>
      )}
      <div className="flex overflow-hidden rounded-md border border-slate-200">
        <button
          type="button"
          onClick={() => setMapType('roadmap')}
          className={`px-3 py-1.5 text-xs font-medium ${
            mapType === 'roadmap' ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {t(mapLabelKey, language)}
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          className={`border-l border-slate-200 px-3 py-1.5 text-xs font-medium ${
            mapType === 'satellite'
              ? 'bg-slate-200 text-slate-900'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {t(satelliteLabelKey, language)}
        </button>
      </div>
      <button
        type="button"
        onClick={toggleFullscreen}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 bg-slate-100 hover:bg-slate-200"
        title={t(fullscreenLabelKey, language)}
        aria-label={t(fullscreenLabelKey, language)}
      >
        {FullscreenIcon}
      </button>
    </>
  );

  return (
    <>
      {/* Desktop toolbar (top-right) */}
      <div className="pointer-events-auto absolute top-3 right-3 z-[25] hidden md:flex items-stretch gap-1.5 rounded-lg bg-white/98 p-1 shadow-md ring-1 ring-slate-200/90">
        {Controls}
      </div>

      {/* Mobile toolbar (bottom, collapsible) */}
      <div className="pointer-events-none absolute left-4 right-4 bottom-28 z-[30] md:hidden flex justify-end">
        <div className="pointer-events-auto flex items-center gap-2">
          {mobileOpen && (
            <div className="flex items-stretch gap-1.5 rounded-lg bg-white/98 p-1 shadow-md ring-1 ring-slate-200/90">
              {Controls}
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-1 ring-slate-200/70 hover:opacity-95"
            aria-label={mobileOpen ? 'Close map controls' : 'Open map controls'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <ChevronUp size={18} /> : <SlidersHorizontal size={18} />}
          </button>
        </div>
      </div>
    </>
  );
}
