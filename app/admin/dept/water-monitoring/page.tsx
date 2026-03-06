'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    authApi,
    organizationsApi,
    departmentsApi,
    watcoApi,
    clearToken,
    Organization,
    User,
    WatcoDailyOperation,
    WatcoDailyPumpLog,
    WatcoDailyTankLevel
} from '../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { Loader } from '../../../../components/common/Loader';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';

const _n = (s: string) => (s.trim() ? (Number(s) || undefined) : undefined);
const ROWS_PER_PAGE = 10;

type DataType = 'operations' | 'pump-logs' | 'tank-levels';

export default function WaterMonitoringPage() {
    const router = useRouter();
    const { language } = useLanguage();
    const [me, setMe] = useState<User | null>(null);
    const [deptCode, setDeptCode] = useState<string | null>(null);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<DataType>('operations');

    // Data Lists
    const [operationsList, setOperationsList] = useState<WatcoDailyOperation[]>([]);
    const [pumpLogsList, setPumpLogsList] = useState<WatcoDailyPumpLog[]>([]);
    const [tankLevelsList, setTankLevelsList] = useState<WatcoDailyTankLevel[]>([]);

    // Selection & Filters
    const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');
    const [dateFilter, setDateFilter] = useState('');
    const [page, setPage] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form States (Common)
    const [recordDate, setRecordDate] = useState('');

    // Operations Form
    const [producedMld, setProducedMld] = useState('');
    const [suppliedMld, setSuppliedMld] = useState('');
    const [leakages, setLeakages] = useState('');
    const [pumpsOperational, setPumpsOperational] = useState('');
    const [pumpsTotal, setPumpsTotal] = useState('');

    // Pump Logs Form
    const [totalRunTime, setTotalRunTime] = useState('');

    // Tank Levels Form
    const [tankName, setTankName] = useState('');
    const [openingLevel, setOpeningLevel] = useState('');
    const [intake, setIntake] = useState('');
    const [distributed, setDistributed] = useState('');
    const [closingLevel, setClosingLevel] = useState('');

    const isWatco = deptCode === 'WATCO_RWSS';

    // Automated Closing Balance for Tank Levels
    useEffect(() => {
        if (activeTab === 'tank-levels') {
            const openNum = Number(openingLevel) || 0;
            const recvNum = Number(intake) || 0;
            const issueNum = Number(distributed) || 0;
            setClosingLevel(String(openNum + recvNum - issueNum));
        }
    }, [openingLevel, intake, distributed, activeTab]);

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
        if (me?.department_id && isWatco) {
            refreshData();
        }
    }, [activeTab, selectedOrgId]);

    const refreshData = async () => {
        try {
            const orgId = selectedOrgId === '' ? undefined : Number(selectedOrgId);
            if (activeTab === 'operations') {
                const data = orgId
                    ? await watcoApi.listDailyOperations(orgId, { limit: 100 })
                    : await watcoApi.listDailyOperationsForDept({ limit: 500 });
                setOperationsList(data);
            } else if (activeTab === 'pump-logs') {
                const data = orgId
                    ? await watcoApi.listDailyPumpLogs(orgId, { limit: 100 })
                    : await watcoApi.listDailyPumpLogsForDept({ limit: 500 });
                setPumpLogsList(data);
            } else if (activeTab === 'tank-levels') {
                const data = orgId
                    ? await watcoApi.listDailyTankLevels(orgId, { limit: 200 })
                    : await watcoApi.listDailyTankLevelsForDept({ limit: 500 });
                setTankLevelsList(data);
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
            if (activeTab === 'operations') {
                await watcoApi.createDailyOperation({
                    organization_id: Number(selectedOrgId),
                    record_date: recordDate,
                    water_produced_mld: _n(producedMld),
                    water_supplied_mld: _n(suppliedMld),
                    active_leakages: _n(leakages),
                    pumps_operational: _n(pumpsOperational),
                    pumps_total: _n(pumpsTotal),
                });
                setProducedMld(''); setSuppliedMld(''); setLeakages(''); setPumpsOperational(''); setPumpsTotal('');
            } else if (activeTab === 'pump-logs') {
                await watcoApi.createDailyPumpLog({
                    organization_id: Number(selectedOrgId),
                    record_date: recordDate,
                    total_running_hours: _n(totalRunTime),
                });
                setTotalRunTime('');
            } else if (activeTab === 'tank-levels') {
                await watcoApi.createDailyTankLevel({
                    organization_id: Number(selectedOrgId),
                    record_date: recordDate,
                    tank_name: tankName,
                    opening_level_ml: _n(openingLevel),
                    intake_ml: _n(intake),
                    distributed_ml: _n(distributed),
                    closing_level_ml: _n(closingLevel),
                });
                setTankName(''); setOpeningLevel(''); setIntake(''); setDistributed(''); setClosingLevel('');
            }
            await refreshData();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to add record');
        } finally {
            setSubmitting(false);
        }
    };

    const currentList = useMemo(() => {
        let list: any[] = [];
        if (activeTab === 'operations') list = operationsList;
        if (activeTab === 'pump-logs') list = pumpLogsList;
        if (activeTab === 'tank-levels') list = tankLevelsList;

        const sorted = [...list].sort((a, b) => {
            const da = new Date(a.record_date || 0).getTime();
            const db = new Date(b.record_date || 0).getTime();
            return db - da;
        });

        if (!dateFilter) return sorted;
        return sorted.filter(row => row.record_date?.slice(0, 10) === dateFilter);
    }, [activeTab, operationsList, pumpLogsList, tankLevelsList, dateFilter]);

    const totalRows = currentList.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
    const pageClamped = Math.min(Math.max(1, page), totalPages);
    const start = (pageClamped - 1) * ROWS_PER_PAGE;
    const paginated = currentList.slice(start, start + ROWS_PER_PAGE);

    const handleDownloadTemplate = () => {
        let header = '';
        let example = '';
        const orgId = selectedOrgId || (orgs[0]?.id ?? 1);

        if (activeTab === 'operations') {
            header = 'organization_id,record_date,water_produced_mld,water_supplied_mld,active_leakages,pumps_operational,pumps_total\n';
            example = `${orgId},2026-02-20,15.5,14.2,2,10,12\n`;
        } else if (activeTab === 'pump-logs') {
            header = 'organization_id,record_date,total_running_hours\n';
            example = `${orgId},2026-02-20,18.5\n`;
        } else if (activeTab === 'tank-levels') {
            header = 'organization_id,record_date,tank_name,opening_level_ml,intake_ml,distributed_ml,closing_level_ml\n';
            example = `${orgId},2026-02-20,Main Reservoir,5.0,10.0,8.0,7.0\n`;
        }

        const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `watco_${activeTab}_template.csv`;
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
            if (activeTab === 'operations') res = await watcoApi.bulkDailyOperationsCsv(file);
            else if (activeTab === 'pump-logs') res = await watcoApi.bulkDailyPumpLogsCsv(file);
            else if (activeTab === 'tank-levels') res = await watcoApi.bulkDailyTankLevelsCsv(file);

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
    if (!loading && !isWatco) {
        router.replace('/admin/dept');
        return null;
    }

    return (
        <SuperAdminDashboardLayout
            user={me}
            isUserLoading={loading && !me}
            panelTitle={t('login.dept.title', language)}
            sectionLabel="Water Monitoring"
            navItems={[
                { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
                { href: '/admin/dept/water-monitoring', labelKey: 'water.monitoring.title' },
            ]}
            onLogout={() => { clearToken(); router.push('/'); }}
        >
            <div className="mx-auto max-w-6xl space-y-6 pb-20">
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                    {[
                        { id: 'operations', label: 'Operations & Leakages' },
                        { id: 'pump-logs', label: 'Pump Hours' },
                        { id: 'tank-levels', label: 'Reservoir / Tank Levels' },
                    ].map((tInfo) => (
                        <button
                            key={tInfo.id}
                            onClick={() => { setActiveTab(tInfo.id as DataType); setPage(1); }}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tInfo.id
                                ? 'border-cyan-600 text-cyan-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {tInfo.label}
                        </button>
                    ))}
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                {/* Form Section */}
                <section className="rounded-xl border border-cyan-200 bg-cyan-50/30 shadow-sm overflow-hidden">
                    <div className="bg-cyan-600 px-4 py-3 text-white">
                        <h2 className="text-sm font-semibold uppercase tracking-wide">
                            Add {activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Record
                        </h2>
                    </div>
                    <form onSubmit={handleAdd} className="p-4 grid gap-4 text-xs md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1">
                            <label className="font-medium text-slate-700">Scheme / Organization</label>
                            <SearchableSelect
                                options={orgs.map(o => ({ value: o.id, label: o.name }))}
                                value={selectedOrgId}
                                onChange={v => setSelectedOrgId(v === '' ? '' : Number(v))}
                                placeholder="Select Scheme"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="font-medium text-slate-700">Record Date</label>
                            <input
                                type="date"
                                className="w-full rounded border px-3 py-2"
                                value={recordDate}
                                onChange={e => setRecordDate(e.target.value)}
                                required
                            />
                        </div>

                        {activeTab === 'operations' && (
                            <>
                                <div className="space-y-1"><label className="font-medium">Total Produced (MLD)</label><input type="number" step="any" className="w-full rounded border px-3 py-2" value={producedMld} onChange={e => setProducedMld(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">Total Supplied (MLD)</label><input type="number" step="any" className="w-full rounded border px-3 py-2" value={suppliedMld} onChange={e => setSuppliedMld(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">Active Leakages</label><input type="number" className="w-full rounded border px-3 py-2" value={leakages} onChange={e => setLeakages(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">Operational Pumps</label><input type="number" className="w-full rounded border px-3 py-2" value={pumpsOperational} onChange={e => setPumpsOperational(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">Total Pumps</label><input type="number" className="w-full rounded border px-3 py-2" value={pumpsTotal} onChange={e => setPumpsTotal(e.target.value)} /></div>
                            </>
                        )}

                        {activeTab === 'pump-logs' && (
                            <>
                                <div className="space-y-1"><label className="font-medium">Total Running Hours</label><input type="number" step="any" className="w-full rounded border px-3 py-2" value={totalRunTime} onChange={e => setTotalRunTime(e.target.value)} /></div>
                            </>
                        )}

                        {activeTab === 'tank-levels' && (
                            <>
                                <div className="space-y-1"><label className="font-medium">Reservoir / Tank Name</label><input type="text" className="w-full rounded border px-3 py-2" value={tankName} onChange={e => setTankName(e.target.value)} required /></div>
                                <div className="space-y-1"><label className="font-medium">Opening Level (ML)</label><input type="number" step="any" className="w-full rounded border px-3 py-2" value={openingLevel} onChange={e => setOpeningLevel(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">Intake (ML)</label><input type="number" step="any" className="w-full rounded border px-3 py-2" value={intake} onChange={e => setIntake(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">Distributed (ML)</label><input type="number" step="any" className="w-full rounded border px-3 py-2" value={distributed} onChange={e => setDistributed(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">Closing Level (ML)</label><input type="number" step="any" className="w-full rounded border px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" value={closingLevel} readOnly /></div>
                            </>
                        )}

                        <div className="md:col-span-2 lg:col-span-3 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded bg-cyan-600 px-6 py-2 font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Record'}
                            </button>
                        </div>
                    </form>
                </section>

                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">Bulk Import (CSV)</h3>
                    <form onSubmit={handleBulkUpload} className="flex flex-wrap items-center gap-4 text-xs">
                        <button type="button" onClick={handleDownloadTemplate} className="px-3 py-2 bg-white border rounded hover:bg-slate-50 transition-colors">Download Template</button>
                        <label className="px-3 py-2 bg-white border rounded cursor-pointer hover:bg-slate-50">
                            <input type="file" name="csvFile" accept=".csv" className="sr-only" />Choose CSV File
                        </label>
                        <button type="submit" disabled={uploading} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 disabled:opacity-50">
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Historical Records</h3>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-600">Filter Date:</label>
                            <input type="date" className="rounded border text-xs px-2 py-1" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
                            {dateFilter && <button onClick={() => setDateFilter('')} className="text-xs text-cyan-600 hover:underline">Clear</button>}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-4 py-2 text-center">SL No</th>
                                    <th className="px-4 py-2 text-center">Scheme / Organization</th>
                                    <th className="px-4 py-2 text-center">Date</th>
                                    {activeTab === 'operations' && (
                                        <>
                                            <th className="px-4 py-2 text-right">Prod (MLD)</th>
                                            <th className="px-4 py-2 text-right">Supplied (MLD)</th>
                                            <th className="px-4 py-2 text-right">Leakages</th>
                                            <th className="px-4 py-2 text-center">Pumps On/Total</th>
                                        </>
                                    )}
                                    {activeTab === 'pump-logs' && (
                                        <>
                                            <th className="px-4 py-2 text-right">Run Hrs</th>
                                        </>
                                    )}
                                    {activeTab === 'tank-levels' && (
                                        <>
                                            <th className="px-4 py-2 text-left">Tank Name</th>
                                            <th className="px-4 py-2 text-right">Open (ML)</th>
                                            <th className="px-4 py-2 text-right">Intake (ML)</th>
                                            <th className="px-4 py-2 text-right">Dist (ML)</th>
                                            <th className="px-4 py-2 text-right">Close (ML)</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {!paginated.length && <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 italic">No records found for this selection</td></tr>}
                                {paginated.map((row: any, i) => (
                                    <tr key={row.id || i} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-4 py-2 text-center font-medium text-slate-700">{start + i + 1}</td>
                                        <td className="px-4 py-2 text-center text-slate-700">{orgs.find(o => o.id === row.organization_id)?.name || row.organization_id}</td>
                                        <td className="px-4 py-2 text-center text-slate-900">{row.record_date?.slice(0, 10)}</td>
                                        {activeTab === 'operations' && (
                                            <>
                                                <td className="px-4 py-2 text-right">{row.water_produced_mld ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.water_supplied_mld ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.active_leakages ?? '—'}</td>
                                                <td className="px-4 py-2 text-center">{(row.pumps_operational ?? '—')} / {(row.pumps_total ?? '—')}</td>
                                            </>
                                        )}
                                        {activeTab === 'pump-logs' && (
                                            <>
                                                <td className="px-4 py-2 text-right">{row.total_running_hours ?? '—'}</td>
                                            </>
                                        )}
                                        {activeTab === 'tank-levels' && (
                                            <>
                                                <td className="px-4 py-2 text-left font-medium">{row.tank_name}</td>
                                                <td className="px-4 py-2 text-right">{row.opening_level_ml ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.intake_ml ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.distributed_ml ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.closing_level_ml ?? '—'}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 flex items-center justify-between border-t">
                        <span className="text-[10px] text-slate-500">Page {pageClamped} of {totalPages} ({totalRows} total)</span>
                        <div className="flex gap-1">
                            <button disabled={pageClamped === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded border bg-white disabled:opacity-50">Prev</button>
                            <button disabled={pageClamped === totalPages} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded border bg-white disabled:opacity-50">Next</button>
                        </div>
                    </div>
                </section>
            </div>
        </SuperAdminDashboardLayout>
    );
}

