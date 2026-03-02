'use client';

import { useState, useMemo } from 'react';
import {
    Organization,
    ElectricityMaster,
    ElectricityStaff,
    ElectricityDaily,
    ElectricityMonthly,
} from '../../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import {
    MapPin,
    Building,
    Calendar,
    Phone,
    UserCheck,
    Home,
    Hash,
    Zap,
    Activity,
    Users,
    Settings,
    FileText,
    TrendingUp,
    Clock,
    User,
    Mail,
    Globe,
    AlertTriangle,
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { ImageSlider } from './ImageSlider';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { GOPALPUR_BOUNDS, AWC_MARKER_ICON } from '../../lib/mapConfig';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

function getFirstDefined(obj: any, keys: string[]): unknown {
    if (!obj) return undefined;
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
            return obj[key];
        }
    }
    return undefined;
}

function formatVal(v: unknown): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'number') {
        return Number.isFinite(v) ? String(v) : '—';
    }
    const s = String(v).trim();
    if (s === '') return '—';
    return s;
}

export interface ElectricityPortfolioDashboardProps {
    org: Organization;
    electricityMaster: ElectricityMaster | null;
    electricityProfile: Record<string, unknown>;
    staff: ElectricityStaff[];
    dailyReports: ElectricityDaily[];
    monthlyReports: ElectricityMonthly[];
    images?: string[];
}

export function ElectricityPortfolioDashboard({
    org,
    electricityMaster,
    electricityProfile,
    staff = [],
    dailyReports = [],
    monthlyReports = [],
    images = [],
}: ElectricityPortfolioDashboardProps) {
    const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
    const [detailTab, setDetailTab] = useState<'profile' | 'resources'>('profile');
    const [monitorDate, setMonitorDate] = useState(new Date().toISOString().slice(0, 10));

    // Map center
    const mapCenter = useMemo(() => {
        if (org.latitude != null && org.longitude != null) {
            return { lat: org.latitude, lng: org.longitude };
        }
        return { lat: 19.3378, lng: 84.8560 }; // Berhampur
    }, [org.latitude, org.longitude]);

    const profile = electricityProfile as any;

    // Derived staff data (inspired by health)
    const displayStaff = useMemo(() => {
        if (staff.length > 0) return staff;

        const fallback: any[] = [];
        const inChargeName = electricityMaster?.in_charge_name || profile.in_charge_name || profile.incharge_name;
        const inChargeContact = electricityMaster?.in_charge_contact || profile.in_charge_contact || profile.incharge_contact;

        if (inChargeName) {
            fallback.push({
                id: -1,
                name: inChargeName,
                role: electricityMaster?.in_charge_designation || 'In-Charge',
                contact: inChargeContact,
            });
        }

        // Add categories from profile if available
        const roles = [
            { key: 'engineers_count', role: 'Engineer' },
            { key: 'technical_staff_count', role: 'Technical Staff' },
            { key: 'linemen_count', role: 'Lineman' },
            { key: 'admin_staff_count', role: 'Admin Staff' },
        ];

        roles.forEach(({ key, role }, idx) => {
            const count = Number(electricityMaster?.[key as keyof ElectricityMaster] || profile[key]);
            if (count > 0) {
                fallback.push({
                    id: -(idx + 2),
                    name: `${role} (${count})`,
                    role: role,
                });
            }
        });

        return fallback;
    }, [staff, electricityMaster, profile]);

    // Profile fields
    const block = electricityMaster?.block_ulb || profile.block_ulb || profile.block || org.address;
    const gpWard = electricityMaster?.gp_ward || profile.gp_ward;
    const village = electricityMaster?.village_locality || profile.village_locality || profile.village;
    const latLongStr = `${(org.latitude || 19.3378).toFixed(5)}, ${(org.longitude || 84.8560).toFixed(5)}`;

    return (
        <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
            <section className="w-full">
                <ImageSlider images={images} altPrefix={org.name} className="h-[240px] sm:h-[320px]" />
            </section>

            <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-6 sm:px-6 lg:px-8">
                <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
                    Electricity Portfolio Dashboard
                </h1>
                <p className="mt-1 text-[15px] font-medium text-[#64748b]">
                    Power infrastructure and operational metrics for {org.name}
                </p>
            </header>

            {/* Details Tabs */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="rounded-3xl border border-yellow-200 bg-yellow-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                                Office Information
                            </h2>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                                <button
                                    onClick={() => setDetailTab('profile')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${detailTab === 'profile' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}
                                >
                                    <Building size={14} /> <span>Profile</span>
                                </button>
                                <button
                                    onClick={() => setDetailTab('resources')}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${detailTab === 'resources' ? 'bg-white text-[#0f172a] shadow-sm' : 'text-[#64748b]'}`}
                                >
                                    <Users size={14} /> <span>Staff & Contact</span>
                                </button>
                            </div>
                        </div>

                        {detailTab === 'profile' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <InfoItem icon={Building} label="Office Name" value={org.name} color="yellow" />
                                <InfoItem icon={MapPin} label="Block / ULB" value={block} color="emerald" />
                                <InfoItem icon={Home} label="GP / Ward" value={gpWard} color="amber" />
                                <InfoItem icon={MapPin} label="Locality" value={village} color="violet" />
                                <InfoItem icon={Hash} label="Type" value={electricityMaster?.institution_type || profile.institution_type} color="orange" />
                                <InfoItem icon={TrendingUp} label="Capacity" value={formatVal(electricityMaster?.installed_capacity_mva || profile.installed_capacity_mva) + ' MVA'} color="blue" />
                                <InfoItem icon={Activity} label="Voltage" value={formatVal(electricityMaster?.voltage_level_primary || profile['33kv_feeder_length_km'] ? '33kV' : '11kV')} color="rose" />
                                <InfoItem icon={MapPin} label="Coordinates" value={latLongStr} color="pink" />
                            </div>
                        )}

                        {detailTab === 'resources' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {displayStaff.map((s: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-center bg-white/40 p-3 rounded-2xl border border-white/50">
                                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                            <User size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.role}</p>
                                            <p className="text-[14px] font-bold text-slate-800 truncate">{s.name}</p>
                                            {s.contact && <p className="text-[12px] text-slate-500 font-medium">{s.contact}</p>}
                                        </div>
                                    </div>
                                ))}
                                {displayStaff.length === 0 && (
                                    <p className="col-span-full text-center text-slate-400 py-8 italic font-medium">No staff information recorded</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Stats */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Voltage Primary" value={(electricityMaster?.voltage_level_primary || profile.voltage_level_primary_kv || 0) + ' kV'} icon={Zap} color="yellow" />
                    <StatCard label="Total Feeders" value={electricityMaster?.total_feeders || profile.total_feeders} icon={Activity} color="blue" />
                    <StatCard label="Total Consumers" value={electricityMaster?.consumers_total || profile.consumers_under_jurisdiction_approx} icon={Users} color="purple" />
                    <StatCard label="AT&C Loss" value={(electricityMaster?.at_c_loss_percent || profile.at_c_loss_percent || 0) + '%'} icon={Settings} color="orange" />
                </div>
            </section>

            {/* Monitoring Section */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-[#0f172a]">Daily Operations Monitoring</h2>
                        <p className="text-[13px] text-[#64748b] mt-1">Operational data including supply hours, outages, and complaints resolution.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Supply Hours Chart */}
                        <div className="rounded-2xl border border-slate-100 bg-white/70 p-6 h-[350px]">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Daily Supply Hours</h3>
                            <div className="h-full pb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailyReports.slice(-15)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="record_date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 10 }} />
                                        <YAxis domain={[0, 24]} tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Legend verticalAlign="top" height={36} />
                                        <Line name="Urban Supply" type="monotone" dataKey="supply_hours_urban" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                                        <Line name="Rural Supply" type="monotone" dataKey="supply_hours_rural" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Complaints & Outages Chart */}
                        <div className="rounded-2xl border border-slate-100 bg-white/70 p-6 h-[350px]">
                            <h3 className="text-sm font-bold text-slate-800 mb-4">Complaints & Outages</h3>
                            <div className="h-full pb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyReports.slice(-15)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="record_date" tickFormatter={(v) => v.slice(5)} tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Legend verticalAlign="top" height={36} />
                                        <Bar name="Complaints Recv" dataKey="complaints_received" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar name="Outages" dataKey="outages_count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Monthly Progress */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 sm:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] mb-6">Financial & Performance Metrics</h2>
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-600">Month/Year</th>
                                    <th className="px-6 py-4 font-bold text-slate-600">Units Billed (MU)</th>
                                    <th className="px-6 py-4 font-bold text-slate-600">Revenue (Cr.)</th>
                                    <th className="px-6 py-4 font-bold text-slate-600">AT&C Loss %</th>
                                    <th className="px-6 py-4 font-bold text-slate-600">Efficiency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {monthlyReports.map((m, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800">{m.month}/{m.year}</td>
                                        <td className="px-6 py-4 text-slate-600">{m.units_billed_mu || '—'}</td>
                                        <td className="px-6 py-4 font-medium text-emerald-600">₹{m.revenue_collected_cr || '—'}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 font-bold text-xs">{m.at_c_loss_percent}%</span></td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">{m.collection_efficiency_percent}%</td>
                                    </tr>
                                ))}
                                {monthlyReports.length === 0 && (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No monthly records available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Map */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="rounded-3xl border border-violet-200 bg-violet-100/30 p-6 sm:p-8 shadow-sm backdrop-blur-md">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-[#0f172a]">Regional Office Location</h2>
                        <p className="text-[13px] text-[#64748b] mt-1">Geographic location of the electricity establishment.</p>
                    </div>
                    <div className="h-[400px] w-full rounded-2xl bg-[#f8f9fa] overflow-hidden border border-violet-100 shadow-inner">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={mapCenter}
                                zoom={14}
                                options={{
                                    restriction: { latLngBounds: GOPALPUR_BOUNDS, strictBounds: true },
                                    styles: [
                                        { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
                                        { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
                                    ],
                                }}
                            >
                                <Marker position={mapCenter} icon={AWC_MARKER_ICON} />
                            </GoogleMap>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center">
                                <MapPin size={24} className="text-rose-500 mb-2 animate-bounce" />
                                <p className="text-sm font-semibold text-slate-700">Loading map…</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value, color }: any) {
    const colorMap: Record<string, string> = {
        yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        pink: 'bg-pink-50 text-pink-600 border-pink-100',
    };
    return (
        <div className="flex gap-4 items-center">
            <div className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${colorMap[color]}`}>
                <Icon size={20} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">{label}</p>
                <p className="text-[15px] font-black text-[#0f172a] truncate">{formatVal(value)}</p>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colorClasses: Record<string, string> = {
        yellow: 'border-yellow-200 bg-yellow-100/40 text-yellow-900',
        blue: 'border-blue-200 bg-blue-100/40 text-blue-900',
        purple: 'border-purple-200 bg-purple-100/40 text-purple-900',
        orange: 'border-orange-200 bg-orange-100/40 text-orange-900',
    };
    const iconWrapper: Record<string, string> = {
        yellow: 'bg-yellow-200/50 text-yellow-700',
        blue: 'bg-blue-200/50 text-blue-700',
        purple: 'bg-purple-200/50 text-purple-700',
        orange: 'bg-orange-200/50 text-orange-700',
    };

    return (
        <div className={`rounded-3xl border p-6 shadow-sm flex justify-between items-center backdrop-blur-sm ${colorClasses[color]}`}>
            <div className="min-w-0">
                <p className="text-[12px] font-black uppercase tracking-wider opacity-70 mb-1">{label}</p>
                <h3 className="text-[26px] sm:text-[28px] font-black leading-none truncate">{formatVal(value)}</h3>
            </div>
            <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ml-3 shadow-inner ${iconWrapper[color]}`}>
                <Icon size={28} strokeWidth={2.5} />
            </div>
        </div>
    );
}
