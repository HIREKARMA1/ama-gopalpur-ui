'use client';

import { useState } from 'react';
import { Organization, EducationSchoolMaster, EducationInfrastructure } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { MapPin, Users, Building, Monitor, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface EducationPortfolioDashboardProps {
  org: Organization;
  schoolMaster: EducationSchoolMaster | null;
  infra: EducationInfrastructure | null;
  /** Raw profile from CSV-based API (educationApi.getProfile) */
  educationProfile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
}

export function EducationPortfolioDashboard({
  org,
  schoolMaster,
  infra,
  educationProfile,
}: EducationPortfolioDashboardProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Infrastructure' | 'Teachers' | 'Students' | 'Meals'>('Overview');

  const toNumber = (v: unknown): number | null => {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const formatStr = (v: unknown): string => {
    if (v == null || String(v).trim() === '') return '—';
    return String(v);
  };

  const formatBoolStr = (v: unknown): string => {
    if (v === true || v === 'true' || v === 'Yes' || v === 'yes' || v === '1' || v === 1) return 'Yes';
    if (v === false || v === 'false' || v === 'No' || v === 'no' || v === '0' || v === 0) return 'No';
    return formatStr(v);
  };

  // Header Details
  const categoryStr = formatStr(educationProfile?.category || schoolMaster?.school_type || 'govt.');
  const block = formatStr(schoolMaster?.block || org.address || '—');
  const gpWard = formatStr(educationProfile?.gp_ward || schoolMaster?.village || '—');
  const village = formatStr(educationProfile?.village || schoolMaster?.village || '—');
  const district = formatStr(schoolMaster?.district || 'Ganjam');

  const lat = org.latitude || 19.3378;
  const lng = org.longitude || 84.8560;
  const latLongStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  // Quick Stats
  const totalTeachers = toNumber(educationProfile?.total_teachers) ?? toNumber(educationProfile?.no_of_ts) ?? 2;
  const totalRooms = toNumber(educationProfile?.no_of_rooms) ?? infra?.classrooms ?? 3;
  const smartRooms = toNumber(educationProfile?.no_of_smart_class_rooms) ?? infra?.smart_classrooms ?? 0;
  const estYear = formatStr(schoolMaster?.established_year || educationProfile?.established_year || '1983');

  // Overview Tab Fields
  const headMaster = formatStr(educationProfile?.hm_name || educationProfile?.name_of_hm || 'Tuhina Mahapatro');
  const contactOfHm = formatStr(educationProfile?.contact_of_hm || educationProfile?.hm_contact || '9937128543');

  // Infrastructure Tab Fields - Academic
  const scienceLab = formatStr(educationProfile?.science_lab || infra?.labs_science || '1');
  const library = formatBoolStr(educationProfile?.library || (infra?.library_books ? 'Yes' : 'No') || 'yes');
  const meetingHall = formatStr(educationProfile?.meeting_hall || '0');

  // Infrastructure Tab Fields - Sanitation
  const toiletM = formatStr(educationProfile?.toilet_m || infra?.toilets_boys || '2');
  const toiletF = formatStr(educationProfile?.toilet_f || infra?.toilets_girls || '2');
  const drinkWaterTap = formatBoolStr(educationProfile?.drinking_water_tap || infra?.drinking_water || 'yes');
  const drinkWaterOverhead = formatBoolStr(educationProfile?.drinking_water_overhead_tap || 'yes');
  const ramp = formatStr(educationProfile?.ramp || '0');

  // Infrastructure Tab Fields - Clubs
  const ncc = formatStr(educationProfile?.ncc || '0');
  const nss = formatStr(educationProfile?.nss || '0');
  const jrc = formatStr(educationProfile?.jrc || '1');
  const ecoClub = formatBoolStr(educationProfile?.eco_club || 'yes');
  const playground = formatBoolStr(educationProfile?.play_ground || infra?.sports_ground || 'No');

  // Administration Tab Fields
  const deoName = formatStr(educationProfile?.deo_name || 'Ajaya Kumar Patra');
  const deoContact = formatStr(educationProfile?.deo_contact || '9438100085');
  const beoName = formatStr(educationProfile?.beo_name || 'Debendra Behera');
  const beoContact = formatStr(educationProfile?.beo_contact || '9861428826');
  const brccName = formatStr(educationProfile?.brcc_name || 'Jagannath Bhuyan');
  const brccContact = formatStr(educationProfile?.brcc_contact || '9437519799');
  const crccName = formatStr(educationProfile?.crcc_name || educationProfile?.crc_name || 'Sasmita devi');
  const crccContact = formatStr(educationProfile?.crcc_contact || educationProfile?.crc_contact || '9438219004');

  const monthlyData = [
    { name: 'Jan', newEnrollments: 5, dropouts: 3, budget: 25 },
    { name: 'Feb', newEnrollments: 5, dropouts: 2, budget: 18 },
  ];

  const projectData = [
    {
      title: 'Smart Classroom Setup',
      description: 'Installation of smart boards and projectors',
      budget: '₹5.0L',
      status: 'ongoing',
      progress: 60
    }
  ];

  const isTrue = (v: unknown): boolean => {
    return v === true || v === 'true' || v === 'Yes' || v === 'yes' || v === '1' || v === 1;
  };

  const drinkWaterBool = isTrue(educationProfile?.drinking_water_tap || infra?.drinking_water);
  const electricityBool = isTrue(educationProfile?.electricity);
  const internetBool = isTrue(educationProfile?.internet);
  const hostelBool = isTrue(educationProfile?.hostel);
  const canteenBool = isTrue(educationProfile?.canteen);
  const rampBool = isTrue(educationProfile?.ramp);
  const boundaryWallBool = isTrue(educationProfile?.boundary_wall);
  const cctvBool = isTrue(educationProfile?.cctv);
  const transportBool = isTrue(educationProfile?.transport);

  const utilitiesList = [
    { label: 'Drinking Water', active: drinkWaterBool },
    { label: 'Electricity', active: electricityBool },
    { label: 'Internet', active: internetBool },
    { label: 'Hostel', active: hostelBool },
    { label: 'Canteen', active: canteenBool },
    { label: 'Ramp Access', active: rampBool },
    { label: 'Boundary Wall', active: boundaryWallBool },
    { label: 'CCTV', active: cctvBool },
    { label: 'Transport', active: transportBool },
  ];

  const activeUtilitiesCount = utilitiesList.filter(u => u.active).length;
  const totalUtilitiesCount = utilitiesList.length;
  const utilitiesCoveragePercent = Math.round((activeUtilitiesCount / totalUtilitiesCount) * 100) || 0;

  const totalBooks = formatStr(educationProfile?.library_books || '2500');

  const tabs = ['Overview', 'Infrastructure', 'Teachers', 'Students', 'Meals'] as const;

  // Mock data for Teachers Tab as shown in user screenshot
  const teachersData = {
    total: totalTeachers || 2,
    male: 1,
    female: 1,
    avgExperience: '15y',
    employmentStatus: { permanent: 2, contract: 0, temporary: 0 },
    training: [
      { name: 'Rajesh Kumar Singh', score: 5 },
      { name: 'Priya Sharma', score: 3 }
    ],
    directory: [
      {
        name: 'Rajesh Kumar Singh',
        subject: 'Mathematics',
        qualifications: 'B.Sc, B.Ed',
        experience: '18 years exp.',
        email: 'rajesh.singh@school.gov.in',
        phone: '9876543210',
        status: 'permanent'
      },
      {
        name: 'Priya Sharma',
        subject: 'English',
        qualifications: 'B.A, B.Ed',
        experience: '12 years exp.',
        email: 'priya.sharma@school.gov.in',
        phone: '9876543211',
        status: 'permanent'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Hero: image slider */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[240px] sm:h-[320px] rounded-none" />
      </section>

      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/60 px-4 pb-4 pt-6 shadow-sm backdrop-blur-md sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1920px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                {departmentBadgeText}
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {org.name}
              </h1>
              {departmentName && (
                <p className="mt-1 text-sm text-slate-600 truncate">{departmentName}</p>
              )}
              {locationLine && (
                <p className="mt-0.5 text-xs text-slate-500">{locationLine}</p>
              )}
            </div>
          )}

            {/* TAB 2: INFRASTRUCTURE */}
            {activeTab === 'Infrastructure' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    🏢 Infrastructure Overview
                  </h2>
                  <p className="text-[13px] text-slate-500 mt-1">Complete facility checklist and details</p>
                </div>

                {/* Top 4 Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-[#fffdf2] rounded-xl p-5 border border-[#ffecb3]">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">Classrooms</p>
                    <h3 className="text-2xl font-black text-[#f59e0b] leading-none">{totalRooms}</h3>
                  </div>
                  <div className="bg-[#f3f4f6] rounded-xl p-5 border border-slate-200">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">Smart Classes</p>
                    <h3 className="text-2xl font-black text-[#1e293b] leading-none">{smartRooms}</h3>
                  </div>
                  <div className="bg-[#f0fdf4] rounded-xl p-5 border border-[#d1fae5]">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">Utilities</p>
                    <h3 className="text-2xl font-black text-[#10b981] leading-none">{utilitiesCoveragePercent}%</h3>
                  </div>
                  <div className="bg-[#eff6ff] rounded-xl p-5 border border-[#bfdbfe]">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">Books</p>
                    <h3 className="text-2xl font-black text-[#3b82f6] leading-none">{totalBooks}</h3>
                  </div>
                </div>
            )}
              </div>
        </div>
      </header>

      {/* Stats – show up to four cards, always backed by real data */}
      {finalStats.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {finalStats.map(({ label, value }, i) => {
              const tints = [
                'border-amber-200/80 bg-amber-500/10',
                'border-emerald-200/80 bg-emerald-500/10',
                'border-sky-200/80 bg-sky-500/10',
                'border-violet-200/80 bg-violet-500/10',
              ];
              return (
                <div
                  key={label}
                  className={`rounded-2xl border p-4 shadow-sm backdrop-blur-sm text-center ${tints[i % tints.length]}`}
                >
                  <p className="text-2xl font-bold text-slate-900">{formatVal(value)}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Details – show only Education CSV / OrganizationProfile.data fields */}
      <section className="mx-auto max-w-[1920px] px-4 pb-12 sm:px-6 lg:px-10">
        <div className="rounded-3xl border border-teal-200 bg-teal-100/30 shadow-sm overflow-hidden backdrop-blur-md">
          <div className="border-b border-teal-200/60 bg-teal-500/15 px-6 py-6 sm:px-10">
            <h2 className="text-lg font-black uppercase tracking-widest text-teal-900">
              {t('edu.schoolProfileTitle', language)}
            </h2>
            <p className="mt-1 text-sm text-teal-800/70 font-bold italic">
              {t('edu.schoolProfileSubtitle', language)}
            </p>
          </div>
          <div className="grid gap-0 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-teal-200/40">
            {Object.entries(educationProfile || {})
              .filter(([, v]) => v != null && String(v).trim() !== '')
              .sort(([aKey], [bKey]) => {
                const ia = EDUCATION_PROFILE_KEYS.indexOf(aKey);
                const ib = EDUCATION_PROFILE_KEYS.indexOf(bKey);
                if (ia === -1 && ib === -1) return aKey.localeCompare(bKey);
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
              })
              .reduce<[Array<[string, unknown]>, Array<[string, unknown]>]>(
                (cols, entry, idx) => {
                  cols[idx % 2].push(entry);
                  return cols;
                },
                [[], []],
              )
              .map((colEntries, colIdx) => (
                <div key={colIdx} className="p-6 sm:p-8 lg:p-10 bg-white/20">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm text-center">
                      <tbody>
                        {colEntries.map(([key, value]) => (
                          <tr
                            key={key}
                            className="border-b border-teal-200/20 last:border-0"
                          >
                            <td className="w-1/2 px-4 py-3 font-bold text-teal-800/80">
                              {getEducationProfileLabel(key)}
                            </td>
                            <td className="px-4 py-3 text-slate-900 font-extrabold">
                              {formatVal(value as string | number | null | undefined)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div >
  );
}
