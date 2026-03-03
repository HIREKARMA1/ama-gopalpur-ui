'use client';

import { useState, useMemo } from 'react';
import {
    Organization,
    ElectricityMaster,
    ElectricityStaff,
    ElectricityDaily,
    ElectricityMonthly,
} from '../../services/api';
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
    Shield,
    Factory,
    CheckCircle2,
    Wrench,
    Truck,
    Bike,
    CreditCard,
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
import { useLanguage } from '../i18n/LanguageContext';
import { t } from '../i18n/messages';
import type { MessageKey } from '../i18n/messages';

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

// Card-style item used in facility details (mirrors Education dashboard design)
function ElectricityResourceItem({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: unknown;
    icon: any;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
        slate: 'bg-slate-100 text-slate-600 border-slate-200',
        teal: 'bg-teal-50 text-teal-600 border-teal-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        pink: 'bg-pink-50 text-pink-600 border-pink-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        sky: 'bg-sky-50 text-sky-600 border-sky-100',
    };

    return (
        <div className="flex gap-4 items-center">
            <div
                className={`hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    colorMap[color] || colorMap.slate
                }`}
            >
                <Icon size={20} strokeWidth={2} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748b] mb-1">
                    {label}
                </p>
                <p className="text-[15px] font-bold text-[#0f172a] truncate">
                    {formatVal(value)}
                </p>
            </div>
        </div>
    );
}

// Icon/color mapping per electricity attribute (snake_case key)
function getElectricityFieldConfig(key: string): { icon: any; color: string } {
    const config: Record<string, { icon: any; color: string }> = {
        institution_type: { icon: Building, color: 'indigo' },
        institution_id_code: { icon: Hash, color: 'slate' },
        ownership: { icon: Shield, color: 'amber' },
        parent_organization: { icon: Building, color: 'violet' },
        hierarchy_level: { icon: Activity, color: 'sky' },
        host_institution_if_training_center: { icon: Building, color: 'emerald' },
        established_year: { icon: Calendar, color: 'blue' },
        commissioned_year_substations: { icon: Calendar, color: 'teal' },

        full_address: { icon: MapPin, color: 'emerald' },
        pin_code: { icon: MapPin, color: 'slate' },
        in_charge_name: { icon: User, color: 'indigo' },
        in_charge_designation: { icon: Users, color: 'violet' },
        in_charge_contact: { icon: Phone, color: 'teal' },
        in_charge_email: { icon: Mail, color: 'sky' },
        office_phone: { icon: Phone, color: 'blue' },
        office_email: { icon: Mail, color: 'indigo' },
        website: { icon: Globe, color: 'blue' },
        office_hours: { icon: Clock, color: 'slate' },

        voltage_level_primary_kv: { icon: Zap, color: 'amber' },
        voltage_level_secondary_kv: { icon: Zap, color: 'orange' },
        installed_capacity_mva: { icon: TrendingUp, color: 'emerald' },
        no_of_transformers: { icon: Settings, color: 'sky' },
        transformer_ratings_mva_comma_separated: { icon: Settings, color: 'violet' },
        no_of_incoming_feeders: { icon: Activity, color: 'indigo' },
        no_of_outgoing_feeders: { icon: Activity, color: 'emerald' },
        total_feeders: { icon: Activity, color: 'blue' },
        bays_count: { icon: Hash, color: 'slate' },
        switchgear_type_gis_ais_hybrid: { icon: Settings, color: 'rose' },
        '33kv_feeder_length_km': { icon: Activity, color: 'sky' },
        '11kv_feeder_length_km': { icon: Activity, color: 'teal' },
        lt_line_length_km: { icon: Activity, color: 'orange' },
        no_of_distribution_transformers_dts: { icon: Settings, color: 'purple' },
        dt_total_capacity_kva: { icon: TrendingUp, color: 'emerald' },

        consumers_under_jurisdiction_approx: { icon: Users, color: 'blue' },
        consumers_domestic_count: { icon: Home, color: 'emerald' },
        consumers_commercial_count: { icon: Building, color: 'indigo' },
        consumers_industrial_count: { icon: Factory, color: 'violet' },
        consumers_agricultural_count: { icon: Activity, color: 'amber' },
        connected_load_mw: { icon: Zap, color: 'orange' },

        at_c_loss_percent: { icon: AlertTriangle, color: 'rose' },
        billing_efficiency_percent: { icon: FileText, color: 'blue' },
        collection_efficiency_percent: { icon: FileText, color: 'emerald' },
        hours_of_supply_rural: { icon: Clock, color: 'teal' },
        hours_of_supply_urban: { icon: Clock, color: 'indigo' },
        complaints_registered_last_year: { icon: AlertTriangle, color: 'rose' },
        complaints_redressed_last_year: { icon: CheckCircle2, color: 'emerald' },

        total_staff_count: { icon: Users, color: 'violet' },
        engineers_count: { icon: Settings, color: 'blue' },
        technical_staff_count: { icon: Wrench, color: 'teal' },
        linemen_count: { icon: Activity, color: 'amber' },
        contract_staff_count: { icon: Users, color: 'rose' },
        admin_office_staff_count: { icon: User, color: 'slate' },

        building_type_own_rented: { icon: Building, color: 'slate' },
        total_floors: { icon: Building, color: 'indigo' },
        office_area_sq_ft: { icon: MapPin, color: 'emerald' },
        training_center_yes_no: { icon: Users, color: 'violet' },
        training_capacity_seats: { icon: Users, color: 'blue' },
        workshop_garage_yes_no: { icon: Wrench, color: 'orange' },
        store_yes_no: { icon: FileText, color: 'slate' },
        dg_set_yes_no: { icon: Zap, color: 'amber' },
        solar_yes_no: { icon: Zap, color: 'yellow' },
        vehicles_count: { icon: Truck, color: 'sky' },
        two_wheelers_count: { icon: Bike, color: 'pink' },

        annual_revenue_cr_approx: { icon: CreditCard, color: 'emerald' },
        billing_cr_last_year: { icon: CreditCard, color: 'blue' },
        data_as_on_yyyy_mm_dd: { icon: Calendar, color: 'slate' },
        'remarks_description': { icon: FileText, color: 'slate' },
    } as any;

    const direct = config[key];
    if (direct) return direct;

    // Heuristic fallbacks by key fragment
    const k = key.toLowerCase();
    if (k.includes('address') || k.includes('block') || k.includes('village')) {
        return { icon: MapPin, color: 'emerald' };
    }
    if (k.includes('phone') || k.includes('contact')) {
        return { icon: Phone, color: 'teal' };
    }
    if (k.includes('email')) {
        return { icon: Mail, color: 'sky' };
    }
    if (k.includes('voltage') || k.includes('kv')) {
        return { icon: Zap, color: 'amber' };
    }
    if (k.includes('transformer') || k.includes('feeder') || k.includes('dt_')) {
        return { icon: Settings, color: 'indigo' };
    }
    if (k.includes('consumer') || k.includes('load')) {
        return { icon: Users, color: 'blue' };
    }
    if (k.includes('complaint') || k.includes('outage')) {
        return { icon: AlertTriangle, color: 'rose' };
    }
    if (k.includes('staff') || k.includes('engineer') || k.includes('linemen')) {
        return { icon: Users, color: 'violet' };
    }
    if (k.includes('revenue') || k.includes('billing') || k.includes('loss')) {
        return { icon: CreditCard, color: 'emerald' };
    }

    return { icon: FileText, color: 'slate' };
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
    const { language } = useLanguage();
    const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY });
    const [detailTab, setDetailTab] = useState<string>('profile');

    const snakeFromHeader = (label: string): string =>
        label
            .trim()
            .replace(/[-\s/]+/g, '_')
            .replace(/[()]/g, '')
            .replace(/[?]/g, '')
            .toLowerCase()
            .replace(/^_+|_+$/g, '');

    const ELECTRICITY_GROUPS = [
        {
            title: "Administration & Organization",
            fields: [
                "INSTITUTION TYPE", "INSTITUTION ID/CODE", "OWNERSHIP", "PARENT ORGANIZATION",
                "HIERARCHY LEVEL", "HOST INSTITUTION (IF TRAINING CENTER)", "ESTABLISHED YEAR", "COMMISSIONED YEAR (SUBSTATIONS)"
            ]
        },
        {
            title: "Location & Primary Contact",
            fields: [
                "FULL ADDRESS", "PIN CODE", "LATITUDE", "LONGITUDE", "IN-CHARGE NAME",
                "IN-CHARGE DESIGNATION", "IN-CHARGE CONTACT", "IN-CHARGE EMAIL", "OFFICE PHONE",
                "OFFICE EMAIL", "WEBSITE", "OFFICE HOURS"
            ]
        },
        {
            title: "Technical Infrastructure",
            fields: [
                "VOLTAGE LEVEL PRIMARY (kV)", "VOLTAGE LEVEL SECONDARY (kV)", "INSTALLED CAPACITY (MVA)",
                "NO OF TRANSFORMERS", "TRANSFORMER RATINGS MVA (COMMA SEPARATED)", "NO OF INCOMING FEEDERS",
                "NO OF OUTGOING FEEDERS", "TOTAL FEEDERS", "BAYS (COUNT)", "SWITCHGEAR TYPE (GIS/AIS/HYBRID)",
                "33kV FEEDER LENGTH (KM)", "11kV FEEDER LENGTH (KM)", "LT LINE LENGTH (KM)",
                "NO OF DISTRIBUTION TRANSFORMERS (DTs)", "DT TOTAL CAPACITY (kVA)"
            ]
        },
        {
            title: "Service & Consumer Metrics",
            fields: [
                "TOLL-FREE/CUSTOMER CARE NUMBER", "HELPLINE AVAILABLE (YES/NO)", "CONSUMERS UNDER JURISDICTION (APPROX)",
                "CONSUMERS DOMESTIC (COUNT)", "CONSUMERS COMMERCIAL (COUNT)", "CONSUMERS INDUSTRIAL (COUNT)",
                "CONSUMERS AGRICULTURAL (COUNT)", "CONSUMERS OTHER (COUNT)", "HT CONSUMERS (COUNT)",
                "LT CONSUMERS (COUNT)", "CONNECTED LOAD (MW)"
            ]
        },
        {
            title: "Performance & Billing",
            fields: [
                "AT&C LOSS PERCENT", "BILLING EFFICIENCY PERCENT", "COLLECTION EFFICIENCY PERCENT",
                "HOURS OF SUPPLY RURAL", "HOURS OF SUPPLY URBAN", "COMPLAINTS REGISTERED LAST YEAR",
                "COMPLAINTS REDRESSED LAST YEAR", "CONSUMER CARE COUNTER (YES/NO)", "BILLING FACILITY (YES/NO)",
                "ONLINE PAYMENT (YES/NO)", "MOBILE APP (YES/NO)", "ONLINE COMPLAINT PORTAL (YES/NO)",
                "CUSTOMER CARE EMAIL", "GRIEVANCE REDRESSAL FORUM (YES/NO)"
            ]
        },
        {
            title: "Staffing & Coverage",
            fields: [
                "TOTAL STAFF (COUNT)", "ENGINEERS (COUNT)", "TECHNICAL STAFF (COUNT)", "LINEMEN (COUNT)",
                "CONTRACT STAFF (COUNT)", "ADMIN/OFFICE STAFF (COUNT)", "VILLAGES/LOCALITIES COVERED (COUNT)",
                "GPs COVERED (COUNT)", "AREA COVERED SQ KM"
            ]
        },
        {
            title: "Assets & Facilities",
            fields: [
                "BUILDING TYPE (OWN/RENTED)", "TOTAL FLOORS", "OFFICE AREA SQ FT", "TRAINING CENTER (YES/NO)",
                "TRAINING CAPACITY SEATS", "WORKSHOP/GARAGE (YES/NO)", "STORE (YES/NO)", "DG SET (YES/NO)",
                "SOLAR (YES/NO)", "VEHICLES (COUNT)", "TWO-WHEELERS (COUNT)"
            ]
        },
        {
            title: "Financials & Records",
            fields: [
                "ANNUAL REVENUE CR (APPROX)", "BILLING CR LAST YEAR", "DATA AS ON (YYYY-MM-DD)", "REMARKS/DESCRIPTION"
            ]
        }
    ];
    const ELECTRICITY_GROUP_TITLE_KEYS: Record<string, MessageKey> = {
        "Administration & Organization": "electricity.group.adminOrg",
        "Location & Primary Contact": "electricity.group.locationContact",
        "Technical Infrastructure": "electricity.group.technicalInfra",
        "Service & Consumer Metrics": "electricity.group.serviceConsumer",
        "Performance & Billing": "electricity.group.performanceBilling",
        "Staffing & Coverage": "electricity.group.staffingCoverage",
        "Assets & Facilities": "electricity.group.assetsFacilities",
        "Financials & Records": "electricity.group.financialsRecords",
    };
    const ELECTRICITY_FIELD_LABEL_KEYS: Record<string, MessageKey> = {
        "INSTITUTION TYPE": "electricity.field.institutionType",
        "INSTITUTION ID/CODE": "electricity.field.institutionIdCode",
        "OWNERSHIP": "electricity.field.ownership",
        "PARENT ORGANIZATION": "electricity.field.parentOrganization",
        "HIERARCHY LEVEL": "electricity.field.hierarchyLevel",
        "HOST INSTITUTION (IF TRAINING CENTER)": "electricity.field.hostInstitution",
        "ESTABLISHED YEAR": "electricity.field.establishedYear",
        "COMMISSIONED YEAR (SUBSTATIONS)": "electricity.field.commissionedYearSubstations",

        "FULL ADDRESS": "electricity.field.fullAddress",
        "PIN CODE": "electricity.field.pinCode",
        "LATITUDE": "electricity.field.latitude",
        "LONGITUDE": "electricity.field.longitude",
        "IN-CHARGE NAME": "electricity.field.inChargeName",
        "IN-CHARGE DESIGNATION": "electricity.field.inChargeDesignation",
        "IN-CHARGE CONTACT": "electricity.field.inChargeContact",
        "IN-CHARGE EMAIL": "electricity.field.inChargeEmail",
        "OFFICE PHONE": "electricity.field.officePhone",
        "OFFICE EMAIL": "electricity.field.officeEmail",
        "WEBSITE": "electricity.field.website",
        "OFFICE HOURS": "electricity.field.officeHours",

        "VOLTAGE LEVEL PRIMARY (kV)": "electricity.field.voltageLevelPrimary",
        "VOLTAGE LEVEL SECONDARY (kV)": "electricity.field.voltageLevelSecondary",
        "INSTALLED CAPACITY (MVA)": "electricity.field.installedCapacity",
        "NO OF TRANSFORMERS": "electricity.field.noOfTransformers",
        "TRANSFORMER RATINGS MVA (COMMA SEPARATED)": "electricity.field.transformerRatings",
        "NO OF INCOMING FEEDERS": "electricity.field.noOfIncomingFeeders",
        "NO OF OUTGOING FEEDERS": "electricity.field.noOfOutgoingFeeders",
        "TOTAL FEEDERS": "electricity.field.totalFeedersLabel",
        "BAYS (COUNT)": "electricity.field.baysCount",
        "SWITCHGEAR TYPE (GIS/AIS/HYBRID)": "electricity.field.switchgearType",
        "33kV FEEDER LENGTH (KM)": "electricity.field.feeder33kvLength",
        "11kV FEEDER LENGTH (KM)": "electricity.field.feeder11kvLength",
        "LT LINE LENGTH (KM)": "electricity.field.ltLineLength",
        "NO OF DISTRIBUTION TRANSFORMERS (DTs)": "electricity.field.noOfDistributionTransformers",
        "DT TOTAL CAPACITY (kVA)": "electricity.field.dtTotalCapacity",

        "TOLL-FREE/CUSTOMER CARE NUMBER": "electricity.field.tollFreeNumber",
        "HELPLINE AVAILABLE (YES/NO)": "electricity.field.helplineAvailable",
        "CONSUMERS UNDER JURISDICTION (APPROX)": "electricity.field.consumersUnderJurisdiction",
        "CONSUMERS DOMESTIC (COUNT)": "electricity.field.consumersDomestic",
        "CONSUMERS COMMERCIAL (COUNT)": "electricity.field.consumersCommercial",
        "CONSUMERS INDUSTRIAL (COUNT)": "electricity.field.consumersIndustrial",
        "CONSUMERS AGRICULTURAL (COUNT)": "electricity.field.consumersAgricultural",
        "CONSUMERS OTHER (COUNT)": "electricity.field.consumersOther",
        "HT CONSUMERS (COUNT)": "electricity.field.htConsumers",
        "LT CONSUMERS (COUNT)": "electricity.field.ltConsumers",
        "CONNECTED LOAD (MW)": "electricity.field.connectedLoad",

        "AT&C LOSS PERCENT": "electricity.field.atcLossPercent",
        "BILLING EFFICIENCY PERCENT": "electricity.field.billingEfficiencyPercent",
        "COLLECTION EFFICIENCY PERCENT": "electricity.field.collectionEfficiencyPercent",
        "HOURS OF SUPPLY RURAL": "electricity.field.hoursSupplyRural",
        "HOURS OF SUPPLY URBAN": "electricity.field.hoursSupplyUrban",
        "COMPLAINTS REGISTERED LAST YEAR": "electricity.field.complaintsRegisteredLastYear",
        "COMPLAINTS REDRESSED LAST YEAR": "electricity.field.complaintsRedressedLastYear",
        "CONSUMER CARE COUNTER (YES/NO)": "electricity.field.consumerCareCounter",
        "BILLING FACILITY (YES/NO)": "electricity.field.billingFacility",
        "ONLINE PAYMENT (YES/NO)": "electricity.field.onlinePayment",
        "MOBILE APP (YES/NO)": "electricity.field.mobileApp",
        "ONLINE COMPLAINT PORTAL (YES/NO)": "electricity.field.onlineComplaintPortal",
        "CUSTOMER CARE EMAIL": "electricity.field.customerCareEmail",
        "GRIEVANCE REDRESSAL FORUM (YES/NO)": "electricity.field.grievanceRedressalForum",

        "TOTAL STAFF (COUNT)": "electricity.field.totalStaff",
        "ENGINEERS (COUNT)": "electricity.field.engineersCountLabel",
        "TECHNICAL STAFF (COUNT)": "electricity.field.technicalStaffCountLabel",
        "LINEMEN (COUNT)": "electricity.field.linemanCount",
        "CONTRACT STAFF (COUNT)": "electricity.field.contractStaffCount",
        "ADMIN/OFFICE STAFF (COUNT)": "electricity.field.adminOfficeStaffCount",
        "VILLAGES/LOCALITIES COVERED (COUNT)": "electricity.field.villagesCovered",
        "GPs COVERED (COUNT)": "electricity.field.gpsCovered",
        "AREA COVERED SQ KM": "electricity.field.areaCoveredSqKm",

        "BUILDING TYPE (OWN/RENTED)": "electricity.field.buildingType",
        "TOTAL FLOORS": "electricity.field.totalFloorsLabel",
        "OFFICE AREA SQ FT": "electricity.field.officeAreaSqFt",
        "TRAINING CENTER (YES/NO)": "electricity.field.trainingCenter",
        "TRAINING CAPACITY SEATS": "electricity.field.trainingCapacitySeats",
        "WORKSHOP/GARAGE (YES/NO)": "electricity.field.workshopGarage",
        "STORE (YES/NO)": "electricity.field.store",
        "DG SET (YES/NO)": "electricity.field.dgSet",
        "SOLAR (YES/NO)": "electricity.field.solar",
        "VEHICLES (COUNT)": "electricity.field.vehiclesCountLabel",
        "TWO-WHEELERS (COUNT)": "electricity.field.twoWheelersCount",

        "ANNUAL REVENUE CR (APPROX)": "electricity.field.annualRevenueCr",
        "BILLING CR LAST YEAR": "electricity.field.billingCrLastYear",
        "DATA AS ON (YYYY-MM-DD)": "electricity.field.dataAsOn",
        "REMARKS/DESCRIPTION": "electricity.field.remarksDescriptionLabel",
    };
    const STAFF_ROLE_KEYS: Record<string, MessageKey> = {
        "In-Charge": "electricity.staff.role.inCharge",
        "Engineer": "electricity.staff.role.engineer",
        "Technical Staff": "electricity.staff.role.technical",
        "Lineman": "electricity.staff.role.lineman",
        "Admin Staff": "electricity.staff.role.admin",
    };
    const [monitorDate, setMonitorDate] = useState(new Date().toISOString().slice(0, 10));
    const [specsTab, setSpecsTab] = useState(0);

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

    // ---- Dynamic daily data helpers ----
    const sortedDaily = useMemo(
        () =>
            [...dailyReports].sort(
                (a, b) =>
                    new Date(a.record_date).getTime() - new Date(b.record_date).getTime(),
            ),
        [dailyReports],
    );
    const lastDaily = sortedDaily[sortedDaily.length - 1];

    // Top status: power supply
    let powerStatusKey: MessageKey = 'electricity.status.noData';
    if (lastDaily) {
        const u = lastDaily.supply_hours_urban ?? 0;
        const r = lastDaily.supply_hours_rural ?? 0;
        if (u >= 22 && r >= 20) powerStatusKey = 'electricity.status.available';
        else if (u > 0 || r > 0) powerStatusKey = 'electricity.status.partial';
        else powerStatusKey = 'electricity.status.outage';
    }

    // Top status: transformers working
    const totalTransformers =
        (electricityMaster?.no_of_transformers as number | null | undefined) ??
        (profile.no_of_transformers as number | null | undefined) ??
        null;
    const workingTransformers =
        (profile.transformers_working as number | null | undefined) ??
        totalTransformers ??
        null;

    // Top status: complaints today
    const complaintsToday = lastDaily?.complaints_received ?? null;

    // Top status: avg resolution time (approx from outages)
    let avgResolutionHours: number | null = null;
    if (lastDaily?.outages_duration_min != null && lastDaily.outages_duration_min > 0) {
        const denom =
            lastDaily.outages_count && lastDaily.outages_count > 0
                ? lastDaily.outages_count
                : lastDaily.complaints_resolved && lastDaily.complaints_resolved > 0
                    ? lastDaily.complaints_resolved
                    : 1;
        avgResolutionHours = +(
            lastDaily.outages_duration_min / 60 / denom
        ).toFixed(1);
    } else if (profile.avg_resolution_hours != null) {
        avgResolutionHours = Number(profile.avg_resolution_hours) || null;
    }

    // Infrastructure row
    const infraRow = {
        substation: org.name,
        transformers: totalTransformers,
        working: workingTransformers,
        faulty:
            totalTransformers != null && workingTransformers != null
                ? Math.max(totalTransformers - workingTransformers, 0)
                : null,
        loadPercent:
            electricityMaster?.installed_capacity_mva != null &&
                electricityMaster.connected_load_mw != null &&
                electricityMaster.installed_capacity_mva > 0
                ? +(
                    (Number(electricityMaster.connected_load_mw) /
                        Number(electricityMaster.installed_capacity_mva)) *
                    100
                ).toFixed(1)
                : null,
    };

    return (
        <div className="min-h-screen bg-slate-50/30 text-slate-800 font-sans pb-16">
            <section className="w-full">
                <ImageSlider images={images} altPrefix={org.name} className="h-[410px] sm:h-[400px]" />
            </section>

            <header className="mx-auto max-w-[1920px] px-4 pt-6 pb-4 sm:px-6 lg:px-8">
                <h1 className="text-xl font-bold tracking-tight text-[#1e293b] sm:text-3xl lg:text-[32px]">
                    {t('electricity.dashboard.title', language)}
                </h1>
                <p className="mt-1 text-[15px] font-medium text-[#64748b]">
                    {t('electricity.dashboard.subtitle', language)}
                </p>
            </header>

            {/* Top dynamic status pills */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700/80">
                                {t('electricity.top.powerStatus', language)}
                            </p>
                            <p className="mt-1 text-[16px] font-black text-emerald-900 truncate">
                                {t(powerStatusKey, language)}
                            </p>
                        </div>
                        <div className="ml-3 h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                            <Zap size={18} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-sky-200 bg-sky-50/60 px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-sky-700/80">
                                {t('electricity.top.transformers', language)}
                            </p>
                            <p className="mt-1 text-[16px] font-black text-sky-900 truncate">
                                {workingTransformers != null && totalTransformers != null
                                    ? `${workingTransformers} / ${totalTransformers}`
                                    : '—'}
                            </p>
                        </div>
                        <div className="ml-3 h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                            <Settings size={18} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-rose-700/80">
                                {t('electricity.top.complaintsToday', language)}
                            </p>
                            <p className="mt-1 text-[16px] font-black text-rose-900 truncate">
                                {complaintsToday != null ? complaintsToday : '—'}
                            </p>
                        </div>
                        <div className="ml-3 h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                            <AlertTriangle size={18} />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-700/80">
                                {t('electricity.top.avgResolution', language)}
                            </p>
                            <p className="mt-1 text-[16px] font-black text-indigo-900 truncate">
                                {avgResolutionHours != null ? `${avgResolutionHours} Hrs` : '—'}
                            </p>
                        </div>
                        <div className="ml-3 h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                            <Clock size={18} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Details Tabs */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 sm:p-8 shadow-sm backdrop-blur-md overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none border-l border-slate-50 hidden sm:block" />
                    <div className="relative z-10">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-[#64748b]">
                                {t('electricity.details.title', language)}
                            </h2>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start rounded-full bg-slate-100 p-1 w-full sm:w-auto">
                                {[
                                    { id: 'profile', label: t('electricity.tab.profile', language), icon: Building },
                                    { id: 'staff', label: t('electricity.tab.staff', language), icon: Users },
                                    ...ELECTRICITY_GROUPS.map((g) => {
                                        const key = ELECTRICITY_GROUP_TITLE_KEYS[g.title];
                                        return {
                                            id: g.title,
                                            label: key ? t(key, language) : g.title,
                                            icon: FileText,
                                        };
                                    }),
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setDetailTab(tab.id)}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                            detailTab === tab.id
                                                ? 'bg-white text-[#0f172a] shadow-sm'
                                                : 'text-[#64748b] hover:text-[#0f172a]'
                                        }`}
                                    >
                                        <tab.icon size={14} />
                                        <span className="hidden md:inline">{tab.label}</span>
                                        <span className="md:hidden">
                                            {tab.id === 'profile'
                                                ? t('electricity.tab.profile', language)
                                                : tab.id === 'staff'
                                                ? t('electricity.tab.staff', language)
                                                : tab.label.split('&')[0].split(' ')[0]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {detailTab === 'profile' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                <InfoItem icon={Building} label={t('electricity.stat.officeName', language)} value={org.name} color="yellow" />
                                <InfoItem icon={MapPin} label={t('electricity.stat.blockUlb', language)} value={block} color="emerald" />
                                <InfoItem icon={Home} label={t('electricity.stat.gpWard', language)} value={gpWard} color="amber" />
                                <InfoItem icon={MapPin} label={t('electricity.stat.locality', language)} value={village} color="violet" />
                                <InfoItem icon={Hash} label={t('electricity.stat.type', language)} value={electricityMaster?.institution_type || profile.institution_type} color="orange" />
                                <InfoItem icon={TrendingUp} label={t('electricity.stat.capacity', language)} value={formatVal(electricityMaster?.installed_capacity_mva || profile.installed_capacity_mva) + ' MVA'} color="blue" />
                                <InfoItem icon={Activity} label={t('electricity.stat.voltage', language)} value={formatVal(electricityMaster?.voltage_level_primary || profile['33kv_feeder_length_km'] ? '33kV' : '11kV')} color="rose" />
                                <InfoItem icon={MapPin} label={t('electricity.stat.coordinates', language)} value={latLongStr} color="pink" />
                            </div>
                        )}

                        {detailTab === 'staff' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {displayStaff.map((s: any, idx: number) => {
                                    const baseRole = typeof s.role === 'string' ? s.role.split('(')[0].trim() : '';
                                    const roleKey = baseRole && STAFF_ROLE_KEYS[baseRole];
                                    const roleLabel = roleKey ? t(roleKey, language) : s.role;
                                    return (
                                        <div key={idx} className="flex gap-4 items-center bg-white/40 p-3 rounded-2xl border border-white/50">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                                                <User size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {roleLabel}
                                                </p>
                                                <p className="text-[14px] font-bold text-slate-800 truncate">{s.name}</p>
                                                {s.contact && <p className="text-[12px] text-slate-500 font-medium">{s.contact}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                                {displayStaff.length === 0 && (
                                    <p className="col-span-full text-center text-slate-400 py-8 italic font-medium">
                                        {t('electricity.staff.empty', language)}
                                    </p>
                                )}
                            </div>
                        )}

                        {detailTab !== 'profile' && detailTab !== 'staff' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {(() => {
                                    const group = ELECTRICITY_GROUPS.find((g) => g.title === detailTab);
                                    if (!group) return null;
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {group.fields.map((field) => {
                                                const key = snakeFromHeader(field);
                                                const val = profile[key];
                                                if (
                                                    val == null ||
                                                    String(val).trim() === '' ||
                                                    String(val) === '—'
                                                ) {
                                                    return null;
                                                }
                                                const cfg = getElectricityFieldConfig(key);
                                                const labelKey = ELECTRICITY_FIELD_LABEL_KEYS[field];
                                                return (
                                                    <ElectricityResourceItem
                                                        key={field}
                                                        label={labelKey ? t(labelKey, language) : field}
                                                        value={val}
                                                        icon={cfg.icon}
                                                        color={cfg.color}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Stats */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        label={t('electricity.main.voltagePrimary', language)}
                        value={(electricityMaster?.voltage_level_primary || profile.voltage_level_primary_kv || 0) + ' kV'}
                        icon={Zap}
                        color="yellow"
                    />
                    <StatCard
                        label={t('electricity.main.totalFeeders', language)}
                        value={electricityMaster?.total_feeders || profile.total_feeders}
                        icon={Activity}
                        color="blue"
                    />
                    <StatCard
                        label={t('electricity.main.totalConsumers', language)}
                        value={electricityMaster?.consumers_total || profile.consumers_under_jurisdiction_approx}
                        icon={Users}
                        color="purple"
                    />
                    <StatCard
                        label={t('electricity.main.atcLoss', language)}
                        value={(electricityMaster?.at_c_loss_percent || profile.at_c_loss_percent || 0) + '%'}
                        icon={Settings}
                        color="orange"
                    />
                </div>
            </section>

            {/* Monitoring Section */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 sm:p-8 shadow-sm backdrop-blur-md">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-[#0f172a]">
                            {t('electricity.ops.title', language)}
                        </h2>
                        <p className="text-[13px] text-[#64748b] mt-1">
                            {t('electricity.ops.subtitle', language)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 2️⃣ Daily Power Supply Trend (Bar chart, last 15 days) */}
                        <div className="rounded-2xl border border-slate-100 bg-white/70 p-6 flex flex-col h-[350px]">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-[#0f172a]">
                                        {t('electricity.ops.dailySupplyTitle', language)}
                                    </h3>
                                    <p className="text-[11px] text-[#64748b]">
                                        {t('electricity.ops.dailySupplySubtitle', language)}
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            {t('electricity.ops.legend.urban', language)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                            {t('electricity.ops.legend.rural', language)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={sortedDaily.slice(-15).map((d) => ({
                                            date: d.record_date
                                                .slice(5, 10)
                                                .split('-')
                                                .reverse()
                                                .join('/'),
                                            urban: d.supply_hours_urban ?? 0,
                                            rural: d.supply_hours_rural ?? 0,
                                        }))}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#f1f5f9"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                fill: '#94a3b8',
                                            }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                fill: '#94a3b8',
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow:
                                                    '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontSize: '12px',
                                            }}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Bar
                                            dataKey="urban"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                            barSize={20}
                                            name={t('electricity.ops.bar.urban', language)}
                                        />
                                        <Bar
                                            dataKey="rural"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                            barSize={20}
                                            name={t('electricity.ops.bar.rural', language)}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 3️⃣ Fault & Complaint Trend (Line chart) */}
                        <div className="rounded-2xl border border-slate-100 bg-white/70 p-6 flex flex-col h-[350px]">
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-[#0f172a]">
                                    {t('electricity.ops.dailyComplaintTitle', language)}
                                </h3>
                                <p className="text-[11px] text-[#64748b]">
                                    {t('electricity.ops.dailyComplaintSubtitle', language)}
                                </p>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={sortedDaily.slice(-15).map((d) => ({
                                            date: d.record_date
                                                .slice(5, 10)
                                                .split('-')
                                                .reverse()
                                                .join('/'),
                                            received: d.complaints_received ?? 0,
                                            resolved: d.complaints_resolved ?? 0,
                                        }))}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#f1f5f9"
                                        />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                fill: '#94a3b8',
                                            }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 10,
                                                fontWeight: 600,
                                                fill: '#94a3b8',
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow:
                                                    '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="received"
                                            stroke="#ef4444"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: '#ef4444',
                                                strokeWidth: 2,
                                                stroke: '#fff',
                                            }}
                                            activeDot={{ r: 6 }}
                                            name={t('electricity.ops.line.received', language)}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="resolved"
                                            stroke="#22c55e"
                                            strokeWidth={3}
                                            dot={{
                                                r: 4,
                                                fill: '#22c55e',
                                                strokeWidth: 2,
                                                stroke: '#fff',
                                            }}
                                            activeDot={{ r: 6 }}
                                            name={t('electricity.ops.line.resolved', language)}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Monthly Progress */}
            <section className="mx-auto max-w-[1920px] px-4 sm:px-6 lg:px-8 mb-8">
                <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 sm:p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-[#0f172a] mb-6">
                        {t('electricity.monthly.title', language)}
                    </h2>
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-slate-600">
                                        {t('electricity.monthly.col.month', language)}
                                    </th>
                                    <th className="px-6 py-4 font-bold text-slate-600">
                                        {t('electricity.monthly.col.units', language)}
                                    </th>
                                    <th className="px-6 py-4 font-bold text-slate-600">
                                        {t('electricity.monthly.col.revenue', language)}
                                    </th>
                                    <th className="px-6 py-4 font-bold text-slate-600">
                                        {t('electricity.monthly.col.loss', language)}
                                    </th>
                                    <th className="px-6 py-4 font-bold text-slate-600">
                                        {t('electricity.monthly.col.efficiency', language)}
                                    </th>
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
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            {t('electricity.monthly.empty', language)}
                                        </td>
                                    </tr>
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
                        <h2 className="text-xl font-bold text-[#0f172a]">
                            {t('electricity.map.title', language)}
                        </h2>
                        <p className="text-[13px] text-[#64748b] mt-1">
                            {t('electricity.map.subtitle', language)}
                        </p>
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
                                <p className="text-sm font-semibold text-slate-700">
                                    {t('electricity.map.loading', language)}
                                </p>
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
