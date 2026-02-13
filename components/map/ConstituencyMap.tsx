'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import {
  GOPALPUR_BOUNDS,
  GOPALPUR_CENTER,
  DEFAULT_ZOOM,
  EDUCATION_MARKER_ICONS,
  EDUCATION_TYPE_LABELS,
  AWC_MARKER_ICON,
  AWC_TYPE_LABEL,
} from '../../lib/mapConfig';

export interface MapOrganization {
  id: number;
  name: string;
  type: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  attributes?: Record<string, string | number | null> | null;
}

interface ConstituencyMapProps {
  /** Department code (e.g. 'EDUCATION') – only Education is supported for now with custom icons */
  selectedDepartmentCode?: string;
  /** Organizations to show as pins (only those with lat/lng are displayed) */
  organizations?: MapOrganization[];
  /** Called when user clicks a marker (e.g. to show profile) */
  onSelectOrganization?: (id: number) => void;
}

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

export function ConstituencyMap({
  selectedDepartmentCode,
  organizations = [],
  onSelectOrganization,
}: ConstituencyMapProps) {
  const [infoWindowOrg, setInfoWindowOrg] = useState<MapOrganization | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
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
    if (selectedDepartmentCode === 'EDUCATION') {
      return EDUCATION_MARKER_ICONS[type] || EDUCATION_MARKER_ICONS.PRIMARY_SCHOOL;
    }
    if (selectedDepartmentCode === 'AWC_ICDS' || type === 'AWC') {
      return AWC_MARKER_ICON;
    }
    return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }, [selectedDepartmentCode]);

  const getTypeLabel = useCallback((type: string) => {
    if (type === 'AWC') return AWC_TYPE_LABEL;
    return EDUCATION_TYPE_LABELS[type] || type.replace(/_/g, ' ');
  }, []);

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
        {orgsWithLocation.map((org) => (
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
                {getTypeLabel(infoWindowOrg.type)}
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
                  View profile
                </button>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      {selectedDepartmentCode === 'EDUCATION' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 rounded bg-background/95 px-2 py-1.5 text-xs shadow md:left-2 md:right-auto md:max-w-[200px]">
          <p className="font-medium text-text">Legend</p>
          <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-text-muted">
            {Object.entries(EDUCATION_TYPE_LABELS).map(([type, label]) => (
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
                {label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedDepartmentCode === 'AWC_ICDS' && orgsWithLocation.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 rounded bg-background/95 px-2 py-1.5 text-xs shadow md:left-2 md:right-auto md:max-w-[200px]">
          <p className="font-medium text-text">Legend</p>
          <p className="mt-1 flex items-center gap-1 text-text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-pink-500" />
            {AWC_TYPE_LABEL}
          </p>
        </div>
      )}
    </div>
  );
}
