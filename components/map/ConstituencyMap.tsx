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
} from '../../lib/mapConfig';
import type { RoadTypeKey } from '../../lib/mapConfig';
import type { MessageKey } from '../i18n/messages';
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';

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

interface ConstituencyMapProps {
  /** Department code (e.g. 'EDUCATION', 'ROADS') */
  selectedDepartmentCode?: string;
  /** Organizations to show as pins (only those with lat/lng are displayed) */
  organizations?: MapOrganization[];
  /** Road segments to show as polylines when department is ROADS */
  roads?: RoadFeature[];
  /** Called when user clicks a marker (e.g. to show profile) */
  onSelectOrganization?: (id: number) => void;
}

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

/** Build a circular SVG marker with a department initial in the center. */
function createDepartmentSvgIcon(deptCode: string, fillColor: string): string {
  const initial =
    deptCode === 'EDUCATION'
      ? 'E'
      : deptCode === 'HEALTH'
        ? 'H'
        : deptCode === 'AWC_ICDS' || deptCode === 'ICDS'
          ? 'A'
          : deptCode === 'ELECTRICITY'
            ? 'E'
            : deptCode === 'ROADS'
              ? 'R'
              : 'D';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="rgba(15,23,42,0.5)"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <circle cx="20" cy="16" r="10" fill="${fillColor}" />
    <circle cx="20" cy="16" r="10" fill="url(#grad)" opacity="0.9"/>
    <circle cx="20" cy="16" r="10" fill="${fillColor}" />
    <text x="20" y="20" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" font-weight="700" fill="#ffffff">
      ${initial}
    </text>
  </g>
  <path d="M20 26 L18 30 L22 30 Z" fill="${fillColor}" />
</svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function ConstituencyMap({
  selectedDepartmentCode,
  organizations = [],
  roads = [],
  onSelectOrganization,
}: ConstituencyMapProps) {
  const { language } = useLanguage();
  const [infoWindowOrg, setInfoWindowOrg] = useState<MapOrganization | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadFeature | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  /** When set, only show markers of this type (Education/Health legend click). Click again to clear. */
  const [legendFilterType, setLegendFilterType] = useState<string | null>(null);
  /** When set, only show roads of this type (Roads legend click). Click again to clear. */
  const [roadLegendFilterType, setRoadLegendFilterType] = useState<RoadTypeKey | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
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

  const isRoadsDept = selectedDepartmentCode?.toUpperCase() === 'ROADS';

  useEffect(() => {
    setLegendFilterType(null);
    setRoadLegendFilterType(null);
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
        return createDepartmentSvgIcon('EDUCATION', color);
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
        return createDepartmentSvgIcon('HEALTH', color);
      }

      // ICDS / AWC – single pink color, matching legend
      if (code === 'AWC_ICDS' || code === 'ICDS' || type === 'AWC') {
        return createDepartmentSvgIcon('AWC_ICDS', '#ec4899');
      }

      // Other departments – fall back to per-dept PNG icon if configured,
      // otherwise a generic teal pin.
      if (DEPARTMENT_MARKER_ICONS[code]) {
        return DEPARTMENT_MARKER_ICONS[code];
      }

      return createDepartmentSvgIcon(code, '#0f766e');
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
        return t('map.electricity.office', lang);
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
          result = result.filter((org) => (org.attributes?.category as string)?.toUpperCase() === legendFilterType);
        } else if (code === 'EDUCATION') {
          result = result.filter((org) => (org.sub_department || '').toUpperCase() === legendFilterType);
        } else if (code === 'ELECTRICITY') {
          // Only one electricity type at present; legend click is visual only
          // so we don't further filter markers here.
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
  const showContent = !!selectedDepartmentCode || zoom >= 13 || !!infoWindowOrg || (searchTerm.trim() !== '' && filteredOrgs.length > 0);

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
              placeholder={t('map.search.placeholder', language).replace('{dept}', selectedDepartmentCode === 'AWC_ICDS' ? 'ICDS' : selectedDepartmentCode.charAt(0).toUpperCase() + selectedDepartmentCode.slice(1).toLowerCase())}
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
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={GOPALPUR_CENTER}
          zoom={DEFAULT_ZOOM}
          options={mapOptions}
          onLoad={(map) => setMapInstance(map)}
          onZoomChanged={() => {
            if (mapInstance) {
              setZoom(mapInstance.getZoom());
            }
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
              return (
                <Polyline
                  key={`road-${idx}-${name}`}
                  path={path}
                  options={{
                    strokeColor: color,
                    strokeWeight: 5,
                    strokeOpacity: 0.9,
                    clickable: true,
                  }}
                  onClick={() => setSelectedRoad(road)}
                />
              );
            })}
          {showContent && !isRoadsDept &&
            orgsToShow.map((org) => (
              <Marker
                key={org.id}
                position={{ lat: org.latitude, lng: org.longitude }}
                title={org.name}
                icon={getIconUrl(org.type, org.attributes, org.sub_department)}
                onClick={() => {
                  setInfoWindowOrg(org);
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
                <div className="min-w-[200px] max-w-[280px] py-1">
                  <p className="font-semibold text-gray-900">{name}</p>
                  {code && <p className="text-xs text-gray-600">{ROAD_TYPE_LABELS[roadType]} · {code}</p>}
                  {block && <p className="mt-1 text-xs text-gray-500">{t('map.info.block', language)}: {block}</p>}
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
              <div className="min-w-[180px] max-w-[260px] py-1">
                <p className="font-semibold text-gray-900">{infoWindowOrg.name}</p>
                <p className="text-xs text-gray-600">
                  {getTypeLabel(infoWindowOrg.type, language, infoWindowOrg.attributes, infoWindowOrg.sub_department)}
                </p>
                {infoWindowOrg.type === 'AWC' && infoWindowOrg.attributes && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('map.info.sector', language)}: {String(infoWindowOrg.attributes.sector || '–')}
                    {(infoWindowOrg.attributes.gp_name || infoWindowOrg.attributes.ward_village) && (
                      <> · {t('map.info.gp', language)}: {String(infoWindowOrg.attributes.gp_name || infoWindowOrg.attributes.ward_village)}</>
                    )}
                  </p>
                )}
                {infoWindowOrg.address && (
                  <p className="mt-1 text-xs text-gray-500">{infoWindowOrg.address}</p>
                )}
                {onSelectOrganization && (
                  <button
                    type="button"
                    className="mt-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
                    onClick={() => {
                      onSelectOrganization(infoWindowOrg.id);
                      setInfoWindowOrg(null);
                    }}
                  >
                    {t('map.viewProfile', language)}
                  </button>
                )}
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
          <p className="flex items-center gap-2 text-slate-700">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-500" />
            {t('map.awc.label', language)}
          </p>
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'ELECTRICITY' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[220px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            <li>
              <button
                type="button"
                onClick={() =>
                  setLegendFilterType((prev) => (prev === ELECTRICITY_TYPE_LABEL ? null : ELECTRICITY_TYPE_LABEL))
                }
                className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${legendFilterType === ELECTRICITY_TYPE_LABEL
                    ? 'ring-1 ring-slate-400 bg-slate-100 font-medium'
                    : 'hover:bg-slate-50'
                  }`}
                title={
                  legendFilterType === ELECTRICITY_TYPE_LABEL
                    ? t('map.legend.showAll', language)
                    : `${t('map.legend.showOnly', language)} ${t('map.electricity.office', language)}`
                }
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400" />
                {t('map.electricity.office', language)}
              </button>
            </li>
          </ul>
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'HEALTH' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[200px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            {Object.entries(HEALTH_TYPE_LABELS)
              .filter(([type]) => !['HOSPITAL', 'HEALTH_CENTRE', 'OTHER'].includes(type))
              .map(([type]) => {
                const isSelected = legendFilterType === type;
                return (
                  <li key={type}>
                    <button
                      type="button"
                      onClick={() => setLegendFilterType((prev) => (prev === type ? null : type))}
                      className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                      title={isSelected ? t('map.legend.showAll', language) : `${t('map.legend.showOnly', language)} ${getTypeLabel(type, language)}`}
                    >
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            type === 'HOSPITAL' ? '#ea4335' :
                              type === 'CHC' ? '#1967d2' :
                                type === 'PHC' ? '#fbbc04' :
                                  type === 'SC' ? '#34a853' :
                                    type === 'UAAM' ? '#ff9800' :
                                      type === 'UPHC' ? '#9c27b0' :
                                        type === 'HEALTH_CENTRE' ? '#1967d2' : '#34a853',
                        }}
                      />
                      {getTypeLabel(type, language)}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
      {isRoadsDept && roads.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto rounded-md bg-white/95 px-3 py-2 text-xs shadow-md ring-1 ring-slate-200 md:max-w-[220px] z-10">
          <p className="font-semibold text-slate-900 mb-1">{t('map.legend', language)}</p>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-700">
            {(Object.entries(ROAD_TYPE_LABELS) as [RoadTypeKey, string][]).map(([type]) => {
              const isSelected = roadLegendFilterType === type;
              return (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() => setRoadLegendFilterType((prev) => (prev === type ? null : type))}
                    className={`flex items-center gap-1 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors ${isSelected ? 'ring-1 ring-slate-400 bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                    title={isSelected ? t('map.legend.showAll', language) : `${t('map.legend.showOnly', language)} ${ROAD_TYPE_LABELS[type]}`}
                  >
                    <span
                      className="inline-block h-2 w-3 rounded-sm shrink-0"
                      style={{ backgroundColor: ROAD_TYPE_COLORS[type] }}
                    />
                    {ROAD_TYPE_LABELS[type]}
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
