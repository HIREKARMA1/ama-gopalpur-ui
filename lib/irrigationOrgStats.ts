/** Organization-level irrigation summary stats (CSV, admin entry, portfolio). */

export const IRRIGATION_BASE_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE/ LOCALITY,WORK NAME,CATEGORY,TYPE OF IRRIGATION (FLOW/LIFT/SOLAR),LATITUDE,LONGITUDE,LOCATION PRECISION (METER),CATCHMENT AREA (IN SQ KM.),COMMAND AREA / AYACUT (HA.),STORAGE CAPACITY (HAM.),WATER SPREAD AREA (HA.),CANAL/ DISTRIBUTORY LENGTH (KM),DESIGN DISCHARGE (CUSECS),INFLOW SOURCE (RIVER/RAIN/STREAM/ CANAL),YEAR OF COMMISSIONING,CURRENT PHYSICAL CONDITION (GOOD/REPAIR NEEDED/CRITICAL),FUNCTIONALITY STATUS (FUNCTIONAL/PARTIAL/NON-FUNCTIONAL),MANAGED BY (PANI PANCHAYAT/DEPT/WUA),NAME OF PANI PANCHAYAT / WUA,CONTACT PERSON (PRESIDENT),CONTACT NUMBER OF PRESIDENT,CONTACT PERSON (ENGINEER),CONTACT NUMBER OF ENGINEER,LAST MAINTENANCE/DESILTING YEAR,BENEFICIARY FARMERS COUNT,BENEFICIARY HOUSEHOLDS,WATER AVAILABILITY (MONTHS/YEAR),FUNDING SCHEME (MGNREGS/STATE/CENTRAL),REMARKS/HISTORICAL BACKGROUND';

export const IRRIGATION_ORG_STATS_FIELDS = [
  {
    header: 'TOTAL PANCHAYAT COVERED',
    key: 'total_panchayat_covered',
    en: 'Total panchayat covered',
    or: 'ମୋଟ ପଞ୍ଚାୟତ ଆବୃତ',
  },
  {
    header: 'TOTAL AYACUT',
    key: 'total_ayacut',
    en: 'Total ayacut',
    or: 'ମୋଟ ଆୟାକଟ୍',
    aliases: ['total_ayacut_area'],
  },
  {
    header: 'TOTAL BENEFICIARIES',
    key: 'total_beneficiaries',
    en: 'Total beneficiaries',
    or: 'ମୋଟ ଲାଭାନ୍ବିତ',
  },
  {
    header: 'TOTAL CROPS',
    key: 'total_crops',
    en: 'Total crops',
    or: 'ମୋଟ ଫସଲ',
  },
] as const;

export function splitIrrigationCsvHeaderLine(header: string): string[] {
  return header.trim().replace(/\n$/, '').split(',').map((h) => h.trim());
}

export function getIrrigationCsvHeaders(): string[] {
  return [
    ...splitIrrigationCsvHeaderLine(IRRIGATION_BASE_CSV_HEADER),
    ...IRRIGATION_ORG_STATS_FIELDS.map((f) => f.header),
  ];
}

export const IRRIGATION_CSV_HEADER = `${getIrrigationCsvHeaders().join(',')}\n`;

export function irrigationOrgStatValue(
  profile: Record<string, unknown>,
  field: (typeof IRRIGATION_ORG_STATS_FIELDS)[number],
): unknown {
  const aliases = 'aliases' in field ? field.aliases : [];
  const keys = [field.key, ...aliases];
  for (const key of keys) {
    const value = profile[key];
    if (value != null && String(value).trim() !== '') return value;
  }
  return null;
}

export function irrigationOrgStatsForPortfolio(
  profile: Record<string, unknown>,
  language: 'en' | 'or',
): Array<{ label: string; value: unknown }> {
  return IRRIGATION_ORG_STATS_FIELDS.map((field) => ({
    label: language === 'or' ? field.or : field.en,
    value: irrigationOrgStatValue(profile, field),
  })).filter((row) => row.value != null && String(row.value).trim() !== '');
}
