/**
 * Map configuration for Gopalpur Assembly constituency (Rangeilunda, Kukudakhandi, Berhampur Urban-I).
 * Map is restricted to the overall constituency area (not the entire world).
 */

/** Approximate center of Gopalpur constituency (covering Rangeilunda, Kukudakhandi, Berhampur Urban-I) */
export const GOPALPUR_CENTER = { lat: 19.28, lng: 84.86 };

/** Bounds to restrict the map to the Gopalpur constituency (SW and NE corners) */
export const GOPALPUR_BOUNDS = {
  south: 19.18,
  west: 84.75,
  north: 19.40,
  east: 84.98,
};

/** Default zoom level so the block fills the map */
export const DEFAULT_ZOOM = 12;

/** Google Maps colored marker icons (standard mapfiles) */
const PIN_BASE = 'https://maps.google.com/mapfiles/ms/icons';
export const MARKER_COLORS = {
  red: `${PIN_BASE}/red-dot.png`,
  blue: `${PIN_BASE}/blue-dot.png`,
  green: `${PIN_BASE}/green-dot.png`,
  orange: `${PIN_BASE}/orange-dot.png`,
  purple: `${PIN_BASE}/purple-dot.png`,
  yellow: `${PIN_BASE}/yellow-dot.png`,
} as const;

/**
 * Education organization types (backend enum) → marker icon URL.
 * Different icons so Primary, Upper Primary, High School, etc. are distinguishable on the map.
 */
export const EDUCATION_MARKER_ICONS: Record<string, string> = {
  PRIMARY_SCHOOL: MARKER_COLORS.red,
  UPPER_PRIMARY_SCHOOL: MARKER_COLORS.blue,
  HIGH_SCHOOL: MARKER_COLORS.green,
  HIGHER_SECONDARY: MARKER_COLORS.orange,
  COLLEGE: MARKER_COLORS.purple,
  UNIVERSITY: MARKER_COLORS.yellow,
};

/** Human-readable labels for Education types (for tooltips/legend) */
export const EDUCATION_TYPE_LABELS: Record<string, string> = {
  PRIMARY_SCHOOL: 'Primary School',
  UPPER_PRIMARY_SCHOOL: 'Upper Primary School',
  HIGH_SCHOOL: 'High School',
  HIGHER_SECONDARY: 'Higher Secondary',
  COLLEGE: 'College',
  UNIVERSITY: 'University',
};

/** Single marker for AWC (ICDS) – Anganwadi Centres */
export const AWC_MARKER_ICON = `${PIN_BASE}/pink-dot.png`;

/** Label for AWC org type */
export const AWC_TYPE_LABEL = 'Anganwadi Centre (AWC)';

/** Health organization types → marker icon (reuse pin colors) */
export const HEALTH_MARKER_ICONS: Record<string, string> = {
  HOSPITAL: MARKER_COLORS.red,
  HEALTH_CENTRE: MARKER_COLORS.blue,
  OTHER: MARKER_COLORS.green,
};

/** Human-readable labels for Health types */
export const HEALTH_TYPE_LABELS: Record<string, string> = {
  HOSPITAL: 'Hospital',
  HEALTH_CENTRE: 'Health Centre',
  OTHER: 'Other',
};
