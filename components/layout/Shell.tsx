'use client';

import { ReactNode, useState } from 'react';

interface ShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function Shell({ sidebar, children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="page-content relative flex h-screen overflow-hidden">
      {/* Google Maps-style narrow sidebar: collapsible */}
      <aside
        className={`flex shrink-0 flex-col border-r border-border bg-white shadow-sm transition-[width] duration-200 dark:bg-gray-900 ${
          sidebarOpen ? 'w-56 md:w-64' : 'w-0 overflow-hidden'
        }`}
      >
        {sidebarOpen && <div className="flex h-full flex-col overflow-hidden">{sidebar}</div>}
      </aside>
      {/* Toggle: tab on the edge of sidebar */}
      <button
        type="button"
        aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        className={`absolute z-10 flex h-12 w-5 items-center justify-center rounded-r-md border border-l-0 border-border bg-white text-text shadow-sm transition hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 ${
          sidebarOpen ? 'left-56 md:left-64 top-1/2 -translate-y-1/2' : 'left-0 top-1/2 -translate-y-1/2'
        }`}
        onClick={() => setSidebarOpen((o) => !o)}
      >
        <span className="text-sm font-medium">{sidebarOpen ? '‹' : '›'}</span>
      </button>
      <main className="flex-1 min-w-0 flex flex-col min-h-0">{children}</main>
    </div>
  );
}

