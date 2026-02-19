import type { ReactNode } from 'react';
import type { Language } from './LanguageContext';

export type MessageKey =
  | 'govBar.title'
  | 'govBar.subtitle'
  | 'navbar.title'
  | 'navbar.tagline'
  | 'navbar.ministerName'
  | 'navbar.ministerSubtitle'
  | 'sidebar.title'
  | 'sidebar.subtitle'
  | 'sidebar.loading'
  | 'sidebar.total'
  | 'dept.education'
  | 'dept.health'
  | 'dept.icds'
  | 'shell.departmentsTab'
  | 'map.legend'
  | 'map.viewProfile'
  | 'map.edu.primarySchool'
  | 'map.edu.upperPrimarySchool'
  | 'map.edu.highSchool'
  | 'map.edu.higherSecondary'
  | 'map.edu.college'
  | 'map.edu.university'
  | 'map.health.hospital'
  | 'map.health.healthCentre'
  | 'map.health.other'
  | 'map.awc.label'
  | 'awc.badge'
  | 'awc.centreProfileTitle'
  | 'awc.centreProfileSubtitle'
  | 'awc.staffContactTitle'
  | 'awc.staffContactSubtitle'
  | 'awc.stat.studentStrength'
  | 'awc.stat.cpdoName'
  | 'awc.stat.supervisorName'
  | 'awc.stat.awwName'
  | 'edu.badge'
  | 'edu.schoolProfileTitle'
  | 'edu.schoolProfileSubtitle'
  | 'edu.infraTitle'
  | 'edu.infraSubtitle'
  | 'edu.stat.students'
  | 'edu.stat.teachers'
  | 'edu.stat.classrooms'
  | 'edu.stat.smartClassrooms'
  | 'health.badge'
  | 'health.facilityProfileTitle'
  | 'health.facilityProfileSubtitle'
  | 'health.infraTitle'
  | 'health.infraSubtitle'
  | 'health.stat.opd'
  | 'health.stat.ipd'
  | 'health.stat.beds'
  | 'health.stat.icuBeds'
  | 'health.staffTitle'
  | 'health.staffSubtitle'
  | 'login.dept.title'
  | 'login.dept.subtitle'
  | 'login.email'
  | 'login.password'
  | 'login.signIn'
  | 'login.signingIn'
  | 'login.error.deptOnly'
  | 'login.error.failed'
  | 'login.super.title'
  | 'login.super.subtitle'
  | 'login.error.superOnly';

const messages: Record<MessageKey, { en: string; or: string }> = {
  'govBar.title': {
    en: 'Government of Odisha',
    or: 'ଓଡିଶା ସରକାର',
  },
  'govBar.subtitle': {
    en: 'Odisha Government',
    or: 'ଓଡିଶା ସରକାର',
  },
  'navbar.title': {
    en: 'AMA GOPALPUR',
    or: 'ଆମ ଗୋପାଳପୁର',
  },
  'navbar.tagline': {
    en: 'Constituency Dashboard',
    or: 'ବିଧାନସଭା କ୍ଷେତ୍ର ଡ୍ୟାସବୋର୍ଡ',
  },
  'navbar.ministerName': {
    en: 'Bibhuti Bhusan Jena',
    or: 'ବିଭୂତି ଭୂଷଣ ଜେନା',
  },
  'navbar.ministerSubtitle': {
    en: 'Cabinet Minister, Odisha',
    or: 'ମନ୍ତ୍ରୀ, ଓଡିଶା ସରକାର',
  },
  'sidebar.title': {
    en: 'Departments',
    or: 'ବିଭାଗ',
  },
  'sidebar.subtitle': {
    en: 'Select a department to see its assets on the map.',
    or: 'ମାନଚିତ୍ରରେ ସମ୍ପତ୍ତି ଦେଖିବାକୁ ଏକ ବିଭାଗ ଚୟନ କରନ୍ତୁ।',
  },
  'sidebar.loading': {
    en: 'Loading departments…',
    or: 'ବିଭାଗ ଲୋଡ୍ ହେଉଛି…',
  },
  'sidebar.total': {
    en: 'Total',
    or: 'ମୋଟ',
  },
  'dept.education': {
    en: 'Education',
    or: 'ଶିକ୍ଷା',
  },
  'dept.health': {
    en: 'Health',
    or: 'ସ୍ୱାସ୍ଥ୍ୟ',
  },
  'dept.icds': {
    en: 'ICDS',
    or: 'ଆଇ.ସି.ଡି.ଏସ୍',
  },
  'map.legend': {
    en: 'Legend',
    or: 'ସୂଚନା',
  },
  'map.viewProfile': {
    en: 'View profile',
    or: 'ପ୍ରୋଫାଇଲ୍ ଦେଖନ୍ତୁ',
  },
  'map.edu.primarySchool': { en: 'Primary School', or: 'ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ' },
  'map.edu.upperPrimarySchool': { en: 'Upper Primary School', or: 'ଉଚ୍ଚ ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ' },
  'map.edu.highSchool': { en: 'High School', or: 'ହାଇସ୍କୁଲ୍' },
  'map.edu.higherSecondary': { en: 'Higher Secondary', or: 'ଉଚ୍ଚ ମାଧ୍ୟମିକ' },
  'map.edu.college': { en: 'College', or: 'ମହାବିଦ୍ୟାଳୟ' },
  'map.edu.university': { en: 'University', or: 'ବିଶ୍ୱବିଦ୍ୟାଳୟ' },
  'map.health.hospital': { en: 'Hospital', or: 'ଡାକ୍ତରଖାନା' },
  'map.health.healthCentre': { en: 'Health Centre', or: 'ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର' },
  'map.health.other': { en: 'Other', or: 'ଅନ୍ୟ' },
  'map.awc.label': { en: 'Anganwadi Centre (AWC)', or: 'ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ର (AWC)' },
  'shell.departmentsTab': {
    en: 'Departments',
    or: 'ବିଭାଗ',
  },
  'awc.badge': {
    en: 'Anganwadi Centre · AWC (ICDS)',
    or: 'ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ର · AWC (ICDS)',
  },
  'awc.centreProfileTitle': {
    en: 'Centre profile',
    or: 'କେନ୍ଦ୍ର ପ୍ରୋଫାଇଲ୍',
  },
  'awc.centreProfileSubtitle': {
    en: 'Basic information about this Anganwadi centre.',
    or: 'ଏହି ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ର ସମ୍ପର୍କିତ ମୂଳ ତଥ୍ୟ।',
  },
  'awc.staffContactTitle': {
    en: 'Staff & contact',
    or: 'ସ୍ଟାଫ୍ ଏବଂ ଯୋଗାଯୋଗ',
  },
  'awc.staffContactSubtitle': {
    en: 'Key staff members and contact details for this centre.',
    or: 'ଏହି କେନ୍ଦ୍ରର ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ସ୍ଟାଫ୍ ଓ ଯୋଗାଯୋଗ ବିବରଣୀ।',
  },
  'awc.stat.studentStrength': {
    en: 'Student strength',
    or: 'ଶିଶୁ ସଂଖ୍ୟା',
  },
  'awc.stat.cpdoName': {
    en: 'CPDO name',
    or: 'CPDO ନାମ',
  },
  'awc.stat.supervisorName': {
    en: 'Supervisor name',
    or: 'ସୁପରଭାଇଜର ନାମ',
  },
  'awc.stat.awwName': {
    en: 'AWW name',
    or: 'AWW ନାମ',
  },
  'edu.badge': {
    en: 'Education · School',
    or: 'ଶିକ୍ଷା ବିଭାଗ · ବିଦ୍ୟାଳୟ',
  },
  'edu.schoolProfileTitle': {
    en: 'School profile',
    or: 'ବିଦ୍ୟାଳୟ ପ୍ରୋଫାଇଲ୍',
  },
  'edu.schoolProfileSubtitle': {
    en: 'Basic information about this school.',
    or: 'ଏହି ବିଦ୍ୟାଳୟ ସମ୍ପର୍କିତ ମୂଳ ତଥ୍ୟ।',
  },
  'edu.infraTitle': {
    en: 'Infrastructure',
    or: 'ଅବକାଠା',
  },
  'edu.infraSubtitle': {
    en: 'Key infrastructure and facilities available at this school.',
    or: 'ଏହି ବିଦ୍ୟାଳୟର ମୁଖ୍ୟ ଅବକାଠା ଏବଂ ସୁବିଧା।',
  },
  'edu.stat.students': {
    en: 'Students',
    or: 'ଛାତ୍ରଛାତ୍ରୀ',
  },
  'edu.stat.teachers': {
    en: 'Teachers',
    or: 'ଶିକ୍ଷକମଣ୍ଡଳୀ',
  },
  'edu.stat.classrooms': {
    en: 'Classrooms',
    or: 'ଶ୍ରେଣୀକକ୍ଷ',
  },
  'edu.stat.smartClassrooms': {
    en: 'Smart classrooms',
    or: 'ସ୍ମାର୍ଟ କ୍ଲାସ୍',
  },
  'health.badge': {
    en: 'Health facility',
    or: 'ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର',
  },
  'health.facilityProfileTitle': {
    en: 'Facility profile',
    or: 'ସଂସ୍ଥା ପ୍ରୋଫାଇଲ୍',
  },
  'health.facilityProfileSubtitle': {
    en: 'Basic information about this health facility.',
    or: 'ଏହି ସ୍ୱାସ୍ଥ୍ୟ ସଂସ୍ଥା ସମ୍ପର୍କିତ ମୂଳ ତଥ୍ୟ।',
  },
  'health.infraTitle': {
    en: 'Infrastructure',
    or: 'ଭିତ୍ତି ସଂରଚନା',
  },
  'health.infraSubtitle': {
    en: 'Beds, ICU and key clinical facilities.',
    or: 'ବେଡ୍, ICU ଏବଂ ପ୍ରମୁଖ ଚିକିତ୍ସା ସୁବିଧା।',
  },
  'health.stat.opd': {
    en: 'OPD (monthly)',
    or: 'OPD (ମାସିକ)',
  },
  'health.stat.ipd': {
    en: 'IPD (monthly)',
    or: 'IPD (ମାସିକ)',
  },
  'health.stat.beds': {
    en: 'Total beds',
    or: 'ମୋଟ ବେଡ୍',
  },
  'health.stat.icuBeds': {
    en: 'ICU beds',
    or: 'ICU ବେଡ୍',
  },
  'health.staffTitle': {
    en: 'Key staff',
    or: 'ମୁଖ୍ୟ କର୍ମଚାରୀ',
  },
  'health.staffSubtitle': {
    en: 'Medical officers, nurses and support staff.',
    or: 'ଚିକିତ୍ସା ଅଧିକାରୀ, ନର୍ସ ଏବଂ ସହାୟକ କର୍ମଚାରୀ।',
  },
  'login.dept.title': {
    en: 'Department admin login',
    or: 'ବିଭାଗ ପ୍ରଶାସକ ଲଗଇନ୍',
  },
  'login.dept.subtitle': {
    en: 'Use your department admin credentials to manage organizations for your department.',
    or: 'ଆପଣଙ୍କ ବିଭାଗର ସଂସ୍ଥାଗୁଡିକ ପରିଚାଳନା କରିବାକୁ ବିଭାଗ ପ୍ରଶାସକ ପ୍ରମାଣପତ୍ର ବ୍ୟବହାର କରନ୍ତୁ।',
  },
  'login.email': {
    en: 'Email',
    or: 'ଇମେଲ୍',
  },
  'login.password': {
    en: 'Password',
    or: 'ପାସୱାର୍ଡ',
  },
  'login.signIn': {
    en: 'Sign in',
    or: 'ସାଇନ୍ ଇନ୍ କରନ୍ତୁ',
  },
  'login.signingIn': {
    en: 'Signing in…',
    or: 'ସାଇନ୍ ଇନ୍ ହେଉଛି…',
  },
  'login.error.deptOnly': {
    en: 'This login is only for department admins. Use super admin login instead.',
    or: 'ଏହା କେବଳ ବିଭାଗ ପ୍ରଶାସକଙ୍କ ପାଇଁ। ବଦଳରେ ସୁପର ଆଡମିନ୍ ଲଗଇନ୍ ବ୍ୟବହାର କରନ୍ତୁ।',
  },
  'login.error.failed': {
    en: 'Login failed',
    or: 'ଲଗଇନ୍ ବିଫଳ ହେଲା',
  },
  'login.super.title': {
    en: 'Super admin login',
    or: 'ସୁପର ଆଡମିନ୍ ଲଗଇନ୍',
  },
  'login.super.subtitle': {
    en: 'Use the super admin credentials to manage departments and department admins.',
    or: 'ବିଭାଗ ଏବଂ ବିଭାଗ ପ୍ରଶାସକଙ୍କୁ ପରିଚାଳନା କରିବାକୁ ସୁପର ଆଡମିନ୍ ପ୍ରମାଣପତ୍ର ବ୍ୟବହାର କରନ୍ତୁ।',
  },
  'login.error.superOnly': {
    en: 'This login is only for super admin. Use department admin login instead.',
    or: 'ଏହା କେବଳ ସୁପର ଆଡମିନ୍ ପାଇଁ। ବଦଳରେ ବିଭାଗ ପ୍ରଶାସକ ଲଗଇନ୍ ବ୍ୟବହାର କରନ୍ତୁ।',
  },
};

export function t(key: MessageKey, language: Language): string {
  return messages[key]?.[language] ?? messages[key]?.en ?? key;
}

