'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, UserCheck, Syringe } from 'lucide-react';
import type {
  HealthDailyAttendance,
  HealthDailyMedicineStock,
  HealthDailyExtraData,
  HealthPatientService,
} from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

const SECTION_H2_CLASS = 'text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl';

function recordDateKey(recordDate: string | Date | null | undefined): string {
  if (recordDate == null) return '';
  if (typeof recordDate === 'string') return recordDate.slice(0, 10);
  try {
    return new Date(recordDate).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function shortDateLabel(iso: string): string {
  if (iso.length < 10) return iso;
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

function pickLatestDate(values: string[]): string | null {
  if (!values.length) return null;
  return [...values].sort((a, b) => b.localeCompare(a))[0] || null;
}

function num(v: number | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function yesNoLabel(value: boolean | null | undefined): string {
  if (value == null) return '—';
  return value ? 'Yes' : 'No';
}

function ChartEmpty() {
  const { language } = useLanguage();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100/60 text-slate-500">
      <p className="text-sm font-medium">{t('health.portfolio.chartNoSeries', language)}</p>
    </div>
  );
}

export function HealthPortfolioMonitoringSection({
  dailyAttendance = [],
  dailyMedicineStock = [],
  patientServices = [],
  dailyExtraData = [],
}: {
  dailyAttendance?: HealthDailyAttendance[];
  dailyMedicineStock?: HealthDailyMedicineStock[];
  patientServices?: HealthPatientService[];
  dailyExtraData?: HealthDailyExtraData[];
}) {
  const { language } = useLanguage();
  const [monitorDate, setMonitorDate] = useState(new Date().toISOString().slice(0, 10));

  const attendanceChartData = useMemo(
    () =>
      dailyAttendance.slice(-15).map((a) => ({
        date: recordDateKey(a.record_date),
        dateLabel: shortDateLabel(recordDateKey(a.record_date)),
        count: a.staff_present_count || 0,
      })),
    [dailyAttendance],
  );

  const medicineChartData = useMemo(() => {
    const byDay = new Map<string, { received: number; issued: number }>();
    for (const row of dailyMedicineStock) {
      const k = recordDateKey(row.record_date);
      if (!k) continue;
      const cur = byDay.get(k) || { received: 0, issued: 0 };
      cur.received += num(row.received);
      cur.issued += num(row.issued);
      byDay.set(k, cur);
    }
    return Array.from(byDay.entries())
      .map(([date, v]) => ({
        date,
        dateLabel: shortDateLabel(date),
        received: Math.round(v.received * 10) / 10,
        issued: Math.round(v.issued * 10) / 10,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyMedicineStock]);

  const patientChartData = useMemo(
    () =>
      patientServices.slice(-15).map((p) => ({
        date: recordDateKey(p.record_date),
        dateLabel: shortDateLabel(recordDateKey(p.record_date)),
        opd: p.opd_count || 0,
        ipd: p.ipd_count || 0,
      })),
    [patientServices],
  );

  const dayStocks = useMemo(
    () => dailyMedicineStock.filter((s) => recordDateKey(s.record_date) === monitorDate),
    [dailyMedicineStock, monitorDate],
  );
  const latestMedicineDate = useMemo(
    () => pickLatestDate(dailyMedicineStock.map((r) => recordDateKey(r.record_date)).filter(Boolean)),
    [dailyMedicineStock],
  );
  const shownMedicineDate =
    dayStocks.length > 0 ? monitorDate : latestMedicineDate || monitorDate;
  const shownMedicineStocks = useMemo(
    () => dailyMedicineStock.filter((s) => recordDateKey(s.record_date) === shownMedicineDate),
    [dailyMedicineStock, shownMedicineDate],
  );

  const dayExtra = useMemo(
    () => dailyExtraData.find((d) => recordDateKey(d.record_date) === monitorDate),
    [dailyExtraData, monitorDate],
  );
  const dayAttendance = useMemo(
    () => dailyAttendance.find((d) => recordDateKey(d.record_date) === monitorDate),
    [dailyAttendance, monitorDate],
  );

  useEffect(() => {
    const availableDates = [
      ...dailyMedicineStock.map((r) => recordDateKey(r.record_date)),
      ...dailyAttendance.map((r) => recordDateKey(r.record_date)),
      ...patientServices.map((r) => recordDateKey(r.record_date)),
      ...dailyExtraData.map((r) => recordDateKey(r.record_date)),
    ].filter(Boolean);
    if (!availableDates.length) return;
    if (!availableDates.includes(monitorDate)) {
      const latest = pickLatestDate(availableDates);
      if (latest) setMonitorDate(latest);
    }
  }, [dailyMedicineStock, dailyAttendance, patientServices, dailyExtraData, monitorDate]);

  return (
    <section className="rounded-[28px] border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/50 p-5 shadow-md md:p-7">
      <h2 className={SECTION_H2_CLASS}>{t('health.monitoring.title', language)}</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">{t('health.portfolio.dailyMonitoringSubtitle', language)}</p>

      <div className="mt-8 space-y-10">
        <div className="flex flex-col items-start justify-between gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
              {t('portfolio.selectMonitoringDate', language)}
            </label>
            <input
              type="date"
              value={monitorDate}
              onChange={(e) => setMonitorDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2 ${
                dayExtra?.mobile_van_available
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              <Activity size={18} className={dayExtra?.mobile_van_available ? 'text-emerald-500' : 'text-slate-400'} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-tight">Mobile Van</p>
                <p className="text-xs font-bold leading-tight">
                  {dayExtra?.mobile_van_available ? 'Available' : 'Unavailable'}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-2 ${
                dayAttendance?.doctor_present
                  ? 'border-blue-100 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              <UserCheck size={18} className={dayAttendance?.doctor_present ? 'text-blue-500' : 'text-slate-400'} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-tight">Doctor Presence</p>
                <p className="text-xs font-bold leading-tight">
                  {dayAttendance?.doctor_present ? 'Present Today' : 'Not Present'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex h-[350px] flex-col rounded-2xl border border-slate-100 bg-white/50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Daily Patient Traffic</h3>
              <p className="text-[11px] text-[#64748b]">OPD and IPD trends (Last 15 records)</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold uppercase text-slate-500">OPD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase text-slate-500">IPD</span>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            {patientChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="opd" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="ipd" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty />
            )}
          </div>
        </div>

        <div className="flex h-[350px] flex-col rounded-2xl border border-slate-100 bg-white/50 p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-[#0f172a]">Attendance Trends</h3>
            <p className="text-[11px] text-[#64748b]">Staff presence count (Last 15 records)</p>
          </div>
          <div className="min-h-0 flex-1">
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dateLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/40">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white/50 p-5">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Daily Medicine Inventory</h3>
              <p className="text-[11px] text-[#64748b]">Inventory level for {shownMedicineDate}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Syringe size={20} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Medicine Name</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Opening</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Received</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Issued</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">Closing Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shownMedicineStocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="bg-white/20 px-6 py-10 text-center italic text-slate-400">
                      No medicine stock data available for this date.
                    </td>
                  </tr>
                ) : (
                  shownMedicineStocks.map((stock, idx) => (
                    <tr key={`${recordDateKey(stock.record_date)}-${stock.medicine_name}-${idx}`} className="transition hover:bg-white/40">
                      <td className="px-6 py-4 font-bold text-[#334155]">{stock.medicine_name}</td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">{stock.opening_balance || 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-600">+{stock.received || 0}</td>
                      <td className="px-6 py-4 text-center font-semibold text-rose-500">-{stock.issued || 0}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            (stock.closing_balance || 0) < 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {stock.closing_balance || 0}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-950">{t('health.portfolio.chart.medicineTotalsDaily', language)}</h3>
          <p className="mt-1 text-xs text-amber-900/70">{t('health.portfolio.chart.medicineTotalsHint', language)}</p>
          <div className="mt-3 h-[260px] w-full">
            {medicineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={medicineChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#64748b" width={36} />
                  <Tooltip
                    labelFormatter={(_, payload) => (payload?.[0]?.payload as { date?: string })?.date ?? ''}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="received"
                    name={t('health.monitoring.medicine.received', language)}
                    fill="#0ea5e9"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="issued"
                    name={t('health.monitoring.medicine.issued', language)}
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty />
            )}
          </div>
        </div> */}
      </div>
    </section>
  );
}
