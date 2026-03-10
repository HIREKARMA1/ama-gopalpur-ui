'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  authApi,
  organizationsApi,
  departmentsApi,
  revenueLandApi,
  clearToken,
  Organization,
  User,
  Department,
  RevenueLandStatusRecord,
} from '../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { Loader } from '../../../../components/common/Loader';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';

const ROWS_PER_PAGE = 10;

export default function RevenueLandMonitoringPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [me, setMe] = useState<User | null>(null);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<RevenueLandStatusRecord[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [recordDate, setRecordDate] = useState('');
  const [encroachmentStatus, setEncroachmentStatus] = useState('');
  const [litigationStatus, setLitigationStatus] = useState('');
  const [presentUse, setPresentUse] = useState('');
  const [inLandBank, setInLandBank] = useState('');
  const [areaVacantAcres, setAreaVacantAcres] = useState('');
  const [remarks, setRemarks] = useState('');

  const isRevenueLand = deptCode === 'REVENUE_LAND';

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, deptList] = await Promise.all([
          authApi.me(),
          departmentsApi.list(),
        ]);
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/');
          return;
        }
        setMe(user);
        const dept = user.department_id
          ? deptList.find((d) => d.id === user.department_id)
          : null;
        setDeptCode(dept?.code ?? null);
        if (user.department_id) {
          const orgList = await organizationsApi.listByDepartment(
            user.department_id,
            { skip: 0, limit: 1000 }
          );
          setOrgs(orgList);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        clearToken();
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [router]);

  useEffect(() => {
    if (me?.department_id && isRevenueLand) {
      refreshData();
    }
  }, [selectedOrgId, isRevenueLand]);

  const refreshData = async () => {
    try {
      const orgId = selectedOrgId === '' ? undefined : Number(selectedOrgId);
      const data = await revenueLandApi.listStatusRecordsForDept({
        organization_id: orgId,
        limit: 500,
      });
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedOrgId === '' || !recordDate) {
      setError('Select land parcel and record date');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await revenueLandApi.createStatusRecord({
        organization_id: Number(selectedOrgId),
        record_date: recordDate,
        encroachment_status: encroachmentStatus.trim() || undefined,
        litigation_status: litigationStatus.trim() || undefined,
        present_use: presentUse.trim() || undefined,
        in_land_bank: inLandBank.trim() || undefined,
        area_vacant_acres: areaVacantAcres.trim() ? Number(areaVacantAcres) : undefined,
        remarks: remarks.trim() || undefined,
      });
      setRecordDate('');
      setEncroachmentStatus('');
      setLitigationStatus('');
      setPresentUse('');
      setInLandBank('');
      setAreaVacantAcres('');
      setRemarks('');
      await refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = useMemo(() => {
    const sorted = [...list].sort((a, b) => {
      const da = new Date(a.record_date || 0).getTime();
      const db = new Date(b.record_date || 0).getTime();
      return db - da;
    });
    if (!dateFilter) return sorted;
    return sorted.filter((row) => row.record_date?.slice(0, 10) === dateFilter);
  }, [list, dateFilter]);

  const totalRows = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const start = (pageClamped - 1) * ROWS_PER_PAGE;
  const paginated = currentList.slice(start, start + ROWS_PER_PAGE);

  if (!me && !loading) return null;
  if (!loading && !isRevenueLand) {
    router.replace('/admin/dept');
    return null;
  }

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={loading && !me}
      panelTitle={t('login.dept.title', language)}
      sectionLabel="Revenue Land – Status records"
      navItems={[
        { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
        { href: '/admin/dept/revenue-land-monitoring', labelKey: 'revenueLand.monitoring.title' },
      ]}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        {error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
            {error}
          </p>
        )}

        <section className="rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-4 py-3 text-white">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Add status record
            </h2>
            <p className="text-xs opacity-90 mt-0.5">
              Add a status snapshot for a land parcel (encroachment, litigation, use, area). These appear in the Land Parcel Dashboard charts and table.
            </p>
          </div>
          <form
            onSubmit={handleAdd}
            className="p-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Land parcel</label>
              <SearchableSelect
                options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                value={selectedOrgId}
                onChange={(v) => setSelectedOrgId(v === '' ? '' : Number(v))}
                placeholder="Select parcel"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Record date</label>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Encroachment status</label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2"
                placeholder="e.g. None, Notice, Eviction Pending"
                value={encroachmentStatus}
                onChange={(e) => setEncroachmentStatus(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Litigation status</label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2"
                placeholder="e.g. None, Pending, Decreed"
                value={litigationStatus}
                onChange={(e) => setLitigationStatus(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Present use</label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2"
                placeholder="e.g. Vacant, Office, Road"
                value={presentUse}
                onChange={(e) => setPresentUse(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">In land bank (Yes/No)</label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2"
                placeholder="Yes or No"
                value={inLandBank}
                onChange={(e) => setInLandBank(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Area vacant (acres)</label>
              <input
                type="number"
                step="any"
                className="w-full rounded border px-3 py-2"
                value={areaVacantAcres}
                onChange={(e) => setAreaVacantAcres(e.target.value)}
              />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="font-medium text-slate-700">Remarks</label>
              <input
                type="text"
                className="w-full rounded border px-3 py-2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add record'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Status records
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Filter date:</label>
              <input
                type="date"
                className="rounded border text-xs px-2 py-1"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-left">Parcel</th>
                  <th className="px-4 py-2 text-center">Date</th>
                  <th className="px-4 py-2 text-left">Encroachment</th>
                  <th className="px-4 py-2 text-left">Litigation</th>
                  <th className="px-4 py-2 text-left">Present use</th>
                  <th className="px-4 py-2 text-center">Land bank</th>
                  <th className="px-4 py-2 text-right">Area (acres)</th>
                  <th className="px-4 py-2 text-left">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-slate-400 italic"
                    >
                      No records. Add a record above or select another parcel/date filter.
                    </td>
                  </tr>
                )}
                {paginated.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-2 text-center font-medium text-slate-700">
                      {start + i + 1}
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      {orgs.find((o) => o.id === row.organization_id)?.name ??
                        row.organization_id}
                    </td>
                    <td className="px-4 py-2 text-center text-slate-900">
                      {row.record_date?.slice(0, 10)}
                    </td>
                    <td className="px-4 py-2">{row.encroachment_status ?? '—'}</td>
                    <td className="px-4 py-2">{row.litigation_status ?? '—'}</td>
                    <td className="px-4 py-2">{row.present_use ?? '—'}</td>
                    <td className="px-4 py-2 text-center">
                      {row.in_land_bank ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.area_vacant_acres != null ? row.area_vacant_acres : '—'}
                    </td>
                    <td className="px-4 py-2 max-w-[180px] truncate text-slate-500">
                      {row.remarks ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-t">
            <span className="text-[10px] text-slate-500">
              Page {pageClamped} of {totalPages} ({totalRows} total)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={pageClamped === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 rounded border bg-white disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={pageClamped === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded border bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </SuperAdminDashboardLayout>
  );
}
