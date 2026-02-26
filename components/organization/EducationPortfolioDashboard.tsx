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
    <div className="bg-white min-h-screen font-sans text-slate-800 pb-16">

      {/* 1. Header Section */}
      <section className="bg-white px-4 md:px-8 pt-10 pb-4 max-w-[1800px] mx-auto">
        <span className="inline-block px-3 py-1 bg-[#fff2e8] text-[#f06e28] text-[10px] font-bold uppercase rounded-full mb-5 border border-[#ffdfc4]">
          Education
        </span>

        <h1 className="text-2xl md:text-[32px] font-black uppercase text-[#0f172a] leading-tight tracking-tight mb-3">
          {org.name}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-[13px] md:text-[14px] text-slate-500 mb-6">
          <span className="text-slate-600 font-medium">{categoryStr}</span>
          <span className="text-slate-300 mx-1">•</span>
          <span className="text-slate-600 font-medium">
            {block}{block !== '—' && ','} {gpWard}{gpWard !== '—' && ','} {village}
          </span>
          <span className="text-slate-300 mx-1">•</span>
          <span className="text-slate-600 font-medium">{district}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-[14px] font-bold text-[#f06e28]">
            <MapPin size={18} strokeWidth={2.5} />
            <span>{latLongStr}</span>
          </div>
          <button
            onClick={() => setActiveTab('Location')}
            className="bg-[#f06e28] hover:bg-[#e65c19] text-white transition px-5 py-2 rounded-full text-[13px] font-bold shadow-sm"
          >
            View on Map
          </button>
        </div>
      </section>

      {/* 2. Quick Statistics Cards */}
      <section className="max-w-[1920px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1 */}
          <div className="bg-[#fffdf2] border border-[#ffecb3] rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-end gap-3 mb-2">
              <Users size={22} className="text-[#f59e0b]" strokeWidth={2.5} />
              <span className="text-3xl font-black text-slate-900 leading-none">{totalTeachers}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 block">Teachers</p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#f0fdf4] border border-[#d1fae5] rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-end gap-3 mb-2">
              <Building size={22} className="text-[#10b981]" strokeWidth={2.5} />
              <span className="text-3xl font-black text-slate-900 leading-none">{totalRooms}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 block">Classrooms</p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-end gap-3 mb-2">
              <Monitor size={22} className="text-[#0ea5e9]" strokeWidth={2.5} />
              <span className="text-3xl font-black text-slate-900 leading-none">{smartRooms}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 block">Smart Rooms</p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#faf5ff] border border-[#e9d5ff] rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-end gap-3 mb-2">
              <Calendar size={22} className="text-[#a855f7]" strokeWidth={2.5} />
              <span className="text-3xl font-black text-slate-900 leading-none">{estYear}</span>
            </div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2 block">Est Year</p>
          </div>
        </div>
      </section>

      {/* 3. Tabs Section */}
      <section className="max-w-[1920px] mx-auto mt-2">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex gap-8 px-4 md:px-8 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-[14px] font-bold transition-all whitespace-nowrap border-b-[3px] ${activeTab === tab
                  ? 'border-[#f06e28] text-[#f06e28]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 md:px-8 py-8">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'Overview' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

                {/* Left Box */}
                <div className="bg-[#f0fdfa] rounded-xl p-8 border border-[#ccfbf1]/80 shadow-sm">
                  <div className="mb-6">
                    <h2 className="text-[15px] font-bold text-[#0f766e] uppercase tracking-wide">School Profile</h2>
                    <p className="text-[13px] text-[#0f766e] opacity-80 mt-1">Basic information about this school.</p>
                  </div>
                  <div className="space-y-0">
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">Block / ULB</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">
                        {block}{block !== '—' && ','} {gpWard}{gpWard !== '—' && ','} {village}
                      </div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">Village</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{village}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">ESST Year</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{estYear}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">DEO Name</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{deoName}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">BEO Name</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{beoName}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">BRCC Name</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{brccName}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">CRCC Name</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{crccName}</div>
                    </div>
                  </div>
                </div>

                {/* Right Box */}
                <div className="bg-[#f0fdfa] rounded-xl p-8 border border-[#ccfbf1]/80 shadow-sm">
                  <div className="mb-6">
                    <h2 className="text-[15px] font-bold text-[#0f766e] uppercase tracking-wide">School Profile</h2>
                    <p className="text-[13px] text-[#0f766e] opacity-80 mt-1">Basic information about this school.</p>
                  </div>
                  <div className="space-y-0">
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">GP / Ward</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{gpWard}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">Name of School</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium uppercase">{org.name}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">Category</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{categoryStr}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">DEO Contact</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{deoContact}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">BEO Contact</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{beoContact}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">BRCC Contact</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{brccContact}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">CRCC Contact</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{crccContact}</div>
                    </div>
                    <div className="flex py-3.5 border-b border-[#ccfbf1] last:border-0 items-start">
                      <div className="w-1/3 shrink-0 text-[13px] text-[#0f766e]">Contact of HM</div>
                      <div className="flex-1 text-[13px] text-slate-800 font-medium">{contactOfHm}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Monthly Progress Trend */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Monthly Progress Trend</h2>
                  <p className="text-[13px] text-slate-500 mt-1">Enrollment, dropouts, and budget utilization</p>
                </div>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={{ stroke: '#cbd5e1' }} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dx={-10} />
                      <Tooltip
                        cursor={{ fill: '#e2e8f0', opacity: 0.4 }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="square" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                      <Bar dataKey="newEnrollments" name="New Enrollments" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={80} />
                      <Bar dataKey="dropouts" name="Dropouts" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={80} />
                      <Bar dataKey="budget" name="Budget (₹10k)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={80} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Development Projects */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Development Projects</h2>
                  <p className="text-[13px] text-slate-500 mt-1">Ongoing and planned infrastructure projects</p>
                </div>
                <div className="space-y-4">
                  {projectData.map((proj, idx) => (
                    <div key={idx} className="border border-yellow-200 rounded-xl p-6 bg-yellow-50/50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-slate-800 text-[15px]">{proj.title}</h4>
                          <p className="text-[13px] text-slate-500 mt-1">{proj.description}</p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-[11px] font-bold rounded-full">
                          {proj.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-[13px] text-slate-600 mb-2 mt-6">
                        <span>Budget: <span className="font-semibold text-slate-800">{proj.budget}</span></span>
                        <span className="font-bold text-slate-800">{proj.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${proj.progress}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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

              {/* Basic Facilities */}
              <div className="mb-8">
                <h3 className="text-[14px] font-bold text-slate-800 mb-4">Basic Facilities</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition bg-white">
                    <span className="text-2xl mb-2">🏫</span>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Classrooms</p>
                    <p className="text-xl font-bold text-slate-800">{totalRooms}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition bg-white">
                    <span className="text-2xl mb-2">📱</span>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Smart Classrooms</p>
                    <p className="text-xl font-bold text-slate-800">{smartRooms}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition bg-white">
                    <span className="text-2xl mb-2">🔬</span>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Science Lab</p>
                    <p className="text-xl font-bold text-slate-800">{scienceLab !== '0' && scienceLab !== '—' ? '✓' : '✗'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition bg-white">
                    <span className="text-2xl mb-2">💻</span>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Computer Lab</p>
                    <p className="text-xl font-bold text-slate-800">✓</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition bg-white">
                    <span className="text-2xl mb-2">📚</span>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Library Books</p>
                    <p className="text-xl font-bold text-slate-800">{totalBooks}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition bg-white">
                    <span className="text-2xl mb-2">⚽</span>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Sports Ground</p>
                    <p className="text-xl font-bold text-slate-800">{playground === 'Yes' ? '✓' : '✗'}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition bg-white">
                    <span className="text-2xl mb-2">🚹</span>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Boys Toilets</p>
                    <p className="text-xl font-bold text-slate-800">{toiletM}</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition bg-white">
                    <span className="text-2xl mb-2">🚺</span>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Girls Toilets</p>
                    <p className="text-xl font-bold text-slate-800">{toiletF}</p>
                  </div>
                </div>
              </div>

              {/* Utilities Checklist */}
              <div>
                <h3 className="text-[14px] font-bold text-slate-800 mb-4">Utilities & Amenities</h3>
                <div className="border border-slate-200 rounded-xl bg-white p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8">
                    {utilitiesList.map((util, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {util.active ? (
                          <CheckCircle2 size={20} className="text-[#10b981]" />
                        ) : (
                          <AlertCircle size={20} className="text-[#ef4444]" />
                        )}
                        <span className="text-[14px] text-slate-700">{util.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Coverage Summary Bar */}
                  <div className="bg-[#fffdf2] rounded-lg p-4 border border-[#ffecb3] mt-4">
                    <p className="text-[13px] text-slate-600">
                      This school has <span className="font-bold text-[#f59e0b]">{activeUtilitiesCount}</span> out of <span className="font-bold text-slate-800">{totalUtilitiesCount}</span> utilities operational ({utilitiesCoveragePercent}% coverage)
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TEACHERS */}
          {activeTab === 'Teachers' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Users size={24} className="text-slate-600" /> Teachers & Staff
                  </h2>
                  <p className="text-[13px] text-slate-500 mt-1">Faculty information and credentials</p>
                </div>

                {/* Top 4 Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-[#fffdf2] rounded-xl p-5 border border-[#ffecb3]">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">Total Teachers</p>
                    <h3 className="text-2xl font-black text-[#f59e0b] leading-none">{teachersData.total}</h3>
                  </div>
                  <div className="bg-[#eff6ff] rounded-xl p-5 border border-[#bfdbfe]">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">Male</p>
                    <h3 className="text-2xl font-black text-[#3b82f6] leading-none">{teachersData.male}</h3>
                  </div>
                  <div className="bg-[#fdf2f8] rounded-xl p-5 border border-[#fbcfe8]">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">Female</p>
                    <h3 className="text-2xl font-black text-[#db2777] leading-none">{teachersData.female}</h3>
                  </div>
                  <div className="bg-[#f0fdf4] rounded-xl p-5 border border-[#d1fae5]">
                    <p className="text-[12px] font-medium text-slate-500 mb-1">Avg Experience</p>
                    <h3 className="text-2xl font-black text-[#10b981] leading-none">{teachersData.avgExperience}</h3>
                  </div>
                </div>

                {/* Status & Training Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                  {/* Employment Status */}
                  <div className="border border-slate-200 rounded-xl p-6">
                    <h3 className="text-[14px] font-bold text-slate-800 mb-4">Employment Status</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-600 font-medium">Permanent</span>
                        <span className="bg-[#10b981] text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-[11px]">{teachersData.employmentStatus.permanent}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-600 font-medium">Contract</span>
                        <span className="bg-slate-100 text-slate-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-[11px]">{teachersData.employmentStatus.contract}</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-600 font-medium">Temporary</span>
                        <span className="bg-slate-100 text-slate-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-[11px]">{teachersData.employmentStatus.temporary}</span>
                      </div>
                    </div>
                  </div>

                  {/* Training Completed */}
                  <div className="border border-slate-200 rounded-xl p-6">
                    <h3 className="text-[14px] font-bold text-slate-800 mb-4">Training Completed</h3>
                    <div className="space-y-4 text-[13px]">
                      {teachersData.training.map((t, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-slate-500">{t.name}</span>
                          <span className="text-[#f59e0b] font-bold text-[14px]">{t.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Staff Directory */}
                <div>
                  <h3 className="text-[14px] font-bold text-slate-800 mb-4">Staff Directory</h3>
                  <div className="space-y-4">
                    {teachersData.directory.map((teacher, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl p-6 relative">
                        <span className="absolute top-6 right-6 px-3 py-1 bg-[#d1fae5] text-[#059669] text-[11px] font-bold rounded-full uppercase tracking-wider">
                          {teacher.status}
                        </span>

                        <h4 className="text-[15px] font-bold text-slate-800 mb-1">{teacher.name}</h4>
                        <p className="text-[13px] text-slate-500 mb-4">{teacher.subject}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] text-slate-600">
                          <div className="space-y-1">
                            <p className="font-semibold">{teacher.qualifications}</p>
                            <p>{teacher.experience}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="flex items-center gap-2"><span className="text-slate-400">✉</span> {teacher.email}</p>
                            <p className="flex items-center gap-2"><span className="text-slate-400">📞</span> {teacher.phone}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: STUDENTS Placeholder */}
          {activeTab === 'Students' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in">
              <p className="text-slate-500 text-center py-10">Students data coming soon.</p>
            </div>
          )}

          {/* TAB 5: MEALS Placeholder */}
          {activeTab === 'Meals' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in">
              <p className="text-slate-500 text-center py-10">Meals data coming soon.</p>
            </div>
          )}

        </div>
      </section>
    </div>
  );
}
