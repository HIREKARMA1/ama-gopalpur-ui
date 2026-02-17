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
  | 'shell.departmentsTab'
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
  | 'health.staffSubtitle';

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
    or: 'ଅବକାଠା',
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
};

export function t(key: MessageKey, language: Language): string {
  return messages[key]?.[language] ?? messages[key]?.en ?? key;
}

