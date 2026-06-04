'use client';

import { useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { compressImage } from '../../lib/imageCompression';
import { organizationsApi } from '../../services/api';

type FormFields = Record<string, string>;

type SectionId =
  | 'hero'
  | 'about'
  | 'admin'
  | 'facilities'
  | 'programmes'
  | 'faculty'
  | 'institute'
  | 'placement'
  | 'studentLife'
  | 'notices'
  | 'gallery'
  | 'contact';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'About' },
  { id: 'admin', label: 'Leadership' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'programmes', label: 'Academics' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'institute', label: 'Institute' },
  { id: 'placement', label: 'Placement' },
  { id: 'studentLife', label: 'Student Life' },
  { id: 'notices', label: 'Notices' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'contact', label: 'Contact' },
];

const K = {
  collegeName: 'college_name',
  heroTagline: 'hero_primary_tagline_en',
  hero1: 'hero_slide_1',
  hero2: 'hero_slide_2',
  hero3: 'hero_slide_3',
  welcome: 'welcome_text_en',
  values: 'values_text_en',
  aboutImage: 'about_image',
  principalPhoto: 'headmaster_photo',
  principalName: 'name_of_hm',
  principalMessage: 'headmaster_message_en',
  principalQual: 'hm_qualification',
  principalContact: 'headmaster_contact',
  principalEmail: 'headmaster_email',
  vision: 'vision_text_en',
  mission: 'mission_text_en',
  adminJson: 'diploma_admin_cards_json',
  facilityJson: 'facility_cards_json',
  programmeJson: 'department_programme_cards_json',
  facultyJson: 'faculty_cards_json',
  studentLifeJson: 'student_life_cards_json',
  noticeJson: 'notice_board_json',
  galleryJson: 'photo_gallery_json',
  placementOfficerName: 'placement_officer_name',
  placementOfficerContact: 'placement_officer_contact',
  placementOfficerEmail: 'placement_officer_email',
  placementOfficerQual: 'placement_officer_qualification',
  placementOfficerPhoto: 'placement_officer_photo',
  placementOfficerExpFrom: 'placement_officer_experience_from',
  placementOfficerExpTo: 'placement_officer_experience_to',
  placementPartners: 'placement_partners',
  placementPct: 'placement_percentage_last_year',
  highestPackage: 'highest_package_lpa',
  block: 'block_ulb',
  gp: 'gp_ward',
  village: 'village_locality',
  pin: 'pin_code',
  lat: 'latitude',
  lng: 'longitude',
  phone: 'college_phone',
  email: 'college_email',
  website: 'website',
  ownership: 'ownership_govt_private_aided',
  instType: 'institution_type_polytechnic_iti_other',
  approval: 'approval_authority_aicte_ncvt_state_council',
  affiliate: 'affiliating_body_e_g_scte_vt',
  established: 'established_year',
  totalProgrammes: 'total_diploma_programmes_count',
  programmeList: 'diploma_programmes_list_branch_wise',
  duration: 'program_duration_years',
  intake: 'total_sanctioned_intake_all_years',
  enroll1: 'students_enrolled_1st_year',
  enroll2: 'students_enrolled_2nd_year',
  enroll3: 'students_enrolled_3rd_year',
} as const;

function parseRows(raw: string): Record<string, string>[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Record<string, string>[]) : [];
  } catch {
    return [];
  }
}

function rowsToJson(rows: Record<string, unknown>[]): string {
  return JSON.stringify(rows);
}

async function uploadAsset(orgId: number, file: File, assetType: string): Promise<string> {
  const prepared = await compressImage(file, { maxSizeMB: 1, maxWidth: 1920 });
  const { url } = await organizationsApi.uploadPsPortfolioAsset(orgId, prepared, assetType);
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
        accept="image/jpeg,image/png"
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
      {err ? <p className="text-[10px] text-red-600">{err}</p> : null}
      {url ? (
        <div className="flex items-center gap-2">
          <img src={url} alt="" className="h-14 w-14 rounded border border-border object-cover" />
          <button type="button" className="rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] text-red-700" onClick={() => onUrl('')}>
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SectionBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded border border-border bg-background p-3">
      <h4 className="mb-2 text-xs font-semibold text-text">{title}</h4>
      {children}
    </section>
  );
}

export function EducationDiplomaPortfolioAdminForm({
  organizationId,
  values,
  setValues,
  profileImageControl,
  subDeptPlacementUrl = '',
  onSubDeptPlacementUrlChange,
}: {
  organizationId: number | null;
  values: FormFields;
  setValues: Dispatch<SetStateAction<FormFields>>;
  profileImageControl?: ReactNode;
  subDeptPlacementUrl?: string;
  onSubDeptPlacementUrlChange?: (url: string) => void;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const patch = (p: Record<string, string | undefined>) =>
    setValues((prev) => {
      const next: FormFields = { ...prev };
      Object.entries(p).forEach(([k, v]) => {
        if (typeof v === 'string') next[k] = v;
      });
      return next;
    });

  const adminRows = useMemo(() => parseRows(values[K.adminJson] || ''), [values[K.adminJson]]);
  const facilityRows = useMemo(() => parseRows(values[K.facilityJson] || ''), [values[K.facilityJson]]);
  const programmeRows = useMemo(() => parseRows(values[K.programmeJson] || ''), [values[K.programmeJson]]);
  const facultyRows = useMemo(() => parseRows(values[K.facultyJson] || ''), [values[K.facultyJson]]);
  const studentLifeRows = useMemo(() => parseRows(values[K.studentLifeJson] || ''), [values[K.studentLifeJson]]);
  const noticeRows = useMemo(() => parseRows(values[K.noticeJson] || ''), [values[K.noticeJson]]);
  const galleryRows = useMemo(() => parseRows(values[K.galleryJson] || ''), [values[K.galleryJson]]);

  return (
    <div className="w-full max-w-none space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`rounded px-2 py-1 text-[11px] font-medium ${
              activeSection === s.id ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-text'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'hero' ? (
        <SectionBox title="Hero banner">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profileImageControl}
            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <label className="block text-text">Tagline</label>
              <input className="w-full rounded border border-border px-2 py-1" value={values[K.heroTagline] || ''} onChange={(e) => patch({ [K.heroTagline]: e.target.value })} />
            </div>
            <ImgSlot label="Hero slide 1" organizationId={organizationId} assetType="ps_hero" url={values[K.hero1] || ''} onUrl={(v) => patch({ [K.hero1]: v })} />
            <ImgSlot label="Hero slide 2" organizationId={organizationId} assetType="ps_hero" url={values[K.hero2] || ''} onUrl={(v) => patch({ [K.hero2]: v })} />
            <ImgSlot label="Hero slide 3" organizationId={organizationId} assetType="ps_hero" url={values[K.hero3] || ''} onUrl={(v) => patch({ [K.hero3]: v })} />
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'about' ? (
        <SectionBox title="About the institute">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ImgSlot label="About image" organizationId={organizationId} assetType="ps_about" url={values[K.aboutImage] || ''} onUrl={(v) => patch({ [K.aboutImage]: v })} />
            <ImgSlot label="Principal photo" organizationId={organizationId} assetType="ps_admin_deo" url={values[K.principalPhoto] || ''} onUrl={(v) => patch({ [K.principalPhoto]: v })} />
            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
              <label className="block text-text">Welcome text</label>
              <textarea rows={4} className="w-full rounded border border-border px-2 py-1" value={values[K.welcome] || ''} onChange={(e) => patch({ [K.welcome]: e.target.value })} />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4">
              <label className="block text-text">Our values (comma separated)</label>
              <input className="w-full rounded border border-border px-2 py-1" placeholder="Discipline, Teamwork, Transparency" value={values[K.values] || ''} onChange={(e) => patch({ [K.values]: e.target.value })} />
            </div>
            <div className="space-y-1"><label className="block text-text">Principal name</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.principalName] || ''} onChange={(e) => patch({ [K.principalName]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Principal qualification</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.principalQual] || ''} onChange={(e) => patch({ [K.principalQual]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Principal contact</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.principalContact] || ''} onChange={(e) => patch({ [K.principalContact]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Principal email</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.principalEmail] || ''} onChange={(e) => patch({ [K.principalEmail]: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4"><label className="block text-text">Principal message</label><textarea rows={3} className="w-full rounded border border-border px-2 py-1" value={values[K.principalMessage] || ''} onChange={(e) => patch({ [K.principalMessage]: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4"><label className="block text-text">Vision</label><textarea rows={2} className="w-full rounded border border-border px-2 py-1" value={values[K.vision] || ''} onChange={(e) => patch({ [K.vision]: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4"><label className="block text-text">Mission</label><textarea rows={2} className="w-full rounded border border-border px-2 py-1" value={values[K.mission] || ''} onChange={(e) => patch({ [K.mission]: e.target.value })} /></div>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'admin' ? (
        <SectionBox title="Leadership cards">
          <div className="space-y-2">
            {(adminRows.length ? adminRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid w-full gap-2 rounded border border-border p-2 sm:grid-cols-2 lg:grid-cols-[120px_1fr_1fr_auto] lg:items-end">
                <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_admin_deo" url={row.image || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, image: v }; patch({ [K.adminJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Name" value={row.name || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, name: e.target.value }; patch({ [K.adminJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Designation" value={row.designation || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, designation: e.target.value }; patch({ [K.adminJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Contact" value={row.contact || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, contact: e.target.value }; patch({ [K.adminJson]: rowsToJson(n) }); }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [K.adminJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [K.adminJson]: rowsToJson([...adminRows, { image: '', name: '', designation: '', contact: '', email: '' }]) })}>+ Add leader</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'facilities' ? (
        <SectionBox title="Campus facilities">
          <div className="space-y-2">
            {(facilityRows.length ? facilityRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid w-full gap-2 rounded border border-border p-2 sm:grid-cols-2 lg:grid-cols-[140px_1fr_1fr_auto] lg:items-end">
                <ImgSlot label="Image" organizationId={organizationId} assetType="ps_facility" url={row.image || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, image: v }; patch({ [K.facilityJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Title" value={row.title || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ [K.facilityJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Description" value={row.description || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ [K.facilityJson]: rowsToJson(n) }); }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [K.facilityJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [K.facilityJson]: rowsToJson([...facilityRows, { image: '', title: '', description: '' }]) })}>+ Add facility</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'programmes' ? (
        <SectionBox title="Diploma programmes & intake">
          <div className="mb-3 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="space-y-1"><label className="block text-text">Total programmes (count)</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.totalProgrammes] || ''} onChange={(e) => patch({ [K.totalProgrammes]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Programme list (comma separated)</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.programmeList] || ''} onChange={(e) => patch({ [K.programmeList]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Duration (years)</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.duration] || ''} onChange={(e) => patch({ [K.duration]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Total sanctioned intake</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.intake] || ''} onChange={(e) => patch({ [K.intake]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Enrolled 1st year</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.enroll1] || ''} onChange={(e) => patch({ [K.enroll1]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Enrolled 2nd year</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.enroll2] || ''} onChange={(e) => patch({ [K.enroll2]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Enrolled 3rd year</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.enroll3] || ''} onChange={(e) => patch({ [K.enroll3]: e.target.value })} /></div>
          </div>
          <p className="mb-2 text-[10px] text-text-muted">Programme cards (e.g. Civil, Electrical — like UCPES academics menu).</p>
          <div className="space-y-2">
            {(programmeRows.length ? programmeRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid w-full gap-2 rounded border border-border p-2 sm:grid-cols-2 lg:grid-cols-[120px_1fr_1fr_1fr_1fr_auto] lg:items-end">
                <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_facility" url={row.image || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, image: v }; patch({ [K.programmeJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Branch name" value={row.branch_name || row.department_name || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, branch_name: e.target.value }; patch({ [K.programmeJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Duration (years)" value={row.duration_years || row.program_duration || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, duration_years: e.target.value }; patch({ [K.programmeJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Sanctioned intake" value={row.sanctioned_intake || row.intake || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, sanctioned_intake: e.target.value }; patch({ [K.programmeJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Short description" value={row.description || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ [K.programmeJson]: rowsToJson(n) }); }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [K.programmeJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [K.programmeJson]: rowsToJson([...programmeRows, { image: '', branch_name: '', duration_years: '', sanctioned_intake: '', description: '' }]) })}>+ Add programme</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'faculty' ? (
        <SectionBox title="Faculty">
          <div className="space-y-2">
            {(facultyRows.length ? facultyRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid w-full gap-2 rounded border border-border p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <ImgSlot label="Photo" organizationId={organizationId} assetType="ps_faculty" url={row.photo || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, photo: v }; patch({ [K.facultyJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Name" value={row.name || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, name: e.target.value }; patch({ [K.facultyJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Department" value={row.subject || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, subject: e.target.value }; patch({ [K.facultyJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Designation" value={row.designation || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, designation: e.target.value }; patch({ [K.facultyJson]: rowsToJson(n) }); }} />
                <button type="button" className="text-[10px] text-red-600 sm:col-span-2" onClick={() => patch({ [K.facultyJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [K.facultyJson]: rowsToJson([...facultyRows, { photo: '', name: '', subject: '', designation: '' }]) })}>+ Add faculty</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'institute' ? (
        <SectionBox title="Institute details (accreditation & affiliation)">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="space-y-1"><label className="block text-text">Ownership</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.ownership] || ''} onChange={(e) => patch({ [K.ownership]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Institution type</label><input className="w-full rounded border border-border px-2 py-1" placeholder="POLYTECHNIC" value={values[K.instType] || ''} onChange={(e) => patch({ [K.instType]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Approval authority</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.approval] || ''} onChange={(e) => patch({ [K.approval]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Affiliating body</label><input className="w-full rounded border border-border px-2 py-1" placeholder="SCTE&VT" value={values[K.affiliate] || ''} onChange={(e) => patch({ [K.affiliate]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Established year</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.established] || ''} onChange={(e) => patch({ [K.established]: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4"><label className="block text-text">Website</label><input type="url" className="w-full rounded border border-border px-2 py-1" value={values[K.website] || ''} onChange={(e) => patch({ [K.website]: e.target.value })} /></div>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'placement' ? (
        <SectionBox title="Training & placement">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {onSubDeptPlacementUrlChange ? (
              <div className="space-y-1 sm:col-span-2 lg:col-span-4">
                <label className="block text-text">Placement cell link (diploma sub-department)</label>
                <p className="text-[11px] text-text-muted">Shared for all diploma colleges. Saved when you save this organization.</p>
                <input type="url" className="w-full rounded border border-border px-2 py-1" placeholder="https://ucpesbam.in/placement" value={subDeptPlacementUrl} onChange={(e) => onSubDeptPlacementUrlChange(e.target.value)} />
              </div>
            ) : null}
            <ImgSlot label="TPO / placement officer photo" organizationId={organizationId} assetType="ps_admin_deo" url={values[K.placementOfficerPhoto] || ''} onUrl={(v) => patch({ [K.placementOfficerPhoto]: v })} />
            <div className="space-y-1"><label className="block text-text">TPO name</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.placementOfficerName] || ''} onChange={(e) => patch({ [K.placementOfficerName]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">TPO contact</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.placementOfficerContact] || ''} onChange={(e) => patch({ [K.placementOfficerContact]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Placement % (last year)</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.placementPct] || ''} onChange={(e) => patch({ [K.placementPct]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Highest salary (annual Rs)</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.highestPackage] || ''} onChange={(e) => patch({ [K.highestPackage]: e.target.value })} /></div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-4"><label className="block text-text">Placement partners (comma separated)</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.placementPartners] || ''} onChange={(e) => patch({ [K.placementPartners]: e.target.value })} /></div>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'studentLife' ? (
        <SectionBox title="Student corner & campus life">
          <div className="space-y-2">
            {(studentLifeRows.length ? studentLifeRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid w-full gap-2 rounded border border-border p-2 sm:grid-cols-2 lg:grid-cols-[140px_1fr_1fr_auto] lg:items-end">
                <ImgSlot label="Image" organizationId={organizationId} assetType="ps_facility" url={row.image || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, image: v }; patch({ [K.studentLifeJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Title" value={row.title || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ [K.studentLifeJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Description" value={row.description || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, description: e.target.value }; patch({ [K.studentLifeJson]: rowsToJson(n) }); }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [K.studentLifeJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [K.studentLifeJson]: rowsToJson([...studentLifeRows, { image: '', title: '', description: '' }]) })}>+ Add item</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'notices' ? (
        <SectionBox title="Notice board">
          <div className="space-y-2">
            {(noticeRows.length ? noticeRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid w-full gap-2 rounded border border-border p-2 sm:grid-cols-[1fr_120px_auto] sm:items-end">
                <input className="rounded border border-border px-2 py-1" placeholder="Notice title" value={row.title || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ [K.noticeJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Date" value={row.date || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, date: e.target.value }; patch({ [K.noticeJson]: rowsToJson(n) }); }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [K.noticeJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [K.noticeJson]: rowsToJson([...noticeRows, { title: '', date: '' }]) })}>+ Add notice</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'gallery' ? (
        <SectionBox title="Gallery">
          <div className="space-y-2">
            {(galleryRows.length ? galleryRows : [{}]).map((row, i, arr) => (
              <div key={i} className="grid w-full gap-2 rounded border border-border p-2 sm:grid-cols-2 lg:grid-cols-[100px_1fr_1fr_auto] lg:items-end">
                <ImgSlot label="Image" organizationId={organizationId} assetType="ps_gallery" url={row.image || ''} onUrl={(v) => { const n = [...arr]; n[i] = { ...row, image: v }; patch({ [K.galleryJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Title" value={row.title || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, title: e.target.value }; patch({ [K.galleryJson]: rowsToJson(n) }); }} />
                <input className="rounded border border-border px-2 py-1" placeholder="Category" value={row.category || ''} onChange={(e) => { const n = [...arr]; n[i] = { ...row, category: e.target.value }; patch({ [K.galleryJson]: rowsToJson(n) }); }} />
                <button type="button" className="text-[10px] text-red-600" onClick={() => patch({ [K.galleryJson]: rowsToJson(arr.filter((_, j) => j !== i)) })}>Remove</button>
              </div>
            ))}
            <button type="button" className="rounded border border-border px-2 py-1 text-[11px]" onClick={() => patch({ [K.galleryJson]: rowsToJson([...galleryRows, { image: '', title: '', category: '' }]) })}>+ Add photo</button>
          </div>
        </SectionBox>
      ) : null}

      {activeSection === 'contact' ? (
        <SectionBox title="Contact & location">
          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className="space-y-1"><label className="block text-text">College name</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.collegeName] || ''} onChange={(e) => patch({ [K.collegeName]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Block / ULB</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.block] || ''} onChange={(e) => patch({ [K.block]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">GP / Ward</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.gp] || ''} onChange={(e) => patch({ [K.gp]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Village / locality</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.village] || ''} onChange={(e) => patch({ [K.village]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Pin code</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.pin] || ''} onChange={(e) => patch({ [K.pin]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Latitude</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.lat] || ''} onChange={(e) => patch({ [K.lat]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Longitude</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.lng] || ''} onChange={(e) => patch({ [K.lng]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Phone</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.phone] || ''} onChange={(e) => patch({ [K.phone]: e.target.value })} /></div>
            <div className="space-y-1"><label className="block text-text">Email</label><input className="w-full rounded border border-border px-2 py-1" value={values[K.email] || ''} onChange={(e) => patch({ [K.email]: e.target.value })} /></div>
          </div>
        </SectionBox>
      ) : null}
    </div>
  );
}
