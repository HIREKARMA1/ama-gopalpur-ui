'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Navbar } from './Navbar';

interface ShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const SIDEBAR_WIDTH = 300;

export function Shell({ sidebar, children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

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
            sidebarAsOverlay ? 'fixed left-0 top-32 z-30 h-[calc(100vh-8rem)] shadow-xl' : 'md:relative'
          }`}
          style={{
            width: sidebarOpen ? (sidebarAsOverlay ? 'min(300px, 90vw)' : SIDEBAR_WIDTH) : 0,
          }}
        >
          {sidebarOpen && (
            <div className="flex h-full w-[300px] max-w-[90vw] flex-col overflow-hidden">
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

        {/* Toggle: desktop always; mobile only when sidebar is open (otherwise use "Departments" tab) */}
        {(!sidebarAsOverlay || sidebarOpen) && (
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open departments'}
            className="absolute top-1/2 z-40 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-orange-600/40 bg-[var(--color-sidebar-solid)] text-white shadow-lg transition-all duration-200 hover:bg-orange-600"
            style={{
              left: sidebarOpen
                ? (sidebarAsOverlay ? 'min(300px, 90vw)' : SIDEBAR_WIDTH) - 28
                : 0,
            }}
          >
            <span className="text-sm font-medium" aria-hidden>
              {sidebarOpen ? '‹' : '›'}
            </span>
          </button>
        )}

        {/* Mobile: show "Departments" tab when sidebar closed */}
        {sidebarAsOverlay && !sidebarOpen && (
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fixed left-0 top-32 z-10 flex items-center gap-2 rounded-r-lg bg-[var(--color-sidebar-solid)] px-3 py-2.5 text-sm font-medium text-white shadow-lg"
          >
            Departments
          </button>
        )}

        <main className="min-w-0 flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
