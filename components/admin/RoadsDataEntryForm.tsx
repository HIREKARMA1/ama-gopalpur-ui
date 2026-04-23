'use client';

import { FormEvent, useState } from 'react';
import { organizationsApi, type Organization } from '../../services/api';

type Props = {
  departmentId: number;
  onCreated?: (org: Organization) => void;
};

function toNumberOrNull(value: string): number | null {
  const n = Number(value.trim());
  return Number.isFinite(n) ? n : null;
}

export function RoadsDataEntryForm({ departmentId, onCreated }: Props) {
  const [roadName, setRoadName] = useState('');
  const [roadCode, setRoadCode] = useState('');
  const [roadSector, setRoadSector] = useState('');
  const [block, setBlock] = useState('');
  const [startLat, setStartLat] = useState('');
  const [startLng, setStartLng] = useState('');
  const [endLat, setEndLat] = useState('');
  const [endLng, setEndLng] = useState('');
  const [pathCoordinates, setPathCoordinates] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const reset = () => {
    setRoadName('');
    setRoadCode('');
    setRoadSector('');
    setBlock('');
    setStartLat('');
    setStartLng('');
    setEndLat('');
    setEndLng('');
    setPathCoordinates('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!roadName.trim()) {
      setError('Road name is required.');
      return;
    }
    if (!startLat.trim() || !startLng.trim() || !endLat.trim() || !endLng.trim()) {
      setError('Start and end coordinates are required.');
      return;
    }

    const sLat = toNumberOrNull(startLat);
    const sLng = toNumberOrNull(startLng);
    const eLat = toNumberOrNull(endLat);
    const eLng = toNumberOrNull(endLng);
    if (sLat == null || sLng == null || eLat == null || eLng == null) {
      setError('Coordinates must be valid numbers.');
      return;
    }

    const latitude = Number(((sLat + eLat) / 2).toFixed(6));
    const longitude = Number(((sLng + eLng) / 2).toFixed(6));

    setSaving(true);
    try {
      const created = await organizationsApi.create({
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
          path_coordinates: pathCoordinates.trim() || null,
          start_lat: startLat.trim(),
          start_lng: startLng.trim(),
          end_lat: endLat.trim(),
          end_lng: endLng.trim(),
          updated_at: new Date().toISOString(),
        },
      });
      onCreated?.(created);
      setSaved(true);
      reset();
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
        Add road records directly from department admin panel.
      </p>
      <form onSubmit={submit} className="mt-3 grid gap-3 text-xs md:grid-cols-2">
        <input className="rounded border border-border px-3 py-2" placeholder="Road name *" value={roadName} onChange={(e) => setRoadName(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Road code" value={roadCode} onChange={(e) => setRoadCode(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Road sector (NH/SH/PWD/RD/PS/GP)" value={roadSector} onChange={(e) => setRoadSector(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Block" value={block} onChange={(e) => setBlock(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Start latitude *" value={startLat} onChange={(e) => setStartLat(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="Start longitude *" value={startLng} onChange={(e) => setStartLng(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="End latitude *" value={endLat} onChange={(e) => setEndLat(e.target.value)} />
        <input className="rounded border border-border px-3 py-2" placeholder="End longitude *" value={endLng} onChange={(e) => setEndLng(e.target.value)} />
        <input className="rounded border border-border px-3 py-2 md:col-span-2" placeholder="Path coordinates (optional)" value={pathCoordinates} onChange={(e) => setPathCoordinates(e.target.value)} />
        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60">
            {saving ? 'Saving...' : 'Save road'}
          </button>
          {saved ? <span className="text-[11px] text-green-600">Saved</span> : null}
        </div>
        {error ? <p className="md:col-span-2 text-xs text-red-600">{error}</p> : null}
      </form>
    </section>
  );
}
