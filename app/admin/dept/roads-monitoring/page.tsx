'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  authApi,
  organizationsApi,
  departmentsApi,
  clearToken,
  Organization,
  User,
} from '../../../../services/api';
import { SuperAdminDashboardLayout } from '../../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../../components/i18n/LanguageContext';
import { t } from '../../../../components/i18n/messages';

type RoadEntry = {
  id: number;
  name: string;
  block: string;
  roadCode: string;
  roadSector: string;
  nameOfDivision: string;
  scheme: string;
  lengthKm: string;
  pathCoordinates: string;
  startLat: string;
  startLng: string;
  endLat: string;
  endLng: string;
  pointAName: string;
  pointBName: string;
  yearOfConstruction: string;
  carriagewayWidthM: string;
  lastMaintenanceDate: string;
  trafficClass: string;
  drainageStatus: string;
  safetyFeatures: string;
  issues: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
};

type RoadCsvRow = {
  block: string;
  roadName: string;
  roadCode: string;
  roadSector: string;
  nameOfDivision: string;
  scheme: string;
  lengthKm: string;
  pathCoordinates: string;
  startLat: string;
  startLng: string;
  endLat: string;
  endLng: string;
  pointAName: string;
  pointBName: string;
  yearOfConstruction: string;
  carriagewayWidthM: string;
  lastMaintenanceDate: string;
  trafficClass: string;
  drainageStatus: string;
  safetyFeatures: string;
  issues: string;
};

const ROAD_TEMPLATE_HEADER =
  'block,ROAD NAME,ROAD CODE,ROAD SECTOR(NH/SH/PWD/RD/PS/GP),NAME OF DIVISION,SCHEME,LENGTH(IN KM),PATH COORDINATES,start_lat,start_lng,end_lat,end_lng,POINT A NAME,POINT B NAME,YEAR OF CONSTRUCTION,CARRIAGEWAY WIDTH (M),LAST MAINTENANCE DATE,TRAFFIC CLASS,DRAINAGE STATUS,SAFETY FEATURES,ISSUES OBSERVED';

const PAGE_SIZE = 20;

const toNumberOrNull = (value: string): number | null => {
  const s = value.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const parseRoadCsv = (text: string): { rows: RoadCsvRow[]; errors: string[] } => {
  const parseCsvLine = (line: string): string[] => {
    const out: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        const next = i + 1 < line.length ? line[i + 1] : '';
        if (inQuotes && next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cell.trim());
        cell = '';
      } else {
        cell += ch;
      }
    }
    out.push(cell.trim());
    return out;
  };

  const parseStartEndFromPathCoordinates = (value: string): {
    startLat: string;
    startLng: string;
    endLat: string;
    endLng: string;
  } | null => {
    const s = value.trim();
    if (!s) return null;
    const nums = (s.match(/-?\d+(?:\.\d+)?/g) || []).map((n) => Number(n));
    if (nums.length < 4) return null;

    // Common storage format in this project is "lng lat;lng lat;..."
    const startLng = nums[0];
    const startLat = nums[1];
    const endLng = nums[nums.length - 2];
    const endLat = nums[nums.length - 1];
    if (![startLat, startLng, endLat, endLng].every((n) => Number.isFinite(n))) return null;

    return {
      startLat: String(startLat),
      startLng: String(startLng),
      endLat: String(endLat),
      endLng: String(endLng),
    };
  };

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (!lines.length) return { rows: [], errors: ['CSV is empty'] };

  const normalizeHeader = (value: string): string =>
    value
      .replace(/^\uFEFF/, '')
      .trim()
      .toLowerCase()
      .replace(/[()]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const idx = (...aliases: string[]) => {
    for (const a of aliases) {
      const pos = headers.indexOf(normalizeHeader(a));
      if (pos >= 0) return pos;
    }
    return -1;
  };

  const indexes = {
    block: idx('block', 'ulb_block'),
    roadName: idx('road name', 'road_name', 'name of road', 'name'),
    roadCode: idx('road code', 'road_code', 'code'),
    roadSector: idx(
      'road sector(nh/sh/pwd/rd/ps/gp)',
      'road sector',
      'type',
    ),
    nameOfDivision: idx('name of division', 'name_of_division', 'division name', 'division'),
    scheme: idx('scheme', 'scheme_name'),
    lengthKm: idx('length(in km)', 'length in km', 'length_km', 'length'),
    pathCoordinates: idx('path coordinates', 'path_coordinates', 'coordinates'),
    startLat: idx('start_lat', 'start lat', 'start latitude', 'start_latitude'),
    startLng: idx('start_lng', 'start lng', 'start longitude', 'start_longitude'),
    endLat: idx('end_lat', 'end lat', 'end latitude', 'end_latitude'),
    endLng: idx('end_lng', 'end lng', 'end longitude', 'end_longitude'),
    pointAName: idx('point a name', 'point_a_name', 'start_point_name', 'starting_point_name'),
    pointBName: idx('point b name', 'point_b_name', 'end_point_name', 'ending_point_name'),
    yearOfConstruction: idx('year of construction', 'year_of_construction', 'construction_year'),
    carriagewayWidthM: idx('carriageway width m', 'carriageway_width_m', 'road_width_m'),
    lastMaintenanceDate: idx('last maintenance date', 'last_maintenance_date'),
    trafficClass: idx('traffic class', 'traffic_class'),
    drainageStatus: idx('drainage status', 'drainage_status'),
    safetyFeatures: idx('safety features', 'safety_features'),
    issues: idx('issues observed', 'issues', 'issues_observed'),
  };

  const requiredKeys: Array<keyof typeof indexes> = ['roadName'];
  const missingColumns = requiredKeys
    .map((k) => [k, indexes[k]] as const)
    .filter(([, value]) => value < 0)
    .map(([key]) => key);
  if (missingColumns.length) {
    return {
      rows: [],
      errors: [
        `Missing required columns: ${missingColumns.join(', ')}. Found headers: ${parseCsvLine(lines[0]).join(', ')}`,
      ],
    };
  }

  const rows: RoadCsvRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const get = (position: number) => (position < cols.length ? cols[position] : '');
    const rowNumber = i + 1;

    const roadName = get(indexes.roadName);
    const block = get(indexes.block);
    let startLat = get(indexes.startLat);
    let startLng = get(indexes.startLng);
    let endLat = get(indexes.endLat);
    let endLng = get(indexes.endLng);
    const pathCoordinates = get(indexes.pathCoordinates);

    if (!roadName) {
      errors.push(`Row ${rowNumber}: ROAD NAME is required`);
      continue;
    }

    if ((!startLat || !startLng || !endLat || !endLng) && pathCoordinates) {
      const derived = parseStartEndFromPathCoordinates(pathCoordinates);
      if (derived) {
        startLat = startLat || derived.startLat;
        startLng = startLng || derived.startLng;
        endLat = endLat || derived.endLat;
        endLng = endLng || derived.endLng;
      }
    }

    if (!startLat || !startLng || !endLat || !endLng) {
      errors.push(
        `Row ${rowNumber}: provide start/end coordinates, or a valid PATH COORDINATES value.`,
      );
      continue;
    }

    rows.push({
      block,
      roadName,
      roadCode: get(indexes.roadCode),
      roadSector: get(indexes.roadSector),
      nameOfDivision: get(indexes.nameOfDivision),
      scheme: get(indexes.scheme),
      lengthKm: get(indexes.lengthKm),
      pathCoordinates,
      startLat,
      startLng,
      endLat,
      endLng,
      pointAName: get(indexes.pointAName),
      pointBName: get(indexes.pointBName),
      yearOfConstruction: get(indexes.yearOfConstruction),
      carriagewayWidthM: get(indexes.carriagewayWidthM),
      lastMaintenanceDate: get(indexes.lastMaintenanceDate),
      trafficClass: get(indexes.trafficClass),
      drainageStatus: get(indexes.drainageStatus),
      safetyFeatures: get(indexes.safetyFeatures),
      issues: get(indexes.issues),
    });
  }

  return { rows, errors };
};

export default function RoadsMonitoringPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [me, setMe] = useState<User | null>(null);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [selectedCsvName, setSelectedCsvName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [roads, setRoads] = useState<Organization[]>([]);
  const [page, setPage] = useState(1);
  const [editingRoadId, setEditingRoadId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');

  const [block, setBlock] = useState('');
  const [roadName, setRoadName] = useState('');
  const [roadCode, setRoadCode] = useState('');
  const [roadSector, setRoadSector] = useState('');
  const [nameOfDivision, setNameOfDivision] = useState('');
  const [scheme, setScheme] = useState('');
  const [lengthKm, setLengthKm] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState('');
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  const [pointAName, setPointAName] = useState('');
  const [pointBName, setPointBName] = useState('');
  const [yearOfConstruction, setYearOfConstruction] = useState('');
  const [carriagewayWidthM, setCarriagewayWidthM] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState('');
  const [trafficClass, setTrafficClass] = useState('');
  const [drainageStatus, setDrainageStatus] = useState('');
  const [safetyFeatures, setSafetyFeatures] = useState('');
  const [issues, setIssues] = useState('');
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  const isRoads = deptCode === 'ROADS';

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, deptList] = await Promise.all([authApi.me(), departmentsApi.list()]);
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/');
          return;
        }
        setMe(user);
        const dept = user.department_id ? deptList.find((d) => d.id === user.department_id) : null;
        setDeptCode(dept?.code ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
        clearToken();
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [router]);

  useEffect(() => {
    const departmentId = me?.department_id;
    if (!departmentId || !isRoads) return;
    const loadRoads = async () => {
      try {
        const list = await organizationsApi.listByDepartment(departmentId, { skip: 0, limit: 1000 });
        setRoads(list);
      } catch {
        setRoads([]);
      }
    };
    loadRoads();
  }, [me?.department_id, isRoads, refreshTick]);

  const tableRows: RoadEntry[] = useMemo(() => {
    return roads
      .map((org) => {
        const attrs = (org.attributes ?? {}) as Record<string, unknown>;
        return {
          id: org.id,
          name: org.name,
          block: String(attrs.block ?? ''),
          roadCode: String(attrs.road_code ?? ''),
          roadSector: String(attrs.road_sector ?? ''),
          nameOfDivision: String(attrs.name_of_division ?? attrs.division_name ?? attrs.division ?? ''),
          scheme: String(attrs.scheme ?? attrs.scheme_name ?? ''),
          lengthKm: String(attrs.length_km ?? ''),
          pathCoordinates: String(attrs.path_coordinates ?? ''),
          startLat: String(attrs.start_lat ?? ''),
          startLng: String(attrs.start_lng ?? ''),
          endLat: String(attrs.end_lat ?? ''),
          endLng: String(attrs.end_lng ?? ''),
          pointAName: String(attrs.point_a_name ?? ''),
          pointBName: String(attrs.point_b_name ?? ''),
          yearOfConstruction: String(attrs.year_of_construction ?? ''),
          carriagewayWidthM: String(attrs.carriageway_width_m ?? ''),
          lastMaintenanceDate: String(attrs.last_maintenance_date ?? ''),
          trafficClass: String(attrs.traffic_class ?? ''),
          drainageStatus: String(attrs.drainage_status ?? ''),
          safetyFeatures: String(attrs.safety_features ?? ''),
          issues: String(attrs.issues ?? ''),
          latitude: org.latitude ?? null,
          longitude: org.longitude ?? null,
          updatedAt: (attrs.updated_at as string) ?? '',
        };
      })
      .sort((a, b) => {
        const da = new Date(a.updatedAt || 0).getTime();
        const db = new Date(b.updatedAt || 0).getTime();
        return db - da;
      });
  }, [roads]);

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return tableRows.filter((row) => {
      if (blockFilter && row.block !== blockFilter) return false;
      if (sectorFilter && row.roadSector !== sectorFilter) return false;
      if (!q) return true;
      const hay = [
        row.name,
        row.block,
        row.roadCode,
        row.roadSector,
        row.nameOfDivision,
        row.scheme,
        row.pointAName,
        row.pointBName,
        row.trafficClass,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [tableRows, searchText, blockFilter, sectorFilter]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const start = (pageClamped - 1) * PAGE_SIZE;
  const paginated = filteredRows.slice(start, start + PAGE_SIZE);

  const resetForm = () => {
    setBlock('');
    setRoadName('');
    setRoadCode('');
    setRoadSector('');
    setNameOfDivision('');
    setScheme('');
    setLengthKm('');
    setPathCoordinates('');
    setStartLat('');
    setStartLng('');
    setEndLat('');
    setEndLng('');
    setPointAName('');
    setPointBName('');
    setYearOfConstruction('');
    setCarriagewayWidthM('');
    setLastMaintenanceDate('');
    setTrafficClass('');
    setDrainageStatus('');
    setSafetyFeatures('');
    setIssues('');
    setEditingRoadId(null);
  };

  const buildRoadPayload = (row: RoadCsvRow) => {
    const departmentId = me?.department_id;
    if (!departmentId) throw new Error('Department not set for this user');

    const sLat = toNumberOrNull(row.startLat);
    const sLng = toNumberOrNull(row.startLng);
    const eLat = toNumberOrNull(row.endLat);
    const eLng = toNumberOrNull(row.endLng);

    const centerLat =
      sLat != null && eLat != null ? Number(((sLat + eLat) / 2).toFixed(6)) : sLat ?? eLat ?? null;
    const centerLng =
      sLng != null && eLng != null ? Number(((sLng + eLng) / 2).toFixed(6)) : sLng ?? eLng ?? null;

    return {
      department_id: departmentId,
      name: row.roadName,
      type: 'OTHER',
      latitude: centerLat,
      longitude: centerLng,
      address: row.block || undefined,
      description: row.roadSector ? `Road sector: ${row.roadSector}` : undefined,
      attributes: {
        block: row.block || null,
        road_code: row.roadCode || null,
        road_sector: row.roadSector || null,
        name_of_division: row.nameOfDivision || null,
        scheme: row.scheme || null,
        length_km: row.lengthKm || null,
        path_coordinates: row.pathCoordinates || null,
        start_lat: row.startLat || null,
        start_lng: row.startLng || null,
        end_lat: row.endLat || null,
        end_lng: row.endLng || null,
        point_a_name: row.pointAName || null,
        point_b_name: row.pointBName || null,
        year_of_construction: row.yearOfConstruction || null,
        carriageway_width_m: row.carriagewayWidthM || null,
        last_maintenance_date: row.lastMaintenanceDate || null,
        traffic_class: row.trafficClass || null,
        drainage_status: row.drainageStatus || null,
        safety_features: row.safetyFeatures || null,
        issues: row.issues || null,
        updated_at: new Date().toISOString(),
      },
    };
  };

  const createRoadOrganization = async (row: RoadCsvRow) => {
    await organizationsApi.create(buildRoadPayload(row));
  };

  const updateRoadOrganization = async (roadId: number, row: RoadCsvRow) => {
    const payload = buildRoadPayload(row);
    await organizationsApi.update(roadId, {
      name: payload.name,
      latitude: payload.latitude,
      longitude: payload.longitude,
      address: payload.address,
      description: payload.description,
      attributes: payload.attributes,
    });
  };

  const handleSingleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!roadName.trim()) {
      setError('ROAD NAME is required.');
      return;
    }
    if (!startLat.trim() || !startLng.trim() || !endLat.trim() || !endLng.trim()) {
      setError('Start and end coordinates are required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const formRow: RoadCsvRow = {
        block,
        roadName,
        roadCode,
        roadSector,
        nameOfDivision,
        scheme,
        lengthKm,
        pathCoordinates,
        startLat,
        startLng,
        endLat,
        endLng,
        pointAName,
        pointBName,
        yearOfConstruction,
        carriagewayWidthM,
        lastMaintenanceDate,
        trafficClass,
        drainageStatus,
        safetyFeatures,
        issues,
      };
      if (editingRoadId) {
        await updateRoadOrganization(editingRoadId, formRow);
      } else {
        await createRoadOrganization(formRow);
      }
      resetForm();
      setRefreshTick((v) => v + 1);
      setSuccess(editingRoadId ? 'Road updated successfully.' : 'Road added successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add road');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRoad = (row: RoadEntry) => {
    setError(null);
    setSuccess(null);
    setEditingRoadId(row.id);
    setBlock(row.block);
    setRoadName(row.name);
    setRoadCode(row.roadCode);
    setRoadSector(row.roadSector);
    setNameOfDivision(row.nameOfDivision);
    setScheme(row.scheme);
    setLengthKm(row.lengthKm);
    setPathCoordinates(row.pathCoordinates);
    setStartLat(row.startLat);
    setStartLng(row.startLng);
    setEndLat(row.endLat);
    setEndLng(row.endLng);
    setPointAName(row.pointAName);
    setPointBName(row.pointBName);
    setYearOfConstruction(row.yearOfConstruction);
    setCarriagewayWidthM(row.carriagewayWidthM);
    setLastMaintenanceDate(row.lastMaintenanceDate);
    setTrafficClass(row.trafficClass);
    setDrainageStatus(row.drainageStatus);
    setSafetyFeatures(row.safetyFeatures);
    setIssues(row.issues);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteRoad = async (row: RoadEntry) => {
    if (!window.confirm(`Delete road "${row.name}"?`)) return;
    try {
      await organizationsApi.delete(row.id);
      if (editingRoadId === row.id) resetForm();
      setRefreshTick((v) => v + 1);
      setSuccess('Road deleted successfully.');
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete road');
    }
  };

  const handleBulkUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = csvInputRef.current?.files?.[0];
    if (!file) {
      setError('Choose a CSV file first.');
      setBulkStatus('No CSV selected.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setBulkStatus('Uploading started...');
    try {
      const departmentId = me?.department_id;
      if (!departmentId) {
        setError('Department not set for this admin user.');
        setBulkStatus('Upload aborted: department not set.');
        return;
      }
      const text = await file.text();
      const { rows, errors } = parseRoadCsv(text);

      if (!rows.length) {
        setError(
          errors.length
            ? `No valid rows found. ${errors.slice(0, 3).join(' | ')}`
            : 'No valid rows found in CSV',
        );
        setBulkStatus('Upload finished: no valid rows found.');
        return;
      }

      const existing = await organizationsApi.listByDepartment(departmentId, {
        skip: 0,
        limit: 1000,
      });
      const existingKeys = new Set(
        existing.map((org) => {
          const attrs = (org.attributes ?? {}) as Record<string, unknown>;
          const code = String(attrs.road_code ?? '').trim().toUpperCase();
          const name = String(org.name ?? '').trim().toUpperCase();
          return `${name}__${code}`;
        }),
      );

      let imported = 0;
      let skippedDuplicates = 0;
      const importErrors: string[] = [...errors];

      for (let i = 0; i < rows.length; i += 1) {
        const key = `${rows[i].roadName.trim().toUpperCase()}__${rows[i].roadCode.trim().toUpperCase()}`;
        if (existingKeys.has(key)) {
          skippedDuplicates += 1;
          continue;
        }
        try {
          await createRoadOrganization(rows[i]);
          imported += 1;
          existingKeys.add(key);
        } catch (err: unknown) {
          importErrors.push(
            `Row ${i + 2}: ${err instanceof Error ? err.message : 'failed to import'}`,
          );
        }
      }

      setRefreshTick((v) => v + 1);
      setBulkStatus(
        `Upload finished. Imported ${imported}, skipped duplicates ${skippedDuplicates}, errors ${importErrors.length}.`,
      );
      setSuccess(
        `Bulk upload finished. Imported: ${imported}, Skipped duplicates: ${skippedDuplicates}, Parse/row errors: ${importErrors.length}.`,
      );
      if (importErrors.length) {
        setError(
          `Some rows failed: ${importErrors
            .slice(0, 3)
            .join(' | ')}`,
        );
      }
      if (csvInputRef.current) csvInputRef.current.value = '';
      setSelectedCsvName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bulk upload failed');
      setBulkStatus('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleImportFromMapJson = async () => {
    const departmentId = me?.department_id;
    if (!departmentId) {
      setError('Department not set for this admin user.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const existing = await organizationsApi.listByDepartment(departmentId, { skip: 0, limit: 1000 });
      const existingKeys = new Set(
        existing.map((org) => {
          const attrs = (org.attributes ?? {}) as Record<string, unknown>;
          const code = String(attrs.road_code ?? '').trim().toUpperCase();
          const name = String(org.name ?? '').trim().toUpperCase();
          return `${name}__${code}`;
        }),
      );

      const paths = [
        '/data/roads/kukudakhandi.json',
        '/data/roads/berhampur_urban.json',
        '/data/roads/rangailunda.json',
      ] as const;

      let imported = 0;
      const importErrors: string[] = [];
      for (const path of paths) {
        let fc: any = null;
        try {
          const resp = await fetch(path);
          if (!resp.ok) continue;
          fc = await resp.json();
        } catch {
          continue;
        }

        const features = Array.isArray(fc?.features) ? fc.features : [];
        for (let i = 0; i < features.length; i += 1) {
          const feature = features[i] as any;
          const p = (feature?.properties ?? {}) as Record<string, unknown>;
          const coords = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
          const first = Array.isArray(coords[0]) ? coords[0] : [];
          const last = Array.isArray(coords[coords.length - 1]) ? coords[coords.length - 1] : [];
          const roadName = String(p.roadName ?? p.name ?? '').trim();
          const roadCode = String(p.code ?? '').trim();
          const blockName = String(p.block ?? '').trim();
          if (!roadName || first.length < 2 || last.length < 2) continue;

          const key = `${roadName.toUpperCase()}__${roadCode.toUpperCase()}`;
          if (existingKeys.has(key)) continue;

          const startLng = String(first[0]);
          const startLat = String(first[1]);
          const endLng = String(last[0]);
          const endLat = String(last[1]);
          const centerLat = Number((((Number(startLat) || 0) + (Number(endLat) || 0)) / 2).toFixed(6));
          const centerLng = Number((((Number(startLng) || 0) + (Number(endLng) || 0)) / 2).toFixed(6));
          const pathCoordinates = coords
            .filter((c: unknown) => Array.isArray(c) && c.length >= 2)
            .map((c: any) => `${c[0]} ${c[1]}`)
            .join(';');

          try {
            await organizationsApi.create({
              department_id: departmentId,
              name: roadName,
              type: 'OTHER',
              latitude: centerLat,
              longitude: centerLng,
              address: blockName || undefined,
              description: p.type ? `Road sector: ${String(p.type)}` : undefined,
              attributes: {
                block: blockName || null,
                road_code: roadCode || null,
                road_sector: p.type ? String(p.type) : null,
                length_km: null,
                path_coordinates: pathCoordinates || null,
                start_lat: startLat || null,
                start_lng: startLng || null,
                end_lat: endLat || null,
                end_lng: endLng || null,
                point_a_name: null,
                point_b_name: null,
                year_of_construction: null,
                carriageway_width_m: null,
                name_of_division: p.division_name ? String(p.division_name) : null,
                scheme: p.scheme ? String(p.scheme) : null,
                last_maintenance_date: null,
                traffic_class: null,
                drainage_status: null,
                safety_features: null,
                issues: null,
                updated_at: new Date().toISOString(),
              },
            });
            imported += 1;
            existingKeys.add(key);
          } catch (err: unknown) {
            importErrors.push(
              `${roadName}: ${err instanceof Error ? err.message : 'failed to import road'}`,
            );
          }
        }
      }

      setRefreshTick((v) => v + 1);
      if (importErrors.length) {
        setError(
          `Imported ${imported} road(s). ${importErrors.length} error(s): ${importErrors.slice(0, 3).join(' | ')}`,
        );
      } else if (imported === 0) {
        setError('No new roads imported. DB already has all map roads or map files are empty.');
      } else {
        setSuccess(`Imported ${imported} roads from map JSON into DB.`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const example =
      'Rangailunda,Badakusthali to Palligumula,RR(VR)L-044,RD,Rangailunda Division,PMGSY,4.2,"84.854087 19.340684;84.852296 19.335599",19.340684,84.854087,19.335599,84.852296,Badakusthali,Palligumula,2019,5.5,2024-03-10,Arterial,Both-side drains,Signage+Markings,None';
    const blob = new Blob([`${ROAD_TEMPLATE_HEADER}\n${example}\n`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'roads_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!me && !loading) return null;
  if (!loading && !isRoads) {
    router.replace('/admin/dept');
    return null;
  }

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={loading && !me}
      panelTitle={t('login.dept.title', language)}
      sectionLabel="Roads Monitoring"
      navItems={[
        { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
      ]}
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6 pb-20">
        {error && (
          <p className="rounded border border-red-100 bg-red-50 p-2 text-xs text-red-600">{error}</p>
        )}
        {success && (
          <p className="rounded border border-green-100 bg-green-50 p-2 text-xs text-green-700">{success}</p>
        )}

        <section className="rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-4 py-3 text-white">
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              {editingRoadId ? 'Edit Road Entry' : 'Manual Road Entry'}
            </h2>
            <p className="mt-1 text-xs opacity-90">
              Add one road using your exact Road CSV fields.
            </p>
          </div>
          <form onSubmit={handleSingleAdd} className="grid gap-4 p-4 text-xs md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="font-medium text-slate-700">block</span>
              <input className="w-full rounded border px-3 py-2" value={block} onChange={(e) => setBlock(e.target.value)} />
            </label>
            <label className="space-y-1 lg:col-span-2">
              <span className="font-medium text-slate-700">ROAD NAME *</span>
              <input className="w-full rounded border px-3 py-2" value={roadName} onChange={(e) => setRoadName(e.target.value)} required />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">ROAD CODE</span>
              <input className="w-full rounded border px-3 py-2" value={roadCode} onChange={(e) => setRoadCode(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">ROAD SECTOR(NH/SH/PWD/RD/PS/GP)</span>
              <input className="w-full rounded border px-3 py-2" value={roadSector} onChange={(e) => setRoadSector(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">NAME OF DIVISION</span>
              <input className="w-full rounded border px-3 py-2" value={nameOfDivision} onChange={(e) => setNameOfDivision(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">SCHEME</span>
              <input className="w-full rounded border px-3 py-2" value={scheme} onChange={(e) => setScheme(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">LENGTH(IN KM)</span>
              <input className="w-full rounded border px-3 py-2" value={lengthKm} onChange={(e) => setLengthKm(e.target.value)} />
            </label>
            <label className="space-y-1 lg:col-span-4">
              <span className="font-medium text-slate-700">PATH COORDINATES</span>
              <input className="w-full rounded border px-3 py-2" value={pathCoordinates} onChange={(e) => setPathCoordinates(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">start_lat *</span>
              <input className="w-full rounded border px-3 py-2" value={startLat} onChange={(e) => setStartLat(e.target.value)} required />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">start_lng *</span>
              <input className="w-full rounded border px-3 py-2" value={startLng} onChange={(e) => setStartLng(e.target.value)} required />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">end_lat *</span>
              <input className="w-full rounded border px-3 py-2" value={endLat} onChange={(e) => setEndLat(e.target.value)} required />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">end_lng *</span>
              <input className="w-full rounded border px-3 py-2" value={endLng} onChange={(e) => setEndLng(e.target.value)} required />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Starting point name</span>
              <input className="w-full rounded border px-3 py-2" value={pointAName} onChange={(e) => setPointAName(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Ending point name</span>
              <input className="w-full rounded border px-3 py-2" value={pointBName} onChange={(e) => setPointBName(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Year of construction</span>
              <input className="w-full rounded border px-3 py-2" value={yearOfConstruction} onChange={(e) => setYearOfConstruction(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Carriageway width (m)</span>
              <input className="w-full rounded border px-3 py-2" value={carriagewayWidthM} onChange={(e) => setCarriagewayWidthM(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Last maintenance date</span>
              <input type="date" className="w-full rounded border px-3 py-2" value={lastMaintenanceDate} onChange={(e) => setLastMaintenanceDate(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Traffic class</span>
              <input className="w-full rounded border px-3 py-2" value={trafficClass} onChange={(e) => setTrafficClass(e.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="font-medium text-slate-700">Drainage status</span>
              <input className="w-full rounded border px-3 py-2" value={drainageStatus} onChange={(e) => setDrainageStatus(e.target.value)} />
            </label>
            <label className="space-y-1 lg:col-span-2">
              <span className="font-medium text-slate-700">Safety features</span>
              <input className="w-full rounded border px-3 py-2" value={safetyFeatures} onChange={(e) => setSafetyFeatures(e.target.value)} />
            </label>
            <label className="space-y-1 lg:col-span-2">
              <span className="font-medium text-slate-700">Issues observed</span>
              <input className="w-full rounded border px-3 py-2" value={issues} onChange={(e) => setIssues(e.target.value)} />
            </label>
            <div className="flex items-end gap-2 lg:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? (editingRoadId ? 'Updating...' : 'Adding...') : (editingRoadId ? 'Update Road' : 'Add Road')}
              </button>
              {editingRoadId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Bulk Upload Roads (CSV)</h3>
          <form onSubmit={handleBulkUpload} className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="rounded border bg-white px-3 py-2 hover:bg-slate-100"
            >
              Download Road Template
            </button>
            <label className="cursor-pointer rounded border bg-white px-3 py-2 hover:bg-slate-100">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                name="roadCsv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setSelectedCsvName(f?.name ?? '');
                  setBulkStatus(f ? `Selected: ${f.name}` : 'No CSV selected.');
                }}
              />
              Choose CSV File
            </label>
            <button
              type="submit"
              disabled={uploading || !selectedCsvName}
              className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Roads'}
            </button>
            <button
              type="button"
              onClick={handleImportFromMapJson}
              disabled={uploading}
              className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {uploading ? 'Importing...' : 'Import Existing Map JSON Roads to DB'}
            </button>
          </form>
          <p className="mt-2 text-[11px] text-slate-600">
            Selected file: {selectedCsvName || 'None'}
          </p>
          <p className="mt-1 text-[11px] text-slate-600">
            Status: {bulkStatus || 'Idle'}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Required columns: {ROAD_TEMPLATE_HEADER}
          </p>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b bg-slate-50 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              Road Records
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                placeholder="Search road / code / place / agency"
                className="rounded border px-2 py-1 min-w-[220px]"
              />
              <select
                value={blockFilter}
                onChange={(e) => {
                  setBlockFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded border px-2 py-1"
              >
                <option value="">All Blocks</option>
                {[...new Set(tableRows.map((r) => r.block).filter(Boolean))].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <select
                value={sectorFilter}
                onChange={(e) => {
                  setSectorFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded border px-2 py-1"
              >
                <option value="">All Sectors</option>
                {[...new Set(tableRows.map((r) => r.roadSector).filter(Boolean))].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {(searchText || blockFilter || sectorFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchText('');
                    setBlockFilter('');
                    setSectorFilter('');
                    setPage(1);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">ROAD NAME</th>
                  <th className="px-3 py-2 text-left">block</th>
                  <th className="px-3 py-2 text-left">ROAD CODE</th>
                  <th className="px-3 py-2 text-left">ROAD SECTOR</th>
                  <th className="px-3 py-2 text-left">NAME OF DIVISION</th>
                  <th className="px-3 py-2 text-left">SCHEME</th>
                  <th className="px-3 py-2 text-left">LENGTH(IN KM)</th>
                  <th className="px-3 py-2 text-left">start_lat</th>
                  <th className="px-3 py-2 text-left">start_lng</th>
                  <th className="px-3 py-2 text-left">end_lat</th>
                  <th className="px-3 py-2 text-left">end_lng</th>
                  <th className="px-3 py-2 text-left">Starting point</th>
                  <th className="px-3 py-2 text-left">Ending point</th>
                  <th className="px-3 py-2 text-left">Construction year</th>
                  <th className="px-3 py-2 text-left">Traffic class</th>
                  <th className="px-3 py-2 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={17} className="px-4 py-10 text-center italic text-slate-400">
                      No road records found.
                    </td>
                  </tr>
                )}
                {paginated.map((row, idx) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="px-3 py-2">{start + idx + 1}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{row.name || '—'}</td>
                    <td className="px-3 py-2">{row.block || '—'}</td>
                    <td className="px-3 py-2">{row.roadCode || '—'}</td>
                    <td className="px-3 py-2">{row.roadSector || '—'}</td>
                    <td className="px-3 py-2">{row.nameOfDivision || '—'}</td>
                    <td className="px-3 py-2">{row.scheme || '—'}</td>
                    <td className="px-3 py-2">{row.lengthKm || '—'}</td>
                    <td className="px-3 py-2">{row.startLat || '—'}</td>
                    <td className="px-3 py-2">{row.startLng || '—'}</td>
                    <td className="px-3 py-2">{row.endLat || '—'}</td>
                    <td className="px-3 py-2">{row.endLng || '—'}</td>
                    <td className="px-3 py-2">{row.pointAName || '—'}</td>
                    <td className="px-3 py-2">{row.pointBName || '—'}</td>
                    <td className="px-3 py-2">{row.yearOfConstruction || '—'}</td>
                    <td className="px-3 py-2">{row.trafficClass || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditRoad(row)}
                          className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoad(row)}
                          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-2">
            <span className="text-[10px] text-slate-500">
              Page {pageClamped} of {totalPages} ({totalRows} total roads)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={pageClamped === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border bg-white px-2 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={pageClamped === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border bg-white px-2 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </SuperAdminDashboardLayout>
  );
}
