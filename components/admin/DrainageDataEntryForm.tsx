'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  getDrainLineKindFromOrg,
  parsePathCoordinates,
  type DrainLineKind,
} from '../../lib/drainageOrganization';
import { organizationsApi, type Organization } from '../../services/api';

type Props = {
  departmentId: number;
  onCreated?: (org: Organization) => void;
  editingDrain?: Organization | null;
  onUpdated?: (org: Organization) => void;
  onCancelEdit?: () => void;
};

function toNumberOrNull(value: string): number | null {
  const n = Number(value.trim());
  return Number.isFinite(n) ? n : null;
}

export function DrainageDataEntryForm({
  departmentId,
  onCreated,
  editingDrain = null,
  onUpdated,
  onCancelEdit,
}: Props) {
  const [drainName, setDrainName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [drainType, setDrainType] = useState<DrainLineKind>('MAIN');
  const [lengthKm, setLengthKm] = useState('');
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const isEditing = editingDrain != null;

  const reset = () => {
    setDrainName('');
    setProjectName('');
    setDrainType('MAIN');
    setLengthKm('');
    setStartLat('');
    setStartLng('');
    setEndLat('');
    setEndLng('');
    setPathCoordinates('');
    setRemarks('');
  };

  useEffect(() => {
    if (!editingDrain) {
      reset();
      return;
    }
    const attrs = (editingDrain.attributes ?? {}) as Record<string, unknown>;
    const fallbackLat = editingDrain.latitude != null ? String(editingDrain.latitude) : '';
    const fallbackLng = editingDrain.longitude != null ? String(editingDrain.longitude) : '';
    setDrainName(editingDrain.name ?? '');
    setProjectName(String(attrs.project_name ?? editingDrain.address ?? ''));
    setDrainType(getDrainLineKindFromOrg(editingDrain));
    setLengthKm(String(attrs.length_km ?? ''));
    setStartLat(String(attrs.start_lat ?? fallbackLat));
    setStartLng(String(attrs.start_lng ?? fallbackLng));
    setEndLat(String(attrs.end_lat ?? ''));
    setEndLng(String(attrs.end_lng ?? ''));
    setPathCoordinates(String(attrs.path_coordinates ?? ''));
    setRemarks(String(attrs.remarks ?? ''));
    setError(null);
    setSaved(false);
  }, [editingDrain]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!drainName.trim()) {
      setError('Drain name is required.');
      return;
    }

    const parsedPath = parsePathCoordinates(pathCoordinates);
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
      setError('Unable to derive valid drain coordinates.');
      return;
    }

    const latitude = Number(((finalStartLat + finalEndLat) / 2).toFixed(6));
    const longitude = Number(((finalStartLng + finalEndLng) / 2).toFixed(6));
    const project = projectName.trim();

    setSaving(true);
    try {
      const pathValue =
        pathCoordinates.trim() ||
        parsedPath.map(([lng, lat]) => `${lng} ${lat}`).join('|');

      const payload = {
        department_id: departmentId,
        name: drainName.trim(),
        type: 'OTHER',
        latitude,
        longitude,
        address: project || undefined,
        sub_department: 'DRAINAGE',
        attributes: {
          project_name: project || null,
          drain_line_kind: drainType,
          drain_type: drainType,
          length_km: lengthKm.trim() || null,
          path_coordinates: pathValue,
          start_lat: String(finalStartLat),
          start_lng: String(finalStartLng),
          end_lat: String(finalEndLat),
          end_lng: String(finalEndLng),
          remarks: remarks.trim() || null,
        },
      };

      if (editingDrain) {
        const updated = await organizationsApi.update(editingDrain.id, {
          name: payload.name,
          latitude: payload.latitude,
          longitude: payload.longitude,
          address: payload.address,
          sub_department: payload.sub_department,
          attributes: payload.attributes,
        });
        onUpdated?.(updated);
      } else {
        const created = await organizationsApi.create(payload);
        onCreated?.(created);
      }
      setSaved(true);
      if (!editingDrain) reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save drain entry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-semibold text-text">Drain data entry</h2>
      <p className="mt-1 text-xs text-text-muted">
        {isEditing
          ? 'Edit drain segment for the public map.'
          : 'Fields match bulk CSV: project, drain name, type, length, coordinates, remarks.'}
      </p>
      <form onSubmit={submit} className="mt-3 grid gap-3 text-xs md:grid-cols-2">
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Project name *"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <select
          className="rounded border border-border px-3 py-2"
          value={drainType}
          onChange={(e) => setDrainType(e.target.value as DrainLineKind)}
        >
          <option value="MAIN">Main</option>
          <option value="BRANCH">Branch</option>
        </select>
        <input
          className="rounded border border-border px-3 py-2 md:col-span-2"
          placeholder="Drain name *"
          value={drainName}
          onChange={(e) => setDrainName(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Length (km)"
          value={lengthKm}
          onChange={(e) => setLengthKm(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Start latitude *"
          value={startLat}
          onChange={(e) => setStartLat(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="Start longitude *"
          value={startLng}
          onChange={(e) => setStartLng(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="End latitude *"
          value={endLat}
          onChange={(e) => setEndLat(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2"
          placeholder="End longitude *"
          value={endLng}
          onChange={(e) => setEndLng(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2 md:col-span-2"
          placeholder="Path coordinates (lng lat|lng lat|...)"
          value={pathCoordinates}
          onChange={(e) => setPathCoordinates(e.target.value)}
        />
        <input
          className="rounded border border-border px-3 py-2 md:col-span-2"
          placeholder="Remarks"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEditing ? 'Update drain' : 'Save drain'}
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
