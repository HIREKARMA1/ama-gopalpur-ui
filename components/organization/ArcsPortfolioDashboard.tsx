'use client';

import { useMemo, useState } from 'react';
import { Organization } from '../../services/api';
import {
  Building2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Users,
  FileCheck,
  Vote,
  Laptop,
  Hash,
} from 'lucide-react';
import { ImageSlider } from './ImageSlider';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS } from '../../lib/mapConfig';
import { useLanguage } from '../i18n/LanguageContext';
import { t, type MessageKey } from '../i18n/messages';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  return s === '' ? '—' : s;
}

function snakeFromHeader(label: string): string {
  return label
    .trim()
    .replace(/[-\s/]+/g, '_')
    .replace(/[()]/g, '')
    .replace(/[?]/g, '')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

type ArcsFieldDef = { header: string; labelKey: MessageKey };

type ArcsGroupDef = { id: string; titleKey: MessageKey; fields: ArcsFieldDef[] };

/** CSV/header strings unchanged (profile keys); labels use i18n. */
const ARCS_GROUPS: ArcsGroupDef[] = [
  {
    id: 'society_identity',
    titleKey: 'arcs.group.societyIdentity',
    fields: [
      { header: 'REGISTRATION NUMBER', labelKey: 'arcs.field.registration' },
      { header: 'JURISDICTION TYPE (RURAL/URBAN/MIXED)', labelKey: 'arcs.fieldLabel.jurisdictionType' },
      { header: 'AREA OF OPERATION', labelKey: 'arcs.field.areaOperation' },
      { header: 'STATE', labelKey: 'arcs.field.state' },
      { header: 'DISTRICT', labelKey: 'arcs.field.district' },
      { header: 'ESTABLISHED YEAR', labelKey: 'arcs.field.establishedYear' },
    ],
  },
  {
    id: 'location_contact',
    titleKey: 'arcs.group.locationContact',
    fields: [
      { header: 'BLOCK/ULB', labelKey: 'arcs.field.blockUlb' },
      { header: 'FULL ADDRESS', labelKey: 'arcs.fieldLabel.fullAddress' },
      { header: 'PIN CODE', labelKey: 'arcs.fieldLabel.pinCode' },
      { header: 'LATITUDE', labelKey: 'arcs.fieldLabel.latitude' },
      { header: 'LONGITUDE', labelKey: 'arcs.fieldLabel.longitude' },
      { header: 'SECRETARY NAME', labelKey: 'arcs.fieldLabel.secretaryName' },
      { header: 'OFFICE PHONE', labelKey: 'arcs.field.phone' },
      { header: 'OFFICE EMAIL', labelKey: 'arcs.field.email' },
    ],
  },
  {
    id: 'governance_compliance',
    titleKey: 'arcs.group.governanceCompliance',
    fields: [
      { header: 'FUNCTIONING OR NOT', labelKey: 'arcs.fieldLabel.functioningOrNot' },
      { header: 'AUDIT COMPLETED SOCIETIES (LAST FY)', labelKey: 'arcs.fieldLabel.auditCompletedLastFy' },
      { header: 'ELECTIONS CONDUCTED (LAST FY)', labelKey: 'arcs.fieldLabel.electionsConductedLastFy' },
      { header: 'INSPECTORS/EXTENSION OFFICERS (COUNT)', labelKey: 'arcs.fieldLabel.inspectorsExtensionOfficers' },
    ],
  },
  {
    id: 'membership',
    titleKey: 'arcs.group.membership',
    fields: [
      { header: 'TOTAL MEMBERSHIP', labelKey: 'arcs.fieldLabel.totalMembership' },
      { header: 'MEMBERSHIP SC', labelKey: 'arcs.fieldLabel.membershipSc' },
      { header: 'MEMBERSHIP ST', labelKey: 'arcs.fieldLabel.membershipSt' },
      { header: 'MEMBERSHIP OBC', labelKey: 'arcs.fieldLabel.membershipObc' },
      { header: 'MEMBERSHIP GEN', labelKey: 'arcs.fieldLabel.membershipGen' },
      { header: 'MEMBERSHIP WOMEN', labelKey: 'arcs.fieldLabel.membershipWomen' },
    ],
  },
  {
    id: 'digitization',
    titleKey: 'arcs.group.digitization',
    fields: [
      { header: 'COMPUTERIZATION STATUS (YES/NO)', labelKey: 'arcs.fieldLabel.computerizationStatus' },
      { header: 'ONLINE REGISTRATION FACILITY (YES/NO)', labelKey: 'arcs.fieldLabel.onlineRegistrationFacility' },
      { header: 'DIGITIZED RECORDS (YES/NO)', labelKey: 'arcs.fieldLabel.digitizedRecords' },
      { header: 'FILE TRACKING SYSTEM (YES/NO)', labelKey: 'arcs.fieldLabel.fileTrackingSystem' },
    ],
  },
];

function mobileTabAbbrev(full: string): string {
  const parts = full.split(/[\s/&]+/).filter(Boolean);
  return parts[0] ?? full;
}

function FieldTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: unknown;
  icon: typeof MapPin;
}) {
  return (
    <div className="flex gap-4 items-center">
      <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-teal-50 text-teal-700 border-teal-100">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-wide text-[#64748b] mb-1 leading-snug">{label}</p>
        <p className="text-[15px] font-bold text-[#0f172a] break-words">{formatVal(value)}</p>
      </div>
    </div>
  );
}

export interface ArcsPortfolioDashboardProps {
  org: Organization;
  profile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

export function ArcsPortfolioDashboard({
  org,
  profile,
  departmentName,
  images = [],
}: ArcsPortfolioDashboardProps) {
  const { language } = useLanguage();
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
  const [detailTab, setDetailTab] = useState<string>('overview');

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 19.29, lng: 84.78 };
  }, [org.latitude, org.longitude]);

  const p = profile;
  const block = p.block_ulb;
  const regNo = p.registration_number;
  const jurisdiction = p.jurisdiction_type_rural_urban_mixed;
  const totalMembers = p.total_membership;
  const functioning = p.functioning_or_not;
  const established = p.established_year;

  const tabBtn = (active: boolean) =>
    `flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'
    }`;

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[320px] sm:h-[380px]" />
      </section>

      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {t('arcs.dashboard.title', language)}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">{t('arcs.dashboard.subtitle', language)}</p>
        {departmentName && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-teal-700">{departmentName}</p>
        )}
      </header>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-teal-200 bg-teal-50/60 px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700/80">
                {t('arcs.stat.registration', language)}
              </p>
              <p className="mt-1 text-[16px] font-black text-teal-900 truncate">{formatVal(regNo)}</p>
            </div>
            <Hash className="h-9 w-9 text-teal-700 shrink-0 opacity-80" />
          </div>
          <div className="rounded-2xl border border-sky-200 bg-sky-50/60 px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-sky-700/80">
                {t('arcs.stat.jurisdiction', language)}
              </p>
              <p className="mt-1 text-[16px] font-black text-sky-900 truncate">{formatVal(jurisdiction)}</p>
            </div>
            <Building2 className="h-9 w-9 text-sky-700 shrink-0 opacity-80" />
          </div>
          <div className="rounded-2xl border border-violet-200 bg-violet-50/60 px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-violet-700/80">
                {t('arcs.stat.members', language)}
              </p>
              <p className="mt-1 text-[16px] font-black text-violet-900 truncate">{formatVal(totalMembers)}</p>
            </div>
            <Users className="h-9 w-9 text-violet-700 shrink-0 opacity-80" />
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700/80">
                {t('arcs.stat.status', language)}
              </p>
              <p className="mt-1 text-[16px] font-black text-emerald-900 truncate">{formatVal(functioning)}</p>
            </div>
            <FileCheck className="h-9 w-9 text-emerald-700 shrink-0 opacity-80" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-teal-200 bg-teal-50/40 p-5 sm:p-8 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
              {t('arcs.details.title', language)}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto gap-1">
              <button type="button" onClick={() => setDetailTab('overview')} className={tabBtn(detailTab === 'overview')}>
                {t('arcs.tab.overview', language)}
              </button>
              {ARCS_GROUPS.map((g) => {
                const tabLabel = t(g.titleKey, language);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setDetailTab(g.id)}
                    className={tabBtn(detailTab === g.id)}
                  >
                    <span className="hidden md:inline">{tabLabel}</span>
                    <span className="md:hidden">{mobileTabAbbrev(tabLabel)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {detailTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <FieldTile label={t('arcs.field.societyName', language)} value={org.name} icon={Building2} />
              <FieldTile label={t('arcs.field.blockUlb', language)} value={block} icon={MapPin} />
              <FieldTile label={t('arcs.field.registration', language)} value={regNo} icon={Hash} />
              <FieldTile label={t('arcs.field.establishedYear', language)} value={established} icon={Calendar} />
              <FieldTile label={t('arcs.field.secretary', language)} value={p.secretary_name} icon={Users} />
              <FieldTile label={t('arcs.field.phone', language)} value={p.office_phone} icon={Phone} />
              <FieldTile label={t('arcs.field.email', language)} value={p.office_email} icon={Mail} />
            </div>
          )}

          {detailTab !== 'overview' &&
            ARCS_GROUPS.filter((g) => g.id === detailTab).map((g) => (
              <div key={g.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {g.fields.map((f) => {
                  const key = snakeFromHeader(f.header);
                  const val = p[key];
                  if (val == null || String(val).trim() === '') return null;
                  const hdr = f.header;
                  const icon =
                    hdr.includes('PHONE') || hdr.includes('CONTACT')
                      ? Phone
                      : hdr.includes('EMAIL')
                        ? Mail
                        : hdr.includes('ADDRESS') || hdr.includes('PIN') || hdr.includes('LATITUDE')
                          ? MapPin
                          : hdr.includes('LONGITUDE')
                            ? MapPin
                            : hdr.includes('MEMBERSHIP') || hdr.includes('TOTAL MEMBERSHIP')
                              ? Users
                              : hdr.includes('AUDIT')
                                ? FileCheck
                                : hdr.includes('ELECTION')
                                  ? Vote
                                  : hdr.includes('COMPUTER') || hdr.includes('DIGIT') || hdr.includes('ONLINE')
                                    ? Laptop
                                    : Building2;
                  return (
                    <FieldTile
                      key={f.header}
                      label={t(f.labelKey, language)}
                      value={val}
                      icon={icon}
                    />
                  );
                })}
              </div>
            ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">{t('arcs.map.title', language)}</h3>
          <p className="text-xs text-slate-500 mb-3">{t('arcs.map.subtitle', language)}</p>
          <div className="h-[280px] w-full rounded-xl overflow-hidden border border-slate-100">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={15}
                options={{
                  restriction: { latLngBounds: GOPALPUR_BOUNDS, strictBounds: false },
                  mapTypeControl: false,
                  streetViewControl: false,
                }}
              >
                {org.latitude != null && org.longitude != null && (
                  <Marker
                    position={{ lat: org.latitude, lng: org.longitude }}
                    title={org.name}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 text-sm">
                {t('arcs.map.loading', language)}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
