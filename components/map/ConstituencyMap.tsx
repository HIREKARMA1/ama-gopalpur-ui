'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline,
} from '@react-google-maps/api';
import { ChevronDown, Info, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  GOPALPUR_BOUNDS,
  GOPALPUR_CENTER,
  DEFAULT_ZOOM,
  EDUCATION_MARKER_ICONS,
  EDUCATION_TYPE_LABELS,
  EDUCATION_SUB_DEPT_LABELS,
  AWC_MARKER_ICON,
  MARKER_COLORS,
  HEALTH_MARKER_ICONS,
  DEPARTMENT_MARKER_ICONS,
  HEALTH_TYPE_LABELS,
  ELECTRICITY_MARKER_ICON,
  ELECTRICITY_TYPE_LABEL,
  getDrainLineKind,
  DRAIN_LINE_COLORS,
  IRRIGATION_CATEGORY_MARKER_COLORS,
  MINOR_IRRIGATION_LEGEND_ORDER,
} from '../../lib/mapConfig';
import type { DrainLineKind } from '../../lib/mapConfig';
import type { MessageKey } from '../i18n/messages';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { MapCalloutCard, MapCalloutMetaMuted, MapCalloutMetaRow } from './MapCalloutCard';
import { MapLegendPanel, MapLegendRow } from './MapLegend';
import { MapViewToolbar } from './MapViewToolbar';
import { MapBlockFilter } from './MapBlockFilter';
import {
  buildDedupedRoadFilterOptions,
  isGpRoadSector,
  isMunicipalityRoadSector,
  normalizeConstituencyBlock,
  normalizeRoadLocationKey,
} from '../../lib/roadsOrganization';

const EDUCATION_TYPE_KEYS: Record<string, MessageKey> = {
  PRIMARY_SCHOOL: 'map.edu.primarySchool',
  UPPER_PRIMARY_SCHOOL: 'map.edu.upperPrimarySchool',
  HIGH_SCHOOL: 'map.edu.highSchool',
  HIGHER_SECONDARY: 'map.edu.higherSecondary',
  SENIOR_SECONDARY: 'map.edu.seniorSecondary',
  COLLEGE: 'map.edu.college',
  UNIVERSITY: 'map.edu.university',
};
const EDUCATION_SUB_DEPT_KEYS: Record<string, MessageKey> = {
  PS: 'map.edu.sub.ps',
  UPS: 'map.edu.sub.ups',
  HS: 'map.edu.sub.hs',
  HSS: 'map.edu.sub.hss',
  SSS: 'map.edu.sub.sss',
  OTHER: 'map.edu.sub.other',
  ENGINEERING_COLLEGE: 'map.edu.sub.engineeringCollege',
  ITI: 'map.edu.sub.iti',
  UNIVERSITY: 'map.edu.sub.university',
  DEGREE_COLLEGE: 'map.edu.sub.degreeCollege',
  DIPLOMA_COLLEGE: 'map.edu.sub.diplomaCollege',
};
const HEALTH_TYPE_KEYS: Record<string, MessageKey> = {
  HOSPITAL: 'map.health.hospital',
  CHC: 'map.health.chc',
  PHC: 'map.health.phc',
  SC: 'map.health.sc',
  UAAM: 'map.health.uaam',
  UPHC: 'map.health.uphc',
  HEALTH_CENTRE: 'map.health.healthCentre',
  OTHER: 'map.health.other',
};

const WATCO_SUB_DEPARTMENTS = ['WATCO', 'RWSS'] as const;

const ROAD_LEGEND_COLORS = [
  '#ea4335',
  '#1967d2',
  '#34a853',
  '#f59e0b',
  '#9333ea',
  '#0ea5e9',
] as const;

function normalizeRoadLegendSector(raw: string | null | undefined, codeRaw?: string | null): string {
  const sector = (raw || '').trim().toUpperCase().replace(/\s+/g, ' ');
  const code = (codeRaw || '').trim().toUpperCase();
  if (sector.includes('NH') || code.startsWith('NH')) return 'NH';
  if (sector.includes('SH') || code.startsWith('SH')) return 'SH';
  if (sector.includes('PWD') || sector.includes('R&B')) return 'PWD';
  if (sector.includes('RD')) return 'RD';
  if (sector.includes('PS')) return 'PS';
  if (sector.includes('MUNICIPAL')) return 'MUNICIPALITY';
  if (sector.includes('GP')) return 'GP';
  return sector || 'OTHER';
}

function roadLegendColor(typeKey: string): string {
  const canonical = normalizeRoadLegendSector(typeKey);
  if (canonical === 'NH') return '#ea4335';
  if (canonical === 'SH') return '#1967d2';
  if (canonical === 'PWD') return '#f59e0b';
  if (canonical === 'RD') return '#34a853';
  if (canonical === 'PS') return '#9333ea';
  if (canonical === 'GP') return '#0ea5e9';
  if (canonical === 'MUNICIPALITY') return '#e11d48';
  if (canonical === 'OTHER') return '#6b7280';
  let hash = 0;
  for (let i = 0; i < typeKey.length; i += 1) hash = (hash * 31 + typeKey.charCodeAt(i)) >>> 0;
  return ROAD_LEGEND_COLORS[hash % ROAD_LEGEND_COLORS.length] ?? '#9e6700';
}

const ROAD_LEGEND_LABEL_KEYS: Record<string, MessageKey> = {
  NH: 'roads.type.nh',
  SH: 'roads.type.sh',
  PWD: 'roads.type.pwd',
  RD: 'roads.type.rd',
  PS: 'roads.type.ps',
  GP: 'roads.type.gp',
  MUNICIPALITY: 'roads.type.municipality',
  OTHER: 'roads.type.other',
};

function roadLegendLabel(typeKey: string, lang: 'en' | 'or'): string {
  const canonical = normalizeRoadLegendSector(typeKey);
  const msgKey = ROAD_LEGEND_LABEL_KEYS[canonical];
  return msgKey ? t(msgKey, lang) : canonical;
}

const WATCO_MARKER_HEX: Record<(typeof WATCO_SUB_DEPARTMENTS)[number], string> = {
  WATCO: '#0ea5e9',
  RWSS: '#22c55e',
};

const WATCO_LEGEND_LABEL_KEYS: Record<(typeof WATCO_SUB_DEPARTMENTS)[number], MessageKey> = {
  WATCO: 'map.legend.watco',
  RWSS: 'map.legend.rwss',
};

function normalizeWatcoLegendType(raw: string | null | undefined): (typeof WATCO_SUB_DEPARTMENTS)[number] | null {
  const v = (raw || '').trim().toUpperCase();
  if (!v) return null;
  if (v === 'WATCO') return 'WATCO';
  if (v === 'RWSS') return 'RWSS';
  return null;
}

const EDUCATION_SUB_DEPT_DOT_COLORS: Record<string, string> = {
  PS: '#ea4335',
  UPS: '#1967d2',
  HS: '#34a853',
  HSS: '#34a853',
  SSS: '#fbbc04',
  OTHER: '#9c27b0',
  ENGINEERING_COLLEGE: '#22c55e',
  ITI: '#0ea5e9',
  UNIVERSITY: '#f97316',
  DEGREE_COLLEGE: '#ea580c',
  DIPLOMA_COLLEGE: '#8b5cf6',
};

const CONSTITUENCY_BLOCK_OPTIONS = [
  { value: 'ALL', label: 'All blocks' },
  { value: 'RANGEILUNDA', label: 'Rangeilunda' },
  { value: 'KUKUDAKHANDI', label: 'Kukudakhandi' },
  { value: 'BERHAMPUR_URBAN_I', label: 'Berhampur Urban-I' },
] as const;

const ROAD_MANUAL_GP_WARDS_BY_BLOCK: Record<string, string[]> = {
  KUKUDAKHANDI: [
    'LOCHAPADA',
    'NIMAKHANDI',
    'HUGULAPATA',
    'BORIGAM',
    'GURUNTHI',
  ],
  RANGEILUNDA: [
    'BADAKUSASTALLI',
    'BHABINIPUR',
    'BISWANATHPUR',
    'BOXIPALLI',
    'CHANDAPUR',
    'CHIKARADA',
    'DURA',
    'GOUNJU',
    'GOLANBANDHA',
    'GOLANTHARA',
    'HALADIAPADAR',
    'HATTIPADA',
    'INDRAKHI',
    'KAMALAPUR',
    'KARAPALLI',
    'KELUAPALLI',
    'KOLATHIGAM',
    'KONISI',
    'KOTHARSINGI',
    'LOUDIGAM',
    'LUHAJHARA',
    'MANTRIDI',
    'MARKANDI',
    'MENDRAJPUR',
    'NARAYANPUR',
    'PADMAPUR',
    'PHULTA',
    'RANDHA',
    'RANGEILUNDA',
    'RANGIPUR',
    'SASANAPADARA',
    'SATAKUTUNI',
    'Gopalpur NAC',
  ],
  BERHAMPUR_URBAN_I: ['37', '38', '39', '40', '41', '42'],
};

function translateIrrigationCategory(label: string, lang: 'en' | 'or'): string {
  const v = (label || '').trim();
  const upper = v.toUpperCase();
  const key =
    upper === 'TANK'
      ? ('irrigation.category.tank' as MessageKey)
      : upper === 'CHECK DAM'
        ? ('irrigation.category.checkDam' as MessageKey)
        : upper === 'ANICUT'
          ? ('irrigation.category.anicut' as MessageKey)
          : upper === 'CANAL'
            ? ('irrigation.category.canal' as MessageKey)
            : upper === 'FLOW MIP' || upper === 'FLOW_MIP'
              ? ('irrigation.category.flowMip' as MessageKey)
              : null;
  return key ? t(key, lang) : v;
}

function normalizeMinorIrrigationCategoryType(raw: string | null | undefined): string {
  return (raw || '')
    .trim()
    .toUpperCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Dept names for map search placeholder — use i18n so Odia toggle applies (e.g. କୃଷି). */
const MAP_SEARCH_DEPT_LABEL_KEYS: Record<string, MessageKey> = {
  EDUCATION: 'dept.education',
  HEALTH: 'dept.health',
  ICDS: 'dept.icds',
  AWC_ICDS: 'dept.icds',
  AGRICULTURE: 'dept.agriculture',
  ROADS: 'dept.roads',
  ELECTRICITY: 'dept.electricity',
  DRAINAGE: 'dept.drainage',
  WATCO_RWSS: 'dept.water',
  IRRIGATION: 'dept.irrigation',
  MINOR_IRRIGATION: 'dept.minorIrrigation',
  REVENUE_LAND: 'dept.revenueLand',
  ARCS: 'dept.arcs',
};

function mapSearchDeptPlaceholderLabel(code: string | undefined, lang: 'en' | 'or'): string {
  const msgKey = MAP_SEARCH_DEPT_LABEL_KEYS[(code || '').toUpperCase()];
  if (msgKey) return t(msgKey, lang);
  if (!code) return '';
  return code
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

const AGRICULTURE_LEGEND_ORDER = [
  'AGRICULTURE SERVICE CENTER',
  'AGRICULTURE EXTENSION CENTER',
] as const;

function normalizeAgricultureInstitutionKey(raw: string | null | undefined): string {
  return (raw || '').trim().toUpperCase().replace(/\s+/g, ' ');
}

/** Institution / sub_dept values → i18n (include Odia for CSV/API variants). */
const AGRICULTURE_INSTITUTION_I18N_KEY: Record<string, MessageKey> = {
  'AGRICULTURE SERVICE CENTER': 'agriculture.type.serviceCenter',
  'AGRICULTURE EXTENSION CENTER': 'agriculture.type.extensionCenter',
  'AGRIL. & FARMERS EMPOWERMENT': 'agriculture.type.agrilFarmersEmpowerment',
  'AGRIL & FARMERS EMPOWERMENT': 'agriculture.type.agrilFarmersEmpowerment',
  'ODISHA STATE SEED CORPORATION': 'agriculture.type.odishaStateSeedCorporation',
};

function agricultureInstitutionI18nLookup(key: string): MessageKey | undefined {
  const k = key.trim();
  if (AGRICULTURE_INSTITUTION_I18N_KEY[k]) return AGRICULTURE_INSTITUTION_I18N_KEY[k];
  const noDots = k.replace(/\./g, '').replace(/\s+/g, ' ');
  if (AGRICULTURE_INSTITUTION_I18N_KEY[noDots]) return AGRICULTURE_INSTITUTION_I18N_KEY[noDots];
  const ampToAnd = k.replace(/\s*&\s*/g, ' AND ');
  if (AGRICULTURE_INSTITUTION_I18N_KEY[ampToAnd]) return AGRICULTURE_INSTITUTION_I18N_KEY[ampToAnd];
  const relaxed = k.replace(/\./g, '').replace(/\s*&\s*/g, ' AND ');
  if (AGRICULTURE_INSTITUTION_I18N_KEY[relaxed]) return AGRICULTURE_INSTITUTION_I18N_KEY[relaxed];
  return undefined;
}

function agricultureInstitutionLegendLabel(key: string, lang: 'en' | 'or'): string {
  const msgKey = agricultureInstitutionI18nLookup(key);
  if (msgKey) return t(msgKey, lang);
  return key
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface MapOrganization {
  id: number;
  name: string;
  type: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  sub_department?: string | null;
  attributes?: Record<string, string | number | null> | null;
}

/** Road segment from GeoJSON (point A to B path) for Roads department map */
export interface RoadFeature {
  type: 'Feature';
  properties: {
    organizationId?: number | null;
    name?: string;
    roadName?: string;
    code?: string;
    block?: string;
    gpWard?: string;
    roadSector?: string;
    nameOfDivision?: string | null;
    scheme?: string | null;
    lengthKm?: number | null;
    yearOfConstruction?: number | null;
    pointAName?: string;
    pointBName?: string;
    startLat?: number | null;
    startLng?: number | null;
    endLat?: number | null;
    endLng?: number | null;
    carriagewayWidthM?: string | number | null;
    lastMaintenanceDate?: string | null;
    trafficClass?: string | null;
    drainageStatus?: string | null;
    safetyFeatures?: string | null;
    issues?: string | null;
    remarks?: string | null;
  };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

/** Drain segment from GeoJSON (point A to B path) for Drainage department map */
export interface DrainFeature {
  type: 'Feature';
  properties: {
    organizationId?: number | null;
    name?: string;
    drainName?: string;
    code?: string;
    block?: string;
    project?: string;
    drainLineKind?: DrainLineKind;
    lengthKm?: string;
    remarks?: string;
  };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

interface ConstituencyMapProps {
  selectedDepartmentId?: number;
  /** Department code (e.g. 'EDUCATION', 'ROADS') */
  selectedDepartmentCode?: string;
  /** Optional legend type to auto-apply when a department is selected. */
  initialLegendFilterType?: string | null;
  /** Localized label for map summary dialog (sidebar name) */
  mapDepartmentLabel?: string;
  /** Public map summary from API (department admin) */
  mapSummary?: string | null;
  /** Organizations to show as pins (only those with lat/lng are displayed) */
  organizations?: MapOrganization[];
  /** Road segments to show as polylines when department is ROADS */
  roads?: RoadFeature[];
  /** Drain segments to show as polylines when department is DRAINAGE */
  drains?: DrainFeature[];
  /** Called when user clicks a marker (e.g. to show profile) */
  onSelectOrganization?: (id: number) => void;
  /** Persisted selected org id (used to restore open info window on refresh). */
  selectedOrganizationId?: number | null;
  /** Called when map info-window org changes. */
  onOrganizationInfoChange?: (id: number | null) => void;
  /** Persisted selected road org id (used to restore selected road on refresh). */
  selectedRoadOrganizationId?: number | null;
  /** Persisted road street-view open state. */
  isRoadStreetViewOpen?: boolean;
  /** Called when selected road changes. */
  onRoadSelectionChange?: (organizationId: number | null, roadName?: string | null) => void;
  /** Called when road street-view open state changes. */
  onRoadStreetViewOpenChange?: (
    open: boolean,
    organizationId?: number | null,
    roadName?: string | null,
  ) => void;
}

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Build a clean circular marker icon (no letters).
 * This is intentionally minimal so dense maps are easier to scan.
 */
function createCircleMarkerSvgIcon(fillColor: string): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(15,23,42,0.35)"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <circle cx="18" cy="18" r="10.5" fill="${fillColor}" />
    <circle cx="18" cy="18" r="10.5" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="2.5"/>
    <circle cx="18" cy="18" r="3.2" fill="rgba(255,255,255,0.95)"/>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function ConstituencyMap({
  selectedDepartmentId,
  selectedDepartmentCode,
  initialLegendFilterType = null,
  mapDepartmentLabel = '',
  mapSummary = null,
  organizations = [],
  roads = [],
  drains = [],
  onSelectOrganization,
  selectedOrganizationId = null,
  onOrganizationInfoChange,
  selectedRoadOrganizationId = null,
  isRoadStreetViewOpen = false,
  onRoadSelectionChange,
  onRoadStreetViewOpenChange,
}: ConstituencyMapProps) {
  const { language } = useLanguage();
  const [infoWindowOrg, setInfoWindowOrg] = useState<MapOrganization | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadFeature | null>(null);
  const [selectedDrain, setSelectedDrain] = useState<DrainFeature | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  /** When set, only show markers of this type (Education/Health legend click). Click again to clear. */
  const [legendFilterType, setLegendFilterType] = useState<string | null>(null);
  /** When set, only show roads of this type (Roads legend click). Click again to clear. */
  const [roadLegendFilterType, setRoadLegendFilterType] = useState<string | null>(null);
  /** When set, only show drain polylines of this kind (Drainage legend). */
  const [drainKindFilter, setDrainKindFilter] = useState<DrainLineKind | null>(null);
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('ALL');
  const [selectedGpWardFilter, setSelectedGpWardFilter] = useState<string>('ALL');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isMobileBlockDropdownOpen, setIsMobileBlockDropdownOpen] = useState(false);
  const [isMobileGpWardDropdownOpen, setIsMobileGpWardDropdownOpen] = useState(false);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [isStreetInfoOpen, setIsStreetInfoOpen] = useState(false);
  const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [streetViewMessage, setStreetViewMessage] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mapWrapRef = useRef<HTMLDivElement>(null);
  const lastAppliedInitialLegendRef = useRef<string>('');
  const lastRestoredRoadOrgIdRef = useRef<number | null>(null);
  /** Restore pan/zoom after remounting the map (polyline legend filters force remount to clear ghost overlays). */
  const mapCameraPreserveRef = useRef<{ center: { lat: number; lng: number }; zoom: number } | null>(
    null,
  );
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  /** Load map in Odia when user has selected Odia. Read from localStorage so we use Odia on first paint after reload (context updates only in useEffect). Fixed at first mount so useJsApiLoader is never called with different options. */
  const [mapLanguage] = useState<'en' | 'or'>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem('ama_gopalpur_language');
    return stored === 'or' ? 'or' : 'en';
  });
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    language: mapLanguage,
    region: 'IN',
  });

  /** Handle clicks outside search container to close dropdown */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    }

    if (showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchDropdown]);

  const organizationsByBlock = useMemo(() => {
    const normalizedSelectedBlock = normalizeConstituencyBlock(selectedBlockFilter);
    if (!normalizedSelectedBlock || normalizedSelectedBlock === 'ALL') return organizations;
    return organizations.filter((org) => {
      const rawBlock =
        (org.attributes?.ulb_block as string | undefined) ||
        (org.attributes?.block_ulb as string | undefined) ||
        (org.attributes?.block_name as string | undefined) ||
        (org.attributes?.blockName as string | undefined) ||
        (org.attributes?.block as string | undefined) ||
        (org.address as string | undefined) ||
        '';
      const normalizedOrgBlock = normalizeConstituencyBlock(rawBlock);
      return normalizedOrgBlock === normalizedSelectedBlock;
    });
  }, [organizations, selectedBlockFilter]);

  /** Only organizations with valid coordinates */
  const allOrgsWithLocation = useMemo(
    () =>
      organizations.filter(
        (org): org is MapOrganization & { latitude: number; longitude: number } =>
          org.latitude != null &&
          org.longitude != null &&
          Number.isFinite(org.latitude) &&
          Number.isFinite(org.longitude)
      ),
    [organizations]
  );

  /** Only organizations with valid coordinates */
  const orgsWithLocation = useMemo(
    () =>
      organizationsByBlock.filter(
        (org): org is MapOrganization & { latitude: number; longitude: number } =>
          org.latitude != null &&
          org.longitude != null &&
          Number.isFinite(org.latitude) &&
          Number.isFinite(org.longitude)
      ),
    [organizationsByBlock]
  );

  const minorIrrigationLegendTypes = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'MINOR_IRRIGATION') return [];
    const fromData = Array.from(
      new Set(
        allOrgsWithLocation
          .map((o) => normalizeMinorIrrigationCategoryType(o.attributes?.category_type as string))
          .filter((t) => t.length > 0),
      ),
    );
    const order = MINOR_IRRIGATION_LEGEND_ORDER as readonly string[];
    const ordered = order.filter((c) => fromData.includes(c));
    const extras = fromData.filter((c) => !order.includes(c)).sort();
    return [...ordered, ...extras];
  }, [allOrgsWithLocation, selectedDepartmentCode]);

  const agricultureInstitutionLegendTypes = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'AGRICULTURE') return [];
    const fromData = Array.from(
      new Set(
        allOrgsWithLocation
          .map((o) =>
            normalizeAgricultureInstitutionKey(
              (o.sub_department as string) || (o.attributes?.sub_department as string) || '',
            ),
          )
          .filter((k) => k.length > 0),
      ),
    );
    const order = AGRICULTURE_LEGEND_ORDER as readonly string[];
    const ordered = order.filter((c) => fromData.includes(c));
    const extras = fromData.filter((c) => !order.includes(c)).sort();
    return [...ordered, ...extras];
  }, [allOrgsWithLocation, selectedDepartmentCode]);

  const irrigationLegendTypes = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'IRRIGATION') return [];
    return Array.from(
      new Set(
        allOrgsWithLocation
          .map((org) => ((org.attributes?.category as string) || '').trim())
          .filter((v) => v.length > 0),
      ),
    );
  }, [allOrgsWithLocation, selectedDepartmentCode]);

  const electricityLegendTypes = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'ELECTRICITY') return [];
    return Array.from(
      new Set(
        allOrgsWithLocation
          .map((org) => ((org.attributes?.institution_type as string) || '').trim())
          .filter((v) => v.length > 0),
      ),
    );
  }, [allOrgsWithLocation, selectedDepartmentCode]);

  /** Counts per education sub-department from loaded orgs (API/Memo). */
  const educationSubDeptCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'EDUCATION') {
      return {} as Record<string, number>;
    }
    const counts: Record<string, number> = {};
    for (const key of Object.keys(EDUCATION_SUB_DEPT_LABELS)) {
      counts[key] = 0;
    }
    for (const org of organizationsByBlock) {
      const sub = (org.sub_department || '').toUpperCase();
      if (sub in counts) counts[sub] += 1;
    }
    return counts;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const awcIcdsLegendCount = useMemo(() => {
    const code = selectedDepartmentCode?.toUpperCase();
    if (code !== 'AWC_ICDS' && code !== 'ICDS') return 0;
    return organizationsByBlock.filter((o) => (o.type || '').toUpperCase() === 'AWC').length;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const agricultureInstitutionCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'AGRICULTURE') return {} as Record<string, number>;
    const acc: Record<string, number> = {};
    for (const org of organizationsByBlock) {
      const k = normalizeAgricultureInstitutionKey(
        (org.sub_department as string) || (org.attributes?.sub_department as string) || '',
      );
      if (!k) continue;
      acc[k] = (acc[k] ?? 0) + 1;
    }
    return acc;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const irrigationCategoryCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'IRRIGATION') return {} as Record<string, number>;
    const acc: Record<string, number> = {};
    for (const org of organizationsByBlock) {
      const cat = ((org.attributes?.category as string) || '').trim().toUpperCase();
      if (!cat) continue;
      acc[cat] = (acc[cat] ?? 0) + 1;
    }
    return acc;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const minorIrrigationCategoryCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'MINOR_IRRIGATION') return {} as Record<string, number>;
    const acc: Record<string, number> = {};
    for (const org of organizationsByBlock) {
      const key = normalizeMinorIrrigationCategoryType(org.attributes?.category_type as string);
      if (!key) continue;
      acc[key] = (acc[key] ?? 0) + 1;
    }
    return acc;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const revenueTahasilLegendCount = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'REVENUE_LAND') return 0;
    return organizationsByBlock.filter((o) => (o.sub_department || '').toUpperCase() === 'TAHASIL_OFFICE').length;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const arcsJurisdictionCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'ARCS') return {} as Record<string, number>;
    const acc: Record<string, number> = { RURAL: 0, URBAN: 0 };
    for (const org of organizationsByBlock) {
      const jt = ((org.attributes?.jurisdiction_type as string) || '').toUpperCase();
      if (jt === 'RURAL' || jt === 'URBAN') acc[jt] += 1;
    }
    return acc;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const electricityInstitutionCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'ELECTRICITY') {
      return { byType: {} as Record<string, number>, emptyInstType: 0 };
    }
    const byType: Record<string, number> = {};
    let emptyInstType = 0;
    for (const org of organizationsByBlock) {
      const raw = ((org.attributes?.institution_type as string) || '').trim();
      if (!raw) {
        emptyInstType += 1;
        continue;
      }
      const key = raw.toUpperCase();
      byType[key] = (byType[key] ?? 0) + 1;
    }
    return { byType, emptyInstType };
  }, [organizationsByBlock, selectedDepartmentCode]);

  const watcoStationCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'WATCO_RWSS') return {} as Record<string, number>;
    const acc: Record<string, number> = {};
    for (const t of WATCO_SUB_DEPARTMENTS) acc[t] = 0;
    for (const org of organizationsByBlock) {
      const subDepartment = normalizeWatcoLegendType(org.sub_department as string);
      if (subDepartment) acc[subDepartment] += 1;
    }
    return acc;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const healthCategoryLegendCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'HEALTH') return {} as Record<string, number>;
    const acc: Record<string, number> = {};
    for (const org of organizationsByBlock) {
      const cat = ((org.attributes?.category as string) || '').toUpperCase();
      if (!cat) continue;
      acc[cat] = (acc[cat] ?? 0) + 1;
    }
    return acc;
  }, [organizationsByBlock, selectedDepartmentCode]);

  const drainKindCounts = useMemo(() => {
    const acc: Record<DrainLineKind, number> = { MAIN: 0, BRANCH: 0 };
    for (const drain of drains) {
      const name = drain.properties?.name ?? drain.properties?.drainName ?? 'Drain';
      const kind = drain.properties?.drainLineKind ?? getDrainLineKind(name);
      acc[kind] += 1;
    }
    return acc;
  }, [drains]);

  const roadsByBlock = useMemo(() => {
    const normalizedSelectedBlock = normalizeConstituencyBlock(selectedBlockFilter);
    if (!normalizedSelectedBlock || normalizedSelectedBlock === 'ALL') return roads;
    return roads.filter((road) => {
      const normalizedRoadBlock = normalizeConstituencyBlock(road.properties?.block);
      return normalizedRoadBlock === normalizedSelectedBlock;
    });
  }, [roads, selectedBlockFilter]);

  const roadGpWardOptions = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'ROADS') {
      return [{ value: 'ALL', label: t('map.filter.allGpWard', language) }];
    }
    const selectedBlockKey = normalizeConstituencyBlock(selectedBlockFilter);
    const sourceRoads =
      selectedBlockKey && selectedBlockKey !== 'ALL'
        ? roadsByBlock
        : roads;
    const manualGpWards =
      selectedBlockKey && selectedBlockKey !== 'ALL'
        ? (ROAD_MANUAL_GP_WARDS_BY_BLOCK[selectedBlockKey] ?? [])
        : Object.values(ROAD_MANUAL_GP_WARDS_BY_BLOCK).flat();
    const deduped = buildDedupedRoadFilterOptions([
      ...sourceRoads.map((road) => String(road.properties?.gpWard ?? '')),
      ...manualGpWards,
    ]);
    return [{ value: 'ALL', label: t('map.filter.allGpWard', language) }, ...deduped];
  }, [selectedDepartmentCode, language, roads, roadsByBlock, selectedBlockFilter]);

  useEffect(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'ROADS') return;
    if (selectedGpWardFilter === 'ALL') return;
    const exists = roadGpWardOptions.some((option) => option.value === selectedGpWardFilter);
    if (!exists) {
      const normalized = normalizeRoadLocationKey(selectedGpWardFilter);
      const match = roadGpWardOptions.find((o) => o.value === normalized);
      setSelectedGpWardFilter(match ? match.value : 'ALL');
    }
  }, [selectedDepartmentCode, selectedGpWardFilter, roadGpWardOptions]);

  const roadsByBlockAndGpWard = useMemo(() => {
    if (selectedGpWardFilter === 'ALL') return roadsByBlock;
    const filterKey = normalizeRoadLocationKey(selectedGpWardFilter);
    return roadsByBlock.filter(
      (road) => normalizeRoadLocationKey(String(road.properties?.gpWard ?? '')) === filterKey,
    );
  }, [roadsByBlock, selectedGpWardFilter]);

  /** Road orgs for legend GP count (summary listing; many have no map geometry). */
  const roadOrganizationsScoped = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'ROADS') return [] as MapOrganization[];
    if (selectedGpWardFilter === 'ALL') return organizationsByBlock;
    const filterKey = normalizeRoadLocationKey(selectedGpWardFilter);
    return organizationsByBlock.filter((org) => {
      const attrs = (org.attributes ?? {}) as Record<string, unknown>;
      const gp = String(attrs.gp_ward ?? attrs.gpward ?? attrs.gp_ward_name ?? '');
      return normalizeRoadLocationKey(gp) === filterKey;
    });
  }, [selectedDepartmentCode, organizationsByBlock, selectedGpWardFilter]);

  const summaryOnlyRoadCounts = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'ROADS') {
      return { GP: 0, MUNICIPALITY: 0 };
    }
    let gp = 0;
    let municipality = 0;
    for (const org of roadOrganizationsScoped) {
      const attrs = (org.attributes ?? {}) as Record<string, unknown>;
      const sector = attrs.road_sector;
      if (isGpRoadSector(sector)) gp += 1;
      else if (isMunicipalityRoadSector(sector)) municipality += 1;
    }
    return { GP: gp, MUNICIPALITY: municipality };
  }, [selectedDepartmentCode, roadOrganizationsScoped]);

  const roadLegendTypes = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'ROADS') return [] as string[];
    const types = new Set(
      roadsByBlockAndGpWard
        .map((road) =>
          normalizeRoadLegendSector(
            road.properties?.roadSector as string,
            road.properties?.code as string,
          ),
        )
        .filter((v) => v.length > 0 && v !== 'GP' && v !== 'MUNICIPALITY'),
    );
    if (summaryOnlyRoadCounts.GP > 0) types.add('GP');
    if (summaryOnlyRoadCounts.MUNICIPALITY > 0) types.add('MUNICIPALITY');
    return Array.from(types).sort();
  }, [roadsByBlockAndGpWard, selectedDepartmentCode, summaryOnlyRoadCounts]);

  const roadTypeCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const road of roadsByBlockAndGpWard) {
      const type = normalizeRoadLegendSector(
        road.properties?.roadSector as string,
        road.properties?.code as string,
      );
      if (!type || type === 'GP' || type === 'MUNICIPALITY') continue;
      acc[type] = (acc[type] ?? 0) + 1;
    }
    if (summaryOnlyRoadCounts.GP > 0) acc.GP = summaryOnlyRoadCounts.GP;
    if (summaryOnlyRoadCounts.MUNICIPALITY > 0) {
      acc.MUNICIPALITY = summaryOnlyRoadCounts.MUNICIPALITY;
    }
    return acc;
  }, [roadsByBlockAndGpWard, summaryOnlyRoadCounts]);

  const isRoadsDept = selectedDepartmentCode?.toUpperCase() === 'ROADS';
  const isDrainageDept = selectedDepartmentCode?.toUpperCase() === 'DRAINAGE';
  const showBlockFilter = !!selectedDepartmentCode && !isDrainageDept;
  /**
   * Remount map when: switching polylines vs pins, or changing road/drain legend filter.
   * @react-google-maps/api often leaves Polylines on the map when filtered out via conditional render.
   */
  const googleMapLayerKey = isRoadsDept
    ? `roads-${selectedBlockFilter}-${selectedGpWardFilter}-${roadLegendFilterType ?? 'all'}`
    : isDrainageDept
      ? `drainage-${drainKindFilter ?? 'all'}`
      : 'orgs';

  const preserveMapCameraForRemount = useCallback(() => {
    if (!mapInstance) return;
    const c = mapInstance.getCenter?.();
    const z = mapInstance.getZoom?.();
    if (c && typeof z === 'number' && Number.isFinite(z)) {
      mapCameraPreserveRef.current = { center: { lat: c.lat(), lng: c.lng() }, zoom: z };
    }
  }, [mapInstance]);

  useEffect(() => {
    setLegendFilterType(null);
    setRoadLegendFilterType(null);
    setDrainKindFilter(null);
    setSelectedBlockFilter('ALL');
    setSelectedGpWardFilter('ALL');
    setIsFilterModalOpen(false);
    setIsMobileBlockDropdownOpen(false);
    setIsMobileGpWardDropdownOpen(false);
    setSelectedRoad(null);
    setSelectedDrain(null);
    mapCameraPreserveRef.current = null;
  }, [selectedDepartmentCode]);

  useEffect(() => {
    if (!isRoadsDept) return;
    preserveMapCameraForRemount();
    setSelectedRoad(null);
  }, [isRoadsDept, selectedBlockFilter, selectedGpWardFilter, preserveMapCameraForRemount]);

  useEffect(() => {
    if (!selectedDepartmentCode || !initialLegendFilterType) return;
    const applyKey = `${selectedDepartmentCode.toUpperCase()}::${initialLegendFilterType}`;
    if (lastAppliedInitialLegendRef.current === applyKey && legendFilterType === initialLegendFilterType) {
      return;
    }
    setLegendFilterType(initialLegendFilterType);
    lastAppliedInitialLegendRef.current = applyKey;
  }, [selectedDepartmentCode, initialLegendFilterType, legendFilterType]);

  /** Road path as Google Maps LatLng[] (GeoJSON is [lng, lat]) */
  const roadPaths = useMemo(
    () =>
      roadsByBlockAndGpWard.map((f) => {
        const coords = f.geometry?.coordinates ?? [];
        return coords.map(([lng, lat]) => ({ lat, lng }));
      }),
    [roadsByBlockAndGpWard]
  );

  const selectedRoadStreetViewPosition = useMemo(() => {
    if (!selectedRoad) return null;
    const coords = selectedRoad.geometry?.coordinates ?? [];
    if (!coords.length) return null;
    const mid = coords[Math.floor(coords.length / 2)];
    if (!mid) return null;
    const [lng, lat] = mid;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, [selectedRoad]);

  const selectedRoadStreetInfo = useMemo(() => {
    if (!selectedRoad) return null;
    const props = selectedRoad.properties ?? {};
    const coords = selectedRoad.geometry?.coordinates ?? [];
    const name = String(props.name ?? props.roadName ?? 'Road');
    const code = String(props.code ?? '');
    const block = String(props.block ?? '');
    const gpWard = String(props.gpWard ?? '');
    const sector = String(props.roadSector ?? '');
    const year =
      typeof props.yearOfConstruction === 'number' && Number.isFinite(props.yearOfConstruction)
        ? String(props.yearOfConstruction)
        : '';
    const pointAName = String(props.pointAName ?? '').trim();
    const pointBName = String(props.pointBName ?? '').trim();
    const inferredPair = (() => {
      const match = name.match(/^\s*(.+?)\s+to\s+(.+?)\s*$/i);
      if (!match) return null;
      return { a: match[1].trim(), b: match[2].trim() };
    })();
    const start = coords[0];
    const end = coords.length ? coords[coords.length - 1] : undefined;
    const pointA =
      pointAName ||
      inferredPair?.a ||
      (start ? `${start[1].toFixed(5)}, ${start[0].toFixed(5)}` : 'Requested from Road Dept');
    const pointB =
      pointBName ||
      inferredPair?.b ||
      (end ? `${end[1].toFixed(5)}, ${end[0].toFixed(5)}` : 'Requested from Road Dept');

    const providedLength =
      typeof props.lengthKm === 'number' && Number.isFinite(props.lengthKm) ? props.lengthKm : null;
    const computedLength =
      coords.length > 1
        ? coords.slice(1).reduce((sum, c, i) => sum + haversineKm(coords[i], c), 0)
        : null;
    const lengthKm = providedLength ?? computedLength;

    return {
      name,
      code,
      block,
      gpWard,
      sector,
      year,
      pointA,
      pointB,
      lengthKm: lengthKm != null ? lengthKm.toFixed(2) : 'N/A',
      pointsCount: coords.length,
      type: String(props.roadSector ?? '').trim(),
      nameOfDivision: String(props.nameOfDivision ?? '').trim(),
      scheme: String(props.scheme ?? '').trim(),
      lastMaintenanceDate: String(props.lastMaintenanceDate ?? '').trim(),
      issues: String(props.issues ?? '').trim(),
      remarks: String(props.remarks ?? '').trim(),
    };
  }, [selectedRoad]);

  const streetViewEmbedUrl = useMemo(() => {
    if (!streetViewPosition) return '';
    const { lat, lng } = streetViewPosition;
    return `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed`;
  }, [streetViewPosition]);

  /** Drain path as Google Maps LatLng[] (GeoJSON is [lng, lat]) */
  const drainPaths = useMemo(
    () =>
      drains.map((f) => {
        const coords = f.geometry?.coordinates ?? [];
        return coords.map(([lng, lat]) => ({ lat, lng }));
      }),
    [drains]
  );

  /** Restrict map to Gopalpur constituency (Rangeilunda, Kukudakhandi, Berhampur Urban-I) only; hide Google's default POIs so only our org pins show */
  const mapOptions = useMemo(
    () => ({
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
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: true,
      fullscreenControl: false,
      streetViewControl: false,
      rotateControl: false,
      minZoom: 11,
      maxZoom: 18,
    }),
    []
  );

  const getIconUrl = useCallback(
    (type: string, attributes?: Record<string, any> | null, subDept?: string | null) => {
      const code = selectedDepartmentCode?.toUpperCase();
      if (!code) return MARKER_COLORS.red;

      // EDUCATION – match legend colors exactly
      if (code === 'EDUCATION') {
        const sub = (subDept || '').toUpperCase();
        const color = EDUCATION_SUB_DEPT_DOT_COLORS[sub] ?? '#ea4335';
        return createCircleMarkerSvgIcon(color);
      }

      // HEALTH – match legend colors exactly
      if (code === 'HEALTH') {
        const category = ((attributes?.category as string) || type || '').toUpperCase();
        const color =
          category === 'HOSPITAL' ? '#ea4335' :
            category === 'CHC' ? '#1967d2' :
              category === 'PHC' ? '#fbbc04' :
                category === 'SC' ? '#34a853' :
                  category === 'UAAM' ? '#ff9800' :
                    category === 'UPHC' ? '#9c27b0' :
                      category === 'HEALTH_CENTRE' ? '#1967d2' :
                        '#34a853';
        return createCircleMarkerSvgIcon(color);
      }

      // AGRICULTURE – two types with distinct colors (match legend)
      if (code === 'AGRICULTURE') {
        const sub = normalizeAgricultureInstitutionKey(
          (subDept || attributes?.sub_department || '') as string,
        );
        const color =
          sub === 'AGRICULTURE SERVICE CENTER'
            ? '#059669' // emerald-600
            : sub === 'AGRICULTURE EXTENSION CENTER'
              ? '#f59e0b' // amber-500
              : '#059669';
        return createCircleMarkerSvgIcon(color);
      }

      // ELECTRICITY – single yellow color, matching legend
      if (code === 'ELECTRICITY') {
        return createCircleMarkerSvgIcon('#facc15'); // tailwind yellow-400
      }

      // ARCS (cooperative societies) – teal pins
      if (code === 'ARCS') {
        return createCircleMarkerSvgIcon('#14b8a6'); // teal-500
      }

      // REVENUE LAND – Tahasil (sky); parcel color by land type (legend)
      if (code === 'REVENUE_LAND') {
        const sub = (subDept || '').toUpperCase();
        if (sub === 'TAHASIL_OFFICE') {
          return createCircleMarkerSvgIcon('#0ea5e9');
        }
        const lt = ((attributes?.land_type as string) || '').toUpperCase();
        const parcelColor =
          lt === 'PRIVATE' ? '#7c3aed' : lt === 'OTHER' ? '#64748b' : '#e11d48';
        return createCircleMarkerSvgIcon(parcelColor);
      }

      // MINOR IRRIGATION – marker color by category/type (legend)
      if (code === 'MINOR_IRRIGATION') {
        const cat = normalizeMinorIrrigationCategoryType(attributes?.category_type as string);
        const hex = IRRIGATION_CATEGORY_MARKER_COLORS[cat] || '#059669';
        return createCircleMarkerSvgIcon(hex);
      }

      // ICDS / AWC – single pink color, matching legend
      if (code === 'AWC_ICDS' || code === 'ICDS' || type === 'AWC') {
        return createCircleMarkerSvgIcon('#ec4899');
      }

      if (code === 'WATCO_RWSS') {
        const subDepartment = normalizeWatcoLegendType(subDept);
        const color = subDepartment ? WATCO_MARKER_HEX[subDepartment] : '#0ea5e9';
        return createCircleMarkerSvgIcon(color);
      }

      // Other departments – fall back to per-dept PNG icon if configured,
      // otherwise a generic teal pin.
      if (DEPARTMENT_MARKER_ICONS[code]) {
        return DEPARTMENT_MARKER_ICONS[code];
      }

      return createCircleMarkerSvgIcon('#0f766e');
    },
    [selectedDepartmentCode]
  );

  const getTypeLabel = useCallback(
    (type: string, lang: 'en' | 'or' = language, attributes?: Record<string, any> | null, subDept?: string | null) => {
      if (type === 'AWC') return t('map.awc.label', lang);
      const code = selectedDepartmentCode?.toUpperCase();
      if (code === 'EDUCATION') {
        const sub = subDept?.toUpperCase();
        const subKey = sub ? EDUCATION_SUB_DEPT_KEYS[sub] : null;
        if (subKey) return t(subKey, lang);
        const eduKey = EDUCATION_TYPE_KEYS[type];
        return eduKey ? t(eduKey, lang) : EDUCATION_TYPE_LABELS[type] || type.replace(/_/g, ' ');
      }
      if (code === 'HEALTH') {
        const category = (attributes?.category as string)?.toUpperCase();
        const key = category ? HEALTH_TYPE_KEYS[category] : HEALTH_TYPE_KEYS[type];
        return key ? t(key, lang) : category || type.replace(/_/g, ' ');
      }
      if (code === 'ELECTRICITY') {
        const instType = ((attributes?.institution_type as string) || '').trim();
        const upper = instType.toUpperCase();
        if (upper === 'GOVT' || upper === 'GOVERNMENT') {
          return t('electricity.type.govt', lang);
        }
        if (upper === 'PVT' || upper === 'PRIVATE') {
          return t('electricity.type.pvt', lang);
        }
        if (instType.length > 0) return instType;
        return t('map.electricity.office', lang);
      }
      if (code === 'AGRICULTURE') {
        const sub = normalizeAgricultureInstitutionKey(
          (subDept as string) || (attributes?.sub_department as string) || '',
        );
        if (sub.length > 0) return agricultureInstitutionLegendLabel(sub, lang);
        return type.replace(/_/g, ' ');
      }
      if (code === 'ARCS') {
        const j = ((attributes?.jurisdiction_type as string) || '').toUpperCase();
        if (j === 'RURAL') return t('arcs.type.rural', lang);
        if (j === 'URBAN') return t('arcs.type.urban', lang);
        if (j === 'MIXED') return t('arcs.type.mixed', lang);
        return t('map.arcs.society', lang);
      }
      if (code === 'REVENUE_LAND') {
        if ((subDept || '').toUpperCase() === 'TAHASIL_OFFICE') {
          return t('map.revenue.legend.tahasil', lang);
        }
        return lang === 'or' ? 'ଜମି ପାର୍ସେଲ୍' : 'Land parcel';
      }
      if (code === 'WATCO_RWSS') {
        const value = normalizeWatcoLegendType(subDept);
        if (value) return t(WATCO_LEGEND_LABEL_KEYS[value], lang);
      }
      const eduKey = EDUCATION_TYPE_KEYS[type];
      return eduKey ? t(eduKey, lang) : EDUCATION_TYPE_LABELS[type] || type.replace(/_/g, ' ');
    },
    [selectedDepartmentCode, language]
  );

  const filteredOrgs = useMemo(
    () => {
      const term = searchTerm.trim().toLowerCase();
      let result = orgsWithLocation;

      // Legend type filtering
      if (legendFilterType) {
        const code = selectedDepartmentCode?.toUpperCase();
        if (code === 'HEALTH') {
          result = result.filter(
            (org) => (org.attributes?.category as string)?.toUpperCase() === legendFilterType,
          );
        } else if (code === 'EDUCATION') {
          result = result.filter(
            (org) => (org.sub_department || '').toUpperCase() === legendFilterType,
          );
        } else if (code === 'AGRICULTURE') {
          result = result.filter((org) => {
            const subDept = normalizeAgricultureInstitutionKey(
              (org.sub_department as string) || (org.attributes?.sub_department as string) || '',
            );
            return subDept === legendFilterType;
          });
        } else if (code === 'IRRIGATION') {
          result = result.filter((org) => {
            const category = ((org.attributes?.category as string) || '').toUpperCase();
            return category === legendFilterType;
          });
        } else if (code === 'MINOR_IRRIGATION') {
          result = result.filter((org) => {
            const catType = normalizeMinorIrrigationCategoryType(
              org.attributes?.category_type as string,
            );
            return catType === legendFilterType;
          });
        } else if (code === 'REVENUE_LAND') {
          result = result.filter((org) => {
            if (legendFilterType === 'TAHASIL_OFFICE') {
              return (org.sub_department || '').toUpperCase() === 'TAHASIL_OFFICE';
            }
            return true;
          });
        } else if (code === 'ELECTRICITY') {
          result = result.filter((org) => {
            const instType =
              ((org.attributes?.institution_type as string) || '').toUpperCase();
            return instType === legendFilterType;
          });
        } else if (code === 'ARCS') {
          result = result.filter((org) => {
            const jt =
              ((org.attributes?.jurisdiction_type as string) || '').toUpperCase();
            return jt === legendFilterType;
          });
        } else if (code === 'WATCO_RWSS') {
          result = result.filter(
            (org) => normalizeWatcoLegendType(org.sub_department as string) === legendFilterType,
          );
        } else {
          result = result.filter((org) => org.type === legendFilterType);
        }
      }

      if (!term) return result;
      return result.filter((org) => {
        const name = (org.name || '').toLowerCase();
        const address = (org.address || '').toLowerCase();
        const typeLabel = getTypeLabel(org.type, language, org.attributes, org.sub_department).toLowerCase();
        const attributesText = org.attributes
          ? Object.values(org.attributes)
            .filter((v) => v != null)
            .join(' ')
            .toLowerCase()
          : '';
        return (
          name.includes(term) ||
          address.includes(term) ||
          typeLabel.includes(term) ||
          attributesText.includes(term)
        );
      });
    },
    [orgsWithLocation, searchTerm, getTypeLabel, language, legendFilterType, selectedDepartmentCode]
  );

  // When user applies a legend filter, auto-zoom/pan to show matching markers.
  useEffect(() => {
    if (!legendFilterType) return;
    if (!mapInstance) return;
    if (!filteredOrgs || filteredOrgs.length === 0) return;
    if (typeof window === 'undefined' || !(window as any).google?.maps) return;

    const points = filteredOrgs.filter(
      (o): o is MapOrganization & { latitude: number; longitude: number } =>
        typeof o.latitude === 'number' && typeof o.longitude === 'number',
    );
    if (points.length === 0) return;

    // Close any open info windows so the camera move feels intentional.
    setInfoWindowOrg(null);
    setSelectedRoad(null);

    if (points.length === 1) {
      const p = points[0];
      mapInstance.panTo({ lat: p.latitude, lng: p.longitude });
      if (typeof mapInstance.setZoom === 'function') {
        mapInstance.setZoom(15);
      }
      return;
    }

    const bounds = new (window as any).google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
    if (typeof mapInstance.fitBounds === 'function') {
      mapInstance.fitBounds(bounds, { top: 70, right: 40, bottom: 110, left: 40 });
    }
  }, [legendFilterType, filteredOrgs, mapInstance]);

  const orgsToShow = filteredOrgs;

  const searchSuggestions = useMemo(
    () => {
      const base = searchTerm.trim() ? filteredOrgs : orgsWithLocation;
      return base;
    },
    [filteredOrgs, orgsWithLocation, searchTerm]
  );

  const filteredRoads = useMemo(() => {
    if (!isRoadsDept) return [] as RoadFeature[];
    const term = searchTerm.trim().toLowerCase();
    return roadsByBlockAndGpWard.filter((road) => {
      const name = String(road.properties?.name ?? road.properties?.roadName ?? '').toLowerCase();
      const code = String(road.properties?.code ?? '').toLowerCase();
      const block = String(road.properties?.block ?? '').toLowerCase();
      const scheme = String(road.properties?.scheme ?? '').toLowerCase();
      const roadType = normalizeRoadLegendSector(
        String(road.properties?.roadSector ?? ''),
        String(road.properties?.code ?? ''),
      );
      if (roadLegendFilterType != null && roadType !== roadLegendFilterType) return false;
      if (!term) return true;
      return (
        name.includes(term) ||
        code.includes(term) ||
        block.includes(term) ||
        scheme.includes(term) ||
        roadType.toLowerCase().includes(term)
      );
    });
  }, [isRoadsDept, roadsByBlockAndGpWard, searchTerm, roadLegendFilterType]);

  const filteredDrains = useMemo(() => {
    if (!isDrainageDept) return [] as DrainFeature[];
    const term = searchTerm.trim().toLowerCase();
    return drains.filter((drain) => {
      const displayName = drain.properties?.name ?? drain.properties?.drainName ?? 'Drain';
      const name = String(displayName).toLowerCase();
      const project = String(drain.properties?.project ?? '').toLowerCase();
      const remarks = String(drain.properties?.remarks ?? '').toLowerCase();
      const block = String(drain.properties?.block ?? '').toLowerCase();
      const lineKind = drain.properties?.drainLineKind ?? getDrainLineKind(displayName);
      if (drainKindFilter != null && lineKind !== drainKindFilter) return false;
      if (!term) return true;
      return (
        name.includes(term) ||
        project.includes(term) ||
        remarks.includes(term) ||
        block.includes(term)
      );
    });
  }, [isDrainageDept, drains, searchTerm, drainKindFilter]);

  const focusOrganization = useCallback(
    (org: MapOrganization & { latitude: number; longitude: number }) => {
      if (!mapInstance) return;
      mapInstance.panTo({
        lat: org.latitude,
        lng: org.longitude,
      });
      if (
        typeof mapInstance.getZoom === 'function' &&
        typeof mapInstance.setZoom === 'function'
      ) {
        const currentZoom = mapInstance.getZoom() ?? DEFAULT_ZOOM;
        if (currentZoom < 15) {
          mapInstance.setZoom(15);
        }
      }
      setInfoWindowOrg(org);
      onOrganizationInfoChange?.(org.id);
    },
    [mapInstance, onOrganizationInfoChange]
  );

  const focusRoad = useCallback(
    (road: RoadFeature) => {
      if (!mapInstance) return;
      const coords = road.geometry?.coordinates ?? [];
      if (!coords.length) return;
      const mid = coords[Math.floor(coords.length / 2)] ?? coords[0];
      if (!mid) return;
      const [lng, lat] = mid;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      mapInstance.panTo({ lat, lng });
      if (
        typeof mapInstance.getZoom === 'function' &&
        typeof mapInstance.setZoom === 'function'
      ) {
        const currentZoom = mapInstance.getZoom() ?? DEFAULT_ZOOM;
        if (currentZoom < 14) mapInstance.setZoom(14);
      }
      setSelectedRoad(road);
      setSelectedDrain(null);
      setInfoWindowOrg(null);
      const roadName = String(road.properties?.name ?? road.properties?.roadName ?? '').trim();
      onRoadSelectionChange?.(road.properties?.organizationId ?? null, roadName || null);
      onRoadStreetViewOpenChange?.(false, road.properties?.organizationId ?? null, roadName || null);
    },
    [mapInstance, onRoadSelectionChange, onRoadStreetViewOpenChange]
  );

  const focusDrain = useCallback(
    (drain: DrainFeature) => {
      if (!mapInstance) return;
      const coords = drain.geometry?.coordinates ?? [];
      if (!coords.length) return;
      const mid = coords[Math.floor(coords.length / 2)] ?? coords[0];
      if (!mid) return;
      const [lng, lat] = mid;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      mapInstance.panTo({ lat, lng });
      if (
        typeof mapInstance.getZoom === 'function' &&
        typeof mapInstance.setZoom === 'function'
      ) {
        const currentZoom = mapInstance.getZoom() ?? DEFAULT_ZOOM;
        if (currentZoom < 14) mapInstance.setZoom(14);
      }
      setSelectedDrain(drain);
      setSelectedRoad(null);
      setInfoWindowOrg(null);
      onOrganizationInfoChange?.(drain.properties?.organizationId ?? null);
    },
    [mapInstance, onOrganizationInfoChange],
  );

  const openRoadStreetView = useCallback(() => {
    if (!selectedRoadStreetViewPosition) {
      setStreetViewMessage('Street View is not available for this road.');
      return;
    }
    setStreetViewMessage(null);
    setStreetViewPosition(selectedRoadStreetViewPosition);
    setIsStreetViewOpen(true);
    setIsStreetInfoOpen(false);
    const roadName = String(
      selectedRoad?.properties?.name ?? selectedRoad?.properties?.roadName ?? '',
    ).trim();
    onRoadStreetViewOpenChange?.(
      true,
      selectedRoad?.properties?.organizationId ?? null,
      roadName || null,
    );
  }, [selectedRoadStreetViewPosition, onRoadStreetViewOpenChange, selectedRoad]);

  useEffect(() => {
    if (!isStreetViewOpen || !streetViewPosition) return;
    if (typeof window === 'undefined' || !(window as any).google?.maps) return;
    const sv = new (window as any).google.maps.StreetViewService();
    sv.getPanorama(
      {
        location: streetViewPosition,
        radius: 100,
        source: (window as any).google.maps.StreetViewSource.OUTDOOR,
      },
      (data: any, status: any) => {
        if (status === (window as any).google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          const latLng = data.location.latLng;
          setStreetViewPosition({ lat: latLng.lat(), lng: latLng.lng() });
          setStreetViewMessage(null);
          return;
        }
        setStreetViewMessage('Street View imagery is unavailable near this road.');
      },
    );
  }, [isStreetViewOpen, streetViewPosition]);

  useEffect(() => {
    if (!selectedOrganizationId) {
      if (infoWindowOrg != null) setInfoWindowOrg(null);
      return;
    }
    const matchedOrg = orgsWithLocation.find((org) => org.id === selectedOrganizationId);
    if (!matchedOrg) {
      if (infoWindowOrg != null) setInfoWindowOrg(null);
      return;
    }
    if (infoWindowOrg?.id !== matchedOrg.id) {
      setInfoWindowOrg(matchedOrg);
    }
  }, [selectedOrganizationId, orgsWithLocation, infoWindowOrg]);

  useEffect(() => {
    if (!isRoadsDept) return;
    // URL road param is used for restore/share links. Do not force-clear local
    // road selection when param is temporarily absent during in-app clicks.
    if (!selectedRoadOrganizationId) {
      lastRestoredRoadOrgIdRef.current = null;
      return;
    }
    if (lastRestoredRoadOrgIdRef.current === selectedRoadOrganizationId) return;
    const matchedRoad =
      roads.find((road) => road.properties?.organizationId === selectedRoadOrganizationId) ?? null;
    if (!matchedRoad) return;
    lastRestoredRoadOrgIdRef.current = selectedRoadOrganizationId;
    setSelectedRoad(matchedRoad);
    setSelectedDrain(null);
    setInfoWindowOrg(null);
  }, [isRoadsDept, selectedRoadOrganizationId, roads, selectedRoad]);

  useEffect(() => {
    if (!isRoadsDept) return;
    if (!isRoadStreetViewOpen) {
      if (isStreetViewOpen) setIsStreetViewOpen(false);
      return;
    }
    if (!selectedRoadStreetViewPosition) return;
    setStreetViewMessage(null);
    setStreetViewPosition(selectedRoadStreetViewPosition);
    setIsStreetViewOpen(true);
    setIsStreetInfoOpen(false);
  }, [
    isRoadsDept,
    isRoadStreetViewOpen,
    selectedRoadStreetViewPosition,
    isStreetViewOpen,
  ]);

  if (!apiKey) {
    return (
      <div className="relative flex h-full min-h-[200px] w-full items-center justify-center bg-background-muted">
        <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-medium">Google Maps API key missing</p>
          <p className="mt-1 text-xs">
            Set <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in
            .env.local to show the Rangeilunda block map.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative flex h-full min-h-[200px] w-full items-center justify-center bg-background-muted">
        <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          <p className="font-medium">Map failed to load</p>
          <p className="mt-1 text-xs">{String(loadError)}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="relative flex h-full min-h-[200px] w-full items-center justify-center bg-background-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    if (isRoadsDept) {
      const exactRoad = filteredRoads.find(
        (r) => String(r.properties?.name ?? r.properties?.roadName ?? '').toLowerCase() === term
      );
      const roadToSelect = exactRoad || (filteredRoads.length === 1 ? filteredRoads[0] : null);
      if (roadToSelect) {
        focusRoad(roadToSelect);
        setShowSearchDropdown(false);
      }
      return;
    }

    if (isDrainageDept) {
      const exactDrain = filteredDrains.find(
        (d) =>
          String(d.properties?.name ?? d.properties?.drainName ?? '').toLowerCase() === term,
      );
      const drainToSelect = exactDrain || (filteredDrains.length === 1 ? filteredDrains[0] : null);
      if (drainToSelect) {
        focusDrain(drainToSelect);
        setShowSearchDropdown(false);
      }
      return;
    }

    // Only auto-select if there is exactly one match OR an exact name match
    const exactMatch = filteredOrgs.find((org) => (org.name || '').toLowerCase() === term);
    const resultToSelect = exactMatch || (filteredOrgs.length === 1 ? filteredOrgs[0] : null);

    if (resultToSelect) {
      focusOrganization(resultToSelect);
      setShowSearchDropdown(false);
    }
  };

  /** Only show markers/roads if we have a department selected, are zoomed in enough, or have a search result */
  const showContent =
    !!selectedDepartmentCode ||
    zoom >= 13 ||
    !!infoWindowOrg ||
    (searchTerm.trim() !== '' &&
      (filteredOrgs.length > 0 || filteredRoads.length > 0 || filteredDrains.length > 0));

  return (
    <div className="relative h-full w-full min-h-[400px] overflow-hidden flex flex-col">
      <style jsx global>{`
        /* Hide Google logo and terms/policy links */
        .gm-style img[src*="google_white"],
        .gm-style img[src*="google_gray"],
        .gm-style a[href*="maps.google.com"],
        .gm-style a[href*="google.com/intl/en-US_in/help/terms_maps"],
        .gm-style a[href*="google.com/help/legalnotices_maps"],
        .gm-style-cc a,
        button[title*="Report a map error"] {
          display: none !important;
        }
        /* Hide the container for copyright text but keep buttons */
        .gm-style-cc {
          display: none !important;
        }
      `}</style>
      {selectedDepartmentCode && (
        <div
          ref={searchContainerRef}
          className="pointer-events-none sm:absolute sm:top-[10px] sm:left-4 sm:right-auto z-20 flex items-center justify-start px-4 sm:px-0 w-full sm:w-auto py-2 sm:py-0"
        >
          <div className="flex w-full max-w-[calc(100vw-2rem)] items-center gap-2 sm:w-auto sm:max-w-none">
            <form
              onSubmit={handleSearchSubmit}
              className="pointer-events-auto relative flex w-full max-w-xl items-center gap-2 rounded-sm bg-white/95 px-3 py-1.5 shadow-sm ring-1 ring-slate-200"
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onClick={() => setShowSearchDropdown(true)}
                placeholder={t('map.search.placeholder', language).replace(
                  '{dept}',
                  mapSearchDeptPlaceholderLabel(selectedDepartmentCode, language),
                )}
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSearchDropdown((open) => !open)}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90"
                aria-label="Open location search"
              >
                <Search size={14} />
              </button>
              {showSearchDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg z-30 text-sm">
                  {isRoadsDept && filteredRoads.length === 0 && (
                    <div className="px-3 py-3 text-xs text-slate-500">
                      {t('map.search.noResults', language)}
                    </div>
                  )}
                  {isDrainageDept && filteredDrains.length === 0 && (
                    <div className="px-3 py-3 text-xs text-slate-500">
                      {t('map.search.noResults', language)}
                    </div>
                  )}
                  {!isRoadsDept && !isDrainageDept && searchSuggestions.length === 0 && (
                    <div className="px-3 py-3 text-xs text-slate-500">
                      {t('map.search.noResults', language)}
                    </div>
                  )}
                  {isRoadsDept && filteredRoads.map((road, idx) => {
                    const name = String(road.properties?.name ?? road.properties?.roadName ?? 'Road');
                    const code = String(road.properties?.code ?? '');
                    const block = String(road.properties?.block ?? '');
                    return (
                      <button
                        key={`road-search-${idx}-${name}-${code}`}
                        type="button"
                        onClick={() => {
                          focusRoad(road);
                          setShowSearchDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-50"
                      >
                        <div className="font-medium text-slate-900 truncate">{name}</div>
                        {(code || block) && (
                          <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                            {[code, block].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {isDrainageDept &&
                    filteredDrains.map((drain, idx) => {
                      const name = String(
                        drain.properties?.name ?? drain.properties?.drainName ?? 'Drain',
                      );
                      const project = String(drain.properties?.project ?? '').trim();
                      const lineKind =
                        drain.properties?.drainLineKind ?? getDrainLineKind(name);
                      const typeLabel =
                        lineKind === 'MAIN'
                          ? t('map.drainage.legend.mainChannel', language)
                          : t('map.drainage.legend.branchLink', language);
                      return (
                        <button
                          key={`drain-search-${drain.properties?.organizationId ?? idx}-${name}`}
                          type="button"
                          onClick={() => {
                            focusDrain(drain);
                            setShowSearchDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50"
                        >
                          <div className="font-medium text-slate-900 truncate">{name}</div>
                          {(project || typeLabel) && (
                            <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                              {[project, typeLabel].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  {!isRoadsDept && !isDrainageDept && searchSuggestions.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        focusOrganization(org as MapOrganization & { latitude: number; longitude: number });
                        setShowSearchDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="font-medium text-slate-900 truncate">{org.name}</div>
                      {(org.address || org.attributes?.ulb_block || org.attributes?.gp_name || org.attributes?.ward_village) && (
                        <div className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {org.address ||
                            [org.attributes?.ulb_block, org.attributes?.gp_name, org.attributes?.ward_village]
                              .filter((v) => v != null && String(v).trim() !== '')
                              .join(', ')}
                        </div>
                      )}
                    </button>
                  ))}
                  {searchTerm.trim() && (
                    <button
                      type="submit"
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-primary border-t border-slate-100 hover:bg-slate-50"
                    >
                      {t('map.search.submit', language)} “{searchTerm.trim()}”
                    </button>
                  )}
                </div>
              )}
            </form>
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="pointer-events-auto sm:hidden flex h-10 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm"
              aria-label="Open map filters"
            >
              <SlidersHorizontal size={14} />
              {t('map.filter.label', language)}
            </button>
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              {showBlockFilter && (
                <MapBlockFilter
                  value={selectedBlockFilter}
                  options={CONSTITUENCY_BLOCK_OPTIONS.map((o) => ({ ...o }))}
                  onChange={setSelectedBlockFilter}
                />
              )}
              {isRoadsDept && (
                <MapBlockFilter
                  value={selectedGpWardFilter}
                  options={roadGpWardOptions}
                  onChange={setSelectedGpWardFilter}
                  label="GP/Ward"
                  labelOffsetClassName="left-[74px]"
                />
              )}
            </div>
          </div>
        </div>
      )}
      {selectedDepartmentCode && isFilterModalOpen && (
        <div className="fixed inset-0 z-[120] sm:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsFilterModalOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                {t('map.filter.title', language)}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsFilterModalOpen(false);
                  setIsMobileBlockDropdownOpen(false);
                  setIsMobileGpWardDropdownOpen(false);
                }}
                className="rounded border border-slate-200 px-2 py-1 text-[11px] text-slate-600"
              >
                {t('map.filter.close', language)}
              </button>
            </div>
            {showBlockFilter && (
              <label className="mb-3 block text-xs text-slate-600">
                <span className="mb-1 block font-medium">{t('map.filter.block', language)}</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileBlockDropdownOpen((prev) => !prev);
                      setIsMobileGpWardDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <span>
                      {CONSTITUENCY_BLOCK_OPTIONS.find((o) => o.value === selectedBlockFilter)?.label ??
                        CONSTITUENCY_BLOCK_OPTIONS[0]?.label}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${isMobileBlockDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isMobileBlockDropdownOpen && (
                    <div className="mt-1 max-h-44 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg">
                      {CONSTITUENCY_BLOCK_OPTIONS.map((o) => {
                        const active = selectedBlockFilter === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => {
                              setSelectedBlockFilter(o.value);
                              setIsMobileBlockDropdownOpen(false);
                            }}
                            className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${active
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </label>
            )}
            {isRoadsDept && (
              <label className="mb-4 block text-xs text-slate-600">
                <span className="mb-1 block font-medium">GP/Ward</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileGpWardDropdownOpen((prev) => !prev);
                      setIsMobileBlockDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <span>
                      {roadGpWardOptions.find((o) => o.value === selectedGpWardFilter)?.label ??
                        roadGpWardOptions[0]?.label}
                    </span>
                    <ChevronDown size={14} className={`transition-transform ${isMobileGpWardDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isMobileGpWardDropdownOpen && (
                    <div className="mt-1 max-h-44 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg">
                      {roadGpWardOptions.map((o) => {
                        const active = selectedGpWardFilter === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => {
                              setSelectedGpWardFilter(o.value);
                              setIsMobileGpWardDropdownOpen(false);
                            }}
                            className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${active
                                ? 'bg-primary/10 font-medium text-primary'
                                : 'text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            {o.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </label>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBlockFilter('ALL');
                  setSelectedGpWardFilter('ALL');
                  setIsMobileBlockDropdownOpen(false);
                  setIsMobileGpWardDropdownOpen(false);
                }}
                className="rounded border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
              >
                {t('map.filter.reset', language)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFilterModalOpen(false);
                  setIsMobileBlockDropdownOpen(false);
                  setIsMobileGpWardDropdownOpen(false);
                }}
                className="rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
              >
                {t('map.filter.apply', language)}
              </button>
            </div>
          </div>
        </div>
      )}
      <div ref={mapWrapRef} className="flex-1 w-full relative min-h-0">
        <GoogleMap
          key={googleMapLayerKey}
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={GOPALPUR_CENTER}
          zoom={DEFAULT_ZOOM}
          options={mapOptions}
          onLoad={(map) => {
            setMapInstance(map);
            const snap = mapCameraPreserveRef.current;
            if (snap) {
              mapCameraPreserveRef.current = null;
              map.setCenter(snap.center);
              map.setZoom(snap.zoom);
              setZoom(snap.zoom);
            }
          }}
          onZoomChanged={() => {
            if (mapInstance) {
              setZoom(mapInstance.getZoom());
            }
          }}
          onClick={() => {
            setInfoWindowOrg(null);
            setSelectedRoad(null);
            setSelectedDrain(null);
            onOrganizationInfoChange?.(null);
            onRoadSelectionChange?.(null, null);
            onRoadStreetViewOpenChange?.(false, null, null);
          }}
        >
          {showContent && isRoadsDept &&
            roadsByBlockAndGpWard.map((road, idx) => {
              const path = roadPaths[idx] ?? [];
              if (path.length < 2) return null;
              const name = road.properties?.name ?? road.properties?.roadName ?? 'Road';
              const code = road.properties?.code ?? '';
              const roadType = normalizeRoadLegendSector(
                String(road.properties?.roadSector ?? ''),
                String(road.properties?.code ?? ''),
              );
              if (roadLegendFilterType != null && roadType !== roadLegendFilterType) return null;
              const color = roadLegendColor(roadType || 'OTHER');
              // Include filter in key so polylines remount when legend changes (@react-google-maps/api can leave stale overlays).
              const filterKey = roadLegendFilterType ?? 'all';
              return (
                <Polyline
                  key={`road-${filterKey}-${idx}-${name}`}
                  path={path}
                  options={{
                    strokeColor: color,
                    strokeWeight: 5,
                    strokeOpacity: 0.9,
                    clickable: true,
                  }}
                  onClick={(e) => {
                    if (e?.domEvent && 'stopPropagation' in e.domEvent && typeof e.domEvent.stopPropagation === 'function') {
                      e.domEvent.stopPropagation();
                    }
                    focusRoad(road);
                  }}
                />
              );
            })}
          {showContent && isDrainageDept &&
            drains.map((drain, idx) => {
              const path = drainPaths[idx] ?? [];
              if (path.length < 2) return null;
              const name =
                drain.properties?.name ?? drain.properties?.drainName ?? 'Drain';
              const lineKind =
                drain.properties?.drainLineKind ?? getDrainLineKind(name);
              if (drainKindFilter != null && lineKind !== drainKindFilter) return null;
              const strokeColor = DRAIN_LINE_COLORS[lineKind];
              const drainFilterKey = drainKindFilter ?? 'all';
              return (
                <Polyline
                  key={`drain-${drainFilterKey}-${idx}-${name}`}
                  path={path}
                  options={{
                    strokeColor,
                    strokeWeight: 5,
                    strokeOpacity: 0.95,
                    clickable: true,
                  }}
                  onClick={(e) => {
                    if (e?.domEvent && 'stopPropagation' in e.domEvent && typeof e.domEvent.stopPropagation === 'function') {
                      e.domEvent.stopPropagation();
                    }
                    setSelectedDrain(drain);
                    setSelectedRoad(null);
                    setInfoWindowOrg(null);
                  }}
                />
              );
            })}
          {showContent && !isRoadsDept && !isDrainageDept &&
            orgsToShow.map((org) => (
              <Marker
                key={org.id}
                position={{ lat: org.latitude, lng: org.longitude }}
                title={org.name}
                icon={getIconUrl(org.type, org.attributes, org.sub_department)}
                onClick={(e) => {
                  // Prevent map-level click from also firing (which would close the info window).
                  if (e?.domEvent && 'stopPropagation' in e.domEvent && typeof e.domEvent.stopPropagation === 'function') {
                    e.domEvent.stopPropagation();
                  }
                  setInfoWindowOrg(org);
                  setSelectedRoad(null);
                  setSelectedDrain(null);
                  onOrganizationInfoChange?.(org.id);
                }}
                cursor="pointer"
              />
            ))}
          {selectedRoad && (() => {
            const coords = selectedRoad.geometry?.coordinates ?? [];
            const first = coords[0];
            if (!first) return null;
            const [lng, lat] = first;
            const name = selectedRoad.properties?.name ?? selectedRoad.properties?.roadName ?? 'Road';
            const code = selectedRoad.properties?.code ?? '';
            const block = selectedRoad.properties?.block ?? '';
            const gpWard = String(selectedRoad.properties?.gpWard ?? '');
            const roadType = normalizeRoadLegendSector(
              String(selectedRoad.properties?.roadSector ?? ''),
              String(selectedRoad.properties?.code ?? ''),
            );
            return (
              <InfoWindow
                position={{ lat, lng }}
                onCloseClick={() => {
                  setSelectedRoad(null);
                  onRoadSelectionChange?.(null, null);
                  onRoadStreetViewOpenChange?.(false, null, null);
                }}
              >
                <MapCalloutCard
                  title={name}
                  meta={
                    code || block ? (
                      <>
                        {code ? (
                          <MapCalloutMetaRow>
                            <span className="font-semibold text-slate-700">{roadType || 'Road'}</span>
                            <span className="font-mono text-slate-600"> · {code}</span>
                          </MapCalloutMetaRow>
                        ) : null}
                        {block ? (
                          <MapCalloutMetaMuted label={`${t('map.info.block', language)}:`}>
                            {block}
                          </MapCalloutMetaMuted>
                        ) : null}
                        {gpWard ? (
                          <MapCalloutMetaMuted label="GP/Ward:">
                            {gpWard}
                          </MapCalloutMetaMuted>
                        ) : null}
                      </>
                    ) : undefined
                  }
                  action={{
                    label: 'Street View',
                    onClick: openRoadStreetView,
                  }}
                />
              </InfoWindow>
            );
          })()}
          {selectedDrain && (() => {
            const coords = selectedDrain.geometry?.coordinates ?? [];
            const first = coords[0];
            if (!first) return null;
            const [lng, lat] = first;
            const name =
              selectedDrain.properties?.name ??
              selectedDrain.properties?.drainName ??
              'Drain';
            const lineKind =
              selectedDrain.properties?.drainLineKind ?? getDrainLineKind(name);
            const typeLabel =
              lineKind === 'MAIN'
                ? t('map.drainage.legend.mainChannel', language)
                : t('map.drainage.legend.branchLink', language);
            const project = selectedDrain.properties?.project?.trim();
            const lengthKm = selectedDrain.properties?.lengthKm?.trim();
            const remarks = selectedDrain.properties?.remarks?.trim();
            return (
              <InfoWindow
                position={{ lat, lng }}
                onCloseClick={() => setSelectedDrain(null)}
              >
                <MapCalloutCard
                  title={name}
                  badge={typeLabel}
                  meta={
                    project || lengthKm || remarks ? (
                      <>
                        {project ? (
                          <MapCalloutMetaRow>
                            <span className="text-slate-500">
                              {t('map.drainage.info.project', language)}:
                            </span>{' '}
                            {project}
                          </MapCalloutMetaRow>
                        ) : null}
                        {lengthKm ? (
                          <MapCalloutMetaRow>
                            <span className="text-slate-500">
                              {t('map.drainage.info.lengthKm', language)}:
                            </span>{' '}
                            {lengthKm}
                          </MapCalloutMetaRow>
                        ) : null}
                        {remarks ? (
                          <MapCalloutMetaRow>
                            <span className="text-slate-500">
                              {t('map.drainage.info.remarks', language)}:
                            </span>{' '}
                            {remarks}
                          </MapCalloutMetaRow>
                        ) : null}
                      </>
                    ) : undefined
                  }
                />
              </InfoWindow>
            );
          })()}
          {infoWindowOrg && (
            <InfoWindow
              position={{
                lat: infoWindowOrg.latitude!,
                lng: infoWindowOrg.longitude!,
              }}
              onCloseClick={() => {
                setInfoWindowOrg(null);
                onOrganizationInfoChange?.(null);
              }}
            >
              <MapCalloutCard
                title={infoWindowOrg.name}
                badge={getTypeLabel(
                  infoWindowOrg.type,
                  language,
                  infoWindowOrg.attributes,
                  infoWindowOrg.sub_department,
                )}
                meta={
                  (infoWindowOrg.type === 'AWC' && infoWindowOrg.attributes) || infoWindowOrg.address ? (
                    <>
                      {infoWindowOrg.type === 'AWC' && infoWindowOrg.attributes ? (
                        <MapCalloutMetaRow>
                          <span className="text-slate-500">{t('map.info.sector', language)}:</span>{' '}
                          {String(infoWindowOrg.attributes.sector || '–')}
                          {(infoWindowOrg.attributes.gp_name || infoWindowOrg.attributes.ward_village) && (
                            <>
                              {' '}
                              <span className="text-slate-400">·</span>{' '}
                              <span className="text-slate-500">{t('map.info.gp', language)}:</span>{' '}
                              {String(
                                infoWindowOrg.attributes.gp_name || infoWindowOrg.attributes.ward_village,
                              )}
                            </>
                          )}
                        </MapCalloutMetaRow>
                      ) : null}
                      {infoWindowOrg.address ? (
                        <MapCalloutMetaRow className="leading-snug text-slate-600">
                          {infoWindowOrg.address}
                        </MapCalloutMetaRow>
                      ) : null}
                    </>
                  ) : undefined
                }
                action={
                  onSelectOrganization
                    ? {
                      label: t('map.viewProfile', language),
                      onClick: () => {
                        onSelectOrganization(infoWindowOrg.id);
                        setInfoWindowOrg(null);
                      },
                    }
                    : undefined
                }
              />
            </InfoWindow>
          )}
        </GoogleMap>
        <MapViewToolbar
          mapInstance={mapInstance}
          mapContainerRef={mapWrapRef}
          departmentId={selectedDepartmentId}
          departmentName={mapDepartmentLabel}
          showDepartmentInfo={!!selectedDepartmentCode}
          infoButtonLabelKey="map.deptInfo.open"
          mapLabelKey="map.controls.map"
          satelliteLabelKey="map.controls.satellite"
          fullscreenLabelKey="map.controls.fullscreen"
        />
      </div>
      {isStreetViewOpen && streetViewPosition && (
        <div className="fixed inset-0 z-[2000] bg-black">
          <button
            type="button"
            onClick={() => {
              setIsStreetViewOpen(false);
              const roadName = String(
                selectedRoad?.properties?.name ?? selectedRoad?.properties?.roadName ?? '',
              ).trim();
              onRoadStreetViewOpenChange?.(
                false,
                selectedRoad?.properties?.organizationId ?? null,
                roadName || null,
              );
            }}
            className="absolute right-[10px] top-16 z-[2010] flex h-10 w-10 items-center justify-center rounded-sm border border-black/10 bg-[#3a3d40] text-white transition-colors hover:bg-[#2f3133]"
            aria-label="Close street view"
            title="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
          {selectedRoadStreetInfo && (
            <button
              type="button"
              onClick={() => setIsStreetInfoOpen(true)}
              className="absolute left-0 top-20 z-[2010] flex h-10 w-10 items-center justify-center rounded-r-md border border-white/20 bg-black/65 text-white transition-colors hover:bg-black/75"
              aria-label="Open road information"
              title="Road information"
            >
              <Info size={16} strokeWidth={2.4} />
            </button>
          )}
          {streetViewMessage ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-white">
              {streetViewMessage}
            </div>
          ) : (
            <>
              <iframe
                title="Road street view"
                src={streetViewEmbedUrl}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              {selectedRoadStreetInfo && isStreetInfoOpen && (
                <div className="absolute left-0 top-20 z-[2020] w-[min(360px,calc(100vw-0.5rem))] max-h-[calc(100vh-7.5rem)] overflow-y-auto rounded-r-md border border-white/15 bg-black/70 p-3 text-white shadow-lg backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{selectedRoadStreetInfo.name}</h3>
                    <button
                      type="button"
                      onClick={() => setIsStreetInfoOpen(false)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-white/20 bg-white/10 text-white hover:bg-white/20"
                      aria-label="Close road information"
                      title="Close"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-[11px] leading-4 text-white/90">
                    <p><span className="font-semibold">Starting point:</span> {selectedRoadStreetInfo.pointA}</p>
                    <p><span className="font-semibold">Ending point:</span> {selectedRoadStreetInfo.pointB}</p>
                    <p><span className="font-semibold">Total distance:</span> {selectedRoadStreetInfo.lengthKm} km</p>
                    <p><span className="font-semibold">Type of road:</span> {selectedRoadStreetInfo.type || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">Name of division:</span> {selectedRoadStreetInfo.nameOfDivision || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">Scheme:</span> {selectedRoadStreetInfo.scheme || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">Year of construction:</span> {selectedRoadStreetInfo.year || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">Road code:</span> {selectedRoadStreetInfo.code || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">Block:</span> {selectedRoadStreetInfo.block || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">GP/Ward:</span> {selectedRoadStreetInfo.gpWard || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">Last maintenance:</span> {selectedRoadStreetInfo.lastMaintenanceDate || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">Issues observed:</span> {selectedRoadStreetInfo.issues || 'Requested from Road Dept'}</p>
                    <p><span className="font-semibold">Remarks:</span> {selectedRoadStreetInfo.remarks || 'Requested from Road Dept'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'EDUCATION' && (
        <MapLegendPanel className="md:max-w-[300px]">
          {Object.keys(EDUCATION_SUB_DEPT_LABELS).map((type) => {
            const isSelected = legendFilterType === type;
            const labelText = t(EDUCATION_SUB_DEPT_KEYS[type] as MessageKey, language);
            return (
              <MapLegendRow
                key={type}
                dotColor={EDUCATION_SUB_DEPT_DOT_COLORS[type] ?? '#ea4335'}
                label={labelText}
                count={educationSubDeptCounts[type] ?? 0}
                isSelected={isSelected}
                onClick={() => setLegendFilterType((prev) => (prev === type ? null : type))}
                title={
                  isSelected
                    ? t('map.legend.showAll', language)
                    : `${t('map.legend.showOnly', language)} ${labelText}`
                }
              />
            );
          })}
        </MapLegendPanel>
      )}
      {(selectedDepartmentCode?.toUpperCase() === 'AWC_ICDS' ||
        selectedDepartmentCode?.toUpperCase() === 'ICDS') && (
          <MapLegendPanel className="md:max-w-[200px]">
            <MapLegendRow
              dotColor="#ec4899"
              label={t('map.awc.label', language)}
              count={awcIcdsLegendCount}
              isSelected={legendFilterType === 'AWC'}
              onClick={() => setLegendFilterType((prev) => (prev === 'AWC' ? null : 'AWC'))}
              dotClassName="h-2.5 w-2.5"
              title={
                legendFilterType === 'AWC'
                  ? t('map.legend.showAll', language)
                  : `${t('map.legend.showOnly', language)} ${t('map.awc.label', language)}`
              }
            />
          </MapLegendPanel>
        )}
      {selectedDepartmentCode?.toUpperCase() === 'AGRICULTURE' &&
        agricultureInstitutionLegendTypes.length > 0 && (
          <MapLegendPanel className="pointer-events-auto z-[45] md:max-w-[280px]">
            {agricultureInstitutionLegendTypes.map((instKey) => {
              const isSelected = legendFilterType === instKey;
              const label = agricultureInstitutionLegendLabel(instKey, language);
              const dotColor =
                instKey === 'AGRICULTURE SERVICE CENTER'
                  ? '#059669'
                  : instKey === 'AGRICULTURE EXTENSION CENTER'
                    ? '#f59e0b'
                    : '#059669';
              return (
                <MapLegendRow
                  key={instKey}
                  dotColor={dotColor}
                  label={label}
                  count={agricultureInstitutionCounts[instKey] ?? 0}
                  isSelected={isSelected}
                  onClick={() => setLegendFilterType((prev) => (prev === instKey ? null : instKey))}
                  title={
                    isSelected
                      ? t('map.legend.showAll', language)
                      : `${t('map.legend.showOnly', language)} ${label}`
                  }
                />
              );
            })}
          </MapLegendPanel>
        )}
      {selectedDepartmentCode?.toUpperCase() === 'IRRIGATION' && (
        <MapLegendPanel className="md:max-w-[260px]">
          {irrigationLegendTypes.map((type) => {
            const value = type.toUpperCase();
            const isSelected = legendFilterType === value;
            const label = translateIrrigationCategory(type, language);
            return (
              <MapLegendRow
                key={type}
                dotColor="#0284c7"
                label={label}
                count={irrigationCategoryCounts[value] ?? 0}
                isSelected={isSelected}
                onClick={() => setLegendFilterType((prev) => (prev === value ? null : value))}
                dotClassName="h-2.5 w-2.5"
                title={
                  isSelected
                    ? t('map.legend.showAll', language)
                    : `${t('map.legend.showOnly', language)} ${label}`
                }
              />
            );
          })}
        </MapLegendPanel>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'MINOR_IRRIGATION' &&
        minorIrrigationLegendTypes.length > 0 && (
          <MapLegendPanel className="md:max-w-[260px]">
            {minorIrrigationLegendTypes.map((cat) => {
              const value = cat;
              const isSelected = legendFilterType === value;
              const label = translateIrrigationCategory(cat, language);
              const dotColor = IRRIGATION_CATEGORY_MARKER_COLORS[cat] ?? '#059669';
              return (
                <MapLegendRow
                  key={cat}
                  dotColor={dotColor}
                  label={label}
                  count={minorIrrigationCategoryCounts[cat] ?? 0}
                  isSelected={isSelected}
                  onClick={() => setLegendFilterType((prev) => (prev === value ? null : value))}
                  title={
                    isSelected
                      ? t('map.legend.showAll', language)
                      : `${t('map.legend.showOnly', language)} ${label}`
                  }
                />
              );
            })}
          </MapLegendPanel>
        )}
      {selectedDepartmentCode?.toUpperCase() === 'REVENUE_LAND' && (
        <MapLegendPanel className="md:max-w-[220px]">
          <MapLegendRow
            dotColor="#0ea5e9"
            label={t('map.revenue.legend.tahasil', language)}
            count={revenueTahasilLegendCount}
            isSelected={legendFilterType === 'TAHASIL_OFFICE'}
            onClick={() =>
              setLegendFilterType((prev) => (prev === 'TAHASIL_OFFICE' ? null : 'TAHASIL_OFFICE'))
            }
            title={
              legendFilterType === 'TAHASIL_OFFICE'
                ? t('map.legend.showAll', language)
                : `${t('map.legend.showOnly', language)} ${t('map.revenue.legend.tahasil', language)}`
            }
          />
        </MapLegendPanel>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'ARCS' && (
        <MapLegendPanel className="md:max-w-[280px]">
          {(['RURAL'] as const).map((jur) => {
            const isSelected = legendFilterType === jur;
            const rowLabel = t('arcs.type.rural', language);
            return (
              <MapLegendRow
                key={jur}
                dotColor="#14b8a6"
                label={rowLabel}
                count={arcsJurisdictionCounts[jur] ?? 0}
                isSelected={isSelected}
                onClick={() => setLegendFilterType((prev) => (prev === jur ? null : jur))}
                dotClassName="h-2.5 w-2.5"
                title={
                  isSelected
                    ? t('map.legend.showAll', language)
                    : `${t('map.legend.showOnly', language)} ${rowLabel}`
                }
              />
            );
          })}
        </MapLegendPanel>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'ELECTRICITY' && (
        <MapLegendPanel className="md:max-w-[260px]">
          {(() => {
            const types = electricityLegendTypes;

            if (types.length === 0) {
              const fallbackKey = ELECTRICITY_TYPE_LABEL.toUpperCase();
              const isSelected = legendFilterType === fallbackKey;
              const officeLabel = t('map.electricity.office', language);
              return (
                <MapLegendRow
                  key="electricity-fallback"
                  dotColor="#facc15"
                  label={officeLabel}
                  count={electricityInstitutionCounts.emptyInstType}
                  isSelected={isSelected}
                  onClick={() =>
                    setLegendFilterType((prev) => (prev === fallbackKey ? null : fallbackKey))
                  }
                  dotClassName="h-2.5 w-2.5"
                  title={
                    isSelected
                      ? t('map.legend.showAll', language)
                      : `${t('map.legend.showOnly', language)} ${officeLabel}`
                  }
                />
              );
            }

            return types.map((type) => {
              const value = type.toUpperCase();
              const isSelected = legendFilterType === value;
              const labelKey =
                value === 'GOVT' || value === 'GOVERNMENT'
                  ? ('electricity.type.govt' as MessageKey)
                  : value === 'PVT' || value === 'PRIVATE'
                    ? ('electricity.type.pvt' as MessageKey)
                    : null;
              const label = labelKey ? t(labelKey, language) : type;
              return (
                <MapLegendRow
                  key={type}
                  dotColor="#facc15"
                  label={label}
                  count={electricityInstitutionCounts.byType[value] ?? 0}
                  isSelected={isSelected}
                  onClick={() => setLegendFilterType((prev) => (prev === value ? null : value))}
                  dotClassName="h-2.5 w-2.5"
                  title={
                    isSelected
                      ? t('map.legend.showAll', language)
                      : `${t('map.legend.showOnly', language)} ${label}`
                  }
                />
              );
            });
          })()}
        </MapLegendPanel>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'WATCO_RWSS' && (
        <MapLegendPanel className="md:max-w-[260px]">
          {WATCO_SUB_DEPARTMENTS.map((type) => {
            const value = type;
            const isSelected = legendFilterType === value;
            const label = t(WATCO_LEGEND_LABEL_KEYS[type], language);
            return (
              <MapLegendRow
                key={type}
                dotColor={WATCO_MARKER_HEX[type]}
                label={label}
                count={watcoStationCounts[value] ?? 0}
                isSelected={isSelected}
                onClick={() => setLegendFilterType((prev) => (prev === value ? null : value))}
                title={
                  isSelected
                    ? t('map.legend.showAll', language)
                    : `${t('map.legend.showOnly', language)} ${label}`
                }
              />
            );
          })}
        </MapLegendPanel>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'HEALTH' && (
        <MapLegendPanel className="md:max-w-[200px]">
          {Object.entries(HEALTH_TYPE_LABELS)
            .filter(([type]) => !['HOSPITAL', 'HEALTH_CENTRE', 'OTHER'].includes(type))
            .map(([type]) => {
              const isSelected = legendFilterType === type;
              const dotColor =
                type === 'HOSPITAL'
                  ? '#ea4335'
                  : type === 'CHC'
                    ? '#1967d2'
                    : type === 'PHC'
                      ? '#fbbc04'
                      : type === 'SC'
                        ? '#34a853'
                        : type === 'UAAM'
                          ? '#ff9800'
                          : type === 'UPHC'
                            ? '#9c27b0'
                            : type === 'HEALTH_CENTRE'
                              ? '#1967d2'
                              : '#34a853';
              return (
                <MapLegendRow
                  key={type}
                  dotColor={dotColor}
                  label={getTypeLabel(type, language)}
                  count={healthCategoryLegendCounts[type] ?? 0}
                  isSelected={isSelected}
                  onClick={() => setLegendFilterType((prev) => (prev === type ? null : type))}
                  title={
                    isSelected
                      ? t('map.legend.showAll', language)
                      : `${t('map.legend.showOnly', language)} ${getTypeLabel(type, language)}`
                  }
                />
              );
            })}
        </MapLegendPanel>
      )}
      {isDrainageDept && drains.length > 0 && (
        <MapLegendPanel className="md:max-w-[260px]">
          {(['MAIN', 'BRANCH'] as const).map((kind) => {
            const isSelected = drainKindFilter === kind;
            const label =
              kind === 'MAIN'
                ? t('map.drainage.legend.mainChannel', language)
                : t('map.drainage.legend.branchLink', language);
            return (
              <MapLegendRow
                key={kind}
                dotColor={DRAIN_LINE_COLORS[kind]}
                label={label}
                count={drainKindCounts[kind]}
                isSelected={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  preserveMapCameraForRemount();
                  setSelectedDrain(null);
                  setDrainKindFilter((prev) => (prev === kind ? null : kind));
                }}
                title={
                  isSelected
                    ? t('map.legend.showAll', language)
                    : `${t('map.legend.showOnly', language)} ${label}`
                }
              />
            );
          })}
        </MapLegendPanel>
      )}
      {isRoadsDept &&
        (roadsByBlockAndGpWard.length > 0 ||
          summaryOnlyRoadCounts.GP > 0 ||
          summaryOnlyRoadCounts.MUNICIPALITY > 0) &&
        roadLegendTypes.length > 0 && (
        <MapLegendPanel className="pointer-events-auto z-[45] md:max-w-[220px]">
          {roadLegendTypes.map((type) => {
            const isSelected = roadLegendFilterType === type;
            const label = roadLegendLabel(type, language);
            return (
              <MapLegendRow
                key={type}
                dotColor={roadLegendColor(type)}
                label={label}
                count={roadTypeCounts[type] ?? 0}
                isSelected={isSelected}
                roundedRect
                onClick={(e) => {
                  e.stopPropagation();
                  preserveMapCameraForRemount();
                  setSelectedRoad(null);
                  setRoadLegendFilterType((prev) => (prev === type ? null : type));
                }}
                title={
                  isSelected ? t('map.legend.showAll', language) : `${t('map.legend.showOnly', language)} ${label}`
                }
              />
            );
          })}
        </MapLegendPanel>
      )}
    </div>
  );
}

