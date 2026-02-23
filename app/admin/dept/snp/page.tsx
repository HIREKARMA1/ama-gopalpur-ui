'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, organizationsApi, departmentsApi, icdsApi, clearToken, Organization, User, Department, SnpDailyStock } from '../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { Loader } from '../../../../components/common/Loader';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';

const _n = (s: string) => (s.trim() ? (Number(s) || undefined) : undefined);
const SNP_ROWS_PER_PAGE = 10;

function snpKg(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v} Kg`;
}

export default function DeptSnpPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [me, setMe] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [snpList, setSnpList] = useState<SnpDailyStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snpSubmitting, setSnpSubmitting] = useState(false);
  const [snpOrgId, setSnpOrgId] = useState<number | ''>('');
  const [snpDate, setSnpDate] = useState('');
  const [snpOpening, setSnpOpening] = useState('');
  const [snpReceived, setSnpReceived] = useState('');
  const [snpExp, setSnpExp] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editOpening, setEditOpening] = useState('');
  const [editReceived, setEditReceived] = useState('');
  const [editExp, setEditExp] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [snpDateFilter, setSnpDateFilter] = useState('');
  const [snpPage, setSnpPage] = useState(1);
  const [snpUploading, setSnpUploading] = useState(false);

  const isIcds = deptCode === 'ICDS' || deptCode === 'AWC_ICDS';

  const SNP_CSV_HEADER = 'organization_id,record_date,opening_balance_kg,received_kg,exp_kg\n';
  const handleDownloadSnpTemplate = () => {
    const exampleOrgId = orgs[0]?.id ?? 1;
    const exampleRow = `${exampleOrgId},2026-02-20,10,5,7`;
    const csvContent = SNP_CSV_HEADER + exampleRow + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'snp_daily_stock_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const snpFiltered = useMemo(() => {
    if (!snpList.length) return [];
    if (!snpDateFilter.trim()) return snpList;
    return snpList.filter((row) => {
      const d = row.record_date;
      if (!d) return false;
      const rowDate = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
      return rowDate === snpDateFilter;
    });
  }, [snpList, snpDateFilter]);

  const snpTotalRows = snpFiltered.length;
  const snpTotalPages = Math.max(1, Math.ceil(snpTotalRows / SNP_ROWS_PER_PAGE));
  const snpPageClamped = Math.min(Math.max(1, snpPage), snpTotalPages);
  const snpStart = (snpPageClamped - 1) * SNP_ROWS_PER_PAGE;
  const snpPaginated = snpFiltered.slice(snpStart, snpStart + SNP_ROWS_PER_PAGE);
  const snpShowStart = snpTotalRows === 0 ? 0 : snpStart + 1;
  const snpShowEnd = Math.min(snpStart + SNP_ROWS_PER_PAGE, snpTotalRows);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, deptList] = await Promise.all([authApi.me(), departmentsApi.list()]);
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/');
          return;
        }
        setMe(user);
        setDepartments(deptList);
        const dept = user.department_id ? deptList.find((d) => d.id === user.department_id) : null;
        setDeptCode(dept?.code ?? null);
        if (user.department_id) {
          const [orgList, snp] = await Promise.all([
            organizationsApi.listByDepartment(user.department_id, { skip: 0, limit: 500 }),
            icdsApi.listSnpForDept({ limit: 500 }),
          ]);
          setOrgs(orgList);
          setSnpList(Array.isArray(snp) ? snp : []);
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

  const refreshSnp = async () => {
    if (!me?.department_id) return;
    try {
      const snp = await icdsApi.listSnpForDept({ limit: 500 });
      setSnpList(Array.isArray(snp) ? snp : []);
    } catch {
      // keep current list
    }
  };

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const orgId = snpOrgId === '' ? null : snpOrgId;
    if (orgId == null || !snpDate.trim()) {
      setError('Select an organization and enter date.');
      return;
    }
    setSnpSubmitting(true);
    setError(null);
    try {
      await icdsApi.createSnpDailyStock({
        organization_id: orgId,
        record_date: snpDate.trim(),
        opening_balance_kg: _n(snpOpening),
        received_kg: _n(snpReceived),
        exp_kg: _n(snpExp),
      });
      setSnpDate('');
      setSnpOpening('');
      setSnpReceived('');
      setSnpExp('');
      await refreshSnp();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add SNP daily stock');
    } finally {
      setSnpSubmitting(false);
    }
  };

  const startEdit = (row: SnpDailyStock) => {
    setEditingId(row.id);
    setEditDate(row.record_date ? (typeof row.record_date === 'string' ? row.record_date.slice(0, 10) : new Date(row.record_date).toISOString().slice(0, 10)) : '');
    setEditOpening(String(row.opening_balance_kg ?? ''));
    setEditReceived(String(row.received_kg ?? ''));
    setEditExp(String(row.exp_kg ?? ''));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId == null) return;
    setEditSubmitting(true);
    setError(null);
    try {
      await icdsApi.updateSnpDailyStock(editingId, {
        record_date: editDate.trim() || undefined,
        opening_balance_kg: _n(editOpening),
        received_kg: _n(editReceived),
        exp_kg: _n(editExp),
      });
      setEditingId(null);
      await refreshSnp();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this SNP daily stock entry?')) return;
    setError(null);
    try {
      await icdsApi.deleteSnpDailyStock(id);
      await refreshSnp();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleBulkSnpUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('snpCsvFile') as HTMLInputElement;
    if (!fileInput?.files || fileInput.files.length === 0) {
      setError('Please choose a CSV file.');
      return;
    }
    const file = fileInput.files[0];
    setSnpUploading(true);
    setError(null);
    try {
      const result = await icdsApi.bulkSnpCsv(file);
      await refreshSnp();
      if (result.errors?.length) {
        setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
      }
      fileInput.value = '';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setSnpUploading(false);
    }
  };

  const orgById: Record<number, Organization> = {};
  orgs.forEach((o) => { orgById[o.id] = o; });

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
      sectionLabel={t('super.sidebar.dashboard', language)}
      navItems={[
        { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
        { href: '/admin/dept/snp', labelKey: 'super.sidebar.snp' },
      ]}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-6xl space-y-4">
        {loading && !me ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader />
          </div>
        ) : (
          <>
            {error && <p className="text-xs text-red-500">{error}</p>}

            {/* SNP add form – same amber card style as table, with Odia support */}
            <section className="rounded-xl border border-amber-200/80 bg-amber-500/5 shadow-sm overflow-hidden">
              <div className="border-b border-amber-200/60 bg-amber-500/10 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                  {t('awc.snp.addFormTitle', language)}
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  {t('awc.snp.addFormDescription', language)}
                </p>
              </div>
              <form className="grid gap-4 p-4 text-xs md:grid-cols-2" onSubmit={handleAdd}>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block font-medium text-slate-700">
                    {t('awc.snp.awcLabel', language)}
                  </label>
                  <SearchableSelect
                    options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                    value={snpOrgId === '' ? '' : snpOrgId}
                    onChange={(v) => setSnpOrgId(v === '' ? '' : Number(v))}
                    placeholder={t('awc.snp.selectAwc', language)}
                    noResultsText={t('awc.snp.noMatches', language)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700">
                    {t('awc.snp.date', language)}
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    value={snpDate}
                    onChange={(e) => setSnpDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700">
                    {t('awc.snp.openingBalanceKg', language)}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    value={snpOpening}
                    onChange={(e) => setSnpOpening(e.target.value)}
                    placeholder={t('awc.snp.placeholderOpening', language)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700">
                    {t('awc.snp.receivedKg', language)}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    value={snpReceived}
                    onChange={(e) => setSnpReceived(e.target.value)}
                    placeholder={t('awc.snp.placeholderReceived', language)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-700">
                    {t('awc.snp.expKg', language)}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-slate-800 shadow-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    value={snpExp}
                    onChange={(e) => setSnpExp(e.target.value)}
                    placeholder={t('awc.snp.placeholderExp', language)}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={snpSubmitting}
                    className="rounded-md bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:opacity-60"
                  >
                    {snpSubmitting ? t('awc.snp.addingButton', language) : t('awc.snp.addButton', language)}
                  </button>
                </div>
              </form>
            </section>

            {/* Bulk upload CSV */}
            <section className="rounded-xl border border-amber-200/80 bg-amber-500/5 shadow-sm overflow-hidden">
              <div className="border-b border-amber-200/60 bg-amber-500/10 px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                  {t('awc.snp.bulkUploadTitle', language)}
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  {t('awc.snp.bulkUploadDescription', language)}
                </p>
              </div>
              <form className="p-4 flex flex-wrap items-end gap-3" onSubmit={handleBulkSnpUpload}>
                <button
                  type="button"
                  onClick={handleDownloadSnpTemplate}
                  className="rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-800 shadow-sm hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {t('awc.snp.downloadTemplate', language)}
                </button>
                <label className="flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-amber-50 cursor-pointer">
                  <input
                    type="file"
                    name="snpCsvFile"
                    accept=".csv"
                    className="sr-only"
                  />
                  <span>{t('awc.snp.chooseFile', language)}</span>
                </label>
                <button
                  type="submit"
                  disabled={snpUploading}
                  className="rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {snpUploading ? t('awc.snp.uploading', language) : t('awc.snp.uploadCsv', language)}
                </button>
              </form>
            </section>

            {/* SNP table – same UI as organization profile */}
            <section className="rounded-xl border border-amber-200/80 bg-amber-500/5 shadow-sm overflow-hidden">
              <div className="border-b border-amber-200/60 bg-amber-500/10 px-4 py-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                      {t('awc.snp.title', language)}
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {t('awc.snp.subtitle', language)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-medium text-slate-700">
                      {t('awc.snp.filterByDate', language)}
                    </label>
                    <input
                      type="date"
                      value={snpDateFilter}
                      onChange={(e) => {
                        setSnpDateFilter(e.target.value);
                        setSnpPage(1);
                      }}
                      className="rounded-md border border-amber-300 bg-white px-2 py-1.5 text-xs text-slate-800 shadow-sm"
                    />
                    {snpDateFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setSnpDateFilter('');
                          setSnpPage(1);
                        }}
                        className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
                      >
                        {t('awc.snp.allDates', language)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-amber-500/10">
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.slNo', language)}</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.organization', language)}</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.date', language)}</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.openingBalance', language)}</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.received', language)}</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.totalStock', language)}</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.exp', language)}</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.bal', language)}</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-700">{t('awc.snp.actions', language)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snpTotalRows === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                          {t('awc.snp.noEntriesYet', language)}
                        </td>
                      </tr>
                    )}
                    {snpPaginated.map((row, index) => {
                      const slNo = snpStart + index + 1;
                      const opening = row.opening_balance_kg ?? 0;
                      const received = row.received_kg ?? 0;
                      const exp = row.exp_kg ?? 0;
                      const totalStock = opening + received;
                      const bal = totalStock - exp;
                      const dateStr = row.record_date
                        ? new Date(row.record_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '—';
                      const isEditing = editingId === row.id;

                      if (isEditing) {
                        return (
                          <tr key={row.id} className="border-b border-slate-200/50 bg-amber-50/80">
                            <td className="px-4 py-2 text-center text-slate-700">{slNo}</td>
                            <td className="px-4 py-2 text-center text-slate-700">{orgById[row.organization_id]?.name ?? row.organization_id}</td>
                            <td colSpan={6} className="px-4 py-2">
                              <form onSubmit={handleUpdate} className="flex flex-wrap items-center justify-center gap-2">
                                <input
                                  type="date"
                                  className="rounded-md border border-amber-300 px-2 py-1 text-xs"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                />
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  placeholder="Opening"
                                  className="w-20 rounded-md border border-amber-300 px-2 py-1 text-xs"
                                  value={editOpening}
                                  onChange={(e) => setEditOpening(e.target.value)}
                                />
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  placeholder="Received"
                                  className="w-20 rounded-md border border-amber-300 px-2 py-1 text-xs"
                                  value={editReceived}
                                  onChange={(e) => setEditReceived(e.target.value)}
                                />
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  placeholder="Exp"
                                  className="w-20 rounded-md border border-amber-300 px-2 py-1 text-xs"
                                  value={editExp}
                                  onChange={(e) => setEditExp(e.target.value)}
                                />
                                <button
                                  type="submit"
                                  disabled={editSubmitting}
                                  className="rounded-md bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                                >
                                  {editSubmitting ? t('awc.snp.saving', language) : t('awc.snp.save', language)}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="rounded-md border border-amber-300 bg-white px-2 py-1 text-xs hover:bg-amber-50"
                                >
                                  {t('awc.snp.cancel', language)}
                                </button>
                              </form>
                            </td>
                            <td className="px-4 py-2" />
                          </tr>
                        );
                      }

                      return (
                        <tr key={row.id} className="border-b border-slate-200/50 last:border-0 hover:bg-white/30 transition-colors">
                          <td className="px-4 py-2 text-center font-medium text-slate-700">{slNo}</td>
                          <td className="px-4 py-2 text-center font-medium text-slate-700">{orgById[row.organization_id]?.name ?? row.organization_id}</td>
                          <td className="px-4 py-2 text-center text-slate-900">{dateStr}</td>
                          <td className="px-4 py-2 text-center text-slate-900">{snpKg(row.opening_balance_kg)}</td>
                          <td className="px-4 py-2 text-center text-slate-900">{snpKg(row.received_kg)}</td>
                          <td className="px-4 py-2 text-center text-slate-900">{snpKg(totalStock)}</td>
                          <td className="px-4 py-2 text-center text-slate-900">{snpKg(row.exp_kg)}</td>
                          <td className="px-4 py-2 text-center text-slate-900">{snpKg(bal)}</td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                aria-label={t('awc.snp.edit', language)}
                                className="rounded p-1.5 text-amber-700 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(row.id)}
                                aria-label={t('awc.snp.delete', language)}
                                className="rounded p-1.5 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/60 bg-amber-500/5 px-4 py-2">
                <p className="text-xs text-slate-600">
                  {t('awc.snp.showingRows', language)
                    .replace('%1', String(snpShowStart))
                    .replace('%2', String(snpShowEnd))
                    .replace('%3', String(snpTotalRows))}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={snpPageClamped <= 1}
                    onClick={() => setSnpPage((p) => Math.max(1, p - 1))}
                    className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('awc.snp.prev', language)}
                  </button>
                  <span className="px-2 text-xs text-slate-600">
                    {snpPageClamped} / {snpTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={snpPageClamped >= snpTotalPages}
                    onClick={() => setSnpPage((p) => Math.min(snpTotalPages, p + 1))}
                    className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('awc.snp.next', language)}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </SuperAdminDashboardLayout>
  );
}
