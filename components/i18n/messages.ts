import type { ReactNode } from 'react';
import type { Language } from './LanguageContext';

export type MessageKey =
  | 'govBar.title'
  | 'govBar.subtitle'
  | 'navbar.tagline'
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
  | 'awc.stat.awwName';

const messages: Record<MessageKey, { en: string; or: string }> = {
  'govBar.title': {
    en: 'Government of Odisha',
    or: 'ଓଡିଶା ସରକାର',
  },
  'govBar.subtitle': {
    en: 'Odisha Government',
    or: 'ଓଡିଶା ସରକାର',
  },
  'navbar.tagline': {
    en: 'Constituency Dashboard',
    or: 'ବିଧାନସଭା କ୍ଷେତ୍ର ଡ୍ୟାସବୋର୍ଡ',
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
};

export function t(key: MessageKey, language: Language): string {
  return messages[key]?.[language] ?? messages[key]?.en ?? key;
}

