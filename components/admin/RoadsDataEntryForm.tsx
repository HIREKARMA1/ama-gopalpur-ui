'use client';

import { FormEvent, useEffect, useState } from 'react';
import { organizationsApi, type Organization } from '../../services/api';

type Props = {
  departmentId: number;
  onCreated?: (org: Organization) => void;
  editingRoad?: Organization | null;
  onUpdated?: (org: Organization) => void;
  onCancelEdit?: () => void;
};

function toNumberOrNull(value: string): number | null {
  const n = Number(value.trim());
  return Number.isFinite(n) ? n : null;
}

function parsePathCoordinatePairs(value: string): Array<[number, number]> {
  const raw = value.trim();
  if (!raw) return [];
  const nums = (raw.match(/-?\d+(?:\.\d+)?/g) || []).map((n) => Number(n));
  if (nums.length < 4) return [];
  const out: Array<[number, number]> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const lng = nums[i];
    const lat = nums[i + 1];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push([lng, lat]);
  }
  return out;
}

export function RoadsDataEntryForm({
  departmentId,
  onCreated,
  editingRoad = null,
  onUpdated,
  onCancelEdit,
}: Props) {
  const [roadName, setRoadName] = useState('');
  const [roadCode, setRoadCode] = useState('');
  const [roadSector, setRoadSector] = useState('');
  const [nameOfDivision, setNameOfDivision] = useState('');
  const [scheme, setScheme] = useState('');
  const [block, setBlock] = useState('');
  const [lengthKm, setLengthKm] = useState('');
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState('');
  const [pointAName, setPointAName] = useState('');
  const [pointBName, setPointBName] = useState('');
  const [yearOfConstruction, setYearOfConstruction] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState('');
  const [issues, setIssues] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isEditing = editingRoad != null;

  const reset = () => {
    setRoadName('');
    setRoadCode('');
    setRoadSector('');
    setNameOfDivision('');
    setScheme('');
    setBlock('');
    setLengthKm('');
    setStartLat('');
    setStartLng('');
    setEndLat('');
    setEndLng('');
    setPathCoordinates('');
    setPointAName('');
    setPointBName('');
    setYearOfConstruction('');
    setLastMaintenanceDate('');
    setIssues('');
    setRemarks('');
  };

  useEffect(() => {
    if (!editingRoad) {
      reset();
      return;
    }
    const attrs = (editingRoad.attributes ?? {}) as Record<string, unknown>;
    const fallbackLat = editingRoad.latitude != null ? String(editingRoad.latitude) : '';
    const fallbackLng = editingRoad.longitude != null ? String(editingRoad.longitude) : '';
    setRoadName(editingRoad.name ?? '');
    setRoadCode(String(attrs.road_code ?? ''));
    setRoadSector(String(attrs.road_sector ?? ''));
    setNameOfDivision(
      String(attrs.name_of_division ?? attrs.division_name ?? attrs.division ?? ''),
    );
    setScheme(String(attrs.scheme ?? attrs.scheme_name ?? ''));
    setBlock(String(attrs.block ?? editingRoad.address ?? ''));
    setLengthKm(String(attrs.length_km ?? ''));
    setStartLat(String(attrs.start_lat ?? fallbackLat));
    setStartLng(String(attrs.start_lng ?? fallbackLng));
    setEndLat(String(attrs.end_lat ?? fallbackLat));
    setEndLng(String(attrs.end_lng ?? fallbackLng));
    setPathCoordinates(String(attrs.path_coordinates ?? ''));
    setPointAName(String(attrs.point_a_name ?? ''));
    setPointBName(String(attrs.point_b_name ?? ''));
    setYearOfConstruction(String(attrs.year_of_construction ?? ''));
    setLastMaintenanceDate(String(attrs.last_maintenance_date ?? ''));
    setIssues(String(attrs.issues ?? ''));
    setRemarks(String(attrs.remarks ?? ''));
    setError(null);
    setSaved(false);
  }, [editingRoad]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!roadName.trim()) {
      setError('Road name is required.');
      return;
    }
    const parsedPath = parsePathCoordinatePairs(pathCoordinates);

    const sLat = toNumberOrNull(startLat);
    const sLng = toNumberOrNull(startLng);
    const eLat = toNumberOrNull(endLat);
    const eLng = toNumberOrNull(endLng);
    const hasStartEnd = sLat != null && sLng != null && eLat != null && eLng != null;
    const hasPath = parsedPath.length >= 2;
    if (!hasStartEnd && !hasPath) {
      setError('Provide start/end coordinates or a valid path coordinates value.');
      return;
    }

    const derivedStart = hasStartEnd ? [sLng as number, sLat as number] : parsedPath[0];
    const derivedEnd = hasStartEnd
      ? [eLng as number, eLat as number]
      : parsedPath[parsedPath.length - 1];
    const finalStartLng = derivedStart?.[0] ?? null;
    const finalStartLat = derivedStart?.[1] ?? null;
    const finalEndLng = derivedEnd?.[0] ?? null;
    const finalEndLat = derivedEnd?.[1] ?? null;
    if (
      finalStartLat == null ||
      finalStartLng == null ||
      finalEndLat == null ||
      finalEndLng == null
    ) {
      setError('Unable to derive valid road coordinates.');
      return;
    }

    const latitude = Number(((finalStartLat + finalEndLat) / 2).toFixed(6));
    const longitude = Number(((finalStartLng + finalEndLng) / 2).toFixed(6));

    setSaving(true);
    try {
      const payload = {
        department_id: departmentId,
        name: roadName.trim(),
        type: 'OTHER',
        latitude,
        longitude,
        address: block.trim() || undefined,
        description: roadSector.trim() ? `Road sector: ${roadSector.trim()}` : undefined,
        attributes: {
          block: block.trim() || null,
          road_code: roadCode.trim() || null,
          road_sector: roadSector.trim() || null,
          name_of_division: nameOfDivision.trim() || null,
          scheme: scheme.trim() || null,
          length_km: lengthKm.trim() || null,
          path_coordinates: pathCoordinates.trim() || null,
          start_lat: String(finalStartLat),
          start_lng: String(finalStartLng),
          end_lat: String(finalEndLat),
          end_lng: String(finalEndLng),
          point_a_name: pointAName.trim() || null,
          point_b_name: pointBName.trim() || null,
          year_of_construction: yearOfConstruction.trim() || null,
          last_maintenance_date: lastMaintenanceDate.trim() || null,
          issues: issues.trim() || null,
          remarks: remarks.trim() || null,
          updated_at: new Date().toISOString(),
        },
      };

      if (editingRoad) {
        const updated = await organizationsApi.update(editingRoad.id, {
          name: payload.name,
          latitude: payload.latitude,
          longitude: payload.longitude,
          address: payload.address,
          description: payload.description,
          attributes: payload.attributes,
        });
        onUpdated?.(updated);
      } else {
        const created = await organizationsApi.create(payload);
        onCreated?.(created);
      }
      setSaved(true);
      if (!editingRoad) {
        reset();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save road entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-text">Road data entry</h2>
      <p className="mt-1 text-xs text-text-muted">
        {isEditing
          ? 'Edit road record directly from department admin panel.'
          : 'Add road records directly from department admin panel.'}
      </p>
      <p className="mt-1 text-[11px] text-text-muted">
        Tip: for actual road shape on map, provide full path coordinates (for example `lng lat;lng lat;...` or GeoJSON-style coordinate array), not only start/end points.
      </p>
      <form onSubmit={submit} className="mt-3 grid gap-3 text-xs md:grid-cols-2">
        <input className="rounded border border-border px-3 py-2" placeholder="Road name *" value={roadName} onChange={(e) => setRoadName(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Road code" value={roadCode} onChange={(e) => setRoadCode(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Road sector (NH/SH/PWD/RD/PS/GP)" value={roadSector} onChange={(e) => setRoadSector(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Name of division" value={nameOfDivision} onChange={(e) => setNameOfDivision(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Scheme" value={scheme} onChange={(e) => setScheme(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Block" value={block} onChange={(e) => setBlock(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Length (in km)" value={lengthKm} onChange={(e) => setLengthKm(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Start latitude *" value={startLat} onChange={(e) => setStartLat(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Start longitude *" value={startLng} onChange={(e) => setStartLng(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="End latitude *" value={endLat} onChange={(e) => setEndLat(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="End longitude *" value={endLng} onChange={(e) => setEndLng(e.target.value)} />
        <input className="rounded border border-border px-3 py-2 md:col-span-2" placeholder="Path coordinates (optional)" value={pathCoordinates} onChange={(e) => setPathCoordinates(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Starting point name" value={pointAName} onChange={(e) => setPointAName(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Ending point name" value={pointBName} onChange={(e) => setPointBName(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Year of construction" value={yearOfConstruction} onChange={(e) => setYearOfConstruction(e.target.value)} />
        <label className="flex flex-col gap-1 text-[11px] text-text-muted">
          <span>Last maintenance</span>
          <input
            type="date"
            className="rounded border border-border px-3 py-2 text-xs text-text"
            value={lastMaintenanceDate}
            onChange={(e) => setLastMaintenanceDate(e.target.value)}
          />
        </label>
        <input className="rounded border border-border px-3 py-2 md:col-span-2" placeholder="Issues observed" value={issues} onChange={(e) => setIssues(e.target.value)} />
        <input className="rounded border border-border px-3 py-2 md:col-span-2" placeholder="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60">
            {saving ? 'Saving...' : isEditing ? 'Update road' : 'Save road'}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                onCancelEdit?.();
                reset();
                setSaved(false);
                setError(null);
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text"
            >
              Cancel edit
            </button>
          ) : null}
          {saved ? <span className="text-[11px] text-green-600">Saved</span> : null}
        </div>
        {error ? <p className="md:col-span-2 text-xs text-red-600">{error}</p> : null}
      </form>
    </section>
  );
}
