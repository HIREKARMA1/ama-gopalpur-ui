'use client';

import { ReactNode, useState } from 'react';
import { Navbar } from './Navbar';

interface ShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const SIDEBAR_WIDTH = 280;

export function Shell({ sidebar, children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-100">
      {/* Top navbar - full width orange */}
      <Navbar />

      {/* Content row: orange sidebar + main (map) */}
      <div className="flex min-h-0 flex-1 relative">
        {/* Left sidebar - orange panel; collapses to 0 when closed */}
        <aside
          className="flex shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out"
          style={{
            width: sidebarOpen ? SIDEBAR_WIDTH : 0,
            background: 'var(--color-sidebar-solid)',
          }}
        >
          {sidebarOpen && (
            <div className="flex h-full w-[280px] flex-col overflow-hidden">
              {sidebar}
            </div>
          )}
        </aside>

        {/* Open/close toggle: on the right edge of the sidebar when open, or as a tab on the left when closed */}
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="absolute top-1/2 z-10 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-orange-600/50 bg-[var(--color-sidebar-solid)] text-white shadow-md transition-[left] duration-200 ease-out hover:bg-orange-600"
          style={{ left: sidebarOpen ? SIDEBAR_WIDTH - 24 : 0 }}
        >
          <span className="text-sm font-medium" aria-hidden>
            {sidebarOpen ? '‹' : '›'}
          </span>
        </button>

        {/* Main: map fills remainder */}
        <main className="min-w-0 flex-1 flex flex-col">{children}</main>
      </div>
    </div>
  );
}
