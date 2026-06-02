'use client';

import { useMemo, useState, type Dispatch, type SetStateAction, type ReactNode } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';

type ElectricityFormValues = Record<string, string>;

type Props = {
  organizationId: number | null;
  values: ElectricityFormValues;
  setValues: Dispatch<SetStateAction<ElectricityFormValues>>;
  headers: string[];
  profileImageControl?: ReactNode;
};

const EXTRA_IMAGE_KEYS = [
  'electricity_hero_1',
  'electricity_hero_2',
  'electricity_hero_3',
  'electricity_campus_image',
  'electricity_in_charge_photo',
  'staff_1_photo',
  'staff_2_photo',
  'staff_3_photo',
  'staff_4_photo',
  'staff_5_photo',
  'staff_6_photo',
  'staff_7_photo',
  'staff_8_photo',
  'electricity_infra_voltage_image',
  'electricity_infra_capacity_image',
  'electricity_infra_transformer_image',
  'electricity_infra_feeders_image',
  'electricity_infra_dt_image',
  'electricity_infra_consumers_image',
] as const;

const EXTRA_TEXT_KEYS = ['electricity_about', 'electricity_tagline'] as const;

const SECTION_ORDER = [
  'Identity',
  'Location',
  'Contacts',
  'Staff',
  'Infrastructure',
  'Consumers',
] as const;

function snakeFromHeader(label: string): string {
  return label
    .trim()
    .replace(/[-\s/]+/g, '_')
    .replace(/[()]/g, '')
    .replace(/[?]/g, '')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');
}

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadElectricityPortfolioAsset(orgId, prepared, assetType);
  return url;
}

function ImgSlot({
  label,
  organizationId,
  assetType,
  url,
  onUrl,
}: {
  label: string;
  organizationId: number | null;
  assetType: string;
  url: string;
  onUrl: (v: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-1">
      <span className="block text-[11px] text-text">{label}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={!organizationId || busy}
        className="block w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f || !organizationId) return;
          setBusy(true);
          setErr(null);
          try {
            onUrl(await uploadAsset(organizationId, f, assetType));
          } catch (ex: unknown) {
            setErr(ex instanceof Error ? ex.message : 'Upload failed');
          } finally {
            setBusy(false);
          }
        }}
      />
      {err && <p className="text-[10px] text-red-600">{err}</p>}
      {url ? (
        <div className="flex items-center gap-2">
          <img src={url} alt="" className="h-14 w-14 rounded border border-border object-cover" />
          <button
            type="button"
            className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-100"
            onClick={() => onUrl('')}
          >
            Remove image
          </button>
        </div>
      ) : null}
    </div>
  );
}

function sectionForHeader(header: string): (typeof SECTION_ORDER)[number] {
  const h = header.toUpperCase();
  if (h.startsWith('STAFF ') || h.includes('ROLE / DESIGNATION') || h.includes('QUALIFICATION ') || h.includes('DATE OF JOINING') || h.includes('JOB TYPE ') || h.includes('GENDER ') || h.includes('MOBILE NUMBER ') || h.includes('EMAIL ')) {
    return 'Staff';
  }
  if (h.includes('VOLTAGE') || h.includes('TRANSFORMER') || h.includes('FEEDER') || h.includes('BAYS') || h.includes('SWITCHGEAR') || h.includes('LINE LENGTH') || h.includes('DT ')) {
    return 'Infrastructure';
  }
  if (h.includes('CONSUMERS')) return 'Consumers';
  if (h.includes('BLOCK') || h.includes('GP / WARD') || h.includes('VILLAGE') || h.includes('ADDRESS') || h.includes('PIN') || h.includes('LATITUDE') || h.includes('LONGITUDE')) {
    return 'Location';
  }
  if (h.includes('IN-CHARGE') || h.includes('CUSTOMER CARE') || h.includes('HELPLINE') || h.includes('OFFICE EMAIL') || h.includes('WEBSITE')) {
    return 'Contacts';
  }
  return 'Identity';
}

export function ElectricityPortfolioAdminForm({
  organizationId,
  values,
  setValues,
  headers,
  profileImageControl,
}: Props) {
  const [activeSection, setActiveSection] = useState<(typeof SECTION_ORDER)[number]>('Identity');

  const grouped = useMemo(() => {
    const map = new Map<(typeof SECTION_ORDER)[number], string[]>();
    for (const section of SECTION_ORDER) map.set(section, []);
    for (const header of headers) {
      const section = sectionForHeader(header);
      map.get(section)!.push(header);
    }
    return map;
  }, [headers]);

  const patch = (next: Partial<ElectricityFormValues>) =>
    setValues((prev) => ({ ...prev, ...next }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-muted/30 p-2">
        {SECTION_ORDER.map((section) => {
          const active = section === activeSection;
          return (
            <button
              key={section}
              type="button"
              onClick={() => setActiveSection(section)}
              className={`rounded px-2.5 py-1 text-[11px] font-medium ${
                active ? 'bg-primary text-primary-foreground' : 'bg-background text-text hover:bg-muted'
              }`}
            >
              {section}
            </button>
          );
        })}
      </div>

      {activeSection === 'Identity' && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <label className="block text-text">About / Description</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
              value={values.electricity_about ?? ''}
              onChange={(e) => patch({ electricity_about: e.target.value })}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-text">Tagline</label>
            <input
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
              value={values.electricity_tagline ?? ''}
              onChange={(e) => patch({ electricity_tagline: e.target.value })}
            />
          </div>
          {profileImageControl ? <div className="md:col-span-2">{profileImageControl}</div> : null}
          <div className="space-y-1 md:col-span-2 rounded border border-dashed border-border p-2">
            <p className="text-[11px] font-medium text-text">Portfolio images</p>
            <div className="grid gap-2 md:grid-cols-3">
              <ImgSlot label="Hero image 1" organizationId={organizationId} assetType="electricity_hero_slide" url={values.electricity_hero_1 || ''} onUrl={(v) => patch({ electricity_hero_1: v })} />
              <ImgSlot label="Hero image 2" organizationId={organizationId} assetType="electricity_hero_slide" url={values.electricity_hero_2 || ''} onUrl={(v) => patch({ electricity_hero_2: v })} />
              <ImgSlot label="Hero image 3" organizationId={organizationId} assetType="electricity_hero_slide" url={values.electricity_hero_3 || ''} onUrl={(v) => patch({ electricity_hero_3: v })} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <ImgSlot label="Campus/office image" organizationId={organizationId} assetType="electricity_campus_image" url={values.electricity_campus_image || ''} onUrl={(v) => patch({ electricity_campus_image: v })} />
              <ImgSlot label="In-charge photo" organizationId={organizationId} assetType="electricity_in_charge_photo" url={values.electricity_in_charge_photo || ''} onUrl={(v) => patch({ electricity_in_charge_photo: v })} />
            </div>
          </div>
        </div>
      )}

      {activeSection !== 'Identity' && (
        <div className="grid gap-3 md:grid-cols-2">
          {activeSection === 'Staff' ? (
            <div className="space-y-2 md:col-span-2 rounded border border-dashed border-border p-2">
              <p className="text-[11px] font-medium text-text">Staff photos</p>
              <div className="grid gap-2 md:grid-cols-2">
                {Array.from({ length: 8 }).map((_, idx) => {
                  const i = idx + 1;
                  const key = `staff_${i}_photo`;
                  return (
                    <ImgSlot
                      key={key}
                      label={`Staff ${i} photo`}
                      organizationId={organizationId}
                      assetType="electricity_staff_photo"
                      url={values[key] || ''}
                      onUrl={(v) => patch({ [key]: v })}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
          {activeSection === 'Infrastructure' ? (
            <div className="space-y-2 md:col-span-2 rounded border border-dashed border-border p-2">
              <p className="text-[11px] font-medium text-text">Infrastructure photos</p>
              <div className="grid gap-2 md:grid-cols-2">
                <ImgSlot
                  label="Voltage levels image"
                  organizationId={organizationId}
                  assetType="electricity_infra_photo"
                  url={values.electricity_infra_voltage_image || ''}
                  onUrl={(v) => patch({ electricity_infra_voltage_image: v })}
                />
                <ImgSlot
                  label="Installed capacity image"
                  organizationId={organizationId}
                  assetType="electricity_infra_photo"
                  url={values.electricity_infra_capacity_image || ''}
                  onUrl={(v) => patch({ electricity_infra_capacity_image: v })}
                />
                <ImgSlot
                  label="Main transformers image"
                  organizationId={organizationId}
                  assetType="electricity_infra_photo"
                  url={values.electricity_infra_transformer_image || ''}
                  onUrl={(v) => patch({ electricity_infra_transformer_image: v })}
                />
                <ImgSlot
                  label="Feeders image"
                  organizationId={organizationId}
                  assetType="electricity_infra_photo"
                  url={values.electricity_infra_feeders_image || ''}
                  onUrl={(v) => patch({ electricity_infra_feeders_image: v })}
                />
                <ImgSlot
                  label="Distribution transformers image"
                  organizationId={organizationId}
                  assetType="electricity_infra_photo"
                  url={values.electricity_infra_dt_image || ''}
                  onUrl={(v) => patch({ electricity_infra_dt_image: v })}
                />
                <ImgSlot
                  label="Consumers image"
                  organizationId={organizationId}
                  assetType="electricity_infra_photo"
                  url={values.electricity_infra_consumers_image || ''}
                  onUrl={(v) => patch({ electricity_infra_consumers_image: v })}
                />
              </div>
            </div>
          ) : null}
          {(grouped.get(activeSection) || []).map((header) => {
            const key = snakeFromHeader(header);
            return (
              <div key={key} className="space-y-1">
                <label className="block text-text">{header}</label>
                <input
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                  value={values[key] ?? ''}
                  onChange={(e) => patch({ [key]: e.target.value })}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const ELECTRICITY_PORTFOLIO_EXTRA_KEYS = [
  ...EXTRA_IMAGE_KEYS,
  ...EXTRA_TEXT_KEYS,
] as const;
