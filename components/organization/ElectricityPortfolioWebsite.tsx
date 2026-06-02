'use client';

import { useMemo, type ReactNode } from 'react';
import type { ElectricityDaily, ElectricityMonthly, Organization } from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import {
  PsAboutSection,
  PsContactSection,
  PsFacilitiesCarouselSection,
  PsFacultySection,
  PsGallerySection,
  PsHeroSection,
  PsPersonCardsSection,
  asString,
  displayText,
  parseArray,
  type FacilityCard,
  type Faculty,
  type GalleryItem,
  type Lang,
  type PsPersonCard,
} from './EducationPsSections';

type ElectricityProfileRecord = Record<string, unknown>;

export interface ElectricityPortfolioWebsiteProps {
  org: Organization;
  electricityProfile: ElectricityProfileRecord;
  departmentName?: string | null;
  images?: string[];
  // Accepted for compatibility with existing callsites.
  electricityMaster?: unknown;
  staff?: unknown;
  dailyReports?: ElectricityDaily[];
  monthlyReports?: ElectricityMonthly[];
}

function tableShell(children: ReactNode) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function labelFromKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const STAFF_SLOT_COUNT = 8;

function buildStaffRows(profile: ElectricityProfileRecord): Faculty[] {
  const rows: Faculty[] = [];
  for (let i = 1; i <= STAFF_SLOT_COUNT; i += 1) {
    const row: Faculty = {
      name: asString(profile[`staff_${i}_full_name`]),
      designation: asString(profile[`role_designation_${i}`]),
      qualification: asString(profile[`qualification_${i}`]),
      contact: asString(profile[`mobile_number_${i}`]),
      email: asString(profile[`email_${i}`]),
      subject: asString(profile[`job_type_${i}`]),
      experience_from: asString(profile[`date_of_joining_${i}`]),
    };
    if (
      row.name ||
      row.designation ||
      row.qualification ||
      row.contact ||
      row.email ||
      row.subject ||
      row.experience_from
    ) {
      rows.push(row);
    }
  }
  return rows;
}

export function ElectricityPortfolioWebsite({
  org,
  electricityProfile,
  departmentName,
  images = [],
  dailyReports = [],
  monthlyReports = [],
}: ElectricityPortfolioWebsiteProps) {
  const { language } = useLanguage();
  const tr = (en: string, or: string) => (language === 'or' ? or : en);
  const lang = (language === 'or' ? 'od' : 'en') as Lang;
  const profile = electricityProfile || {};

  const heroSlides = useMemo(() => {
    const fromGallery = parseArray<string>(profile.gallery_images)
      .map((x) => asString(x))
      .filter(Boolean);
    return (fromGallery.length ? fromGallery : images).slice(0, 3);
  }, [profile.gallery_images, images]);

  const locationLine = [
    asString(profile.block_ulb_name),
    asString(profile.gp_ward_name),
    asString(profile.village_locality_name),
  ]
    .filter(Boolean)
    .join(', ');

  const psProfile = useMemo(
    () => ({
      ...profile,
      school_name_en: asString(profile.name_of_electricity_office) || org.name || '',
      hero_primary_tagline_en:
        asString(profile.type_of_institution) || tr('Electricity Services', 'ବିଦ୍ୟୁତ ସେବା'),
      about_short_en:
        asString(profile.remarks_description) ||
        asString(profile.area_zone_covered_by_this_office) ||
        '',
      about_image: asString(profile.electricity_campus_image),
      esst_year: asString(profile.established_year),
      school_type_en: asString(profile.type_of_institution) || tr('Electricity Office', 'ବିଦ୍ୟୁତ କାର୍ଯ୍ୟାଳୟ'),
      location_en: locationLine || asString(profile.full_postal_address) || asString(org.address),
      name_of_hm: asString(profile.in_charge_name),
      hm_designation: asString(profile.in_charge_designation),
      headmaster_contact: asString(profile.in_charge_mobile_number),
      headmaster_email: asString(profile.in_charge_email),
      contact_address_en: asString(profile.full_postal_address) || asString(org.address),
      contact_phone:
        asString(profile.customer_care_toll_free_number) || asString(profile.in_charge_mobile_number),
      health_emergency_phone:
        asString(profile.emergency_helpline_number_1) || asString(profile.emergency_helpline_number_2),
      contact_email: asString(profile.office_email) || asString(profile.customer_care_email),
      office_hours_en: asString(profile.office_hours),
    }),
    [profile, org.name, org.address, locationLine, tr],
  );

  const keyContacts: PsPersonCard[] = useMemo(() => {
    const cards: PsPersonCard[] = [
      {
        role: tr('In-charge', 'ଇନ୍-ଚାର୍ଜ'),
        name: asString(profile.in_charge_name),
        contact: asString(profile.in_charge_mobile_number),
        email: asString(profile.in_charge_email),
        image: asString(profile.in_charge_photo),
      },
      {
        role: tr('Customer Care', 'ଗ୍ରାହକ ସେବା'),
        name: asString(profile.type_of_institution) || asString(profile.name_of_electricity_office),
        contact:
          asString(profile.customer_care_toll_free_number) || asString(profile.emergency_helpline_number_1),
        email: asString(profile.customer_care_email) || asString(profile.office_email),
        image: '',
      },
    ];
    return cards.filter((c) => c.name || c.contact || c.email || c.image);
  }, [profile, tr]);

  const infraCards: FacilityCard[] = useMemo(
    () => [
      {
        title: tr('Voltage Levels', 'ଭୋଲ୍ଟେଜ୍ ସ୍ତର'),
        description: `${displayText(profile.primary_voltage_level_kv)} / ${displayText(profile.secondary_voltage_level_kv)} kV`,
      },
      {
        title: tr('Installed Capacity', 'ସ୍ଥାପିତ କ୍ଷମତା'),
        description: `${displayText(profile.installed_capacity_mva)} MVA`,
      },
      {
        title: tr('Main Transformers', 'ମୁଖ୍ୟ ଟ୍ରାନ୍ସଫର୍ମର'),
        description: `${displayText(profile.number_of_main_transformers)} (${displayText(profile.transformer_ratings)})`,
      },
      {
        title: tr('Feeders', 'ଫିଡର୍'),
        description: `${displayText(profile.number_of_incoming_feeders)} in / ${displayText(profile.number_of_outgoing_feeders)} out / ${displayText(profile.total_feeders)} total`,
      },
      {
        title: tr('Distribution Transformers', 'ଡିଷ୍ଟ୍ରିବ୍ୟୁସନ୍ ଟ୍ରାନ୍ସଫର୍ମର'),
        description: `${displayText(profile.number_of_distribution_transformers_dts)} DTs, ${displayText(profile.total_dt_capacity_kva)} kVA`,
      },
      {
        title: tr('Consumers', 'ଗ୍ରାହକ'),
        description: `HT ${displayText(profile.high_tension_ht_consumers_count)} / LT ${displayText(profile.low_tension_lt_consumers_count)}`,
      },
    ],
    [profile, tr],
  );

  const staffRows = useMemo(() => buildStaffRows(profile), [profile]);
  const galleryItems = useMemo(
    () => parseArray<GalleryItem>(profile.gallery_images),
    [profile.gallery_images],
  );

  const metricsRows = useMemo(
    () =>
      [
        'ownership',
        'host_institution',
        'area_zone_covered_by_this_office',
        'is_helpline_available',
        'feeder_metering',
        'dt_metering',
        'number_of_feeder_meters',
        'number_of_dt_meters',
        '33_kv_feeder_length_km',
        '11_kv_feeder_length_km',
        'lt_line_length_km',
      ].map((k) => ({ key: k, value: profile[k] })),
    [profile],
  );

  const latestDailyRows = useMemo(
    () =>
      [...dailyReports]
        .sort((a, b) => String(b.record_date).localeCompare(String(a.record_date)))
        .slice(0, 10),
    [dailyReports],
  );

  const latestMonthlyRows = useMemo(
    () =>
      [...monthlyReports]
        .sort((a, b) => {
          const ay = Number(a.year) || 0;
          const by = Number(b.year) || 0;
          if (ay !== by) return by - ay;
          return (Number(b.month) || 0) - (Number(a.month) || 0);
        })
        .slice(0, 12),
    [monthlyReports],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white text-slate-800">
      <PsHeroSection org={org} profile={psProfile} language={lang} sliderImages={heroSlides} />

      <main className="mx-auto max-w-[1280px] space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <PsAboutSection
          org={org}
          profile={psProfile}
          language={lang}
          sliderImages={heroSlides}
          hideVisionMission
          hideExtendedLeaderBio
        />
        {departmentName ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{departmentName}</p>
        ) : null}

        <PsPersonCardsSection
          title={tr('Key contacts', 'ମୁଖ୍ୟ ଯୋଗାଯୋଗ')}
          people={keyContacts}
          gridClassName="md:grid-cols-2 xl:grid-cols-2"
        />

        <PsFacilitiesCarouselSection
          profile={psProfile}
          facilities={infraCards}
          sectionTitle={tr('Electrical infrastructure', 'ବିଦ୍ୟୁତ ପୂର୍ବାଧାର')}
        />

        <PsFacultySection
          faculty={staffRows}
          profile={psProfile}
          sectionTitle={tr('Staff directory', 'କର୍ମଚାରୀ ତାଲିକା')}
          subjectLabel={tr('Job type', 'ଚାକିରି ପ୍ରକାର')}
          showAttendance={false}
          emptyStateMessage={tr('No staff records added yet.', 'ଏପର୍ଯ୍ୟନ୍ତ କର୍ମଚାରୀ ରେକର୍ଡ ଯୋଡାଯାଇନାହିଁ।')}
        />

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {tr('Operations & metering', 'ପରିଚାଳନା ଓ ମିଟରିଂ')}
          </h2>
          {tableShell(
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    {tr('Metric', 'ମାପକ')}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-900">
                    {tr('Value', 'ମୂଲ୍ୟ')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {metricsRows.map((r) => (
                  <tr key={r.key} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">{labelFromKey(r.key)}</td>
                    <td className="px-4 py-3 text-slate-900">{displayText(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>,
          )}
        </section>

        <PsGallerySection gallery={galleryItems} />

        {(latestDailyRows.length > 0 || latestMonthlyRows.length > 0) && (
          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {tr('Dynamic data', 'ଡାଇନାମିକ୍ ତଥ୍ୟ')}
            </h2>

            {latestDailyRows.length > 0 &&
              tableShell(
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('Daily date', 'ଦୈନିକ ତାରିଖ')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('Urban supply hrs', 'ସହରୀ ସପ୍ଲାଇ ଘଣ୍ଟା')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('Rural supply hrs', 'ଗ୍ରାମୀଣ ସପ୍ଲାଇ ଘଣ୍ଟା')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('Complaints', 'ଅଭିଯୋଗ')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('Resolved', 'ସମାଧାନ')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestDailyRows.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-700">{displayText(r.record_date)}</td>
                        <td className="px-4 py-3 text-slate-900">{displayText(r.supply_hours_urban)}</td>
                        <td className="px-4 py-3 text-slate-900">{displayText(r.supply_hours_rural)}</td>
                        <td className="px-4 py-3 text-slate-900">{displayText(r.complaints_received)}</td>
                        <td className="px-4 py-3 text-slate-900">{displayText(r.complaints_resolved)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>,
              )}

            {latestMonthlyRows.length > 0 &&
              tableShell(
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('Month', 'ମାସ')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('Units billed (MU)', 'ବିଲ୍ କରାଯାଇଥିବା ୟୁନିଟ୍ (MU)')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('Revenue collected (Cr)', 'ଆଦାୟ ରେଭେନ୍ୟୁ (କୋଟି)')}
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">
                        {tr('AT&C loss %', 'AT&C କ୍ଷତି %')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestMonthlyRows.map((r) => (
                      <tr key={r.id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-700">{`${displayText(r.month)}/${displayText(r.year)}`}</td>
                        <td className="px-4 py-3 text-slate-900">{displayText(r.units_billed_mu)}</td>
                        <td className="px-4 py-3 text-slate-900">{displayText(r.revenue_collected_cr)}</td>
                        <td className="px-4 py-3 text-slate-900">{displayText(r.at_c_loss_percent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>,
              )}
          </section>
        )}

        <PsContactSection org={org} profile={psProfile} language={lang} />
      </main>
    </div>
  );
}
