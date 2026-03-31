'use client';

import { useRouter } from 'next/navigation';

import { useEffect, useMemo, useState } from 'react';
import {
  departmentsApi,
  organizationsApi,
  revenueLandApi,
  type Department,
  type Organization,
} from '../../services/api';
import { Navbar } from '../../components/layout/Navbar';
import { PaginatedHorizontalTable, type TableColumn } from '../../components/common/PaginatedHorizontalTable';
import { useLanguage } from '../../components/i18n/LanguageContext';

type TahasilOfficeRow = {
  org: Organization;
  profile: Record<string, unknown>;
};

function formatVal(v: unknown): string {
  if (v == null) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}

export default function RevenueGovtLandTahasilOfficesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isOdia = language === 'or';

  // Safety net: keep Home from auto-redirecting back to this page via
  // "restore last selected department" logic.
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('ama_gopalpur_skip_restore', '1');
    window.localStorage.removeItem('ama_gopalpur_selected_dept_code');
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TahasilOfficeRow[]>([]);

  useEffect(() => {
    // (intentionally empty) keep component stable across renders.
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const depts: Department[] = await departmentsApi.list();
        const dept = depts.find((d) => (d.code || '').toUpperCase() === 'REVENUE_LAND');
        if (!dept) throw new Error('Revenue Govt Land department not found');

        const offices = await organizationsApi.listByDepartment(dept.id, { limit: 1000, sub_department: 'TAHASIL_OFFICE' });
        const profiles = await Promise.all(offices.map((o) => revenueLandApi.getProfile(o.id)));

        setRows(
          offices.map((org, idx) => ({
            org,
            profile:
              profiles[idx] && typeof profiles[idx] === 'object' ? (profiles[idx] as Record<string, unknown>) : {},
          })),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load Tahasil offices');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const columns = useMemo<TableColumn<TahasilOfficeRow>[]>(
    () => [
      {
        key: 'tahasil',
        header: isOdia ? 'ତହସିଲ' : 'TAHASIL',
        render: (r) => formatVal(r.profile['tahasil'] ?? r.org.name),
      },
      {
        key: 'office_name',
        header: isOdia ? 'କାର୍ଯ୍ୟାଳୟ' : 'OFFICE NAME',
        render: (r) => formatVal(r.org.name),
      },
      {
        key: 'address',
        header: isOdia ? 'ଠିକଣା' : 'ADDRESS',
        render: (r) => formatVal(r.org.address),
      },
    ],
    [isOdia],
  );

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container p-6">
        <Navbar />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <main className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {isOdia ? 'ତହସିଲ କାର୍ଯ୍ୟାଳୟ' : 'Tahasil Offices'}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {isOdia
            ? 'ପ୍ରତ୍ୟେକ ତହସିଲ କାର୍ଯ୍ୟାଳୟ ପାଇଁ View profile ବାଛନ୍ତୁ।'
            : 'Select “View profile” for each Tahasil office to see its parcel table.'}
        </p>

        <div className="mt-6">
          <PaginatedHorizontalTable<TahasilOfficeRow>
            columns={columns}
            rows={rows}
            pageSize={10}
            getRowId={(r) => r.org.id}
            onRowClick={(r) => router.push(`/organizations/${r.org.id}`)}
            emptyText={isOdia ? 'କୌଣସି ତହସିଲ ମିଳିଲା ନାହିଁ।' : 'No Tahasil offices found.'}
          />
        </div>
      </main>
    </div>
  );
}
