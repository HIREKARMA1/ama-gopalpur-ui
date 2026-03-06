'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  authApi,
  clearToken,
  departmentsApi,
  electricityApi,
  ElectricityDaily,
  ElectricityMonthly,
  Organization,
  organizationsApi,
  User,
} from '../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { Loader } from '../../../../components/common/Loader';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';

const ROWS_PER_PAGE = 10;

type DataTab = 'daily' | 'monthly';

export default function ElectricityMonitoringPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [me, setMe] = useState<User | null>(null);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<DataTab>('daily');
  const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');
  const [recordDate, setRecordDate] = useState('');

  // Daily form
  const [supplyUrban, setSupplyUrban] = useState('');
  const [supplyRural, setSupplyRural] = useState('');
  const [peakLoad, setPeakLoad] = useState('');
  const [outagesCount, setOutagesCount] = useState('');
  const [outagesDuration, setOutagesDuration] = useState('');
  const [complaintsReceived, setComplaintsReceived] = useState('');
  const [complaintsResolved, setComplaintsResolved] = useState('');
  const [dailyRemarks, setDailyRemarks] = useState('');

  // Monthly form
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [unitsBilled, setUnitsBilled] = useState('');
  const [revenueCollected, setRevenueCollected] = useState('');
  const [atcLoss, setAtcLoss] = useState('');
  const [collectionEff, setCollectionEff] = useState('');

  const [dailyList, setDailyList] = useState<ElectricityDaily[]>([]);
  const [monthlyList, setMonthlyList] = useState<ElectricityMonthly[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, depts] = await Promise.all([authApi.me(), departmentsApi.list()]);
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/');
          return;
        }
        setMe(user);
        const dept = user.department_id ? depts.find((d) => d.id === user.department_id) : null;
        setDeptCode(dept?.code ?? null);

        if (user.department_id) {
          const orgList = await organizationsApi.listByDepartment(user.department_id, {
            skip: 0,
            limit: 1000,
          });
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
    if (!me?.department_id || deptCode !== 'ELECTRICITY') return;
    const orgId = selectedOrgId === '' ? undefined : Number(selectedOrgId);
    if (!orgId) {
      setDailyList([]);
      setMonthlyList([]);
      return;
    }
    const load = async () => {
      try {
        const [daily, monthly] = await Promise.all([
          electricityApi.listDaily(orgId),
          electricityApi.listMonthly(orgId),
        ]);
        setDailyList(daily ?? []);
        setMonthlyList(monthly ?? []);
      } catch {
        // ignore
      }
    };
    load();
  }, [me?.department_id, deptCode, selectedOrgId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedOrgId === '' || !recordDate) {
      setError('Select organization and record date');
      return;
    }
    setSubmitting(true);
    setError(null);
    const orgId = Number(selectedOrgId);
    try {
      if (activeTab === 'daily') {
        await electricityApi.createDaily(orgId, {
          record_date: recordDate,
          supply_hours_urban: supplyUrban ? Number(supplyUrban) : null,
          supply_hours_rural: supplyRural ? Number(supplyRural) : null,
          peak_load_mw: peakLoad ? Number(peakLoad) : null,
          outages_count: outagesCount ? Number(outagesCount) : null,
          outages_duration_min: outagesDuration ? Number(outagesDuration) : null,
          complaints_received: complaintsReceived ? Number(complaintsReceived) : null,
          complaints_resolved: complaintsResolved ? Number(complaintsResolved) : null,
          remarks: dailyRemarks || null,
        });
        setSupplyUrban('');
        setSupplyRural('');
        setPeakLoad('');
        setOutagesCount('');
        setOutagesDuration('');
        setComplaintsReceived('');
        setComplaintsResolved('');
        setDailyRemarks('');
        const updated = await electricityApi.listDaily(orgId);
        setDailyList(updated ?? []);
      } else {
        await electricityApi.createMonthly(orgId, {
          month: month ? Number(month) : new Date().getMonth() + 1,
          year: year ? Number(year) : new Date().getFullYear(),
          units_billed_mu: unitsBilled ? Number(unitsBilled) : null,
          revenue_collected_cr: revenueCollected ? Number(revenueCollected) : null,
          at_c_loss_percent: atcLoss ? Number(atcLoss) : null,
          collection_efficiency_percent: collectionEff ? Number(collectionEff) : null,
        });
        setMonth('');
        setYear('');
        setUnitsBilled('');
        setRevenueCollected('');
        setAtcLoss('');
        setCollectionEff('');
        const updated = await electricityApi.listMonthly(orgId);
        setMonthlyList(updated ?? []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  const currentList = useMemo(() => {
    const list = activeTab === 'daily' ? dailyList : monthlyList;
    const sorted = [...list].sort(
      (a, b) =>
        new Date((a as any).record_date || `${(a as any).year}-${(a as any).month}-01`).getTime() -
        new Date((b as any).record_date || `${(b as any).year}-${(b as any).month}-01`).getTime(),
    );
    if (!dateFilter || activeTab === 'monthly') return sorted;
    return sorted.filter((row: any) => row.record_date?.slice(0, 10) === dateFilter);
  }, [activeTab, dailyList, monthlyList, dateFilter]);

  const totalRows = currentList.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const start = (pageClamped - 1) * ROWS_PER_PAGE;
  const paginated = currentList.slice(start, start + ROWS_PER_PAGE);

  if (!me && !loading) return null;
  if (!loading && deptCode !== 'ELECTRICITY') {
    router.replace('/admin/dept');
    return null;
  }

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={loading && !me}
      panelTitle={t('login.dept.title', language)}
      sectionLabel={t('electricity.monitoring.title', language)}
      navItems={[
        { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
        { href: '/admin/dept/electricity-monitoring', labelKey: 'electricity.monitoring.title' },
      ]}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      {loading && !me ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader />
        </div>
      ) : (
        <div className="mx-auto max-w-6xl space-y-6 pb-20">
          {/* Tab Switcher */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
            {[
              { id: 'daily', label: 'Daily Supply & Complaints' },
              { id: 'monthly', label: 'Monthly Performance' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as DataTab);
                  setPage(1);
                }}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded">
              {error}
            </p>
          )}

          {/* Form */}
          <section className="rounded-xl border border-blue-200 bg-blue-50/40 shadow-sm overflow-hidden">
            <div className="bg-blue-600 px-4 py-3 text-white">
              <h2 className="text-sm font-semibold uppercase tracking-wide">
                {activeTab === 'daily' ? 'Add Daily Record' : 'Add Monthly Record'}
              </h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-3"
            >
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Organization</label>
                <SearchableSelect
                  options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                  value={selectedOrgId}
                  onChange={(v) => setSelectedOrgId(v === '' ? '' : Number(v))}
                  placeholder="Select office/substation"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  {activeTab === 'daily' ? 'Record date' : 'Month / Year'}
                </label>
                {activeTab === 'daily' ? (
                  <input
                    type="date"
                    className="w-full rounded border px-3 py-2"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    required
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      className="w-20 rounded border px-2 py-2"
                      placeholder="MM"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      min={2020}
                      max={2100}
                      className="w-24 rounded border px-2 py-2"
                      placeholder="YYYY"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {activeTab === 'daily' && (
                <>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Supply hours (Urban)</label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step="0.1"
                      className="w-full rounded border px-3 py-2"
                      value={supplyUrban}
                      onChange={(e) => setSupplyUrban(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Supply hours (Rural)</label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      step="0.1"
                      className="w-full rounded border px-3 py-2"
                      value={supplyRural}
                      onChange={(e) => setSupplyRural(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Peak load (MW)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full rounded border px-3 py-2"
                      value={peakLoad}
                      onChange={(e) => setPeakLoad(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Outages (count)</label>
                    <input
                      type="number"
                      className="w-full rounded border px-3 py-2"
                      value={outagesCount}
                      onChange={(e) => setOutagesCount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">
                      Outages duration (minutes, total)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded border px-3 py-2"
                      value={outagesDuration}
                      onChange={(e) => setOutagesDuration(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Complaints received</label>
                    <input
                      type="number"
                      className="w-full rounded border px-3 py-2"
                      value={complaintsReceived}
                      onChange={(e) => setComplaintsReceived(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Complaints resolved</label>
                    <input
                      type="number"
                      className="w-full rounded border px-3 py-2"
                      value={complaintsResolved}
                      onChange={(e) => setComplaintsResolved(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1 lg:col-span-2">
                    <label className="font-medium text-slate-700">Remarks</label>
                    <input
                      type="text"
                      className="w-full rounded border px-3 py-2"
                      value={dailyRemarks}
                      onChange={(e) => setDailyRemarks(e.target.value)}
                    />
                  </div>
                </>
              )}

              {activeTab === 'monthly' && (
                <>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Units billed (MU)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded border px-3 py-2"
                      value={unitsBilled}
                      onChange={(e) => setUnitsBilled(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Revenue collected (Cr.)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded border px-3 py-2"
                      value={revenueCollected}
                      onChange={(e) => setRevenueCollected(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">AT&C loss (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full rounded border px-3 py-2"
                      value={atcLoss}
                      onChange={(e) => setAtcLoss(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Collection efficiency (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full rounded border px-3 py-2"
                      value={collectionEff}
                      onChange={(e) => setCollectionEff(e.target.value)}
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
                  {submitting ? 'Saving…' : 'Save record'}
                </button>
              </div>
            </form>
          </section>

          {/* Records table */}
          <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                {activeTab === 'daily' ? 'Daily records' : 'Monthly records'}
              </h3>
              {activeTab === 'daily' && (
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
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-center">#</th>
                    <th className="px-4 py-2 text-left">Organization</th>
                    {activeTab === 'daily' ? (
                      <>
                        <th className="px-4 py-2 text-center">Date</th>
                        <th className="px-4 py-2 text-center">Supply (U/R)</th>
                        <th className="px-4 py-2 text-center">Complaints (Rcv/Res)</th>
                        <th className="px-4 py-2 text-center">Outages</th>
                        <th className="px-4 py-2 text-left">Remarks</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2 text-center">Month/Year</th>
                        <th className="px-4 py-2 text-right">Units billed (MU)</th>
                        <th className="px-4 py-2 text-right">Revenue (Cr.)</th>
                        <th className="px-4 py-2 text-right">AT&C loss %</th>
                        <th className="px-4 py-2 text-right">Collection eff. %</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {!paginated.length && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-400 italic"
                      >
                        No records yet for this selection.
                      </td>
                    </tr>
                  )}
                  {paginated.map((row: any, idx) => (
                    <tr
                      key={row.id ?? idx}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2 text-center font-medium text-slate-700">
                        {start + idx + 1}
                      </td>
                      <td className="px-4 py-2 text-left text-slate-800">
                        {orgs.find((o) => o.id === row.organization_id)?.name ??
                          row.organization_id}
                      </td>
                      {activeTab === 'daily' ? (
                        <>
                          <td className="px-4 py-2 text-center text-slate-900">
                            {row.record_date?.slice(0, 10)}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {(row.supply_hours_urban ?? '—')}/{row.supply_hours_rural ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {(row.complaints_received ?? '—')}/
                            {row.complaints_resolved ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {row.outages_count ?? '—'} (
                            {row.outages_duration_min != null
                              ? `${row.outages_duration_min} min`
                              : '—'}
                            )
                          </td>
                          <td className="px-4 py-2 text-left text-slate-500">
                            {row.remarks ?? '—'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 text-center text-slate-900">
                            {row.month}/{row.year}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {row.units_billed_mu ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {row.revenue_collected_cr ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {row.at_c_loss_percent ?? '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {row.collection_efficiency_percent ?? '—'}
                          </td>
                        </>
                      )}
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded border bg-white text-xs disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={pageClamped === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 rounded border bg-white text-xs disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </SuperAdminDashboardLayout>
  );
}

