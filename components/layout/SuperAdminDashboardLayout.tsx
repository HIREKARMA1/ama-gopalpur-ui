'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import type { MessageKey } from '../i18n/messages';
import type { User } from '../../services/api';

export interface SuperAdminNavItem {
  href: string;
  /** Message key for sidebar label (e.g. 'super.sidebar.dashboard'). Add new keys in messages.ts for new pages. */
  labelKey: MessageKey;
  icon?: React.ReactNode;
}

const DEFAULT_NAV_ITEMS: SuperAdminNavItem[] = [
  { href: '/admin/super', labelKey: 'super.sidebar.dashboard' },
];

export interface SuperAdminDashboardLayoutProps {
  children: React.ReactNode;
  /** Currently authenticated super admin; when null and isUserLoading is true, a skeleton is shown. */
  user: User | null;
  onLogout: () => void;
  /** Optional panel title shown in mobile bar and sidebar header. Defaults to super admin title. */
  panelTitle?: string;
  /** Optional label for the primary nav group (e.g. \"Dashboard\"). */
  sectionLabel?: string;
  /** Optional nav items (defaults to Dashboard only). Add more for future pages. */
  navItems?: SuperAdminNavItem[];
  /** When true and user is null, show skeleton loaders in sidebar instead of real data. */
  isUserLoading?: boolean;
}

export function SuperAdminDashboardLayout({
  children,
  user,
  onLogout,
  panelTitle,
  sectionLabel,
  navItems = DEFAULT_NAV_ITEMS,
  isUserLoading = false,
}: SuperAdminDashboardLayoutProps) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const panelTitleText = panelTitle ?? t('super.panel.title', language);
  const sectionLabelText = sectionLabel ?? t('super.sidebar.dashboard', language);

  useEffect(() => {
    if (sidebarOpen) {
      const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && closeSidebar();
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [sidebarOpen, closeSidebar]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* Mobile: bar with menu button */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          aria-label={t('super.sidebar.menu', language)}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-800">
          {panelTitleText}
        </span>
        <div className="w-10" />
      </div>

      <div className="relative flex flex-1 min-h-0">
        {/* Backdrop when sidebar open on mobile */}
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={closeSidebar}
            aria-label={t('super.sidebar.close', language)}
          />
        )}

        {/* Sidebar (fixed to viewport; menu list scrolls when long) */}
        <aside
          className={`fixed left-0 top-[128px] bottom-0 z-40 flex w-[260px] shrink-0 flex-col bg-slate-900 text-slate-100 shadow-xl transition-transform duration-200 ease-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700/60 px-4 lg:hidden">
            <span className="text-sm font-semibold text-white">
              {panelTitleText}
            </span>
            <button
              type="button"
              onClick={closeSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label={t('super.sidebar.close', language)}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Middle: scrollable nav area */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* User summary (desktop) */}
            <div className="mb-4 hidden rounded-2xl bg-slate-800/80 px-3 py-3 lg:block">
              {isUserLoading || !user ? (
                <div className="flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-slate-600" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="h-3 w-24 rounded bg-slate-700" />
                    <div className="h-2.5 w-32 rounded bg-slate-700" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold text-white">
                    {user.full_name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-50">{user.full_name}</p>
                    <p className="truncate text-[11px] text-slate-300">{user.email}</p>
                  </div>
                </div>
              )}
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {sectionLabelText}
            </p>

            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-slate-200 hover:bg-slate-800/70'
                      }`}
                    >
                      {item.icon}
                      {t(item.labelKey, language)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom: fixed logout button (no duplicate name/email) */}
          <div className="shrink-0 border-t border-slate-800/70 p-4">
            <div className="rounded-2xl bg-slate-800 px-3 py-2.5">
              <button
                type="button"
                disabled={isUserLoading || !user}
                onClick={() => {
                  closeSidebar();
                  onLogout();
                }}
                className="mt-1 w-full rounded-lg border border-orange-400/60 bg-orange-500 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 focus:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUserLoading || !user ? 'Loading…' : t('super.logout', language)}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content (takes remaining space; sidebar is fixed on the left) */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:ml-[260px]">
          {children}
        </main>
      </div>
    </div>
  );
}
