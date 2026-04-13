'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  authApi,
  organizationsApi,
  departmentsApi,
  icdsApi,
  clearToken,
  Organization,
  User,
  SnpDailyStock,
  IcdsAttendanceRecord,
  IcdsInspectionReport,
  IcdsNutritionDistribution,
} from '../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';

const _n = (s: string) => (s.trim() ? (Number(s) || undefined) : undefined);
const ROWS_PER_PAGE = 10;

type DataType = 'attendance' | 'snp' | 'inspection' | 'nutrition';

export default function IcdsMonitoringPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [me, setMe] = useState<User | null>(null);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<DataType>('attendance');
  const [attendanceList, setAttendanceList] = useState<IcdsAttendanceRecord[]>([]);
  const [snpList, setSnpList] = useState<SnpDailyStock[]>([]);
  const [inspectionList, setInspectionList] = useState<IcdsInspectionReport[]>([]);
  const [nutritionList, setNutritionList] = useState<IcdsNutritionDistribution[]>([]);

  const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [recordDate, setRecordDate] = useState('');
  const [childCount, setChildCount] = useState('');
  const [workerPresent, setWorkerPresent] = useState(false);

  const [snpOpening, setSnpOpening] = useState('');
  const [snpReceived, setSnpReceived] = useState('');
  const [snpExp, setSnpExp] = useState('');

  const [repairRequired, setRepairRequired] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');

  const [mealType, setMealType] = useState('');
  const [countServed, setCountServed] = useState('');

  const isIcds = deptCode === 'ICDS' || deptCode === 'AWC_ICDS';

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, deptList] = await Promise.all([authApi.me(), departmentsApi.list()]);
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/');
          return;
        }
        setMe(user);
        const dept = user.department_id ? deptList.find((d) => d.id === user.department_id) : null;
        setDeptCode(dept?.code ?? null);
        if (user.department_id) {
          const orgList = await organizationsApi.listByDepartment(user.department_id, { skip: 0, limit: 1000 });
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
    if (me?.department_id && isIcds) {
      refreshData();
    }
  }, [activeTab, selectedOrgId, me?.department_id, isIcds]);

  const refreshData = async () => {
    try {
      const orgId = selectedOrgId === '' ? undefined : Number(selectedOrgId);
      if (activeTab === 'attendance') {
        const data = orgId
          ? await icdsApi.listAttendanceForOrg(orgId, { limit: 200 })
          : await icdsApi.listAttendanceForDept({ limit: 500 });
        setAttendanceList(data);
      } else if (activeTab === 'snp') {
        const data = orgId
          ? await icdsApi.listSnpDailyStock(orgId, { limit: 200 })
          : await icdsApi.listSnpForDept({ limit: 500 });
        setSnpList(data);
      } else if (activeTab === 'inspection') {
        const data = orgId
          ? await icdsApi.listInspectionForOrg(orgId, { limit: 200 })
          : await icdsApi.listInspectionForDept({ limit: 500 });
        setInspectionList(data);
      } else if (activeTab === 'nutrition') {
        const data = orgId
          ? await icdsApi.listNutritionForOrg(orgId, { limit: 200 })
          : await icdsApi.listNutritionForDept({ limit: 500 });
        setNutritionList(data);
      }
    } catch {
      // ignore
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedOrgId === '' || !recordDate) {
      setError('Select organization and date');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const oid = Number(selectedOrgId);
      if (activeTab === 'attendance') {
        await icdsApi.createAttendanceRecord({
          organization_id: oid,
          record_date: recordDate,
          child_attendance_count: _n(childCount),
          worker_present: workerPresent,
        });
        setChildCount('');
        setWorkerPresent(false);
      } else if (activeTab === 'snp') {
        await icdsApi.createSnpDailyStock({
          organization_id: oid,
          record_date: recordDate,
          opening_balance_kg: _n(snpOpening),
          received_kg: _n(snpReceived),
          exp_kg: _n(snpExp),
        });
        setSnpOpening('');
        setSnpReceived('');
        setSnpExp('');
      } else if (activeTab === 'inspection') {
        await icdsApi.createInspectionReport({
          organization_id: oid,
          inspection_date: recordDate,
          repair_required: repairRequired,
          utility_notes: inspectionNotes || null,
        });
        setRepairRequired(false);
        setInspectionNotes('');
      } else if (activeTab === 'nutrition') {
        await icdsApi.createNutritionDistribution({
          organization_id: oid,
          record_date: recordDate,
          meal_type: mealType || null,
          count_served: _n(countServed),
        });
        setMealType('');
        setCountServed('');
      }
      setRecordDate('');
      await refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  };

  const dateKeyForRow = (row: { record_date?: string; inspection_date?: string }) => {
    const d = row.inspection_date ?? row.record_date;
    return d ? String(d).slice(0, 10) : '';
  };

  const currentList = useMemo(() => {
    let list: unknown[] = [];
    if (activeTab === 'attendance') list = attendanceList;
    if (activeTab === 'snp') list = snpList;
    if (activeTab === 'inspection') list = inspectionList;
    if (activeTab === 'nutrition') list = nutritionList;

    const sorted = [...list].sort((a: unknown, b: unknown) => {
      const ra = a as { record_date?: string; inspection_date?: string };
      const rb = b as { record_date?: string; inspection_date?: string };
      const da = new Date(dateKeyForRow(ra) || 0).getTime();
      const db = new Date(dateKeyForRow(rb) || 0).getTime();
      return db - da;
    });

    if (!dateFilter) return sorted;
    return sorted.filter((row) => dateKeyForRow(row as { record_date?: string; inspection_date?: string }) === dateFilter);
  }, [activeTab, attendanceList, snpList, inspectionList, nutritionList, dateFilter]);

  const totalRows = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const start = (pageClamped - 1) * ROWS_PER_PAGE;
  const paginated = currentList.slice(start, start + ROWS_PER_PAGE);

  const handleDownloadTemplate = () => {
    let header = '';
    let example = '';
    const orgId = selectedOrgId || (orgs[0]?.id ?? 1);

    if (activeTab === 'attendance') {
      header = 'organization_id,record_date,child_attendance_count,worker_present\n';
      example = `${orgId},2026-02-20,25,true\n`;
    } else if (activeTab === 'snp') {
      header = 'organization_id,record_date,opening_balance_kg,received_kg,exp_kg\n';
      example = `${orgId},2026-02-20,10,5,3\n`;
    } else if (activeTab === 'inspection') {
      header = 'organization_id,inspection_date,repair_required,utility_notes\n';
      example = `${orgId},2026-02-20,false,All utilities OK\n`;
    } else if (activeTab === 'nutrition') {
      header = 'organization_id,record_date,meal_type,count_served\n';
      example = `${orgId},2026-02-20,Hot cooked meal,42\n`;
    }

    const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `icds_${activeTab}_template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem('csvFile') as HTMLInputElement;
    if (!fileInput?.files?.length) return;
    const file = fileInput.files[0];
    setUploading(true);
    setError(null);
    try {
      let res;
      if (activeTab === 'attendance') res = await icdsApi.bulkAttendanceCsv(file);
      else if (activeTab === 'snp') res = await icdsApi.bulkSnpCsv(file);
      else if (activeTab === 'inspection') res = await icdsApi.bulkInspectionCsv(file);
      else if (activeTab === 'nutrition') res = await icdsApi.bulkNutritionCsv(file);

      await refreshData();
      if (res?.errors?.length) {
        setError(`Imported ${res.imported}; errors: ${res.errors.slice(0, 3).join('; ')}`);
      }
      fileInput.value = '';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!me && !loading) return null;
  if (!loading && !isIcds) {
    router.replace('/admin/dept');
    return null;
  }

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={loading && !me}
      panelTitle={t('login.dept.title', language)}
      sectionLabel={t('icds.monitoring.title', language)}
      navItems={[
        { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
        { href: '/admin/dept/icds-monitoring', labelKey: 'icds.monitoring.title' },
      ]}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          {(
            [
              { id: 'attendance' as const, labelKey: 'icds.monitoring.tab.attendance' },
              { id: 'snp' as const, labelKey: 'icds.monitoring.tab.snp' },
              { id: 'inspection' as const, labelKey: 'icds.monitoring.tab.inspection' },
              { id: 'nutrition' as const, labelKey: 'icds.monitoring.tab.nutrition' },
            ] as const
          ).map((tInfo) => (
            <button
              key={tInfo.id}
              type="button"
              onClick={() => {
                setActiveTab(tInfo.id);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tInfo.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {t(tInfo.labelKey, language)}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</p>
        )}

        <section className="rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-4 py-3 text-white">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Record
            </h2>
          </div>
          <form onSubmit={handleAdd} className="p-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Organization</label>
              <SearchableSelect
                options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                value={selectedOrgId}
                onChange={(v) => setSelectedOrgId(v === '' ? '' : Number(v))}
                placeholder="Select Organization"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-slate-700">
                {activeTab === 'inspection' ? t('icds.monitoring.inspection.date', language) : 'Record Date'}
              </label>
              <input
                type="date"
                className="w-full rounded border px-3 py-2"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                required
              />
            </div>

            {activeTab === 'attendance' && (
              <>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    {t('icds.monitoring.attendance.children', language)}
                  </label>
                  <input
                    type="number"
                    className="w-full rounded border px-3 py-2"
                    value={childCount}
                    onChange={(e) => setChildCount(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="workerPres"
                    checked={workerPresent}
                    onChange={(e) => setWorkerPresent(e.target.checked)}
                  />
                  <label htmlFor="workerPres" className="font-medium text-slate-700">
                    {t('icds.monitoring.attendance.worker', language)}
                  </label>
                </div>
              </>
            )}

            {activeTab === 'snp' && (
              <>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">{t('icds.monitoring.snp.opening', language)}</label>
                  <input
                    type="number"
                    className="w-full rounded border px-3 py-2"
                    value={snpOpening}
                    onChange={(e) => setSnpOpening(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">{t('icds.monitoring.snp.received', language)}</label>
                  <input
                    type="number"
                    className="w-full rounded border px-3 py-2"
                    value={snpReceived}
                    onChange={(e) => setSnpReceived(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">{t('icds.monitoring.snp.exp', language)}</label>
                  <input
                    type="number"
                    className="w-full rounded border px-3 py-2"
                    value={snpExp}
                    onChange={(e) => setSnpExp(e.target.value)}
                  />
                </div>
              </>
            )}

            {activeTab === 'inspection' && (
              <>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="repairReq"
                    checked={repairRequired}
                    onChange={(e) => setRepairRequired(e.target.checked)}
                  />
                  <label htmlFor="repairReq" className="font-medium text-slate-700">
                    {t('icds.monitoring.inspection.repair', language)}
                  </label>
                </div>
                <div className="space-y-1 lg:col-span-2">
                  <label className="font-medium text-slate-700">{t('icds.monitoring.inspection.notes', language)}</label>
                  <input
                    type="text"
                    className="w-full rounded border px-3 py-2"
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                  />
                </div>
              </>
            )}

            {activeTab === 'nutrition' && (
              <>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">{t('icds.monitoring.nutrition.mealType', language)}</label>
                  <input
                    type="text"
                    className="w-full rounded border px-3 py-2"
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">{t('icds.monitoring.nutrition.count', language)}</label>
                  <input
                    type="number"
                    className="w-full rounded border px-3 py-2"
                    value={countServed}
                    onChange={(e) => setCountServed(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 lg:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Record'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Bulk Import (CSV)</h3>
          <form onSubmit={handleBulkUpload} className="flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-3 py-2 bg-white border rounded hover:bg-slate-50 transition-colors"
            >
              Download Template
            </button>
            <label className="px-3 py-2 bg-white border rounded cursor-pointer hover:bg-slate-50">
              <input type="file" name="csvFile" accept=".csv" className="sr-only" />
              Choose CSV File
            </label>
            <button
              type="submit"
              disabled={uploading}
              className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Historical Records</h3>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Filter Date:</label>
              <input
                type="date"
                className="rounded border text-xs px-2 py-1"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              {dateFilter && (
                <button type="button" onClick={() => setDateFilter('')} className="text-xs text-blue-600 hover:underline">
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-center">{t('awc.snp.slNo', language)}</th>
                  <th className="px-4 py-2 text-center">Organization</th>
                  <th className="px-4 py-2 text-center">Date</th>
                  {activeTab === 'attendance' && (
                    <>
                      <th className="px-4 py-2 text-right">Children</th>
                      <th className="px-4 py-2 text-center">Worker?</th>
                    </>
                  )}
                  {activeTab === 'snp' && (
                    <>
                      <th className="px-4 py-2 text-right">Open (kg)</th>
                      <th className="px-4 py-2 text-right">Recv (kg)</th>
                      <th className="px-4 py-2 text-right">Exp (kg)</th>
                    </>
                  )}
                  {activeTab === 'inspection' && (
                    <>
                      <th className="px-4 py-2 text-center">Repair?</th>
                      <th className="px-4 py-2 text-left">Notes</th>
                    </>
                  )}
                  {activeTab === 'nutrition' && (
                    <>
                      <th className="px-4 py-2 text-left">Meal</th>
                      <th className="px-4 py-2 text-right">Served</th>
                    </>
                  )}
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {!paginated.length && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400 italic">
                      No records found for this selection
                    </td>
                  </tr>
                )}
                {paginated.map((row: unknown, i: number) => {
                  const r = row as Record<string, unknown>;
                  const oid = Number(r.organization_id);
                  const orgName = orgs.find((o) => o.id === oid)?.name ?? oid;
                  const d = dateKeyForRow(r as { record_date?: string; inspection_date?: string });
                  return (
                    <tr key={`${activeTab}-${r.id}-${i}`} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2 text-center font-medium text-slate-700">{start + i + 1}</td>
                      <td className="px-4 py-2 text-center text-slate-700">{orgName}</td>
                      <td className="px-4 py-2 text-center text-slate-900">{d || '—'}</td>
                      {activeTab === 'attendance' && (
                        <>
                          <td className="px-4 py-2 text-right">{(r.child_attendance_count as number) ?? '—'}</td>
                          <td className="px-4 py-2 text-center">{r.worker_present ? '✅' : '❌'}</td>
                        </>
                      )}
                      {activeTab === 'snp' && (
                        <>
                          <td className="px-4 py-2 text-right">{(r.opening_balance_kg as number) ?? '—'}</td>
                          <td className="px-4 py-2 text-right">{(r.received_kg as number) ?? '—'}</td>
                          <td className="px-4 py-2 text-right">{(r.exp_kg as number) ?? '—'}</td>
                        </>
                      )}
                      {activeTab === 'inspection' && (
                        <>
                          <td className="px-4 py-2 text-center">{r.repair_required ? '✅' : '❌'}</td>
                          <td className="px-4 py-2 text-slate-500">{String(r.utility_notes ?? '—')}</td>
                        </>
                      )}
                      {activeTab === 'nutrition' && (
                        <>
                          <td className="px-4 py-2 text-slate-800">{String(r.meal_type ?? '—')}</td>
                          <td className="px-4 py-2 text-right">{(r.count_served as number) ?? '—'}</td>
                        </>
                      )}
                      <td className="px-4 py-2"></td>
                    </tr>
                  );
                })}
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
