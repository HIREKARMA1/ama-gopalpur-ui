'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
    authApi,
    organizationsApi,
    departmentsApi,
    healthApi,
    clearToken,
    Organization,
    User,
    Department,
    HealthDailyAttendance,
    HealthDailyMedicineStock,
    HealthDailyExtraData,
    HealthPatientService
} from '../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';
import { Loader } from '../../../../components/common/Loader';
import { SearchableSelect } from '../../../../components/common/SearchableSelect';

const _n = (s: string) => (s.trim() ? (Number(s) || undefined) : undefined);
const ROWS_PER_PAGE = 10;

type DataType = 'attendance' | 'medicine' | 'extra' | 'patients';

export default function HealthMonitoringPage() {
    const router = useRouter();
    const { language } = useLanguage();
    const [me, setMe] = useState<User | null>(null);
    const [deptCode, setDeptCode] = useState<string | null>(null);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<DataType>('attendance');

    // Data Lists
    const [attendanceList, setAttendanceList] = useState<HealthDailyAttendance[]>([]);
    const [medicineList, setMedicineList] = useState<HealthDailyMedicineStock[]>([]);
    const [extraList, setExtraList] = useState<HealthDailyExtraData[]>([]);
    const [patientList, setPatientList] = useState<HealthPatientService[]>([]);

    // Selection & Filters
    const [selectedOrgId, setSelectedOrgId] = useState<number | ''>('');
    const [dateFilter, setDateFilter] = useState('');
    const [page, setPage] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form States (Common)
    const [recordDate, setRecordDate] = useState('');

    // Attendance Form
    const [staffCount, setStaffCount] = useState('');
    const [docPresent, setDocPresent] = useState(false);

    // Medicine Form
    const [medName, setMedName] = useState('');
    const [opening, setOpening] = useState('');
    const [received, setReceived] = useState('');
    const [issued, setIssued] = useState('');
    const [closing, setClosing] = useState('');

    // Extra Data Form
    const [vanAvailable, setVanAvailable] = useState(false);
    const [remarks, setRemarks] = useState('');

    // Patient Services Form
    const [opd, setOpd] = useState('');
    const [ipd, setIpd] = useState('');
    const [surgeries, setSurgeries] = useState('');
    const [deliveries, setDeliveries] = useState('');

    const isHealth = deptCode === 'HEALTH';

    // Automated Closing Balance
    useEffect(() => {
        if (activeTab === 'medicine') {
            const openNum = Number(opening) || 0;
            const recvNum = Number(received) || 0;
            const issueNum = Number(issued) || 0;
            setClosing(String(openNum + recvNum - issueNum));
        }
    }, [opening, received, issued, activeTab]);

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
        if (me?.department_id && isHealth) {
            refreshData();
        }
    }, [activeTab, selectedOrgId]);

    const refreshData = async () => {
        try {
            const orgId = selectedOrgId === '' ? undefined : Number(selectedOrgId);
            if (activeTab === 'attendance') {
                const data = orgId
                    ? await healthApi.listDailyAttendance(orgId, { limit: 100 })
                    : await healthApi.listDailyAttendanceForDept({ limit: 500 });
                setAttendanceList(data);
            } else if (activeTab === 'medicine') {
                const data = orgId
                    ? await healthApi.listDailyMedicineStock(orgId, { limit: 200 })
                    : await healthApi.listDailyMedicineStockForDept({ limit: 500 });
                setMedicineList(data);
            } else if (activeTab === 'extra') {
                const data = orgId
                    ? await healthApi.listDailyExtraData(orgId, { limit: 100 })
                    : await healthApi.listDailyExtraDataForDept({ limit: 500 });
                setExtraList(data);
            } else if (activeTab === 'patients') {
                const data = orgId
                    ? await healthApi.listPatientServices(orgId, { limit: 100 })
                    : await healthApi.listPatientServicesForDept({ limit: 500 });
                setPatientList(data);
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
            if (activeTab === 'attendance') {
                await healthApi.createDailyAttendance({
                    organization_id: Number(selectedOrgId),
                    record_date: recordDate,
                    staff_present_count: _n(staffCount),
                    doctor_present: docPresent
                });
                setStaffCount('');
                setDocPresent(false);
            } else if (activeTab === 'medicine') {
                await healthApi.createDailyMedicineStock({
                    organization_id: Number(selectedOrgId),
                    record_date: recordDate,
                    medicine_name: medName,
                    opening_balance: _n(opening),
                    received: _n(received),
                    issued: _n(issued),
                    closing_balance: _n(closing)
                });
                setMedName('');
                setOpening('');
                setReceived('');
                setIssued('');
                setClosing('');
            } else if (activeTab === 'extra') {
                await healthApi.createDailyExtraData({
                    organization_id: Number(selectedOrgId),
                    record_date: recordDate,
                    mobile_van_available: vanAvailable,
                    remarks: remarks || null
                });
                setVanAvailable(false);
                setRemarks('');
            } else if (activeTab === 'patients') {
                await healthApi.createPatientService({
                    organization_id: Number(selectedOrgId),
                    record_date: recordDate,
                    opd_count: _n(opd),
                    ipd_count: _n(ipd),
                    surgeries: _n(surgeries),
                    deliveries: _n(deliveries)
                });
                setOpd(''); setIpd(''); setSurgeries(''); setDeliveries('');
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
        if (activeTab === 'attendance') list = attendanceList;
        if (activeTab === 'medicine') list = medicineList;
        if (activeTab === 'extra') list = extraList;
        if (activeTab === 'patients') list = patientList;

        // Sort by date descending
        const sorted = [...list].sort((a, b) => {
            const da = new Date(a.record_date || 0).getTime();
            const db = new Date(b.record_date || 0).getTime();
            return db - da;
        });

        if (!dateFilter) return sorted;
        return sorted.filter(row => row.record_date?.slice(0, 10) === dateFilter);
    }, [activeTab, attendanceList, medicineList, extraList, patientList, dateFilter]);

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
            header = 'organization_id,record_date,staff_present_count,doctor_present\n';
            example = `${orgId},2026-02-20,15,true\n`;
        } else if (activeTab === 'medicine') {
            header = 'organization_id,record_date,medicine_name,opening_balance,received,issued,closing_balance\n';
            example = `${orgId},2026-02-20,Paracetamol 500mg,100,50,30,120\n`;
        } else if (activeTab === 'extra') {
            header = 'organization_id,record_date,mobile_van_available,remarks\n';
            example = `${orgId},2026-02-20,true,Normal service\n`;
        } else if (activeTab === 'patients') {
            header = 'organization_id,record_date,opd_count,ipd_count,surgeries,deliveries\n';
            example = `${orgId},2026-02-20,45,5,1,2\n`;
        }

        const blob = new Blob([header + example], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `health_${activeTab}_template.csv`;
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
            if (activeTab === 'attendance') res = await healthApi.bulkDailyAttendanceCsv(file);
            else if (activeTab === 'medicine') res = await healthApi.bulkDailyMedicineStockCsv(file);
            else if (activeTab === 'extra') res = await healthApi.bulkDailyExtraDataCsv(file);
            else if (activeTab === 'patients') res = await healthApi.bulkPatientServicesCsv(file);

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
    if (!loading && !isHealth) {
        router.replace('/admin/dept');
        return null;
    }

    return (
        <SuperAdminDashboardLayout
            user={me}
            isUserLoading={loading && !me}
            panelTitle={t('login.dept.title', language)}
            sectionLabel={t('health.monitoring.title', language)}
            navItems={[
                { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
                { href: '/admin/dept/health-monitoring', labelKey: 'health.monitoring.title' },
            ]}
            onLogout={() => { clearToken(); router.push('/'); }}
        >
            <div className="mx-auto max-w-6xl space-y-6 pb-20">
                {/* Tab Switcher */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
                    {[
                        { id: 'attendance', labelKey: 'health.monitoring.attendance.title' },
                        { id: 'medicine', labelKey: 'health.monitoring.medicine.title' },
                        { id: 'extra', labelKey: 'health.monitoring.extra.title' },
                        { id: 'patients', labelKey: 'health.monitoring.patients.title' },
                    ].map((tInfo) => (
                        <button
                            key={tInfo.id}
                            onClick={() => { setActiveTab(tInfo.id as DataType); setPage(1); }}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tInfo.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            {t(tInfo.labelKey as any, language)}
                        </button>
                    ))}
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">{error}</p>}

                {/* Form Section */}
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
                                options={orgs.map(o => ({ value: o.id, label: o.name }))}
                                value={selectedOrgId}
                                onChange={v => setSelectedOrgId(v === '' ? '' : Number(v))}
                                placeholder="Select Organization"
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

                        {/* Attendance Fields */}
                        {activeTab === 'attendance' && (
                            <>
                                <div className="space-y-1">
                                    <label className="font-medium text-slate-700">{t('health.monitoring.attendance.count', language)}</label>
                                    <input type="number" className="w-full rounded border px-3 py-2" value={staffCount} onChange={e => setStaffCount(e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input type="checkbox" id="docPres" checked={docPresent} onChange={e => setDocPresent(e.target.checked)} />
                                    <label htmlFor="docPres" className="font-medium text-slate-700">{t('health.monitoring.attendance.doc', language)}</label>
                                </div>
                            </>
                        )}

                        {/* Medicine Fields */}
                        {activeTab === 'medicine' && (
                            <>
                                <div className="space-y-1">
                                    <label className="font-medium text-slate-700">{t('health.monitoring.medicine.name', language)}</label>
                                    <input type="text" className="w-full rounded border px-3 py-2" value={medName} onChange={e => setMedName(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-medium text-slate-700">{t('health.monitoring.medicine.opening', language)}</label>
                                    <input type="number" className="w-full rounded border px-3 py-2" value={opening} onChange={e => setOpening(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-medium text-slate-700">{t('health.monitoring.medicine.received', language)}</label>
                                    <input type="number" className="w-full rounded border px-3 py-2" value={received} onChange={e => setReceived(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-medium text-slate-700">{t('health.monitoring.medicine.issued', language)}</label>
                                    <input type="number" className="w-full rounded border px-3 py-2" value={issued} onChange={e => setIssued(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="font-medium text-slate-700">{t('health.monitoring.medicine.closing', language)}</label>
                                    <input type="number" className="w-full rounded border px-3 py-2 bg-slate-50 text-slate-500 cursor-not-allowed" value={closing} readOnly />
                                </div>
                            </>
                        )}

                        {/* Extra Fields */}
                        {activeTab === 'extra' && (
                            <>
                                <div className="flex items-center gap-2 pt-6">
                                    <input type="checkbox" id="vanAv" checked={vanAvailable} onChange={e => setVanAvailable(e.target.checked)} />
                                    <label htmlFor="vanAv" className="font-medium text-slate-700">{t('health.monitoring.extra.van', language)}</label>
                                </div>
                                <div className="space-y-1 lg:col-span-2">
                                    <label className="font-medium text-slate-700">{t('health.monitoring.extra.remarks', language)}</label>
                                    <input type="text" className="w-full rounded border px-3 py-2" value={remarks} onChange={e => setRemarks(e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* Patients Fields */}
                        {activeTab === 'patients' && (
                            <>
                                <div className="space-y-1"><label className="font-medium">{t('health.monitoring.patients.opd', language)}</label><input type="number" className="w-full rounded border px-2 py-1.5" value={opd} onChange={e => setOpd(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">{t('health.monitoring.patients.ipd', language)}</label><input type="number" className="w-full rounded border px-2 py-1.5" value={ipd} onChange={e => setIpd(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">{t('health.monitoring.patients.surgeries', language)}</label><input type="number" className="w-full rounded border px-2 py-1.5" value={surgeries} onChange={e => setSurgeries(e.target.value)} /></div>
                                <div className="space-y-1"><label className="font-medium">{t('health.monitoring.patients.deliveries', language)}</label><input type="number" className="w-full rounded border px-2 py-1.5" value={deliveries} onChange={e => setDeliveries(e.target.value)} /></div>
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

                {/* Bulk Upload Section */}
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

                {/* List Section */}
                <section className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Historical Records</h3>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-slate-600">Filter Date:</label>
                            <input
                                type="date"
                                className="rounded border text-xs px-2 py-1"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                            />
                            {dateFilter && (
                                <button onClick={() => setDateFilter('')} className="text-xs text-blue-600 hover:underline">Clear</button>
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
                                    {activeTab === 'medicine' && <th className="px-4 py-2 text-left">Medicine</th>}
                                    {activeTab === 'attendance' && (
                                        <>
                                            <th className="px-4 py-2 text-right">Staff Count</th>
                                            <th className="px-4 py-2 text-center">Doctor?</th>
                                        </>
                                    )}
                                    {activeTab === 'medicine' && (
                                        <>
                                            <th className="px-4 py-2 text-right">Open</th>
                                            <th className="px-4 py-2 text-right">Recv</th>
                                            <th className="px-4 py-2 text-right">Issue</th>
                                            <th className="px-4 py-2 text-right">Close</th>
                                        </>
                                    )}
                                    {activeTab === 'extra' && (
                                        <>
                                            <th className="px-4 py-2 text-center">Van Avail?</th>
                                            <th className="px-4 py-2 text-left">Remarks</th>
                                        </>
                                    )}
                                    {activeTab === 'patients' && (
                                        <>
                                            <th className="px-4 py-2 text-right">OPD</th>
                                            <th className="px-4 py-2 text-right">IPD</th>
                                            <th className="px-4 py-2 text-right">Surg</th>
                                            <th className="px-4 py-2 text-right">Deliv</th>
                                        </>
                                    )}
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {!paginated.length && (
                                    <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400 italic">No records found for this selection</td></tr>
                                )}
                                {paginated.map((row: any, i) => (
                                    <tr key={row.id || i} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="px-4 py-2 text-center font-medium text-slate-700">{start + i + 1}</td>
                                        <td className="px-4 py-2 text-center text-slate-700">{orgs.find(o => o.id === row.organization_id)?.name || row.organization_id}</td>
                                        <td className="px-4 py-2 text-center text-slate-900">{row.record_date?.slice(0, 10)}</td>
                                        {activeTab === 'medicine' && <td className="px-4 py-2 font-medium">{row.medicine_name}</td>}
                                        {activeTab === 'attendance' && (
                                            <>
                                                <td className="px-4 py-2 text-right">{row.staff_present_count ?? '—'}</td>
                                                <td className="px-4 py-2 text-center">{row.doctor_present ? '✅' : '❌'}</td>
                                            </>
                                        )}
                                        {activeTab === 'medicine' && (
                                            <>
                                                <td className="px-4 py-2 text-right">{row.opening_balance ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.received ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.issued ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.closing_balance ?? '—'}</td>
                                            </>
                                        )}
                                        {activeTab === 'extra' && (
                                            <>
                                                <td className="px-4 py-2 text-center">{row.mobile_van_available ? '✅' : '❌'}</td>
                                                <td className="px-4 py-2 text-slate-500">{row.remarks ?? '—'}</td>
                                            </>
                                        )}
                                        {activeTab === 'patients' && (
                                            <>
                                                <td className="px-4 py-2 text-right">{row.opd_count ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.ipd_count ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.surgeries ?? '—'}</td>
                                                <td className="px-4 py-2 text-right">{row.deliveries ?? '—'}</td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
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
