'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '../components/layout/Shell';
import { ConstituencyMap } from '../components/map/ConstituencyMap';
import type { RoadFeature, DrainFeature } from '../components/map/ConstituencyMap';
import { DepartmentSidebar, getDepartmentIcon } from '../components/departments/DepartmentSidebar';
import { useLanguage } from '../components/i18n/LanguageContext';
import { departmentsApi, organizationsApi, healthApi, Department, Organization } from '../services/api';

const ROADS_DATA_PATHS = [
  '/data/roads/kukudakhandi.json',
  '/data/roads/berhampur_urban.json',
  '/data/roads/rangailunda.json',
] as const;

const DRAINAGE_DATA_PATHS = ['/data/drainage/bahana.json', 'data/drainage/bahana.json'] as const;

export default function HomePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [roads, setRoads] = useState<RoadFeature[]>([]);
  const [drains, setDrains] = useState<DrainFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [countByDepartmentId, setCountByDepartmentId] = useState<Record<number, number>>({});
  const { language } = useLanguage();

  useEffect(() => {
    departmentsApi
      .list()
      .then(setDepartments)
      .catch((err) => console.error('Failed to load departments', err));
  }, []);

  // Restore last selected department after refresh.
  useEffect(() => {
    if (departments.length === 0) return;
    if (selectedDept) return;
    if (typeof window === 'undefined') return;

    // If user explicitly navigated to home (e.g. via logo click), skip the
    // last-department auto-redirect to avoid "loop back to same page".
    const skipRestore = window.sessionStorage.getItem('ama_gopalpur_skip_restore') === '1';
    if (skipRestore) {
      window.sessionStorage.removeItem('ama_gopalpur_skip_restore');
      return;
    }

    // If user comes back using browser back/forward, don't re-trigger the
    // last-selected department redirect (it can trap the user in the same route).
    try {
      const entries = (performance.getEntriesByType?.('navigation') ?? []) as any[];
      const navType = entries[0]?.type;
      if (navType === 'back_forward') return;
    } catch {
      // If performance API is unavailable, fall through to restore behavior.
    }

    const stored = window.localStorage.getItem('ama_gopalpur_selected_dept_code');
    if (!stored) return;
    const match = departments.find((d) => (d.code || '').toUpperCase() === stored.toUpperCase());
    if (match) handleSelectDepartment(match);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departments]);

  const handleSelectDepartment = (dept: Department) => {
    setSelectedDept(dept);
    const isRoads = dept.code?.toUpperCase() === 'ROADS';
    const isRevenueLand = dept.code?.toUpperCase() === 'REVENUE_LAND';
    const isDrainage = dept.code?.toUpperCase() === 'DRAINAGE';

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ama_gopalpur_selected_dept_code', dept.code || '');
    }
    setLoading(true);
    if (isRoads) {
      Promise.all(
        ROADS_DATA_PATHS.map((path) =>
          fetch(path).then((r) => (r.ok ? r.json() : { type: 'FeatureCollection', features: [] }))
        )
      )
        .then((collections) => {
          const all: RoadFeature[] = [];
          collections.forEach((fc) => {
            if (fc?.features?.length) all.push(...fc.features);
          });
          setRoads(all);
          setDrains([]);
          setOrganizations([]);
          setCountByDepartmentId((prev) => ({ ...prev, [dept.id]: all.length }));
        })
        .finally(() => setLoading(false));
    } else if (isDrainage) {
      (async () => {
        let all: DrainFeature[] = [];
        for (const path of DRAINAGE_DATA_PATHS) {
          try {
            const res = await fetch(path);
            if (!res.ok) {
              // eslint-disable-next-line no-console
              console.warn(`Drainage map data not found at ${path}: ${res.status}`);
              continue;
            }
            const fc = await res.json();
            if (fc?.features?.length) {
              all = fc.features;
              break;
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(`Failed to load drainage map data from ${path}`, e);
          }
        }

        setDrains(all);
        setRoads([]);
        setOrganizations([]);
        setCountByDepartmentId((prev) => ({ ...prev, [dept.id]: all.length }));
      })().finally(() => setLoading(false));
    } else {
      organizationsApi
        .listByDepartment(dept.id, {
          limit: 1000,
          ...(isRevenueLand ? { sub_department: 'TAHASIL_OFFICE' } : {}),
        })
        .then(async (data) => {
          let updatedData = data;

          // For Health department, we need categories from profiles for correct map pins/filtering
          if (dept.code?.toUpperCase() === 'HEALTH') {
            try {
              const enriched = await Promise.all(
                data.map(async (org) => {
                  try {
                    const profile = await healthApi.getProfile(org.id);
                    if (profile && typeof profile === 'object' && (profile as any).category) {
                      return {
                        ...org,
                        attributes: {
                          ...(org.attributes || {}),
                          category: (profile as any).category,
                        },
                      };
                    }
                  } catch (e) {
                    console.error(`Failed to fetch health profile for org ${org.id}`, e);
                  }
                  return org;
                })
              );
              updatedData = enriched;
            } catch (err) {
              console.error('Failed to enrich health organizations with profile data', err);
            }
          }

          setOrganizations(updatedData);
          setRoads([]);
          setDrains([]);
          setCountByDepartmentId((prev) => ({ ...prev, [dept.id]: updatedData.length }));
        })
        .finally(() => setLoading(false));
    }
  };

  return (
    <Shell
      sidebar={
        <DepartmentSidebar
          departments={departments}
          selectedId={selectedDept?.id ?? null}
          countByDepartmentId={countByDepartmentId}
          countLabel="Total"
          onSelect={handleSelectDepartment}
        />
      }
      renderMobileBar={({ sidebarOpen, setSidebarOpen }) => {
        if (sidebarOpen) return null;
        return (
          <div className="md:hidden">
            <div className="mx-auto flex max-w-md items-center gap-2 rounded-t-2xl bg-white/95 px-3 py-2.5 shadow-[0_-10px_30px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 backdrop-blur">
              <div className="flex-1 overflow-x-auto nice-scrollbar">
                <div className="flex items-center gap-2.5 py-0.5">
                  {departments.map((dept) => {
                    const Icon = getDepartmentIcon(dept.code, dept.name);
                    const isSelected = selectedDept?.id === dept.id;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleSelectDepartment(dept)}
                        className={`flex h-11 w-11 min-w-11 shrink-0 aspect-square items-center justify-center rounded-xl transition ${isSelected
                          ? 'bg-slate-100 text-orange-600 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        aria-label={dept.name}
                      >
                        <Icon className="h-6 w-6" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex h-11 w-11 min-w-11 shrink-0 aspect-square items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-50"
                aria-label={sidebarOpen ? 'Close departments' : 'Open departments'}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        )
      }}
    >
      <section className="relative flex h-full min-h-0 flex-col">
        {loading && (
          <div className="absolute left-4 top-4 z-[1] flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-md backdrop-blur-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Loading…
          </div>
        )}
        <div className="relative flex-1 min-h-0 rounded-tl-lg bg-slate-100 shadow-inner px-4 pt-4 pb-20 sm:p-6 lg:p-8">
          <div className="h-full w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ring-1 ring-slate-200/50">
            <ConstituencyMap
              selectedDepartmentCode={selectedDept?.code}
              organizations={organizations}
              roads={roads}
              drains={drains}
              onSelectOrganization={(id) => router.push(`/organizations/${id}`)}
            />
          </div>
        </div>
      </section>
    </Shell>
  );
}
