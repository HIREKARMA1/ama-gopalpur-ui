'use client';

import { Organization, AgricultureFacilityMaster } from '../../services/api';
import { ImageSlider } from './ImageSlider';

function formatVal(v: string | number | null | undefined | boolean): string {
    if (v == null || String(v).trim() === '') return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
}

function formatLabel(key: string): string {
    if (!key) return '';
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface AgriculturePortfolioDashboardProps {
    org: Organization;
    facilityMaster: AgricultureFacilityMaster | null;
    /** Raw profile from CSV-based API (agricultureApi.getProfile) */
    agricultureProfile: Record<string, unknown>;
    departmentName?: string | null;
    images?: string[];
}

export function AgriculturePortfolioDashboard({
    org,
    facilityMaster,
    agricultureProfile,
    departmentName,
    images = [],
}: AgriculturePortfolioDashboardProps) {
    const prettySubDepartment = org.sub_department?.replace(/_/g, ' ').toUpperCase() || 'AGRICULTURE';
    const departmentBadgeText = [departmentName?.toUpperCase(), prettySubDepartment].filter(Boolean).join(' - ') || 'AGRICULTURE';

    const locationLine = [
        org.address,
        org.latitude != null && org.longitude != null ? `${org.latitude.toFixed(5)}, ${org.longitude.toFixed(5)}` : null,
    ].filter(Boolean).join(' · ') || null;

    const toNumber = (v: unknown): number | null => {
        if (v == null || String(v).trim() === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    const totalStaff = toNumber(agricultureProfile.total_staff) ?? facilityMaster?.total_staff ?? null;
    const farmersServed = toNumber(agricultureProfile.farmers_served_last_year) ?? facilityMaster?.farmers_served_last_year ?? null;
    const trainingConducted = toNumber(agricultureProfile.training_programmes_conducted_last_year) ?? facilityMaster?.training_programmes_conducted_last_year ?? null;
    const soilTests = toNumber(agricultureProfile.soil_samples_tested_per_year) ?? facilityMaster?.soil_samples_tested_per_year ?? null;

    type Stat = { label: string; value: number | string | null; };
    const stats: Stat[] = [
        { label: 'Total Staff', value: totalStaff },
        { label: 'Farmers Served Last Year', value: farmersServed },
        { label: 'Training Programmes Last Year', value: trainingConducted },
        { label: 'Soil Samples Tested / Year', value: soilTests },
    ];

    const hasValue = (v: number | string | null) => v != null && v !== '' && String(v).trim() !== '';
    let finalStats: Stat[] = stats.filter(s => hasValue(s.value));

    // Auto-fill other numeric stars
    if (finalStats.length < 4) {
        const numericEntries = Object.entries(agricultureProfile || {}).filter(([key, v]) => {
            if (key === 'latitude' || key === 'longitude' || key.includes('year')) return false;
            return toNumber(v) != null;
        });
        for (const [key, v] of numericEntries) {
            if (finalStats.length >= 4) break;
            const label = formatLabel(key);
            if (finalStats.some((s) => s.label === label)) continue;
            const num = toNumber(v);
            if (num == null) continue;
            finalStats.push({ label, value: num });
        }
    }

    // Combine facility master data and profile data
    const combinedProfile: Record<string, unknown> = { ...(agricultureProfile || {}) };
    if (facilityMaster) {
        Object.entries(facilityMaster).forEach(([k, v]) => {
            if (k !== 'id' && k !== 'organization_id' && k !== 'created_at' && k !== 'updated_at') {
                if (v != null && String(v).trim() !== '') {
                    combinedProfile[k] = v;
                }
            }
        });
    }

    // Avoid duplicating latitude, longitude, name if they exist
    delete combinedProfile.latitude;
    delete combinedProfile.longitude;
    delete combinedProfile['NAME OF OFFICE/CENTER'];
    delete combinedProfile.name;

    return (
        <div className="min-h-screen bg-slate-50/30">
            <section className="w-full">
                <ImageSlider images={images} altPrefix={org.name} className="h-[240px] sm:h-[320px] rounded-none" />
            </section>

            <header className="border-b border-slate-200/80 bg-white/60 px-4 pb-4 pt-6 shadow-sm backdrop-blur-md sm:px-6 lg:px-10">
                <div className="mx-auto max-w-[1920px]">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="inline-flex items-center rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">
                                {departmentBadgeText}
                            </p>
                            <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                {org.name}
                            </h1>
                            {departmentName && (
                                <p className="mt-1 text-sm text-slate-600 truncate">{departmentName}</p>
                            )}
                            {locationLine && (
                                <p className="mt-0.5 text-xs text-slate-500">{locationLine}</p>
                            )}
                        </div>
                        {facilityMaster?.institution_id && (
                            <div className="rounded-xl border border-emerald-200/80 bg-emerald-500/10 px-3 py-2 text-xs text-slate-600 shadow-sm">
                                <div className="font-semibold text-emerald-800/90">Institution ID</div>
                                <div className="mt-0.5 text-sm font-mono text-slate-900">
                                    {facilityMaster.institution_id}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {finalStats.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {finalStats.map(({ label, value }, i) => {
                            const tints = [
                                'border-green-200/80 bg-green-500/10',
                                'border-emerald-200/80 bg-emerald-500/10',
                                'border-teal-200/80 bg-teal-500/10',
                                'border-lime-200/80 bg-lime-500/10',
                            ];
                            return (
                                <div
                                    key={label}
                                    className={`rounded-2xl border p-4 shadow-sm backdrop-blur-sm text-center ${tints[i % tints.length]}`}
                                >
                                    <p className="text-2xl font-bold text-slate-900">{formatVal(value)}</p>
                                    <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <section className="mx-auto max-w-[1920px] px-4 pb-12 sm:px-6 lg:px-10 mt-6">
                <div className="rounded-3xl border border-green-200 bg-green-100/30 shadow-sm overflow-hidden backdrop-blur-md">
                    <div className="border-b border-green-200/60 bg-green-500/15 px-6 py-6 sm:px-10">
                        <h2 className="text-lg font-black uppercase tracking-widest text-green-900">
                            Agriculture Facility Profile
                        </h2>
                        <p className="mt-1 text-sm text-green-800/70 font-bold italic">
                            Detailed metrics and structural overview
                        </p>
                    </div>
                    <div className="grid gap-0 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-green-200/40">
                        {Object.entries(combinedProfile)
                            .filter(([, v]) => v != null && String(v).trim() !== '')
                            .sort(([aKey], [bKey]) => aKey.localeCompare(bKey))
                            .reduce<[Array<[string, unknown]>, Array<[string, unknown]>]>(
                                (cols, entry, idx) => {
                                    cols[idx % 2].push(entry);
                                    return cols;
                                },
                                [[], []],
                            )
                            .map((colEntries, colIdx) => (
                                <div key={colIdx} className="p-6 sm:p-8 lg:p-10 bg-white/20">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse text-sm text-left">
                                            <tbody>
                                                {colEntries.map(([key, value]) => (
                                                    <tr
                                                        key={key}
                                                        className="border-b border-green-200/20 last:border-0"
                                                    >
                                                        <td className="w-1/2 px-4 py-3 font-semibold text-green-800/80">
                                                            {formatLabel(key)}
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-900 font-bold">
                                                            {formatVal(value as string | number | null | undefined | boolean)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
