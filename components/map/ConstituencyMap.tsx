'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  Polyline,
} from '@react-google-maps/api';
import {
  GOPALPUR_BOUNDS,
  GOPALPUR_CENTER,
  DEFAULT_ZOOM,
  EDUCATION_MARKER_ICONS,
  EDUCATION_TYPE_LABELS,
  AWC_MARKER_ICON,
  MARKER_COLORS,
  HEALTH_MARKER_ICONS,
  HEALTH_TYPE_LABELS,
  getRoadType,
  ROAD_TYPE_COLORS,
  ROAD_TYPE_LABELS,
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
const HEALTH_TYPE_KEYS: Record<string, MessageKey> = {
  HOSPITAL: 'map.health.hospital',
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

export function ConstituencyMap({
  selectedDepartmentCode,
  organizations = [],
  roads = [],
  onSelectOrganization,
}: ConstituencyMapProps) {
  const { language } = useLanguage();
  const [infoWindowOrg, setInfoWindowOrg] = useState<MapOrganization | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadFeature | null>(null);
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
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      fullscreenControl: true,
      streetViewControl: false,
      minZoom: 11,
      maxZoom: 18,
    }),
    []
  );

  const getIconUrl = useCallback((type: string) => {
    const code = selectedDepartmentCode?.toUpperCase();
    if (code === 'EDUCATION') {
      return EDUCATION_MARKER_ICONS[type] || EDUCATION_MARKER_ICONS.PRIMARY_SCHOOL;
    }
    if (code === 'HEALTH') {
      return HEALTH_MARKER_ICONS[type] || HEALTH_MARKER_ICONS.HEALTH_CENTRE;
    }
    if (code === 'AWC_ICDS' || code === 'ICDS' || type === 'AWC') {
      return AWC_MARKER_ICON;
    }
    return MARKER_COLORS.red;
  }, [selectedDepartmentCode]);

  const getTypeLabel = useCallback(
    (type: string, lang: 'en' | 'or' = language) => {
      if (type === 'AWC') return t('map.awc.label', lang);
      const code = selectedDepartmentCode?.toUpperCase();
      if (code === 'HEALTH') {
        const key = HEALTH_TYPE_KEYS[type];
        return key ? t(key, lang) : HEALTH_TYPE_LABELS[type] || type.replace(/_/g, ' ');
      }
      const eduKey = EDUCATION_TYPE_KEYS[type];
      return eduKey ? t(eduKey, lang) : EDUCATION_TYPE_LABELS[type] || type.replace(/_/g, ' ');
    },
    [selectedDepartmentCode, language]
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

  return (
    <div className="relative h-full w-full min-h-[200px] overflow-hidden">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={GOPALPUR_CENTER}
        zoom={DEFAULT_ZOOM}
        options={mapOptions}
      >
        {isRoadsDept &&
          roads.map((road, idx) => {
            const path = roadPaths[idx] ?? [];
            if (path.length < 2) return null;
            const name = road.properties?.name ?? road.properties?.roadName ?? 'Road';
            const code = road.properties?.code ?? '';
            const roadType = getRoadType(name, code);
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
        {!isRoadsDept &&
          orgsWithLocation.map((org) => (
            <Marker
              key={org.id}
              position={{ lat: org.latitude, lng: org.longitude }}
              title={org.name}
              icon={getIconUrl(org.type)}
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
                {block && <p className="mt-1 text-xs text-gray-500">Block: {block}</p>}
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
                {getTypeLabel(infoWindowOrg.type, language)}
              </p>
              {infoWindowOrg.type === 'AWC' && infoWindowOrg.attributes && (
                <p className="mt-1 text-xs text-gray-500">
                  Sector: {String(infoWindowOrg.attributes.sector || '–')}
                  {(infoWindowOrg.attributes.gp_name || infoWindowOrg.attributes.ward_village) && (
                    <> · GP: {String(infoWindowOrg.attributes.gp_name || infoWindowOrg.attributes.ward_village)}</>
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
      {selectedDepartmentCode?.toUpperCase() === 'EDUCATION' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 rounded bg-background/95 px-2 py-1.5 text-xs shadow md:left-2 md:right-auto md:max-w-[200px]">
          <p className="font-medium text-text">{t('map.legend', language)}</p>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-text-muted">
            {Object.entries(EDUCATION_TYPE_LABELS).map(([type]) => (
              <li key={type} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      type === 'PRIMARY_SCHOOL'
                        ? '#ea4335'
                        : type === 'UPPER_PRIMARY_SCHOOL'
                          ? '#4285f4'
                          : type === 'HIGH_SCHOOL'
                            ? '#34a853'
                            : type === 'HIGHER_SECONDARY'
                              ? '#fb8c00'
                              : type === 'COLLEGE'
                                ? '#9c27b0'
                                : '#f9ab00',
                  }}
                />
                {getTypeLabel(type, language)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {(selectedDepartmentCode?.toUpperCase() === 'AWC_ICDS' || selectedDepartmentCode?.toUpperCase() === 'ICDS') && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 rounded bg-background/95 px-2 py-1.5 text-xs shadow md:left-2 md:right-auto md:max-w-[200px]">
          <p className="font-medium text-text">{t('map.legend', language)}</p>
          <p className="mt-1 flex items-center gap-1 text-text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-pink-500" />
            {t('map.awc.label', language)}
          </p>
        </div>
      )}
      {selectedDepartmentCode?.toUpperCase() === 'HEALTH' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 rounded bg-background/95 px-2 py-1.5 text-xs shadow md:left-2 md:right-auto md:max-w-[200px]">
          <p className="font-medium text-text">{t('map.legend', language)}</p>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-text-muted">
            {Object.entries(HEALTH_TYPE_LABELS).map(([type]) => (
              <li key={type} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      type === 'HOSPITAL' ? '#ea4335' : type === 'HEALTH_CENTRE' ? '#4285f4' : '#34a853',
                  }}
                />
                {getTypeLabel(type, language)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {isRoadsDept && roads.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 rounded bg-background/95 px-2 py-1.5 text-xs shadow md:left-2 md:right-auto md:max-w-[220px]">
          <p className="font-medium text-text">{t('map.legend', language)}</p>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-text-muted">
            {(Object.entries(ROAD_TYPE_LABELS) as [RoadTypeKey, string][]).map(([type]) => (
              <li key={type} className="flex items-center gap-1">
                <span
                  className="inline-block h-2 w-3 rounded-sm"
                  style={{ backgroundColor: ROAD_TYPE_COLORS[type] }}
                />
                {ROAD_TYPE_LABELS[type]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
