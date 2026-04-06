import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Organization } from '../../services/api';
import { PaginatedHorizontalTable } from '../common/PaginatedHorizontalTable';
import {
  buildRevenueGovtLandColumns,
  type RevenueGovtLandRow,
} from '../../lib/revenueGovtLandTable';
import { ImageSlider } from './ImageSlider';
import { useLanguage } from '../i18n/LanguageContext';
import {
  MapPin,
  Layers,
  Landmark,
  AlertTriangle,
  FileText,
  Scale,
  Building,
  Hash,
  Home,
  Tag,
  Shield,
  Activity,
  Users,
  UserCheck,
  PieChart,
  Gavel,
  HeartHandshake,
  GraduationCap,
  Wallet,
  Briefcase,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, MARKER_COLORS } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/** Tahasil portfolio CSV fields (snake_case) grouped for Resources sub-tabs. */
const TAHASIL_RESOURCE_TAB_DEFS: {
  id: string;
  label: string;
  shortLabel: string;
  keys: readonly string[];
  icon: typeof Users;
}[] = [
    {
      id: 'population',
      label: 'Population & settlements',
      shortLabel: 'Population',
      icon: Users,
      keys: [
        'total_population',
        'total_households',
        'total_villages',
        'total_gram_panchayats',
        'total_wards',
        'urban_areas_count',
        'rural_areas_count',
        'total_revenue_villages',
        'total_inhabited_villages',
        'total_uninhabited_villages',
        'largest_village_name',
        'smallest_village_name',
      ],
    },
    {
      id: 'land',
      label: 'Land & records',
      shortLabel: 'Land',
      icon: Layers,
      keys: [
        'total_area_sq_km',
        'total_panchayat_offices',
        'total_village_roads_km',
        'total_water_bodies',
        'total_land_records',
        'total_private_land_acres',
        'total_government_land_acres',
        'total_forest_land_acres',
        'total_agricultural_land_acres',
        'total_residential_land_acres',
        'total_commercial_land_acres',
        'total_waste_land_acres',
        'total_plot_records',
        'total_khata_records',
        'total_ror_issued',
      ],
    },
    {
      id: 'mutations',
      label: 'Mutations',
      shortLabel: 'Mutations',
      icon: FileText,
      keys: [
        'mutation_applications_received_yearly',
        'mutation_approved',
        'mutation_pending',
        'mutation_rejected',
        'avg_mutation_processing_days',
      ],
    },
    {
      id: 'revenue',
      label: 'Revenue & tax',
      shortLabel: 'Revenue',
      icon: PieChart,
      keys: [
        'total_annual_revenue',
        'land_revenue_collection',
        'stamp_duty_collection',
        'registration_fees',
        'tax_collection',
        'penalty_collection',
        'monthly_revenue_target',
        'revenue_target_achieved_percent',
      ],
    },
    {
      id: 'certificates',
      label: 'Certificates',
      shortLabel: 'Certificates',
      icon: Shield,
      keys: [
        'caste_certificates_issued',
        'income_certificates_issued',
        'residence_certificates_issued',
        'legal_heir_certificates',
        'solvency_certificates',
        'total_certificate_applications',
        'certificates_approved',
        'certificates_pending',
        'certificates_rejected',
        'avg_certificate_processing_days',
      ],
    },
    {
      id: 'cases',
      label: 'Cases & grievances',
      shortLabel: 'Cases',
      icon: Gavel,
      keys: [
        'total_cases_registered',
        'cases_resolved',
        'cases_pending',
        'overdue_cases',
        'land_dispute_cases',
        'civil_cases',
        'criminal_cases',
        'avg_case_resolution_days',
        'total_grievances_received',
        'grievances_resolved',
        'grievances_pending',
        'online_grievances',
        'offline_grievances',
        'avg_grievance_resolution_days',
      ],
    },
    {
      id: 'schemes',
      label: 'Schemes & funds',
      shortLabel: 'Schemes',
      icon: HeartHandshake,
      keys: [
        'total_schemes_running',
        'total_scheme_beneficiaries',
        'pmay_beneficiaries',
        'mgnrega_beneficiaries',
        'old_age_pension_beneficiaries',
        'disability_pension_beneficiaries',
        'women_welfare_scheme_beneficiaries',
        'student_scholarship_beneficiaries',
        'funds_allocated',
        'funds_utilized',
        'funds_remaining',
      ],
    },
    {
      id: 'infrastructure',
      label: 'Public infrastructure',
      shortLabel: 'Infrastructure',
      icon: Building,
      keys: [
        'total_schools',
        'total_colleges',
        'total_hospitals',
        'total_primary_health_centers',
        'total_anganwadi_centers',
        'total_police_stations',
        'total_fire_stations',
        'total_banks',
        'total_post_offices',
        'total_market_places',
        'total_roads_km',
        'total_bridges',
        'total_irrigation_projects',
        'total_water_supply_projects',
      ],
    },
    {
      id: 'staff_digital',
      label: 'Staff & digital',
      shortLabel: 'Staff / IT',
      icon: Briefcase,
      keys: [
        'total_staff',
        'revenue_inspectors_count',
        'amin_count',
        'clerk_count',
        'data_entry_operators',
        'vacant_posts',
        'filled_posts',
        'staff_trained_in_digital_services',
        'total_computers',
        'internet_available',
        'cctv_installed',
        'online_services_available',
        'total_online_applications',
        'digital_records_percentage',
        'website_available',
      ],
    },
    {
      id: 'budget',
      label: 'Budget & expenditure',
      shortLabel: 'Budget',
      icon: Wallet,
      keys: [
        'annual_budget_allocated',
        'budget_utilized',
        'budget_remaining',
        'development_expenditure',
        'admin_expenditure',
        'welfare_expenditure',
      ],
    },
    {
      id: 'literacy',
      label: 'Literacy & coverage',
      shortLabel: 'Literacy',
      icon: GraduationCap,
      keys: [
        'literacy_rate_percent',
        'male_literacy_percent',
        'female_literacy_percent',
        'employment_rate_percent',
        'agriculture_dependent_percent',
        'irrigated_land_percent',
        'drinking_water_coverage_percent',
        'electricity_coverage_percent',
      ],
    },
    {
      id: 'highlights',
      label: 'Projects & highlights',
      shortLabel: 'Highlights',
      icon: Sparkles,
      keys: [
        'major_projects_running',
        'upcoming_projects',
        'key_challenges',
        'achievements',
        'awards_received',
        'description',
      ],
    },
  ];

/** Maps each known portfolio key to its Resources sub-tab id. */
const TAHASIL_RESOURCE_KEY_TO_TAB: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const def of TAHASIL_RESOURCE_TAB_DEFS) {
    for (const k of def.keys) m[k] = def.id;
  }
  return m;
})();

const TAHASIL_RESOURCE_ICON_POOL = [
  FileText,
  Users,
  Home,
  Layers,
  Landmark,
  Shield,
  Activity,
  Tag,
  Hash,
  Building,
  MapPin,
  Scale,
  UserCheck,
  Briefcase,
  Wallet,
  GraduationCap,
  Gavel,
  HeartHandshake,
  Sparkles,
] as const;

const TAHASIL_RESOURCE_COLOR_POOL = [
  'blue',
  'emerald',
  'amber',
  'violet',
  'teal',
  'rose',
  'indigo',
  'sky',
  'orange',
  'pink',
  'cyan',
  'slate',
] as const;

const TAHASIL_ATTR_LABEL_OR: Record<string, string> = {
  // Population & settlements
  total_population: 'ମୋଟ ଜନସଂଖ୍ୟା',
  total_households: 'ମୋଟ ଘର/ପରିବାର',
  total_villages: 'ମୋଟ ଗ୍ରାମ',
  total_gram_panchayats: 'ମୋଟ ଗ୍ରାମ ପଞ୍ଚାୟତ',
  total_wards: 'ମୋଟ ୱାର୍ଡ',
  urban_areas_count: 'ସହରୀ ଅଞ୍ଚଳ ସଂଖ୍ୟା',
  rural_areas_count: 'ଗ୍ରାମୀଣ ଅଞ୍ଚଳ ସଂଖ୍ୟା',
  total_revenue_villages: 'ମୋଟ ରେଭେନ୍ୟୁ ଗ୍ରାମ',
  total_inhabited_villages: 'ଆବାଦିତ ଗ୍ରାମ ସଂଖ୍ୟା',
  total_uninhabited_villages: 'ଅନାବାଦିତ ଗ୍ରାମ ସଂଖ୍ୟା',
  largest_village_name: 'ସବୁଠାରୁ ବଡ଼ ଗ୍ରାମ ନାମ',
  smallest_village_name: 'ସବୁଠାରୁ ଛୋଟ ଗ୍ରାମ ନାମ',

  // Land & records
  total_area_sq_km: 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ବର୍ଗ କି.ମି.)',
  total_panchayat_offices: 'ମୋଟ ପଞ୍ଚାୟତ କାର୍ଯ୍ୟାଳୟ',
  total_village_roads_km: 'ଗ୍ରାମୀଣ ରାସ୍ତାଘାଟ (କି.ମି.)',
  total_water_bodies: 'ମୋଟ ଜଳାଶୟ',
  total_land_records: 'ମୋଟ ଜମି ରେକର୍ଡ',
  total_private_land_acres: 'ବେସରକାରୀ ଜମି (ଏକର)',
  total_government_land_acres: 'ସରକାରୀ ଜମି (ଏକର)',
  total_forest_land_acres: 'ବନ ଜମି (ଏକର)',
  total_agricultural_land_acres: 'ଚାଷଜମି (ଏକର)',
  total_residential_land_acres: 'ଆବାସିକ ଜମି (ଏକର)',
  total_commercial_land_acres: 'ବାଣିଜ୍ୟିକ ଜମି (ଏକର)',
  total_waste_land_acres: 'ବନ୍ଜର ଜମି (ଏକର)',
  total_plot_records: 'ମୋଟ ପ୍ଲଟ୍ ରେକର୍ଡ',
  total_khata_records: 'ମୋଟ ଖାତା ରେକର୍ଡ',
  total_ror_issued: 'ROR ଜାରି (ମୋଟ)',

  // Mutations
  mutation_applications_received_yearly: 'ପ୍ରତିବର୍ଷ ମ୍ୟୁଟେସନ୍ ଆବେଦନ ଗ୍ରହଣ',
  mutation_approved: 'ଅନୁମୋଦିତ ମ୍ୟୁଟେସନ୍',
  mutation_pending: 'ଅପେକ୍ଷାରେ ଥିବା ମ୍ୟୁଟେସନ୍',
  mutation_rejected: 'ପ୍ରତ୍ୟାଖ୍ୟାନ ହୋଇଥିବା ମ୍ୟୁଟେସନ୍',
  avg_mutation_processing_days: 'ମ୍ୟୁଟେସନ୍ ପ୍ରକ୍ରିୟା ହାରାହାରି ଦିନ',

  // Revenue & tax
  total_annual_revenue: 'ବାର୍ଷିକ ମୋଟ ଆୟ',
  land_revenue_collection: 'ଜମି ରେଭେନ୍ୟୁ ସଂଗ୍ରହ',
  stamp_duty_collection: 'ଷ୍ଟାମ୍ପ ଡ୍ୟୁଟି ସଂଗ୍ରହ',
  registration_fees: 'ରେଜିଷ୍ଟ୍ରେସନ୍ ଶୁଳ୍କ',
  tax_collection: 'କର ସଂଗ୍ରହ',
  penalty_collection: 'ଦଣ୍ଡ/ପେନାଲ୍ଟି ସଂଗ୍ରହ',
  monthly_revenue_target: 'ମାସିକ ରେଭେନ୍ୟୁ ଲକ୍ଷ୍ୟ',
  revenue_target_achieved_percent: 'ଲକ୍ଷ୍ୟ ପୂରଣ (%)',

  // Certificates
  caste_certificates_issued: 'ଜାତି ପ୍ରମାଣପତ୍ର ଜାରି',
  income_certificates_issued: 'ଆୟ ପ୍ରମାଣପତ୍ର ଜାରି',
  residence_certificates_issued: 'ବାସସ୍ଥାନ ପ୍ରମାଣପତ୍ର ଜାରି',
  legal_heir_certificates: 'ବୈଧ ଉତ୍ତରାଧିକାରୀ ପ୍ରମାଣପତ୍ର',
  solvency_certificates: 'ସଲଭେନ୍ସି ପ୍ରମାଣପତ୍ର',
  total_certificate_applications: 'ମୋଟ ପ୍ରମାଣପତ୍ର ଆବେଦନ',
  certificates_approved: 'ଅନୁମୋଦିତ ପ୍ରମାଣପତ୍ର',
  certificates_pending: 'ଅପେକ୍ଷାରେ ପ୍ରମାଣପତ୍ର',
  certificates_rejected: 'ପ୍ରତ୍ୟାଖ୍ୟାନ ହୋଇଥିବା ପ୍ରମାଣପତ୍ର',
  avg_certificate_processing_days: 'ପ୍ରମାଣପତ୍ର ପ୍ରକ୍ରିୟା ହାରାହାରି ଦିନ',

  // Cases & grievances
  total_cases_registered: 'ମୋଟ ମାମଲା ରେଜିଷ୍ଟର୍',
  cases_resolved: 'ସମାଧାନ ହୋଇଥିବା ମାମଲା',
  cases_pending: 'ଅପେକ୍ଷାରେ ଥିବା ମାମଲା',
  overdue_cases: 'ଅତିବକେୟ ମାମଲା',
  land_dispute_cases: 'ଜମି ବିବାଦ ମାମଲା',
  civil_cases: 'ସିଭିଲ୍ ମାମଲା',
  criminal_cases: 'ଆପରାଧିକ ମାମଲା',
  avg_case_resolution_days: 'ମାମଲା ସମାଧାନ ହାରାହାରି ଦିନ',
  total_grievances_received: 'ମୋଟ ଅଭିଯୋଗ ଗ୍ରହଣ',
  grievances_resolved: 'ସମାଧାନ ହୋଇଥିବା ଅଭିଯୋଗ',
  grievances_pending: 'ଅପେକ୍ଷାରେ ଅଭିଯୋଗ',
  online_grievances: 'ଅନଲାଇନ୍ ଅଭିଯୋଗ',
  offline_grievances: 'ଅଫଲାଇନ୍ ଅଭିଯୋଗ',
  avg_grievance_resolution_days: 'ଅଭିଯୋଗ ସମାଧାନ ହାରାହାରି ଦିନ',

  // Schemes & funds
  total_schemes_running: 'ଚାଲୁଥିବା ଯୋଜନା ମୋଟ',
  total_scheme_beneficiaries: 'ମୋଟ ଲାଭାନ୍ବିତ',
  pmay_beneficiaries: 'PMAY ଲାଭାନ୍ବିତ',
  mgnrega_beneficiaries: 'MGNREGA ଲାଭାନ୍ବିତ',
  old_age_pension_beneficiaries: 'ବୃଦ୍ଧାବସ୍ଥା ଭତ୍ତା ଲାଭାନ୍ବିତ',
  disability_pension_beneficiaries: 'ଅସମର୍ଥତା ଭତ୍ତା ଲାଭାନ୍ବିତ',
  women_welfare_scheme_beneficiaries: 'ମହିଳା କଲ୍ୟାଣ ଯୋଜନା ଲାଭାନ୍ବିତ',
  student_scholarship_beneficiaries: 'ଛାତ୍ରବୃତ୍ତି ଲାଭାନ୍ବିତ',
  funds_allocated: 'ମଞ୍ଜୁରିକୃତ ଅର୍ଥ',
  funds_utilized: 'ବ୍ୟବହୃତ ଅର୍ଥ',
  funds_remaining: 'ବାକି ଅର୍ଥ',

  // Public infrastructure
  total_schools: 'ମୋଟ ବିଦ୍ୟାଳୟ',
  total_colleges: 'ମୋଟ କଲେଜ୍',
  total_hospitals: 'ମୋଟ ହସ୍ପିଟାଲ୍',
  total_primary_health_centers: 'ମୋଟ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର',
  total_anganwadi_centers: 'ମୋଟ ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ର',
  total_police_stations: 'ମୋଟ ଥାନା',
  total_fire_stations: 'ମୋଟ ଅଗ୍ନିଶମ କେନ୍ଦ୍ର',
  total_banks: 'ମୋଟ ବ୍ୟାଙ୍କ',
  total_post_offices: 'ମୋଟ ଡାକଘର',
  total_market_places: 'ମୋଟ ବଜାର ଜାଗା',
  total_roads_km: 'ରାସ୍ତାଘାଟ (କି.ମି.)',
  total_bridges: 'ମୋଟ ପୋଲ୍/ସେତୁ',
  total_irrigation_projects: 'ମୋଟ ସିଚାଇ ପ୍ରକଳ୍ପ',
  total_water_supply_projects: 'ମୋଟ ଜଳ ଯୋଗାଣ ଓ ପରିମଳ ପ୍ରକଳ୍ପ',

  // Staff & digital
  total_staff: 'ମୋଟ କର୍ମଚାରୀ',
  revenue_inspectors_count: 'ରେଭେନ୍ୟୁ ଇନ୍ସପେକ୍ଟର ସଂଖ୍ୟା',
  amin_count: 'AMIN ସଂଖ୍ୟା',
  clerk_count: 'କ୍ଲାର୍କ ସଂଖ୍ୟା',
  data_entry_operators: 'ଡାଟା ଏଣ୍ଟ୍ରି ଅପରେଟର',
  vacant_posts: 'ଖାଲି ପଦ',
  filled_posts: 'ପୂରଣ ହୋଇଥିବା ପଦ',
  staff_trained_in_digital_services: 'ଡିଜିଟାଲ୍ ସେବାରେ ପ୍ରଶିକ୍ଷିତ କର୍ମଚାରୀ',
  total_computers: 'ମୋଟ କମ୍ପ୍ୟୁଟର',
  internet_available: 'ଇଣ୍ଟରନେଟ୍ ଉପଲବ୍ଧ',
  cctv_installed: 'CCTV ଲଗାଯାଇଛି',
  online_services_available: 'ଅନଲାଇନ୍ ସେବା ଉପଲବ୍ଧ',
  total_online_applications: 'ମୋଟ ଅନଲାଇନ୍ ଆବେଦନ',
  digital_records_percentage: 'ଡିଜିଟାଲ୍ ରେକର୍ଡ ଶତପ୍ରତିଶତ',
  website_available: 'ୱେବସାଇଟ୍ ଉପଲବ୍ଧ',

  // Budget & expenditure
  annual_budget_allocated: 'ବାର୍ଷିକ ବଜେଟ୍ ମଞ୍ଜୁରି',
  budget_utilized: 'ବ୍ୟବହୃତ ବଜେଟ୍',
  budget_remaining: 'ଅବଶିଷ୍ଟ ବଜେଟ୍',
  development_expenditure: 'ଉନ୍ନୟନ ବ୍ୟୟ',
  admin_expenditure: 'ପ୍ରଶାସନିକ ବ୍ୟୟ',
  welfare_expenditure: 'କଲ୍ୟାଣ ବ୍ୟୟ',

  // Literacy & coverage
  literacy_rate_percent: 'ସାକ୍ଷରତା ହାର (%)',
  male_literacy_percent: 'ପୁରୁଷ ସାକ୍ଷରତା (%)',
  female_literacy_percent: 'ମହିଳା ସାକ୍ଷରତା (%)',
  employment_rate_percent: 'ନିଯୁକ୍ତି ହାର (%)',
  agriculture_dependent_percent: 'ଚାଷ ଉପରେ ନିର୍ଭର (%)',
  irrigated_land_percent: 'ସିଚିତ ଜମି (%)',
  drinking_water_coverage_percent: 'ପିଉନି ପାଣି ଆବରଣ (%)',
  electricity_coverage_percent: 'ବିଦ୍ୟୁତ୍ ଆବରଣ (%)',

  // Projects & highlights
  major_projects_running: 'ମୁଖ୍ୟ ଚାଲୁ ପ୍ରକଳ୍ପ',
  upcoming_projects: 'ଆସନ୍ତା ପ୍ରକଳ୍ପ',
  key_challenges: 'ମୁଖ୍ୟ ଚ୍ୟାଲେଞ୍ଜ',
  achievements: 'ସଫଳତା',
  awards_received: 'ପୁରସ୍କାର ପ୍ରାପ୍ତ',
  description: 'ବର୍ଣ୍ଣନା',
};

export interface RevenueLandPortfolioDashboardProps {
  org: Organization;
  profile: Record<string, unknown>;
  departmentName?: string | null;
  images?: string[];
  /** When true, show Tahasil office portfolio with linked land parcels table. */
  isTahasilOffice?: boolean;
  parcelRows?: RevenueGovtLandRow[];
}

function formatVal(v: string | number | null | undefined): string {
  if (v == null || String(v).trim() === '') return '—';
  return String(v);
}

const keyToLabel = (key: string) =>
  key
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');

export function RevenueLandPortfolioDashboard({
  org,
  profile,
  departmentName,
  images = [],
  isTahasilOffice = false,
  parcelRows = [],
}: RevenueLandPortfolioDashboardProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const isOdia = language === 'or';
  const tr = (en: string, or: string) => (isOdia ? or : en);
  const parcelColumns = useMemo(() => buildRevenueGovtLandColumns(isOdia), [isOdia]);
  const parcelPageSize = 10;
  const [detailTab, setDetailTab] = useState<'overview' | 'tenure' | 'use' | 'risk'>('overview');
  /** 'profile' or a Resources category id (population, land, …, other). */
  const [tahasilOfficeTab, setTahasilOfficeTab] = useState<string>('profile');
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });

  const mapCenter = useMemo(() => {
    if (org.latitude != null && org.longitude != null) {
      return { lat: org.latitude, lng: org.longitude };
    }
    return { lat: 20.296, lng: 85.824 };
  }, [org.latitude, org.longitude]);

  const totalAreaAcres = profile['total_area_acres'] as string | number | null | undefined;
  const totalAreaHectares = profile['total_area_hectares'] as string | number | null | undefined;
  const totalAreaSqft = profile['total_area_sqft'] as string | number | null | undefined;
  const landBankFlag =
    (profile['is_in_land_bank_yes_no'] as string | null | undefined) ??
    (profile['is_in_land_bank'] as string | null | undefined);
  const landBankCategory =
    (profile['land_bank_category_a_b_other'] as string | null | undefined) ??
    (profile['land_bank_category'] as string | null | undefined);
  const encroachmentStatus =
    (profile['encroachment_status'] as string | null | undefined) ??
    (profile['encroachment_status_none_notice_eviction_pending_evicted_regularised'] as
      | string
      | null
      | undefined);
  const litigationStatus =
    (profile['litigation_status'] as string | null | undefined) ??
    (profile['litigation_status_none_pending_decreed_stayed'] as string | null | undefined);

  const topStats = [
    { label: tr('Total area (acres)', 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ଏକର)'), value: totalAreaAcres, icon: Layers, color: 'amber' },
    {
      label: tr('Total area (hectares)', 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ହେକ୍ଟର)'),
      value: totalAreaHectares,
      icon: Scale,
      color: 'emerald',
    },
    { label: tr('Total area (sqft)', 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ବର୍ଗ ଫୁଟ୍)'), value: totalAreaSqft, icon: Landmark, color: 'indigo' },
  ] as const;

  const statColorClasses: Record<
    (typeof topStats)[number]['color'],
    { card: string; label: string; value: string; iconWrap: string }
  > = {
    amber: {
      card: 'border-amber-200 bg-amber-100/40',
      label: 'text-amber-900/70',
      value: 'text-amber-950',
      iconWrap: 'bg-amber-200/50 text-amber-700',
    },
    emerald: {
      card: 'border-emerald-200 bg-emerald-100/40',
      label: 'text-emerald-900/70',
      value: 'text-emerald-950',
      iconWrap: 'bg-emerald-200/50 text-emerald-700',
    },
    indigo: {
      card: 'border-indigo-200 bg-indigo-100/40',
      label: 'text-indigo-900/70',
      value: 'text-indigo-950',
      iconWrap: 'bg-indigo-200/50 text-indigo-700',
    },
  };

  const highlightedKeys = new Set<string>([
    'tahasil',
    'ri_circle',
    'block_ulb',
    'gp_ward',
    'mouza_village',
    'habitation_locality',
    'urban_rural',
    'nearest_landmark',
    'road_connectivity_abutting_road_name',
    'distance_from_main_road_meters',
    'khata_no',
    'plot_no',
    'land_type_govt_private_other',
    'govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other',
    'kisam',
    'kisam_description',
    'department_recorded_as_owner',
    'department_in_possession',
    'present_use_office_school_health_centre_rli_road_pond_market_vacant_other',
    'proposed_use',
    'is_in_land_bank_yes_no',
    'land_bank_category_a_b_other',
    'leased_out_yes_no',
    'lessee_name',
    'lease_purpose',
    'lease_deed_no',
    'lease_period_from_dd_mm_yyyy',
    'lease_period_to_dd_mm_yyyy',
    'lease_premium_amount_rs',
    'lease_annual_rent_rs',
    'building_existing_yes_no',
    'building_name',
    'building_floors',
    'building_construction_year',
    'bhunaksha_sheet_no',
    'bhunaksha_plot_id',
    'ror_no',
    'ror_year',
    'last_mutation_case_no',
    'encroachment_case_no_ople',
    'encroachment_status',
    'court_case_no',
    'court_name',
    'litigation_status',
    'crz_zone_if_any',
    'flood_prone_yes_no',
    'other_restrictions_conditions',
    'remarks_description',
    'latitude',
    'longitude',
  ]);

  const locationFields: [string, unknown][] = [
    ['tahasil', profile['tahasil']],
    ['ri_circle', profile['ri_circle']],
    ['block_ulb', profile['block_ulb']],
    ['gp_ward', profile['gp_ward']],
    ['mouza_village', profile['mouza_village']],
    ['habitation_locality', profile['habitation_locality']],
    ['urban_rural', profile['urban_rural']],
    ['nearest_landmark', profile['nearest_landmark']],
    ['road_connectivity_abutting_road_name', profile['road_connectivity_abutting_road_name']],
    ['distance_from_main_road_meters', profile['distance_from_main_road_meters']],
  ];

  const tenureFields: [string, unknown][] = [
    ['khata_no', profile['khata_no']],
    ['plot_no', profile['plot_no']],
    ['land_type_govt_private_other', profile['land_type_govt_private_other']],
    [
      'govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other',
      profile['govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other'],
    ],
    ['kisam', profile['kisam']],
    ['kisam_description', profile['kisam_description']],
    ['department_recorded_as_owner', profile['department_recorded_as_owner']],
    ['department_in_possession', profile['department_in_possession']],
  ];

  const riskFields: [string, unknown][] = [
    ['encroachment_status', encroachmentStatus],
    ['encroachment_case_no_ople', profile['encroachment_case_no_ople']],
    ['court_case_no', profile['court_case_no']],
    ['court_name', profile['court_name']],
    ['litigation_status', litigationStatus],
    ['flood_prone_yes_no', profile['flood_prone_yes_no']],
    ['crz_zone_if_any', profile['crz_zone_if_any']],
  ];

  const useFields: [string, unknown][] = [
    [
      'present_use_office_school_health_centre_rli_road_pond_market_vacant_other',
      profile['present_use_office_school_health_centre_rli_road_pond_market_vacant_other'],
    ],
    ['proposed_use', profile['proposed_use']],
    ['is_in_land_bank_yes_no', landBankFlag],
    ['land_bank_category_a_b_other', landBankCategory],
    ['leased_out_yes_no', profile['leased_out_yes_no']],
    ['lessee_name', profile['lessee_name']],
    ['lease_purpose', profile['lease_purpose']],
    ['lease_deed_no', profile['lease_deed_no']],
    ['lease_period_from_dd_mm_yyyy', profile['lease_period_from_dd_mm_yyyy']],
    ['lease_period_to_dd_mm_yyyy', profile['lease_period_to_dd_mm_yyyy']],
    ['lease_premium_amount_rs', profile['lease_premium_amount_rs']],
    ['lease_annual_rent_rs', profile['lease_annual_rent_rs']],
  ];

  const buildingFields: [string, unknown][] = [
    ['building_existing_yes_no', profile['building_existing_yes_no']],
    ['building_name', profile['building_name']],
    ['building_floors', profile['building_floors']],
    ['building_construction_year', profile['building_construction_year']],
  ];

  const descriptionFields: [string, unknown][] = [
    ['other_restrictions_conditions', profile['other_restrictions_conditions']],
    ['remarks_description', profile['remarks_description']],
  ];

  const renderFieldList = (items: [string, unknown][]) => (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
      {items.map(([key, value]) => (
        <div key={key} className="border-b border-border/40 pb-1.5 last:border-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {keyToLabel(key)}
          </dt>
          <dd className="mt-0.5 text-sm text-slate-900">{formatVal(value as any)}</dd>
        </div>
      ))}
    </dl>
  );

  const galleryImages = Array.isArray((profile as any)?.gallery_images)
    ? ((profile as any).gallery_images as string[])
    : [];
  const finalImages =
    images.length > 0
      ? images
      : galleryImages.length > 0
        ? galleryImages
        : org.cover_image_key
          ? [org.cover_image_key]
          : [];

  const attributeEntries = Object.entries(profile || {})
    .filter(([key]) => !highlightedKeys.has(key) && key !== 'gallery_images')
    .sort(([a], [b]) => a.localeCompare(b));

  /** Keys shown in Tahasil “Office profile” tab; rest appear under Resources (health-style). */
  const tahasilProfileTabKeys = useMemo(
    () =>
      new Set([
        'tahasil',
        'ri_circle',
        'block_ulb',
        'gp_ward',
        'mouza_village',
        'habitation_locality',
        'sub_division',
        'block',
        'village_ward',
        'tahsil_name',
        'tahsil_code',
        'established_year',
        'establishment_year',
        'tahsildar_name',
        'contact_number',
        'email_id',
        'pin_code',
        'latitude',
        'longitude',
      ]),
    [],
  );

  const tahasilResourcesGrouped = useMemo(() => {
    if (!isTahasilOffice) return null;
    const resourceEntries = Object.entries(profile || {}).filter(
      ([key, v]) =>
        key !== 'gallery_images' &&
        !tahasilProfileTabKeys.has(key) &&
        v != null &&
        String(v).trim() !== '',
    );
    const byTab: Record<string, [string, unknown][]> = {};
    for (const def of TAHASIL_RESOURCE_TAB_DEFS) byTab[def.id] = [];
    byTab.other = [];
    for (const entry of resourceEntries) {
      const [k] = entry;
      const tid = TAHASIL_RESOURCE_KEY_TO_TAB[k] ?? 'other';
      byTab[tid].push(entry);
    }
    for (const tid of Object.keys(byTab)) {
      byTab[tid].sort(([a], [b]) => a.localeCompare(b));
    }
    const visibleTabs = TAHASIL_RESOURCE_TAB_DEFS.filter((def) => byTab[def.id].length > 0).map(
      (def) => ({ ...def, entries: byTab[def.id] }),
    );
    if (byTab.other.length > 0) {
      visibleTabs.push({
        id: 'other',
        label: 'Other',
        shortLabel: 'Other',
        keys: [] as readonly string[],
        icon: MoreHorizontal,
        entries: byTab.other,
      });
    }
    return { byTab, visibleTabs, totalCount: resourceEntries.length };
  }, [isTahasilOffice, profile, tahasilProfileTabKeys]);

  const resourceIconConfig = (key: string): { icon: typeof FileText; color: string } => {
    const tabId = TAHASIL_RESOURCE_KEY_TO_TAB[key] ?? 'other';
    const has = (parts: string[]) => parts.some((p) => key.includes(p));
    const keyHash = key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const fallbackIcon = TAHASIL_RESOURCE_ICON_POOL[keyHash % TAHASIL_RESOURCE_ICON_POOL.length];
    const fallbackColor = TAHASIL_RESOURCE_COLOR_POOL[keyHash % TAHASIL_RESOURCE_COLOR_POOL.length];

    if (tabId === 'population') {
      if (has(['population', 'households'])) return { icon: Users, color: 'indigo' };
      if (has(['villages', 'village'])) return { icon: Home, color: 'blue' };
      if (has(['gram_panchayats', 'wards'])) return { icon: Building, color: 'teal' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'land') {
      if (has(['area', 'land'])) return { icon: Layers, color: 'emerald' };
      if (has(['roads', 'water_bodies'])) return { icon: MapPin, color: 'blue' };
      if (has(['records', 'plot', 'khata', 'ror'])) return { icon: FileText, color: 'violet' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'mutations') {
      if (has(['pending'])) return { icon: AlertTriangle, color: 'amber' };
      if (has(['approved'])) return { icon: Shield, color: 'emerald' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'revenue') {
      if (has(['target', 'percent'])) return { icon: Activity, color: 'indigo' };
      if (has(['collection', 'fees', 'revenue'])) return { icon: Landmark, color: 'amber' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'certificates') {
      if (has(['pending', 'rejected'])) return { icon: AlertTriangle, color: 'rose' };
      if (has(['approved', 'issued'])) return { icon: Shield, color: 'emerald' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'cases') {
      if (has(['grievance'])) return { icon: Activity, color: 'teal' };
      if (has(['pending', 'overdue'])) return { icon: AlertTriangle, color: 'rose' };
      if (has(['resolved'])) return { icon: Shield, color: 'emerald' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'schemes') {
      if (has(['beneficiaries', 'pension', 'scholarship'])) return { icon: Users, color: 'indigo' };
      if (has(['funds', 'allocated', 'utilized', 'remaining'])) return { icon: Landmark, color: 'amber' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'infrastructure') {
      if (has(['schools', 'colleges'])) return { icon: Building, color: 'indigo' };
      if (has(['hospitals', 'health'])) return { icon: Activity, color: 'rose' };
      if (has(['roads', 'bridges', 'projects'])) return { icon: Layers, color: 'emerald' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'staff_digital') {
      if (has(['staff', 'inspectors', 'clerk', 'operators', 'posts'])) return { icon: UserCheck, color: 'indigo' };
      if (has(['online', 'digital', 'website', 'internet', 'computers', 'cctv'])) return { icon: Activity, color: 'teal' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'budget') {
      if (has(['remaining'])) return { icon: AlertTriangle, color: 'rose' };
      if (has(['utilized', 'expenditure'])) return { icon: Scale, color: 'indigo' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'literacy') {
      if (has(['male', 'female', 'literacy'])) return { icon: Users, color: 'blue' };
      if (has(['coverage', 'electricity', 'water'])) return { icon: Shield, color: 'emerald' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    if (tabId === 'highlights') {
      if (has(['awards', 'achievements'])) return { icon: Shield, color: 'violet' };
      if (has(['projects'])) return { icon: Layers, color: 'indigo' };
      return { icon: fallbackIcon, color: fallbackColor };
    }
    return { icon: fallbackIcon, color: fallbackColor };
  };

  if (isTahasilOffice) {
    const getTahasilResourceShortLabel = (id: string) => {
      switch (id) {
        case 'population':
          return tr('Population', 'ଜନସଂଖ୍ୟା');
        case 'land':
          return tr('Land', 'ଜମି');
        case 'mutations':
          return tr('Mutations', 'ମ୍ୟୁଟେସନ୍');
        case 'revenue':
          return tr('Revenue', 'ରେଭେନ୍ୟୁ');
        case 'certificates':
          return tr('Certificates', 'ପ୍ରମାଣପତ୍ର');
        case 'cases':
          return tr('Cases', 'ମାମଲା');
        case 'schemes':
          return tr('Schemes', 'ଯୋଜନା');
        case 'infrastructure':
          return tr('Infrastructure', 'ମୂଳଭୂମି');
        case 'staff_digital':
          return tr('Staff / IT', 'କର୍ମଚାରୀ / ଆଇ.ଟି.');
        case 'budget':
          return tr('Budget', 'ବଜେଟ୍');
        case 'literacy':
          return tr('Literacy', 'ଶିକ୍ଷା / ସାକ୍ଷରତା');
        case 'highlights':
          return tr('Highlights', 'ପ୍ରମୁଖ ଦିଗ');
        case 'other':
          return tr('Other', 'ଅନ୍ୟ');
        default:
          return id;
      }
    };

    const getTahasilResourceLabel = (id: string) => {
      switch (id) {
        case 'population':
          return tr('Population & settlements', 'ଜନସଂଖ୍ୟା ଓ ବସତି');
        case 'land':
          return tr('Land & records', 'ଜମି ଓ ରେକର୍ଡ');
        case 'mutations':
          return tr('Mutations', 'ମ୍ୟୁଟେସନ୍');
        case 'revenue':
          return tr('Revenue & tax', 'ରେଭେନ୍ୟୁ ଓ କର');
        case 'certificates':
          return tr('Certificates', 'ପ୍ରମାଣପତ୍ର');
        case 'cases':
          return tr('Cases & grievances', 'ମାମଲା ଓ ଅଭିଯୋଗ');
        case 'schemes':
          return tr('Schemes & funds', 'ଯୋଜନା ଓ ଅର୍ଥ');
        case 'infrastructure':
          return tr('Public infrastructure', 'ଜନସାଧାରଣ ପାଇଁ ମୂଳଭୂମି');
        case 'staff_digital':
          return tr('Staff & digital', 'କର୍ମଚାରୀ ଓ ଡିଜିଟାଲ୍');
        case 'budget':
          return tr('Budget & expenditure', 'ବଜେଟ୍ ଓ ବ୍ୟୟ');
        case 'literacy':
          return tr('Literacy & coverage', 'ଶିକ୍ଷା ଓ ଆବରଣ');
        case 'highlights':
          return tr('Projects & highlights', 'ପ୍ରକଳ୍ପ ଓ ପ୍ରମୁଖ ଦିଗ');
        case 'other':
          return tr('Other', 'ଅନ୍ୟ');
        default:
          return id;
      }
    };

    const getTahasilAttrLabel = (key: string) => {
      return isOdia ? TAHASIL_ATTR_LABEL_OR[key] ?? keyToLabel(key) : keyToLabel(key);
    };

    const tahasilTopStats = [
      {
        label: tr('Linked parcels', 'ଯୋଡାଯାଇଥିବା ପାର୍ସେଲ୍'),
        value: parcelRows.length,
        icon: Layers,
        color: 'amber' as const,
      },
      {
        label: tr('Total population', 'ମୋଟ ଲୋକସଂଖ୍ୟା'),
        value: profile['total_population'] as string | number | null | undefined,
        icon: Users,
        color: 'emerald' as const,
      },
      {
        label: tr('Total villages', 'ମୋଟ ଗ୍ରାମ'),
        value: profile['total_villages'] as string | number | null | undefined,
        icon: Home,
        color: 'indigo' as const,
      },
    ] as const;

    const tahasilResources = tahasilResourcesGrouped ?? {
      byTab: {} as Record<string, [string, unknown][]>,
      visibleTabs: [] as Array<(typeof TAHASIL_RESOURCE_TAB_DEFS)[number] & { entries: [string, unknown][] }>,
      totalCount: 0,
    };
    const visibleResourceIds = new Set(
      tahasilResources.visibleTabs.map((t) => t.id),
    );
    const effectiveTahasilTab =
      tahasilOfficeTab === 'profile' || visibleResourceIds.has(tahasilOfficeTab)
        ? tahasilOfficeTab
        : 'profile';
    const activeResourceEntries =
      effectiveTahasilTab !== 'profile'
        ? tahasilResources.byTab[effectiveTahasilTab] ?? []
        : [];

    return (
      <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16 overflow-x-hidden">
        <section className="w-full">
          <ImageSlider images={finalImages} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
        </section>

        <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
          {departmentName && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {departmentName}
            </p>
          )}
          <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
            {tr('Tahasil Office Dashboard', 'ତହସିଲ କାର୍ଯ୍ୟାଳୟ ଡ୍ୟାସବୋର୍ଡ')}
          </h1>
          <p className="mt-1 text-[15px] font-medium text-[#64748b]">
            {tr(
              'Office details and resources from available data',
              'ଉପଲବ୍ଧ ତଥ୍ୟ ଆଧାରରେ କାର୍ଯ୍ୟାଳୟ ବିବରଣୀ ଓ ସମ୍ପଦ',
            )}
          </p>
        </header>

        {/* Facility details — same shell as HealthPortfolioDashboard */}
        <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
          <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
            <div className="relative z-10">
              <div className="flex flex-col gap-3 mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b] shrink-0">
                  {tr('Facility details', 'ସୁବିଧା ବିବରଣୀ')}
                </h2>
                <div className="w-full overflow-x-auto pb-0.5 -mx-1 px-1">
                  <div className="flex min-w-min items-center gap-1 rounded-full bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setTahasilOfficeTab('profile')}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${effectiveTahasilTab === 'profile'
                        ? 'bg-white text-[#0f172a] shadow-sm'
                        : 'text-[#64748b] hover:text-[#0f172a]'
                        }`}
                    >
                      <span>{tr('Office profile', 'କାର୍ଯ୍ୟାଳୟ ପ୍ରୋଫାଇଲ୍')}</span>
                    </button>
                    {tahasilResources.visibleTabs.map((tab) => {
                      const active = tab.id === effectiveTahasilTab;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTahasilOfficeTab(tab.id)}
                          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition whitespace-nowrap ${active
                            ? 'bg-white text-[#0f172a] shadow-sm'
                            : 'text-[#64748b] hover:text-[#0f172a]'
                            }`}
                        >
                          <span>{getTahasilResourceShortLabel(tab.id)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {tahasilResources.totalCount === 0 && (
                  <p className="text-[12px] text-[#64748b]">
                    {tr(
                      'No additional portfolio fields in profile.',
                      'ଅତିରିକ୍ତ ପୋର୍ଟଫୋଲିଓ କ୍ଷେତ୍ର ନାହିଁ।',
                    )}
                  </p>
                )}
              </div>

              {effectiveTahasilTab === 'profile' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[
                    { label: tr('Office name', 'କାର୍ଯ୍ୟାଳୟ ନାମ'), val: org.name, icon: Building, color: 'blue' },
                    {
                      label: tr('Facility type', 'ସୁବିଧା ପ୍ରକାର'),
                      val: tr('Tahasil office', 'ତହସିଲ କାର୍ଯ୍ୟାଳୟ'),
                      icon: Landmark,
                      color: 'violet',
                    },
                    { label: tr('ID', 'ଆଇ.ଡି.'), val: org.id, icon: Hash, color: 'slate' },
                    {
                      label: tr('Tahasil (key)', 'ତହସିଲ (କି)'),
                      val: profile['tahasil'],
                      icon: MapPin,
                      color: 'emerald',
                    },
                    { label: tr('Tahsil name', 'ତହସିଲ ନାମ'), val: profile['tahsil_name'], icon: MapPin, color: 'teal' },
                    { label: tr('Tahsil code', 'ତହସିଲ କୋଡ୍'), val: profile['tahsil_code'], icon: Tag, color: 'amber' },
                    {
                      label: tr('Established year', 'ସ୍ଥାପିତ ବର୍ଷ'),
                      val: profile['established_year'] ?? profile['establishment_year'],
                      icon: Hash,
                      color: 'violet',
                    },
                    { label: tr('Block / ULB', 'ବ୍ଲକ / ULB'), val: profile['block_ulb'] ?? profile['block'], icon: MapPin, color: 'rose' },
                    { label: tr('Sub-division', 'ଉପ-ଅଞ୍ଚଳ'), val: profile['sub_division'], icon: MapPin, color: 'cyan' },
                    { label: tr('Village / Ward', 'ଗ୍ରାମ / ୱାର୍ଡ'), val: profile['village_ward'], icon: Home, color: 'blue' },
                    { label: tr('Tahsildar', 'ତହସିଲଦାର'), val: profile['tahsildar_name'], icon: UserCheck, color: 'emerald' },
                    { label: tr('Contact', 'ଯୋଗାଯୋଗ'), val: profile['contact_number'], icon: Activity, color: 'teal' },
                    { label: tr('Email', 'ଇମେଲ୍'), val: profile['email_id'], icon: FileText, color: 'slate' },
                    { label: tr('PIN code', 'ପିନ୍ କୋଡ୍'), val: profile['pin_code'], icon: Hash, color: 'violet' },
                    { label: tr('Latitude', 'ଅକ୍ଷାଂଶ'), val: org.latitude ?? profile['latitude'], icon: MapPin, color: 'rose' },
                    { label: tr('Longitude', 'ଦ୍ରାଘିମାଂଶ'), val: org.longitude ?? profile['longitude'], icon: MapPin, color: 'pink' },
                  ].map((item, idx) => {
                    const colorMap: Record<string, string> = {
                      blue: 'bg-blue-50 text-blue-600 border-blue-100',
                      emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      amber: 'bg-amber-50 text-amber-600 border-amber-100',
                      violet: 'bg-violet-50 text-violet-600 border-violet-100',
                      slate: 'bg-slate-100 text-slate-600 border-slate-200',
                      teal: 'bg-teal-50 text-teal-600 border-teal-100',
                      rose: 'bg-rose-50 text-rose-600 border-rose-100',
                      pink: 'bg-pink-50 text-pink-600 border-pink-100',
                      sky: 'bg-sky-50 text-sky-600 border-sky-100',
                      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                      orange: 'bg-orange-50 text-orange-600 border-orange-100',
                      cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
                    };
                    return (
                      <div key={idx} className="flex gap-4 items-center">
                        <div
                          className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                        >
                          <item.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                            {item.label}
                          </p>
                          <p className="text-[15px] font-bold text-[#0f172a] truncate">
                            {formatVal(item.val as string | number | null | undefined)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {effectiveTahasilTab !== 'profile' && tahasilResources.totalCount > 0 && (
                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                    {getTahasilResourceLabel(effectiveTahasilTab)}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeResourceEntries.map(([key, value]) => {
                      const item = resourceIconConfig(key);
                      const colorMap: Record<string, string> = {
                        blue: 'bg-blue-50 text-blue-600 border-blue-100',
                        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                        amber: 'bg-amber-50 text-amber-600 border-amber-100',
                        violet: 'bg-violet-50 text-violet-600 border-violet-100',
                        slate: 'bg-slate-100 text-slate-600 border-slate-200',
                        teal: 'bg-teal-50 text-teal-600 border-teal-100',
                        rose: 'bg-rose-50 text-rose-600 border-rose-100',
                        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                      };
                      return (
                        <div key={key} className="flex gap-4 items-center">
                          <div
                            className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                          >
                            <item.icon size={20} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                              {getTahasilAttrLabel(key)}
                            </p>
                            <p className="text-[15px] font-bold text-[#0f172a] truncate">
                              {formatVal(value as string | number | null | undefined)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats row — same structure as Health (explicit color classes) */}
        <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tahasilTopStats.map((stat, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-5 sm:p-6 shadow-sm flex justify-between items-center backdrop-blur-sm ${statColorClasses[stat.color].card}`}
              >
                <div className="min-w-0">
                  <p
                    className={`text-[12px] sm:text-[13px] font-bold mb-1 uppercase tracking-wider ${statColorClasses[stat.color].label}`}
                  >
                    {stat.label}
                  </p>
                  <h3
                    className={`text-[24px] sm:text-[32px] font-black leading-none ${statColorClasses[stat.color].value}`}
                  >
                    {formatVal(stat.value as string | number | null | undefined)}
                  </h3>
                </div>
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center ml-3 shadow-inner ${statColorClasses[stat.color].iconWrap}`}
                >
                  <stat.icon size={28} strokeWidth={2.5} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Government land parcels */}
        <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-16">
          <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
            <div className="rounded-2xl border border-slate-100 bg-white/40 overflow-hidden p-5 sm:p-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[#0f172a]">
                  {tr('Government land parcels', 'ସରକାରୀ ଜମି ପାର୍ସେଲ୍')}
                </h3>
                <p className="text-[11px] text-[#64748b]">
                  {tr(
                    'Parcels linked to this Tahasil. Open a row for the parcel portfolio.',
                    'ଏହି ତହସିଲ ସହ ଯୋଡାଯାଇଥିବା ପାର୍ସେଲ୍। ପାର୍ସେଲ୍ ପୋର୍ଟଫୋଲିଓ ପାଇଁ ଏକ ରୋ ଖୋଲନ୍ତୁ।',
                  )}
                </p>
              </div>
              <PaginatedHorizontalTable<RevenueGovtLandRow>
                columns={parcelColumns}
                rows={parcelRows}
                pageSize={parcelPageSize}
                getRowId={(r) => r.org.id}
                onRowClick={(r) => router.push(`/organizations/${r.org.id}`)}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16 overflow-x-hidden">
      {/* Hero */}
      <section className="w-full">
        <ImageSlider
          images={finalImages}
          altPrefix={org.name}
          className="h-[240px] min-[420px]:h-[280px] sm:h-[360px] lg:h-[410px]"
        />
      </section>

      {/* Top Header */}
      <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
          {tr('Land Parcel Dashboard', 'ଜମି ପାର୍ସେଲ୍ ଡ୍ୟାସବୋର୍ଡ')}
        </h1>
        <p className="mt-1 text-[15px] font-medium text-[#64748b]">
          {tr(
            'Parcel details, legal status, and utilization from available data',
            'ଉପଲବ୍ଧ ତଥ୍ୟରୁ ପାର୍ସେଲ୍ ବିବରଣୀ, ବୈଧିକ ସ୍ଥିତି ଓ ବ୍ୟବହାର',
          )}
        </p>
      </header>

      {/* Parcel details tabs (mirrors Health layout) */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
          <div className="relative z-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                {tr('Parcel details', 'ପାର୍ସେଲ୍ ବିବରଣୀ')}
              </h2>
              <div className="grid grid-cols-1 sm:flex items-center rounded-xl sm:rounded-full bg-slate-100 p-1 w-full sm:w-auto gap-1">
                <button
                  type="button"
                  onClick={() => setDetailTab('overview')}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl sm:rounded-full px-3 py-2 sm:py-1.5 text-xs font-semibold transition ${detailTab === 'overview'
                    ? 'bg-white text-[#0f172a] shadow-sm'
                    : 'text-[#64748b] hover:text-[#0f172a]'
                    }`}
                >
                  <Building size={14} />
                  <span>{tr('Overview', 'ସାରାଂଶ')}</span>
                </button>
              </div>
            </div>

            {detailTab === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  { label: tr('Tahasil', 'ତହସିଲ'), val: profile['tahasil'], icon: MapPin, color: 'emerald' },
                  { label: tr('RI Circle', 'ଆର୍.ଆଇ. ସର୍କଲ'), val: profile['ri_circle'], icon: MapPin, color: 'sky' },
                  { label: tr('Block / ULB', 'ବ୍ଲକ / ULB'), val: profile['block_ulb'], icon: MapPin, color: 'amber' },
                  { label: tr('GP / Ward', 'GP / ୱାର୍ଡ'), val: profile['gp_ward'], icon: MapPin, color: 'teal' },
                  { label: tr('Mouza / Village', 'ମୌଜା / ଗ୍ରାମ'), val: profile['mouza_village'], icon: MapPin, color: 'rose' },
                  {
                    label: tr('Habitation / Locality', 'ବସତି / ଲୋକାଲିଟି'),
                    val: profile['habitation_locality'],
                    icon: MapPin,
                    color: 'pink',
                  },
                  { label: tr('Khata No', 'ଖାତା ନଂ'), val: profile['khata_no'], icon: FileText, color: 'emerald' },
                  { label: tr('Plot No', 'ପ୍ଲଟ୍ ନଂ'), val: profile['plot_no'], icon: FileText, color: 'amber' },
                  {
                    label: tr('Land Type (GOVT/PRIVATE/OTHER)', 'ଜମି ପ୍ରକାର (ସରକାରୀ/ବେସରକାରୀ/ଅନ୍ୟ)'),
                    val:
                      (profile['land_type_govt_private_other'] as string | number | null | undefined) ??
                      (profile['land_type'] as string | number | null | undefined),
                    icon: Tag,
                    color: 'violet',
                  },
                  {
                    label: tr('Govt Land Category', 'ସରକାରୀ ଜମି ବର୍ଗ'),
                    val: profile['govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other'],
                    icon: Tag,
                    color: 'rose',
                  },
                  { label: tr('Kisam', 'କିସମ'), val: profile['kisam'], icon: FileText, color: 'teal' },
                  { label: tr('Kisam Description', 'କିସମ ବର୍ଣ୍ଣନା'), val: profile['kisam_description'], icon: FileText, color: 'slate' },
                  { label: tr('Total Area (Acres)', 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ଏକର)'), val: profile['total_area_acres'], icon: Layers, color: 'amber' },
                  { label: tr('Total Area (Hectares)', 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ହେକ୍ଟର)'), val: profile['total_area_hectares'], icon: Scale, color: 'emerald' },
                  { label: tr('Total Area (Sqft)', 'ମୋଟ କ୍ଷେତ୍ରଫଳ (ବର୍ଗ ଫୁଟ୍)'), val: profile['total_area_sqft'], icon: Landmark, color: 'slate' },
                  { label: tr('ROR Year', 'ROR ବର୍ଷ'), val: profile['ror_year'], icon: FileText, color: 'blue' },
                ].map((item, idx) => {
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 text-blue-600 border-blue-100',
                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    amber: 'bg-amber-50 text-amber-600 border-amber-100',
                    violet: 'bg-violet-50 text-violet-600 border-violet-100',
                    slate: 'bg-slate-100 text-slate-600 border-slate-200',
                    teal: 'bg-teal-50 text-teal-600 border-teal-100',
                    rose: 'bg-rose-50 text-rose-600 border-rose-100',
                    pink: 'bg-pink-50 text-pink-600 border-pink-100',
                    sky: 'bg-sky-50 text-sky-600 border-sky-100',
                  };
                  return (
                    <div key={idx} className="flex gap-4 items-center">
                      <div
                        className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                      >
                        <item.icon size={20} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                          {item.label}
                        </p>
                        <p className="text-[15px] font-bold text-[#0f172a] truncate">
                          {formatVal(item.val as any)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {detailTab === 'tenure' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {tenureFields.map(([key, value]) => {
                    const config: Record<string, { icon: any; color: string }> = {
                      govt_land_id: { icon: Hash, color: 'indigo' },
                      khata_no: { icon: FileText, color: 'emerald' },
                      plot_no: { icon: FileText, color: 'amber' },
                      sub_plot_no: { icon: FileText, color: 'sky' },
                      land_type_govt_private_other: { icon: Tag, color: 'violet' },
                      govt_land_category_gochar_gramya_jungle_sarbasadharan_khasmahal_nazul_other: {
                        icon: Tag,
                        color: 'pink',
                      },
                      kisam: { icon: FileText, color: 'teal' },
                      kisam_description: { icon: FileText, color: 'slate' },
                      department_recorded_as_owner: { icon: Shield, color: 'rose' },
                      department_in_possession: { icon: Shield, color: 'orange' },
                    };

                    const item = config[key] || { icon: FileText, color: 'slate' };
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
                      <div key={key} className="flex gap-4 items-center">
                        <div
                          className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                        >
                          <item.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                            {keyToLabel(key)}
                          </p>
                          <p className="text-[15px] font-bold text-[#0f172a] truncate">
                            {formatVal(value as any)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {detailTab === 'use' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {useFields.map(([key, value]) => {
                    const config: Record<string, { icon: any; color: string }> = {
                      present_use_office_school_health_centre_rli_road_pond_market_vacant_other: {
                        icon: Layers,
                        color: 'emerald',
                      },
                      proposed_use: { icon: FileText, color: 'indigo' },
                      is_in_land_bank_yes_no: { icon: Landmark, color: 'violet' },
                      land_bank_category_a_b_other: { icon: Tag, color: 'pink' },
                      leased_out_yes_no: { icon: Scale, color: 'amber' },
                      lessee_name: { icon: Building, color: 'sky' },
                      lease_purpose: { icon: FileText, color: 'teal' },
                      lease_deed_no: { icon: Hash, color: 'slate' },
                      lease_period_from_dd_mm_yyyy: { icon: FileText, color: 'orange' },
                      lease_period_to_dd_mm_yyyy: { icon: FileText, color: 'rose' },
                      lease_premium_amount_rs: { icon: FileText, color: 'emerald' },
                      lease_annual_rent_rs: { icon: FileText, color: 'blue' },
                    };

                    const item = config[key] || { icon: FileText, color: 'slate' };
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
                      <div key={key} className="flex gap-4 items-center">
                        <div
                          className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                        >
                          <item.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                            {keyToLabel(key)}
                          </p>
                          <p className="text-[15px] font-bold text-[#0f172a] truncate">
                            {formatVal(value as any)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {detailTab === 'risk' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[
                    ...riskFields,
                    ['bhunaksha_sheet_no', profile['bhunaksha_sheet_no']],
                    ['bhunaksha_plot_id', profile['bhunaksha_plot_id']],
                    ['ror_no', profile['ror_no']],
                    ['ror_year', profile['ror_year']],
                    ['last_mutation_case_no', profile['last_mutation_case_no']],
                  ].map(([key, value]) => {
                    const keyStr = typeof key === 'string' ? key : String(key);
                    const config: Record<string, { icon: any; color: string }> = {
                      encroachment_status: { icon: AlertTriangle, color: 'rose' },
                      encroachment_case_no_ople: { icon: Activity, color: 'orange' },
                      court_case_no: { icon: FileText, color: 'slate' },
                      court_name: { icon: Home, color: 'indigo' },
                      litigation_status: { icon: AlertTriangle, color: 'amber' },
                      flood_prone_yes_no: { icon: AlertTriangle, color: 'emerald' },
                      crz_zone_if_any: { icon: Layers, color: 'sky' },
                      bhunaksha_sheet_no: { icon: FileText, color: 'teal' },
                      bhunaksha_plot_id: { icon: FileText, color: 'violet' },
                      ror_no: { icon: FileText, color: 'pink' },
                      ror_year: { icon: FileText, color: 'blue' },
                      last_mutation_case_no: { icon: FileText, color: 'slate' },
                    };

                    const item = config[keyStr] || { icon: FileText, color: 'slate' };
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
                      <div key={keyStr} className="flex gap-4 items-center">
                        <div
                          className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[item.color]}`}
                        >
                          <item.icon size={20} strokeWidth={2} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                            {keyToLabel(keyStr)}
                          </p>
                          <p className="text-[15px] font-bold text-[#0f172a] truncate">
                            {formatVal(value as any)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats row – mirrors Health dashboard */}
      <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topStats.map((stat, i) => (
            <div
              key={i}
              className={`rounded-2xl border p-5 sm:p-6 shadow-sm flex justify-between items-center backdrop-blur-sm ${statColorClasses[stat.color].card}`}
            >
              <div className="min-w-0">
                <p
                  className={`text-[12px] sm:text-[13px] font-bold mb-1 uppercase tracking-wider ${statColorClasses[stat.color].label}`}
                >
                  {stat.label}
                </p>
                <h3
                  className={`text-[24px] sm:text-[32px] font-black leading-none ${statColorClasses[stat.color].value}`}
                >
                  {formatVal(stat.value as any)}
                </h3>
              </div>
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center ml-3 shadow-inner ${statColorClasses[stat.color].iconWrap}`}
              >
                <stat.icon size={28} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}

