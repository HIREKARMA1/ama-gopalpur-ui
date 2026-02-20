'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

interface ShellProps {
  sidebar: ReactNode;
  children: ReactNode;
  renderMobileBar?: (opts: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) => ReactNode;
}

const SIDEBAR_WIDTH = 260;

export function Shell({ sidebar, children, renderMobileBar }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMobile = mounted && typeof window !== 'undefined' && window.innerWidth < 768;
  const sidebarAsOverlay = isMobile;

  // On mobile, start with sidebar closed to avoid covering the welcome content
  useEffect(() => {
    if (!mounted) return;
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [mounted]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <Navbar />

      <div className="relative flex min-h-0 flex-1">
        {/* Sidebar: desktop = collapsible rail; mobile = fixed overlay drawer (below full navbar + top bar) */}
        <aside
          className={`flex shrink-0 flex-col overflow-hidden bg-[var(--color-sidebar-solid)] transition-all duration-200 ease-out ${
            sidebarAsOverlay ? 'fixed right-0 top-32 z-30 h-[calc(100vh-8rem)] shadow-xl' : 'md:relative'
          }`}
          style={{
            width: sidebarOpen ? SIDEBAR_WIDTH : 0,
          }}
        >
          {sidebarOpen && (
            <div className="relative flex h-full w-full max-w-[90vw] flex-col overflow-hidden">
              {/* Mobile close button inside sidebar */}
              {sidebarAsOverlay && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/90 text-slate-100 shadow hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Close departments"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {sidebar}
            </div>
          )}
        </aside>

        {/* Mobile: dark overlay when sidebar open */}
        {sidebarAsOverlay && sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-20 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Toggle: desktop only */}
        {!sidebarAsOverlay && (
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open departments'}
            className="absolute top-1/2 z-40 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-orange-600/40 bg-[var(--color-sidebar-solid)] text-white shadow-lg transition-all duration-200 hover:bg-orange-600"
            style={{
              left: sidebarOpen ? SIDEBAR_WIDTH - 28 : 0,
            }}
          >
            <span className="text-sm font-medium" aria-hidden>
              {sidebarOpen ? '‹' : '›'}
            </span>
          </button>
        )}

        {/* Mobile: custom bottom bar (e.g. department icons) */}
        {sidebarAsOverlay && renderMobileBar && (
          <div className="fixed inset-x-0 bottom-0 z-20">
            {renderMobileBar({ sidebarOpen, setSidebarOpen })}
          </div>
        )}

        <main className="min-w-0 flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
