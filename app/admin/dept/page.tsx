'use client';

import { useEffect, useState, FormEvent, type Dispatch, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  authApi,
  organizationsApi,
  departmentsApi,
  profileApi,
  clearToken,
  getToken,
  educationApi,
  healthApi,
  electricityApi,
  arcsApi,
  watcoApi,
  minorIrrigationApi,
  revenueLandApi,
  agricultureApi,
  Organization,
  User,
  Department,
  CenterProfile,
} from '../../../services/api';
import { SuperAdminDashboardLayout } from '../../../components/layout/SuperAdminDashboardLayout';
import { useLanguage } from '../../../components/i18n/LanguageContext';
import { t } from '../../../components/i18n/messages';
import { Loader } from '../../../components/common/Loader';
import { DepartmentMapSummaryEditor } from '../../../components/admin/DepartmentMapSummaryEditor';
import { compressImage } from '../../../lib/imageCompression';
import {
  EducationPsPortfolioAdminForm,
  type PsPortfolioOrgFields,
} from '../../../components/admin/EducationPsPortfolioAdminForm';
import { ArcsPortfolioAdminForm, ARCS_FIELD_LIMITS, CharCount } from '../../../components/admin/ArcsPortfolioAdminForm';
import {
  HealthPortfolioAdminForm,
  normalizeHealthFacilityCardsForSave,
} from '../../../components/admin/HealthPortfolioAdminForm';
import {
  MinorIrrigationPortfolioAdminForm,
  MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM,
} from '../../../components/admin/MinorIrrigationPortfolioAdminForm';
import {
  AGRICULTURE_PORTFOLIO_EMPTY_FORM,
  AgriculturePortfolioAdminForm,
  normalizeAgricultureFacilityCardsForSave,
} from '../../../components/admin/AgriculturePortfolioAdminForm';
import {
  AwcPortfolioAdminForm,
  centerProfileToExtras,
  emptyAwcProfileExtras,
  extrasToPartialProfile,
} from '../../../components/admin/AwcPortfolioAdminForm';

/** ICDS minister CSV: all attributes for AWC profile (no SL NO; use system-generated org id). */
const ICDS_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE,NAME OF AWC,AWC ID,BUILDING STATUS,LATITUDE,LONGITUDE,STUDENT STRENGTH,CPDO NAME,CPDO CONTACT NO,SUPERVISOR NAME,SUPERVISOR CONTACT NAME,AWW NAME,AWW CONTACT NO,AWH NAME,AWH CONTACT NO,DESCRIPTION,SECTOR,LGD CODE\n';

const EDUCATION_CSV_COMMON_PREFIX =
  'BLOCK/ULB,GP/WARD,VILLAGE,NAME OF SCHOOL,SCHOOL ID,ESST YEAR,CATEGORY';
const EDUCATION_CSV_COMMON_SUFFIX =
  'DEO NAME,DEO CONTACT,BEO NAME,BEO CONTACT,BRCC NAME,BRCC CONTACT,CRCC NAME,CRCC CONTACT,NAME OF HM,CONTACT OF HM,NO OF TS,NO OF NTS,NO OF TGP(PCM),NO OF TGP(CBZ),NO OF TGT(ARTS),BUILDING STATUS,NO OF ROOMS,NO OF SMART CLASS ROOMS,SCIENCE LAB,TOILET(M),TOILET(F),RAMP,MEETING HALL,STAFF COMMON ROOM,NCC,NSS,JRC,ECO CLUB,LIBRARY,ICC HEAD NAME,ICC HEAD CONTACT,PLAY GROUND,CYCLE STAND,DRINKING WATER(TW),DRINKING WATER(TAP),DRINKING WATER(OVERHEAD TAP),DRINKING WATER(AQUAGUARD),LATITUDE,LONGITUDE,DESCRIPTION';
const HEALTH_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE,LATITUDE,LONGITUDE,NAME,INSTITUTION ID,CATEGORY,INST HEAD NAME,INST HEAD CONTACT,NO OF TS,NO OF NTS,NO OF MO,NO OF PHARMACIST,NO OF ANM,NO OF HEALTH WORKER,NO OF PATHOLOGY,NO OF CLERK,NO OF SWEEPER,NO OF NW,NO OF BED,NO OF ICU,X-RAY AVAILABILTY,CT-SCAN AVAILABILITY,AVAILABILITY OF PATHOLOGY TESTING,DESCRIPTION\n';

const WATCO_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE/LOCALITY,STATION ID,STATION NAME,STATION TYPE,LOCATION,LATITUDE,LONGITUDE,COMMISSIONING DATE,SCHEME NAME,POPULATION SERVED,SOURCE TYPE,SOURCE NAME,INTAKE CAPACITY (MLD),TURBIDITY,PH,TDS,HARDNESS,IRON,FLUORIDE,SEASONAL VARIATION NOTES,WTP TYPE,DESIGN CAPACITY (MLD),OPERATIONAL CAPACITY (MLD),FLASH MIXER,CLARIFLOCCULATOR,RSF UNITS,CHLORINATION SYSTEM,SLUDGE DISPOSAL METHOD,PUMP TYPE,NO. OF WORKING PUMPS,NO. OF STANDBY PUMPS,PUMP CAPACITY (M3/HR),HEAD (M),MOTOR RATING (KW),POWER SOURCE,DG CAPACITY (KVA),NO. OF ESR,ESR CAPACITY (KL),GLR CAPACITY (KL),TOTAL PIPELINE LENGTH (KM),PIPE MATERIAL,ZONES/DMAS,HOUSEHOLDS COVERED,TOTAL CONNECTIONS,SUPPLY HOURS/DAY,PER CAPITA SUPPLY (LPCD),NRW (%),COMPLAINTS/MONTH,CAPEX COST,ANNUAL O&M COST,ELECTRICITY COST/MONTH,CHEMICAL COST/MONTH,MANPOWER COST,REVENUE COLLECTION\n';

const EDUCATION_ENGINEERING_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE,NAME OF COLLEGE,INSTITUTION ID,ESTABLISHED YEAR,CAMPUS AREA (ACRES),AFFILIATING UNIVERSITY,AUTONOMOUS (YES/NO),AUTONOMOUS SINCE YEAR,COLLEGE TYPE,PIN CODE,LATITUDE,LONGITUDE,PRINCIPAL NAME,PRINCIPAL CONTACT,PRINCIPAL EMAIL,COLLEGE PHONE,COLLEGE EMAIL,WEBSITE,AICTE APPROVAL(YES/NO),NAAC,NBA,NIRF RANKING,AARIIA-ATAL RANKING,B.TECH BRANCHES COUNT,M.TECH PROGRAMMES COUNT,PH.D. (YES/NO),DEPARTMENTS (COMMA SEPARATED),TOTAL INTAKE UG AUTOMOBILE ENGINEERING,TOTAL INTAKE UG CHEMICAL ENGINEERING,TOTAL INTAKE UG CIVIL ENGINEERING,TOTAL INTAKE UG COMPUTER SCIENCE ENGINEERING,TOTAL INTAKE UG ELECTRICAL ENGINEERING,TOTAL INTAKE UG ELECTRONICS & TELECOMMUNICATION ENGINEERING,TOTAL INTAKE UG MECHANICAL ENGINEERING,TOTAL INTAKE UG METALLURGICAL AND MATERIALS ENGINEERING,TOTAL INTAKE UG PRODUCTION ENGINEERING,TOTAL INTAKE PG DEPARTMENTS WISE (COMMA SEPARATED),TOTAL NO OF FACULTY AUTOMOBILE ENGINEERING,TOTAL NO OF FACULTY CHEMICAL ENGINEERING,TOTAL NO OF FACULTY CIVIL ENGINEERING,TOTAL NO OF FACULTY COMPUTER SCIENCE ENGINEERING,TOTAL NO OF FACULTY ELECTRICAL ENGINEERING,TOTAL NO OF FACULTY ELECTRONICS & TELECOMMUNICATION ENGINEERING,TOTAL NO OF FACULTY MECHANICAL ENGINEERING,TOTAL NO OF FACULTY METALLURGICAL AND MATERIALS ENGINEERING,TOTAL NO OF FACULTY PRODUCTION ENGINEERING,TOTAL NO OF FACULTY BASIC SCIENCE,TOTAL NO OF FACULTY HUMANITIES AND SOCIAL SCIENCE,NO OF CLASSROOMS,NO OF LABS BRACH WISE(COMMA SEPARATED),NO OF SMART CLASSROOMS,WORKSHOP,HOSTEL,HOSTEL CAPACITY BOYS,HOSTEL CAPACITY GIRLS,GUEST HOUSE,BANKING,CANTEEN,GYMNASIUM,WIFI AVAILABILITY,PLAYGROUND,GARDEN,TRANSPORT FASCILITY,PARKING FASCILITY,STAFF ACCOMMODATION,SECURITY,CCTV,RAMP (ACCESSIBILITY),DRINKING WATER,ELECTRICITY,NSS,NCC,IQAC,ICC,ICC HEAD NAME,ICC HEAD CONTACT,GRIEVANCE CELL HEAD,GRIEVANCE CELL HEAD CONTACT,ANTI-RAGGING CELL HEAD,ANTI-RAGGING CELL HEAD CONTACT,INNOVATION AND STARTUP FASCILITY,ROBOTICS CLUB,CULTURAL CLUBS,SPORTS AND ATHLETICS FASCILITY,E-MAGAZINE,TEQIP,RESEARCH PROJECTS COUNT,PATENTS COUNT,MOU COUNT,CENTRE OF EXCELLENCE(COMMA SEPARATED),INCUBATION CENTRE(AVAILABILITY),PLACEMENT CELL,PLACEMENT OFFICER NAME,PLACEMENT OFFICER CONTACT,PLACEMENT PERCENTAGE (LAST YEAR),HIGHEST PACKAGE (LPA),INTERNSHIP,NAME OF DEANS/PIC/FIC/OIC/REGISTRAR,SCHORLASHIP FASCILITY,NOTABLE AWARDS OR ACHIEVEMENTS,DESCRIPTION\n';

const EDUCATION_ITI_CSV_HEADER =
  'ITI NAME,ITI CODE,STATE,DISTRICT,BLOCK/ULB,GP/WARD,VILLAGE/LOCALITY,OWNERSHIP (GOVT/PRIVATE/AIDED),AFFILIATION,AFFILIATING BODY,ESTABLISHED YEAR,PIN CODE,LATITUDE,LONGITUDE,PRINCIPAL/SUPERINTENDENT NAME,PRINCIPAL CONTACT,PRINCIPAL EMAIL,ITI PHONE,ITI EMAIL,WEBSITE,TOTAL TRADES (COUNT),TRADES OFFERED (LIST COMMA SEPARATED),TOTAL SEATS (ALL TRADES),TRADE-WISE SEATS (LIST COMMA SEPARATED),TOTAL TRAINEES ENROLLED,MALE TRAINEES,FEMALE TRAINEES,SC TRAINEES,ST TRAINEES,OBC TRAINEES,EWS TRAINEES,GENERAL TRAINEES,MINORITY TRAINEES,PWD TRAINEES,HOST STATE TRAINEES,OTHER STATE TRAINEES,ADMISSION MODE (MERIT/ENTRANCE/OTHER),MINIMUM ENTRY QUALIFICATION (8TH/10TH/12TH),TUITION/COURSE FEE PER YEAR (Rs),GOVT SCHOLARSHIPS (YES/NO),INSTITUTIONAL SCHOLARSHIPS (YES/NO),TOTAL INSTRUCTORS,TOTAL INSTRUCTORS REGULAR,TOTAL INSTRUCTORS CONTRACT,TOTAL INSTRUCTORS WITH CITS,TOTAL INSTRUCTORS WITH NAC/NTC & ITI,TOTAL INSTRUCTORS WITH INDUSTRY EXPERIENCE,TOTAL NON-TEACHING STAFF,TOTAL WORKSHOP STAFF (INSTRUCTORS/ASSISTANTS),CENTRAL LIBRARY/READING ROOM (YES/NO),LIBRARY BOOKS (COUNT),DIGITAL LEARNING MATERIALS (YES/NO),COMPUTER LAB (YES/NO),TOTAL COMPUTERS,WIFI CAMPUS (YES/NO),NO OF THEORY CLASSROOMS,NO OF WORKSHOPS,EQUIPMENT AS PER NCVT NORMS (YES/NO),SAFETY EQUIPMENT AVAILABLE (YES/NO),POWER SUPPLY (YES/NO),POWER BACKUP (GENERATOR/INVERTER) (YES/NO),HOSTEL (YES/NO),HOSTEL CAPACITY BOYS,HOSTEL CAPACITY GIRLS,CANTEEN (YES/NO),DRINKING WATER (YES/NO),TOILETS (M/F/PH) (DETAILS),RAMP/ACCESSIBILITY (YES/NO),FACILITIES FOR PWD (LIST),PLAYGROUND (YES/NO),INDOOR GAMES (YES/NO),GYMNASIUM (YES/NO),FIRST AID/HEALTH ROOM (YES/NO),FIRE SAFETY SYSTEM (YES/NO),CCTV (YES/NO),SECURITY (YES/NO),INDUSTRY PARTNER (YES/NO),INDUSTRY PARTNERS (LIST),MoUs WITH INDUSTRY (COUNT),CAREER GUIDANCE CELL (YES/NO),TRAINING & PLACEMENT CELL (YES/NO),TPO NAME,TPO CONTACT,ON-JOB TRAINING/OJT MANDATORY (YES/NO),TRAINEES COMPLETING LAST YEAR (%),CAMPUS INTERVIEWS HELD LAST YEAR (COUNT),COMPANIES VISITED LAST YEAR,TRAINEES PLACED LAST YEAR(COUNT),PLACEMENT PERCENTAGE (LAST YEAR),AVERAGE SALARY (MONTHLY Rs),HIGHEST SALARY (MONTHLY Rs),TRAINEES STARTING SELF-EMPLOYMENT (COUNT),TRAINEES GOING FOR HIGHER STUDIES/POLYTECHNIC (COUNT),NCC(YES?NO),NSS(YES?NO),CLUBS (LIST),SOFT SKILLS/EMPLOYABILITY TRAINING (YES/NO),DIGITAL/ICT TRAINING (YES/NO),VALUE ADDED/SHORT TERM COURSES (LIST),AWARDS/RECOGNITION (STATE/NATIONAL),SPECIAL INITIATIVES (PMKVY/DDU-GKY/OTHER SCHEMES),REMARKS/DESCRIPTION\n';

const EDUCATION_DIPLOMA_CSV_HEADER =
  'COLLEGE NAME,COLLEGE CODE/AFFILIATION CODE,STATE,DISTRICT,BLOCK/ULB,GP/WARD,VILLAGE/LOCALITY,OWNERSHIP (GOVT/PRIVATE/AIDED),INSTITUTION TYPE (POLYTECHNIC/ITI/OTHER),APPROVAL AUTHORITY (AICTE/NCVT/STATE COUNCIL),AFFILIATING BODY (e.g. SCTE&VT),ESTABLISHED YEAR,FULL ADDRESS,PIN CODE,LATITUDE,LONGITUDE,PRINCIPAL/HEAD NAME,PRINCIPAL CONTACT,PRINCIPAL EMAIL,COLLEGE PHONE,COLLEGE EMAIL,WEBSITE,TOTAL DIPLOMA PROGRAMMES (COUNT),DIPLOMA PROGRAMMES (LIST BRANCH-WISE),PROGRAM DURATION (YEARS),TOTAL SANCTIONED INTAKE (ALL YEARS),YEAR-WISE SANCTIONED INTAKE (1ST YEAR),TOTAL STUDENT ENROLMENT (ALL YEARS),STUDENTS ENROLLED 1ST YEAR,STUDENTS ENROLLED 2ND YEAR,STUDENTS ENROLLED 3RD YEAR,MALE STUDENTS, FEMALE STUDENTS,SC STUDENTS,ST STUDENTS,OBC STUDENTS,EWS STUDENTS,GENERAL STUDENTS,MINORITY STUDENTS,PWD STUDENTS,TUITION FEE PER YEAR (Rs),GOVT SCHOLARSHIPS (YES/NO),INSTITUTIONAL SCHOLARSHIPS (YES/NO),TOTAL TEACHING STAFF,TEACHING STAFF PERMANENT,TEACHING STAFF CONTRACT/GUEST,TEACHERS WITH B.TECH/BE,TEACHERS WITH M.TECH,TEACHERS WITH INDUSTRY EXPERIENCE (COUNT),NON-TEACHING STAFF,WORKSHOP INSTRUCTORS (COUNT),CENTRAL LIBRARY (YES/NO),LIBRARY BOOKS (COUNT),LIBRARY JOURNALS (COUNT),DIGITAL LIBRARY (YES/NO),COMPUTER CENTRE (YES/NO),TOTAL COMPUTERS,INTERNET BANDWIDTH (MBPS),WIFI CAMPUS (YES/NO),NO OF CLASSROOMS,NO OF LABS/WORKSHOPS,SMART CLASSROOMS (COUNT),LAB EQUIPMENT ADEQUATE (YES/NO),HOSTEL (YES/NO),HOSTEL CAPACITY BOYS,HOSTEL CAPACITY GIRLS,CANTEEN (YES/NO),HEALTH CENTRE/FIRST AID (YES/NO),PLAYGROUND (YES/NO),GYMNASIUM (YES/NO),TRANSPORT (COLLEGE BUS) (YES/NO),PARKING (YES/NO),RAMP/ACCESSIBILITY (YES/NO),FACILITIES FOR PWD (LIST),DRINKING WATER (YES/NO),ELECTRICITY (YES/NO),POWER BACKUP (YES/NO),NSS/NCC/CLUBS (LIST),ANTI-RAGGING CELL (YES/NO),GRIEVANCE CELL (YES/NO),TRAINING & PLACEMENT CELL (YES/NO),TPO NAME,TPO CONTACT,INDUSTRIAL VISITS PER YEAR,INDUSTRIAL TRAINING/INTERNSHIP MANDATORY (YES/NO),STUDENTS COMPLETING INTERNSHIP LAST YEAR (%),COMPANIES VISITED LAST YEAR,STUDENTS PLACED LAST YEAR,PLACEMENT PERCENTAGE (LAST YEAR),MEDIAN SALARY (ANNUAL Rs),HIGHEST SALARY (ANNUAL Rs),STUDENTS GOING FOR HIGHER STUDIES (COUNT),VALUE-ADDED/SHORT-TERM COURSES (LIST),MOOCs/SWAYAM/NPTEL USED (YES/NO),NOTABLE INDUSTRY PARTNERS/MoUs,NOTABLE AWARDS/ACHIEVEMENTS,REMARKS/DESCRIPTION\n';

const EDUCATION_UNIVERSITY_CSV_HEADER =
  'UNIVERSITY NAME,UNIVERSITY TYPE (STATE/CENTRAL/PRIVATE/DEEMED),TEACHING-CUM-AFFILIATING (YES/NO),ESTABLISHED YEAR,OWNERSHIP (GOVT/PRIVATE),NAAC GRADE,UGC 2(F) (YES/NO),UGC 12(B) (YES/NO),AISHE CODE,NIRF UNIVERSITY RANK,NIRF YEAR,STATE,DISTRICT,BLOCK/ULB,GP/WARD,VILLAGE,PIN CODE,LATITUDE,LONGITUDE,WEBSITE,UNIVERSITY EMAIL,PHONE NUMBER,CHANCELLOR NAME,VICE-CHANCELLOR NAME,REGISTRAR NAME,FINANCE OFFICER NAME,CONTROLLER OF EXAMS NAME,IQAC COORDINATOR NAME,NODAL OFFICER (AISHE) NAME,NODAL OFFICER CONTACT,CAMPUS AREA (ACRES),NO OF CAMPUSES/UNITS,OFF-CAMPUS CENTRES (COUNT),OFF-CAMPUS LOCATIONS (LIST),DISTANCE EDUCATION (YES/NO),ONLINE PROGRAMMES (YES/NO),TOTAL FACULTIES,TOTAL DEPARTMENTS,DEPARTMENTS (COMMA SEPARATED),TOTAL RESEARCH CENTRES,RESEARCH CENTRES (COMMA SEPARATED),TOTAL CENTRES OF EXCELLENCE,CENTRES OF EXCELLENCE (COMMA SEPARARTED),TOTAL CONSTITUENT COLLEGES,TOTAL AFFILIATED COLLEGES,TOTAL UG PROGRAMMES,UG PROGRAMMES (COMMA SEPARATED),TOTAL PG PROGRAMMES,PG PROGRAMMES (COMMA SEPARATED),TOTAL INTEGRATED PROGRAMMES,INTEGRATED PROGRAMMES (COMMA SEPARATED),TOTAL DIPLOMA/CERTIFICATE PROGRAMMES,DIPLOMA/CERTIFICATE PROGRAMMES (COMMA SEPARATED),TOTAL PH.D. PROGRAMMES,PH.D. PROGRAMMES (COMMA SEPARATED),D.LITT./D.SC. (YES/NO),D.LITT./D.SC. (COMMA SEPARATED),TOTAL SANCTIONED STUDENT INTAKE UG,TOTAL SANCTIONED STUDENT INTAKE PG,ADMISSION MODE (ENTRANCE/MERIT/BOTH),ENTRANCE TEST NAME,ACADEMIC YEAR SYSTEM (SEMESTER/TRIMESTER/ANNUAL),RESULT DECLARATION TIMELINE,ACADEMIC CALENDAR (URL),EXAMINATION CELL (YES/NO),UG COMPLETION RATE (%),PG COMPLETION RATE (%),TOTAL STUDENT ENROLLMENT,UG STUDENT ENROLLMENT,PG STUDENT ENROLLMENT,PH.D. STUDENT ENROLLMENT,STUDENTS FROM OTHER STATES (%),FEMALE STUDENTS (%),SC STUDENTS (COUNT),ST STUDENTS (COUNT),OBC STUDENTS (COUNT),EWS STUDENTS (COUNT),GENERAL STUDENTS (COUNT),MINORITY STUDENTS (COUNT),PWD STUDENTS (COUNT),SCHOLARSHIPS (GOVT) (YES/NO),SCHOLARSHIPS (INSTITUTIONAL) (YES/NO),TOTAL TEACHING STAFF,TOTAL PERMANENT TEACHING STAFF,TOTAL CONTRACT/GUEST FACULTY,TOTAL TEACHING STAFF (PROF),TOTAL TEACHING STAFF (ASSOC PROF),TOTAL TEACHING STAFF (ASST PROF),TOTAL TEACHERS WITH PH.D. (COUNT),TOTAL TEACHERS WITH NET/SET (COUNT),STUDENT-TEACHER RATIO,NON-TEACHING STAFF (COUNT),TECHNICAL STAFF (COUNT),LIBRARY (YES/NO),CENTRAL LIBRARY NAME,LIBRARY BOOKS (COUNT),LIBRARY JOURNALS (COUNT),E-JOURNALS (YES/NO),E-BOOKS (YES/NO),LIBRARY SOFTWARE (KOHA/RFID/OTHER),DIGITAL LIBRARY (YES/NO),COMPUTER CENTRE (YES/NO),TOTAL COMPUTERS,WIFI CAMPUS (YES/NO),NKN CONNECTIVITY (YES/NO),SMART CLASSROOMS (COUNT),SEMINAR HALLS (COUNT),AUDITORIUM (YES/NO),LABORATORIES (COUNT),MAJOR EQUIPMENT/INSTRUMENTATION (LIST COMMA SEPARATED),WORKSHOPS (COUNT),HOSTELS (YES/NO),HOSTEL COUNT,HOSTEL CAPACITY BOYS,HOSTEL CAPACITY GIRLS,STAFF QUARTERS (YES/NO),GUEST HOUSE (YES/NO),HEALTH CENTRE (YES/NO),CANTEEN (YES/NO),BANK/ATM (YES/NO),SPORTS FACILITIES (YES/NO),PLAYGROUND (YES/NO),GYMNASIUM (YES/NO),TRANSPORT FACILITY (YES/NO),PARKING (YES/NO),SECURITY (YES/NO),CCTV (YES/NO),FIRE SAFETY (YES/NO),RAMP/ACCESSIBILITY (YES/NO),FACILITIES FOR PWD (LIST),DRINKING WATER (YES/NO),ELECTRICITY (YES/NO),POWER BACKUP (YES/NO),SOLAR (YES/NO),IQAC (YES/NO),GRIEVANCE CELL (YES/NO),ANTI-RAGGING CELL (YES/NO),ICC HEAD NAME,ICC HEAD CONTACT,ALUMNI ASSOCIATION (YES/NO),NSS (YES/NO),NCC (YES/NO),STUDENT CLUBS (LIST COMMA SEPARATED),CULTURAL ACTIVITIES (YES/NO),TECHNICAL FEST/EVENTS (LIST COMMA SEPARATED),INDUSTRY COLLABORATION (MoUs) (COUNT),MoUs (LIST COMMA SEPARATED),RESEARCH PROJECTS (COUNT),PUBLICATIONS (LAST YEAR),PATENTS FILED,PATENTS GRANTED,STARTUPS/INCUBATION (YES/NO),INCUBATION CENTRE NAME(LIST COMMA SEPARATED),PLACEMENT CELL (YES/NO),PLACEMENT OFFICER NAME,PLACEMENT OFFICER CONTACT,PLACEMENT % (LAST YEAR),MEDIAN SALARY (LPA),HIGHEST PACKAGE (LPA),STUDENTS TO HIGHER STUDIES (COUNT),MOOCs/SWAYAM/NPTEL (YES/NO),VALUE-ADDED COURSES (COUNT),NOTABLE AWARDS/ACHIEVEMENTS,DESCRIPTION\n';
const ELECTRICITY_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE/LOCALITY,NAME OF OFFICE/CENTER,INSTITUTION TYPE,INSTITUTION ID/CODE,OWNERSHIP,PARENT ORGANIZATION,HIERARCHY LEVEL,HOST INSTITUTION (IF TRAINING CENTER),ESTABLISHED YEAR,COMMISSIONED YEAR (SUBSTATIONS),FULL ADDRESS,PIN CODE,LATITUDE,LONGITUDE,IN-CHARGE NAME,IN-CHARGE DESIGNATION,IN-CHARGE CONTACT,IN-CHARGE EMAIL,OFFICE PHONE,OFFICE EMAIL,WEBSITE,OFFICE HOURS,TOLL-FREE/CUSTOMER CARE NUMBER,HELPLINE AVAILABLE (YES/NO),VOLTAGE LEVEL PRIMARY (kV),VOLTAGE LEVEL SECONDARY (kV),INSTALLED CAPACITY (MVA),NO OF TRANSFORMERS,TRANSFORMER RATINGS MVA (COMMA SEPARATED),NO OF INCOMING FEEDERS,NO OF OUTGOING FEEDERS,TOTAL FEEDERS,BAYS (COUNT),SWITCHGEAR TYPE (GIS/AIS/HYBRID),33kV FEEDER LENGTH (KM),11kV FEEDER LENGTH (KM),LT LINE LENGTH (KM),NO OF DISTRIBUTION TRANSFORMERS (DTs),DT TOTAL CAPACITY (kVA),FEEDER METERING (YES/NO),FEEDER METERS (COUNT),DT METERING (YES/NO),DT METERS (COUNT),SMART METERS INSTALLED (COUNT),PREPAID METERS (COUNT),CONSUMER METERS TOTAL (COUNT),CONSUMERS UNDER JURISDICTION (APPROX),CONSUMERS DOMESTIC (COUNT),CONSUMERS COMMERCIAL (COUNT),CONSUMERS INDUSTRIAL (COUNT),CONSUMERS AGRICULTURAL (COUNT),CONSUMERS OTHER (COUNT),HT CONSUMERS (COUNT),LT CONSUMERS (COUNT),CONNECTED LOAD (MW),AT&C LOSS PERCENT,BILLING EFFICIENCY PERCENT,COLLECTION EFFICIENCY PERCENT,HOURS OF SUPPLY RURAL,HOURS OF SUPPLY URBAN,COMPLAINTS REGISTERED LAST YEAR,COMPLAINTS REDRESSED LAST YEAR,CONSUMER CARE COUNTER (YES/NO),BILLING FACILITY (YES/NO),ONLINE PAYMENT (YES/NO),MOBILE APP (YES/NO),ONLINE COMPLAINT PORTAL (YES/NO),CUSTOMER CARE EMAIL,GRIEVANCE REDRESSAL FORUM (YES/NO),TOTAL STAFF (COUNT),ENGINEERS (COUNT),TECHNICAL STAFF (COUNT),LINEMEN (COUNT),CONTRACT STAFF (COUNT),ADMIN/OFFICE STAFF (COUNT),VILLAGES/LOCALITIES COVERED (COUNT),GPs COVERED (COUNT),AREA COVERED SQ KM,BUILDING TYPE (OWN/RENTED),TOTAL FLOORS,OFFICE AREA SQ FT,TRAINING CENTER (YES/NO),TRAINING CAPACITY SEATS,WORKSHOP/GARAGE (YES/NO),STORE (YES/NO),DG SET (YES/NO),SOLAR (YES/NO),VEHICLES (COUNT),TWO-WHEELERS (COUNT),ANNUAL REVENUE CR (APPROX),BILLING CR LAST YEAR,DATA AS ON (YYYY-MM-DD),REMARKS/DESCRIPTION\n';

const ARCS_CSV_HEADER =
  'SL NO,BLOCK/ULB,SOCIETY NAME,REGISTRATION NUMBER,JURISDICTION TYPE (RURAL/URBAN/MIXED),AREA OF OPERATION,STATE,DISTRICT,ESTABLISHED YEAR,FULL ADDRESS,PIN CODE,LATITUDE,LONGITUDE,SECRETARY NAME,OFFICE PHONE,OFFICE EMAIL,FUNCTIONING OR NOT,AUDIT COMPLETED SOCIETIES (LAST FY),ELECTIONS CONDUCTED (LAST FY),TOTAL MEMBERSHIP,MEMBERSHIP SC,MEMBERSHIP ST,MEMBERSHIP OBC,MEMBERSHIP GEN,MEMBERSHIP WOMEN,INSPECTORS/EXTENSION OFFICERS (COUNT),COMPUTERIZATION STATUS (YES/NO),ONLINE REGISTRATION FACILITY (YES/NO),DIGITIZED RECORDS (YES/NO),FILE TRACKING SYSTEM (YES/NO)\n';

const REVENUE_LAND_CSV_HEADER =
  'TAHASIL,RI CIRCLE,BLOCK/ULB,GP/WARD,MOUZA/VILLAGE,HABITATION/LOCALITY,KHATA NO,PLOT NO,LAND TYPE (GOVT/PRIVATE/OTHER),GOVT LAND CATEGORY (Gochar/Gramya Jungle/Sarbasadharan/Khasmahal/Nazul/Other),KISAM,KISAM DESCRIPTION,TOTAL AREA (ACRES),TOTAL AREA (HECTARES),TOTAL AREA (SQFT),ROR YEAR,DEPARTMENT RECORDED AS OWNER,DESCRIPTION,TAHASIL OFFICE ORG ID\n';

// Tahasil offices under Revenue Govt Land.
const REVENUE_TAHASIL_OFFICE_CSV_HEADER =
  'SUB_DIVISION,BLOCK,VILLAGE/WARD,TAHSIL_NAME,TAHSIL_CODE,ESTABLISHED_YEAR,TAHSILDAR_NAME,CONTACT_NUMBER,EMAIL_ID,PIN_CODE,LATITUDE,LONGITUDE,TOTAL_AREA_SQ_KM,TOTAL_POPULATION,TOTAL_HOUSEHOLDS,TOTAL_VILLAGES,TOTAL_GRAM_PANCHAYATS,TOTAL_WARDS,URBAN_AREAS_COUNT,RURAL_AREAS_COUNT,TOTAL_REVENUE_VILLAGES,TOTAL_INHABITED_VILLAGES,TOTAL_UNINHABITED_VILLAGES,LARGEST_VILLAGE_NAME,SMALLEST_VILLAGE_NAME,TOTAL_PANCHAYAT_OFFICES,TOTAL_VILLAGE_ROADS_KM,TOTAL_WATER_BODIES,TOTAL_LAND_RECORDS,TOTAL_PRIVATE_LAND_ACRES,TOTAL_GOVERNMENT_LAND_ACRES,TOTAL_FOREST_LAND_ACRES,TOTAL_AGRICULTURAL_LAND_ACRES,TOTAL_RESIDENTIAL_LAND_ACRES,TOTAL_COMMERCIAL_LAND_ACRES,TOTAL_WASTE_LAND_ACRES,TOTAL_PLOT_RECORDS,TOTAL_KHATA_RECORDS,TOTAL_ROR_ISSUED,MUTATION_APPLICATIONS_RECEIVED_YEARLY,MUTATION_APPROVED,MUTATION_PENDING,MUTATION_REJECTED,AVG_MUTATION_PROCESSING_DAYS,TOTAL_ANNUAL_REVENUE,LAND_REVENUE_COLLECTION,STAMP_DUTY_COLLECTION,REGISTRATION_FEES,TAX_COLLECTION,PENALTY_COLLECTION,MONTHLY_REVENUE_TARGET,REVENUE_TARGET_ACHIEVED_PERCENT,CASTE_CERTIFICATES_ISSUED,INCOME_CERTIFICATES_ISSUED,RESIDENCE_CERTIFICATES_ISSUED,LEGAL_HEIR_CERTIFICATES,SOLVENCY_CERTIFICATES,TOTAL_CERTIFICATE_APPLICATIONS,CERTIFICATES_APPROVED,CERTIFICATES_PENDING,CERTIFICATES_REJECTED,AVG_CERTIFICATE_PROCESSING_DAYS,TOTAL_CASES_REGISTERED,CASES_RESOLVED,CASES_PENDING,OVERDUE_CASES,LAND_DISPUTE_CASES,CIVIL_CASES,CRIMINAL_CASES,AVG_CASE_RESOLUTION_DAYS,TOTAL_GRIEVANCES_RECEIVED,GRIEVANCES_RESOLVED,GRIEVANCES_PENDING,ONLINE_GRIEVANCES,OFFLINE_GRIEVANCES,AVG_GRIEVANCE_RESOLUTION_DAYS,TOTAL_SCHEMES_RUNNING,TOTAL_SCHEME_BENEFICIARIES,PMAY_BENEFICIARIES,MGNREGA_BENEFICIARIES,OLD_AGE_PENSION_BENEFICIARIES,DISABILITY_PENSION_BENEFICIARIES,WOMEN_WELFARE_SCHEME_BENEFICIARIES,STUDENT_SCHOLARSHIP_BENEFICIARIES,FUNDS_ALLOCATED,FUNDS_UTILIZED,FUNDS_REMAINING,TOTAL_SCHOOLS,TOTAL_COLLEGES,TOTAL_HOSPITALS,TOTAL_PRIMARY_HEALTH_CENTERS,TOTAL_ANGANWADI_CENTERS,TOTAL_POLICE_STATIONS,TOTAL_FIRE_STATIONS,TOTAL_BANKS,TOTAL_POST_OFFICES,TOTAL_MARKET_PLACES,TOTAL_ROADS_KM,TOTAL_BRIDGES,TOTAL_IRRIGATION_PROJECTS,TOTAL_WATER_SUPPLY_PROJECTS,TOTAL_STAFF,REVENUE_INSPECTORS_COUNT,AMIN_COUNT,CLERK_COUNT,DATA_ENTRY_OPERATORS,VACANT_POSTS,FILLED_POSTS,STAFF_TRAINED_IN_DIGITAL_SERVICES,TOTAL_COMPUTERS,INTERNET_AVAILABLE,CCTV_INSTALLED,ONLINE_SERVICES_AVAILABLE,TOTAL_ONLINE_APPLICATIONS,DIGITAL_RECORDS_PERCENTAGE,WEBSITE_AVAILABLE,ANNUAL_BUDGET_ALLOCATED,BUDGET_UTILIZED,BUDGET_REMAINING,DEVELOPMENT_EXPENDITURE,ADMIN_EXPENDITURE,WELFARE_EXPENDITURE,LITERACY_RATE_PERCENT,MALE_LITERACY_PERCENT,FEMALE_LITERACY_PERCENT,EMPLOYMENT_RATE_PERCENT,AGRICULTURE_DEPENDENT_PERCENT,IRRIGATED_LAND_PERCENT,DRINKING_WATER_COVERAGE_PERCENT,ELECTRICITY_COVERAGE_PERCENT,MAJOR_PROJECTS_RUNNING,UPCOMING_PROJECTS,KEY_CHALLENGES,ACHIEVEMENTS,AWARDS_RECEIVED,DESCRIPTION\n';

const MINOR_IRRIGATION_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE/LOCALITY,MIP ID,NAME OF M.I.P,CATEGORY/TYPE,LATITUDE,LONGITUDE,LOCATION PRECISION (METER),CATCHMENT AREA (SQ KM),COMMAND AREA KHARIF (ACRES),COMMAND AREA RABI (ACRES),TOTAL AYACUT (ACRES),STORAGE CAPACITY (MCUM),MWL (FT),FRL (FT),TBL (FT),SPILLWAY TYPE,SPILLWAY WIDTH (FT),NO OF SLUICES,SLUICE TYPE,CONDITION,FUNCTIONALITY,MANAGED BY,LAST MAINTENANCE,SENSORS INSTALLED,LAST GEOTAGGED DATE,BENEFICIARY FARMERS COUNT,BENEFICIARY SC/ST COUNT,SANCTIONED AMT (LAKHS),EXPENDITURE (LAKHS),FOREST CLEARANCE (Y/N),REMARKS\n';

const IRRIGATION_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE/ LOCALITY,WORK NAME,CATEGORY,TYPE OF IRRIGATION (FLOW/LIFT/SOLAR),LATITUDE,LONGITUDE,LOCATION PRECISION (METER),CATCHMENT AREA (IN SQ KM.),COMMAND AREA / AYACUT (HA.),STORAGE CAPACITY (HAM.),WATER SPREAD AREA (HA.),CANAL/ DISTRIBUTORY LENGTH (KM),DESIGN DISCHARGE (CUSECS),INFLOW SOURCE (RIVER/RAIN/STREAM/ CANAL),YEAR OF COMMISSIONING,CURRENT PHYSICAL CONDITION (GOOD/REPAIR NEEDED/CRITICAL),FUNCTIONALITY STATUS (FUNCTIONAL/PARTIAL/NON-FUNCTIONAL),MANAGED BY (PANI PANCHAYAT/DEPT/WUA),NAME OF PANI PANCHAYAT / WUA,CONTACT PERSON (PRESIDENT),CONTACT NUMBER OF PRESIDENT,CONTACT PERSON (ENGINEER),CONTACT NUMBER OF ENGINEER,LAST MAINTENANCE/DESILTING YEAR,BENEFICIARY FARMERS COUNT,BENEFICIARY HOUSEHOLDS,WATER AVAILABILITY (MONTHS/YEAR),FUNDING SCHEME (MGNREGS/STATE/CENTRAL),REMARKS/HISTORICAL BACKGROUND\n';

const AGRICULTURE_CSV_HEADER =
  'BLOCK/ULB,GP/WARD,VILLAGE/LOCALITY,NAME OF OFFICE/CENTER,INSTITUTION TYPE,INSTITUTION ID,HOST INSTITUTION/AFFILIATING BODY,ESTABLISHED YEAR,PIN CODE,LATITUDE,LONGITUDE,IN-CHARGE NAME,IN-CHARGE CONTACT,IN-CHARGE EMAIL,OFFICE PHONE,OFFICE EMAIL,WEBSITE,CAMPUS AREA (ACRES),TRAINING HALL (YES/NO),TRAINING HALL CAPACITY (SEATS),SOIL TESTING (YES/NO),SOIL SAMPLES TESTED PER YEAR,SEED DISTRIBUTION (YES/NO),SEED PROCESSING UNIT (YES/NO),SEED STORAGE CAPACITY (MT),DEMO UNITS (COMMA SEPARATED),DEMO FARM (YES/NO),DEMO FARM AREA (ACRES),GREENHOUSE/POLYHOUSE (YES/NO),IRRIGATION FACILITY (YES/NO),MACHINERY/CUSTOM HIRING (YES/NO),COMPUTER/IT LAB (YES/NO),LIBRARY (YES/NO),KEY SCHEMES (COMMA SEPARATED),TOTAL STAFF (COUNT),SCIENTISTS/OFFICERS (COUNT),TECHNICAL STAFF (COUNT),EXTENSION WORKERS (COUNT),FARMER TRAINING CAPACITY (PER BATCH),TRAINING PROGRAMMES CONDUCTED LAST YEAR,ON-FARM TRIALS/FLD LAST YEAR,VILLAGES/GPS COVERED (COUNT),SOIL HEALTH CARDS ISSUED LAST YEAR,FARMERS SERVED LAST YEAR (APPROX),REMARKS/DESCRIPTION\n';

const splitHeader = (header: string): string[] =>
  header.trim().replace(/\n$/, '').split(',').map((h) => h.trim());

const snakeFromHeader = (label: string): string =>
  label
    .trim()
    .replace(/[-\s/]+/g, '_')
    .replace(/[()]/g, '')
    .replace(/[?]/g, '')
    .toLowerCase()
    .replace(/^_+|_+$/g, '');

const getEducationHeadersForSubDept = (subDept: string): string[] => {
  switch (subDept) {
    case 'ENGINEERING_COLLEGE':
      return splitHeader(EDUCATION_ENGINEERING_CSV_HEADER);
    case 'ITI':
      return splitHeader(EDUCATION_ITI_CSV_HEADER);
    case 'DIPLOMA_COLLEGE':
      return splitHeader(EDUCATION_DIPLOMA_CSV_HEADER);
    case 'UNIVERSITY':
      return splitHeader(EDUCATION_UNIVERSITY_CSV_HEADER);
    default:
      return [];
  }
};

const EDUCATION_SCHOOL_SUB_DEPTS = [
  'PS',
  'UPS',
  'HS',
  'HSS',
  'SSS',
  // 'OTHER', // temporarily disabled by request
] as const;
type EducationSchoolSubDept = (typeof EDUCATION_SCHOOL_SUB_DEPTS)[number];

const SCHOOL_SUB_DEPT_TO_ORG_TYPE: Record<EducationSchoolSubDept, string> = {
  PS: 'PRIMARY_SCHOOL',
  UPS: 'UPPER_PRIMARY_SCHOOL',
  HS: 'HIGH_SCHOOL',
  HSS: 'HIGHER_SECONDARY',
  SSS: 'SENIOR_SECONDARY',
};

const SCHOOL_CLASS_FIELDS_BY_SUB_DEPT: Record<EducationSchoolSubDept, string[]> = {
  PS: ['class_i', 'class_ii', 'class_iii', 'class_iv', 'class_v'],
  UPS: ['class_vi', 'class_vii', 'class_viii'],
  HS: ['class_viii', 'class_ix', 'class_x'],
  HSS: ['class_xi', 'class_xii'],
  SSS: ['class_xi', 'class_xii'],
};

const SCHOOL_CLASS_LABELS: Record<string, string> = {
  class_i: 'I',
  class_ii: 'II',
  class_iii: 'III',
  class_iv: 'IV',
  class_v: 'V',
  class_vi: 'VI',
  class_vii: 'VII',
  class_viii: 'VIII',
  class_ix: 'IX',
  class_x: 'X',
  class_xi: 'XI',
  class_xii: 'XII',
};

function schoolClassFields(subDept: string): string[] {
  if (!isEducationSchoolSubDept(subDept)) return [];
  return SCHOOL_CLASS_FIELDS_BY_SUB_DEPT[subDept] ?? [];
}

function educationSchoolCsvHeader(subDept: string): string {
  const classHeaders = schoolClassFields(subDept)
    .map((k) => SCHOOL_CLASS_LABELS[k])
    .join(',');
  return `${EDUCATION_CSV_COMMON_PREFIX},${classHeaders},${EDUCATION_CSV_COMMON_SUFFIX}\n`;
}

function isEducationSchoolSubDept(value: string): value is EducationSchoolSubDept {
  return (EDUCATION_SCHOOL_SUB_DEPTS as readonly string[]).includes(value);
}

export default function DepartmentAdminPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [me, setMe] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptCode, setDeptCode] = useState<string | null>(null);
  const [educationSubDept, setEducationSubDept] = useState<string>('PS');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingOrgId, setEditingOrgId] = useState<number | null>(null);
  const [orgProfiles, setOrgProfiles] = useState<Record<number, CenterProfile | null>>({});
  const [healthProfiles, setHealthProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [educationProfiles, setEducationProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [electricityProfiles, setElectricityProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [minorIrrigationProfiles, setMinorIrrigationProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [irrigationProfiles, setIrrigationProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [waterProfiles, setWaterProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [revenueProfiles, setRevenueProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [agricultureProfiles, setAgricultureProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [icdsImageFile, setIcdsImageFile] = useState<File | null>(null);
  const [healthImageFile, setHealthImageFile] = useState<File | null>(null);
  const [educationImageFile, setEducationImageFile] = useState<File | null>(null);
  const [electricityImageFile, setElectricityImageFile] = useState<File | null>(null);
  const [agricultureImageFile, setAgricultureImageFile] = useState<File | null>(null);
  const [waterFormValues, setWaterFormValues] = useState<Record<string, string>>({});
  const [waterImageFile, setWaterImageFile] = useState<File | null>(null);
  const [editingWaterId, setEditingWaterId] = useState<number | null>(null);
  const [newOrg, setNewOrg] = useState({
    ulb_block: '',
    gp_name: '',
    ward_village: '',
    sector: '',
    awc_name: '',
    awc_id: '',
    building_status: '',
    latitude: '',
    longitude: '',
    lgd_code: '',
    student_strength: '',
    cpdo_name: '',
    cpdo_contact_no: '',
    supervisor_name: '',
    supervisor_contact_name: '',
    aww_name: '',
    aww_contact_no: '',
    awh_name: '',
    awh_contact_no: '',
    description: '',
  });
  const [awcProfileExtras, setAwcProfileExtras] = useState(emptyAwcProfileExtras());
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [editingHealthId, setEditingHealthId] = useState<number | null>(null);
  const emptyHealthOrg = () => ({
    block_ulb: '', gp_ward: '', village: '', latitude: '', longitude: '', name: '', institution_id: '', category: '',
    inst_head_name: '', inst_head_contact: '', no_of_ts: '', no_of_nts: '', no_of_mo: '', no_of_pharmacist: '',
    no_of_anm: '', no_of_health_worker: '', no_of_pathology: '', no_of_clerk: '', no_of_sweeper: '', no_of_nw: '',
    no_of_bed: '', no_of_icu: '', x_ray_availabilaty: '', ct_scan_availability: '', availability_of_pathology_testing: '', description: '',
  });
  const [newHealthOrg, setNewHealthOrg] = useState(emptyHealthOrg());
  const emptyHealthPortfolioForm = () => ({
    health_display_name: '',
    health_hero_tagline: '',
    health_tagline: '',
    health_hero_1: '',
    health_hero_2: '',
    health_hero_3: '',
    health_about: '',
    health_campus_image: '',
    health_established_year: '',
    health_facility_type: '',
    health_location_line: '',
    health_inst_head_message: '',
    health_inst_head_name: '',
    health_inst_head_photo: '',
    health_inst_head_qualification: '',
    health_inst_head_experience: '',
    health_inst_head_contact: '',
    health_inst_head_email: '',
    health_key_admin_cards_json: '[]',
    health_health_facility_cards_json: '[]',
    health_doctor_cards_json: '[]',
    health_doctor_attendance_json: '{}',
    health_ts_nts_staff_rows_json: '[]',
    health_clinical_staff_rows_json: '[]',
    health_equipment_rows_json: '[]',
    health_photo_gallery_json: '[]',
    health_full_address: '',
    health_helpdesk_phone: '',
    health_emergency_phone: '',
    health_public_email: '',
    health_office_hours: '',
    health_contact_email: '',
  });
  const [healthPortfolioForm, setHealthPortfolioForm] = useState<Record<string, string>>(emptyHealthPortfolioForm());

  const [editingEducationId, setEditingEducationId] = useState<number | null>(null);
  const emptyEducationOrg = () => ({
    block_ulb: '', gp_ward: '', village: '', name_of_school: '', school_id: '', esst_year: '', category: '',
    class_i: '', class_ii: '', class_iii: '', class_iv: '', class_v: '', class_vi: '', class_vii: '', class_viii: '', class_ix: '', class_x: '', class_xi: '', class_xii: '',
    deo_name: '', deo_contact: '', beo_name: '', beo_contact: '', brcc_name: '', brcc_contact: '', crcc_name: '', crcc_contact: '',
    name_of_hm: '', contact_of_hm: '', no_of_ts: '', no_of_nts: '', no_of_tgp_pcm: '', no_of_tgp_cbz: '', no_of_tgt_arts: '',
    building_status: '', no_of_rooms: '', no_of_smart_class_rooms: '', science_lab: '', toilet_m: '', toilet_f: '',
    ramp: '', meeting_hall: '', staff_common_room: '', ncc: '', nss: '', jrc: '', eco_club: '', library: '',
    icc_head_name: '', icc_head_contact: '', play_ground: '', cycle_stand: '',
    drinking_water_tw: '', drinking_water_tap: '', drinking_water_overhead_tap: '', drinking_water_aquaguard: '',
    latitude: '', longitude: '', description: '',
    language: 'en',
    school_name_en: '', school_name_od: '', hero_tagline_en: '', hero_tagline_od: '',
    hero_primary_tagline_en: '', hero_primary_tagline_od: '',
    hero_slide_1: '', hero_slide_2: '', hero_slide_3: '',
    about_short_en: '', about_short_od: '', school_type_en: '', school_type_od: '', location_en: '', location_od: '',
    about_image: '', headmaster_photo: '', headmaster_contact: '', headmaster_email: '',
    deo_image: '', deo_email: '', beo_image: '', beo_email: '', brcc_image: '', brcc_email: '',
    crc_image: '', crc_name: '', crc_contact: '', crc_email: '',
    vision_text_en: '', vision_text_od: '', mission_text_en: '', mission_text_od: '',
    hm_qualification: '', hm_experience: '', hm_past_experience_en: '', hm_current_experience_en: '', headmaster_message_en: '', headmaster_message_od: '',
    curriculum_text_en: '', curriculum_text_od: '', academic_calendar_text_en: '', academic_calendar_text_od: '',
    class_structure_text_en: '', class_structure_text_od: '', subjects_offered_text_en: '', subjects_offered_text_od: '',
    facilities_list: '', total_students: '', facilities_count: '', years_of_service: '',
    faculty_cards_json: '', faculty_attendance_json: '', facility_cards_json: '', infrastructure_images_json: '', activity_events_json: '', student_intake_rows_json: '',
    intake_cards_json: '', mdm_daily_json: '', ptm_meetings_json: '', photo_gallery_json: '',
    contact_address_en: '', contact_address_od: '', contact_phone: '', contact_email: '', office_hours_en: '', office_hours_od: '',
  });
  const [newEducationOrg, setNewEducationOrg] = useState(emptyEducationOrg());

  // Generic form values for non-school Education sub-departments (engineering, ITI, diploma, university)
  // Keys are snake_case versions of CSV column headers.
  const [eduFormValues, setEduFormValues] = useState<Record<string, string>>({});
  const [educationOtherImageFile, setEducationOtherImageFile] = useState<File | null>(null);
  const [elecFormValues, setElecFormValues] = useState<Record<string, string>>({});
  const [editingElectricityId, setEditingElectricityId] = useState<number | null>(null);
  const [arcsFormValues, setArcsFormValues] = useState<Record<string, string>>({});
  const [editingArcsId, setEditingArcsId] = useState<number | null>(null);
  const [arcsImageFile, setArcsImageFile] = useState<File | null>(null);
  const [arcsProfiles, setArcsProfiles] = useState<Record<number, Record<string, unknown>>>({});
  const [minorFormValues, setMinorFormValues] = useState<Record<string, string>>({});
  const [minorPortfolioForm, setMinorPortfolioForm] = useState<Record<string, string>>(MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM);
  const [editingMinorId, setEditingMinorId] = useState<number | null>(null);
  const [minorIrrigationImageFile, setMinorIrrigationImageFile] = useState<File | null>(null);
  const [irrigationFormValues, setIrrigationFormValues] = useState<Record<string, string>>({});
  const [editingIrrigationId, setEditingIrrigationId] = useState<number | null>(null);
  const [irrigationImageFile, setIrrigationImageFile] = useState<File | null>(null);
  const [revenueTahasilFormValues, setRevenueTahasilFormValues] = useState<Record<string, string>>({});
  const [revenueTahasilImageFile, setRevenueTahasilImageFile] = useState<File | null>(null);
  const [editingRevenueTahasilId, setEditingRevenueTahasilId] = useState<number | null>(null);

  const emptyAgricultureOrg = () => ({
    block_ulb: '',
    gp_ward: '',
    village_locality: '',
    name: '',
    institution_type: '',
    institution_id: '',
    host_institution: '',
    established_year: '',
    pin_code: '',
    latitude: '',
    longitude: '',
    in_charge_name: '',
    in_charge_contact: '',
    in_charge_email: '',
    office_phone: '',
    office_email: '',
    website: '',
    campus_area_acres: '',
    training_hall: '',
    training_hall_capacity: '',
    soil_testing: '',
    soil_samples_tested_per_year: '',
    seed_distribution: '',
    seed_processing_unit: '',
    seed_storage_capacity_mt: '',
    demo_units: '',
    demo_farm: '',
    demo_farm_area_acres: '',
    greenhouse_polyhouse: '',
    irrigation_facility: '',
    machinery_custom_hiring: '',
    computer_it_lab: '',
    library: '',
    key_schemes: '',
    total_staff: '',
    scientists_officers: '',
    technical_staff: '',
    extension_workers: '',
    farmer_training_capacity_per_batch: '',
    training_programmes_conducted_last_year: '',
    on_farm_trials_last_year: '',
    villages_covered: '',
    soil_health_cards_issued_last_year: '',
    farmers_served_last_year: '',
    remarks: '',
  });
  const [newAgricultureOrg, setNewAgricultureOrg] = useState(emptyAgricultureOrg());
  const [editingAgricultureId, setEditingAgricultureId] = useState<number | null>(null);
  const [agriculturePortfolioForm, setAgriculturePortfolioForm] = useState<Record<string, string>>(
    AGRICULTURE_PORTFOLIO_EMPTY_FORM,
  );

  const _n = (s: string) => (s.trim() ? (Number(s) || undefined) : undefined);
  const _s = (s: string) => (s.trim() || undefined);
  const _b = (s: string) => {
    const v = s.trim().toLowerCase();
    if (!v) return undefined;
    return v === '1' || v === 'true' || v === 'yes' || v === 'y';
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [user, deptList] = await Promise.all([authApi.me(), departmentsApi.list()]);
        if (user.role !== 'DEPT_ADMIN') {
          router.replace('/');
          return;
        }
        setMe(user);
        setDepartments(deptList);
        const dept = user.department_id ? deptList.find((d) => d.id === user.department_id) : null;
        setDeptCode(dept?.code ?? null);
        if (user.department_id) {
          const list = await organizationsApi.listByDepartment(user.department_id, {
            skip: 0,
            limit: PAGE_SIZE,
            sub_department:
              dept?.code === 'EDUCATION'
                ? educationSubDept
                : dept?.code === 'REVENUE_LAND'
                  ? 'TAHASIL_OFFICE'
                  : null,
          });
          setOrgs(list);
          setPage(0);
          setHasMore(list.length === PAGE_SIZE);
        } else {
          setError('Department is not set for this admin user.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load department admin data');
        clearToken();
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [router]);

  useEffect(() => {
    if (deptCode !== 'ICDS' && deptCode !== 'AWC_ICDS' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, CenterProfile | null> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await profileApi.getCenterProfile(o.id);
          profiles[o.id] = p ?? null;
        })
      );
      if (!cancelled) setOrgProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  // Reset generic Education form when switching sub-departments
  useEffect(() => {
    if (deptCode === 'EDUCATION' && !isEducationSchoolSubDept(educationSubDept)) {
      setEduFormValues({});
    }
  }, [deptCode, educationSubDept]);

  useEffect(() => {
    if (deptCode !== 'HEALTH' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await healthApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        })
      );
      if (!cancelled) setHealthProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'EDUCATION' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await educationApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        })
      );
      if (!cancelled) setEducationProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'ELECTRICITY' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await electricityApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        })
      );
      if (!cancelled) setElectricityProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'ARCS' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await arcsApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        }),
      );
      if (!cancelled) setArcsProfiles(profiles);
    })();
    return () => {
      cancelled = true;
    };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'AGRICULTURE' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await agricultureApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        }),
      );
      if (!cancelled) setAgricultureProfiles(profiles);
    })();
    return () => {
      cancelled = true;
    };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'MINOR_IRRIGATION' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await minorIrrigationApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        })
      );
      if (!cancelled) setMinorIrrigationProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'IRRIGATION' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const { irrigationApi } = await import('../../../services/api');
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await irrigationApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        }),
      );
      if (!cancelled) setIrrigationProfiles(profiles);
    })();
    return () => {
      cancelled = true;
    };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'WATCO_RWSS' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await watcoApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        })
      );
      if (!cancelled) setWaterProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [deptCode, orgs]);

  useEffect(() => {
    if (deptCode !== 'REVENUE_LAND' || orgs.length === 0) return;
    let cancelled = false;
    (async () => {
      const profiles: Record<number, Record<string, unknown>> = {};
      await Promise.all(
        orgs.map(async (o) => {
          if (cancelled) return;
          const p = await revenueLandApi.getProfile(o.id);
          profiles[o.id] = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
        }),
      );
      if (!cancelled) setRevenueProfiles(profiles);
    })();
    return () => {
      cancelled = true;
    };
  }, [deptCode, orgs]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this organization?')) return;
    try {
      await organizationsApi.delete(id);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete organization');
    }
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    if (!fileInput.files || fileInput.files.length === 0) {
      setError('Please choose a CSV file.');
      return;
    }
    const file = fileInput.files[0];
    setUploading(true);
    setError(null);
    try {
      if (deptCode === 'EDUCATION') {
        let result;
        if (isEducationSchoolSubDept(educationSubDept)) {
          result = await educationApi.bulkCsv(file, educationSubDept);
        } else if (educationSubDept === 'ENGINEERING_COLLEGE') {
          result = await educationApi.bulkEngineeringCollegesCsv(file);
        } else if (educationSubDept === 'ITI') {
          result = await educationApi.bulkItiCollegesCsv(file);
        } else if (educationSubDept === 'UNIVERSITY') {
          result = await educationApi.bulkUniversitiesCsv(file);
        } else if (educationSubDept === 'DIPLOMA_COLLEGE') {
          result = await educationApi.bulkDiplomaCollegesCsv(file);
        } else {
          result = await educationApi.bulkCsv(file);
        }
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'ELECTRICITY') {
        const result = await electricityApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'ARCS') {
        const result = await arcsApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'MINOR_IRRIGATION') {
        const result = await minorIrrigationApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'IRRIGATION') {
        const { irrigationApi } = await import('../../../services/api');
        const result = await irrigationApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'REVENUE_LAND') {
        const result = await revenueLandApi.bulkTahasilOfficesCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'HEALTH') {
        const result = await healthApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'WATCO_RWSS') {
        const result = await watcoApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else if (deptCode === 'AGRICULTURE') {
        const result = await agricultureApi.bulkCsv(file);
        if (result.errors?.length) {
          setError(`Imported ${result.imported}; errors: ${result.errors.slice(0, 5).join('; ')}`);
        }
      } else {
        // ICDS / AWC: bulk upload center profiles (minister CSV) for existing organizations
        const formData = new FormData();
        formData.append('file', file);
        const token = getToken();
        const resp = await fetch('/api/v1/organizations/profiles/bulk_csv', {
          method: 'POST',
          body: formData,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.detail || `Upload failed with status ${resp.status}`);
        }
      }
      if (me?.department_id) {
        const list = await organizationsApi.listByDepartment(me.department_id, {
          skip: 0,
          limit: PAGE_SIZE,
          sub_department:
            deptCode === 'EDUCATION'
              ? educationSubDept
              : deptCode === 'REVENUE_LAND'
                ? 'TAHASIL_OFFICE'
                : null,
        });
        setOrgs(list);
        setPage(0);
        setHasMore(list.length === PAGE_SIZE);
      }
      (form.elements.namedItem('file') as HTMLInputElement).value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    let csvContent: string;
    let filename: string;
    if (deptCode === 'EDUCATION') {
      if (isEducationSchoolSubDept(educationSubDept)) {
        csvContent = educationSchoolCsvHeader(educationSubDept);
        filename = `education_${educationSubDept.toLowerCase()}_template.csv`;
      } else if (educationSubDept === 'ENGINEERING_COLLEGE') {
        csvContent = EDUCATION_ENGINEERING_CSV_HEADER;
        filename = 'education_engineering_colleges_template.csv';
      } else if (educationSubDept === 'ITI') {
        csvContent = EDUCATION_ITI_CSV_HEADER;
        filename = 'education_iti_colleges_template.csv';
      } else if (educationSubDept === 'UNIVERSITY') {
        csvContent = EDUCATION_UNIVERSITY_CSV_HEADER;
        filename = 'education_universities_template.csv';
      } else if (educationSubDept === 'DIPLOMA_COLLEGE') {
        csvContent = EDUCATION_DIPLOMA_CSV_HEADER;
        filename = 'education_diploma_colleges_template.csv';
      } else {
        csvContent = educationSchoolCsvHeader('PS');
        filename = 'education_template.csv';
      }
    } else if (deptCode === 'HEALTH') {
      csvContent = HEALTH_CSV_HEADER;
      filename = 'health_template.csv';
    } else if (deptCode === 'ELECTRICITY') {
      csvContent = ELECTRICITY_CSV_HEADER;
      filename = 'electricity_template.csv';
    } else if (deptCode === 'ARCS') {
      csvContent = ARCS_CSV_HEADER;
      filename = 'arcs_cooperative_societies_template.csv';
    } else if (deptCode === 'MINOR_IRRIGATION') {
      csvContent = MINOR_IRRIGATION_CSV_HEADER;
      filename = 'minor_irrigation_template.csv';
    } else if (deptCode === 'IRRIGATION') {
      csvContent = IRRIGATION_CSV_HEADER;
      filename = 'irrigation_template.csv';
    } else if (deptCode === 'REVENUE_LAND') {
      csvContent = REVENUE_TAHASIL_OFFICE_CSV_HEADER;
      filename = 'revenue_tahasil_office_template.csv';
    } else if (deptCode === 'WATCO_RWSS') {
      csvContent = WATCO_CSV_HEADER;
      filename = 'watco_rwss_template.csv';
    } else if (deptCode === 'AGRICULTURE') {
      csvContent = AGRICULTURE_CSV_HEADER;
      filename = 'agriculture_template.csv';
    } else {
      csvContent = ICDS_CSV_HEADER + 'RANGEILUNDA,BADAKUSASTHALLI,BADAGUMULA,BADA GUMULLA-I,,,19.270275,84.781087,,,,,,,,,,KAMALAPUR,412630\n';
      filename = 'icds_awc_template.csv';
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!me && !loading) return null;

  return (
    <SuperAdminDashboardLayout
      user={me}
      isUserLoading={loading && !me}
      panelTitle={t('login.dept.title', language)}
      sectionLabel={t('super.sidebar.dashboard', language)}
      navItems={
        deptCode === 'ICDS' || deptCode === 'AWC_ICDS'
          ? [
            { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
            { href: '/admin/dept/icds-monitoring', labelKey: 'icds.monitoring.title' },
          ]
          : deptCode === 'HEALTH'
            ? [
              { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
              { href: '/admin/dept/health-monitoring', labelKey: 'health.monitoring.title' },
            ]
            : deptCode === 'ELECTRICITY'
              ? [
                { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
                { href: '/admin/dept/electricity-monitoring', labelKey: 'electricity.monitoring.title' },
              ]
              : deptCode === 'WATCO_RWSS'
                ? [
                  { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
                  { href: '/admin/dept/water-monitoring', labelKey: 'water.monitoring.title' },
                ]
                : deptCode === 'REVENUE_LAND'
                  ? [
                    { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
                    { href: '/admin/dept/revenue-land-monitoring', labelKey: 'revenueLand.monitoring.title' },
                  ]
                  : deptCode === 'AGRICULTURE'
                    ? [
                      { href: '/admin/dept', labelKey: 'super.sidebar.dashboard' },
                      { href: '/admin/dept/agriculture-monitoring', labelKey: 'agriculture.monitoring.title' },
                    ]
                    : [{ href: '/admin/dept', labelKey: 'super.sidebar.dashboard' }]
      }
      onLogout={() => {
        clearToken();
        router.push('/');
      }}
    >
      <div className="mx-auto max-w-6xl space-y-4">
        {loading && !me ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader />
          </div>
        ) : (
          <>
            {error && <p className="text-xs text-red-500">{error}</p>}

            {me?.department_id ? (
              <DepartmentMapSummaryEditor
                key={me.department_id}
                departmentId={me.department_id}
                initialSummary={departments.find((d) => d.id === me.department_id)?.map_summary}
                onSaved={(summary) => {
                  setDepartments((prev) =>
                    prev.map((d) =>
                      d.id === me.department_id ? { ...d, map_summary: summary } : d,
                    ),
                  );
                }}
                saveAction={async (id, map_summary) => {
                  await departmentsApi.updateMapSummary(id, { map_summary });
                }}
                titleKey="admin.dept.mapSummary.title"
                subtitleKey="admin.dept.mapSummary.subtitle"
                labelKey="admin.dept.mapSummary.label"
                placeholderKey="admin.dept.mapSummary.placeholder"
                charCountKey="admin.dept.mapSummary.charCount"
                saveKey="admin.dept.mapSummary.save"
                savingKey="admin.dept.mapSummary.saving"
                savedKey="admin.dept.mapSummary.saved"
                errorKey="admin.dept.mapSummary.error"
              />
            ) : null}

            {deptCode === 'EDUCATION' && (
              <section className="rounded-lg border border-border bg-background p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-text">Education sub-department:</span>
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                    value={educationSubDept}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setEducationSubDept(value);
                      if (me?.department_id) {
                        const list = await organizationsApi.listByDepartment(me.department_id, {
                          skip: 0,
                          limit: PAGE_SIZE,
                          sub_department: value,
                        });
                        setOrgs(list);
                        setPage(0);
                        setHasMore(list.length === PAGE_SIZE);
                      }
                    }}
                  >
                    <option value="PS">PS</option>
                    <option value="UPS">UPS</option>
                    <option value="HS">HS</option>
                    <option value="HSS">HSS</option>
                    <option value="SSS">SSS</option>
                    {/* <option value="OTHER">OTHER</option> */}
                    <option value="ENGINEERING_COLLEGE">Engineering College</option>
                    <option value="ITI">ITI</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="DIPLOMA_COLLEGE">Diploma College</option>
                  </select>
                  <span className="text-text-muted">
                    Uploads and organization list below are filtered by the selected sub-department.
                  </span>
                </div>
              </section>
            )}

            {(deptCode === 'ICDS' || deptCode === 'AWC_ICDS') && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">Manual AWC centre entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  All fields are in the section tabs below: identity, three hero images, and cover in <span className="font-medium text-text">Hero &amp; media</span>, about text and
                  centre image in <span className="font-medium text-text">About &amp; message</span>, address and map coordinates in <span className="font-medium text-text">Location</span>, staff
                  and contacts in <span className="font-medium text-text">Staff &amp; contacts</span>, programme counts in <span className="font-medium text-text">Programme &amp; data</span>, public carousel in{' '}
                  <span className="font-medium text-text">Facilities</span>, building / timings in <span className="font-medium text-text">Infrastructure &amp; timings</span>, and admin JSON / gallery in{' '}
                  <span className="font-medium text-text">Cards &amp; gallery</span>. Use{' '}
                  <span className="font-medium text-text">Update AWC</span> once when done. Minister CSV fields merge with profile records on save.
                </p>
                <form
                  className="mt-3 space-y-4 text-xs"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    if (!newOrg.awc_name || !newOrg.latitude || !newOrg.longitude) {
                      setError('AWC Name, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(newOrg.latitude);
                      const lng = Number(newOrg.longitude);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const addressParts = [newOrg.gp_name, newOrg.ward_village].filter(Boolean);
                      const basePayload = {
                        name: newOrg.awc_name,
                        latitude: lat,
                        longitude: lng,
                        description: newOrg.sector ? `Sector: ${newOrg.sector}` : undefined,
                        address: addressParts.length ? addressParts.join(', ') : undefined,
                        attributes: {
                          ulb_block: newOrg.ulb_block,
                          gp_name: newOrg.gp_name,
                          ward_village: newOrg.ward_village,
                          sector: newOrg.sector,
                          lgd_code: newOrg.lgd_code,
                        } as Record<string, string | number | null>,
                      };

                      let updated: Organization;
                      if (editingOrgId) {
                        updated = await organizationsApi.update(editingOrgId, basePayload);
                        setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                      } else {
                        const created = await organizationsApi.create({
                          department_id: me.department_id,
                          type: 'AWC',
                          ...basePayload,
                        });
                        updated = created;
                        setOrgs((prev) => [created, ...prev]);
                      }
                      const profilePayload: Partial<CenterProfile> = {
                        block_name: newOrg.ulb_block || undefined,
                        gram_panchayat: newOrg.gp_name || undefined,
                        village_ward: newOrg.ward_village || undefined,
                        center_code: newOrg.awc_id || undefined,
                        building_type: newOrg.building_status || undefined,
                        student_strength: newOrg.student_strength ? parseInt(newOrg.student_strength, 10) : undefined,
                        cpdo_name: newOrg.cpdo_name || undefined,
                        cpdo_contact_no: newOrg.cpdo_contact_no || undefined,
                        supervisor_name: newOrg.supervisor_name || undefined,
                        supervisor_contact_name: newOrg.supervisor_contact_name || undefined,
                        worker_name: newOrg.aww_name || undefined,
                        aww_contact_no: newOrg.aww_contact_no || undefined,
                        helper_name: newOrg.awh_name || undefined,
                        awh_contact_no: newOrg.awh_contact_no || undefined,
                        description: newOrg.description || undefined,
                        sector: newOrg.sector || undefined,
                      };
                      const extraProfile = extrasToPartialProfile(awcProfileExtras);
                      await profileApi.putCenterProfile(updated.id, { ...profilePayload, ...extraProfile } as Partial<CenterProfile>);
                      if (icdsImageFile) {
                        const compressed = await compressImage(icdsImageFile, { maxSizeMB: 0.5 });
                        await organizationsApi.uploadCoverImage(updated.id, compressed);
                        setIcdsImageFile(null);
                      }
                      setOrgProfiles((prev) => ({ ...prev, [updated.id]: { ...profilePayload, organization_id: updated.id } as CenterProfile }));
                      const emptyOrg = {
                        ulb_block: '', gp_name: '', ward_village: '', sector: '', awc_name: '', awc_id: '', building_status: '',
                        latitude: '', longitude: '', lgd_code: '', student_strength: '', cpdo_name: '', cpdo_contact_no: '',
                        supervisor_name: '', supervisor_contact_name: '', aww_name: '', aww_contact_no: '', awh_name: '', awh_contact_no: '', description: '',
                      };
                      setNewOrg(emptyOrg);
                      setAwcProfileExtras(emptyAwcProfileExtras());
                      setEditingOrgId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save organization');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  <div className="min-w-0 w-full overflow-visible rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
                    <AwcPortfolioAdminForm
                      organizationId={editingOrgId}
                      facilityRecord={newOrg}
                      onFacilityRecordPatch={(patch) => setNewOrg((s) => ({ ...s, ...patch }))}
                      extras={awcProfileExtras}
                      onExtrasPatch={(patch) => setAwcProfileExtras((s) => ({ ...s, ...patch }))}
                      profileImageControl={
                        <div className="space-y-1">
                          <span className="block text-[11px] text-text">Profile image (optional)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
                            onChange={(e) => setIcdsImageFile(e.target.files?.[0] ?? null)}
                          />
                        </div>
                      }
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={creating}
                      className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {creating ? 'Saving...' : editingOrgId ? 'Update AWC' : 'Save AWC'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {deptCode === 'AGRICULTURE' && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">Manual Agriculture facility entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  All fields are in the section tabs below, matching the public Agriculture page structure.
                </p>
                <form
                  className="mt-3 space-y-4 text-xs"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    if (!newAgricultureOrg.name || !newAgricultureOrg.latitude || !newAgricultureOrg.longitude) {
                      setError('Name, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(newAgricultureOrg.latitude);
                      const lng = Number(newAgricultureOrg.longitude);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }

                      const payload = {
                        block_ulb: _s(newAgricultureOrg.block_ulb),
                        gp_ward: _s(newAgricultureOrg.gp_ward),
                        village_locality: _s(newAgricultureOrg.village_locality),
                        name: newAgricultureOrg.name,
                        institution_type: _s(newAgricultureOrg.institution_type),
                        latitude: lat,
                        longitude: lng,
                        institution_id: _s(newAgricultureOrg.institution_id),
                        host_institution: _s(newAgricultureOrg.host_institution),
                        established_year: _n(newAgricultureOrg.established_year),
                        pin_code: _s(newAgricultureOrg.pin_code),
                        in_charge_name: _s(newAgricultureOrg.in_charge_name),
                        in_charge_contact: _s(newAgricultureOrg.in_charge_contact),
                        in_charge_email: _s(newAgricultureOrg.in_charge_email),
                        office_phone: _s(newAgricultureOrg.office_phone),
                        office_email: _s(newAgricultureOrg.office_email),
                        website: _s(newAgricultureOrg.website),
                        campus_area_acres: _n(newAgricultureOrg.campus_area_acres),
                        training_hall: _b(newAgricultureOrg.training_hall),
                        training_hall_capacity: _n(newAgricultureOrg.training_hall_capacity),
                        soil_testing: _b(newAgricultureOrg.soil_testing),
                        soil_samples_tested_per_year: _n(newAgricultureOrg.soil_samples_tested_per_year),
                        seed_distribution: _b(newAgricultureOrg.seed_distribution),
                        seed_processing_unit: _b(newAgricultureOrg.seed_processing_unit),
                        seed_storage_capacity_mt: _n(newAgricultureOrg.seed_storage_capacity_mt),
                        demo_units: _s(newAgricultureOrg.demo_units),
                        demo_farm: _b(newAgricultureOrg.demo_farm),
                        demo_farm_area_acres: _n(newAgricultureOrg.demo_farm_area_acres),
                        greenhouse_polyhouse: _b(newAgricultureOrg.greenhouse_polyhouse),
                        irrigation_facility: _b(newAgricultureOrg.irrigation_facility),
                        machinery_custom_hiring: _b(newAgricultureOrg.machinery_custom_hiring),
                        computer_it_lab: _b(newAgricultureOrg.computer_it_lab),
                        library: _b(newAgricultureOrg.library),
                        key_schemes: _s(newAgricultureOrg.key_schemes),
                        total_staff: _n(newAgricultureOrg.total_staff),
                        scientists_officers: _n(newAgricultureOrg.scientists_officers),
                        technical_staff: _n(newAgricultureOrg.technical_staff),
                        extension_workers: _n(newAgricultureOrg.extension_workers),
                        farmer_training_capacity_per_batch: _n(newAgricultureOrg.farmer_training_capacity_per_batch),
                        training_programmes_conducted_last_year: _n(newAgricultureOrg.training_programmes_conducted_last_year),
                        on_farm_trials_last_year: _n(newAgricultureOrg.on_farm_trials_last_year),
                        villages_covered: _n(newAgricultureOrg.villages_covered),
                        soil_health_cards_issued_last_year: _n(newAgricultureOrg.soil_health_cards_issued_last_year),
                        farmers_served_last_year: _n(newAgricultureOrg.farmers_served_last_year),
                        remarks: _s(newAgricultureOrg.remarks),
                      };

                      let orgId: number;
                      if (editingAgricultureId) {
                        // Update existing organization core fields
                        const addressParts = [
                          newAgricultureOrg.block_ulb,
                          newAgricultureOrg.gp_ward,
                          newAgricultureOrg.village_locality,
                        ].filter(Boolean);
                        await organizationsApi.update(editingAgricultureId, {
                          name: newAgricultureOrg.name,
                          latitude: lat,
                          longitude: lng,
                          address: addressParts.length ? addressParts.join(', ') : undefined,
                          attributes: {
                            ulb_block: newAgricultureOrg.block_ulb,
                            gp_name: newAgricultureOrg.gp_ward,
                            ward_village: newAgricultureOrg.village_locality,
                            sub_department: newAgricultureOrg.institution_type || null,
                          } as Record<string, string | number | null>,
                        });
                        orgId = editingAgricultureId;
                      } else {
                        const master = await agricultureApi.createOrganization(payload);
                        orgId = master.organization_id;
                      }

                      const parseAgRows = (raw: string | undefined) => {
                        if (!raw?.trim()) return [];
                        try {
                          const parsed = JSON.parse(raw) as unknown;
                          return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
                        } catch {
                          return [];
                        }
                      };
                      let agExpertAttendance: Record<string, unknown> = {};
                      try {
                        const raw = (agriculturePortfolioForm.ag_expert_attendance_json || '').trim();
                        if (raw) {
                          const parsed = JSON.parse(raw) as unknown;
                          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                            agExpertAttendance = parsed as Record<string, unknown>;
                          }
                        }
                      } catch {
                        agExpertAttendance = {};
                      }

                      const profilePayload: Record<string, unknown> = {
                        block_ulb: _s(newAgricultureOrg.block_ulb),
                        gp_ward: _s(newAgricultureOrg.gp_ward),
                        village_locality: _s(newAgricultureOrg.village_locality),
                        name_of_office_center: _s(newAgricultureOrg.name),
                        institution_type: _s(newAgricultureOrg.institution_type),
                        institution_id: _s(newAgricultureOrg.institution_id),
                        host_institution_affiliating_body: _s(newAgricultureOrg.host_institution),
                        established_year: _n(newAgricultureOrg.established_year),
                        pin_code: _s(newAgricultureOrg.pin_code),
                        latitude: lat,
                        longitude: lng,
                        in_charge_name: _s(newAgricultureOrg.in_charge_name),
                        in_charge_contact: _s(newAgricultureOrg.in_charge_contact),
                        in_charge_email: _s(newAgricultureOrg.in_charge_email),
                        office_phone: _s(newAgricultureOrg.office_phone),
                        office_email: _s(newAgricultureOrg.office_email),
                        website: _s(newAgricultureOrg.website),
                        campus_area_acres: _s(newAgricultureOrg.campus_area_acres),
                        training_hall_yes_no: _s(newAgricultureOrg.training_hall),
                        training_hall_capacity_seats: _s(newAgricultureOrg.training_hall_capacity),
                        soil_testing_yes_no: _s(newAgricultureOrg.soil_testing),
                        soil_samples_tested_per_year: _s(newAgricultureOrg.soil_samples_tested_per_year),
                        seed_distribution_yes_no: _s(newAgricultureOrg.seed_distribution),
                        seed_processing_unit_yes_no: _s(newAgricultureOrg.seed_processing_unit),
                        seed_storage_capacity_mt: _s(newAgricultureOrg.seed_storage_capacity_mt),
                        demo_units_comma_separated: _s(newAgricultureOrg.demo_units),
                        demo_farm_yes_no: _s(newAgricultureOrg.demo_farm),
                        demo_farm_area_acres: _s(newAgricultureOrg.demo_farm_area_acres),
                        greenhouse_polyhouse_yes_no: _s(newAgricultureOrg.greenhouse_polyhouse),
                        irrigation_facility_yes_no: _s(newAgricultureOrg.irrigation_facility),
                        machinery_custom_hiring_yes_no: _s(newAgricultureOrg.machinery_custom_hiring),
                        computer_it_lab_yes_no: _s(newAgricultureOrg.computer_it_lab),
                        library_yes_no: _s(newAgricultureOrg.library),
                        key_schemes_comma_separated: _s(newAgricultureOrg.key_schemes),
                        total_staff_count: _s(newAgricultureOrg.total_staff),
                        scientists_officers_count: _s(newAgricultureOrg.scientists_officers),
                        technical_staff_count: _s(newAgricultureOrg.technical_staff),
                        extension_workers_count: _s(newAgricultureOrg.extension_workers),
                        farmer_training_capacity_per_batch: _s(newAgricultureOrg.farmer_training_capacity_per_batch),
                        training_programmes_conducted_last_year: _s(newAgricultureOrg.training_programmes_conducted_last_year),
                        on_farm_trials_fld_last_year: _s(newAgricultureOrg.on_farm_trials_last_year),
                        villages_gps_covered_count: _s(newAgricultureOrg.villages_covered),
                        soil_health_cards_issued_last_year: _s(newAgricultureOrg.soil_health_cards_issued_last_year),
                        farmers_served_last_year_approx: _s(newAgricultureOrg.farmers_served_last_year),
                        remarks_description: _s(newAgricultureOrg.remarks),
                        ag_display_name: _s(agriculturePortfolioForm.ag_display_name || ''),
                        ag_hero_tagline: _s(agriculturePortfolioForm.ag_hero_tagline || ''),
                        ag_tagline: _s(agriculturePortfolioForm.ag_tagline || ''),
                        ag_hero_1: _s(agriculturePortfolioForm.ag_hero_1 || ''),
                        ag_hero_2: _s(agriculturePortfolioForm.ag_hero_2 || ''),
                        ag_hero_3: _s(agriculturePortfolioForm.ag_hero_3 || ''),
                        ag_about: _s(agriculturePortfolioForm.ag_about || ''),
                        ag_campus_image: _s(agriculturePortfolioForm.ag_campus_image || ''),
                        ag_established_year: _s(agriculturePortfolioForm.ag_established_year || ''),
                        ag_facility_type: _s(agriculturePortfolioForm.ag_facility_type || ''),
                        ag_location_line: _s(agriculturePortfolioForm.ag_location_line || ''),
                        ag_head_message: _s(agriculturePortfolioForm.ag_head_message || ''),
                        ag_head_name: _s(agriculturePortfolioForm.ag_head_name || ''),
                        ag_head_photo: _s(agriculturePortfolioForm.ag_head_photo || ''),
                        ag_head_qualification: _s(agriculturePortfolioForm.ag_head_qualification || ''),
                        ag_head_experience: _s(agriculturePortfolioForm.ag_head_experience || ''),
                        ag_head_contact: _s(agriculturePortfolioForm.ag_head_contact || ''),
                        ag_head_email: _s(agriculturePortfolioForm.ag_head_email || ''),
                        ag_key_admin_cards: parseAgRows(agriculturePortfolioForm.ag_key_admin_cards_json),
                        ag_facility_cards: normalizeAgricultureFacilityCardsForSave(
                          parseAgRows(agriculturePortfolioForm.ag_facility_cards_json),
                        ),
                        ag_expert_cards: parseAgRows(agriculturePortfolioForm.ag_expert_cards_json),
                        ag_expert_attendance: agExpertAttendance,
                        ag_staff_rows: parseAgRows(agriculturePortfolioForm.ag_staff_rows_json),
                        ag_daily_stock_rows: parseAgRows(agriculturePortfolioForm.ag_daily_stock_rows_json),
                        ag_photo_gallery: parseAgRows(agriculturePortfolioForm.ag_photo_gallery_json),
                        ag_full_address: _s(agriculturePortfolioForm.ag_full_address || ''),
                        ag_helpdesk_phone: _s(agriculturePortfolioForm.ag_helpdesk_phone || ''),
                        ag_emergency_phone: _s(agriculturePortfolioForm.ag_emergency_phone || ''),
                        ag_public_email: _s(agriculturePortfolioForm.ag_public_email || ''),
                        ag_office_hours: _s(agriculturePortfolioForm.ag_office_hours || ''),
                      };

                      await agricultureApi.putProfile(orgId, profilePayload);

                      if (me?.department_id) {
                        const list = await organizationsApi.listByDepartment(me.department_id, {
                          skip: 0,
                          limit: PAGE_SIZE,
                          sub_department: null,
                        });
                        setOrgs(list);
                        setPage(0);
                        setHasMore(list.length === PAGE_SIZE);
                      }

                      setAgricultureProfiles((prev) => ({
                        ...prev,
                        [orgId]: profilePayload,
                      }));

                      if (agricultureImageFile) {
                        const compressed = await compressImage(agricultureImageFile, { maxSizeMB: 0.5 });
                        await organizationsApi.uploadCoverImage(orgId, compressed);
                        setAgricultureImageFile(null);
                      }

                      setNewAgricultureOrg(emptyAgricultureOrg());
                      setAgriculturePortfolioForm(AGRICULTURE_PORTFOLIO_EMPTY_FORM);
                      setEditingAgricultureId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save agriculture facility');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  <div className="min-w-0 w-full overflow-visible rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
                    <AgriculturePortfolioAdminForm
                      organizationId={editingAgricultureId}
                      form={agriculturePortfolioForm}
                      setForm={setAgriculturePortfolioForm}
                      facilityRecord={{
                        block_ulb: newAgricultureOrg.block_ulb,
                        gp_ward: newAgricultureOrg.gp_ward,
                        village_locality: newAgricultureOrg.village_locality,
                        name: newAgricultureOrg.name,
                        institution_id: newAgricultureOrg.institution_id,
                        institution_type: newAgricultureOrg.institution_type,
                        latitude: newAgricultureOrg.latitude,
                        longitude: newAgricultureOrg.longitude,
                      }}
                      onFacilityRecordPatch={(patch) => setNewAgricultureOrg((s) => ({ ...s, ...patch }))}
                      resources={{
                        total_staff: newAgricultureOrg.total_staff,
                        villages_covered: newAgricultureOrg.villages_covered,
                        farmers_served_last_year: newAgricultureOrg.farmers_served_last_year,
                      }}
                      onResourcesPatch={(patch) => setNewAgricultureOrg((s) => ({ ...s, ...patch }))}
                      profileImageControl={
                        <div className="space-y-1">
                          <span className="block text-[11px] text-text">Profile image (optional)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
                            onChange={(e) => setAgricultureImageFile(e.target.files?.[0] ?? null)}
                          />
                        </div>
                      }
                    />
                  </div>
                  <div>
                    <button type="submit" disabled={creating} className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                      {creating ? 'Saving...' : editingAgricultureId ? 'Update facility' : 'Save facility'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {deptCode === 'WATCO_RWSS' && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">Manual Water scheme entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Add a single WATCO/RWSS scheme manually. Fields mirror the key WATCO CSV columns.
                </p>
                <form
                  className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    const nameKey = snakeFromHeader('STATION NAME');
                    const latKey = snakeFromHeader('LATITUDE');
                    const lngKey = snakeFromHeader('LONGITUDE');
                    const name = (waterFormValues[nameKey] || '').trim();
                    const latStr = waterFormValues[latKey] || '';
                    const lngStr = waterFormValues[lngKey] || '';
                    if (!name || !latStr.trim() || !lngStr.trim()) {
                      setError('Station Name, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(latStr);
                      const lng = Number(lngStr);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const block = waterFormValues[snakeFromHeader('BLOCK/ULB')] || '';
                      const gp = waterFormValues[snakeFromHeader('GP/WARD')] || '';
                      const village = waterFormValues[snakeFromHeader('VILLAGE/LOCALITY')] || '';
                      const stationType = waterFormValues[snakeFromHeader('STATION TYPE')] || '';
                      const addressParts = [block, gp, village].filter((p) => p && p.trim());

                      let orgId: number;
                      if (editingWaterId) {
                        orgId = editingWaterId;
                      } else {
                        const basePayload = {
                          name,
                          latitude: lat,
                          longitude: lng,
                          address: addressParts.length ? addressParts.join(', ') : undefined,
                          attributes: {
                            ulb_block: block || null,
                            gp_name: gp || null,
                            ward_village: village || null,
                            station_type: stationType || null,
                          } as Record<string, string | number | null>,
                        };

                        const org = await organizationsApi.create({
                          department_id: me.department_id,
                          type: 'OTHER',
                          ...basePayload,
                        });
                        orgId = org.id;
                        setOrgs((prev) => [org, ...prev]);
                      }
                      const profileData: Record<string, unknown> = {};
                      splitHeader(WATCO_CSV_HEADER).forEach((header) => {
                        const key = snakeFromHeader(header);
                        const val = waterFormValues[key];
                        if (val != null && String(val).trim() !== '') {
                          profileData[key] = val;
                        }
                      });
                      profileData[latKey] = lat;
                      profileData[lngKey] = lng;
                      profileData[nameKey] = name;
                      const saved = await watcoApi.putProfile(orgId, profileData);
                      setWaterProfiles((prev) => ({
                        ...prev,
                        [orgId]: (saved && typeof saved === 'object' ? saved : profileData) as Record<string, unknown>,
                      }));
                      if (waterImageFile) {
                        const compressed = await compressImage(waterImageFile, { maxSizeMB: 0.5 });
                        await organizationsApi.uploadCoverImage(orgId, compressed);
                        setWaterImageFile(null);
                      }
                      setWaterFormValues({});
                      setEditingWaterId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save water scheme');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {splitHeader(WATCO_CSV_HEADER).map((header) => {
                    const key = snakeFromHeader(header);
                    return (
                      <div key={key} className="space-y-1">
                        <label className="block text-text">{header}</label>
                        <input
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                          value={waterFormValues[key] ?? ''}
                          onChange={(e) =>
                            setWaterFormValues((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-text">Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs"
                      onChange={(e) => setWaterImageFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {creating ? 'Saving...' : 'Save scheme'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {deptCode === 'REVENUE_LAND' && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">
                  {editingRevenueTahasilId ? 'Edit Tahasil office' : 'Create Tahasil office'}
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Tahasil offices appear on the public map first. Use the same <strong>TAHASIL</strong> profile
                  value as in parcel rows (or link parcels with <strong>Tahasils office org ID</strong>) so
                  parcels list under this office.
                </p>
                <form
                  className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    const tahasilHeaders = splitHeader(REVENUE_TAHASIL_OFFICE_CSV_HEADER);
                    const tahsilNameKey = snakeFromHeader('TAHSIL_NAME');
                    const officeNameKey = snakeFromHeader('OFFICE NAME');
                    const latKey = snakeFromHeader('LATITUDE');
                    const lngKey = snakeFromHeader('LONGITUDE');
                    const addressKey = snakeFromHeader('ADDRESS');
                    const tahasilKeyField = snakeFromHeader('TAHASIL');
                    const name = (
                      revenueTahasilFormValues[tahsilNameKey] ||
                      revenueTahasilFormValues[officeNameKey] ||
                      revenueTahasilFormValues[tahasilKeyField] ||
                      ''
                    ).trim();
                    const latStr = (revenueTahasilFormValues[latKey] || '').trim();
                    const lngStr = (revenueTahasilFormValues[lngKey] || '').trim();
                    const tahasilKey = (
                      revenueTahasilFormValues[tahasilKeyField] ||
                      revenueTahasilFormValues[tahsilNameKey] ||
                      ''
                    ).trim();
                    if (!name || !latStr || !lngStr) {
                      setError('TAHSIL_NAME (or OFFICE NAME), latitude, and longitude are required.');
                      return;
                    }
                    const lat = Number(latStr);
                    const lng = Number(lngStr);
                    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                      setError('Latitude and longitude must be valid numbers.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const orgPayload = {
                        name,
                        latitude: lat,
                        longitude: lng,
                        address: (revenueTahasilFormValues[addressKey] || '').trim() || undefined,
                        sub_department: 'TAHASIL_OFFICE',
                      };
                      const savedOrg = editingRevenueTahasilId
                        ? await organizationsApi.update(editingRevenueTahasilId, orgPayload)
                        : await organizationsApi.create({
                            department_id: me.department_id,
                            type: 'OTHER',
                            ...orgPayload,
                          });
                      const orgId = savedOrg.id;
                      setOrgs((prev) =>
                        editingRevenueTahasilId
                          ? prev.map((o) => (o.id === savedOrg.id ? savedOrg : o))
                          : [savedOrg, ...prev],
                      );
                      if (orgId == null) throw new Error('Failed to identify organization');
                      const orgIdNum: number = orgId;
                      const profilePayload: Record<string, unknown> = {};
                      tahasilHeaders.forEach((header) => {
                        const key = snakeFromHeader(header);
                        const val = (revenueTahasilFormValues[key] || '').trim();
                        if (val) profilePayload[key] = val;
                      });
                      // Keep a canonical key used by parcel-link logic and existing dashboards.
                      if (tahasilKey) profilePayload.tahasil = tahasilKey;

                      await revenueLandApi.putProfile(orgIdNum, profilePayload);
                      if (revenueTahasilImageFile) {
                        const compressed = await compressImage(revenueTahasilImageFile, { maxSizeMB: 0.5 });
                        const updatedOrg = await organizationsApi.uploadCoverImage(orgIdNum, compressed);
                        setOrgs((prev) => prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o)));
                        setRevenueTahasilImageFile(null);
                      }
                      const prof = await revenueLandApi.getProfile(orgIdNum);
                      setRevenueProfiles((prev) => ({
                        ...prev,
                        [orgIdNum]: (prof && typeof prof === 'object' ? prof : {}) as Record<string, unknown>,
                      }));
                      setRevenueTahasilFormValues({});
                      setEditingRevenueTahasilId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save Tahasil office');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {splitHeader(REVENUE_TAHASIL_OFFICE_CSV_HEADER).map((header) => {
                    const key = snakeFromHeader(header);
                    return (
                    <div key={key} className="space-y-1">
                      <label className="block text-text">{header}</label>
                      <input
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                        value={revenueTahasilFormValues[key] ?? ''}
                        onChange={(e) =>
                          setRevenueTahasilFormValues((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                      />
                    </div>
                  );
                  })}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-text font-medium">Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-text file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => setRevenueTahasilImageFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {creating ? 'Saving…' : editingRevenueTahasilId ? 'Update Tahasil office' : 'Save Tahasil office'}
                    </button>
                    {editingRevenueTahasilId && (
                      <button
                        type="button"
                        className="mt-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-gray-50"
                        onClick={() => {
                          setEditingRevenueTahasilId(null);
                          setRevenueTahasilFormValues({});
                          setRevenueTahasilImageFile(null);
                        }}
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>
              </section>
            )}


            {deptCode === 'MINOR_IRRIGATION' && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">Manual Minor Irrigation entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Add a single Minor Irrigation Project (MIP) manually. Fields mirror the key Minor Irrigation CSV columns.
                </p>
                <form
                  className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    const nameKey = snakeFromHeader('NAME OF M.I.P');
                    const latKey = snakeFromHeader('LATITUDE');
                    const lngKey = snakeFromHeader('LONGITUDE');
                    const name = (minorFormValues[nameKey] || '').trim();
                    const latStr = minorFormValues[latKey] || '';
                    const lngStr = minorFormValues[lngKey] || '';
                    if (!name || !latStr.trim() || !lngStr.trim()) {
                      setError('Name of M.I.P, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(latStr);
                      const lng = Number(lngStr);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const block = minorFormValues[snakeFromHeader('BLOCK/ULB')] || '';
                      const gp = minorFormValues[snakeFromHeader('GP/WARD')] || '';
                      const village = minorFormValues[snakeFromHeader('VILLAGE/LOCALITY')] || '';
                      const addressParts = [block, gp, village].filter((p) => p && p.trim());

                      let orgId: number;
                      if (editingMinorId) {
                        orgId = editingMinorId;
                      } else {
                        const basePayload = {
                          name,
                          latitude: lat,
                          longitude: lng,
                          address: addressParts.length ? addressParts.join(', ') : undefined,
                          attributes: {
                            ulb_block: block || null,
                            gp_name: gp || null,
                            ward_village: village || null,
                          } as Record<string, string | number | null>,
                        };

                        const org = await organizationsApi.create({
                          department_id: me.department_id,
                          type: 'OTHER',
                          ...basePayload,
                        });
                        orgId = org.id;
                        setOrgs((prev) => [org, ...prev]);
                      }

                      const profileData: Record<string, unknown> = {};
                      splitHeader(MINOR_IRRIGATION_CSV_HEADER).forEach((header) => {
                        const key = snakeFromHeader(header);
                        const val = minorFormValues[key];
                        if (val != null && String(val).trim() !== '') {
                          profileData[key] = val;
                        }
                      });
                      profileData[latKey] = lat;
                      profileData[lngKey] = lng;
                      profileData[nameKey] = name;
                      const parseJsonArray = (raw: string | undefined) => {
                        if (!raw?.trim()) return [];
                        try {
                          const parsed = JSON.parse(raw) as unknown;
                          return Array.isArray(parsed) ? parsed : [];
                        } catch {
                          return [];
                        }
                      };
                      // Merge portfolio-style (hero/about/admin/cards/staff/contact) fields.
                      Object.entries(minorPortfolioForm).forEach(([key, value]) => {
                        if (value != null && String(value).trim() !== '') {
                          profileData[key] = value;
                        }
                      });
                      profileData.minor_key_admin_cards = parseJsonArray(minorPortfolioForm.minor_key_admin_cards_json);
                      profileData.minor_facility_cards = parseJsonArray(minorPortfolioForm.minor_facility_cards_json);
                      profileData.minor_faculty_cards = parseJsonArray(minorPortfolioForm.minor_faculty_cards_json);
                      profileData.minor_staff_rows = parseJsonArray(minorPortfolioForm.minor_staff_rows_json);
                      const galleryRows = parseJsonArray(minorPortfolioForm.gallery_images) as Array<Record<string, unknown> | string>;
                      profileData.gallery_images = galleryRows
                        .map((row) => {
                          if (typeof row === 'string') {
                            const url = row.trim();
                            if (!url) return null;
                            return { url, title: '', description: '' };
                          }
                          if (row && typeof row === 'object') {
                            const rec = row as Record<string, unknown>;
                            const url = String(rec.url || rec.image || '').trim();
                            const title = String(rec.title || '').trim();
                            const description = String(rec.description || '').trim();
                            if (!url) return null;
                            return { url, title, description };
                          }
                          return null;
                        })
                        .filter((x): x is { url: string; title: string; description: string } => Boolean(x));

                      const saved = await minorIrrigationApi.putProfile(orgId, profileData);
                      setMinorIrrigationProfiles((prev) => ({
                        ...prev,
                        [orgId]: (saved && typeof saved === 'object' ? saved : profileData) as Record<string, unknown>,
                      }));

                      if (minorIrrigationImageFile) {
                        const compressed = await compressImage(minorIrrigationImageFile, { maxSizeMB: 0.5 });
                        const updatedOrg = await organizationsApi.uploadCoverImage(orgId, compressed);
                        setOrgs((prev) => prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o)));
                        setMinorIrrigationImageFile(null);
                      }

                      setMinorFormValues({});
                      setMinorPortfolioForm(MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM);
                      setEditingMinorId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save minor irrigation entry');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {splitHeader(MINOR_IRRIGATION_CSV_HEADER).map((header) => {
                    const key = snakeFromHeader(header);
                    return (
                      <div key={key} className="space-y-1">
                        <label className="block text-text">{header}</label>
                        <input
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                          value={minorFormValues[key] ?? ''}
                          onChange={(e) =>
                            setMinorFormValues((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-text">Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-text file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) =>
                        setMinorIrrigationImageFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {creating ? 'Saving...' : editingMinorId ? 'Update MIP' : 'Save MIP'}
                    </button>
                  </div>
                </form>
                <div className="mt-4">
                  <MinorIrrigationPortfolioAdminForm
                    organizationId={editingMinorId}
                    form={minorPortfolioForm}
                    setForm={setMinorPortfolioForm}
                    existingProfile={
                      editingMinorId != null ? minorIrrigationProfiles[editingMinorId] ?? {} : {}
                    }
                  />
                </div>
              </section>
            )}

            {deptCode === 'IRRIGATION' && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">Manual Irrigation entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Add a single Irrigation project manually. Fields mirror the key Irrigation CSV columns.
                </p>
                <form
                  className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    const nameKey = snakeFromHeader('WORK NAME');
                    const latKey = snakeFromHeader('LATITUDE');
                    const lngKey = snakeFromHeader('LONGITUDE');
                    const name = (irrigationFormValues[nameKey] || '').trim();
                    const latStr = irrigationFormValues[latKey] || '';
                    const lngStr = irrigationFormValues[lngKey] || '';
                    if (!name || !latStr.trim() || !lngStr.trim()) {
                      setError('Work Name, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(latStr);
                      const lng = Number(lngStr);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const block = irrigationFormValues[snakeFromHeader('BLOCK/ULB')] || '';
                      const gp = irrigationFormValues[snakeFromHeader('GP/WARD')] || '';
                      const village = irrigationFormValues[snakeFromHeader('VILLAGE/ LOCALITY')] || '';
                      const addressParts = [block, gp, village].filter((p) => p && p.trim());

                      let orgId: number;
                      if (editingIrrigationId) {
                        orgId = editingIrrigationId;
                      } else {
                        const basePayload = {
                          name,
                          latitude: lat,
                          longitude: lng,
                          address: addressParts.length ? addressParts.join(', ') : undefined,
                          attributes: {
                            ulb_block: block || null,
                            gp_name: gp || null,
                            ward_village: village || null,
                          } as Record<string, string | number | null>,
                        };

                        const org = await organizationsApi.create({
                          department_id: me.department_id,
                          type: 'OTHER',
                          ...basePayload,
                        });
                        orgId = org.id;
                        setOrgs((prev) => [org, ...prev]);
                      }

                      const profileData: Record<string, unknown> = {};
                      splitHeader(IRRIGATION_CSV_HEADER).forEach((header) => {
                        const key = snakeFromHeader(header);
                        const val = irrigationFormValues[key];
                        if (val != null && String(val).trim() !== '') {
                          profileData[key] = val;
                        }
                      });
                      profileData[latKey] = lat;
                      profileData[lngKey] = lng;
                      profileData[nameKey] = name;

                      const { irrigationApi } = await import('../../../services/api');
                      const saved = await irrigationApi.putProfile(orgId, profileData);
                      setIrrigationProfiles((prev) => ({
                        ...prev,
                        [orgId]: (saved && typeof saved === 'object' ? saved : profileData) as Record<string, unknown>,
                      }));

                      if (irrigationImageFile) {
                        const compressed = await compressImage(irrigationImageFile, { maxSizeMB: 0.5 });
                        const updatedOrg = await organizationsApi.uploadCoverImage(orgId, compressed);
                        setOrgs((prev) => prev.map((o) => (o.id === updatedOrg.id ? updatedOrg : o)));
                        setIrrigationImageFile(null);
                      }

                      setIrrigationFormValues({});
                      setEditingIrrigationId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save irrigation entry');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {splitHeader(IRRIGATION_CSV_HEADER).map((header) => {
                    const key = snakeFromHeader(header);
                    return (
                      <div key={key} className="space-y-1">
                        <label className="block text-text">{header}</label>
                        <input
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                          value={irrigationFormValues[key] ?? ''}
                          onChange={(e) =>
                            setIrrigationFormValues((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-text">Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-text file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) =>
                        setIrrigationImageFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {creating ? 'Saving...' : editingIrrigationId ? 'Update project' : 'Save project'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {deptCode === 'EDUCATION' && isEducationSchoolSubDept(educationSubDept) && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">Manual School entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Add a single school manually. Fields mirror the Education CSV columns.
                </p>
                <form
                  className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    if (!newEducationOrg.name_of_school?.trim() || !newEducationOrg.latitude?.trim() || !newEducationOrg.longitude?.trim()) {
                      setError('Name of School, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(newEducationOrg.latitude);
                      const lng = Number(newEducationOrg.longitude);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const addressParts = [newEducationOrg.block_ulb, newEducationOrg.gp_ward, newEducationOrg.village].filter(Boolean);
                      const basePayload = {
                        name: newEducationOrg.name_of_school.trim(),
                        latitude: lat,
                        longitude: lng,
                        address: addressParts.length ? addressParts.join(', ') : undefined,
                        attributes: {
                          ulb_block: newEducationOrg.block_ulb || null,
                          gp_name: newEducationOrg.gp_ward || null,
                          ward_village: newEducationOrg.village || null,
                          sector: newEducationOrg.category || null,
                        } as Record<string, string | number | null>,
                        sub_department: educationSubDept,
                      };
                      let updated: Organization;
                      if (editingEducationId) {
                        updated = await organizationsApi.update(editingEducationId, basePayload);
                        setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                      } else {
                        const created = await organizationsApi.create({
                          department_id: me.department_id,
                          type: SCHOOL_SUB_DEPT_TO_ORG_TYPE[educationSubDept],
                          ...basePayload,
                        });
                        updated = created;
                        setOrgs((prev) => [created, ...prev]);
                      }
                      const profileData: Record<string, unknown> = {
                        block_ulb: _s(newEducationOrg.block_ulb),
                        gp_ward: _s(newEducationOrg.gp_ward),
                        village: _s(newEducationOrg.village),
                        name_of_school: newEducationOrg.name_of_school.trim(),
                        school_id: _s(newEducationOrg.school_id),
                        esst_year: _n(newEducationOrg.esst_year),
                        category: _s(newEducationOrg.category),
                        class_i: _n(newEducationOrg.class_i), class_ii: _n(newEducationOrg.class_ii), class_iii: _n(newEducationOrg.class_iii),
                        class_iv: _n(newEducationOrg.class_iv), class_v: _n(newEducationOrg.class_v), class_vi: _n(newEducationOrg.class_vi),
                        class_vii: _n(newEducationOrg.class_vii), class_viii: _n(newEducationOrg.class_viii), class_ix: _n(newEducationOrg.class_ix), class_x: _n(newEducationOrg.class_x),
                        class_xi: _n(newEducationOrg.class_xi), class_xii: _n(newEducationOrg.class_xii),
                        deo_name: _s(newEducationOrg.deo_name), deo_contact: _s(newEducationOrg.deo_contact),
                        beo_name: _s(newEducationOrg.beo_name), beo_contact: _s(newEducationOrg.beo_contact),
                        brcc_name: _s(newEducationOrg.brcc_name), brcc_contact: _s(newEducationOrg.brcc_contact),
                        crcc_name: _s(newEducationOrg.crcc_name), crcc_contact: _s(newEducationOrg.crcc_contact),
                        name_of_hm: _s(newEducationOrg.name_of_hm), contact_of_hm: _s(newEducationOrg.contact_of_hm),
                        no_of_ts: _n(newEducationOrg.no_of_ts), no_of_nts: _n(newEducationOrg.no_of_nts),
                        no_of_tgp_pcm: _n(newEducationOrg.no_of_tgp_pcm), no_of_tgp_cbz: _n(newEducationOrg.no_of_tgp_cbz), no_of_tgt_arts: _n(newEducationOrg.no_of_tgt_arts),
                        building_status: _s(newEducationOrg.building_status), no_of_rooms: _n(newEducationOrg.no_of_rooms), no_of_smart_class_rooms: _n(newEducationOrg.no_of_smart_class_rooms),
                        science_lab: _s(newEducationOrg.science_lab), toilet_m: _s(newEducationOrg.toilet_m), toilet_f: _s(newEducationOrg.toilet_f),
                        ramp: _s(newEducationOrg.ramp), meeting_hall: _s(newEducationOrg.meeting_hall), staff_common_room: _s(newEducationOrg.staff_common_room),
                        ncc: _s(newEducationOrg.ncc), nss: _s(newEducationOrg.nss), jrc: _s(newEducationOrg.jrc), eco_club: _s(newEducationOrg.eco_club), library: _s(newEducationOrg.library),
                        icc_head_name: _s(newEducationOrg.icc_head_name), icc_head_contact: _s(newEducationOrg.icc_head_contact),
                        play_ground: _s(newEducationOrg.play_ground), cycle_stand: _s(newEducationOrg.cycle_stand),
                        drinking_water_tw: _s(newEducationOrg.drinking_water_tw), drinking_water_tap: _s(newEducationOrg.drinking_water_tap),
                        drinking_water_overhead_tap: _s(newEducationOrg.drinking_water_overhead_tap), drinking_water_aquaguard: _s(newEducationOrg.drinking_water_aquaguard),
                        latitude: lat, longitude: lng, description: _s(newEducationOrg.description),
                        language: _s(newEducationOrg.language),
                        school_name_en: _s(newEducationOrg.school_name_en), school_name_od: _s(newEducationOrg.school_name_od),
                        hero_tagline_en: _s(newEducationOrg.hero_tagline_en), hero_tagline_od: _s(newEducationOrg.hero_tagline_od),
                        hero_primary_tagline_en: _s(newEducationOrg.hero_primary_tagline_en), hero_primary_tagline_od: _s(newEducationOrg.hero_primary_tagline_od),
                        hero_slides: (() => {
                          const slides = [_s(newEducationOrg.hero_slide_1), _s(newEducationOrg.hero_slide_2), _s(newEducationOrg.hero_slide_3)].filter(Boolean) as string[];
                          return slides.length ? slides : undefined;
                        })(),
                        about_short_en: _s(newEducationOrg.about_short_en), about_short_od: _s(newEducationOrg.about_short_od),
                        about_image: _s(newEducationOrg.about_image),
                        school_type_en: _s(newEducationOrg.school_type_en), school_type_od: _s(newEducationOrg.school_type_od),
                        location_en: _s(newEducationOrg.location_en), location_od: _s(newEducationOrg.location_od),
                        hm_qualification: _s(newEducationOrg.hm_qualification), hm_experience: _s(newEducationOrg.hm_experience),
                        hm_past_experience_en: _s(newEducationOrg.hm_past_experience_en),
                        hm_current_experience_en: _s(newEducationOrg.hm_current_experience_en),
                        headmaster_photo: _s(newEducationOrg.headmaster_photo),
                        headmaster_contact: _s(newEducationOrg.headmaster_contact),
                        headmaster_email: _s(newEducationOrg.headmaster_email),
                        headmaster_message_en: _s(newEducationOrg.headmaster_message_en), headmaster_message_od: _s(newEducationOrg.headmaster_message_od),
                        vision_text_en: _s(newEducationOrg.vision_text_en), vision_text_od: _s(newEducationOrg.vision_text_od),
                        mission_text_en: _s(newEducationOrg.mission_text_en), mission_text_od: _s(newEducationOrg.mission_text_od),
                        deo_image: _s(newEducationOrg.deo_image), deo_email: _s(newEducationOrg.deo_email),
                        beo_image: _s(newEducationOrg.beo_image), beo_email: _s(newEducationOrg.beo_email),
                        brcc_image: educationSubDept === 'HS' ? undefined : _s(newEducationOrg.brcc_image),
                        brcc_email: educationSubDept === 'HS' ? undefined : _s(newEducationOrg.brcc_email),
                        crc_image: educationSubDept === 'HS' ? undefined : _s(newEducationOrg.crc_image),
                        crc_name: educationSubDept === 'HS' ? undefined : _s(newEducationOrg.crc_name),
                        crc_contact: educationSubDept === 'HS' ? undefined : _s(newEducationOrg.crc_contact),
                        crc_email: educationSubDept === 'HS' ? undefined : _s(newEducationOrg.crc_email),
                        curriculum_text_en: _s(newEducationOrg.curriculum_text_en), curriculum_text_od: _s(newEducationOrg.curriculum_text_od),
                        academic_calendar_text_en: _s(newEducationOrg.academic_calendar_text_en), academic_calendar_text_od: _s(newEducationOrg.academic_calendar_text_od),
                        class_structure_text_en: _s(newEducationOrg.class_structure_text_en), class_structure_text_od: _s(newEducationOrg.class_structure_text_od),
                        subjects_offered_text_en: _s(newEducationOrg.subjects_offered_text_en), subjects_offered_text_od: _s(newEducationOrg.subjects_offered_text_od),
                        facilities_list: _s(newEducationOrg.facilities_list),
                        total_students: _n(newEducationOrg.total_students),
                        facilities_count: _n(newEducationOrg.facilities_count),
                        years_of_service: _n(newEducationOrg.years_of_service),
                        faculty_cards: (() => { try { return newEducationOrg.faculty_cards_json.trim() ? JSON.parse(newEducationOrg.faculty_cards_json) : undefined; } catch { return undefined; } })(),
                        faculty_attendance: (() => { try { return newEducationOrg.faculty_attendance_json.trim() ? JSON.parse(newEducationOrg.faculty_attendance_json) : undefined; } catch { return undefined; } })(),
                        facility_cards: (() => { try { return newEducationOrg.facility_cards_json.trim() ? JSON.parse(newEducationOrg.facility_cards_json) : undefined; } catch { return undefined; } })(),
                        infrastructure_images: (() => { try { return newEducationOrg.infrastructure_images_json.trim() ? JSON.parse(newEducationOrg.infrastructure_images_json) : undefined; } catch { return undefined; } })(),
                        activity_events: (() => { try { return newEducationOrg.activity_events_json.trim() ? JSON.parse(newEducationOrg.activity_events_json) : undefined; } catch { return undefined; } })(),
                        student_intake_rows: (() => { try { return newEducationOrg.student_intake_rows_json.trim() ? JSON.parse(newEducationOrg.student_intake_rows_json) : undefined; } catch { return undefined; } })(),
                        intake_cards: (() => { try { return newEducationOrg.intake_cards_json.trim() ? JSON.parse(newEducationOrg.intake_cards_json) : undefined; } catch { return undefined; } })(),
                        ...(educationSubDept !== 'HS'
                          ? {
                              mdm_daily_records: (() => {
                                try {
                                  return newEducationOrg.mdm_daily_json.trim() ? JSON.parse(newEducationOrg.mdm_daily_json) : undefined;
                                } catch {
                                  return undefined;
                                }
                              })(),
                            }
                          : {}),
                        parent_teacher_meetings: (() => { try { return newEducationOrg.ptm_meetings_json.trim() ? JSON.parse(newEducationOrg.ptm_meetings_json) : undefined; } catch { return undefined; } })(),
                        photo_gallery: (() => { try { return newEducationOrg.photo_gallery_json.trim() ? JSON.parse(newEducationOrg.photo_gallery_json) : undefined; } catch { return undefined; } })(),
                        contact_address_en: _s(newEducationOrg.contact_address_en), contact_address_od: _s(newEducationOrg.contact_address_od),
                        contact_phone: _s(newEducationOrg.contact_phone), contact_email: _s(newEducationOrg.contact_email),
                        office_hours_en: _s(newEducationOrg.office_hours_en), office_hours_od: _s(newEducationOrg.office_hours_od),
                      };
                      await educationApi.putProfile(updated.id, profileData);
                      if (educationImageFile) {
                        const compressed = await compressImage(educationImageFile, { maxSizeMB: 0.5 });
                        await organizationsApi.uploadCoverImage(updated.id, compressed);
                        setEducationImageFile(null);
                      }
                      setEducationProfiles((prev) => ({ ...prev, [updated.id]: profileData }));
                      setNewEducationOrg(emptyEducationOrg());
                      setEditingEducationId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save school');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  <div className="space-y-1">
                    <label className="block text-text">Block / ULB</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.block_ulb} onChange={(e) => setNewEducationOrg((s) => ({ ...s, block_ulb: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">GP / Ward</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.gp_ward} onChange={(e) => setNewEducationOrg((s) => ({ ...s, gp_ward: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">Village</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.village} onChange={(e) => setNewEducationOrg((s) => ({ ...s, village: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">Name of School</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.name_of_school} onChange={(e) => setNewEducationOrg((s) => ({ ...s, name_of_school: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">School ID</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.school_id} onChange={(e) => setNewEducationOrg((s) => ({ ...s, school_id: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">ESST Year</label>
                    <input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.esst_year} onChange={(e) => setNewEducationOrg((s) => ({ ...s, esst_year: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">Category</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.category} onChange={(e) => setNewEducationOrg((s) => ({ ...s, category: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">Latitude</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.latitude} onChange={(e) => setNewEducationOrg((s) => ({ ...s, latitude: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">Longitude</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.longitude} onChange={(e) => setNewEducationOrg((s) => ({ ...s, longitude: e.target.value }))} required />
                  </div>
                  {schoolClassFields(educationSubDept).map((fieldKey) => (
                    <div key={fieldKey} className="space-y-1">
                      <label className="block text-text">{`Class ${SCHOOL_CLASS_LABELS[fieldKey]}`}</label>
                      <input
                        type="number"
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                        value={(newEducationOrg as Record<string, string>)[fieldKey] || ''}
                        onChange={(e) =>
                          setNewEducationOrg((s) => ({
                            ...s,
                            [fieldKey]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                  <div className="space-y-1"><label className="block text-text">DEO Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.deo_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, deo_name: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">DEO Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.deo_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, deo_contact: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">BEO Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.beo_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, beo_name: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">BEO Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.beo_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, beo_contact: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">BRCC Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.brcc_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, brcc_name: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">BRCC Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.brcc_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, brcc_contact: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">CRCC Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.crcc_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, crcc_name: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">CRCC Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.crcc_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, crcc_contact: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Name of HM</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.name_of_hm} onChange={(e) => setNewEducationOrg((s) => ({ ...s, name_of_hm: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Contact of HM</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.contact_of_hm} onChange={(e) => setNewEducationOrg((s) => ({ ...s, contact_of_hm: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">No of TS</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_ts} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_ts: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">No of NTS</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_nts} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_nts: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">No of TGP (PCM)</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_tgp_pcm} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_tgp_pcm: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">No of TGP (CBZ)</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_tgp_cbz} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_tgp_cbz: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">No of TGT (Arts)</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_tgt_arts} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_tgt_arts: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Building Status</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.building_status} onChange={(e) => setNewEducationOrg((s) => ({ ...s, building_status: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">No of Rooms</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_rooms} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_rooms: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">No of Smart Class Rooms</label><input type="number" className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.no_of_smart_class_rooms} onChange={(e) => setNewEducationOrg((s) => ({ ...s, no_of_smart_class_rooms: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Science Lab</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.science_lab} onChange={(e) => setNewEducationOrg((s) => ({ ...s, science_lab: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Toilet (M)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.toilet_m} onChange={(e) => setNewEducationOrg((s) => ({ ...s, toilet_m: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Toilet (F)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.toilet_f} onChange={(e) => setNewEducationOrg((s) => ({ ...s, toilet_f: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Ramp</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.ramp} onChange={(e) => setNewEducationOrg((s) => ({ ...s, ramp: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Meeting Hall</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.meeting_hall} onChange={(e) => setNewEducationOrg((s) => ({ ...s, meeting_hall: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Staff Common Room</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.staff_common_room} onChange={(e) => setNewEducationOrg((s) => ({ ...s, staff_common_room: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">NCC</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.ncc} onChange={(e) => setNewEducationOrg((s) => ({ ...s, ncc: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">NSS</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.nss} onChange={(e) => setNewEducationOrg((s) => ({ ...s, nss: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">JRC</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.jrc} onChange={(e) => setNewEducationOrg((s) => ({ ...s, jrc: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Eco Club</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.eco_club} onChange={(e) => setNewEducationOrg((s) => ({ ...s, eco_club: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Library</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.library} onChange={(e) => setNewEducationOrg((s) => ({ ...s, library: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">ICC Head Name</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.icc_head_name} onChange={(e) => setNewEducationOrg((s) => ({ ...s, icc_head_name: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">ICC Head Contact</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.icc_head_contact} onChange={(e) => setNewEducationOrg((s) => ({ ...s, icc_head_contact: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Play Ground</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.play_ground} onChange={(e) => setNewEducationOrg((s) => ({ ...s, play_ground: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Cycle Stand</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.cycle_stand} onChange={(e) => setNewEducationOrg((s) => ({ ...s, cycle_stand: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Drinking Water (TW)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.drinking_water_tw} onChange={(e) => setNewEducationOrg((s) => ({ ...s, drinking_water_tw: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Drinking Water (Tap)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.drinking_water_tap} onChange={(e) => setNewEducationOrg((s) => ({ ...s, drinking_water_tap: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Drinking Water (Overhead Tap)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.drinking_water_overhead_tap} onChange={(e) => setNewEducationOrg((s) => ({ ...s, drinking_water_overhead_tap: e.target.value }))} /></div>
                  <div className="space-y-1"><label className="block text-text">Drinking Water (Aquaguard)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.drinking_water_aquaguard} onChange={(e) => setNewEducationOrg((s) => ({ ...s, drinking_water_aquaguard: e.target.value }))} /></div>
                  <div className="space-y-1 md:col-span-2"><label className="block text-text">Description</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.description} onChange={(e) => setNewEducationOrg((s) => ({ ...s, description: e.target.value }))} /></div>
                  {['PS', 'UPS', 'HS'].includes(educationSubDept) ? (
                    <EducationPsPortfolioAdminForm
                      organizationId={editingEducationId}
                      org={newEducationOrg as PsPortfolioOrgFields}
                      setOrg={setNewEducationOrg as Dispatch<SetStateAction<PsPortfolioOrgFields>>}
                      subDepartment={educationSubDept}
                    />
                  ) : (
                    <div className="md:col-span-2 mt-2 rounded-md border border-border bg-background-muted/40 p-3">
                      <h3 className="text-xs font-semibold text-text">School website extras (JSON)</h3>
                      <p className="mt-1 text-[11px] text-text-muted">For non–PS sub-departments, edit portfolio JSON fields here if needed.</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div className="space-y-1"><label className="block text-text">Language (en/od)</label><input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={newEducationOrg.language} onChange={(e) => setNewEducationOrg((s) => ({ ...s, language: e.target.value }))} /></div>
                        <div className="space-y-1 md:col-span-2"><label className="block text-text">Faculty Cards JSON</label><textarea rows={3} className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs outline-none focus:border-primary" value={newEducationOrg.faculty_cards_json} onChange={(e) => setNewEducationOrg((s) => ({ ...s, faculty_cards_json: e.target.value }))} /></div>
                        <div className="space-y-1 md:col-span-2"><label className="block text-text">Photo Gallery JSON</label><textarea rows={3} className="w-full rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs outline-none focus:border-primary" value={newEducationOrg.photo_gallery_json} onChange={(e) => setNewEducationOrg((s) => ({ ...s, photo_gallery_json: e.target.value }))} /></div>
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <button type="submit" disabled={creating} className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                      {creating ? 'Saving...' : editingEducationId ? 'Update School' : 'Save School'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {deptCode === 'EDUCATION' && !isEducationSchoolSubDept(educationSubDept) && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">
                  Manual{' '}
                  {educationSubDept === 'ENGINEERING_COLLEGE'
                    ? 'Engineering College'
                    : educationSubDept === 'ITI'
                      ? 'ITI'
                      : educationSubDept === 'DIPLOMA_COLLEGE'
                        ? 'Diploma College'
                        : educationSubDept === 'UNIVERSITY'
                          ? 'University'
                          : 'Education'}{' '}
                  entry
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Add a single institution manually. All columns from the selected CSV template are available below.
                </p>
                <form
                  className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    const headers = getEducationHeadersForSubDept(educationSubDept);
                    const nameHeader =
                      educationSubDept === 'ENGINEERING_COLLEGE'
                        ? 'NAME OF COLLEGE'
                        : educationSubDept === 'ITI'
                          ? 'ITI NAME'
                          : educationSubDept === 'DIPLOMA_COLLEGE'
                            ? 'COLLEGE NAME'
                            : educationSubDept === 'UNIVERSITY'
                              ? 'UNIVERSITY NAME'
                              : '';
                    const nameKey = nameHeader ? snakeFromHeader(nameHeader) : '';
                    const latKey = snakeFromHeader('LATITUDE');
                    const lngKey = snakeFromHeader('LONGITUDE');
                    const name = nameKey ? (eduFormValues[nameKey] || '').trim() : '';
                    const latStr = eduFormValues[latKey] || '';
                    const lngStr = eduFormValues[lngKey] || '';
                    if (!name || !latStr.trim() || !lngStr.trim()) {
                      setError('Name, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(latStr);
                      const lng = Number(lngStr);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const blockKey = snakeFromHeader('BLOCK/ULB');
                      const gpKey = snakeFromHeader('GP/WARD');
                      const villageKey =
                        educationSubDept === 'ITI' || educationSubDept === 'DIPLOMA_COLLEGE'
                          ? snakeFromHeader('VILLAGE/LOCALITY')
                          : snakeFromHeader('VILLAGE');
                      const block = eduFormValues[blockKey] || '';
                      const gp = eduFormValues[gpKey] || '';
                      const village = eduFormValues[villageKey] || '';
                      const addressParts = [block, gp, village].filter((p) => p && p.trim());
                      const basePayload = {
                        name,
                        latitude: lat,
                        longitude: lng,
                        address: addressParts.length ? addressParts.join(', ') : undefined,
                        attributes: {
                          ulb_block: block || null,
                          gp_name: gp || null,
                          ward_village: village || null,
                        } as Record<string, string | number | null>,
                        sub_department: educationSubDept,
                      };
                      const orgType =
                        educationSubDept === 'UNIVERSITY'
                          ? 'UNIVERSITY'
                          : 'COLLEGE';
                      let org: Organization;
                      if (editingEducationId) {
                        org = await organizationsApi.update(editingEducationId, basePayload);
                        setOrgs((prev) => prev.map((o) => (o.id === org.id ? org : o)));
                      } else {
                        org = await organizationsApi.create({
                          department_id: me.department_id,
                          type: orgType,
                          ...basePayload,
                        });
                        setOrgs((prev) => [org, ...prev]);
                      }
                      const profileData: Record<string, unknown> = {};
                      headers.forEach((h) => {
                        const key = snakeFromHeader(h);
                        const val = eduFormValues[key];
                        if (val != null && String(val).trim() !== '') {
                          profileData[key] = val;
                        }
                      });
                      profileData[latKey] = lat;
                      profileData[lngKey] = lng;
                      await educationApi.putProfile(org.id, profileData);
                      if (educationOtherImageFile) {
                        const compressed = await compressImage(educationOtherImageFile, { maxSizeMB: 0.5 });
                        await organizationsApi.uploadCoverImage(org.id, compressed);
                        setEducationOtherImageFile(null);
                      }
                      setEducationProfiles((prev) => ({ ...prev, [org.id]: profileData }));
                      setEduFormValues({});
                      setEditingEducationId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save organization');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {getEducationHeadersForSubDept(educationSubDept).map((header) => {
                    const key = snakeFromHeader(header);
                    return (
                      <div key={key} className="space-y-1">
                        <label className="block text-text">{header}</label>
                        <input
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                          value={eduFormValues[key] ?? ''}
                          onChange={(e) =>
                            setEduFormValues((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                        />
                      </div>
                    );
                  })}

                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-text font-medium">Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-text file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => setEducationOtherImageFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {creating ? 'Saving...' : editingEducationId ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {deptCode === 'HEALTH' && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">Manual Health facility entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  All fields are in the section tabs below: identity and cover image in <span className="font-medium text-text">Hero</span>, location
                  lines in <span className="font-medium text-text">About</span>, map coordinates in <span className="font-medium text-text">Contact</span>, plus
                  admins, facilities, doctors, staff, highlights, and gallery. Use <span className="font-medium text-text">Update facility</span>{' '}
                  once when done. Institution head in About merges with profile records on save.
                </p>
                <form
                  className="mt-3 space-y-4 text-xs"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    if (!newHealthOrg.name?.trim() || !newHealthOrg.latitude?.trim() || !newHealthOrg.longitude?.trim()) {
                      setError('Name, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(newHealthOrg.latitude);
                      const lng = Number(newHealthOrg.longitude);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const addressParts = [newHealthOrg.block_ulb, newHealthOrg.gp_ward, newHealthOrg.village].filter(Boolean);
                      const basePayload = {
                        name: newHealthOrg.name.trim(),
                        latitude: lat,
                        longitude: lng,
                        address: addressParts.length ? addressParts.join(', ') : undefined,
                        attributes: {
                          ulb_block: newHealthOrg.block_ulb || null,
                          gp_name: newHealthOrg.gp_ward || null,
                          ward_village: newHealthOrg.village || null,
                          category: newHealthOrg.category || null,
                        } as Record<string, string | number | null>,
                      };
                      let updated: Organization;
                      if (editingHealthId) {
                        updated = await organizationsApi.update(editingHealthId, basePayload);
                        setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
                      } else {
                        const created = await organizationsApi.create({
                          department_id: me.department_id,
                          type: 'HEALTH_CENTRE',
                          ...basePayload,
                        });
                        updated = created;
                        setOrgs((prev) => [created, ...prev]);
                      }
                      const parseHealthGalleryRows = (raw: string | undefined) => {
                        if (!raw?.trim()) return [];
                        try {
                          const parsed = JSON.parse(raw) as unknown;
                          return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
                        } catch {
                          return [];
                        }
                      };
                      const parseHealthFacilityJson = (raw: string | undefined): Record<string, unknown>[] => {
                        if (!raw?.trim()) return [];
                        try {
                          const parsed = JSON.parse(raw) as unknown;
                          return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
                        } catch {
                          return [];
                        }
                      };
                      let healthDoctorAttendance: Record<string, unknown> = {};
                      try {
                        const raw = (healthPortfolioForm.health_doctor_attendance_json || '').trim();
                        if (raw) {
                          const p = JSON.parse(raw) as unknown;
                          if (p && typeof p === 'object' && !Array.isArray(p)) healthDoctorAttendance = p as Record<string, unknown>;
                        }
                      } catch {
                        healthDoctorAttendance = {};
                      }
                      const profileData: Record<string, unknown> = {
                        block_ulb: _s(newHealthOrg.block_ulb),
                        gp_ward: _s(newHealthOrg.gp_ward),
                        village: _s(newHealthOrg.village),
                        latitude: lat,
                        longitude: lng,
                        name: newHealthOrg.name.trim(),
                        institution_id: _s(newHealthOrg.institution_id),
                        category: _s(newHealthOrg.category),
                        inst_head_name: _s(
                          healthPortfolioForm.health_inst_head_name || newHealthOrg.inst_head_name || '',
                        ),
                        inst_head_contact: _s(
                          healthPortfolioForm.health_inst_head_contact || newHealthOrg.inst_head_contact || '',
                        ),
                        no_of_ts: _n(newHealthOrg.no_of_ts),
                        no_of_nts: _n(newHealthOrg.no_of_nts),
                        no_of_mo: _n(newHealthOrg.no_of_mo),
                        no_of_pharmacist: _n(newHealthOrg.no_of_pharmacist),
                        no_of_anm: _n(newHealthOrg.no_of_anm),
                        no_of_health_worker: _n(newHealthOrg.no_of_health_worker),
                        no_of_pathology: _n(newHealthOrg.no_of_pathology),
                        no_of_clerk: _n(newHealthOrg.no_of_clerk),
                        no_of_sweeper: _n(newHealthOrg.no_of_sweeper),
                        no_of_nw: _n(newHealthOrg.no_of_nw),
                        no_of_bed: _n(newHealthOrg.no_of_bed),
                        no_of_icu: _n(newHealthOrg.no_of_icu),
                        x_ray_availabilaty: _s(newHealthOrg.x_ray_availabilaty),
                        ct_scan_availability: _s(newHealthOrg.ct_scan_availability),
                        availability_of_pathology_testing: _s(newHealthOrg.availability_of_pathology_testing),
                        description: _s(newHealthOrg.description),
                        health_display_name: _s(healthPortfolioForm.health_display_name || ''),
                        health_hero_tagline: _s(healthPortfolioForm.health_hero_tagline || ''),
                        health_tagline: _s(healthPortfolioForm.health_tagline || ''),
                        health_hero_1: _s(healthPortfolioForm.health_hero_1 || ''),
                        health_hero_2: _s(healthPortfolioForm.health_hero_2 || ''),
                        health_hero_3: _s(healthPortfolioForm.health_hero_3 || ''),
                        health_about: _s(healthPortfolioForm.health_about || ''),
                        health_campus_image: _s(healthPortfolioForm.health_campus_image || ''),
                        health_established_year: _s(healthPortfolioForm.health_established_year || ''),
                        health_facility_type: _s(healthPortfolioForm.health_facility_type || ''),
                        health_location_line: _s(healthPortfolioForm.health_location_line || ''),
                        health_inst_head_message: _s(healthPortfolioForm.health_inst_head_message || ''),
                        health_inst_head_name: _s(
                          healthPortfolioForm.health_inst_head_name || newHealthOrg.inst_head_name || '',
                        ),
                        health_inst_head_photo: _s(healthPortfolioForm.health_inst_head_photo || ''),
                        health_inst_head_qualification: _s(healthPortfolioForm.health_inst_head_qualification || ''),
                        health_inst_head_experience: _s(healthPortfolioForm.health_inst_head_experience || ''),
                        health_inst_head_contact: _s(
                          healthPortfolioForm.health_inst_head_contact || newHealthOrg.inst_head_contact || '',
                        ),
                        health_inst_head_email: _s(healthPortfolioForm.health_inst_head_email || ''),
                        health_key_admin_cards: parseHealthGalleryRows(healthPortfolioForm.health_key_admin_cards_json),
                        health_health_facility_cards: normalizeHealthFacilityCardsForSave(
                          parseHealthFacilityJson(healthPortfolioForm.health_health_facility_cards_json),
                        ),
                        health_doctor_cards: parseHealthGalleryRows(healthPortfolioForm.health_doctor_cards_json),
                        health_doctor_attendance: healthDoctorAttendance,
                        health_ts_nts_staff_rows: parseHealthGalleryRows(healthPortfolioForm.health_ts_nts_staff_rows_json),
                        health_clinical_staff_rows: parseHealthGalleryRows(healthPortfolioForm.health_clinical_staff_rows_json),
                        health_equipment_rows: parseHealthGalleryRows(healthPortfolioForm.health_equipment_rows_json),
                        health_photo_gallery: parseHealthGalleryRows(healthPortfolioForm.health_photo_gallery_json),
                        health_full_address: _s(healthPortfolioForm.health_full_address || ''),
                        health_helpdesk_phone: _s(healthPortfolioForm.health_helpdesk_phone || ''),
                        health_emergency_phone: _s(healthPortfolioForm.health_emergency_phone || ''),
                        health_public_email: _s(healthPortfolioForm.health_public_email || ''),
                        health_office_hours: _s(healthPortfolioForm.health_office_hours || ''),
                        health_contact_email: _s(
                          healthPortfolioForm.health_public_email || healthPortfolioForm.health_contact_email || '',
                        ),
                      };
                      await healthApi.putProfile(updated.id, profileData);
                      if (healthImageFile) {
                        const compressed = await compressImage(healthImageFile, { maxSizeMB: 0.5 });
                        await organizationsApi.uploadCoverImage(updated.id, compressed);
                        setHealthImageFile(null);
                      }
                      setNewHealthOrg(emptyHealthOrg());
                      setHealthPortfolioForm(emptyHealthPortfolioForm());
                      setEditingHealthId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save facility');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  <div className="min-w-0 w-full overflow-visible rounded-lg border border-dashed border-border/80 bg-muted/20 p-3">
                    <HealthPortfolioAdminForm
                      organizationId={editingHealthId}
                      form={healthPortfolioForm}
                      setForm={setHealthPortfolioForm}
                      facilityRecord={{
                        block_ulb: newHealthOrg.block_ulb,
                        gp_ward: newHealthOrg.gp_ward,
                        village: newHealthOrg.village,
                        name: newHealthOrg.name,
                        institution_id: newHealthOrg.institution_id,
                        latitude: newHealthOrg.latitude,
                        longitude: newHealthOrg.longitude,
                        category: newHealthOrg.category,
                        inst_head_name: newHealthOrg.inst_head_name,
                        inst_head_contact: newHealthOrg.inst_head_contact,
                      }}
                      onFacilityRecordPatch={(patch) => setNewHealthOrg((s) => ({ ...s, ...patch }))}
                      profileImageControl={
                        <div className="space-y-1">
                          <span className="block text-[11px] text-text">Profile image (optional)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full text-[11px] file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
                            onChange={(e) => setHealthImageFile(e.target.files?.[0] ?? null)}
                          />
                        </div>
                      }
                      resources={{
                        no_of_ts: newHealthOrg.no_of_ts,
                        no_of_nts: newHealthOrg.no_of_nts,
                        no_of_mo: newHealthOrg.no_of_mo,
                        no_of_pharmacist: newHealthOrg.no_of_pharmacist,
                        no_of_anm: newHealthOrg.no_of_anm,
                        no_of_health_worker: newHealthOrg.no_of_health_worker,
                        no_of_pathology: newHealthOrg.no_of_pathology,
                        no_of_clerk: newHealthOrg.no_of_clerk,
                        no_of_sweeper: newHealthOrg.no_of_sweeper,
                        no_of_nw: newHealthOrg.no_of_nw,
                        no_of_bed: newHealthOrg.no_of_bed,
                        no_of_icu: newHealthOrg.no_of_icu,
                        x_ray_availabilaty: newHealthOrg.x_ray_availabilaty,
                        ct_scan_availability: newHealthOrg.ct_scan_availability,
                        availability_of_pathology_testing: newHealthOrg.availability_of_pathology_testing,
                        description: newHealthOrg.description,
                      }}
                      onResourcesPatch={(patch) => setNewHealthOrg((s) => ({ ...s, ...patch }))}
                    />
                  </div>
                  <div>
                    <button type="submit" disabled={creating} className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
                      {creating ? 'Saving...' : editingHealthId ? 'Update facility' : 'Save facility'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {deptCode === 'ELECTRICITY' && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">Manual Electricity entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Add a single Electricity office/center manually. Fields mirror the CSV columns.
                </p>
                <form
                  className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    const headers = splitHeader(ELECTRICITY_CSV_HEADER);
                    const nameKey = snakeFromHeader('NAME OF OFFICE/CENTER');
                    const latKey = snakeFromHeader('LATITUDE');
                    const lngKey = snakeFromHeader('LONGITUDE');
                    const name = (elecFormValues[nameKey] || '').trim();
                    const latStr = elecFormValues[latKey] || '';
                    const lngStr = elecFormValues[lngKey] || '';
                    if (!name || !latStr.trim() || !lngStr.trim()) {
                      setError('Name of Office/Center, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(latStr);
                      const lng = Number(lngStr);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const blockKey = snakeFromHeader('BLOCK/ULB');
                      const gpKey = snakeFromHeader('GP/WARD');
                      const villageKey = snakeFromHeader('VILLAGE/LOCALITY');
                      const block = elecFormValues[blockKey] || '';
                      const gp = elecFormValues[gpKey] || '';
                      const village = elecFormValues[villageKey] || '';
                      const addressParts = [block, gp, village].filter((p) => p && p.trim());
                      const basePayload = {
                        name,
                        latitude: lat,
                        longitude: lng,
                        address: addressParts.length ? addressParts.join(', ') : undefined,
                        attributes: {
                          ulb_block: block || null,
                          gp_name: gp || null,
                          ward_village: village || null,
                        } as Record<string, string | number | null>,
                      };
                      let org: Organization;
                      if (editingElectricityId) {
                        org = await organizationsApi.update(editingElectricityId, basePayload);
                        setOrgs((prev) => prev.map((o) => (o.id === org.id ? org : o)));
                      } else {
                        org = await organizationsApi.create({
                          department_id: me.department_id,
                          type: 'OTHER',
                          ...basePayload,
                        });
                        setOrgs((prev) => [org, ...prev]);
                      }
                      const profileData: Record<string, unknown> = {};
                      headers.forEach((h) => {
                        const key = snakeFromHeader(h);
                        const val = elecFormValues[key];
                        if (val != null && String(val).trim() !== '') {
                          profileData[key] = val;
                        }
                      });
                      profileData[latKey] = lat;
                      profileData[lngKey] = lng;
                      await electricityApi.putProfile(org.id, profileData);
                      if (electricityImageFile) {
                        const compressed = await compressImage(electricityImageFile, { maxSizeMB: 0.5 });
                        await organizationsApi.uploadCoverImage(org.id, compressed);
                        setElectricityImageFile(null);
                      }
                      setElectricityProfiles((prev) => ({ ...prev, [org.id]: profileData }));
                      setElecFormValues({});
                      setEditingElectricityId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save organization');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  {splitHeader(ELECTRICITY_CSV_HEADER).map((header) => {
                    const key = snakeFromHeader(header);
                    return (
                      <div key={key} className="space-y-1">
                        <label className="block text-text">{header}</label>
                        <input
                          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                          value={elecFormValues[key] ?? ''}
                          onChange={(e) =>
                            setElecFormValues((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                        />
                      </div>
                    );
                  })}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-text font-medium">Profile Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-text file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => setElectricityImageFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {creating ? 'Saving...' : editingElectricityId ? 'Update Electricity Entry' : 'Save Electricity Entry'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {deptCode === 'ARCS' && (
              <section className="rounded-lg border border-border bg-background p-4">
                <h2 className="text-sm font-semibold text-text">ARCS portfolio entry</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Add or update ARCS section-wise data (hero, about, incharge, membership, fertiliser, seed, mini bank loans).
                </p>
                <form
                  className="mt-3 grid gap-3 text-xs md:grid-cols-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!me?.department_id) {
                      setError('Department is not set for this admin user.');
                      return;
                    }
                    const name = (arcsFormValues.arcs_name || arcsFormValues.society_name || '').trim();
                    const latStr = arcsFormValues.latitude || '';
                    const lngStr = arcsFormValues.longitude || '';
                    if (!name || !latStr.trim() || !lngStr.trim()) {
                      setError('ARCS name, Latitude and Longitude are required.');
                      return;
                    }
                    setCreating(true);
                    setError(null);
                    try {
                      const lat = Number(latStr);
                      const lng = Number(lngStr);
                      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                        throw new Error('Latitude and Longitude must be valid numbers.');
                      }
                      const block = arcsFormValues.block_ulb || '';
                      const jurRaw = (arcsFormValues.jurisdiction_type || '').trim();
                      const ju = jurRaw.toUpperCase();
                      let jurisdictionBucket = '';
                      if (ju.includes('RURAL') && ju.includes('URBAN')) jurisdictionBucket = 'MIXED';
                      else if (ju.includes('MIX')) jurisdictionBucket = 'MIXED';
                      else if (ju.startsWith('URBAN')) jurisdictionBucket = 'URBAN';
                      else if (ju.startsWith('RURAL')) jurisdictionBucket = 'RURAL';
                      const basePayload = {
                        name,
                        latitude: lat,
                        longitude: lng,
                        address: (arcsFormValues.full_address || '').trim() || undefined,
                        attributes: {
                          jurisdiction_type: jurisdictionBucket || null,
                          ulb_block: block.trim() || null,
                        } as Record<string, string | null>,
                      };
                      let org: Organization;
                      if (editingArcsId) {
                        org = await organizationsApi.update(editingArcsId, basePayload);
                        setOrgs((prev) => prev.map((o) => (o.id === org.id ? org : o)));
                      } else {
                        org = await organizationsApi.create({
                          department_id: me.department_id,
                          type: 'OTHER',
                          ...basePayload,
                        });
                        setOrgs((prev) => [org, ...prev]);
                      }
                      const parseRows = (raw: string | undefined) => {
                        if (!raw || !raw.trim()) return undefined;
                        try { return JSON.parse(raw); } catch { return undefined; }
                      };
                      const profileData: Record<string, unknown> = {
                        block_ulb: arcsFormValues.block_ulb || undefined,
                        society_name: name,
                        registration_number: arcsFormValues.registration_number || undefined,
                        jurisdiction_type_rural_urban_mixed: arcsFormValues.jurisdiction_type || undefined,
                        full_address: arcsFormValues.full_address || undefined,
                        latitude: lat,
                        longitude: lng,
                        office_phone: arcsFormValues.office_phone || undefined,
                        office_email: arcsFormValues.office_email || undefined,
                        secretary_name: arcsFormValues.secretary_name || undefined,
                        arcs_name: arcsFormValues.arcs_name || undefined,
                        arcs_tagline: arcsFormValues.arcs_tagline || undefined,
                        arcs_about: arcsFormValues.arcs_about || undefined,
                        arcs_about_image: arcsFormValues.arcs_about_image || undefined,
                        arcs_secretary_image: arcsFormValues.arcs_secretary_image || undefined,
                        arcs_hero_1: arcsFormValues.arcs_hero_1 || undefined,
                        arcs_hero_2: arcsFormValues.arcs_hero_2 || undefined,
                        arcs_hero_3: arcsFormValues.arcs_hero_3 || undefined,
                        arcs_incharge_cards: parseRows(arcsFormValues.arcs_incharge_cards_json),
                        arcs_membership_rows: parseRows(arcsFormValues.arcs_membership_rows_json),
                        arcs_fertiliser_cards: parseRows(arcsFormValues.arcs_fertiliser_cards_json),
                        arcs_seed_cards: parseRows(arcsFormValues.arcs_seed_cards_json),
                        arcs_loan_cards: parseRows(arcsFormValues.arcs_loan_cards_json),
                        arcs_photo_gallery: parseRows(arcsFormValues.arcs_photo_gallery_json),
                        arcs_office_hours: arcsFormValues.arcs_office_hours || undefined,
                        arcs_secretary_message: arcsFormValues.arcs_secretary_message || undefined,
                        arcs_vision: arcsFormValues.arcs_vision || undefined,
                        arcs_mission: arcsFormValues.arcs_mission || undefined,
                      };
                      await arcsApi.putProfile(org.id, profileData);
                      if (arcsImageFile) {
                        const compressed = await compressImage(arcsImageFile, { maxSizeMB: 0.5 });
                        await organizationsApi.uploadCoverImage(org.id, compressed);
                        setArcsImageFile(null);
                      }
                      setArcsProfiles((prev) => ({ ...prev, [org.id]: profileData }));
                      setArcsFormValues({});
                      setEditingArcsId(null);
                    } catch (err: any) {
                      setError(err.message || 'Failed to save organization');
                    } finally {
                      setCreating(false);
                    }
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-text">ARCS name</label>
                      <CharCount value={arcsFormValues.arcs_name ?? ''} max={ARCS_FIELD_LIMITS.arcs_name} />
                    </div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      maxLength={ARCS_FIELD_LIMITS.arcs_name}
                      value={arcsFormValues.arcs_name ?? ''}
                      onChange={(e) => setArcsFormValues((p) => ({ ...p, arcs_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-text">Registration number</label>
                      <CharCount value={arcsFormValues.registration_number ?? ''} max={ARCS_FIELD_LIMITS.registration_number} />
                    </div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      maxLength={ARCS_FIELD_LIMITS.registration_number}
                      value={arcsFormValues.registration_number ?? ''}
                      onChange={(e) => setArcsFormValues((p) => ({ ...p, registration_number: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-text">Block/ULB</label>
                      <CharCount value={arcsFormValues.block_ulb ?? ''} max={ARCS_FIELD_LIMITS.block_ulb} />
                    </div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      maxLength={ARCS_FIELD_LIMITS.block_ulb}
                      value={arcsFormValues.block_ulb ?? ''}
                      onChange={(e) => setArcsFormValues((p) => ({ ...p, block_ulb: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-text">Jurisdiction</label>
                      <CharCount value={arcsFormValues.jurisdiction_type ?? ''} max={ARCS_FIELD_LIMITS.jurisdiction_type} />
                    </div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      maxLength={ARCS_FIELD_LIMITS.jurisdiction_type}
                      value={arcsFormValues.jurisdiction_type ?? ''}
                      onChange={(e) => setArcsFormValues((p) => ({ ...p, jurisdiction_type: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">Latitude</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={arcsFormValues.latitude ?? ''} onChange={(e) => setArcsFormValues((p) => ({ ...p, latitude: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-text">Longitude</label>
                    <input className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary" value={arcsFormValues.longitude ?? ''} onChange={(e) => setArcsFormValues((p) => ({ ...p, longitude: e.target.value }))} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-text">Full address</label>
                      <CharCount value={arcsFormValues.full_address ?? ''} max={ARCS_FIELD_LIMITS.full_address} />
                    </div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      maxLength={ARCS_FIELD_LIMITS.full_address}
                      value={arcsFormValues.full_address ?? ''}
                      onChange={(e) => setArcsFormValues((p) => ({ ...p, full_address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-text">Office phone</label>
                      <CharCount value={arcsFormValues.office_phone ?? ''} max={ARCS_FIELD_LIMITS.office_phone} />
                    </div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      maxLength={ARCS_FIELD_LIMITS.office_phone}
                      value={arcsFormValues.office_phone ?? ''}
                      onChange={(e) => setArcsFormValues((p) => ({ ...p, office_phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-text">Office email</label>
                      <CharCount value={arcsFormValues.office_email ?? ''} max={ARCS_FIELD_LIMITS.office_email} />
                    </div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      maxLength={ARCS_FIELD_LIMITS.office_email}
                      value={arcsFormValues.office_email ?? ''}
                      onChange={(e) => setArcsFormValues((p) => ({ ...p, office_email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="block text-text">Secretary name</label>
                      <CharCount value={arcsFormValues.secretary_name ?? ''} max={ARCS_FIELD_LIMITS.secretary_name} />
                    </div>
                    <input
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                      maxLength={ARCS_FIELD_LIMITS.secretary_name}
                      value={arcsFormValues.secretary_name ?? ''}
                      onChange={(e) => setArcsFormValues((p) => ({ ...p, secretary_name: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <ArcsPortfolioAdminForm organizationId={editingArcsId} form={arcsFormValues} setForm={setArcsFormValues} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-text font-medium">Profile image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-xs text-text file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => setArcsImageFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={creating}
                      className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {creating ? 'Saving...' : editingArcsId ? 'Update society' : 'Save society'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section className="rounded-lg border border-border bg-background p-4">
              <h2 className="text-sm font-semibold text-text">Bulk CSV upload</h2>
              <p className="mt-1 text-xs text-text-muted">
                {deptCode === 'EDUCATION'
                  ? isEducationSchoolSubDept(educationSubDept)
                    ? 'Upload Education minister CSV for schools. Organizations and profiles will be created or updated by NAME OF SCHOOL, LATITUDE, LONGITUDE.'
                    : 'Upload Education CSV for the selected sub-department. Organizations and profiles will be created or updated by name and location.'
                  : deptCode === 'HEALTH'
                    ? 'Upload Health minister CSV. Organizations and profiles will be created or updated by NAME, LATITUDE, LONGITUDE.'
                    : deptCode === 'ELECTRICITY'
                      ? 'Upload Electricity CSV. Organizations and profiles will be created or updated by NAME OF OFFICE/CENTER, LATITUDE, LONGITUDE.'
                      : deptCode === 'ARCS'
                        ? 'Upload ARCS CSV or Excel (.xlsx) template. Societies are keyed by REGISTRATION NUMBER when present, else SOCIETY NAME and coordinates. Excel must use sheet assistant_registrar_cooperative (rows from line 4).'
                        : deptCode === 'WATCO_RWSS'
                        ? 'Upload WATCO/RWSS water supply CSV. Schemes will be created or updated by STATION NAME, LATITUDE, LONGITUDE.'
                        : deptCode === 'MINOR_IRRIGATION'
                          ? 'Upload Minor Irrigation CSV. Projects will be created or updated by NAME OF M.I.P, LATITUDE, LONGITUDE.'
                          : deptCode === 'REVENUE_LAND'
                            ? 'Upload Tahasil portfolio CSV. Organizations will be created/updated by TAHSIL_NAME (or OFFICE NAME), LATITUDE, LONGITUDE, and all additional attributes are saved to profile.'
                            : 'Upload ICDS AWC CSV (same format as backend import). Existing AWC organizations for this department will be replaced.'}
              </p>
              <div className="mt-3 flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-gray-50"
                  onClick={handleDownloadTemplate}
                >
                  Download CSV template
                </button>
                <form className="flex flex-col gap-2 md:flex-row md:items-center" onSubmit={handleUpload}>
                  <input
                    type="file"
                    name="file"
                    accept=".csv,text/csv"
                    className="text-xs"
                  />
                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {uploading ? 'Uploading...' : 'Upload CSV'}
                  </button>
                </form>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background p-4">
              <h2 className="text-sm font-semibold text-text">
                {deptCode === 'REVENUE_LAND' ? 'Tahasil offices' : 'Organizations in your department'}
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                {deptCode === 'REVENUE_LAND'
                  ? 'Click a Tahasil row to open its profile and add land parcels under it.'
                  : 'You can see and delete organizations for your department. (Full edit UI will be added on top of this.)'}
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-background-muted">
                      <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Sl. No.</th>
                      <th className="px-2 py-1 text-left font-medium text-text">
                        {deptCode === 'EDUCATION'
                          ? isEducationSchoolSubDept(educationSubDept)
                            ? 'School Name'
                            : 'Institution Name'
                          : deptCode === 'HEALTH'
                            ? 'Facility Name'
                            : deptCode === 'ELECTRICITY'
                              ? 'Office Name'
                              : deptCode === 'ARCS'
                                ? 'Society name'
                                : deptCode === 'WATCO' || deptCode === 'WATCO_RWSS'
                                ? 'Station Name'
                                : deptCode === 'MINOR_IRRIGATION'
                                  ? 'MIP Name'
                                  : deptCode === 'IRRIGATION'
                                    ? 'Work Name'
                                    : deptCode === 'REVENUE_LAND'
                                      ? 'Tahasil / parcel name'
                                      : deptCode === 'AGRICULTURE'
                                        ? 'Name of Office/Centre'
                                        : 'AWC Name'}
                      </th>
                      {(deptCode !== 'EDUCATION' && deptCode !== 'HEALTH' && deptCode !== 'ELECTRICITY' && deptCode !== 'ARCS' && deptCode !== 'WATCO_RWSS' && deptCode !== 'MINOR_IRRIGATION' && deptCode !== 'IRRIGATION' && deptCode !== 'REVENUE_LAND' && deptCode !== 'AGRICULTURE') && (
                        <>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ULB / Block</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">GP / Ward</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Village</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWC ID</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Building status</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Latitude</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Longitude</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Student strength</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CPDO name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CPDO contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Supervisor name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Supervisor contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWW name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWW contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWH name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">AWH contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Sector</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">LGD Code</th>
                        </>
                      )}
                      {deptCode === 'WATCO_RWSS' && (
                        <>
                          {splitHeader(WATCO_CSV_HEADER).filter(h => h !== 'STATION NAME').map((header) => (
                            <th key={header} className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">
                              {header}
                            </th>
                          ))}
                        </>
                      )}
                      {deptCode === 'REVENUE_LAND' && (
                        <>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Tahasil Code</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Established Year</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Block / ULB</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Latitude</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Longitude</th>
                        </>
                      )}
                      {deptCode === 'AGRICULTURE' && (
                        <>
                          {splitHeader(AGRICULTURE_CSV_HEADER).map((header) => (
                            <th
                              key={header}
                              className="px-2 py-1 text-left font-medium text-text whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </>
                      )}
                      {deptCode === 'EDUCATION' && isEducationSchoolSubDept(educationSubDept) && (
                        <>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ULB / Block</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">GP / Ward</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Village</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">School ID</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ESST Year</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Category</th>
                          {schoolClassFields(educationSubDept).map((fieldKey) => (
                            <th key={fieldKey} className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">
                              {SCHOOL_CLASS_LABELS[fieldKey]}
                            </th>
                          ))}
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DEO Name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DEO Contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">BEO Name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">BEO Contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">BRCC Name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">BRCC Contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CRCC Name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CRCC Contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">HM Name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">HM Contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of TS</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of NTS</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">TGP(PCM)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">TGP(CBZ)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">TGT(Arts)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Building Status</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Rooms</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Smart Class</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Science Lab</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Toilet(M)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Toilet(F)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Ramp</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Meeting Hall</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Staff Room</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">NCC</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">NSS</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">JRC</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Eco Club</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Library</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ICC Head</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ICC Contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Play Ground</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Cycle Stand</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DW(TW)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DW(Tap)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DW(Overhead)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">DW(Aquaguard)</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Latitude</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Longitude</th>
                        </>
                      )}
                      {deptCode === 'EDUCATION' && !isEducationSchoolSubDept(educationSubDept) && (
                        <>
                          {getEducationHeadersForSubDept(educationSubDept).map((header) => (
                            <th
                              key={header}
                              className="px-2 py-1 text-left font-medium text-text whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </>
                      )}
                      {deptCode === 'HEALTH' && (
                        <>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">ULB / Block</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">GP / Ward</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Village</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Institution ID</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Category</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Inst Head Name</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Inst Head Contact</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of TS</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of NTS</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of MO</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Pharmacist</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of ANM</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Health Worker</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Pathology</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Clerk</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Sweeper</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of NW</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of Bed</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">No of ICU</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">X-Ray</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">CT-Scan</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Pathology Testing</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Latitude</th>
                          <th className="px-2 py-1 text-left font-medium text-text whitespace-nowrap">Longitude</th>
                        </>
                      )}
                      {deptCode === 'ELECTRICITY' && (
                        <>
                          {splitHeader(ELECTRICITY_CSV_HEADER).map((header) => {
                            if (header === 'NAME OF OFFICE/CENTER') return null;
                            return (
                              <th
                                key={header}
                                className="px-2 py-1 text-left font-medium text-text whitespace-nowrap"
                              >
                                {header}
                              </th>
                            );
                          })}
                        </>
                      )}
                      {deptCode === 'ARCS' && (
                        <>
                          {splitHeader(ARCS_CSV_HEADER).map((header) => {
                            if (header === 'SOCIETY NAME') return null;
                            return (
                              <th
                                key={header}
                                className="px-2 py-1 text-left font-medium text-text whitespace-nowrap"
                              >
                                {header}
                              </th>
                            );
                          })}
                        </>
                      )}
                      {deptCode === 'MINOR_IRRIGATION' && (
                        <>
                          {splitHeader(MINOR_IRRIGATION_CSV_HEADER).map((header) => {
                            if (header === 'NAME OF M.I.P') return null;
                            return (
                              <th
                                key={header}
                                className="px-2 py-1 text-left font-medium text-text whitespace-nowrap"
                              >
                                {header}
                              </th>
                            );
                          })}
                        </>
                      )}
                      {deptCode === 'IRRIGATION' && (
                        <>
                          {splitHeader(IRRIGATION_CSV_HEADER).map((header) => {
                            if (header === 'WORK NAME') return null;
                            return (
                              <th
                                key={header}
                                className="px-2 py-1 text-left font-medium text-text whitespace-nowrap"
                              >
                                {header}
                              </th>
                            );
                          })}
                        </>
                      )}
                      <th className="px-2 py-1 text-left font-medium text-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(deptCode === 'REVENUE_LAND' ? orgs.filter((o) => o.sub_department === 'TAHASIL_OFFICE') : orgs).map(
                      (o, idx) => {
                        const prof = orgProfiles[o.id];
                        const hp = healthProfiles[o.id];
                        const ep = educationProfiles[o.id];
                        const wp = waterProfiles[o.id];
                        const mp = minorIrrigationProfiles[o.id];
                        const ip = irrigationProfiles[o.id];
                        const rp = revenueProfiles[o.id];
                        const ap = agricultureProfiles[o.id];
                        const arcp = arcsProfiles[o.id];
                        const _ = (v: string | number | null | undefined | unknown) => (v != null && String(v).trim() !== '' ? String(v) : '—');
                        return (
                          <tr
                            key={o.id}
                            className="border-b border-border/60 cursor-pointer"
                            onClick={() => {
                              if (deptCode !== 'REVENUE_LAND') return;
                              router.push(`/admin/dept/revenue-land/tahasil/${o.id}`);
                            }}
                          >
                            <td className="px-2 py-1 text-text-muted">{page * PAGE_SIZE + idx + 1}</td>
                            <td className="px-2 py-1">
                              {deptCode === 'REVENUE_LAND' ? (
                                <>
                                  <span className="mr-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                                    Tahasil
                                  </span>
                                  {o.name}
                                  {rp?.tahasil && (
                                    <div className="mt-0.5 text-[10px] text-text-muted">
                                      Tahasil key: {_(rp.tahasil)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                o.name
                              )}
                            </td>
                            {(deptCode !== 'EDUCATION' && deptCode !== 'HEALTH' && deptCode !== 'WATCO_RWSS' && deptCode !== 'ELECTRICITY' && deptCode !== 'ARCS' && deptCode !== 'MINOR_IRRIGATION' && deptCode !== 'IRRIGATION' && deptCode !== 'REVENUE_LAND' && deptCode !== 'AGRICULTURE') && (
                              <>
                                <td className="px-2 py-1 text-text-muted">{_(o.attributes?.ulb_block ?? prof?.block_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(o.attributes?.gp_name ?? prof?.gram_panchayat)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(o.attributes?.ward_village ?? prof?.village_ward)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.center_code)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.building_type)}</td>
                                <td className="px-2 py-1 text-text-muted">{o.latitude != null ? o.latitude.toFixed(6) : '—'}</td>
                                <td className="px-2 py-1 text-text-muted">{o.longitude != null ? o.longitude.toFixed(6) : '—'}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.student_strength)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.cpdo_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.cpdo_contact_no)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.supervisor_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.supervisor_contact_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.worker_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.aww_contact_no)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.helper_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(prof?.awh_contact_no)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(o.attributes?.sector ?? prof?.sector)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(o.attributes?.lgd_code)}</td>
                              </>
                            )}
                            {deptCode === 'WATCO_RWSS' && (
                              <>
                                {splitHeader(WATCO_CSV_HEADER).filter(h => h !== 'STATION NAME').map((header) => {
                                  const key = snakeFromHeader(header);
                                  const val = wp ? (wp as Record<string, unknown>)[key] : undefined;
                                  return (
                                    <td key={key} className="px-2 py-1 text-text-muted">
                                      {val != null && String(val).trim() !== '' ? String(val) : '—'}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {deptCode === 'REVENUE_LAND' && (
                              <>
                                <td className="px-2 py-1 text-text-muted">{_(rp?.tahsil_code)}</td>
                                <td className="px-2 py-1 text-text-muted">
                                  {_(rp?.established_year ?? rp?.establishment_year)}
                                </td>
                                <td className="px-2 py-1 text-text-muted">{_(rp?.block_ulb ?? rp?.block)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(rp?.contact_number)}</td>
                                <td className="px-2 py-1 text-text-muted">
                                  {o.latitude != null ? o.latitude.toFixed(6) : '—'}
                                </td>
                                <td className="px-2 py-1 text-text-muted">
                                  {o.longitude != null ? o.longitude.toFixed(6) : '—'}
                                </td>
                              </>
                            )}
                            {deptCode === 'AGRICULTURE' && (
                              <>
                                {splitHeader(AGRICULTURE_CSV_HEADER).map((header) => {
                                  const key = snakeFromHeader(header);
                                  const data = ap as Record<string, unknown> | undefined;
                                  let val: unknown = data ? data[key] : undefined;
                                  if (header === 'BLOCK/ULB') {
                                    val = (data && (data.block_ulb as unknown)) ?? o.attributes?.ulb_block;
                                  }
                                  if (header === 'GP/WARD') {
                                    val = (data && (data.gp_ward as unknown)) ?? o.attributes?.gp_name;
                                  }
                                  if (header === 'VILLAGE/LOCALITY') {
                                    val = (data && (data.village_locality as unknown)) ?? o.attributes?.ward_village;
                                  }
                                  if (header === 'NAME OF OFFICE/CENTER') {
                                    val = o.name;
                                  }
                                  if (header === 'LATITUDE') {
                                    val = o.latitude != null ? o.latitude.toFixed(6) : val;
                                  }
                                  if (header === 'LONGITUDE') {
                                    val = o.longitude != null ? o.longitude.toFixed(6) : val;
                                  }
                                  return (
                                    <td key={key} className="px-2 py-1 text-text-muted">
                                      {_(val)}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {deptCode === 'MINOR_IRRIGATION' && (
                              <>
                                {splitHeader(MINOR_IRRIGATION_CSV_HEADER).map((header) => {
                                  if (header === 'NAME OF M.I.P') return null;
                                  const key = snakeFromHeader(header);
                                  const data = mp as Record<string, unknown> | undefined;
                                  let val: unknown = data ? data[key] : undefined;
                                  if (header === 'MIP ID') {
                                    val = data ? data[key] : undefined;
                                  }
                                  if (header === 'LATITUDE') {
                                    val = o.latitude != null ? o.latitude : val;
                                  }
                                  if (header === 'LONGITUDE') {
                                    val = o.longitude != null ? o.longitude : val;
                                  }
                                  return (
                                    <td key={key} className="px-2 py-1 text-text-muted">
                                      {_(val)}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {deptCode === 'IRRIGATION' && (
                              <>
                                {splitHeader(IRRIGATION_CSV_HEADER).map((header) => {
                                  if (header === 'WORK NAME') return null;
                                  const key = snakeFromHeader(header);
                                  const data = ip as Record<string, unknown> | undefined;
                                  let val: unknown = data ? data[key] : undefined;
                                  if (header === 'BLOCK/ULB') {
                                    val = (data && (data.block_ulb as unknown)) ?? o.attributes?.ulb_block;
                                  }
                                  if (header === 'GP/WARD') {
                                    val = (data && (data.gp_ward as unknown)) ?? o.attributes?.gp_name;
                                  }
                                  if (header === 'VILLAGE/ LOCALITY') {
                                    val = (data && (data.village_locality as unknown)) ?? o.attributes?.ward_village;
                                  }
                                  if (header === 'LATITUDE') {
                                    val = o.latitude != null ? o.latitude : val;
                                  }
                                  if (header === 'LONGITUDE') {
                                    val = o.longitude != null ? o.longitude : val;
                                  }
                                  return (
                                    <td key={key} className="px-2 py-1 text-text-muted">
                                      {_(val)}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {deptCode === 'EDUCATION' && isEducationSchoolSubDept(educationSubDept) && (
                              <>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.block_ulb ?? o.attributes?.ulb_block)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.gp_ward ?? o.attributes?.gp_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.village ?? o.attributes?.ward_village)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.school_id)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.esst_year)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.category)}</td>
                                {schoolClassFields(educationSubDept).map((fieldKey) => (
                                  <td key={fieldKey} className="px-2 py-1 text-text-muted">
                                    {_((ep as Record<string, unknown> | undefined)?.[fieldKey])}
                                  </td>
                                ))}
                                <td className="px-2 py-1 text-text-muted">{_(ep?.deo_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.deo_contact)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.beo_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.beo_contact)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.brcc_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.brcc_contact)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.crcc_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.crcc_contact)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.name_of_hm)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.contact_of_hm)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_ts)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_nts)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_tgp_pcm)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_tgp_cbz)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_tgt_arts)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.building_status)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_rooms)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.no_of_smart_class_rooms)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.science_lab)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.toilet_m)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.toilet_f)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.ramp)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.meeting_hall)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.staff_common_room)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.ncc)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.nss)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.jrc)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.eco_club)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.library)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.icc_head_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.icc_head_contact)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.play_ground)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.cycle_stand)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.drinking_water_tw)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.drinking_water_tap)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.drinking_water_overhead_tap)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(ep?.drinking_water_aquaguard)}</td>
                                <td className="px-2 py-1 text-text-muted">{o.latitude != null ? o.latitude.toFixed(6) : '—'}</td>
                                <td className="px-2 py-1 text-text-muted">{o.longitude != null ? o.longitude.toFixed(6) : '—'}</td>
                              </>
                            )}
                            {deptCode === 'EDUCATION' && !isEducationSchoolSubDept(educationSubDept) && (
                              <>
                                {getEducationHeadersForSubDept(educationSubDept).map((header) => {
                                  const key = snakeFromHeader(header);
                                  const val = ep ? ep[key] : undefined;
                                  const show = (v: unknown) =>
                                    v != null && String(v).trim() !== '' ? String(v) : '—';
                                  if (key === 'latitude') {
                                    return (
                                      <td key={key} className="px-2 py-1 text-text-muted">
                                        {o.latitude != null ? o.latitude.toFixed(6) : '—'}
                                      </td>
                                    );
                                  }
                                  if (key === 'longitude') {
                                    return (
                                      <td key={key} className="px-2 py-1 text-text-muted">
                                        {o.longitude != null ? o.longitude.toFixed(6) : '—'}
                                      </td>
                                    );
                                  }
                                  return (
                                    <td key={key} className="px-2 py-1 text-text-muted">
                                      {show(val)}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {deptCode === 'ELECTRICITY' && (
                              <>
                                {splitHeader(ELECTRICITY_CSV_HEADER).map((header) => {
                                  if (header === 'NAME OF OFFICE/CENTER') return null;
                                  const key = snakeFromHeader(header);
                                  const val = electricityProfiles[o.id] ? electricityProfiles[o.id][key] : undefined;
                                  if (key === 'latitude') {
                                    return (
                                      <td key={key} className="px-2 py-1 text-text-muted">
                                        {o.latitude != null ? o.latitude.toFixed(6) : '—'}
                                      </td>
                                    );
                                  }
                                  if (key === 'longitude') {
                                    return (
                                      <td key={key} className="px-2 py-1 text-text-muted">
                                        {o.longitude != null ? o.longitude.toFixed(6) : '—'}
                                      </td>
                                    );
                                  }
                                  return (
                                    <td key={key} className="px-2 py-1 text-text-muted">
                                      {_(val)}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {deptCode === 'ARCS' && (
                              <>
                                {splitHeader(ARCS_CSV_HEADER).map((header) => {
                                  if (header === 'SOCIETY NAME') return null;
                                  const key = snakeFromHeader(header);
                                  const val = arcp ? arcp[key] : undefined;
                                  if (key === 'latitude') {
                                    return (
                                      <td key={key} className="px-2 py-1 text-text-muted">
                                        {o.latitude != null ? o.latitude.toFixed(6) : '—'}
                                      </td>
                                    );
                                  }
                                  if (key === 'longitude') {
                                    return (
                                      <td key={key} className="px-2 py-1 text-text-muted">
                                        {o.longitude != null ? o.longitude.toFixed(6) : '—'}
                                      </td>
                                    );
                                  }
                                  return (
                                    <td key={key} className="px-2 py-1 text-text-muted">
                                      {_(val)}
                                    </td>
                                  );
                                })}
                              </>
                            )}
                            {deptCode === 'HEALTH' && (
                              <>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.block_ulb ?? o.attributes?.ulb_block)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.gp_ward ?? o.attributes?.gp_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.village ?? o.attributes?.ward_village)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.institution_id)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.category)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.inst_head_name)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.inst_head_contact)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_ts)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_nts)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_mo)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_pharmacist)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_anm)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_health_worker)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_pathology)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_clerk)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_sweeper)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_nw)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_bed)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.no_of_icu)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.x_ray_availabilaty)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.ct_scan_availability)}</td>
                                <td className="px-2 py-1 text-text-muted">{_(hp?.availability_of_pathology_testing)}</td>
                                <td className="px-2 py-1 text-text-muted">{o.latitude != null ? o.latitude.toFixed(6) : '—'}</td>
                                <td className="px-2 py-1 text-text-muted">{o.longitude != null ? o.longitude.toFixed(6) : '—'}</td>
                              </>
                            )}
                            <td className="px-2 py-1 space-x-1">
                              {deptCode !== 'REVENUE_LAND' && (
                                <Link
                                  href={`/organizations/${o.id}`}
                                  className="rounded border border-primary/50 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/10"
                                >
                                  View profile
                                </Link>
                              )}
                              {/* ICDS / non-specialized departments (not Health, Education, Electricity, Water, Minor Irrigation, Irrigation, Revenue, Agriculture) */}
                              {deptCode !== 'EDUCATION' &&
                                deptCode !== 'HEALTH' &&
                                deptCode !== 'ELECTRICITY' &&
                                deptCode !== 'ARCS' &&
                                deptCode !== 'WATCO_RWSS' &&
                                deptCode !== 'MINOR_IRRIGATION' &&
                                deptCode !== 'IRRIGATION' &&
                                deptCode !== 'REVENUE_LAND' &&
                                deptCode !== 'AGRICULTURE' && (
                                  <button
                                    type="button"
                                    className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                    onClick={async () => {
                                      setEditingOrgId(o.id);
                                      const p = await profileApi.getCenterProfile(o.id);
                                      setNewOrg({
                                        ulb_block: String(o.attributes?.ulb_block ?? p?.block_name ?? ''),
                                        gp_name: String(o.attributes?.gp_name ?? p?.gram_panchayat ?? ''),
                                        ward_village: String(o.attributes?.ward_village ?? p?.village_ward ?? ''),
                                        sector: String(o.attributes?.sector ?? p?.sector ?? ''),
                                        awc_name: o.name,
                                        awc_id: String(p?.center_code ?? ''),
                                        building_status: String(p?.building_type ?? ''),
                                        latitude: o.latitude != null ? String(o.latitude) : '',
                                        longitude: o.longitude != null ? String(o.longitude) : '',
                                        lgd_code: String(o.attributes?.lgd_code ?? ''),
                                        student_strength: p?.student_strength != null ? String(p.student_strength) : '',
                                        cpdo_name: String(p?.cpdo_name ?? ''),
                                        cpdo_contact_no: String(p?.cpdo_contact_no ?? ''),
                                        supervisor_name: String(p?.supervisor_name ?? ''),
                                        supervisor_contact_name: String(p?.supervisor_contact_name ?? ''),
                                        aww_name: String(p?.worker_name ?? ''),
                                        aww_contact_no: String(p?.aww_contact_no ?? ''),
                                        awh_name: String(p?.helper_name ?? ''),
                                        awh_contact_no: String(p?.awh_contact_no ?? ''),
                                        description: String(p?.description ?? ''),
                                      });
                                      setAwcProfileExtras(centerProfileToExtras(p as Record<string, unknown>));
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                              {/* Minor Irrigation edit – populate Minor Irrigation manual form */}
                              {deptCode === 'MINOR_IRRIGATION' && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingMinorId(o.id);
                                    const existingProfile =
                                      mp ||
                                      ((await minorIrrigationApi.getProfile(
                                        o.id,
                                      )) as Record<string, unknown> | null);
                                    const v = (x: unknown) =>
                                      x != null && String(x).trim() !== '' ? String(x) : '';
                                    const vals: Record<string, string> = {};
                                    splitHeader(MINOR_IRRIGATION_CSV_HEADER).forEach((header) => {
                                      const k = snakeFromHeader(header);
                                      vals[k] = v(existingProfile?.[k]);
                                    });
                                    const nameKey = snakeFromHeader('NAME OF M.I.P');
                                    const latKey = snakeFromHeader('LATITUDE');
                                    const lngKey = snakeFromHeader('LONGITUDE');
                                    if (!vals[nameKey]) vals[nameKey] = o.name;
                                    if (!vals[latKey] && o.latitude != null)
                                      vals[latKey] = String(o.latitude);
                                    if (!vals[lngKey] && o.longitude != null)
                                      vals[lngKey] = String(o.longitude);

                                    setMinorFormValues(vals);
                                    const pv = (x: unknown) => {
                                      if (x == null) return '';
                                      if (typeof x === 'string') return x.trim();
                                      if (typeof x === 'number' || typeof x === 'boolean') return String(x);
                                      try {
                                        return JSON.stringify(x);
                                      } catch {
                                        return String(x);
                                      }
                                    };
                                    const nextPortfolio: Record<string, string> = {};
                                    Object.keys(MINOR_IRRIGATION_PORTFOLIO_EMPTY_FORM).forEach((key) => {
                                      nextPortfolio[key] = pv(existingProfile?.[key]);
                                    });
                                    // Fill About tab inputs with the same fallback values used by the public UI.
                                    nextPortfolio.minor_display_name =
                                      nextPortfolio.minor_display_name ||
                                      pv(existingProfile?.name_of_m_i_p) ||
                                      String(o.name || '').trim();
                                    nextPortfolio.minor_established_year =
                                      nextPortfolio.minor_established_year ||
                                      pv(existingProfile?.minor_established_year) ||
                                      pv(existingProfile?.established_year) ||
                                      pv(existingProfile?.year_of_commissioning);
                                    nextPortfolio.minor_facility_type =
                                      nextPortfolio.minor_facility_type ||
                                      pv(existingProfile?.minor_facility_type) ||
                                      pv(existingProfile?.category_type) ||
                                      pv(existingProfile?.category);
                                    const loc = [
                                      pv(existingProfile?.block_ulb),
                                      pv(existingProfile?.gp_ward),
                                      pv(existingProfile?.village_locality),
                                    ]
                                      .filter(Boolean)
                                      .join(', ');
                                    nextPortfolio.minor_location_line =
                                      nextPortfolio.minor_location_line || loc;
                                    setMinorPortfolioForm(nextPortfolio);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {/* Irrigation edit – populate Irrigation manual form */}
                              {deptCode === 'IRRIGATION' && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingIrrigationId(o.id);
                                    const { irrigationApi } = await import('../../../services/api');
                                    const existingProfile =
                                      ip ||
                                      ((await irrigationApi.getProfile(
                                        o.id,
                                      )) as Record<string, unknown> | null);
                                    const v = (x: unknown) =>
                                      x != null && String(x).trim() !== '' ? String(x) : '';
                                    const vals: Record<string, string> = {};
                                    splitHeader(IRRIGATION_CSV_HEADER).forEach((header) => {
                                      const k = snakeFromHeader(header);
                                      vals[k] = v(existingProfile?.[k]);
                                    });
                                    const nameKey = snakeFromHeader('WORK NAME');
                                    const latKey = snakeFromHeader('LATITUDE');
                                    const lngKey = snakeFromHeader('LONGITUDE');
                                    if (!vals[nameKey]) vals[nameKey] = o.name;
                                    if (!vals[latKey] && o.latitude != null)
                                      vals[latKey] = String(o.latitude);
                                    if (!vals[lngKey] && o.longitude != null)
                                      vals[lngKey] = String(o.longitude);

                                    setIrrigationFormValues(vals);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {deptCode === 'AGRICULTURE' && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingAgricultureId(o.id);
                                    const existingProfile =
                                      ap ||
                                      ((await agricultureApi.getProfile(
                                        o.id,
                                      )) as Record<string, unknown> | null);
                                    const v = (x: unknown) =>
                                      x != null && String(x).trim() !== '' ? String(x) : '';
                                    const toJson = (x: unknown, fallback: string) => {
                                      if (typeof x === 'string' && x.trim()) return x;
                                      if (Array.isArray(x) || (x && typeof x === 'object')) {
                                        try {
                                          return JSON.stringify(x);
                                        } catch {
                                          return fallback;
                                        }
                                      }
                                      return fallback;
                                    };
                                    setNewAgricultureOrg((prev) => ({
                                      ...prev,
                                      block_ulb: v(existingProfile?.block_ulb ?? o.attributes?.ulb_block),
                                      gp_ward: v(existingProfile?.gp_ward ?? o.attributes?.gp_name),
                                      village_locality: v(
                                        existingProfile?.village_locality ?? o.attributes?.ward_village,
                                      ),
                                      name: o.name,
                                      institution_type: v(existingProfile?.institution_type),
                                      institution_id: v(existingProfile?.institution_id),
                                      host_institution: v(
                                        existingProfile?.host_institution_affiliating_body ??
                                        existingProfile?.host_institution,
                                      ),
                                      established_year: v(existingProfile?.established_year),
                                      pin_code: v(existingProfile?.pin_code),
                                      latitude:
                                        o.latitude != null
                                          ? String(o.latitude)
                                          : v(existingProfile?.latitude),
                                      longitude:
                                        o.longitude != null
                                          ? String(o.longitude)
                                          : v(existingProfile?.longitude),
                                      in_charge_name: v(existingProfile?.in_charge_name),
                                      in_charge_contact: v(existingProfile?.in_charge_contact),
                                      in_charge_email: v(existingProfile?.in_charge_email),
                                      office_phone: v(existingProfile?.office_phone),
                                      office_email: v(existingProfile?.office_email),
                                      website: v(existingProfile?.website),
                                      campus_area_acres: v(existingProfile?.campus_area_acres),
                                      training_hall: v(
                                        existingProfile?.training_hall_yes_no ??
                                        existingProfile?.training_hall,
                                      ),
                                      training_hall_capacity: v(
                                        existingProfile?.training_hall_capacity_seats ??
                                        existingProfile?.training_hall_capacity,
                                      ),
                                      soil_testing: v(
                                        existingProfile?.soil_testing_yes_no ??
                                        existingProfile?.soil_testing,
                                      ),
                                      soil_samples_tested_per_year: v(
                                        existingProfile?.soil_samples_tested_per_year,
                                      ),
                                      seed_distribution: v(
                                        existingProfile?.seed_distribution_yes_no ??
                                        existingProfile?.seed_distribution,
                                      ),
                                      seed_processing_unit: v(
                                        existingProfile?.seed_processing_unit_yes_no ??
                                        existingProfile?.seed_processing_unit,
                                      ),
                                      seed_storage_capacity_mt: v(
                                        existingProfile?.seed_storage_capacity_mt,
                                      ),
                                      demo_units: v(
                                        existingProfile?.demo_units_comma_separated ??
                                        existingProfile?.demo_units,
                                      ),
                                      demo_farm: v(
                                        existingProfile?.demo_farm_yes_no ??
                                        existingProfile?.demo_farm,
                                      ),
                                      demo_farm_area_acres: v(existingProfile?.demo_farm_area_acres),
                                      greenhouse_polyhouse: v(
                                        existingProfile?.greenhouse_polyhouse_yes_no ??
                                        existingProfile?.greenhouse_polyhouse,
                                      ),
                                      irrigation_facility: v(
                                        existingProfile?.irrigation_facility_yes_no ??
                                        existingProfile?.irrigation_facility,
                                      ),
                                      machinery_custom_hiring: v(
                                        existingProfile?.machinery_custom_hiring_yes_no ??
                                        existingProfile?.machinery_custom_hiring,
                                      ),
                                      computer_it_lab: v(
                                        existingProfile?.computer_it_lab_yes_no ??
                                        existingProfile?.computer_it_lab,
                                      ),
                                      library: v(
                                        existingProfile?.library_yes_no ?? existingProfile?.library,
                                      ),
                                      key_schemes: v(
                                        existingProfile?.key_schemes_comma_separated ??
                                        existingProfile?.key_schemes,
                                      ),
                                      total_staff: v(
                                        existingProfile?.total_staff_count ??
                                        existingProfile?.total_staff,
                                      ),
                                      scientists_officers: v(
                                        existingProfile?.scientists_officers_count ??
                                        existingProfile?.scientists_officers,
                                      ),
                                      technical_staff: v(
                                        existingProfile?.technical_staff_count ??
                                        existingProfile?.technical_staff,
                                      ),
                                      extension_workers: v(
                                        existingProfile?.extension_workers_count ??
                                        existingProfile?.extension_workers,
                                      ),
                                      farmer_training_capacity_per_batch: v(
                                        existingProfile?.farmer_training_capacity_per_batch,
                                      ),
                                      training_programmes_conducted_last_year: v(
                                        existingProfile?.training_programmes_conducted_last_year,
                                      ),
                                      on_farm_trials_last_year: v(
                                        existingProfile?.on_farm_trials_fld_last_year ??
                                        existingProfile?.on_farm_trials_last_year,
                                      ),
                                      villages_covered: v(
                                        existingProfile?.villages_gps_covered_count ??
                                        existingProfile?.villages_covered,
                                      ),
                                      soil_health_cards_issued_last_year: v(
                                        existingProfile?.soil_health_cards_issued_last_year,
                                      ),
                                      farmers_served_last_year: v(
                                        existingProfile?.farmers_served_last_year_approx ??
                                        existingProfile?.farmers_served_last_year,
                                      ),
                                      remarks: v(
                                        existingProfile?.remarks_description ??
                                        existingProfile?.remarks,
                                      ),
                                    }));
                                    setAgriculturePortfolioForm({
                                      ...AGRICULTURE_PORTFOLIO_EMPTY_FORM,
                                      ag_display_name: v(existingProfile?.ag_display_name),
                                      ag_hero_tagline: v(existingProfile?.ag_hero_tagline),
                                      ag_tagline: v(existingProfile?.ag_tagline),
                                      ag_hero_1: v(existingProfile?.ag_hero_1),
                                      ag_hero_2: v(existingProfile?.ag_hero_2),
                                      ag_hero_3: v(existingProfile?.ag_hero_3),
                                      ag_about: v(existingProfile?.ag_about),
                                      ag_campus_image: v(existingProfile?.ag_campus_image),
                                      ag_established_year: v(existingProfile?.ag_established_year),
                                      ag_facility_type: v(existingProfile?.ag_facility_type),
                                      ag_location_line: v(existingProfile?.ag_location_line),
                                      ag_head_message: v(existingProfile?.ag_head_message),
                                      ag_head_name: v(
                                        existingProfile?.ag_head_name ?? existingProfile?.in_charge_name,
                                      ),
                                      ag_head_photo: v(existingProfile?.ag_head_photo),
                                      ag_head_qualification: v(
                                        existingProfile?.ag_head_qualification ?? existingProfile?.qualification,
                                      ),
                                      ag_head_experience: v(
                                        existingProfile?.ag_head_experience ?? existingProfile?.experience,
                                      ),
                                      ag_head_contact: v(
                                        existingProfile?.ag_head_contact ?? existingProfile?.in_charge_contact,
                                      ),
                                      ag_head_email: v(
                                        existingProfile?.ag_head_email ?? existingProfile?.in_charge_email,
                                      ),
                                      ag_key_admin_cards_json: toJson(existingProfile?.ag_key_admin_cards, '[]'),
                                      ag_facility_cards_json: toJson(existingProfile?.ag_facility_cards, '[]'),
                                      ag_expert_cards_json: toJson(existingProfile?.ag_expert_cards, '[]'),
                                      ag_expert_attendance_json: toJson(existingProfile?.ag_expert_attendance, '{}'),
                                      ag_staff_rows_json: toJson(existingProfile?.ag_staff_rows, '[]'),
                                      ag_daily_stock_rows_json: toJson(existingProfile?.ag_daily_stock_rows, '[]'),
                                      ag_photo_gallery_json: toJson(existingProfile?.ag_photo_gallery, '[]'),
                                      ag_full_address: v(
                                        existingProfile?.ag_full_address ??
                                          o.address ??
                                          [existingProfile?.block_ulb, existingProfile?.gp_ward, existingProfile?.village_locality]
                                            .filter((x) => x != null && String(x).trim() !== '')
                                            .join(', '),
                                      ),
                                      ag_helpdesk_phone: v(
                                        existingProfile?.ag_helpdesk_phone ?? existingProfile?.office_phone,
                                      ),
                                      ag_emergency_phone: v(
                                        existingProfile?.ag_emergency_phone ?? existingProfile?.in_charge_contact,
                                      ),
                                      ag_public_email: v(
                                        existingProfile?.ag_public_email ?? existingProfile?.office_email,
                                      ),
                                      ag_office_hours: v(
                                        existingProfile?.ag_office_hours ?? existingProfile?.office_hours,
                                      ),
                                    });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {deptCode === 'ELECTRICITY' && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingElectricityId(o.id);
                                    const p = (electricityProfiles[o.id] || await electricityApi.getProfile(o.id)) as Record<string, unknown>;
                                    const v = (x: unknown) => (x != null && String(x).trim() !== '' ? String(x) : '');
                                    const vals: Record<string, string> = {};
                                    splitHeader(ELECTRICITY_CSV_HEADER).forEach(h => {
                                      const k = snakeFromHeader(h);
                                      vals[k] = v(p[k]);
                                    });
                                    // Ensure name and coordinates are set from organization if missing in profile
                                    const nameKey = snakeFromHeader('NAME OF OFFICE/CENTER');
                                    const latKey = snakeFromHeader('LATITUDE');
                                    const lngKey = snakeFromHeader('LONGITUDE');
                                    if (!vals[nameKey]) vals[nameKey] = o.name;
                                    if (!vals[latKey]) vals[latKey] = o.latitude != null ? String(o.latitude) : '';
                                    if (!vals[lngKey]) vals[lngKey] = o.longitude != null ? String(o.longitude) : '';

                                    setElecFormValues(vals);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {deptCode === 'ARCS' && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingArcsId(o.id);
                                    const p = (arcsProfiles[o.id] || await arcsApi.getProfile(o.id)) as Record<string, unknown>;
                                    const v = (x: unknown) => (x != null && String(x).trim() !== '' ? String(x) : '');
                                    const vals: Record<string, string> = {};
                                    vals.arcs_name = v(p.arcs_name ?? p.society_name ?? o.name);
                                    vals.registration_number = v(p.registration_number);
                                    vals.block_ulb = v(p.block_ulb);
                                    vals.jurisdiction_type = v(p.jurisdiction_type_rural_urban_mixed ?? p.jurisdiction_type);
                                    vals.latitude = v(p.latitude ?? o.latitude);
                                    vals.longitude = v(p.longitude ?? o.longitude);
                                    vals.full_address = v(p.full_address ?? o.address);
                                    vals.office_phone = v(p.office_phone);
                                    vals.office_email = v(p.office_email);
                                    vals.secretary_name = v(p.secretary_name);
                                    vals.arcs_tagline = v(p.arcs_tagline);
                                    vals.arcs_about = v(p.arcs_about);
                                    vals.arcs_about_image = v(p.arcs_about_image);
                                    vals.arcs_secretary_image = v(p.arcs_secretary_image);
                                    vals.arcs_hero_1 = v(p.arcs_hero_1);
                                    vals.arcs_hero_2 = v(p.arcs_hero_2);
                                    vals.arcs_hero_3 = v(p.arcs_hero_3);
                                    vals.arcs_incharge_cards_json = Array.isArray(p.arcs_incharge_cards) ? JSON.stringify(p.arcs_incharge_cards) : '';
                                    vals.arcs_membership_rows_json = Array.isArray(p.arcs_membership_rows) ? JSON.stringify(p.arcs_membership_rows) : '';
                                    vals.arcs_fertiliser_cards_json = Array.isArray(p.arcs_fertiliser_cards) ? JSON.stringify(p.arcs_fertiliser_cards) : '';
                                    vals.arcs_seed_cards_json = Array.isArray(p.arcs_seed_cards) ? JSON.stringify(p.arcs_seed_cards) : '';
                                    vals.arcs_loan_cards_json = Array.isArray(p.arcs_loan_cards) ? JSON.stringify(p.arcs_loan_cards) : '';
                                    vals.arcs_photo_gallery_json = Array.isArray(p.arcs_photo_gallery) ? JSON.stringify(p.arcs_photo_gallery) : '';
                                    vals.arcs_office_hours = v(p.arcs_office_hours);
                                    vals.arcs_secretary_message = v(p.arcs_secretary_message);
                                    vals.arcs_vision = v(p.arcs_vision);
                                    vals.arcs_mission = v(p.arcs_mission);
                                    setArcsFormValues(vals);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {deptCode === 'EDUCATION' && isEducationSchoolSubDept(educationSubDept) && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingEducationId(o.id);
                                    const p = (await educationApi.getProfile(o.id)) as Record<string, unknown> | undefined;
                                    const v = (x: unknown) => (x != null && String(x).trim() !== '' ? String(x) : '');
                                    const heroSlideAt = (i: number): string => {
                                      const slides = p?.hero_slides;
                                      if (!Array.isArray(slides) || slides[i] == null) return '';
                                      const ent = slides[i];
                                      if (typeof ent === 'string') return v(ent);
                                      if (ent && typeof ent === 'object' && 'url' in ent) {
                                        return v((ent as { url: unknown }).url);
                                      }
                                      return '';
                                    };
                                    const jsonArr = (x: unknown) => (Array.isArray(x) && x.length ? JSON.stringify(x) : '');
                                    const facultyCardsJson = (() => {
                                      const arr = p?.faculty_cards;
                                      if (!Array.isArray(arr) || !arr.length) return '';
                                      return JSON.stringify(
                                        arr.map((item: Record<string, unknown>) => ({
                                          photo: item.photo ?? item.image ?? '',
                                          name: item.name ?? '',
                                          subject: item.subject ?? '',
                                          qualification: item.qualification ?? '',
                                        })),
                                      );
                                    })();
                                    const galleryJson = (() => {
                                      const arr = p?.photo_gallery;
                                      if (!Array.isArray(arr) || !arr.length) return '';
                                      return JSON.stringify(
                                        arr.map((item: Record<string, unknown>) => ({
                                          image: item.image ?? item.url ?? '',
                                          title: item.title ?? '',
                                          category: item.category ?? '',
                                          description: item.description ?? '',
                                        })),
                                      );
                                    })();
                                    const intakeCardsJson = (() => {
                                      let arr = p?.intake_cards;
                                      if (
                                        (!Array.isArray(arr) || !arr.length) &&
                                        Array.isArray(p?.student_intake_rows) &&
                                        p.student_intake_rows.length
                                      ) {
                                        arr = (p.student_intake_rows as Record<string, unknown>[]).map((row) => ({
                                          class_name: row.class_name,
                                          strength: row.intake ?? row.strength ?? '',
                                          registered_this_year: row.registered_this_year ?? row.registered_students_this_year ?? '',
                                          subjects: row.subjects ?? '',
                                          image: row.image ?? '',
                                        }));
                                      }
                                      return jsonArr(arr);
                                    })();
                                    setNewEducationOrg({
                                      block_ulb: v(p?.block_ulb ?? o.attributes?.ulb_block),
                                      gp_ward: v(p?.gp_ward ?? o.attributes?.gp_name),
                                      village: v(p?.village ?? o.attributes?.ward_village),
                                      name_of_school: v(p?.name_of_school ?? o.name),
                                      school_id: v(p?.school_id),
                                      esst_year: v(p?.esst_year),
                                      category: v(p?.category ?? o.attributes?.sector),
                                      class_i: v(p?.class_i), class_ii: v(p?.class_ii), class_iii: v(p?.class_iii),
                                      class_iv: v(p?.class_iv), class_v: v(p?.class_v), class_vi: v(p?.class_vi),
                                      class_vii: v(p?.class_vii), class_viii: v(p?.class_viii), class_ix: v(p?.class_ix), class_x: v(p?.class_x),
                                      class_xi: v(p?.class_xi), class_xii: v(p?.class_xii),
                                      deo_name: v(p?.deo_name), deo_contact: v(p?.deo_contact),
                                      beo_name: v(p?.beo_name), beo_contact: v(p?.beo_contact),
                                      brcc_name: v(p?.brcc_name), brcc_contact: v(p?.brcc_contact),
                                      crcc_name: v(p?.crcc_name), crcc_contact: v(p?.crcc_contact),
                                      name_of_hm: v(p?.name_of_hm), contact_of_hm: v(p?.contact_of_hm),
                                      no_of_ts: v(p?.no_of_ts), no_of_nts: v(p?.no_of_nts),
                                      no_of_tgp_pcm: v(p?.no_of_tgp_pcm), no_of_tgp_cbz: v(p?.no_of_tgp_cbz), no_of_tgt_arts: v(p?.no_of_tgt_arts),
                                      building_status: v(p?.building_status), no_of_rooms: v(p?.no_of_rooms), no_of_smart_class_rooms: v(p?.no_of_smart_class_rooms),
                                      science_lab: v(p?.science_lab), toilet_m: v(p?.toilet_m), toilet_f: v(p?.toilet_f),
                                      ramp: v(p?.ramp), meeting_hall: v(p?.meeting_hall), staff_common_room: v(p?.staff_common_room),
                                      ncc: v(p?.ncc), nss: v(p?.nss), jrc: v(p?.jrc), eco_club: v(p?.eco_club), library: v(p?.library),
                                      icc_head_name: v(p?.icc_head_name), icc_head_contact: v(p?.icc_head_contact),
                                      play_ground: v(p?.play_ground), cycle_stand: v(p?.cycle_stand),
                                      drinking_water_tw: v(p?.drinking_water_tw), drinking_water_tap: v(p?.drinking_water_tap),
                                      drinking_water_overhead_tap: v(p?.drinking_water_overhead_tap), drinking_water_aquaguard: v(p?.drinking_water_aquaguard),
                                      latitude: o.latitude != null ? String(o.latitude) : '',
                                      longitude: o.longitude != null ? String(o.longitude) : '',
                                      description: v(p?.description),
                                      language: v(p?.language || 'en'),
                                      school_name_en: v(p?.school_name_en), school_name_od: v(p?.school_name_od),
                                      hero_tagline_en: v(p?.hero_tagline_en), hero_tagline_od: v(p?.hero_tagline_od),
                                      hero_primary_tagline_en: v(p?.hero_primary_tagline_en), hero_primary_tagline_od: v(p?.hero_primary_tagline_od),
                                      hero_slide_1: heroSlideAt(0),
                                      hero_slide_2: heroSlideAt(1),
                                      hero_slide_3: heroSlideAt(2),
                                      about_short_en: v(p?.about_short_en), about_short_od: v(p?.about_short_od),
                                      about_image: v(p?.about_image),
                                      school_type_en: v(p?.school_type_en), school_type_od: v(p?.school_type_od),
                                      location_en: v(p?.location_en), location_od: v(p?.location_od),
                                      hm_qualification: v(p?.hm_qualification), hm_experience: v(p?.hm_experience),
                                      hm_past_experience_en: v(p?.hm_past_experience_en ?? p?.hm_past_experience),
                                      hm_current_experience_en: v(p?.hm_current_experience_en ?? p?.hm_current_experience),
                                      headmaster_photo: v(p?.headmaster_photo),
                                      headmaster_contact: v(p?.headmaster_contact ?? p?.contact_of_hm),
                                      headmaster_email: v(p?.headmaster_email),
                                      headmaster_message_en: v(p?.headmaster_message_en), headmaster_message_od: v(p?.headmaster_message_od),
                                      vision_text_en: v(p?.vision_text_en), vision_text_od: v(p?.vision_text_od),
                                      mission_text_en: v(p?.mission_text_en), mission_text_od: v(p?.mission_text_od),
                                      deo_image: v(p?.deo_image), deo_email: v(p?.deo_email),
                                      beo_image: v(p?.beo_image), beo_email: v(p?.beo_email),
                                      brcc_image: v(p?.brcc_image), brcc_email: v(p?.brcc_email),
                                      crc_image: v(p?.crc_image),
                                      crc_name: v(p?.crc_name ?? p?.crcc_name),
                                      crc_contact: v(p?.crc_contact ?? p?.crcc_contact),
                                      crc_email: v(p?.crc_email),
                                      curriculum_text_en: v(p?.curriculum_text_en), curriculum_text_od: v(p?.curriculum_text_od),
                                      academic_calendar_text_en: v(p?.academic_calendar_text_en), academic_calendar_text_od: v(p?.academic_calendar_text_od),
                                      class_structure_text_en: v(p?.class_structure_text_en), class_structure_text_od: v(p?.class_structure_text_od),
                                      subjects_offered_text_en: v(p?.subjects_offered_text_en), subjects_offered_text_od: v(p?.subjects_offered_text_od),
                                      facilities_list: v(p?.facilities_list), total_students: v(p?.total_students),
                                      facilities_count: v(p?.facilities_count), years_of_service: v(p?.years_of_service),
                                      faculty_cards_json: facultyCardsJson,
                                      faculty_attendance_json: p?.faculty_attendance && typeof p.faculty_attendance === 'object' ? JSON.stringify(p.faculty_attendance) : '',
                                      facility_cards_json: jsonArr(p?.facility_cards),
                                      infrastructure_images_json: p?.infrastructure_images ? JSON.stringify(p.infrastructure_images) : '',
                                      activity_events_json: p?.activity_events ? JSON.stringify(p.activity_events) : '',
                                      student_intake_rows_json: p?.student_intake_rows ? JSON.stringify(p.student_intake_rows) : '',
                                      intake_cards_json: intakeCardsJson,
                                      mdm_daily_json: jsonArr(p?.mdm_daily_records ?? p?.mdm_daily ?? p?.mid_day_meal_daily),
                                      ptm_meetings_json: jsonArr(p?.parent_teacher_meetings ?? p?.ptm_meetings ?? p?.parent_teacher_meeting_records),
                                      photo_gallery_json: galleryJson,
                                      contact_address_en: v(p?.contact_address_en), contact_address_od: v(p?.contact_address_od),
                                      contact_phone: v(p?.contact_phone), contact_email: v(p?.contact_email),
                                      office_hours_en: v(p?.office_hours_en), office_hours_od: v(p?.office_hours_od),
                                    });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {deptCode === 'EDUCATION' && !isEducationSchoolSubDept(educationSubDept) && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingEducationId(o.id);
                                    const p = await educationApi.getProfile(o.id) as Record<string, unknown> | undefined;
                                    const headers = getEducationHeadersForSubDept(educationSubDept);
                                    const v = (x: unknown) => (x != null && String(x).trim() !== '' ? String(x) : '');
                                    const values: Record<string, string> = {};
                                    headers.forEach(h => {
                                      const key = snakeFromHeader(h);
                                      values[key] = v(p?.[key] ?? o.attributes?.[key]);
                                    });

                                    const latKey = snakeFromHeader('LATITUDE');
                                    const lngKey = snakeFromHeader('LONGITUDE');
                                    if (!values[latKey] && o.latitude) values[latKey] = String(o.latitude);
                                    if (!values[lngKey] && o.longitude) values[lngKey] = String(o.longitude);

                                    const nameHeader =
                                      educationSubDept === 'ENGINEERING_COLLEGE' ? 'NAME OF COLLEGE' :
                                        educationSubDept === 'ITI' ? 'ITI NAME' :
                                          educationSubDept === 'DIPLOMA_COLLEGE' ? 'COLLEGE NAME' :
                                            educationSubDept === 'UNIVERSITY' ? 'UNIVERSITY NAME' : '';
                                    if (nameHeader) {
                                      const nameKey = snakeFromHeader(nameHeader);
                                      if (!values[nameKey]) values[nameKey] = o.name;
                                    }

                                    setEduFormValues(values);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {deptCode === 'HEALTH' && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingHealthId(o.id);
                                    const p = await healthApi.getProfile(o.id) as Record<string, unknown> | undefined;
                                    const v = (x: unknown) => (x != null && String(x).trim() !== '' ? String(x) : '');
                                    const gp = p?.health_photo_gallery;
                                    let health_photo_gallery_json = '[]';
                                    if (Array.isArray(gp)) {
                                      health_photo_gallery_json = JSON.stringify(gp);
                                    } else if (typeof gp === 'string' && gp.trim()) {
                                      health_photo_gallery_json = gp;
                                    }
                                    let health_key_admin_cards_json = '[]';
                                    const ka = p?.health_key_admin_cards;
                                    if (Array.isArray(ka)) health_key_admin_cards_json = JSON.stringify(ka);
                                    let health_health_facility_cards_json = '[]';
                                    const hf = p?.health_health_facility_cards;
                                    if (Array.isArray(hf)) {
                                      health_health_facility_cards_json = JSON.stringify(
                                        hf.map((item: Record<string, unknown>) => {
                                          const copy = { ...item } as Record<string, unknown>;
                                          if (Array.isArray(copy.images)) {
                                            copy.images_json = JSON.stringify(copy.images);
                                            delete copy.images;
                                          }
                                          return copy;
                                        }),
                                      );
                                    }
                                    let health_doctor_cards_json = '[]';
                                    const dc = p?.health_doctor_cards;
                                    if (Array.isArray(dc)) health_doctor_cards_json = JSON.stringify(dc);
                                    let health_ts_nts_staff_rows_json = '[]';
                                    const tr = p?.health_ts_nts_staff_rows;
                                    if (Array.isArray(tr)) health_ts_nts_staff_rows_json = JSON.stringify(tr);
                                    let health_clinical_staff_rows_json = '[]';
                                    const cr = p?.health_clinical_staff_rows;
                                    if (Array.isArray(cr)) health_clinical_staff_rows_json = JSON.stringify(cr);
                                    let health_equipment_rows_json = '[]';
                                    const er = p?.health_equipment_rows;
                                    if (Array.isArray(er)) health_equipment_rows_json = JSON.stringify(er);
                                    const da = p?.health_doctor_attendance;
                                    const health_doctor_attendance_json =
                                      da != null && typeof da === 'object'
                                        ? JSON.stringify(da)
                                        : typeof da === 'string' && da.trim()
                                          ? da
                                          : '{}';
                                    setHealthPortfolioForm({
                                      ...emptyHealthPortfolioForm(),
                                      health_display_name: v(p?.health_display_name),
                                      health_hero_tagline: v(p?.health_hero_tagline),
                                      health_tagline: v(p?.health_tagline),
                                      health_hero_1: v(p?.health_hero_1),
                                      health_hero_2: v(p?.health_hero_2),
                                      health_hero_3: v(p?.health_hero_3),
                                      health_about: v(p?.health_about),
                                      health_campus_image: v(p?.health_campus_image),
                                      health_established_year: v(p?.health_established_year),
                                      health_facility_type: v(p?.health_facility_type),
                                      health_location_line: v(p?.health_location_line),
                                      health_inst_head_message: v(p?.health_inst_head_message),
                                      health_inst_head_name: v(p?.health_inst_head_name),
                                      health_inst_head_photo: v(p?.health_inst_head_photo),
                                      health_inst_head_qualification: v(p?.health_inst_head_qualification),
                                      health_inst_head_experience: v(p?.health_inst_head_experience),
                                      health_inst_head_contact: v(p?.health_inst_head_contact),
                                      health_inst_head_email: v(p?.health_inst_head_email),
                                      health_key_admin_cards_json,
                                      health_health_facility_cards_json,
                                      health_doctor_cards_json,
                                      health_doctor_attendance_json,
                                      health_ts_nts_staff_rows_json,
                                      health_clinical_staff_rows_json,
                                      health_equipment_rows_json,
                                      health_photo_gallery_json,
                                      health_full_address: v(p?.health_full_address),
                                      health_helpdesk_phone: v(p?.health_helpdesk_phone),
                                      health_emergency_phone: v(p?.health_emergency_phone),
                                      health_public_email: v(p?.health_public_email) || v(p?.health_contact_email),
                                      health_office_hours: v(p?.health_office_hours),
                                      health_contact_email: v(p?.health_contact_email),
                                    });
                                    setNewHealthOrg({
                                      block_ulb: v(p?.block_ulb ?? o.attributes?.ulb_block),
                                      gp_ward: v(p?.gp_ward ?? o.attributes?.gp_name),
                                      village: v(p?.village ?? o.attributes?.ward_village),
                                      latitude: o.latitude != null ? String(o.latitude) : '',
                                      longitude: o.longitude != null ? String(o.longitude) : '',
                                      name: v(p?.name ?? o.name),
                                      institution_id: v(p?.institution_id),
                                      category: v(p?.category),
                                      inst_head_name: v(p?.health_inst_head_name ?? p?.inst_head_name),
                                      inst_head_contact: v(p?.health_inst_head_contact ?? p?.inst_head_contact),
                                      no_of_ts: v(p?.no_of_ts),
                                      no_of_nts: v(p?.no_of_nts),
                                      no_of_mo: v(p?.no_of_mo),
                                      no_of_pharmacist: v(p?.no_of_pharmacist),
                                      no_of_anm: v(p?.no_of_anm),
                                      no_of_health_worker: v(p?.no_of_health_worker),
                                      no_of_pathology: v(p?.no_of_pathology),
                                      no_of_clerk: v(p?.no_of_clerk),
                                      no_of_sweeper: v(p?.no_of_sweeper),
                                      no_of_nw: v(p?.no_of_nw),
                                      no_of_bed: v(p?.no_of_bed),
                                      no_of_icu: v(p?.no_of_icu),
                                      x_ray_availabilaty: v(p?.x_ray_availabilaty),
                                      ct_scan_availability: v(p?.ct_scan_availability),
                                      availability_of_pathology_testing: v(p?.availability_of_pathology_testing),
                                      description: v(p?.description),
                                    });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {deptCode === 'REVENUE_LAND' && (
                                <>
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setEditingRevenueTahasilId(o.id);
                                    const existingProfile =
                                      revenueProfiles[o.id] ||
                                      ((await revenueLandApi.getProfile(o.id)) as
                                        | Record<string, unknown>
                                        | null);
                                    const v = (x: unknown) =>
                                      x != null && String(x).trim() !== '' ? String(x) : '';
                                    const vals: Record<string, string> = {};
                                    splitHeader(REVENUE_TAHASIL_OFFICE_CSV_HEADER).forEach((header) => {
                                      const k = snakeFromHeader(header);
                                      vals[k] = v(existingProfile?.[k]);
                                    });
                                    const tahsilNameKey = snakeFromHeader('TAHSIL_NAME');
                                    const latKey = snakeFromHeader('LATITUDE');
                                    const lngKey = snakeFromHeader('LONGITUDE');
                                    if (!vals[tahsilNameKey]) vals[tahsilNameKey] = o.name;
                                    if (!vals[latKey]) vals[latKey] = o.latitude != null ? String(o.latitude) : '';
                                    if (!vals[lngKey]) vals[lngKey] = o.longitude != null ? String(o.longitude) : '';

                                    setRevenueTahasilFormValues(vals);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    router.push(`/admin/dept/revenue-land/tahasil/${o.id}`);
                                  }}
                                >
                                  View profile
                                </button>
                                </>
                              )}
                              {deptCode === 'WATCO_RWSS' && (
                                <button
                                  type="button"
                                  className="rounded border border-border px-2 py-0.5 text-[11px] text-text hover:bg-gray-50"
                                  onClick={async () => {
                                    setEditingWaterId(o.id);
                                    const existingProfile =
                                      waterProfiles[o.id] ||
                                      ((await watcoApi.getProfile(o.id)) as Record<string, unknown> | undefined);
                                    const v = (x: unknown) =>
                                      x != null && String(x).trim() !== '' ? String(x) : '';
                                    const vals: Record<string, string> = {};
                                    splitHeader(WATCO_CSV_HEADER).forEach((header) => {
                                      const key = snakeFromHeader(header);
                                      if (key === snakeFromHeader('STATION NAME')) {
                                        vals[key] = v(existingProfile?.[key] ?? o.name);
                                      } else if (key === snakeFromHeader('LATITUDE')) {
                                        vals[key] = v(existingProfile?.[key] ?? (o.latitude != null ? String(o.latitude) : ''));
                                      } else if (key === snakeFromHeader('LONGITUDE')) {
                                        vals[key] = v(existingProfile?.[key] ?? (o.longitude != null ? String(o.longitude) : ''));
                                      } else {
                                        vals[key] = v(existingProfile?.[key]);
                                      }
                                    });
                                    setWaterFormValues(vals);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                              {deptCode !== 'REVENUE_LAND' && (
                                <button
                                  type="button"
                                  className="rounded border border-red-500 px-2 py-0.5 text-[11px] text-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(o.id)}
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                    {!orgs.length && (
                      <tr>
                        <td className="px-2 py-2 text-xs text-text-muted" colSpan={deptCode === 'ICDS' || deptCode === 'AWC_ICDS' ? 21 : deptCode === 'HEALTH' ? 27 : deptCode === 'EDUCATION' ? 61 : deptCode === 'ELECTRICITY' ? splitHeader(ELECTRICITY_CSV_HEADER).length + 2 : deptCode === 'ARCS' ? splitHeader(ARCS_CSV_HEADER).length + 2 : deptCode === 'REVENUE_LAND' ? 12 : 10}>
                          No organizations yet for your department.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                  <span>Page {page + 1}</span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      disabled={page === 0 || !me?.department_id}
                      className="rounded border border-border px-2 py-1 text-[11px] hover:bg-gray-50 disabled:opacity-50"
                      onClick={async () => {
                        if (!me?.department_id || page === 0) return;
                        const newPage = page - 1;
                        const list = await organizationsApi.listByDepartment(me.department_id, {
                          skip: newPage * PAGE_SIZE,
                          limit: PAGE_SIZE,
                          sub_department:
                            deptCode === 'EDUCATION'
                              ? educationSubDept
                              : deptCode === 'REVENUE_LAND'
                                ? 'TAHASIL_OFFICE'
                                : null,
                        });
                        setOrgs(list);
                        setPage(newPage);
                        setHasMore(list.length === PAGE_SIZE);
                      }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={!hasMore || !me?.department_id}
                      className="rounded border border-border px-2 py-1 text-[11px] hover:bg-gray-50 disabled:opacity-50"
                      onClick={async () => {
                        if (!me?.department_id || !hasMore) return;
                        const newPage = page + 1;
                        const list = await organizationsApi.listByDepartment(me.department_id, {
                          skip: newPage * PAGE_SIZE,
                          limit: PAGE_SIZE,
                          sub_department:
                            deptCode === 'EDUCATION'
                              ? educationSubDept
                              : deptCode === 'REVENUE_LAND'
                                ? 'TAHASIL_OFFICE'
                                : null,
                        });
                        setOrgs(list);
                        setPage(newPage);
                        setHasMore(list.length === PAGE_SIZE);
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </SuperAdminDashboardLayout >
  );
}


