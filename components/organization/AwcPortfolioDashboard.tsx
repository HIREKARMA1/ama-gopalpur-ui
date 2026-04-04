'use client';

import { useMemo, useState } from 'react';
import { Organization, CenterProfile, SnpDailyStock } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t, type MessageKey } from '../i18n/messages';
import { getHealthProfileLabel } from '../../lib/profileLabels';
import { Users, Building, MapPin, Contact, Home, Hash, UserCheck, FileText, Phone } from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ImageSlider } from './ImageSlider';
import { GOPALPUR_BOUNDS, AWC_MARKER_ICON } from '../../lib/mapConfig';

const SNP_ROWS_PER_PAGE = 10;
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const CONTACT_ROWS: { key: string; labelKey: MessageKey }[] = [
  { key: 'cpdo_name', labelKey: 'awc.stat.cpdoName' },
  { key: 'cpdo_contact_no', labelKey: 'awc.contact.cpdoContactNo' },
  { key: 'supervisor_name', labelKey: 'awc.stat.supervisorName' },
  { key: 'supervisor_contact_name', labelKey: 'awc.contact.supervisorContact' },
  { key: 'worker_name', labelKey: 'awc.stat.awwName' },
  { key: 'aww_contact_no', labelKey: 'awc.contact.awwContactNo' },
  { key: 'helper_name', labelKey: 'awc.contact.awhName' },
  { key: 'awh_contact_no', labelKey: 'awc.contact.awhContactNo' },
];

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

function getValue(org: Organization | null, profile: CenterProfile | null, key: string): string | number | null | undefined {
  if (key.startsWith('org.')) {
    const k = key.slice(4) as keyof Organization;
    return org ? (org[k] as string | number | null | undefined) : undefined;
  }
  return profile ? (profile[key as keyof CenterProfile] as string | number | null | undefined) : undefined;
}

export interface AwcPortfolioDashboardProps {
  org: Organization;
  awcProfile: CenterProfile | null;
  departmentName?: string | null;
  /** Gallery image URLs (admin can add later). */
  images?: string[];
  /** SNP (Supplementary Nutrition Programme) daily stock – date-wise. */
  snpDailyStock?: SnpDailyStock[];
}

function snpKg(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v} Kg`;
}

export function AwcPortfolioDashboard({
  org,
  awcProfile,
  departmentName,
  images = [],
  snpDailyStock = [],
}: AwcPortfolioDashboardProps) {
  const { language } = useLanguage();
  const [snpDateFilter, setSnpDateFilter] = useState('');
  const [snpPage, setSnpPage] = useState(1);
  const [detailTab, setDetailTab] = useState<'profile' | 'staff'>('profile');
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });


  const snpFiltered = useMemo(() => {
    if (!snpDailyStock.length) return [];
    if (!snpDateFilter.trim()) return snpDailyStock;
    return snpDailyStock.filter((row) => {
      const d = row.record_date;
      if (!d) return false;
      const rowDate = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
      return rowDate === snpDateFilter;
    });
  }, [snpDailyStock, snpDateFilter]);

  const snpTotalRows = snpFiltered.length;
  const snpTotalPages = Math.max(1, Math.ceil(snpTotalRows / SNP_ROWS_PER_PAGE));
  const snpPageClamped = Math.min(Math.max(1, snpPage), snpTotalPages);
  const snpStart = (snpPageClamped - 1) * SNP_ROWS_PER_PAGE;
  const snpPaginated = snpFiltered.slice(snpStart, snpStart + SNP_ROWS_PER_PAGE);
  const snpShowStart = snpTotalRows === 0 ? 0 : snpStart + 1;
  const snpShowEnd = Math.min(snpStart + SNP_ROWS_PER_PAGE, snpTotalRows);

  // Chart data: sorted by date, with opening/received/expenditure/closing (Kg)
  const snpChartData = useMemo(() => {
    if (!snpDailyStock.length) return [];
    const withClosing = snpDailyStock.map((row) => {
      const d = row.record_date;
      const dateStr = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
      const opening = Number(row.opening_balance_kg) || 0;
      const received = Number(row.received_kg) || 0;
      const expenditure = Number(row.exp_kg) || 0;
      const closing = opening + received - expenditure;
      return {
        date: dateStr,
        dateLabel: dateStr.slice(8, 10) + '/' + dateStr.slice(5, 7),
        opening: Math.round(opening * 10) / 10,
        received: Math.round(received * 10) / 10,
        expenditure: Math.round(expenditure * 10) / 10,
        closing: Math.round(closing * 10) / 10,
      };
    });
    return withClosing.sort((a, b) => a.date.localeCompare(b.date));
  }, [snpDailyStock]);

  const blockName = getValue(org, awcProfile, 'block_name') || '—';
  const gramPanchayat = getValue(org, awcProfile, 'gram_panchayat');
  const villageWard = getValue(org, awcProfile, 'village_ward');
  const centerCode = getValue(org, awcProfile, 'center_code');
  const buildingType = getValue(org, awcProfile, 'building_type');
  const studentStrength = getValue(org, awcProfile, 'student_strength');
  const workerName = getValue(org, awcProfile, 'worker_name');
  const supervisorName = getValue(org, awcProfile, 'supervisor_name');
  const description = getValue(org, awcProfile, 'description');


  // Center for map
  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 }; // Default fallback
  }, [org.latitude, org.longitude]);


  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">

      {/* Hero: centre photo (from admin-uploaded images) */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[240px] sm:h-[320px]" />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {t('awc.portfolio.title', language)}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {t('awc.portfolio.heroSubtitle', language)}
        </p>
      </header>

      {/* Centre details tabs – profile / staff (overview style) */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {t('awc.portfolio.centreDetailsSection', language)}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setDetailTab('profile')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${detailTab === 'profile'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Building size={14} />
                  <span>{t('awc.centreProfileTitle', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('staff')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${detailTab === 'staff'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Contact size={14} />
                  <span>{t('awc.staffContactTitle', language)}</span>
                </button>
              </div>
            </div>

            {detailTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Building size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{t('awc.portfolio.orgNameLabel', language)}</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(org.name)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{getHealthProfileLabel('block_ulb', language)}</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(blockName)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                    <Home size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{getHealthProfileLabel('gp_ward', language)}</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(gramPanchayat)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{getHealthProfileLabel('village', language)}</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(villageWard)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                    <Hash size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{t('awc.portfolio.awcIdLabel', language)}</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(centerCode)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                    <Building size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{t('awc.portfolio.buildingStatusLabel', language)}</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(buildingType)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{getHealthProfileLabel('latitude', language)}</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(org?.latitude)}</p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
                    <MapPin size={20} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{getHealthProfileLabel('longitude', language)}</p>
                    <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(org?.longitude)}</p>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'staff' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {CONTACT_ROWS.map(({ key, labelKey }, idx) => {
                  const value = getValue(org, awcProfile, key);
                  const iconStyles = [
                    'bg-indigo-50 text-indigo-600 border-indigo-100',
                    'bg-sky-50 text-sky-600 border-sky-100',
                    'bg-emerald-50 text-emerald-600 border-emerald-100',
                    'bg-amber-50 text-amber-600 border-amber-100',
                    'bg-violet-50 text-violet-600 border-violet-100',
                    'bg-teal-50 text-teal-600 border-teal-100',
                    'bg-rose-50 text-rose-600 border-rose-100',
                    'bg-slate-100 text-slate-600 border-slate-200',
                  ];
                  const Icon = key.includes('contact') || key.includes('_no') ? Phone : (key.includes('name') ? UserCheck : Contact);
                  return (
                    <div key={key} className="flex gap-4 items-center">
                      <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${iconStyles[idx % iconStyles.length]}`}>
                        <Icon size={20} strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{t(labelKey, language)}</p>
                        <p className="text-[15px] font-bold text-[#0f172a] break-words">{formatVal(value)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats row – enrollment & key staff */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-amber-900/70 mb-1 uppercase tracking-wider">{t('awc.portfolio.totalEnrollment', language)}</p>
              <h3 className="text-[28px] sm:text-[32px] font-black text-amber-950 leading-none">{formatVal(studentStrength)}</h3>
              <p className="text-[11px] text-amber-800/60 mt-1 font-medium">{t('awc.portfolio.children', language)}</p>
            </div>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-amber-200/50 flex items-center justify-center text-amber-700 ml-3 shadow-inner">
              <Users size={28} strokeWidth={2.5} />
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-emerald-900/70 mb-1 uppercase tracking-wider">{t('awc.portfolio.awwWorkerTitle', language)}</p>
              <p className="text-[16px] font-black text-emerald-950 truncate">{formatVal(workerName)}</p>
              <p className="text-[11px] text-emerald-800/60 mt-0.5 font-medium">{t('awc.portfolio.awwWorkerSubtitle', language)}</p>
            </div>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-emerald-200/50 flex items-center justify-center text-emerald-700 ml-3 shadow-inner">
              <UserCheck size={28} strokeWidth={2.5} />
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-indigo-900/70 mb-1 uppercase tracking-wider">{t('awc.portfolio.supervisorTitle', language)}</p>
              <p className="text-[16px] font-black text-indigo-950 truncate">{formatVal(supervisorName)}</p>
              <p className="text-[11px] text-indigo-800/60 mt-0.5 font-medium">{t('awc.portfolio.supervisorSubtitle', language)}</p>
            </div>
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-200/50 flex items-center justify-center text-indigo-700 ml-3 shadow-inner">
              <Contact size={28} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </section>

      {/* Description snippet when present */}
      {description != null && String(description).trim() !== '' && (
        <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
          <div className="rounded-3xl border border-slate-300 bg-slate-100/50 p-6 sm:p-8 shadow-sm backdrop-blur-md">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b] mb-2">{t('awc.portfolio.aboutCentre', language)}</h2>
            <p className="text-[14px] text-[#334155] leading-relaxed">{formatVal(description)}</p>
          </div>
        </section>
      )}

      {/* Map – centre location from CSV (lat/long) */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-violet-200 bg-violet-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">{t('awc.portfolio.mapTitle', language)}</h2>
            <p className="text-[13px] text-[#64748b] mt-1">{t('awc.portfolio.mapSubtitle', language)}</p>
          </div>
          <div className="h-[400px] w-full rounded-xl bg-[#f8f9fa] overflow-hidden relative flex items-center justify-center">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={14}
                options={{
                  restriction: {
                    latLngBounds: {
                      south: GOPALPUR_BOUNDS.south,
                      west: GOPALPUR_BOUNDS.west,
                      north: GOPALPUR_BOUNDS.north,
                      east: GOPALPUR_BOUNDS.east,
                    },
                    strictBounds: true,
                  },
                  styles: [
                    { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
                  ],
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: true,
                  scaleControl: true,
                  fullscreenControl: true,
                  streetViewControl: false,
                  minZoom: 11,
                  maxZoom: 18,
                }}
              >
                <Marker position={mapCenter} icon={AWC_MARKER_ICON} />
              </GoogleMap>
            ) : (
              <div className="text-center">
                <MapPin size={24} className="text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">{t('portfolio.loadingMap', language)}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SNP Daily Stock – charts + table */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0f172a]">{t('awc.portfolio.snpDailyStockTitle', language)}</h2>
            <p className="text-[13px] text-[#64748b] mt-1">{t('awc.portfolio.snpDailyStockDesc', language)}</p>
          </div>

          {/* SNP graphs – always visible; empty state when no data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-bold text-sky-900 mb-3">{t('awc.portfolio.chart.stockTrend', language)}</h3>
              <div className="h-[260px] w-full">
                {snpChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={snpChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#64748b" unit=" Kg" width={40} />
                      <Tooltip
                        formatter={(value, name) => [`${value != null ? Number(value).toFixed(1) : '—'} Kg`, name ?? '']}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="opening" name={t('awc.portfolio.chart.opening', language)} stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9' }} />
                      <Line type="monotone" dataKey="closing" name={t('awc.portfolio.chart.closing', language)} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center rounded-lg bg-slate-100/80 border border-dashed border-slate-300 text-slate-500">
                    <p className="text-sm font-medium">{t('awc.portfolio.noSnpData', language)}</p>
                    <p className="text-xs mt-1">{t('awc.portfolio.noSnpDataHint', language)}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm backdrop-blur-sm">
              <h3 className="text-sm font-bold text-amber-900 mb-3">{t('awc.portfolio.chart.receivedVsExp', language)}</h3>
              <div className="h-[260px] w-full">
                {snpChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={snpChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#64748b" unit=" Kg" width={40} />
                      <Tooltip
                        formatter={(value, name) => [`${value != null ? Number(value).toFixed(1) : '—'} Kg`, name ?? '']}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="received" name={t('awc.portfolio.chart.received', language)} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenditure" name={t('awc.portfolio.chart.expenditure', language)} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center rounded-lg bg-slate-100/80 border border-dashed border-slate-300 text-slate-500">
                    <p className="text-sm font-medium">{t('awc.portfolio.noSnpData', language)}</p>
                    <p className="text-xs mt-1">{t('awc.portfolio.noSnpDataHint', language)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#0f172a]">{t('awc.portfolio.dailyRecords', language)}</h3>
            <div className="flex flex-col items-start gap-2">
              <label className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">
                {t('awc.snp.filterByDate', language)}
              </label>
              <input
                type="date"
                value={snpDateFilter}
                onChange={(e) => {
                  setSnpPage(1);
                  setSnpDateFilter(e.target.value);
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9]"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-rose-100/60 shadow-sm overflow-hidden backdrop-blur-sm">
            <table className="w-full text-center text-sm whitespace-nowrap lg:whitespace-normal">
              <thead className="bg-rose-100/40">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-rose-800/80">{t('awc.snp.date', language)}</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-rose-800/80">
                    {t('awc.snp.openingBalance', language)}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-rose-800/80">
                    {t('awc.snp.received', language)}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-rose-800/80">
                    {t('awc.portfolio.chart.expenditure', language)}
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-rose-800/80">
                    {t('awc.snp.closingBalance', language)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100/20 bg-white/40">
                {snpPaginated.length > 0 ? (
                  snpPaginated.map((row) => {
                    const d = row.record_date;
                    const dateStr =
                      typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
                    const opening = row.opening_balance_kg ?? 0;
                    const received = row.received_kg ?? 0;
                    const expended = row.exp_kg ?? 0;
                    const closing = opening + received - expended;
                    return (
                      <tr key={`${row.organization_id}-${dateStr}`}>
                        <td className="px-4 py-3 text-[13px] text-rose-900 font-bold">{dateStr}</td>
                        <td className="px-4 py-3 text-[13px] text-slate-700">{snpKg(opening)}</td>
                        <td className="px-4 py-3 text-[13px] text-slate-700">{snpKg(received)}</td>
                        <td className="px-4 py-3 text-[13px] text-slate-700">{snpKg(expended)}</td>
                        <td className="px-4 py-3 text-[13px] text-rose-900 font-extrabold">{snpKg(closing)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      className="px-4 py-6 text-[13px] text-[#64748b] text-center"
                      colSpan={5}
                    >
                      {t('awc.portfolio.noSnpRows', language)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[12px] text-[#64748b]">
            <span>
              {t('awc.portfolio.showingDaysRange', language)
                .replace('{start}', String(snpShowStart))
                .replace('{end}', String(snpShowEnd))
                .replace('{total}', String(snpTotalRows))}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSnpPage((p) => Math.max(1, p - 1))}
                disabled={snpPageClamped <= 1}
                className="rounded-md border border-slate-300 px-3 py-1 text-[12px] font-medium text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                {t('awc.snp.prev', language)}
              </button>
              <span className="text-[12px] text-[#64748b]">
                {t('awc.portfolio.pageOf', language)
                  .replace('{page}', String(snpPageClamped))
                  .replace('{total}', String(snpTotalPages))}
              </span>
              <button
                type="button"
                onClick={() => setSnpPage((p) => Math.min(snpTotalPages, p + 1))}
                disabled={snpPageClamped >= snpTotalPages}
                className="rounded-md border border-slate-300 px-3 py-1 text-[12px] font-medium text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                {t('awc.snp.next', language)}
              </button>
            </div>
          </div>
        </div>
      </section>

    </div >
  );
}
