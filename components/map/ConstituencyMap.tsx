'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline,
  Polygon,
} from '@react-google-maps/api';
import { Search } from 'lucide-react';
import {
  GOPALPUR_BOUNDS,
  GOPALPUR_CENTER,
  GOPALPUR_BORDER,
  DEFAULT_ZOOM,
  EDUCATION_MARKER_ICONS,
  EDUCATION_TYPE_LABELS,
  EDUCATION_SUB_DEPT_LABELS,
  EDUCATION_SUB_DEPT_MARKERS,
  AWC_MARKER_ICON,
  MARKER_COLORS,
  HEALTH_MARKER_ICONS,
  DEPARTMENT_MARKER_ICONS,
  HEALTH_TYPE_LABELS,
  getRoadType,
  ROAD_TYPE_COLORS,
  ROAD_TYPE_LABELS,
  ELECTRICITY_MARKER_ICON,
  ELECTRICITY_TYPE_LABEL,
  getDrainLineKind,
  DRAIN_LINE_COLORS,
  IRRIGATION_CATEGORY_MARKER_COLORS,
  MINOR_IRRIGATION_LEGEND_ORDER,
} from '../../lib/mapConfig';
import type { DrainLineKind, RoadTypeKey } from '../../lib/mapConfig';
import type { MessageKey } from '../i18n/messages';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import { MapLegendPanel, MapLegendRow } from './MapLegend';

const EDUCATION_TYPE_KEYS: Record<string, MessageKey> = {
  PRIMARY_SCHOOL: 'map.edu.primarySchool',
  UPPER_PRIMARY_SCHOOL: 'map.edu.upperPrimarySchool',
  HIGH_SCHOOL: 'map.edu.highSchool',
  HIGHER_SECONDARY: 'map.edu.higherSecondary',
  COLLEGE: 'map.edu.college',
  UNIVERSITY: 'map.edu.university',
};
const EDUCATION_SUB_DEPT_KEYS: Record<string, MessageKey> = {
  SCHOOL: 'map.edu.sub.school',
  ENGINEERING_COLLEGE: 'map.edu.sub.engineeringCollege',
  ITI: 'map.edu.sub.iti',
  UNIVERSITY: 'map.edu.sub.university',
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

const WATCO_STATION_TYPES = [
  'MEGA ESR',
  'EXISTING ESR',
  'IBPS PUMP HOUSE',
  'INTAKE WELL',
  'PRODUCTION WELL',
] as const;

const ROAD_TYPE_LABEL_KEYS: Record<RoadTypeKey, MessageKey> = {
  NH: 'roads.type.nh',
  PWD: 'roads.type.pwd',
  RD: 'roads.type.rd',
  OTHER: 'roads.type.other',
};

const WATCO_TYPE_LABEL_KEYS: Record<(typeof WATCO_STATION_TYPES)[number], MessageKey> = {
  'MEGA ESR': 'watco.type.megaEsr',
  'EXISTING ESR': 'watco.type.existingEsr',
  'IBPS PUMP HOUSE': 'watco.type.ibpsPumpHouse',
  'INTAKE WELL': 'watco.type.intakeWell',
  'PRODUCTION WELL': 'watco.type.productionWell',
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
  properties: { name?: string; roadName?: string; code?: string; block?: string };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

/** Drain segment from GeoJSON (point A to B path) for Drainage department map */
export interface DrainFeature {
  type: 'Feature';
  properties: { name?: string; drainName?: string; code?: string; block?: string };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

interface ConstituencyMapProps {
  /** Department code (e.g. 'EDUCATION', 'ROADS') */
  selectedDepartmentCode?: string;
  /** Organizations to show as pins (only those with lat/lng are displayed) */
  organizations?: MapOrganization[];
  /** Road segments to show as polylines when department is ROADS */
  roads?: RoadFeature[];
  /** Drain segments to show as polylines when department is DRAINAGE */
  drains?: DrainFeature[];
  /** Called when user clicks a marker (e.g. to show profile) */
  onSelectOrganization?: (id: number) => void;
}

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

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
  selectedDepartmentCode,
  organizations = [],
  roads = [],
  drains = [],
  onSelectOrganization,
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
  const [roadLegendFilterType, setRoadLegendFilterType] = useState<RoadTypeKey | null>(null);
  /** When set, only show drain polylines of this kind (Drainage legend). */
  const [drainKindFilter, setDrainKindFilter] = useState<DrainLineKind | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
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

  /** Only organizations with valid coordinates */
  const orgsWithLocation = useMemo(
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

  const minorIrrigationLegendTypes = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'MINOR_IRRIGATION') return [];
    const fromData = Array.from(
      new Set(
        orgsWithLocation
          .map((o) => normalizeMinorIrrigationCategoryType(o.attributes?.category_type as string))
          .filter((t) => t.length > 0),
      ),
    );
    const order = MINOR_IRRIGATION_LEGEND_ORDER as readonly string[];
    const ordered = order.filter((c) => fromData.includes(c));
    const extras = fromData.filter((c) => !order.includes(c)).sort();
    return [...ordered, ...extras];
  }, [orgsWithLocation, selectedDepartmentCode]);

  const agricultureInstitutionLegendTypes = useMemo(() => {
    if (selectedDepartmentCode?.toUpperCase() !== 'AGRICULTURE') return [];
    const fromData = Array.from(
      new Set(
        orgsWithLocation
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
  }, [orgsWithLocation, selectedDepartmentCode]);

  const isRoadsDept = selectedDepartmentCode?.toUpperCase() === 'ROADS';
  const isDrainageDept = selectedDepartmentCode?.toUpperCase() === 'DRAINAGE';
  /**
   * Remount map when: switching polylines vs pins, or changing road/drain legend filter.
   * @react-google-maps/api often leaves Polylines on the map when filtered out via conditional render.
   */
  const googleMapLayerKey = isRoadsDept
    ? `roads-${roadLegendFilterType ?? 'all'}`
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
    setSelectedRoad(null);
    setSelectedDrain(null);
    mapCameraPreserveRef.current = null;
  }, [selectedDepartmentCode]);

  /** Road path as Google Maps LatLng[] (GeoJSON is [lng, lat]) */
  const roadPaths = useMemo(
    () =>
      roads.map((f) => {
        const coords = f.geometry?.coordinates ?? [];
        return coords.map(([lng, lat]) => ({ lat, lng }));
      }),
    [roads]
  );

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
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: 3, // google.maps.ControlPosition.TOP_RIGHT
      },
      scaleControl: true,
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: 3,
      },
      streetViewControl: false,
      rotateControl: true,
      rotateControlOptions: {
        position: 3, // TOP_RIGHT
      },
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
        const color =
          sub === 'SCHOOL' ? '#ea4335' :
            sub === 'ENGINEERING_COLLEGE' ? '#1967d2' :
              sub === 'ITI' ? '#34a853' :
                sub === 'UNIVERSITY' ? '#fbbc04' :
                  sub === 'DIPLOMA_COLLEGE' ? '#9c27b0' :
                    '#ea4335';
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
            (org) =>
              ((org.attributes?.station_type as string) || '').toUpperCase() ===
              legendFilterType,
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
    },
    [mapInstance]
  );

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
    (searchTerm.trim() !== '' && filteredOrgs.length > 0);

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
                {searchSuggestions.length === 0 && (
                  <div className="px-3 py-3 text-xs text-slate-500">
                    {t('map.search.noResults', language)}
                  </div>
                )}
                {searchSuggestions.map((org) => (
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
        </div>
      )}
      <div className="flex-1 w-full relative">
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
          }}
        >
          <Polyline
            path={GOPALPUR_BORDER}
            options={{
              strokeColor: '#ef4444', // red-500
              strokeOpacity: 0,
              icons: [
                {
                  icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 3,
                    strokeWeight: 2,
                  },
                  offset: '0',
                  repeat: '20px',
                },
              ],
              clickable: false,
            }}
          />
          {showContent && isRoadsDept &&
            roads.map((road, idx) => {
              const path = roadPaths[idx] ?? [];
              if (path.length < 2) return null;
              const name = road.properties?.name ?? road.properties?.roadName ?? 'Road';
              const code = road.properties?.code ?? '';
              const roadType = getRoadType(name, code);
              if (roadLegendFilterType != null && roadType !== roadLegendFilterType) return null;
              const color = ROAD_TYPE_COLORS[roadType];
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
                    setSelectedRoad(road);
                    setSelectedDrain(null);
                    setInfoWindowOrg(null);
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
              const lineKind = getDrainLineKind(name);
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
            const roadType = getRoadType(name, code);
            return (
              <InfoWindow
                position={{ lat, lng }}
                onCloseClick={() => setSelectedRoad(null)}
              >
                <div className="min-w-[190px] max-w-[260px]">
                  <div className="rounded-2xl bg-white shadow-md border border-slate-200 px-3 py-0.5">
                    <p className="text-[13px] font-semibold text-slate-900">{name}</p>
                    {code && (
                      <p className="mt-0.5 text-[11px] font-medium text-slate-600">
                        {ROAD_TYPE_LABELS[roadType]} · <span className="font-mono text-[11px]">{code}</span>
                      </p>
                    )}
                    {block && (
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {t('map.info.block', language)}: {block}
                      </p>
                    )}
                  </div>
                </div>
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
            return (
              <InfoWindow
                position={{ lat, lng }}
                onCloseClick={() => setSelectedDrain(null)}
              >
                <div className="min-w-[190px] max-w-[260px]">
                  <div className="rounded-2xl bg-white shadow-md border border-slate-200 px-3 py-0.5">
                    <p className="text-[13px] font-semibold text-slate-900">{name}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {t('dept.drainage', language)}
                    </p>
                  </div>
                </div>
              </InfoWindow>
            );
          })()}
          {infoWindowOrg && (
            <InfoWindow
              position={{
                lat: infoWindowOrg.latitude!,
                lng: infoWindowOrg.longitude!,
              }}
              onCloseClick={() => setInfoWindowOrg(null)}
            >
              <div className="min-w-[190px] max-w-[260px]">
                <div className="rounded-2xl bg-white shadow-md border border-slate-200 px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-slate-900">{infoWindowOrg.name}</p>
                  <p className="mt-0.5 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                    {getTypeLabel(
                      infoWindowOrg.type,
                      language,
                      infoWindowOrg.attributes,
                      infoWindowOrg.sub_department
                    )}
                  </p>
                  {infoWindowOrg.type === 'AWC' && infoWindowOrg.attributes && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {t('map.info.sector', language)}: {String(infoWindowOrg.attributes.sector || '–')}
                      {(infoWindowOrg.attributes.gp_name || infoWindowOrg.attributes.ward_village) && (
                        <>
                          {' '}
                          · {t('map.info.gp', language)}:{' '}
                          {String(infoWindowOrg.attributes.gp_name || infoWindowOrg.attributes.ward_village)}
                        </>
                      )}
                    </p>
                  )}
                  {infoWindowOrg.address && (
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                      {infoWindowOrg.address}
                    </p>
                  )}
                  {onSelectOrganization && (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center justify-center rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm hover:bg-orange-600"
                      onClick={() => {
                        onSelectOrganization(infoWindowOrg.id);
                        setInfoWindowOrg(null);
                      }}
                    >
                      {t('map.viewProfile', language)}
                    </button>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      {selectedDepartmentCode?.toUpperCase() === 'EDUCATION' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[300px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            {Object.entries(EDUCATION_SUB_DEPT_LABELS).map(([sub, label]) => {
              const type = sub; // sub is used as filter type here
              const isSelected = legendFilterType === type;
              return (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() => setLegendFilterType((prev) => (prev === type ? null : type))}
                    className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                    title={isSelected ? t('map.legend.showAll', language) : `${t('map.legend.showOnly', language)} ${t(EDUCATION_SUB_DEPT_KEYS[type] as any, language)}`}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          type === 'SCHOOL' ? '#ea4335' :
                            type === 'ENGINEERING_COLLEGE' ? '#1967d2' :
                              type === 'ITI' ? '#34a853' :
                                type === 'UNIVERSITY' ? '#fbbc04' :
                                  type === 'DIPLOMA_COLLEGE' ? '#9c27b0' : '#ea4335',
                      }}
                    />
                    {t(EDUCATION_SUB_DEPT_KEYS[type] as any, language)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {(selectedDepartmentCode?.toUpperCase() === 'AWC_ICDS' || selectedDepartmentCode?.toUpperCase() === 'ICDS') && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[200px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            <li>
              {(() => {
                const type = 'AWC';
                const isSelected = legendFilterType === type;
                return (
                  <button
                    type="button"
                    onClick={() =>
                      setLegendFilterType((prev) => (prev === type ? null : type))
                    }
                    className={`flex items-center gap-2 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${
                      isSelected
                        ? 'ring-1 ring-slate-400 bg-slate-100 font-medium'
                        : 'hover:bg-slate-50'
                    }`}
                    title={
                      isSelected
                        ? t('map.legend.showAll', language)
                        : `${t('map.legend.showOnly', language)} ${t('map.awc.label', language)}`
                    }
                  >
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-500" />
                    {t('map.awc.label', language)}
                  </button>
                );
              })()}
            </li>
          </ul>
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'AGRICULTURE' &&
        orgsWithLocation.length > 0 &&
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
      {selectedDepartmentCode?.toUpperCase() === 'IRRIGATION' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[260px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            {Array.from(
              new Set(
                orgsWithLocation
                  .map((org) => ((org.attributes?.category as string) || '').trim())
                  .filter((v) => v.length > 0),
              ),
            ).map((type) => {
              const value = type.toUpperCase();
              const isSelected = legendFilterType === value;
              const label = translateIrrigationCategory(type, language);
              return (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() =>
                      setLegendFilterType((prev) => (prev === value ? null : value))
                    }
                    className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${
                      isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'
                    }`}
                    title={
                      isSelected
                        ? t('map.legend.showAll', language)
                        : `${t('map.legend.showOnly', language)} ${label}`
                    }
                  >
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-600" />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'MINOR_IRRIGATION' &&
        orgsWithLocation.length > 0 &&
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
      {selectedDepartmentCode?.toUpperCase() === 'REVENUE_LAND' && orgsWithLocation.length > 0 && (
        <MapLegendPanel className="md:max-w-[220px]">
          <MapLegendRow
            dotColor="#0ea5e9"
            label={t('map.revenue.legend.tahasil', language)}
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
      {selectedDepartmentCode?.toUpperCase() === 'ARCS' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[280px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            {['RURAL', 'URBAN'].map((jur) => {
              const isSelected = legendFilterType === jur;
              const labelKey =
                jur === 'RURAL' ? ('arcs.type.rural' as MessageKey) : ('arcs.type.urban' as MessageKey);
              return (
                <li key={jur}>
                  <button
                    type="button"
                    onClick={() =>
                      setLegendFilterType((prev) => (prev === jur ? null : jur))
                    }
                    className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${
                      isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'
                    }`}
                    title={
                      isSelected
                        ? t('map.legend.showAll', language)
                        : `${t('map.legend.showOnly', language)} ${t(labelKey, language)}`
                    }
                  >
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-500" />
                    {t(labelKey, language)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'ELECTRICITY' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[260px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            {(() => {
              const types = Array.from(
                new Set(
                  orgsWithLocation
                    .map(
                      (org) =>
                        ((org.attributes?.institution_type as string) || '').trim(),
                    )
                    .filter((v) => v.length > 0),
                  ),
              );

              // If no institution_type present yet, fall back to single generic entry
              if (types.length === 0) {
                const isSelected = legendFilterType === ELECTRICITY_TYPE_LABEL.toUpperCase();
                return (
                  <li>
                    <button
                      type="button"
                      onClick={() =>
                        setLegendFilterType((prev) =>
                          prev === ELECTRICITY_TYPE_LABEL.toUpperCase()
                            ? null
                            : ELECTRICITY_TYPE_LABEL.toUpperCase(),
                        )
                      }
                      className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${
                        isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'
                      }`}
                      title={
                        isSelected
                          ? t('map.legend.showAll', language)
                          : `${t('map.legend.showOnly', language)} ${t('map.electricity.office', language)}`
                      }
                    >
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      {t('map.electricity.office', language)}
                    </button>
                  </li>
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
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() =>
                        setLegendFilterType((prev) => (prev === value ? null : value))
                      }
                      className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${
                        isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'
                      }`}
                      title={
                        isSelected
                          ? t('map.legend.showAll', language)
                          : `${t('map.legend.showOnly', language)} ${label}`
                      }
                    >
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
                      {label}
                    </button>
                  </li>
                );
              });
            })()}
          </ul>
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'WATCO_RWSS' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[260px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            {WATCO_STATION_TYPES.map((type) => {
              const value = type.toUpperCase();
              const isSelected = legendFilterType === value;
              const labelKey = WATCO_TYPE_LABEL_KEYS[type];
              const label = labelKey ? t(labelKey, language) : type;
              return (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() =>
                      setLegendFilterType((prev) => (prev === value ? null : value))
                    }
                    className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'
                      }`}
                    title={
                      isSelected
                        ? t('map.legend.showAll', language)
                        : `${t('map.legend.showOnly', language)} ${label}`
                    }
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          type === 'MEGA ESR'
                            ? '#0ea5e9'
                            : type === 'EXISTING ESR'
                              ? '#22c55e'
                              : type === 'IBPS PUMP HOUSE'
                                ? '#f97316'
                                : type === 'INTAKE WELL'
                                  ? '#6366f1'
                                  : '#e11d48',
                      }}
                    />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'HEALTH' && orgsWithLocation.length > 0 && (
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
                isSelected={isSelected}
                onClick={() => {
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
      {isRoadsDept && roads.length > 0 && (
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-[45] md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[220px]">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            {(Object.entries(ROAD_TYPE_LABELS) as [RoadTypeKey, string][]).map(([type]) => {
              const isSelected = roadLegendFilterType === type;
              const labelKey = ROAD_TYPE_LABEL_KEYS[type];
              const label = labelKey ? t(labelKey, language) : ROAD_TYPE_LABELS[type];
              return (
                <li key={type}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      preserveMapCameraForRemount();
                      setSelectedRoad(null);
                      setRoadLegendFilterType((prev) => (prev === type ? null : type));
                    }}
                    className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                    title={isSelected ? t('map.legend.showAll', language) : `${t('map.legend.showOnly', language)} ${label}`}
                  >
                    <span
                      className="inline-block h-2 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: ROAD_TYPE_COLORS[type] }}
                    />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
