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
  | 'dept.roads'
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
  | 'awc.snp.title'
  | 'awc.snp.subtitle'
  | 'awc.snp.slNo'
  | 'awc.snp.date'
  | 'awc.snp.openingBalance'
  | 'awc.snp.received'
  | 'awc.snp.totalStock'
  | 'awc.snp.exp'
  | 'awc.snp.bal'
  | 'awc.snp.filterByDate'
  | 'awc.snp.allDates'
  | 'awc.snp.showingRows'
  | 'awc.snp.prev'
  | 'awc.snp.next'
  | 'awc.snp.addFormTitle'
  | 'awc.snp.addFormDescription'
  | 'awc.snp.awcLabel'
  | 'awc.snp.selectAwc'
  | 'awc.snp.openingBalanceKg'
  | 'awc.snp.receivedKg'
  | 'awc.snp.expKg'
  | 'awc.snp.placeholderOpening'
  | 'awc.snp.placeholderReceived'
  | 'awc.snp.placeholderExp'
  | 'awc.snp.addButton'
  | 'awc.snp.addingButton'
  | 'awc.snp.organization'
  | 'awc.snp.actions'
  | 'awc.snp.edit'
  | 'awc.snp.delete'
  | 'awc.snp.save'
  | 'awc.snp.cancel'
  | 'awc.snp.noEntriesYet'
  | 'awc.snp.saving'
  | 'awc.snp.bulkUploadTitle'
  | 'awc.snp.bulkUploadDescription'
  | 'awc.snp.downloadTemplate'
  | 'awc.snp.chooseFile'
  | 'awc.snp.uploadCsv'
  | 'awc.snp.uploading'
  | 'awc.snp.noMatches'
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
  | 'login.error.superOnly'
  | 'super.panel.title'
  | 'super.panel.subtitle'
  | 'super.sidebar.dashboard'
  | 'super.sidebar.snp'
  | 'super.sidebar.menu'
  | 'super.sidebar.close'
  | 'super.logout'
  | 'super.create.title'
  | 'super.create.subtitle'
  | 'super.create.fullName'
  | 'super.create.department'
  | 'super.create.selectDepartment'
  | 'super.create.button'
  | 'super.create.creating'
  | 'super.create.errorRequired'
  | 'super.create.errorFailed'
  | 'super.admins.title'
  | 'super.admins.subtitle'
  | 'super.admins.name'
  | 'super.admins.email'
  | 'super.admins.department'
  | 'super.admins.status'
  | 'super.admins.active'
  | 'super.admins.inactive'
  | 'super.admins.empty'
  | 'super.error.loadFailed';

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
  'dept.roads': {
    en: 'Roads',
    or: 'ରାସ୍ତା',
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
  'awc.snp.title': {
    en: 'SNP (Supplementary Nutrition Programme)',
    or: 'ଅନୁପୂରକ ପୋଷଣ କାର୍ଯ୍ୟକ୍ରମ',
  },
  'awc.snp.subtitle': {
    en: 'Daily stock – date-wise',
    or: 'ଦୈନିକ ଷ୍ଟକ୍ – ତାରିଖ ଅନୁସାରେ',
  },
  'awc.snp.slNo': {
    en: 'Sl No',
    or: 'କ୍ରମିକ ସଂଖ୍ୟା',
  },
  'awc.snp.date': {
    en: 'Date',
    or: 'ତାରିଖ',
  },
  'awc.snp.openingBalance': {
    en: 'Opening balance',
    or: 'ଆରମ୍ଭିକ ବାକି',
  },
  'awc.snp.received': {
    en: 'Received',
    or: 'ପ୍ରାପ୍ତ',
  },
  'awc.snp.totalStock': {
    en: 'Total Stock',
    or: 'ମୋଟ ଷ୍ଟକ୍',
  },
  'awc.snp.exp': {
    en: 'Expended',
    or: 'ବ୍ୟବହୃତ',
  },
  'awc.snp.bal': {
    en: 'Balance',
    or: 'ବାକି',
  },
  'awc.snp.filterByDate': {
    en: 'Filter by date',
    or: 'ତାରିଖ ଦ୍ୱାରା ଫିଲ୍ଟର କରନ୍ତୁ',
  },
  'awc.snp.allDates': {
    en: 'All dates',
    or: 'ସମସ୍ତ ତାରିଖ',
  },
  'awc.snp.showingRows': {
    en: 'Showing %1-%2 of %3 rows',
    or: '%3 ଧାଡି ମଧ୍ୟରୁ %1-%2 ଦେଖାଯାଉଛି',
  },
  'awc.snp.prev': {
    en: 'Previous',
    or: 'ପୂର୍ବବର୍ତ୍ତୀ',
  },
  'awc.snp.next': {
    en: 'Next',
    or: 'ପରବର୍ତ୍ତୀ',
  },
  'awc.snp.addFormTitle': {
    en: 'Supplementary Nutrition Programme(SNP) – Daily Stock',
    or: 'ଅନୁପୂରକ ପୋଷଣ କାର୍ଯ୍ୟକ୍ରମ – ଦୈନିକ ଷ୍ଟକ୍',
  },
  'awc.snp.addFormDescription': {
    en: 'Add daily stock data for an AWC. Total Stock = Opening + Received; Bal = Total − Exp.',
    or: 'ଏକ ଅଙ୍ଗନୱାଡି ପାଇଁ ଦୈନିକ ଷ୍ଟକ୍ ତଥ୍ୟ ଯୋଡନ୍ତୁ। ମୋଟ ଷ୍ଟକ୍ = ଆରମ୍ଭିକ ବାକି + ପ୍ରାପ୍ତ; ବାକି = ମୋଟ − ବ୍ୟବହୃତ।',
  },
  'awc.snp.awcLabel': {
    en: 'AWC',
    or: 'ଅଙ୍ଗନୱାଡି କେନ୍ଦ୍ର',
  },
  'awc.snp.selectAwc': {
    en: 'Select AWC',
    or: 'ଅଙ୍ଗନୱାଡି କେନ୍ଦ୍ର ଚୟନ କରନ୍ତୁ',
  },
  'awc.snp.noMatches': {
    en: 'No matches',
    or: 'କୌଣସି ମିଳିଲା ନାହିଁ',
  },
  'awc.snp.openingBalanceKg': {
    en: 'Opening balance (Kg)',
    or: 'ଆରମ୍ଭିକ ବାକି (କି.ଗ୍ରା.)',
  },
  'awc.snp.receivedKg': {
    en: 'Received (Kg)',
    or: 'ପ୍ରାପ୍ତ (କି.ଗ୍ରା.)',
  },
  'awc.snp.expKg': {
    en: 'Exp (Kg)',
    or: 'ବ୍ୟବହୃତ (କି.ଗ୍ରା.)',
  },
  'awc.snp.placeholderOpening': {
    en: 'e.g. 10',
    or: 'ଯେପରିକି ୧୦',
  },
  'awc.snp.placeholderReceived': {
    en: 'e.g. 5',
    or: 'ଯେପରିକି ୫',
  },
  'awc.snp.placeholderExp': {
    en: 'e.g. 7',
    or: 'ଯେପରିକି ୭',
  },
  'awc.snp.addButton': {
    en: 'Add SNP daily stock',
    or: 'SNP ଦୈନିକ ଷ୍ଟକ୍ ଯୋଡନ୍ତୁ',
  },
  'awc.snp.addingButton': {
    en: 'Adding...',
    or: 'ଯୋଡୁଛି...',
  },
  'awc.snp.organization': {
    en: 'Organization',
    or: 'ଅଙ୍ଗନୱାଡି କେନ୍ଦ୍ର',
  },
  'awc.snp.actions': {
    en: 'Actions',
    or: 'କାର୍ଯ୍ୟ',
  },
  'awc.snp.edit': {
    en: 'Edit',
    or: 'ସଂପାଦନ କରନ୍ତୁ',
  },
  'awc.snp.delete': {
    en: 'Delete',
    or: 'ବିଲୋପ କରନ୍ତୁ',
  },
  'awc.snp.save': {
    en: 'Save',
    or: 'ସେଭ୍ କରନ୍ତୁ',
  },
  'awc.snp.cancel': {
    en: 'Cancel',
    or: 'ବାତିଲ୍ କରନ୍ତୁ',
  },
  'awc.snp.noEntriesYet': {
    en: 'No SNP entries yet. Add one above.',
    or: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି SNP ଏଣ୍ଟ୍ରି ନାହିଁ। ଉପରେ ଗୋଟିଏ ଯୋଡନ୍ତୁ।',
  },
  'awc.snp.saving': {
    en: 'Saving...',
    or: 'ସେଭ୍ ହେଉଛି...',
  },
  'awc.snp.bulkUploadTitle': {
    en: 'Bulk upload (CSV)',
    or: 'ବଲ୍କ ଅପଲୋଡ୍ (CSV)',
  },
  'awc.snp.bulkUploadDescription': {
    en: 'Upload a CSV with columns: organization_id, record_date, opening_balance_kg, received_kg, exp_kg. Date format: YYYY-MM-DD.',
    or: 'organization_id, record_date, opening_balance_kg, received_kg, exp_kg ସ୍ତମ୍ବ ସହିତ ଏକ CSV ଅପଲୋଡ୍ କରନ୍ତୁ। ତାରିଖ ଫର୍ମାଟ୍: YYYY-MM-DD।',
  },
  'awc.snp.downloadTemplate': {
    en: 'Download CSV template',
    or: 'CSV ଟେମ୍ପଲେଟ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ',
  },
  'awc.snp.chooseFile': {
    en: 'Choose file',
    or: 'ଫାଇଲ୍ ଚୟନ କରନ୍ତୁ',
  },
  'awc.snp.uploadCsv': {
    en: 'Upload CSV',
    or: 'CSV ଅପଲୋଡ୍ କରନ୍ତୁ',
  },
  'awc.snp.uploading': {
    en: 'Uploading...',
    or: 'ଅପଲୋଡ୍ ହେଉଛି...',
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
  'super.panel.title': {
    en: 'Super admin panel',
    or: 'ସୁପର ଆଡମିନ୍ ପ୍ୟାନେଲ୍',
  },
  'super.panel.subtitle': {
    en: 'Manage department admins and high-level configuration.',
    or: 'ବିଭାଗ ପ୍ରଶାସକଙ୍କୁ ଏବଂ ଉଚ୍ଚ ସ୍ତରୀୟ ସେଟିଂ ପରିଚାଳନା କରନ୍ତୁ।',
  },
  'super.sidebar.dashboard': {
    en: 'Dashboard',
    or: 'ଡ୍ୟାସବୋର୍ଡ',
  },
  'super.sidebar.menu': {
    en: 'Menu',
    or: 'ମେନୁ',
  },
  'super.sidebar.close': {
    en: 'Close',
    or: 'ବନ୍ଦ କରନ୍ତୁ',
  },
  'super.sidebar.snp': {
    en: 'SNP Daily Stock',
    or: 'ଦୈନିକ ଷ୍ଟକ୍',
  },
  'super.logout': {
    en: 'Logout',
    or: 'ଲଗଆଉଟ୍',
  },
  'super.create.title': {
    en: 'Create department admin',
    or: 'ବିଭାଗ ପ୍ରଶାସକ ସୃଷ୍ଟି କରନ୍ତୁ',
  },
  'super.create.subtitle': {
    en: 'Super admin can create department admins. There is no direct signup.',
    or: 'ସୁପର ଆଡମିନ୍ ବିଭାଗ ପ୍ରଶାସକ ସୃଷ୍ଟି କରିପାରିବେ। ପ୍ରତ୍ୟକ୍ଷ ସାଇନଅପ୍ ନାହିଁ।',
  },
  'super.create.fullName': {
    en: 'Full name',
    or: 'ପୂର୍ଣ୍ଣ ନାମ',
  },
  'super.create.department': {
    en: 'Department',
    or: 'ବିଭାଗ',
  },
  'super.create.selectDepartment': {
    en: 'Select department',
    or: 'ବିଭାଗ ଚୟନ କରନ୍ତୁ',
  },
  'super.create.button': {
    en: 'Create admin',
    or: 'ପ୍ରଶାସକ ସୃଷ୍ଟି କରନ୍ତୁ',
  },
  'super.create.creating': {
    en: 'Creating…',
    or: 'ସୃଷ୍ଟି ହେଉଛି…',
  },
  'super.create.errorRequired': {
    en: 'All fields are required to create a department admin.',
    or: 'ବିଭାଗ ପ୍ରଶାସକ ସୃଷ୍ଟି କରିବାକୁ ସମସ୍ତ କ୍ଷେତ୍ର ଆବଶ୍ୟକ।',
  },
  'super.create.errorFailed': {
    en: 'Failed to create admin',
    or: 'ପ୍ରଶାସକ ସୃଷ୍ଟି ବିଫଳ ହେଲା',
  },
  'super.admins.title': {
    en: 'Department admins',
    or: 'ବିଭାଗ ପ୍ରଶାସକଗଣ',
  },
  'super.admins.subtitle': {
    en: 'Existing department admins (ICDS, Education, etc.).',
    or: 'ବିଦ୍ୟମାନ ବିଭାଗ ପ୍ରଶାସକଗଣ (ICDS, ଶିକ୍ଷା ଇତ୍ୟାଦି)।',
  },
  'super.admins.name': {
    en: 'Name',
    or: 'ନାମ',
  },
  'super.admins.email': {
    en: 'Email',
    or: 'ଇମେଲ୍',
  },
  'super.admins.department': {
    en: 'Department',
    or: 'ବିଭାଗ',
  },
  'super.admins.status': {
    en: 'Status',
    or: 'ସ୍ଥିତି',
  },
  'super.admins.active': {
    en: 'Active',
    or: 'ସକ୍ରିୟ',
  },
  'super.admins.inactive': {
    en: 'Inactive',
    or: 'ନିଷ୍କ୍ରିୟ',
  },
  'super.admins.empty': {
    en: 'No department admins yet.',
    or: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ବିଭାଗ ପ୍ରଶାସକ ନାହିଁ।',
  },
  'super.error.loadFailed': {
    en: 'Failed to load admin data',
    or: 'ପ୍ରଶାସକ ତଥ୍ୟ ଲୋଡ୍ ବିଫଳ ହେଲା',
  },
};

export function t(key: MessageKey, language: Language): string {
  return messages[key]?.[language] ?? messages[key]?.en ?? key;
}

