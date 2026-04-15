'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  authApi,
  organizationsApi,
  departmentsApi,
  agricultureApi,
  clearToken,
  Organization,
  User,
  AgricultureDailyMetric,
  AgricultureMonthlyReport,
} from '../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { Loader } from '../../../../components/common/Loader';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';

const _n = (s: string) => (s.trim() ? Number(s) || undefined : undefined);
const ROWS_PER_PAGE = 10;

type DataType = 'daily' | 'monthly' | 'inventory' | 'attendance';

type AgInventoryRow = {
  record_date: string;
  item_name: string;
  opening?: number | null;
  received?: number | null;
  used?: number | null;
  closing?: number | null;
};

type AgAttendanceRow = {
  record_date: string;
  staff_present_count?: number | null;
  expert_present?: boolean | null;
  remarks?: string | null;
};

export default function AgricultureMonitoringPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [me, setMe] = useState<User | null>(null);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<DataType>('daily');
  const [dailyList, setDailyList] = useState<AgricultureDailyMetric[]>([]);
  const [monthlyList, setMonthlyList] = useState<AgricultureMonthlyReport[]>([]);
  const [inventoryList, setInventoryList] = useState<AgInventoryRow[]>([]);
  const [attendanceList, setAttendanceList] = useState<AgAttendanceRow[]>([]);

  const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [recordDate, setRecordDate] = useState('');
  const [trainings, setTrainings] = useState('');
  const [farmersServed, setFarmersServed] = useState('');
  const [trials, setTrials] = useState('');
  const [villagesCovered, setVillagesCovered] = useState('');
  const [soilCards, setSoilCards] = useState('');
  const [remarks, setRemarks] = useState('');

  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [mTotalTrainings, setMTotalTrainings] = useState('');
  const [mTotalFarmers, setMTotalFarmers] = useState('');
  const [mTotalTrials, setMTotalTrials] = useState('');
  const [mTotalSoilCards, setMTotalSoilCards] = useState('');
  const [mRemarks, setMRemarks] = useState('');
  const [invDate, setInvDate] = useState('');
  const [invItem, setInvItem] = useState('');
  const [invOpening, setInvOpening] = useState('');
  const [invReceived, setInvReceived] = useState('');
  const [invUsed, setInvUsed] = useState('');
  const [invClosing, setInvClosing] = useState('');
  const [attDate, setAttDate] = useState('');
  const [attStaffPresent, setAttStaffPresent] = useState('');
  const [attExpertPresent, setAttExpertPresent] = useState(false);
  const [attRemarks, setAttRemarks] = useState('');

  const isAgriculture = deptCode === 'AGRICULTURE';

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
            { skip: 0, limit: 1000 },
          );
          setOrgs(orgList);
        }
      } catch {
        setError('Failed to load');
        clearToken();
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [router]);

  useEffect(() => {
    if (me?.department_id && isAgriculture) refreshData();
  }, [activeTab, selectedOrgId]);

  const refreshData = async () => {
    try {
      const orgId = selectedOrgId === '' ? undefined : Number(selectedOrgId);
      if (activeTab === 'daily') {
        const data = orgId
          ? await agricultureApi.listDailyMetrics(orgId, { limit: 200 })
          : await agricultureApi.listDailyMetricsForDept({ limit: 500 });
        setDailyList(Array.isArray(data) ? data : []);
      } else if (activeTab === 'monthly') {
        const data = orgId
          ? await agricultureApi.listMonthlyReports(orgId, { limit: 100 })
          : await agricultureApi.listMonthlyReportsForDept({ limit: 300 });
        setMonthlyList(Array.isArray(data) ? data : []);
      } else if (activeTab === 'inventory' || activeTab === 'attendance') {
        if (!orgId) {
          if (activeTab === 'inventory') setInventoryList([]);
          else setAttendanceList([]);
          return;
        }
        const profile = await agricultureApi.getProfile(orgId);
        const parseRows = <T,>(v: unknown): T[] => {
          if (Array.isArray(v)) return v as T[];
          if (typeof v === 'string') {
            try {
              const p = JSON.parse(v) as unknown;
              return Array.isArray(p) ? (p as T[]) : [];
            } catch {
              return [];
            }
          }
          return [];
        };
        const inv = parseRows<AgInventoryRow>(
          (profile as Record<string, unknown>)?.ag_daily_stock_rows ??
            (profile as Record<string, unknown>)?.ag_daily_stock_rows_json,
        );
        const att = parseRows<AgAttendanceRow>(
          (profile as Record<string, unknown>)?.ag_staff_attendance_rows ??
            (profile as Record<string, unknown>)?.ag_staff_attendance_rows_json,
        );
        setInventoryList(inv);
        setAttendanceList(att);
      }
    } catch {
      if (activeTab === 'daily') setDailyList([]);
      else if (activeTab === 'monthly') setMonthlyList([]);
      else if (activeTab === 'inventory') setInventoryList([]);
      else setAttendanceList([]);
    }
  };

  const handleAddInventory = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedOrgId === '' || !invDate || !invItem.trim()) {
      setError('Select organization, inventory date and item name');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const orgId = Number(selectedOrgId);
      const profile = await agricultureApi.getProfile(orgId);
      const current = Array.isArray((profile as Record<string, unknown>)?.ag_daily_stock_rows)
        ? ((profile as Record<string, unknown>).ag_daily_stock_rows as AgInventoryRow[])
        : [];
      const next = [
        ...current,
        {
          record_date: invDate,
          item_name: invItem.trim(),
          opening: _n(invOpening) ?? null,
          received: _n(invReceived) ?? null,
          used: _n(invUsed) ?? null,
          closing: _n(invClosing) ?? null,
        },
      ];
      await agricultureApi.putProfile(orgId, { ag_daily_stock_rows: next });
      setInvItem('');
      setInvOpening('');
      setInvReceived('');
      setInvUsed('');
      setInvClosing('');
      await refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add inventory row');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAttendance = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedOrgId === '' || !attDate) {
      setError('Select organization and attendance date');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const orgId = Number(selectedOrgId);
      const profile = await agricultureApi.getProfile(orgId);
      const current = Array.isArray((profile as Record<string, unknown>)?.ag_staff_attendance_rows)
        ? ((profile as Record<string, unknown>).ag_staff_attendance_rows as AgAttendanceRow[])
        : [];
      const next = [
        ...current,
        {
          record_date: attDate,
          staff_present_count: _n(attStaffPresent) ?? null,
          expert_present: attExpertPresent,
          remarks: attRemarks.trim() || null,
        },
      ];
      await agricultureApi.putProfile(orgId, { ag_staff_attendance_rows: next });
      setAttStaffPresent('');
      setAttExpertPresent(false);
      setAttRemarks('');
      await refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add attendance row');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDaily = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedOrgId === '' || !recordDate) {
      setError('Select organization and date');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await agricultureApi.createDailyMetric({
        organization_id: Number(selectedOrgId),
        record_date: recordDate,
        trainings_conducted: _n(trainings),
        farmers_served: _n(farmersServed),
        trials_conducted: _n(trials),
        villages_covered_count: _n(villagesCovered),
        soil_cards_issued: _n(soilCards),
        remarks: remarks.trim() || undefined,
      });
      setTrainings('');
      setFarmersServed('');
      setTrials('');
      setVillagesCovered('');
      setSoilCards('');
      setRemarks('');
      await refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMonthly = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedOrgId === '' || !month || !year) {
      setError('Select organization, month and year');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await agricultureApi.createMonthlyReport({
        organization_id: Number(selectedOrgId),
        month: Number(month),
        year: Number(year),
        total_trainings: _n(mTotalTrainings),
        total_farmers_served: _n(mTotalFarmers),
        total_trials: _n(mTotalTrials),
        total_soil_cards: _n(mTotalSoilCards),
        remarks: mRemarks.trim() || undefined,
      });
      setMTotalTrainings('');
      setMTotalFarmers('');
      setMTotalTrials('');
      setMTotalSoilCards('');
      setMRemarks('');
      await refreshData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = useMemo(() => {
    if (activeTab === 'daily') {
      const sorted = [...dailyList].sort((a, b) => {
        const da = new Date((a.record_date || '') as string).getTime();
        const db = new Date((b.record_date || '') as string).getTime();
        return db - da;
      });
      if (!dateFilter) return sorted;
      return sorted.filter(
        (row) => (row.record_date || '').slice(0, 10) === dateFilter,
      );
    }
    if (activeTab === 'monthly') {
      const sorted = [...monthlyList].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
      return sorted;
    }
    if (activeTab === 'inventory') {
      return [...inventoryList].sort((a, b) =>
        (b.record_date || '').localeCompare(a.record_date || ''),
      );
    }
    return [...attendanceList].sort((a, b) =>
      (b.record_date || '').localeCompare(a.record_date || ''),
    );
  }, [activeTab, dailyList, monthlyList, inventoryList, attendanceList, dateFilter]);

  const totalRows = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const start = (pageClamped - 1) * ROWS_PER_PAGE;
  const paginated = currentList.slice(start, start + ROWS_PER_PAGE);

  const handleDownloadTemplate = () => {
    const orgId = selectedOrgId || (orgs[0]?.id ?? 1);
    const header =
      'organization_id,record_date,trainings_conducted,farmers_served,trials_conducted,villages_covered_count,soil_cards_issued,remarks\n';
    const example = `${orgId},2026-03-10,5,120,2,8,50,Field day\n`;
    const blob = new Blob([header + example], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agriculture_daily_metrics_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem(
      'csvFile',
    ) as HTMLInputElement;
    if (!fileInput?.files?.length) return;
    const file = fileInput.files[0];
    setUploading(true);
    setError(null);
    try {
      const res = await agricultureApi.bulkDailyMetricsCsv(file);
      await refreshData();
      if (res?.errors?.length) {
        setError(
          `Imported ${res.imported}; errors: ${res.errors.slice(0, 3).join('; ')}`,
        );
      }
      fileInput.value = '';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!me && !loading) return null;
  if (!loading && !isAgriculture) {
    router.replace('/admin/dept');
    return null;
  }

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={loading && !me}
      panelTitle={t('login.dept.title', language)}
      sectionLabel="Agriculture Monitoring"
      navItems={[
        { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
        { href: '/admin/dept/agriculture-monitoring', labelKey: 'agriculture.monitoring.title' },
      ]}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6 pb-20">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          {[
            { id: 'daily' as const, label: 'Daily metrics' },
            { id: 'monthly' as const, label: 'Monthly reports' },
            { id: 'inventory' as const, label: 'Inventory' },
            { id: 'attendance' as const, label: 'Staff attendance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
            {error}
          </p>
        )}

        {/* Add record form */}
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm overflow-hidden">
          <div className="bg-emerald-600 px-4 py-3 text-white">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Add {activeTab === 'daily' ? 'Daily' : 'Monthly'} Record
            </h2>
          </div>
          {activeTab === 'daily' ? (
            <form
              onSubmit={handleAddDaily}
              className="p-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-4"
            >
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Organization</label>
                <SearchableSelect
                  options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                  value={selectedOrgId}
                  onChange={(v) =>
                    setSelectedOrgId(v === '' ? '' : Number(v))
                  }
                  placeholder="Select Organization"
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
                <label className="font-medium text-slate-700">Trainings conducted</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={trainings}
                  onChange={(e) => setTrainings(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Farmers served</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={farmersServed}
                  onChange={(e) => setFarmersServed(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Trials conducted</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={trials}
                  onChange={(e) => setTrials(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Villages covered</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={villagesCovered}
                  onChange={(e) => setVillagesCovered(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Soil cards issued</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={soilCards}
                  onChange={(e) => setSoilCards(e.target.value)}
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
              <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add daily record'}
                </button>
              </div>
            </form>
          ) : activeTab === 'monthly' ? (
            <form
              onSubmit={handleAddMonthly}
              className="p-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-4"
            >
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Organization</label>
                <SearchableSelect
                  options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                  value={selectedOrgId}
                  onChange={(v) =>
                    setSelectedOrgId(v === '' ? '' : Number(v))
                  }
                  placeholder="Select Organization"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Month (1–12)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  className="w-full rounded border px-3 py-2"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Year</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Total trainings</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={mTotalTrainings}
                  onChange={(e) => setMTotalTrainings(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Total farmers served</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={mTotalFarmers}
                  onChange={(e) => setMTotalFarmers(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Total trials</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={mTotalTrials}
                  onChange={(e) => setMTotalTrials(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Total soil cards</label>
                <input
                  type="number"
                  className="w-full rounded border px-3 py-2"
                  value={mTotalSoilCards}
                  onChange={(e) => setMTotalSoilCards(e.target.value)}
                />
              </div>
              <div className="space-y-1 lg:col-span-2">
                <label className="font-medium text-slate-700">Remarks</label>
                <input
                  type="text"
                  className="w-full rounded border px-3 py-2"
                  value={mRemarks}
                  onChange={(e) => setMRemarks(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add monthly report'}
                </button>
              </div>
            </form>
          ) : activeTab === 'inventory' ? (
            <form onSubmit={handleAddInventory} className="p-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-4">
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
                <label className="font-medium text-slate-700">Record date</label>
                <input type="date" className="w-full rounded border px-3 py-2" value={invDate} onChange={(e) => setInvDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Item name</label>
                <input type="text" className="w-full rounded border px-3 py-2" value={invItem} onChange={(e) => setInvItem(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Opening</label>
                <input type="number" className="w-full rounded border px-3 py-2" value={invOpening} onChange={(e) => setInvOpening(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Received</label>
                <input type="number" className="w-full rounded border px-3 py-2" value={invReceived} onChange={(e) => setInvReceived(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Used</label>
                <input type="number" className="w-full rounded border px-3 py-2" value={invUsed} onChange={(e) => setInvUsed(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Closing</label>
                <input type="number" className="w-full rounded border px-3 py-2" value={invClosing} onChange={(e) => setInvClosing(e.target.value)} />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                <button type="submit" disabled={submitting} className="rounded bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add inventory row'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddAttendance} className="p-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-4">
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
                <label className="font-medium text-slate-700">Record date</label>
                <input type="date" className="w-full rounded border px-3 py-2" value={attDate} onChange={(e) => setAttDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Staff present count</label>
                <input type="number" className="w-full rounded border px-3 py-2" value={attStaffPresent} onChange={(e) => setAttStaffPresent(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Expert present</label>
                <select className="w-full rounded border px-3 py-2" value={attExpertPresent ? 'yes' : 'no'} onChange={(e) => setAttExpertPresent(e.target.value === 'yes')}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="space-y-1 lg:col-span-2">
                <label className="font-medium text-slate-700">Remarks</label>
                <input type="text" className="w-full rounded border px-3 py-2" value={attRemarks} onChange={(e) => setAttRemarks(e.target.value)} />
              </div>
              <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                <button type="submit" disabled={submitting} className="rounded bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add attendance row'}
                </button>
              </div>
            </form>
          )}
        </section>

        {activeTab === 'daily' && (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Bulk import (CSV)
            </h3>
            <form
              onSubmit={handleBulkUpload}
              className="flex flex-wrap items-center gap-4 text-xs"
            >
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-2 bg-white border rounded hover:bg-slate-50 transition-colors"
              >
                Download template
              </button>
              <label className="px-3 py-2 bg-white border rounded cursor-pointer hover:bg-slate-50">
                <input
                  type="file"
                  name="csvFile"
                  accept=".csv"
                  className="sr-only"
                />
                Choose CSV
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
        )}

        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Records
            </h3>
            {activeTab === 'daily' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600">
                  Filter date:
                </label>
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
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-center">#</th>
                  <th className="px-4 py-2 text-center">Organization</th>
                  {activeTab === 'daily' ? (
                    <>
                      <th className="px-4 py-2 text-center">Date</th>
                      <th className="px-4 py-2 text-right">Trainings</th>
                      <th className="px-4 py-2 text-right">Farmers</th>
                      <th className="px-4 py-2 text-right">Trials</th>
                      <th className="px-4 py-2 text-right">Villages</th>
                      <th className="px-4 py-2 text-right">Soil cards</th>
                    </>
                  ) : activeTab === 'monthly' ? (
                    <>
                      <th className="px-4 py-2 text-center">Month / Year</th>
                      <th className="px-4 py-2 text-right">Trainings</th>
                      <th className="px-4 py-2 text-right">Farmers</th>
                      <th className="px-4 py-2 text-right">Trials</th>
                      <th className="px-4 py-2 text-right">Soil cards</th>
                    </>
                  ) : activeTab === 'inventory' ? (
                    <>
                      <th className="px-4 py-2 text-center">Date</th>
                      <th className="px-4 py-2 text-center">Item</th>
                      <th className="px-4 py-2 text-right">Opening</th>
                      <th className="px-4 py-2 text-right">Received</th>
                      <th className="px-4 py-2 text-right">Used</th>
                      <th className="px-4 py-2 text-right">Closing</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-2 text-center">Date</th>
                      <th className="px-4 py-2 text-right">Staff present</th>
                      <th className="px-4 py-2 text-center">Expert present</th>
                      <th className="px-4 py-2 text-center">Remarks</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {!paginated.length && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-slate-400 italic"
                    >
                      No records for this selection
                    </td>
                  </tr>
                )}
                {activeTab === 'daily' &&
                  (paginated as AgricultureDailyMetric[]).map((row, i) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2 text-center font-medium text-slate-700">
                        {start + i + 1}
                      </td>
                      <td className="px-4 py-2 text-center text-slate-700">
                        {orgs.find((o) => o.id === row.organization_id)?.name ??
                          row.organization_id}
                      </td>
                      <td className="px-4 py-2 text-center text-slate-900">
                        {(row.record_date || '').slice(0, 10)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.trainings_conducted ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.farmers_served ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.trials_conducted ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.villages_covered_count ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.soil_cards_issued ?? '—'}
                      </td>
                    </tr>
                  ))}
                {activeTab === 'monthly' &&
                  (paginated as AgricultureMonthlyReport[]).map((row, i) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2 text-center font-medium text-slate-700">
                        {start + i + 1}
                      </td>
                      <td className="px-4 py-2 text-center text-slate-700">
                        {orgs.find((o) => o.id === row.organization_id)?.name ??
                          row.organization_id}
                      </td>
                      <td className="px-4 py-2 text-center text-slate-900">
                        {row.year}-{String(row.month).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.total_trainings ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.total_farmers_served ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.total_trials ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {row.total_soil_cards ?? '—'}
                      </td>
                    </tr>
                  ))}
                {activeTab === 'inventory' &&
                  (paginated as AgInventoryRow[]).map((row, i) => (
                    <tr key={`${row.record_date}-${row.item_name}-${i}`} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2 text-center font-medium text-slate-700">{start + i + 1}</td>
                      <td className="px-4 py-2 text-center text-slate-700">{selectedOrgId || 'Selected org'}</td>
                      <td className="px-4 py-2 text-center text-slate-900">{(row.record_date || '').slice(0, 10)}</td>
                      <td className="px-4 py-2 text-center text-slate-900">{row.item_name || '—'}</td>
                      <td className="px-4 py-2 text-right">{row.opening ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{row.received ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{row.used ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{row.closing ?? '—'}</td>
                    </tr>
                  ))}
                {activeTab === 'attendance' &&
                  (paginated as AgAttendanceRow[]).map((row, i) => (
                    <tr key={`${row.record_date}-${i}`} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-2 text-center font-medium text-slate-700">{start + i + 1}</td>
                      <td className="px-4 py-2 text-center text-slate-700">{selectedOrgId || 'Selected org'}</td>
                      <td className="px-4 py-2 text-center text-slate-900">{(row.record_date || '').slice(0, 10)}</td>
                      <td className="px-4 py-2 text-right">{row.staff_present_count ?? '—'}</td>
                      <td className="px-4 py-2 text-center">{row.expert_present ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 text-center">{row.remarks || '—'}</td>
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
