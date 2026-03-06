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
  Accessibility,
  Speech,
  FileText,
  IdCard,
  BadgeCheck,
  Barcode,
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
    const config: Record<string, { icon: any; color: string }> = {
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
      institution_id: { icon: IdCard, color: 'slate' },
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

      // University specific – identity & accreditation
      university_type: { icon: GraduationCap, color: 'indigo' },
      teaching_cum_affiliating: { icon: School, color: 'emerald' },
      naac_grade: { icon: Award, color: 'amber' },
      ugc_2f: { icon: Award, color: 'violet' },
      ugc_12b: { icon: Award, color: 'violet' },
      aishe_code: { icon: BadgeCheck, color: 'slate' },
      nirf_university_rank: { icon: TrendingUp, color: 'blue' },
      nirf_year: { icon: Calendar, color: 'sky' },

      // University – structure & academics
      total_faculties: { icon: Users, color: 'emerald' },
      total_departments: { icon: Layers, color: 'indigo' },
      total_research_centres: { icon: Microscope, color: 'violet' },
      total_centres_of_excellence: { icon: Award, color: 'amber' },
      total_constituent_colleges: { icon: Building, color: 'blue' },
      total_affiliated_colleges: { icon: Building, color: 'slate' },
      total_ug_programmes: { icon: BookOpen, color: 'indigo' },
      total_pg_programmes: { icon: BookOpen, color: 'violet' },
      total_integrated_programmes: { icon: BookOpen, color: 'emerald' },
      total_diploma_certificate_programmes: { icon: BookOpen, color: 'sky' },
      total_ph_d_programmes: { icon: GraduationCap, color: 'blue' },
      d_litt_d_sc_yes_no: { icon: GraduationCap, color: 'rose' },

      // University – intake & enrolment
      total_sanctioned_intake_ug: { icon: Users, color: 'blue' },
      total_sanctioned_intake_pg: { icon: Users, color: 'violet' },
      ug_student_enrollment: { icon: Users, color: 'emerald' },
      pg_student_enrollment: { icon: Users, color: 'amber' },
      ph_d_student_enrollment: { icon: Users, color: 'rose' },
      students_to_higher_studies_count: { icon: GraduationCap, color: 'indigo' },

      // University – scholarships & quality
      scholarships_govt: { icon: Award, color: 'emerald' },
      scholarships_institutional: { icon: Award, color: 'violet' },
      ug_completion_rate_percent: { icon: TrendingUp, color: 'blue' },
      pg_completion_rate_percent: { icon: TrendingUp, color: 'teal' },
      moocs_swayam_nptel: { icon: Monitor, color: 'sky' },
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

      // University – Faculty & staff metrics
      total_teaching_staff: { icon: Users, color: 'emerald' },
      total_permanent_teaching_staff: { icon: UserCheck, color: 'blue' },
      total_contract_guest_faculty: { icon: UserPlus, color: 'violet' },
      total_teaching_staff_prof: { icon: GraduationCap, color: 'indigo' },
      total_teaching_staff_assoc_prof: { icon: GraduationCap, color: 'amber' },
      total_teaching_staff_asst_prof: { icon: GraduationCap, color: 'sky' },
      total_teachers_with_ph_d_count: { icon: Award, color: 'emerald' },
      total_teachers_with_net_set_count: { icon: Award, color: 'rose' },
      student_teacher_ratio: { icon: Users, color: 'slate' },
      non_teaching_staff_count: { icon: Users, color: 'orange' },
      technical_staff_count: { icon: Wrench, color: 'teal' },

      // Extra
      nss: { icon: Flag, color: 'rose' },
      ncc: { icon: ShieldCheck, color: 'emerald' },
      icc_head_name: { icon: UserPlus, color: 'violet' },
      icc_head_contact: { icon: Phone, color: 'violet' },
      anti_ragging_cell_head: { icon: Ban, color: 'rose' },
      anti_ragging_cell_head_contact: { icon: Phone, color: 'rose' },
      drinking_water: { icon: Droplets, color: 'sky' },

      // ITI Specific
      iti_code: { icon: Barcode, color: 'slate' },
      total_trades_count: { icon: Layers, color: 'violet' },
      trades_offered: { icon: Factory, color: 'blue' },
      total_seats_all_trades: { icon: GraduationCap, color: 'emerald' },
      trade_wise_seats: { icon: Layers, color: 'sky' },
      total_instructors: { icon: Users, color: 'orange' },
      total_instructors_regular: { icon: UserCheck, color: 'emerald' },
      total_instructors_contract: { icon: UserCog, color: 'slate' },
      total_instructors_with_cits: { icon: Award, color: 'violet' },
      total_instructors_with_nac_ntc_iti: { icon: HardHat, color: 'amber' },
      total_instructors_with_industry_experience: { icon: Building, color: 'blue' },
      total_workshop_staff: { icon: Wrench, color: 'rose' },
      total_non_teaching_staff: { icon: Users, color: 'slate' },
      no_of_theory_classrooms: { icon: School, color: 'indigo' },
      no_of_workshops: { icon: Component, color: 'emerald' },
      equipment_as_per_ncvt_norms: { icon: ShieldCheck, color: 'emerald' },
      safety_equipment_available: { icon: Shield, color: 'rose' },
      industry_partners_list: { icon: Factory, color: 'blue' },
      mous_with_industry_count: { icon: CheckCircle2, color: 'violet' },
      on_job_training_mandatory: { icon: Briefcase, color: 'emerald' },
      trainees_completing_last_year_percent: { icon: TrendingUp, color: 'blue' },
      campus_interviews_held_last_year_count: { icon: Speech, color: 'violet' }, // Note: Speech might not be imported, I'll use MessageSquare if not
      average_salary_monthly: { icon: CreditCard, color: 'emerald' },
      highest_salary_monthly: { icon: Award, color: 'amber' },
      iti_phone: { icon: Phone, color: 'blue' },
      iti_email: { icon: Phone, color: 'indigo' },
      total_trainees_enrolled: { icon: Users, color: 'blue' },
      male_trainees: { icon: Users, color: 'sky' },
      female_trainees: { icon: Users, color: 'pink' },
      sc_trainees: { icon: Tag, color: 'slate' },
      st_trainees: { icon: Tag, color: 'slate' },
      obc_trainees: { icon: Tag, color: 'slate' },
      ews_trainees: { icon: Tag, color: 'slate' },
      general_trainees: { icon: Users, color: 'slate' },
      minority_trainees: { icon: Tag, color: 'slate' },
      pwd_trainees: { icon: Accessibility, color: 'blue' },
      host_state_trainees: { icon: Home, color: 'emerald' },
      other_state_trainees: { icon: Globe, color: 'blue' },
      minimum_entry_qualification: { icon: BookOpen, color: 'indigo' },
      admission_mode: { icon: MessageSquare, color: 'slate' },
      tuition_course_fee_per_year: { icon: CreditCard, color: 'blue' },
      govt_scholarships: { icon: Award, color: 'emerald' },
      institutional_scholarships: { icon: Award, color: 'violet' },
      central_library_reading_room: { icon: Library, color: 'indigo' },
      library_books_count: { icon: BookOpen, color: 'blue' },
      digital_learning_materials: { icon: Monitor, color: 'emerald' },
      computer_lab: { icon: Terminal, color: 'slate' },
      total_computers: { icon: Monitor, color: 'blue' },
      wifi_campus: { icon: Wifi, color: 'sky' },
      power_supply: { icon: Zap, color: 'amber' },
      power_backup: { icon: Zap, color: 'orange' },
      toilets_details: { icon: UserCheck, color: 'blue' },
      ramp_accessibility: { icon: Accessibility, color: 'emerald' },
      facilities_for_pwd: { icon: Accessibility, color: 'sky' },
      playground: { icon: Activity, color: 'emerald' },
      indoor_games: { icon: Activity, color: 'violet' },
      first_aid_health_room: { icon: Activity, color: 'rose' },
      fire_safety_system: { icon: Shield, color: 'rose' },
      career_guidance_cell: { icon: UserCog, color: 'violet' },
      training_placement_cell: { icon: Briefcase, color: 'emerald' },
      tpo_name: { icon: UserCheck, color: 'emerald' },
      tpo_contact: { icon: Phone, color: 'teal' },
      companies_visited_last_year: { icon: Building, color: 'slate' },
      trainees_placed_last_year_count: { icon: Briefcase, color: 'blue' },
      trainees_starting_self_employment_count: { icon: TrendingUp, color: 'emerald' },
      trainees_going_for_higher_studies_count: { icon: GraduationCap, color: 'violet' },
      soft_skills_training: { icon: UserCheck, color: 'blue' },
      digital_ict_training: { icon: Monitor, color: 'sky' },
      value_added_short_term_courses: { icon: BookOpen, color: 'indigo' },
      awards_recognition: { icon: Trophy, color: 'amber' },
      special_initiatives: { icon: Lightbulb, color: 'orange' },
      clubs: { icon: Users, color: 'pink' },
      principal_superintendent_name: { icon: UserCheck, color: 'emerald' },
      industry_partner: { icon: Briefcase, color: 'blue' },
      description: { icon: FileText, color: 'slate' },
    };

    // Direct mapping first
    const direct = config[key];
    if (direct) return direct;

    // Heuristic fallback: choose icons based on key fragments so we avoid
    // showing the same "#" icon for many different attributes.
    const k = key.toLowerCase();

    if (k.includes('state') || k.includes('district') || k.includes('block') || k.includes('village')) {
      return { icon: MapPin, color: 'emerald' };
    }
    if (k.includes('university_type') || k.includes('college_type')) {
      return { icon: GraduationCap, color: 'indigo' };
    }
    if (k.includes('naac') || k.includes('ugc_2') || k.includes('ugc_12')) {
      return { icon: Award, color: 'amber' };
    }
    if (k.includes('aishe') || k.includes('code')) {
      return { icon: Hash, color: 'slate' };
    }
    if (k.includes('nirf')) {
      return { icon: TrendingUp, color: 'blue' };
    }
    if (k.includes('dept') || k.includes('department')) {
      return { icon: Layers, color: 'indigo' };
    }
    if (k.includes('research')) {
      return { icon: Microscope, color: 'violet' };
    }
    if (k.includes('centre_of_excellence') || k.includes('centre') || k.includes('center')) {
      return { icon: Award, color: 'violet' };
    }
    if (k.includes('programme') || k.includes('programmes') || k.includes('course')) {
      return { icon: BookOpen, color: 'indigo' };
    }
    if (k.includes('intake') || k.includes('enrollment') || k.includes('enrolment')) {
      return { icon: Users, color: 'blue' };
    }
    if (k.includes('hostel')) {
      return { icon: Bed, color: 'amber' };
    }
    if (k.includes('library')) {
      return { icon: Library, color: 'indigo' };
    }
    if (k.includes('lab') || k.includes('laborator')) {
      return { icon: FlaskConical, color: 'emerald' };
    }
    if (k.includes('wifi') || k.includes('internet') || k.includes('nkn')) {
      return { icon: Wifi, color: 'sky' };
    }
    if (k.includes('sports') || k.includes('playground') || k.includes('gymnasium')) {
      return { icon: Activity, color: 'emerald' };
    }
    if (k.includes('transport')) {
      return { icon: Bus, color: 'blue' };
    }
    if (k.includes('parking')) {
      return { icon: Car, color: 'slate' };
    }
    if (k.includes('security') || k.includes('cctv') || k.includes('fire_safety')) {
      return { icon: Shield, color: 'rose' };
    }
    if (k.includes('ramp') || k.includes('accessibility') || k.includes('pwd')) {
      return { icon: Accessibility, color: 'emerald' };
    }
    if (k.includes('drinking_water')) {
      return { icon: Droplets, color: 'sky' };
    }
    if (k.includes('electricity') || k.includes('power') || k.includes('solar')) {
      return { icon: Zap, color: 'amber' };
    }
    if (k.includes('placement') || k.includes('salary') || k.includes('package')) {
      return { icon: Briefcase, color: 'emerald' };
    }
    if (k.includes('mou') || k.includes('industry_collaboration')) {
      return { icon: Factory, color: 'indigo' };
    }
    if (k.includes('publication') || k.includes('patent')) {
      return { icon: FileText, color: 'violet' };
    }
    if (k.includes('startup') || k.includes('incubation')) {
      return { icon: Lightbulb, color: 'orange' };
    }
    if (k.includes('club') || k.includes('association') || k.includes('fest') || k.includes('cultural')) {
      return { icon: Users, color: 'pink' };
    }

    // Final generic fallback
    return { icon: Tag, color: 'slate' };
  };

  const [detailTab, setDetailTab] = useState<'profile' | 'academic' | 'faculty' | 'intake' | 'infrastructure' | 'admin' | 'placement'>('profile');
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const toStatVal = (v: unknown): string | number | null | undefined =>
    v == null ? null : typeof v === 'object' ? undefined : (v as string | number);

  // Stats for the top row
  const isCollege = ['ENGINEERING_COLLEGE', 'ITI', 'UNIVERSITY', 'DIPLOMA_COLLEGE'].includes(org.sub_department || '');
  const isUniversity = org.sub_department === 'UNIVERSITY';

  // Calculate total intake for colleges
  const totalIntake = useMemo(() => {
    // ITI uses total_seats_all_trades directly (handled separately in topStats)
    if (org.sub_department === 'UNIVERSITY') {
      // For universities, use sanctioned UG + PG intake (with fallbacks)
      const ug =
        Number(educationProfile['total_sanctioned_intake_ug'] ?? educationProfile['total_sanctioned_student_intake_ug'] ?? 0);
      const pg =
        Number(educationProfile['total_sanctioned_intake_pg'] ?? educationProfile['total_sanctioned_student_intake_pg'] ?? 0);
      const sum = (Number.isFinite(ug) ? ug : 0) + (Number.isFinite(pg) ? pg : 0);
      return sum > 0 ? sum : null;
    }

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
  }, [educationProfile, org.sub_department]);

  const topStats = isCollege ? [
    {
      label: t('edu.stat.totalIntake', language),
      value: org.sub_department === 'ITI'
        ? (educationProfile['total_seats_all_trades'] || totalIntake)
        : totalIntake,
      icon: GraduationCap,
      color: 'blue'
    },
    {
      label: t('edu.stat.placementPercent', language),
      value: toStatVal(
        educationProfile['placement_percentage']
        || educationProfile['placement_percentage_last_year']
        || educationProfile['placement_%_last_year']
        || educationProfile['trainees_placed_last_year_count']
      ),
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      // For ITI, we show monthly highest salary instead of LPA package.
      label: org.sub_department === 'ITI'
        ? (language === 'or' ? 'ସର୍ବାଧିକ ଦରମା (ମାସିକ)' : 'Highest Salary (Monthly)')
        : t('edu.stat.highestPackage', language),
      value: org.sub_department === 'ITI'
        ? toStatVal(
            educationProfile['highest_salary_monthly']
            || educationProfile['highest_salary_monthly_rs']
            || educationProfile['average_salary_monthly']
            || educationProfile['average_salary_monthly_rs']
          )
        : toStatVal(educationProfile['highest_package_lpa'] || educationProfile['highest_package']),
      icon: Award,
      color: 'amber'
    },
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
                {[
                  { id: 'profile', label: t('edu.tab.profile', language), icon: Building },
                  ...(org.sub_department !== 'ITI' ? [{ id: 'academic', label: t('edu.tab.academic', language), icon: GraduationCap }] : []),
                  { id: 'faculty', label: t('edu.tab.faculty', language), icon: Users },
                  { id: 'intake', label: t('edu.tab.intake', language), icon: Users },
                  { id: 'infrastructure', label: t('edu.tab.infra', language), icon: School },
                  { id: 'admin', label: t('edu.tab.admin', language), icon: UserCheck },
                  { id: 'placement', label: t('edu.tab.placement', language), icon: Briefcase },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id as any)}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${detailTab === tab.id
                      ? 'bg-white text-[#0f172a] shadow-sm'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                      }`}
                  >
                    <tab.icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {detailTab === 'profile' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { label: t('govBar.title', language).includes('Odisha') ? 'Institution Name' : 'ଅନୁଷ୍ଠାନର ନାମ', val: org.name, icon: Building, color: 'blue' },
                  { label: t('govBar.title', language).includes('Odisha') ? 'Institution Type' : 'ଅନୁଷ୍ଠାନ ପ୍ରକାର', val: EDUCATION_TYPE_LABELS[org.type] || org.type, icon: GraduationCap, color: 'violet' },
                  { label: t('govBar.title', language).includes('Odisha') ? 'ID' : 'ଆଇଡି', val: org.id, icon: IdCard, color: 'slate' },
                  { label: getEducationProfileLabel('block_ulb', language), val: educationProfile['block_ulb'] || educationProfile['block'], icon: MapPin, color: 'emerald' },
                  { label: getEducationProfileLabel('gp_ward', language), val: educationProfile['gp_ward'] || educationProfile['gp_name'], icon: Home, color: 'amber' },
                  { label: getEducationProfileLabel('village', language), val: educationProfile['village'] || educationProfile['ward_village'] || educationProfile['village_locality'], icon: Home, color: 'sky' },
                  // ITI Only fields
                  ...(org.sub_department === 'ITI' ? [
                    { label: getEducationProfileLabel('state', language), val: educationProfile['state'], icon: Globe, color: 'blue' },
                    { label: getEducationProfileLabel('district', language), val: educationProfile['district'], icon: MapPin, color: 'emerald' },
                  ] : []),
                  { label: getEducationProfileLabel('established_year', language), val: educationProfile['established_year'] || educationProfile['esst_year'], icon: Calendar, color: 'blue' },
                  { label: getEducationProfileLabel('affiliating_university', language), val: educationProfile['affiliating_university'] || educationProfile['affiliating_body'], icon: Building, color: 'violet' },
                  { label: getEducationProfileLabel('college_type', language), val: educationProfile['college_type'] || educationProfile['ownership'] || educationProfile['ownership_govt_private_aided'], icon: GraduationCap, color: 'indigo' },
                  // ITI Only fields (Relocated from Academic tab)
                  ...(org.sub_department === 'ITI' ? [
                    { label: getEducationProfileLabel('total_trades_count', language), val: educationProfile['total_trades_count'], icon: Layers, color: 'violet' },
                    { label: getEducationProfileLabel('minimum_entry_qualification', language), val: educationProfile['minimum_entry_qualification'], icon: GraduationCap, color: 'blue' },
                    { label: getEducationProfileLabel('admission_mode', language), val: educationProfile['admission_mode'], icon: Users, color: 'emerald' },
                    { label: getEducationProfileLabel('iti_code', language), val: educationProfile['iti_code'], icon: Barcode, color: 'slate' },
                    { label: getEducationProfileLabel('pin_code', language), val: educationProfile['pin_code'], icon: MapPin, color: 'slate' },
                    { label: getEducationProfileLabel('affiliation', language), val: educationProfile['affiliation'], icon: Building, color: 'violet' },
                    { label: getEducationProfileLabel('affiliating_body', language), val: educationProfile['affiliating_body'], icon: Building, color: 'violet' },
                    { label: getEducationProfileLabel('ownership', language), val: educationProfile['ownership'], icon: Building, color: 'indigo' },
                    // { label: getEducationProfileLabel('trades_offered', language), val: educationProfile['trades_offered'], icon: Factory, color: 'blue' },
                    { label: getEducationProfileLabel('description', language), val: educationProfile['description'], icon: FileText, color: 'slate' },
                  ] : []),
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
                    if (v == null || String(v).trim() === '' || String(v) === '—' || String(v) === '0') {
                      return false;
                    }
                    // University: academic / programme / governance info
                    if (isUniversity) {
                      const k = String(key);
                      const academicFragments = [
                        'university_type',
                        'teaching_cum_affiliating',
                        'naac',
                        'ugc_2',
                        'ugc_12',
                        'aishe_code',
                        'nirf',
                        'campus_area',
                        'department',
                        'research_centre',
                        'centre_of_excellence',
                        'ug_programmes',
                        'pg_programmes',
                        'integrated_programmes',
                        'diploma_certificate_programmes',
                        'ph_d_programmes',
                        'd_litt',
                        'admission_mode',
                        'entrance_test',
                        'academic_year_system',
                        'result_declaration_timeline',
                        'academic_calendar',
                        'completion_rate',
                        'student_enrollment',
                        'students_from_other_states',
                        'female_students',
                        'scholarships_',
                        'moocs',
                        'value_added_courses',
                        'notable_awards',
                        'description',
                      ];
                      return academicFragments.some((frag) => k.includes(frag));
                    }
                    const academicKeys = [
                      'autonomous', 'autonomous_since_year', 'aicte_approval', 'naac', 'nba', 'nirf_ranking',
                      'aariia_atal_ranking', 'b_tech_branches_count', 'm_tech_programmes_count', 'ph_d', 'departments',
                      'description',
                      // ITI Only academic fields (total_trades_count moved to header)
                      ...(org.sub_department === 'ITI' ? [
                        'trades_offered', 'minimum_entry_qualification', 'admission_mode',
                        'tuition_course_fee_per_year', 'govt_scholarships', 'institutional_scholarships',
                        'soft_skills_training', 'digital_ict_training', 'value_added_short_term_courses',
                      ] : []),
                    ];
                    return academicKeys.includes(key);
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
                    if (v == null || String(v).trim() === '' || String(v) === '—' || String(v) === '0' || String(v) === 'No of TS') {
                      return false;
                    }
                    // University: all staff / faculty metrics
                    if (isUniversity) {
                      const k = String(key);
                      const facultyFragments = [
                        'faculty',
                        'teaching_staff',
                        'teachers_with',
                        'student_teacher_ratio',
                        'non_teaching_staff',
                        'technical_staff',
                      ];
                      return facultyFragments.some((frag) => k.includes(frag));
                    }
                    const facultyKeys = [
                      'no_of_ts', 'no_of_nts', 'total_non_teaching_staff',
                      'total_no_of_faculty_automobile_engineering',
                      'total_no_of_faculty_chemical_engineering', 'total_no_of_faculty_civil_engineering',
                      'total_no_of_faculty_computer_science_engineering', 'total_no_of_faculty_electrical_engineering',
                      'total_no_of_faculty_electronics_telecommunication_engineering', 'total_no_of_faculty_mechanical_engineering',
                      'total_no_of_faculty_metallurgical_and_materials_engineering', 'total_no_of_faculty_production_engineering',
                      'total_no_of_faculty_basic_science', 'total_no_of_faculty_humanities_and_social_science',
                      // ITI Only faculty fields
                      ...(org.sub_department === 'ITI' ? [
                        'total_instructors', 'total_instructors_regular', 'total_instructors_contract',
                        'total_instructors_with_cits', 'total_instructors_with_nac_ntc_iti',
                        'total_instructors_with_industry_experience', 'total_workshop_staff',
                      ] : []),
                    ];
                    return facultyKeys.includes(key);
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
                    if (v == null || String(v).trim() === '' || String(v) === '—' || String(v) === '0') {
                      return false;
                    }
                    // University: sanctioned intake, enrolment, higher studies
                    if (isUniversity) {
                      const k = String(key);
                      const intakeFragments = [
                        'intake_ug',
                        'intake_pg',
                        'student_enrollment',
                        'students_to_higher_studies',
                      ];
                      return intakeFragments.some((frag) => k.includes(frag));
                    }
                    const intakeKeys = [
                      'total_intake_ug_automobile_engineering', 'total_intake_ug_chemical_engineering',
                      'total_intake_ug_civil_engineering', 'total_intake_ug_computer_science_engineering',
                      'total_intake_ug_electrical_engineering', 'total_intake_ug_electronics_telecommunication_engineering',
                      'total_intake_ug_mechanical_engineering', 'total_intake_ug_metallurgical_and_materials_engineering',
                      'total_intake_ug_production_engineering', 'total_intake_pg_departments_wise',
                      // ITI Only intake fields
                      ...(org.sub_department === 'ITI' ? [
                        'total_seats_all_trades', 'trade_wise_seats', 'total_trainees_enrolled',
                        'male_trainees', 'female_trainees', 'sc_trainees', 'st_trainees',
                        'obc_trainees', 'ews_trainees', 'general_trainees', 'minority_trainees',
                        'pwd_trainees', 'host_state_trainees', 'other_state_trainees',
                      ] : []),
                    ];
                    return intakeKeys.includes(key);
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
                    if (v == null || String(v).trim() === '' || String(v) === '—') {
                      return false;
                    }
                    // University: physical and digital infrastructure
                    if (isUniversity) {
                      const k = String(key);
                      const infraFragments = [
                        'library',
                        'computer_centre',
                        'computer',
                        'wifi',
                        'nkn',
                        'smart_classrooms',
                        'seminar_halls',
                        'laborator',
                        'equipment',
                        'workshop',
                        'hostel',
                        'staff_quarters',
                        'guest_house',
                        'health_centre',
                        'canteen',
                        'bank',
                        'sports_facilities',
                        'playground',
                        'gymnasium',
                        'transport_facility',
                        'parking',
                        'security',
                        'cctv',
                        'fire_safety',
                        'ramp_accessibility',
                        'facilities_for_pwd',
                        'drinking_water',
                        'electricity',
                        'power_backup',
                        'solar',
                      ];
                      return infraFragments.some((frag) => k.includes(frag));
                    }
                    const infraKeys = [
                      'no_of_rooms', 'no_of_classrooms', 'no_of_smart_class_rooms', 'no_of_smart_classrooms',
                      'no_of_labs', 'no_of_labs_brach_wise', 'science_lab',
                      'library', 'workshop', 'hostel', 'hostel_capacity_boys', 'hostel_capacity_girls',
                      'guest_house', 'banking', 'canteen', 'gymnasium', 'wifi_availability',
                      'play_ground', 'playground', 'garden', 'transport_fascility', 'parking_fascility',
                      'staff_accommodation', 'security', 'cctv', 'ramp', 'drinking_water',
                      'drinking_water_tw', 'drinking_water_tap', 'drinking_water_overhead_tap',
                      'drinking_water_aquaguard', 'electricity', 'cycle_stand',
                      // ITI Only infra fields
                      ...(org.sub_department === 'ITI' ? [
                        'no_of_theory_classrooms', 'no_of_workshops', 'equipment_as_per_ncvt_norms',
                        'safety_equipment_available', 'power_supply', 'power_backup',
                        'toilets_details', 'ramp_accessibility', 'facilities_for_pwd',
                        'playground', 'indoor_games', 'first_aid_health_room', 'fire_safety_system',
                        'central_library_reading_room', 'library_books_count', 'digital_learning_materials',
                        'computer_lab', 'total_computers', 'wifi_campus', 'canteen',
                      ] : []),
                    ];
                    return infraKeys.includes(key);
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
                    if (v == null || String(v).trim() === '' || String(v) === '—' || String(v) === '0') {
                      return false;
                    }
                    // University: leadership, cells, associations, clubs
                    if (isUniversity) {
                      const k = String(key);
                      const adminFragments = [
                        'chancellor',
                        'vice_chancellor',
                        'registrar',
                        'finance_officer',
                        'controller_of_exams',
                        'iqac',
                        'nodal_officer',
                        'grievance_cell',
                        'anti_ragging',
                        'icc_head',
                        'alumni_association',
                        'student_clubs',
                        'cultural_activities',
                        'technical_fest',
                        'nss',
                        'ncc',
                      ];
                      return adminFragments.some((frag) => k.includes(frag));
                    }
                    const adminKeys = [
                      'principal_name', 'principal_superintendent_name', 'principal_contact', 'principal_email',
                      'is_there_a_social_media_cell', 'nodal_officer_name', 'nodal_officer_contact',
                      'college_phone', 'college_email',
                      'website', 'icc_head_name', 'icc_head_contact', 'grievance_cell_head', 'grievance_cell_head_contact',
                      'anti_ragging_cell_head', 'anti_ragging_cell_head_contact', 'deo_name', 'deo_contact', 'beo_name',
                      'beo_contact', 'dean_registrar_name', 'schorlaship_fascility',
                      // ITI Only admin/fee fields (Relocated from Academic)
                      ...(org.sub_department === 'ITI' ? [
                        'tuition_course_fee_per_year', 'govt_scholarships', 'institutional_scholarships',
                        'soft_skills_training', 'digital_ict_training', 'value_added_short_term_courses',
                      ] : []),
                      // ITI
                      'iti_phone', 'iti_email',
                    ];
                    return adminKeys.includes(key);
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
                    if (v == null || String(v).trim() === '' || String(v) === '—' || String(v) === '0') {
                      return false;
                    }
                    // University: placement, industry collaboration, research & innovation
                    if (isUniversity) {
                      const k = String(key);
                      const placementFragments = [
                        'placement',
                        'median_salary',
                        'highest_package',
                        'students_to_higher_studies',
                        'industry_collaboration',
                        'mous',
                        'research_projects',
                        'publications',
                        'patents_',
                        'startups',
                        'incubation',
                        'centre_of_excellence',
                      ];
                      return placementFragments.some((frag) => k.includes(frag));
                    }
                    const placementKeys = [
                      'placement_officer_name', 'placement_officer_contact', 'placement_percentage',
                      'placement_percentage_last_year', 'highest_package_lpa', 'research_projects_count',
                      'patents_count', 'mou_count', 'centre_of_excellence', 'centre_of_excellence_comma_separated',
                      'incubation_centre', 'notable_awards_or_achievements', 'innovation_and_startup_fascility',
                      'robotics_club', 'cultural_clubs', 'sports_and_athletics_fascility', 'nss', 'ncc',
                      // ITI Only placement fields
                      ...(org.sub_department === 'ITI' ? [
                        'industry_partner', 'industry_partners_list', 'mous_with_industry_count',
                        'career_guidance_cell', 'training_placement_cell', 'tpo_name', 'tpo_contact',
                        'on_job_training_mandatory', 'trainees_completing_last_year_percent',
                        'campus_interviews_held_last_year_count', 'companies_visited_last_year',
                        'trainees_placed_last_year_count', 'average_salary_monthly',
                        'highest_salary_monthly', 'trainees_starting_self_employment_count', 'trainees_going_for_higher_studies_count',
                        'awards_recognition', 'special_initiatives', 'clubs',
                      ] : []),
                    ];
                    return placementKeys.includes(key);
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
    </div >
  );
}
