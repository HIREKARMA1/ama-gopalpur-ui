import { useMemo, useState } from 'react';
import {
  Organization,
} from '../../services/api';
import {
  MapPin,
  Building,
  Calendar,
  CheckCircle2,
  Phone,
  UserCheck,
  Home,
  Hash,
  Users,
  Monitor,
  Tag,
  GraduationCap,
  BookOpen,
  School,
  Activity,
  Droplets,
  Bike,
  Globe,
  Award,
  TrendingUp,
  Folder,
  Microscope,
  Bed,
  CreditCard,
  Coffee,
  Dumbbell,
  Wifi,
  TreePine,
  Truck,
  Shield,
  Video,
  Zap,
  Megaphone,
  Lightbulb,
  Cpu,
  Music,
  Trophy,
  Briefcase,
  Car,
  FlaskConical,
  HardHat,
  Terminal,
  Layers,
  Factory,
  Atom,
  Library,
  Construction,
  Hammer,
  Code,
  Plug,
  Wrench,
  Component,
  Gem,
  Backpack,
  UserPlus,
  UserCog,
  Contact,
  ShieldCheck,
  Ban,
  Flag,
  UserCircle,
  MessageSquare,
  Medal,
  CalendarCheck,
  Radio,
  Settings,
  Bus,
} from 'lucide-react';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { getEducationProfileLabel, EDUCATION_PROFILE_KEYS } from '../../lib/profileLabels';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, EDUCATION_TYPE_LABELS } from '../../lib/mapConfig';
import { Loader } from '../common/Loader';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface EducationPortfolioDashboardProps {
  org: Organization;
  /** Raw profile from CSV-based API (educationApi.getProfile) */
  educationProfile: Record<string, unknown>;
  images?: string[];
}

function formatVal(v: unknown): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

const parseNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function EducationPortfolioDashboard({
  org,
  educationProfile,
  images = [],
}: EducationPortfolioDashboardProps) {
  const { language } = useLanguage();

  // Helper component for resource items
  const ResourceItem = ({ label, val, icon: Icon, color }: { label: string, val: any, icon: any, color: string }) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      amber: 'bg-amber-50 text-amber-600 border-amber-100',
      violet: 'bg-violet-50 text-violet-600 border-violet-100',
      slate: 'bg-slate-100 text-slate-600 border-slate-200',
      teal: 'bg-teal-50 text-teal-600 border-teal-100',
      rose: 'bg-rose-50 text-rose-600 border-rose-100',
      pink: 'bg-pink-50 text-pink-600 border-pink-100',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-100',
      sky: 'bg-sky-50 text-sky-600 border-sky-100',
    };

    return (
      <div className="flex gap-4 items-center">
        <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[color] || colorMap.slate}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{label}</p>
          <p className="text-[15px] font-bold text-[#0f172a] truncate">{formatVal(val)}</p>
        </div>
      </div>
    );
  };

  // Helper for resource config
  const getResourceConfig = (key: string) => {
    const config: Record<string, { icon: any, color: string }> = {
      category: { icon: Tag, color: 'indigo' },
      esst_year: { icon: Calendar, color: 'blue' },
      established_year: { icon: Calendar, color: 'blue' },
      name_of_hm: { icon: UserCheck, color: 'emerald' },
      contact_of_hm: { icon: Phone, color: 'teal' },
      deo_name: { icon: UserCheck, color: 'violet' },
      deo_contact: { icon: Phone, color: 'rose' },
      beo_name: { icon: UserCheck, color: 'sky' },
      beo_contact: { icon: Phone, color: 'amber' },
      no_of_rooms: { icon: School, color: 'indigo' },
      no_of_smart_class_rooms: { icon: Monitor, color: 'blue' },
      science_lab: { icon: BookOpen, color: 'emerald' },
      library: { icon: BookOpen, color: 'indigo' },
      no_of_ts: { icon: Users, color: 'orange' },
      no_of_nts: { icon: Users, color: 'slate' },
      toilet_m: { icon: UserCheck, color: 'blue' },
      toilet_f: { icon: UserCheck, color: 'pink' },
      ramp: { icon: CheckCircle2, color: 'emerald' },
      play_ground: { icon: Activity, color: 'emerald' },
      drinking_water_tw: { icon: Droplets, color: 'sky' },
      drinking_water_tap: { icon: Droplets, color: 'sky' },
      drinking_water_overhead_tap: { icon: Droplets, color: 'sky' },
      drinking_water_aquaguard: { icon: Droplets, color: 'sky' },
      cycle_stand: { icon: Bike, color: 'slate' },
      institution_id: { icon: Hash, color: 'slate' },
      campus_area_acres: { icon: MapPin, color: 'emerald' },
      affiliating_university: { icon: Building, color: 'violet' },
      autonomous: { icon: CheckCircle2, color: 'blue' },
      autonomous_since_year: { icon: CalendarCheck, color: 'sky' },
      college_type: { icon: GraduationCap, color: 'indigo' },
      pin_code: { icon: MapPin, color: 'slate' },
      principal_name: { icon: UserCheck, color: 'emerald' },
      principal_contact: { icon: Phone, color: 'teal' },
      principal_email: { icon: Phone, color: 'sky' },
      college_phone: { icon: Phone, color: 'blue' },
      college_email: { icon: Phone, color: 'indigo' },
      website: { icon: Globe, color: 'blue' },
      aicte_approval: { icon: Award, color: 'emerald' },
      naac: { icon: Award, color: 'amber' },
      nba: { icon: Award, color: 'violet' },
      nirf_ranking: { icon: TrendingUp, color: 'blue' },
      aariia_atal_ranking: { icon: Medal, color: 'rose' },
      b_tech_branches_count: { icon: Folder, color: 'indigo' },
      m_tech_programmes_count: { icon: Folder, color: 'violet' },
      ph_d: { icon: GraduationCap, color: 'emerald' },
      departments: { icon: Folder, color: 'slate' },
      no_of_labs: { icon: Microscope, color: 'indigo' },
      no_of_labs_brach_wise: { icon: Microscope, color: 'violet' },
      workshop: { icon: Building, color: 'emerald' },
      hostel: { icon: Bed, color: 'amber' },
      hostel_capacity_boys: { icon: Bed, color: 'blue' },
      hostel_capacity_girls: { icon: Bed, color: 'pink' },
      guest_house: { icon: Bed, color: 'violet' },
      banking: { icon: CreditCard, color: 'emerald' },
      canteen: { icon: Coffee, color: 'amber' },
      gymnasium: { icon: Dumbbell, color: 'rose' },
      wifi_availability: { icon: Wifi, color: 'sky' },
      garden: { icon: TreePine, color: 'emerald' },
      transport_fascility: { icon: Truck, color: 'blue' },
      parking_fascility: { icon: Truck, color: 'slate' },
      staff_accommodation: { icon: Home, color: 'violet' },
      security: { icon: Shield, color: 'slate' },
      cctv: { icon: Video, color: 'rose' },
      electricity: { icon: Zap, color: 'amber' },
      grievance_cell_head: { icon: Megaphone, color: 'rose' },
      grievance_cell_head_contact: { icon: Phone, color: 'rose' },
      innovation_and_startup_fascility: { icon: Lightbulb, color: 'amber' },
      robotics_club: { icon: Cpu, color: 'violet' },
      cultural_clubs: { icon: Music, color: 'pink' },
      sports_and_athletics_fascility: { icon: Trophy, color: 'emerald' },
      research_projects_count: { icon: Microscope, color: 'indigo' },
      patents_count: { icon: Lightbulb, color: 'emerald' },
      mou_count: { icon: CheckCircle2, color: 'blue' },
      centre_of_excellence: { icon: Award, color: 'violet' },
      centre_of_excellence_comma_separated: { icon: Award, color: 'violet' },
      incubation_centre: { icon: Lightbulb, color: 'amber' },
      placement_officer_name: { icon: Briefcase, color: 'emerald' },
      placement_officer_contact: { icon: Phone, color: 'teal' },
      placement_percentage: { icon: TrendingUp, color: 'blue' },
      placement_percentage_last_year: { icon: TrendingUp, color: 'blue' },
      highest_package_lpa: { icon: TrendingUp, color: 'emerald' },
      dean_registrar_name: { icon: UserCheck, color: 'indigo' },
      schorlaship_fascility: { icon: BookOpen, color: 'blue' },
      notable_awards_or_achievements: { icon: Trophy, color: 'amber' },

      // Engineering specific branch attributes - Intakes
      total_intake_ug_automobile_engineering: { icon: Car, color: 'orange' },
      total_intake_ug_chemical_engineering: { icon: FlaskConical, color: 'emerald' },
      total_intake_ug_civil_engineering: { icon: Construction, color: 'amber' },
      total_intake_ug_computer_science_engineering: { icon: Terminal, color: 'blue' },
      total_intake_ug_electrical_engineering: { icon: Zap, color: 'amber' },
      total_intake_ug_electronics_telecommunication_engineering: { icon: Radio, color: 'sky' },
      total_intake_ug_mechanical_engineering: { icon: Settings, color: 'slate' },
      total_intake_ug_metallurgical_and_materials_engineering: { icon: Component, color: 'rose' },
      total_intake_ug_production_engineering: { icon: Factory, color: 'indigo' },
      total_intake_pg_departments_wise: { icon: Backpack, color: 'violet' },

      // Engineering specific branch attributes - Faculty
      total_no_of_faculty_automobile_engineering: { icon: UserCog, color: 'orange' },
      total_no_of_faculty_chemical_engineering: { icon: UserCircle, color: 'emerald' },
      total_no_of_faculty_civil_engineering: { icon: Hammer, color: 'amber' },
      total_no_of_faculty_computer_science_engineering: { icon: Code, color: 'blue' },
      total_no_of_faculty_electrical_engineering: { icon: Plug, color: 'amber' },
      total_no_of_faculty_electronics_telecommunication_engineering: { icon: Wifi, color: 'sky' },
      total_no_of_faculty_mechanical_engineering: { icon: Wrench, color: 'slate' },
      total_no_of_faculty_metallurgical_and_materials_engineering: { icon: Gem, color: 'rose' },
      total_no_of_faculty_production_engineering: { icon: Truck, color: 'indigo' },
      total_no_of_faculty_basic_science: { icon: Atom, color: 'violet' },
      total_no_of_faculty_humanities_and_social_science: { icon: Library, color: 'pink' },

      // Extra
      nss: { icon: Flag, color: 'rose' },
      ncc: { icon: ShieldCheck, color: 'emerald' },
      icc_head_name: { icon: UserPlus, color: 'violet' },
      icc_head_contact: { icon: Phone, color: 'violet' },
      anti_ragging_cell_head: { icon: Ban, color: 'rose' },
      anti_ragging_cell_head_contact: { icon: Phone, color: 'rose' },
      drinking_water: { icon: Droplets, color: 'sky' },
    };
    return config[key] || { icon: Hash, color: 'slate' };
  };
  const [detailTab, setDetailTab] = useState<'profile' | 'academic' | 'faculty' | 'intake' | 'infrastructure' | 'admin' | 'placement'>('profile');
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const toStatVal = (v: unknown): string | number | null | undefined =>
    v == null ? null : typeof v === 'object' ? undefined : (v as string | number);

  // Stats for the top row
  const isCollege = ['ENGINEERING_COLLEGE', 'ITI', 'UNIVERSITY', 'DIPLOMA_COLLEGE'].includes(org.sub_department || '');

  // Calculate total intake for colleges
  const totalIntake = useMemo(() => {
    const intakeKeys = [
      'total_intake_ug_automobile_engineering', 'total_intake_ug_chemical_engineering',
      'total_intake_ug_civil_engineering', 'total_intake_ug_computer_science_engineering',
      'total_intake_ug_electrical_engineering', 'total_intake_ug_electronics_telecommunication_engineering',
      'total_intake_ug_mechanical_engineering', 'total_intake_ug_metallurgical_and_materials_engineering',
      'total_intake_ug_production_engineering'
    ];
    let sum = 0;
    intakeKeys.forEach(key => {
      const val = parseInt(String(educationProfile[key] || 0));
      if (!isNaN(val)) sum += val;
    });
    return sum > 0 ? sum : null;
  }, [educationProfile]);

  const topStats = isCollege ? [
    { label: t('edu.stat.totalIntake', language), value: totalIntake, icon: GraduationCap, color: 'blue' },
    { label: t('edu.stat.placementPercent', language), value: toStatVal(educationProfile['placement_percentage'] || educationProfile['placement_percentage_last_year']), icon: TrendingUp, color: 'emerald' },
    { label: t('edu.stat.highestPackage', language), value: toStatVal(educationProfile['highest_package_lpa'] || educationProfile['highest_package']), icon: Award, color: 'amber' },
  ] : [
    { label: t('edu.stat.teachers', language), value: toStatVal(educationProfile['no_of_ts']), icon: Users, color: 'emerald' },
    { label: t('edu.stat.classrooms', language), value: toStatVal(educationProfile['no_of_classrooms'] || educationProfile['no_of_rooms']), icon: School, color: 'indigo' },
    { label: t('edu.stat.smartClassrooms', language), value: toStatVal(educationProfile['no_of_smart_classrooms'] || educationProfile['no_of_smart_class_rooms']), icon: Monitor, color: 'amber' },
  ];

  // Map center
  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 }; // Default fallback
  }, [org.latitude, org.longitude]);

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
      {/* Hero */}
      <section className="w-full">
        <ImageSlider images={images} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {t('edu.dashboard.title', language)}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {t('edu.dashboard.subtitle', language)}
        </p>
      </header>

      {/* Facility details tabs */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {t('edu.details.title', language)}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setDetailTab('profile')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${detailTab === 'profile'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Building size={14} />
                  <span>{t('edu.tab.profile', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('academic')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${detailTab === 'academic'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <GraduationCap size={14} />
                  <span>{t('edu.tab.academic', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('faculty')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${detailTab === 'faculty'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Users size={14} />
                  <span>{t('edu.tab.faculty', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('intake')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${detailTab === 'intake'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Users size={14} />
                  <span>{t('edu.tab.intake', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('infrastructure')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${detailTab === 'infrastructure'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <School size={14} />
                  <span>{t('edu.tab.infra', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('admin')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${detailTab === 'admin'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <UserCheck size={14} />
                  <span>{t('edu.tab.admin', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('placement')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${detailTab === 'placement'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Briefcase size={14} />
                  <span>{t('edu.tab.placement', language)}</span>
                </button>
              </div>
            </div>

            {detailTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { label: t('govBar.title', language).includes('Odisha') ? 'Institution Name' : 'ଅନୁଷ୍ଠାନର ନାମ', val: org.name, icon: Building, color: 'blue' },
                  { label: t('govBar.title', language).includes('Odisha') ? 'Institution Type' : 'ଅନୁଷ୍ଠାନ ପ୍ରକାର', val: EDUCATION_TYPE_LABELS[org.type] || org.type, icon: GraduationCap, color: 'violet' },
                  { label: t('govBar.title', language).includes('Odisha') ? 'ID' : 'ଆଇଡି', val: org.id, icon: Hash, color: 'slate' },
                  { label: getEducationProfileLabel('block_ulb', language), val: educationProfile['block_ulb'] || educationProfile['block'], icon: MapPin, color: 'emerald' },
                  { label: getEducationProfileLabel('gp_ward', language), val: educationProfile['gp_ward'] || educationProfile['gp_name'], icon: Home, color: 'amber' },
                  { label: getEducationProfileLabel('village', language), val: educationProfile['village'] || educationProfile['ward_village'], icon: Home, color: 'sky' },
                  { label: getEducationProfileLabel('established_year', language), val: educationProfile['established_year'] || educationProfile['esst_year'], icon: Calendar, color: 'blue' },
                  { label: getEducationProfileLabel('affiliating_university', language), val: educationProfile['affiliating_university'], icon: Building, color: 'violet' },
                  { label: getEducationProfileLabel('college_type', language), val: educationProfile['college_type'], icon: GraduationCap, color: 'indigo' },
                  { label: getEducationProfileLabel('latitude', language), val: org.latitude, icon: MapPin, color: 'rose' },
                  { label: getEducationProfileLabel('longitude', language), val: org.longitude, icon: MapPin, color: 'pink' },
                ].map((item, idx) => (
                  <ResourceItem key={idx} label={item.label} val={item.val} icon={item.icon} color={item.color} />
                ))}
              </div>
            )}

            {detailTab === 'academic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(educationProfile || {})
                  .filter(([key, v]) => {
                    const academicKeys = [
                      'autonomous', 'autonomous_since_year', 'aicte_approval', 'naac', 'nba', 'nirf_ranking',
                      'aariia_atal_ranking', 'b_tech_branches_count', 'm_tech_programmes_count', 'ph_d', 'departments',
                      'description',
                    ];
                    return academicKeys.includes(key) && v != null && String(v).trim() !== '' && String(v) !== '—' && String(v) !== '0';
                  })
                  .map(([key, value]) => {
                    const item = getResourceConfig(key);
                    return <ResourceItem key={key} label={getEducationProfileLabel(key, language)} val={value} icon={item.icon} color={item.color} />;
                  })}
              </div>
            )}

            {detailTab === 'faculty' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(educationProfile || {})
                  .filter(([key, v]) => {
                    const facultyKeys = [
                      'no_of_ts', 'no_of_nts', 'total_no_of_faculty_automobile_engineering',
                      'total_no_of_faculty_chemical_engineering', 'total_no_of_faculty_civil_engineering',
                      'total_no_of_faculty_computer_science_engineering', 'total_no_of_faculty_electrical_engineering',
                      'total_no_of_faculty_electronics_telecommunication_engineering', 'total_no_of_faculty_mechanical_engineering',
                      'total_no_of_faculty_metallurgical_and_materials_engineering', 'total_no_of_faculty_production_engineering',
                      'total_no_of_faculty_basic_science', 'total_no_of_faculty_humanities_and_social_science',
                    ];
                    return facultyKeys.includes(key) && v != null && String(v).trim() !== '' && String(v) !== '—' && String(v) !== '0' && String(v) !== 'No of TS';
                  })
                  .map(([key, value]) => {
                    const item = getResourceConfig(key);
                    return <ResourceItem key={key} label={getEducationProfileLabel(key, language)} val={value} icon={item.icon} color={item.color} />;
                  })}
              </div>
            )}

            {detailTab === 'intake' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(educationProfile || {})
                  .filter(([key, v]) => {
                    const intakeKeys = [
                      'total_intake_ug_automobile_engineering', 'total_intake_ug_chemical_engineering',
                      'total_intake_ug_civil_engineering', 'total_intake_ug_computer_science_engineering',
                      'total_intake_ug_electrical_engineering', 'total_intake_ug_electronics_telecommunication_engineering',
                      'total_intake_ug_mechanical_engineering', 'total_intake_ug_metallurgical_and_materials_engineering',
                      'total_intake_ug_production_engineering', 'total_intake_pg_departments_wise',
                    ];
                    return intakeKeys.includes(key) && v != null && String(v).trim() !== '' && String(v) !== '—' && String(v) !== '0';
                  })
                  .map(([key, value]) => {
                    const item = getResourceConfig(key);
                    return <ResourceItem key={key} label={getEducationProfileLabel(key, language)} val={value} icon={item.icon} color={item.color} />;
                  })}
              </div>
            )}

            {detailTab === 'infrastructure' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(educationProfile || {})
                  .filter(([key, v]) => {
                    const infraKeys = [
                      'no_of_rooms', 'no_of_classrooms', 'no_of_smart_class_rooms', 'no_of_smart_classrooms',
                      'no_of_labs', 'no_of_labs_brach_wise', 'science_lab',
                      'library', 'workshop', 'hostel', 'hostel_capacity_boys', 'hostel_capacity_girls',
                      'guest_house', 'banking', 'canteen', 'gymnasium', 'wifi_availability',
                      'play_ground', 'playground', 'garden', 'transport_fascility', 'parking_fascility',
                      'staff_accommodation', 'security', 'cctv', 'ramp', 'drinking_water',
                      'drinking_water_tw', 'drinking_water_tap', 'drinking_water_overhead_tap',
                      'drinking_water_aquaguard', 'electricity', 'cycle_stand',
                    ];
                    return infraKeys.includes(key) && v != null && String(v).trim() !== '' && String(v) !== '—';
                  })
                  .map(([key, value]) => {
                    const item = getResourceConfig(key);
                    return <ResourceItem key={key} label={getEducationProfileLabel(key, language)} val={value} icon={item.icon} color={item.color} />;
                  })}
              </div>
            )}

            {detailTab === 'admin' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(educationProfile || {})
                  .filter(([key, v]) => {
                    const adminKeys = [
                      'principal_name', 'principal_contact', 'principal_email', 'college_phone', 'college_email',
                      'website', 'icc_head_name', 'icc_head_contact', 'grievance_cell_head', 'grievance_cell_head_contact',
                      'anti_ragging_cell_head', 'anti_ragging_cell_head_contact', 'deo_name', 'deo_contact', 'beo_name',
                      'beo_contact', 'dean_registrar_name', 'schorlaship_fascility',
                    ];
                    return adminKeys.includes(key) && v != null && String(v).trim() !== '' && String(v) !== '—' && String(v) !== '0';
                  })
                  .map(([key, value]) => {
                    const item = getResourceConfig(key);
                    return <ResourceItem key={key} label={getEducationProfileLabel(key, language)} val={value} icon={item.icon} color={item.color} />;
                  })}
              </div>
            )}

            {detailTab === 'placement' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.entries(educationProfile || {})
                  .filter(([key, v]) => {
                    const placementKeys = [
                      'placement_officer_name', 'placement_officer_contact', 'placement_percentage',
                      'placement_percentage_last_year', 'highest_package_lpa', 'research_projects_count',
                      'patents_count', 'mou_count', 'centre_of_excellence', 'centre_of_excellence_comma_separated',
                      'incubation_centre', 'notable_awards_or_achievements', 'innovation_and_startup_fascility',
                      'robotics_club', 'cultural_clubs', 'sports_and_athletics_fascility', 'nss', 'ncc',
                    ];
                    return placementKeys.includes(key) && v != null && String(v).trim() !== '' && String(v) !== '—' && String(v) !== '0';
                  })
                  .map(([key, value]) => {
                    const item = getResourceConfig(key);
                    return <ResourceItem key={key} label={getEducationProfileLabel(key, language)} val={value} icon={item.icon} color={item.color} />;
                  })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topStats.map((stat, i) => (
            <div key={i} className={`rounded-2xl border border-${stat.color}-200 bg-${stat.color}-100/40 p-6 shadow-sm flex justify-between items-center backdrop-blur-sm`}>
              <div className="min-w-0">
                <p className={`text-[13px] font-bold text-${stat.color}-900/70 mb-1 uppercase tracking-wider`}>{stat.label}</p>
                <h3 className={`text-[28px] sm:text-[32px] font-black text-${stat.color}-950 leading-none`}>{formatVal(stat.value)}</h3>
              </div>
              <div className={`w-14 h-14 shrink-0 rounded-2xl bg-${stat.color}-200/50 flex items-center justify-center text-${stat.color}-700 ml-3 shadow-inner`}>
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Map Section */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-violet-200 bg-violet-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0f172a]">{t('edu.location.title', language)}</h2>
            <p className="text-[13px] text-[#64748b] mt-1">{t('edu.location.subtitle', language)}</p>
          </div>
          <div className="h-[400px] w-full rounded-xl bg-[#f8f9fa] overflow-hidden relative flex items-center justify-center">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={mapCenter}
                zoom={15}
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
                <Marker position={mapCenter} />
              </GoogleMap>
            ) : (
              <div className="text-center">
                <MapPin size={24} className="text-rose-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Loading map…</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
