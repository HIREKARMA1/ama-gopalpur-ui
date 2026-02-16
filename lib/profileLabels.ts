/**
 * Human-readable labels for organization profile keys (minister CSV / OrganizationProfile.data).
 * Used for Education and Health template profile UI. Add new keys here when new fields are added.
 */

function titleCase(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const EDUCATION_LABELS: Record<string, string> = {
  block_ulb: 'Block / ULB',
  gp_ward: 'GP / Ward',
  village: 'Village',
  name_of_school: 'Name of School',
  school_id: 'School ID',
  esst_year: 'ESST Year',
  category: 'Category',
  class_i: 'Class I',
  class_ii: 'Class II',
  class_iii: 'Class III',
  class_iv: 'Class IV',
  class_v: 'Class V',
  class_vi: 'Class VI',
  class_vii: 'Class VII',
  class_viii: 'Class VIII',
  class_ix: 'Class IX',
  class_x: 'Class X',
  deo_name: 'DEO Name',
  deo_contact: 'DEO Contact',
  beo_name: 'BEO Name',
  beo_contact: 'BEO Contact',
  brcc_name: 'BRCC Name',
  brcc_contact: 'BRCC Contact',
  crcc_name: 'CRCC Name',
  crcc_contact: 'CRCC Contact',
  name_of_hm: 'Name of HM',
  contact_of_hm: 'Contact of HM',
  no_of_ts: 'No of TS',
  no_of_nts: 'No of NTS',
  no_of_tgp_pcm: 'No of TGP (PCM)',
  no_of_tgp_cbz: 'No of TGP (CBZ)',
  no_of_tgt_arts: 'No of TGT (Arts)',
  building_status: 'Building Status',
  no_of_rooms: 'No of Rooms',
  no_of_smart_class_rooms: 'No of Smart Class Rooms',
  science_lab: 'Science Lab',
  toilet_m: 'Toilet (M)',
  toilet_f: 'Toilet (F)',
  ramp: 'Ramp',
  meeting_hall: 'Meeting Hall',
  staff_common_room: 'Staff Common Room',
  ncc: 'NCC',
  nss: 'NSS',
  jrc: 'JRC',
  eco_club: 'Eco Club',
  library: 'Library',
  icc_head_name: 'ICC Head Name',
  icc_head_contact: 'ICC Head Contact',
  play_ground: 'Play Ground',
  cycle_stand: 'Cycle Stand',
  drinking_water_tw: 'Drinking Water (TW)',
  drinking_water_tap: 'Drinking Water (Tap)',
  drinking_water_overhead_tap: 'Drinking Water (Overhead Tap)',
  drinking_water_aquaguard: 'Drinking Water (Aquaguard)',
  latitude: 'Latitude',
  longitude: 'Longitude',
  description: 'Description',
};

const HEALTH_LABELS: Record<string, string> = {
  block_ulb: 'Block / ULB',
  gp_ward: 'GP / Ward',
  village: 'Village',
  latitude: 'Latitude',
  longitude: 'Longitude',
  name: 'Name',
  category: 'Category',
  inst_head_name: 'Inst Head Name',
  inst_head_contact: 'Inst Head Contact',
  no_of_ts: 'No of TS',
  no_of_nts: 'No of NTS',
  no_of_mo: 'No of MO',
  no_of_pharmacist: 'No of Pharmacist',
  no_of_anm: 'No of ANM',
  no_of_health_worker: 'No of Health Worker',
  no_of_pathology: 'No of Pathology',
  no_of_clerk: 'No of Clerk',
  no_of_sweeper: 'No of Sweeper',
  no_of_nw: 'No of NW',
  no_of_bed: 'No of Bed',
  no_of_icu: 'No of ICU',
  x_ray_availabilaty: 'X-Ray Availability',
  ct_scan_availability: 'CT-Scan Availability',
  availability_of_pathology_testing: 'Availability of Pathology Testing',
  description: 'Description',
};

export function getEducationProfileLabel(key: string): string {
  return EDUCATION_LABELS[key] ?? titleCase(key);
}

export function getHealthProfileLabel(key: string): string {
  return HEALTH_LABELS[key] ?? titleCase(key);
}

/** All known education keys in display order (for template when data is empty). */
export const EDUCATION_PROFILE_KEYS = Object.keys(EDUCATION_LABELS);

/** All known health keys in display order. */
export const HEALTH_PROFILE_KEYS = Object.keys(HEALTH_LABELS);
