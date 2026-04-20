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
  lengthKm: string;
  pathCoordinates: string;
  startLat: string;
  startLng: string;
  endLat: string;
  endLng: string;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
};

type RoadCsvRow = {
  block: string;
  roadName: string;
  roadCode: string;
  roadSector: string;
  lengthKm: string;
  pathCoordinates: string;
  startLat: string;
  startLng: string;
  endLat: string;
  endLng: string;
};

const ROAD_TEMPLATE_HEADER =
  'block,ROAD NAME,ROAD CODE,ROAD SECTOR(NH/SH/PWD/RD/PS/GP),LENGTH(IN KM),PATH COORDINATES,start_lat,start_lng,end_lat,end_lng';

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
      'road_type',
      'type',
    ),
    lengthKm: idx('length(in km)', 'length in km', 'length_km', 'length'),
    pathCoordinates: idx('path coordinates', 'path_coordinates', 'coordinates'),
    startLat: idx('start_lat', 'start lat', 'start latitude', 'start_latitude'),
    startLng: idx('start_lng', 'start lng', 'start longitude', 'start_longitude'),
    endLat: idx('end_lat', 'end lat', 'end latitude', 'end_latitude'),
    endLng: idx('end_lng', 'end lng', 'end longitude', 'end_longitude'),
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
      lengthKm: get(indexes.lengthKm),
      pathCoordinates,
      startLat,
      startLng,
      endLat,
      endLng,
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

  const [block, setBlock] = useState('');
  const [roadName, setRoadName] = useState('');
  const [roadCode, setRoadCode] = useState('');
  const [roadSector, setRoadSector] = useState('');
  const [lengthKm, setLengthKm] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState('');
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
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
          lengthKm: String(attrs.length_km ?? ''),
          pathCoordinates: String(attrs.path_coordinates ?? ''),
          startLat: String(attrs.start_lat ?? ''),
          startLng: String(attrs.start_lng ?? ''),
          endLat: String(attrs.end_lat ?? ''),
          endLng: String(attrs.end_lng ?? ''),
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

  const totalRows = tableRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const pageClamped = Math.min(Math.max(1, page), totalPages);
  const start = (pageClamped - 1) * PAGE_SIZE;
  const paginated = tableRows.slice(start, start + PAGE_SIZE);

  const resetForm = () => {
    setBlock('');
    setRoadName('');
    setRoadCode('');
    setRoadSector('');
    setLengthKm('');
    setPathCoordinates('');
    setStartLat('');
    setStartLng('');
    setEndLat('');
    setEndLng('');
  };

  const createRoadOrganization = async (row: RoadCsvRow) => {
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

    await organizationsApi.create({
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
        length_km: row.lengthKm || null,
        path_coordinates: row.pathCoordinates || null,
        start_lat: row.startLat || null,
        start_lng: row.startLng || null,
        end_lat: row.endLat || null,
        end_lng: row.endLng || null,
        updated_at: new Date().toISOString(),
      },
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
      await createRoadOrganization({
        block,
        roadName,
        roadCode,
        roadSector,
        lengthKm,
        pathCoordinates,
        startLat,
        startLng,
        endLat,
        endLng,
      });
      resetForm();
      setRefreshTick((v) => v + 1);
      setSuccess('Road added successfully.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add road');
    } finally {
      setSubmitting(false);
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
      'Rangailunda,Badakusthali to Palligumula,RR(VR)L-044,RD,4.2,"84.854087 19.340684;84.852296 19.335599",19.340684,84.854087,19.335599,84.852296';
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
        { href: '/admin/dept/roads-monitoring', labelKey: 'super.sidebar.dashboard' },
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
            <h2 className="text-sm font-semibold uppercase tracking-wide">Manual Road Entry</h2>
            <p className="mt-1 text-xs opacity-90">
              Add one road using your exact Road CSV fields.
            </p>
          </div>
          <form onSubmit={handleSingleAdd} className="grid gap-4 p-4 text-xs md:grid-cols-2 lg:grid-cols-5">
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
            <div className="flex items-end lg:col-span-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Road'}
              </button>
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
          <div className="border-b bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
              Road Records
            </h3>
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
                  <th className="px-3 py-2 text-left">LENGTH(IN KM)</th>
                  <th className="px-3 py-2 text-left">start_lat</th>
                  <th className="px-3 py-2 text-left">start_lng</th>
                  <th className="px-3 py-2 text-left">end_lat</th>
                  <th className="px-3 py-2 text-left">end_lng</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center italic text-slate-400">
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
                    <td className="px-3 py-2">{row.lengthKm || '—'}</td>
                    <td className="px-3 py-2">{row.startLat || '—'}</td>
                    <td className="px-3 py-2">{row.startLng || '—'}</td>
                    <td className="px-3 py-2">{row.endLat || '—'}</td>
                    <td className="px-3 py-2">{row.endLng || '—'}</td>
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
