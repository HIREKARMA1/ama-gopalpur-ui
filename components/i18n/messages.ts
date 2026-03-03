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
  | 'dept.electricity'
  | 'shell.departmentsTab'
  | 'map.legend'
  | 'map.viewProfile'
  | 'map.edu.primarySchool'
  | 'map.edu.upperPrimarySchool'
  | 'map.edu.highSchool'
  | 'map.edu.higherSecondary'
  | 'map.edu.college'
  | 'map.edu.university'
  | 'map.edu.sub.school'
  | 'map.edu.sub.engineeringCollege'
  | 'map.edu.sub.iti'
  | 'map.edu.sub.university'
  | 'map.edu.sub.diplomaCollege'
  | 'map.health.hospital'
  | 'map.health.chc'
  | 'map.health.phc'
  | 'map.health.sc'
  | 'map.health.uaam'
  | 'map.health.uphc'
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
  | 'super.error.loadFailed'
  | 'health.monitoring.title'
  | 'electricity.monitoring.title'
  | 'health.monitoring.subtitle'
  | 'health.monitoring.attendance.title'
  | 'health.monitoring.medicine.title'
  | 'health.monitoring.extra.title'
  | 'health.monitoring.patients.title'
  | 'health.monitoring.attendance.count'
  | 'health.monitoring.attendance.doc'
  | 'health.monitoring.medicine.name'
  | 'health.monitoring.medicine.opening'
  | 'health.monitoring.medicine.received'
  | 'health.monitoring.medicine.issued'
  | 'health.monitoring.medicine.closing'
  | 'health.monitoring.extra.van'
  | 'health.monitoring.extra.remarks'
  | 'health.monitoring.patients.opd'
  | 'health.monitoring.patients.ipd'
  | 'health.monitoring.patients.surgeries'
  | 'health.monitoring.patients.deliveries'
  | 'health.monitoring.patients.refIn'
  | 'health.monitoring.patients.refOut'
  | 'edu.tab.profile'
  | 'edu.tab.academic'
  | 'edu.tab.faculty'
  | 'edu.tab.intake'
  | 'edu.tab.infra'
  | 'edu.tab.admin'
  | 'edu.tab.placement'
  | 'edu.dashboard.title'
  | 'edu.dashboard.subtitle'
  | 'edu.stat.totalIntake'
  | 'edu.stat.placementPercent'
  | 'edu.stat.highestPackage'
  | 'edu.location.title'
  | 'edu.location.subtitle'
  | 'edu.details.title'
  | 'electricity.dashboard.title'
  | 'electricity.dashboard.subtitle'
  | 'electricity.details.title'
  | 'electricity.tab.profile'
  | 'electricity.tab.staff'
  | 'electricity.top.powerStatus'
  | 'electricity.top.transformers'
  | 'electricity.top.complaintsToday'
  | 'electricity.top.avgResolution'
  | 'electricity.status.noData'
  | 'electricity.status.available'
  | 'electricity.status.partial'
  | 'electricity.status.outage'
  | 'electricity.stat.officeName'
  | 'electricity.stat.blockUlb'
  | 'electricity.stat.gpWard'
  | 'electricity.stat.locality'
  | 'electricity.stat.type'
  | 'electricity.stat.capacity'
  | 'electricity.stat.voltage'
  | 'electricity.stat.coordinates'
  | 'electricity.main.voltagePrimary'
  | 'electricity.main.totalFeeders'
  | 'electricity.main.totalConsumers'
  | 'electricity.main.atcLoss'
  | 'electricity.ops.title'
  | 'electricity.ops.subtitle'
  | 'electricity.ops.dailySupplyTitle'
  | 'electricity.ops.dailySupplySubtitle'
  | 'electricity.ops.legend.urban'
  | 'electricity.ops.legend.rural'
  | 'electricity.ops.bar.urban'
  | 'electricity.ops.bar.rural'
  | 'electricity.ops.dailyComplaintTitle'
  | 'electricity.ops.dailyComplaintSubtitle'
  | 'electricity.ops.line.received'
  | 'electricity.ops.line.resolved'
  | 'electricity.monthly.title'
  | 'electricity.monthly.col.month'
  | 'electricity.monthly.col.units'
  | 'electricity.monthly.col.revenue'
  | 'electricity.monthly.col.loss'
  | 'electricity.monthly.col.efficiency'
  | 'electricity.monthly.empty'
  | 'electricity.map.title'
  | 'electricity.map.subtitle'
  | 'electricity.map.loading'
  | 'electricity.staff.empty'
  | 'electricity.staff.role.inCharge'
  | 'electricity.staff.role.engineer'
  | 'electricity.staff.role.technical'
  | 'electricity.staff.role.lineman'
  | 'electricity.staff.role.admin'
  | 'electricity.group.adminOrg'
  | 'electricity.group.locationContact'
  | 'electricity.group.technicalInfra'
  | 'electricity.group.serviceConsumer'
  | 'electricity.group.performanceBilling'
  | 'electricity.group.staffingCoverage'
  | 'electricity.group.assetsFacilities'
  | 'electricity.group.financialsRecords'
  | 'electricity.field.institutionType'
  | 'electricity.field.institutionIdCode'
  | 'electricity.field.ownership'
  | 'electricity.field.parentOrganization'
  | 'electricity.field.hierarchyLevel'
  | 'electricity.field.hostInstitution'
  | 'electricity.field.establishedYear'
  | 'electricity.field.commissionedYearSubstations'
  | 'electricity.field.fullAddress'
  | 'electricity.field.pinCode'
  | 'electricity.field.latitude'
  | 'electricity.field.longitude'
  | 'electricity.field.inChargeName'
  | 'electricity.field.inChargeDesignation'
  | 'electricity.field.inChargeContact'
  | 'electricity.field.inChargeEmail'
  | 'electricity.field.officePhone'
  | 'electricity.field.officeEmail'
  | 'electricity.field.website'
  | 'electricity.field.officeHours'
  | 'electricity.field.voltageLevelPrimary'
  | 'electricity.field.voltageLevelSecondary'
  | 'electricity.field.installedCapacity'
  | 'electricity.field.noOfTransformers'
  | 'electricity.field.transformerRatings'
  | 'electricity.field.noOfIncomingFeeders'
  | 'electricity.field.noOfOutgoingFeeders'
  | 'electricity.field.totalFeedersLabel'
  | 'electricity.field.baysCount'
  | 'electricity.field.switchgearType'
  | 'electricity.field.feeder33kvLength'
  | 'electricity.field.feeder11kvLength'
  | 'electricity.field.ltLineLength'
  | 'electricity.field.noOfDistributionTransformers'
  | 'electricity.field.dtTotalCapacity'
  | 'electricity.field.tollFreeNumber'
  | 'electricity.field.helplineAvailable'
  | 'electricity.field.consumersUnderJurisdiction'
  | 'electricity.field.consumersDomestic'
  | 'electricity.field.consumersCommercial'
  | 'electricity.field.consumersIndustrial'
  | 'electricity.field.consumersAgricultural'
  | 'electricity.field.consumersOther'
  | 'electricity.field.htConsumers'
  | 'electricity.field.ltConsumers'
  | 'electricity.field.connectedLoad'
  | 'electricity.field.atcLossPercent'
  | 'electricity.field.billingEfficiencyPercent'
  | 'electricity.field.collectionEfficiencyPercent'
  | 'electricity.field.hoursSupplyRural'
  | 'electricity.field.hoursSupplyUrban'
  | 'electricity.field.complaintsRegisteredLastYear'
  | 'electricity.field.complaintsRedressedLastYear'
  | 'electricity.field.consumerCareCounter'
  | 'electricity.field.billingFacility'
  | 'electricity.field.onlinePayment'
  | 'electricity.field.mobileApp'
  | 'electricity.field.onlineComplaintPortal'
  | 'electricity.field.customerCareEmail'
  | 'electricity.field.grievanceRedressalForum'
  | 'electricity.field.totalStaff'
  | 'electricity.field.engineersCountLabel'
  | 'electricity.field.technicalStaffCountLabel'
  | 'electricity.field.linemanCount'
  | 'electricity.field.contractStaffCount'
  | 'electricity.field.adminOfficeStaffCount'
  | 'electricity.field.villagesCovered'
  | 'electricity.field.gpsCovered'
  | 'electricity.field.areaCoveredSqKm'
  | 'electricity.field.buildingType'
  | 'electricity.field.totalFloorsLabel'
  | 'electricity.field.officeAreaSqFt'
  | 'electricity.field.trainingCenter'
  | 'electricity.field.trainingCapacitySeats'
  | 'electricity.field.workshopGarage'
  | 'electricity.field.store'
  | 'electricity.field.dgSet'
  | 'electricity.field.solar'
  | 'electricity.field.vehiclesCountLabel'
  | 'electricity.field.twoWheelersCount'
  | 'electricity.field.annualRevenueCr'
  | 'electricity.field.billingCrLastYear'
  | 'electricity.field.dataAsOn'
  | 'electricity.field.remarksDescriptionLabel'
  | 'map.search.placeholder'
  | 'map.search.noResults'
  | 'map.search.submit'
  | 'map.legend.showAll'
  | 'map.legend.showOnly'
  | 'map.info.sector'
  | 'map.info.gp'
  | 'map.info.block';

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
    en: 'Shri Bibhuti Bhusan Jena',
    or: 'ଶ୍ରୀ ବିଭୂତି ଭୂଷଣ ଜେନା',
  },
  'navbar.ministerSubtitle': {
    en: 'Honourable Cabinet Minister, Odisha',
    or: 'ମାନ୍ୟବର ମନ୍ତ୍ରୀ, ଓଡିଶା ସରକାର',
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
  'dept.electricity': {
    en: 'Electricity',
    or: 'ବିଦ୍ୟୁତ',
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
  'map.edu.sub.school': { en: 'School', or: 'ବିଦ୍ୟାଳୟ' },
  'map.edu.sub.engineeringCollege': { en: 'Engineering College', or: 'ଇଞ୍ଜିନିୟରିଂ କଲେଜ' },
  'map.edu.sub.iti': { en: 'ITI', or: 'ଆଇ.ଟି.ଆଇ.' },
  'map.edu.sub.university': { en: 'University', or: 'ବିଶ୍ୱବିଦ୍ୟାଳୟ' },
  'map.edu.sub.diplomaCollege': { en: 'Diploma College', or: 'ଡିପ୍ଲୋମା କଲେଜ' },
  'map.health.hospital': { en: 'Hospital', or: 'ଡାକ୍ତରଖାନା' },
  'map.health.chc': { en: 'CHC', or: 'ଗୋଷ୍ଠୀ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର' },
  'map.health.phc': { en: 'PHC', or: 'ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର' },
  'map.health.sc': { en: 'SC', or: 'ସବ୍-ସେଣ୍ଟର' },
  'map.health.uaam': { en: 'UAAM', or: 'UAAM' },
  'map.health.uphc': { en: 'UPHC', or: 'ସହରାଞ୍ଚଳ ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର' },
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
  'edu.tab.profile': { en: 'Facility Profile', or: 'ସଂସ୍ଥା ପ୍ରୋଫାଇଲ୍' },
  'edu.tab.academic': { en: 'Academic', or: 'ଶିକ୍ଷାଗତ' },
  'edu.tab.faculty': { en: 'Faculty', or: 'ଅଧ୍ୟାପକ/ଅଧ୍ୟାପିକା' },
  'edu.tab.intake': { en: 'Intake', or: 'ନାମଲେଖା' },
  'edu.tab.infra': { en: 'Infrastructure', or: 'ଭିତ୍ତିଭୂମି' },
  'edu.tab.admin': { en: 'Administration', or: 'ପ୍ରଶାସନ' },
  'edu.tab.placement': { en: 'Placement & Activities', or: 'ନିଯୁକ୍ତି ଏବଂ ଅନ୍ୟାନ୍ୟ' },
  'edu.dashboard.title': { en: 'Education Facility Dashboard', or: 'ଶିକ୍ଷା ଅନୁଷ୍ଠାନ ଡ୍ୟାସବୋର୍ଡ' },
  'edu.dashboard.subtitle': { en: 'Institution details and resources from available data', or: 'ଉପଲବ୍ଧ ତଥ୍ୟରୁ ଅନୁଷ୍ଠାନର ବିବରଣୀ ଏବଂ ସମ୍ପତ୍ତି' },
  'edu.stat.totalIntake': { en: 'Total Intake', or: 'ମୋଟ ନାମଲେଖା' },
  'edu.stat.placementPercent': { en: 'Placement Percentage', or: 'ନିଯୁକ୍ତି ପ୍ରତିଶତ' },
  'edu.stat.highestPackage': { en: 'Highest Package (LPA)', or: 'ସର୍ବାଧିକ ପ୍ୟାକେଜ୍' },
  'edu.location.title': { en: 'Institution Location', or: 'ଅନୁଷ୍ଠାନର ଅବସ୍ଥିତି' },
  'edu.location.subtitle': { en: 'Geographic coordinates and mapping details', or: 'ଭୌଗୋଳିକ ସଂଯୋଜକ ଏବଂ ମାନଚିତ୍ର ବିବରଣୀ' },
  'edu.details.title': { en: 'Institution Details', or: 'ଅନୁଷ୍ଠାନର ବିବରଣୀ' },
  'map.search.placeholder': { en: 'Search {dept}…', or: '{dept} ସନ୍ଧାନ କରନ୍ତୁ…' },
  'map.search.noResults': { en: 'No locations match your search yet.', or: 'ଆପଣଙ୍କ ସନ୍ଧାନ ସହିତ କୌଣସି ସ୍ଥାନ ମେଳ ଖାଉ ନାହିଁ' },
  'map.search.submit': { en: 'Search', or: 'ସନ୍ଧାନ' },
  'map.legend.showAll': { en: 'Show all', or: 'ସବୁ ଦେଖାନ୍ତୁ' },
  'map.legend.showOnly': { en: 'Show only', or: 'କେବଳ ଦେଖାନ୍ତୁ' },
  'map.info.sector': { en: 'Sector', or: 'ସେକ୍ଟର' },
  'map.info.gp': { en: 'GP', or: 'ଜି.ପି.' },
  'map.info.block': { en: 'Block', or: 'ବ୍ଲକ' },
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
  'health.monitoring.title': {
    en: 'Daily Health Monitoring',
    or: 'ଦୈନିକ ସ୍ୱାସ୍ଥ୍ୟ ଅନୁମାନ',
  },
  'electricity.monitoring.title': {
    en: 'Electricity Operations Monitoring',
    or: 'ବିଦ୍ୟୁତ ସେବା ନିରୀକ୍ଷଣ',
  },
  'electricity.dashboard.title': {
    en: 'Electricity Portfolio Dashboard',
    or: 'ବିଦ୍ୟୁତ ପୋର୍ଟଫୋଲିଓ ଡ୍ୟାସବୋର୍ଡ',
  },
  'electricity.dashboard.subtitle': {
    en: 'Power infrastructure and operational metrics for this office.',
    or: 'ଏହି କାର୍ଯ୍ୟାଳୟ ପାଇଁ ବିଦ୍ୟୁତ ପାଇପ୍ରଣାଳୀ ଓ କାର୍ଯ୍ୟପାଳନ ସଂକେତ।',
  },
  'electricity.details.title': {
    en: 'Facility details',
    or: 'ସୁବିଧା ବିବରଣୀ',
  },
  'electricity.tab.profile': {
    en: 'Profile',
    or: 'ପ୍ରୋଫାଇଲ',
  },
  'electricity.tab.staff': {
    en: 'Staff & Contact',
    or: 'କର୍ମଚାରୀ ଏବଂ ଯୋଗାଯୋଗ',
  },
  'electricity.top.powerStatus': {
    en: 'Power Supply Status',
    or: 'ବିଦ୍ୟୁତ ଯୋଗାଣ ଅବସ୍ଥା',
  },
  'electricity.top.transformers': {
    en: 'Transformers Working',
    or: 'ଟ୍ରାନ୍ସଫର୍ମାର କାର୍ଯ୍ୟରତ',
  },
  'electricity.top.complaintsToday': {
    en: 'Fault Complaints Today',
    or: 'ଆଜିର ତ୍ରୁଟି ଅଭିଯୋଗ',
  },
  'electricity.top.avgResolution': {
    en: 'Avg Resolution Time',
    or: 'ଔସତ ସମାଧାନ ସମୟ',
  },
  'electricity.status.noData': {
    en: 'No data',
    or: 'ତଥ୍ୟ ନାହିଁ',
  },
  'electricity.status.available': {
    en: 'Available',
    or: 'ପୂର୍ଣ୍ଣ ଯୋଗାଣ',
  },
  'electricity.status.partial': {
    en: 'Partial',
    or: 'ଆଂଶିକ ଯୋଗାଣ',
  },
  'electricity.status.outage': {
    en: 'Outage',
    or: 'ବିଦ୍ୟୁତ ବନ୍ଦ',
  },
  'electricity.stat.officeName': {
    en: 'Office Name',
    or: 'କାର୍ଯ୍ୟାଳୟ ନାମ',
  },
  'electricity.stat.blockUlb': {
    en: 'Block / ULB',
    or: 'ବ୍ଲକ୍ / ULB',
  },
  'electricity.stat.gpWard': {
    en: 'GP / Ward',
    or: 'ଗ୍ରାମପଞ୍ଚାୟତ / ୱାର୍ଡ',
  },
  'electricity.stat.locality': {
    en: 'Locality',
    or: 'ଅଞ୍ଚଳ',
  },
  'electricity.stat.type': {
    en: 'Type',
    or: 'ପ୍ରକାର',
  },
  'electricity.stat.capacity': {
    en: 'Capacity',
    or: 'କ୍ଷମତା',
  },
  'electricity.stat.voltage': {
    en: 'Voltage',
    or: 'ଭୋଲ୍ଟେଜ୍',
  },
  'electricity.stat.coordinates': {
    en: 'Coordinates',
    or: 'ଅବସ୍ଥାନ ନିର୍ଦ୍ଦେଶାଙ୍କ',
  },
  'electricity.main.voltagePrimary': {
    en: 'Voltage Primary',
    or: 'ପ୍ରାଥମିକ ଭୋଲ୍ଟେଜ୍',
  },
  'electricity.main.totalFeeders': {
    en: 'Total Feeders',
    or: 'ମୋଟ ଫିଡର',
  },
  'electricity.main.totalConsumers': {
    en: 'Total Consumers',
    or: 'ମୋଟ ଉପଭୋକ୍ତା',
  },
  'electricity.main.atcLoss': {
    en: 'AT&C Loss',
    or: 'AT&C କ୍ଷୟ',
  },
  'electricity.ops.title': {
    en: 'Daily Operations Monitoring',
    or: 'ଦୈନିକ କାର୍ଯ୍ୟ ସମୀକ୍ଷା',
  },
  'electricity.ops.subtitle': {
    en: 'Operational data including supply hours, outages, and complaints resolution.',
    or: 'ଯୋଗାଣ ଘଣ୍ଟା, ବନ୍ଦ ଅବସ୍ଥା ଓ ଅଭିଯୋଗ ସମାଧାନ ସହିତ କାର୍ଯ୍ୟ ସୂଚନା।',
  },
  'electricity.ops.dailySupplyTitle': {
    en: 'Daily Supply Hours',
    or: 'ଦୈନିକ ବିଦ୍ୟୁତ ଯୋଗାଣ (ଘଣ୍ଟା)',
  },
  'electricity.ops.dailySupplySubtitle': {
    en: 'Urban vs rural supply (Last 15 records)',
    or: 'ଶହର ଓ ଗ୍ରାମୀଣ ଯୋଗାଣ (ଶେଷ ୧୫ ତଥ୍ୟ)',
  },
  'electricity.ops.legend.urban': {
    en: 'Urban',
    or: 'ଶହର',
  },
  'electricity.ops.legend.rural': {
    en: 'Rural',
    or: 'ଗ୍ରାମୀଣ',
  },
  'electricity.ops.bar.urban': {
    en: 'Urban supply',
    or: 'ଶହର ଯୋଗାଣ',
  },
  'electricity.ops.bar.rural': {
    en: 'Rural supply',
    or: 'ଗ୍ରାମୀଣ ଯୋଗାଣ',
  },
  'electricity.ops.dailyComplaintTitle': {
    en: 'Daily Complaint Status',
    or: 'ଦୈନିକ ଅଭିଯୋଗ ସ୍ଥିତି',
  },
  'electricity.ops.dailyComplaintSubtitle': {
    en: 'Complaints received vs resolved (Last 15 records)',
    or: 'ପ୍ରାପ୍ତ ଓ ସମାଧାନ ହୋଇଥିବା ଅଭିଯୋଗ (ଶେଷ ୧୫ ତଥ୍ୟ)',
  },
  'electricity.ops.line.received': {
    en: 'Complaints received',
    or: 'ପ୍ରାପ୍ତ ଅଭିଯୋଗ',
  },
  'electricity.ops.line.resolved': {
    en: 'Complaints resolved',
    or: 'ସମାଧାନ ହୋଇଥିବା ଅଭିଯୋଗ',
  },
  'electricity.monthly.title': {
    en: 'Financial & Performance Metrics',
    or: 'ଆର୍ଥିକ ଓ କାର୍ଯ୍ୟଦକ୍ଷତା ସୂଚକ',
  },
  'electricity.monthly.col.month': {
    en: 'Month/Year',
    or: 'ମାସ/ବର୍ଷ',
  },
  'electricity.monthly.col.units': {
    en: 'Units Billed (MU)',
    or: 'ବିଲ୍ ଇଉନିଟ୍ (MU)',
  },
  'electricity.monthly.col.revenue': {
    en: 'Revenue (Cr.)',
    or: 'ଆୟ (କୋଟି ଟଙ୍କା)',
  },
  'electricity.monthly.col.loss': {
    en: 'AT&C Loss %',
    or: 'AT&C କ୍ଷୟ %',
  },
  'electricity.monthly.col.efficiency': {
    en: 'Efficiency',
    or: 'କାର୍ଯ୍ୟଦକ୍ଷତା',
  },
  'electricity.monthly.empty': {
    en: 'No monthly records available',
    or: 'କୌଣସି ମାସିକ ତଥ୍ୟ ଉପଲବ୍ଧ ନାହିଁ',
  },
  'electricity.map.title': {
    en: 'Regional Office Location',
    or: 'କ୍ଷେତ୍ରୀୟ କାର୍ଯ୍ୟାଳୟ ଅବସ୍ଥିତି',
  },
  'electricity.map.subtitle': {
    en: 'Geographic location of the electricity establishment.',
    or: 'ବିଦ୍ୟୁତ ସଂସ୍ଥାନର ଭୌଗୋଳିକ ଅବସ୍ଥାନ।',
  },
  'electricity.map.loading': {
    en: 'Loading map…',
    or: 'ମାନଚିତ୍ର ଲୋଡ୍ ହେଉଛି…',
  },
  'electricity.staff.empty': {
    en: 'No staff information recorded',
    or: 'କୌଣସି ସ୍ଟାଫ୍ ସମ୍ପର୍କିତ ତଥ୍ୟ ରହିନାହିଁ',
  },
  'electricity.staff.role.inCharge': {
    en: 'In-charge',
    or: 'ଇଂଚାର୍ଜ',
  },
  'electricity.staff.role.engineer': {
    en: 'Engineer',
    or: 'ଇଞ୍ଜିନିୟର',
  },
  'electricity.staff.role.technical': {
    en: 'Technical Staff',
    or: 'ତକନିକୀ କର୍ମଚାରୀ',
  },
  'electricity.staff.role.lineman': {
    en: 'Lineman',
    or: 'ଲାଇନମ୍ୟାନ୍',
  },
  'electricity.staff.role.admin': {
    en: 'Admin Staff',
    or: 'ପ୍ରଶାସନିକ କର୍ମଚାରୀ',
  },
  'electricity.group.adminOrg': {
    en: 'Administration & Organization',
    or: 'ପ୍ରଶାସନ ଏବଂ ସଂଗଠନ',
  },
  'electricity.group.locationContact': {
    en: 'Location & Primary Contact',
    or: 'ଅବସ୍ଥାନ ଏବଂ ପ୍ରାଥମିକ ଯୋଗାଯୋଗ',
  },
  'electricity.group.technicalInfra': {
    en: 'Technical Infrastructure',
    or: 'ତକନିକୀ ଢାଞ୍ଚା',
  },
  'electricity.group.serviceConsumer': {
    en: 'Service & Consumer Metrics',
    or: 'ସେବା ଏବଂ ଉପଭୋକ୍ତା ସୂଚକ',
  },
  'electricity.group.performanceBilling': {
    en: 'Performance & Billing',
    or: 'କାର୍ଯ୍ୟଦକ୍ଷତା ଏବଂ ବିଲିଂ',
  },
  'electricity.group.staffingCoverage': {
    en: 'Staffing & Coverage',
    or: 'କର୍ମଚାରୀ ଏବଂ ଆବର୍ତ୍ତନ',
  },
  'electricity.group.assetsFacilities': {
    en: 'Assets & Facilities',
    or: 'ସମ୍ପତ୍ତି ଏବଂ ସୁବିଧା',
  },
  'electricity.group.financialsRecords': {
    en: 'Financials & Records',
    or: 'ଆର୍ଥିକ ଏବଂ ରେକର୍ଡ',
  },
  'electricity.field.institutionType': {
    en: 'Institution type',
    or: 'ସଂସ୍ଥାର ପ୍ରକାର',
  },
  'electricity.field.institutionIdCode': {
    en: 'Institution ID/Code',
    or: 'ସଂସ୍ଥା ID/କୋଡ୍',
  },
  'electricity.field.ownership': {
    en: 'Ownership',
    or: 'ମାଲିକାନା',
  },
  'electricity.field.parentOrganization': {
    en: 'Parent organization',
    or: 'ମୂଳ ସଂଗଠନ',
  },
  'electricity.field.hierarchyLevel': {
    en: 'Hierarchy level',
    or: 'ସିଢ଼ିକ୍ରମ ସ୍ତର',
  },
  'electricity.field.hostInstitution': {
    en: 'Host institution (if training centre)',
    or: 'ହୋଷ୍ଟ ସଂସ୍ଥା (ଯଦି ପ୍ରଶିକ୍ଷଣ କେନ୍ଦ୍ର)',
  },
  'electricity.field.establishedYear': {
    en: 'Established year',
    or: 'ସ୍ଥାପିତ ବର୍ଷ',
  },
  'electricity.field.commissionedYearSubstations': {
    en: 'Commissioned year (substations)',
    or: 'କାର୍ଯ୍ୟରତ ବର୍ଷ (ସବ୍-ଷ୍ଟେସନ୍)',
  },
  'electricity.field.fullAddress': {
    en: 'Full address',
    or: 'ପୂର୍ଣ୍ଣ ଠିକଣା',
  },
  'electricity.field.pinCode': {
    en: 'PIN code',
    or: 'ପିନ୍ କୋଡ୍',
  },
  'electricity.field.latitude': {
    en: 'Latitude',
    or: 'ଅକ୍ଷାଂଶ',
  },
  'electricity.field.longitude': {
    en: 'Longitude',
    or: 'ଦ୍ରାଘିମାଂଶ',
  },
  'electricity.field.inChargeName': {
    en: 'In-charge name',
    or: 'ଇଂଚାର୍ଜ ନାମ',
  },
  'electricity.field.inChargeDesignation': {
    en: 'In-charge designation',
    or: 'ଇଂଚାର୍ଜ ପଦବୀ',
  },
  'electricity.field.inChargeContact': {
    en: 'In-charge contact',
    or: 'ଇଂଚାର୍ଜ ଯୋଗାଯୋଗ',
  },
  'electricity.field.inChargeEmail': {
    en: 'In-charge email',
    or: 'ଇଂଚାର୍ଜ ଇମେଲ୍',
  },
  'electricity.field.officePhone': {
    en: 'Office phone',
    or: 'କାର୍ଯ୍ୟାଳୟ ଫୋନ୍',
  },
  'electricity.field.officeEmail': {
    en: 'Office email',
    or: 'କାର୍ଯ୍ୟାଳୟ ଇମେଲ୍',
  },
  'electricity.field.website': {
    en: 'Website',
    or: 'ଵେବସାଇଟ୍',
  },
  'electricity.field.officeHours': {
    en: 'Office hours',
    or: 'କାର୍ଯ୍ୟାଳୟ ସମୟ',
  },
  'electricity.field.voltageLevelPrimary': {
    en: 'Voltage level – primary (kV)',
    or: 'ଭୋଲ୍ଟେଜ୍ ସ୍ତର – ପ୍ରାଥମିକ (kV)',
  },
  'electricity.field.voltageLevelSecondary': {
    en: 'Voltage level – secondary (kV)',
    or: 'ଭୋଲ୍ଟେଜ୍ ସ୍ତର – ଦ୍ୱିତୀୟ (kV)',
  },
  'electricity.field.installedCapacity': {
    en: 'Installed capacity (MVA)',
    or: 'ସ୍ଥାପିତ କ୍ଷମତା (MVA)',
  },
  'electricity.field.noOfTransformers': {
    en: 'No. of transformers',
    or: 'ଟ୍ରାନ୍ସଫର୍ମାର ସଂଖ୍ୟା',
  },
  'electricity.field.transformerRatings': {
    en: 'Transformer ratings MVA (comma separated)',
    or: 'ଟ୍ରାନ୍ସଫର୍ମାର କ୍ଷମତା MVA (କମା ଦ୍ୱାରା ବିଭକ୍ତ)',
  },
  'electricity.field.noOfIncomingFeeders': {
    en: 'No. of incoming feeders',
    or: 'ଇନକମିଂ ଫିଡର ସଂଖ୍ୟା',
  },
  'electricity.field.noOfOutgoingFeeders': {
    en: 'No. of outgoing feeders',
    or: 'ଆଉଟଗୋଇଂ ଫିଡର ସଂଖ୍ୟା',
  },
  'electricity.field.totalFeedersLabel': {
    en: 'Total feeders',
    or: 'ମୋଟ ଫିଡର',
  },
  'electricity.field.baysCount': {
    en: 'Bays (count)',
    or: 'ବେ (ସଂଖ୍ୟା)',
  },
  'electricity.field.switchgearType': {
    en: 'Switchgear type (GIS/AIS/Hybrid)',
    or: 'ସ୍ୱିଚଗିୟର ପ୍ରକାର (GIS/AIS/Hybrid)',
  },
  'electricity.field.feeder33kvLength': {
    en: '33kV feeder length (km)',
    or: '33kV ଫିଡର ଲମ୍ବ (କି.ମି.)',
  },
  'electricity.field.feeder11kvLength': {
    en: '11kV feeder length (km)',
    or: '11kV ଫିଡର ଲମ୍ବ (କି.ମି.)',
  },
  'electricity.field.ltLineLength': {
    en: 'LT line length (km)',
    or: 'LT ଲାଇନ୍ ଲମ୍ବ (କି.ମି.)',
  },
  'electricity.field.noOfDistributionTransformers': {
    en: 'No. of distribution transformers (DTs)',
    or: 'ଡିସ୍ଟ୍ରିବ୍ୟୁସନ୍ ଟ୍ରାନ୍ସଫର୍ମାର (DTs) ସଂଖ୍ୟା',
  },
  'electricity.field.dtTotalCapacity': {
    en: 'DT total capacity (kVA)',
    or: 'DT ମୋଟ କ୍ଷମତା (kVA)',
  },
  'electricity.field.tollFreeNumber': {
    en: 'Toll-free / customer care number',
    or: 'ଟୋଲ୍-ଫ୍ରି / କଷ୍ଟମର୍ କେୟାର ନମ୍ବର',
  },
  'electricity.field.helplineAvailable': {
    en: 'Helpline available (Yes/No)',
    or: 'ହେଲ୍ପଲାଇନ୍ ଉପଲବ୍ଧ (ହଁ/ନା)',
  },
  'electricity.field.consumersUnderJurisdiction': {
    en: 'Consumers under jurisdiction (approx)',
    or: 'ଆଧିନସ୍ଥ ଉପଭୋକ୍ତା (ଆନୁମାନିକ)',
  },
  'electricity.field.consumersDomestic': {
    en: 'Consumers – domestic (count)',
    or: 'ଉପଭୋକ୍ତା – ଘରୋଇ (ସଂଖ୍ୟା)',
  },
  'electricity.field.consumersCommercial': {
    en: 'Consumers – commercial (count)',
    or: 'ଉପଭୋକ୍ତା – ବାଣିଜ୍ୟିକ (ସଂଖ୍ୟା)',
  },
  'electricity.field.consumersIndustrial': {
    en: 'Consumers – industrial (count)',
    or: 'ଉପଭୋକ୍ତା – ଶିଳ୍ପ (ସଂଖ୍ୟା)',
  },
  'electricity.field.consumersAgricultural': {
    en: 'Consumers – agricultural (count)',
    or: 'ଉପଭୋକ୍ତା – କୃଷି (ସଂଖ୍ୟା)',
  },
  'electricity.field.consumersOther': {
    en: 'Consumers – other (count)',
    or: 'ଉପଭୋକ୍ତା – ଅନ୍ୟ (ସଂଖ୍ୟା)',
  },
  'electricity.field.htConsumers': {
    en: 'HT consumers (count)',
    or: 'HT ଉପଭୋକ୍ତା (ସଂଖ୍ୟା)',
  },
  'electricity.field.ltConsumers': {
    en: 'LT consumers (count)',
    or: 'LT ଉପଭୋକ୍ତା (ସଂଖ୍ୟା)',
  },
  'electricity.field.connectedLoad': {
    en: 'Connected load (MW)',
    or: 'ସଂଯୁକ୍ତ ଲୋଡ୍ (MW)',
  },
  'electricity.field.atcLossPercent': {
    en: 'AT&C loss percent',
    or: 'AT&C କ୍ଷୟ ପ୍ରତିଶତ',
  },
  'electricity.field.billingEfficiencyPercent': {
    en: 'Billing efficiency percent',
    or: 'ବିଲିଂ କାର୍ଯ୍ୟଦକ୍ଷତା ପ୍ରତିଶତ',
  },
  'electricity.field.collectionEfficiencyPercent': {
    en: 'Collection efficiency percent',
    or: 'ସଂଗ୍ରହ କାର୍ଯ୍ୟଦକ୍ଷତା ପ୍ରତିଶତ',
  },
  'electricity.field.hoursSupplyRural': {
    en: 'Hours of supply – rural',
    or: 'ଯୋଗାଣ ଘଣ୍ଟା – ଗ୍ରାମୀଣ',
  },
  'electricity.field.hoursSupplyUrban': {
    en: 'Hours of supply – urban',
    or: 'ଯୋଗାଣ ଘଣ୍ଟା – ଶହର',
  },
  'electricity.field.complaintsRegisteredLastYear': {
    en: 'Complaints registered last year',
    or: 'ଗତ ବର୍ଷ ତିରସ୍କୃତ ଅଭିଯୋଗ',
  },
  'electricity.field.complaintsRedressedLastYear': {
    en: 'Complaints redressed last year',
    or: 'ଗତ ବର୍ଷ ସମାଧାନ ହୋଇଥିବା ଅଭିଯୋଗ',
  },
  'electricity.field.consumerCareCounter': {
    en: 'Consumer care counter (Yes/No)',
    or: 'କନ୍ସୁମର୍ କେୟାର କାଉଣ୍ଟର (ହଁ/ନା)',
  },
  'electricity.field.billingFacility': {
    en: 'Billing facility (Yes/No)',
    or: 'ବିଲିଂ ସୁବିଧା (ହଁ/ନା)',
  },
  'electricity.field.onlinePayment': {
    en: 'Online payment (Yes/No)',
    or: 'ଅନଲାଇନ୍ ପେମେଣ୍ଟ (ହଁ/ନା)',
  },
  'electricity.field.mobileApp': {
    en: 'Mobile app (Yes/No)',
    or: 'ମୋବାଇଲ୍ ଆପ୍ (ହଁ/ନା)',
  },
  'electricity.field.onlineComplaintPortal': {
    en: 'Online complaint portal (Yes/No)',
    or: 'ଅନଲାଇନ୍ ଅଭିଯୋଗ ପୋର୍ଟାଲ୍ (ହଁ/ନା)',
  },
  'electricity.field.customerCareEmail': {
    en: 'Customer care email',
    or: 'କଷ୍ଟମର୍ କେୟାର ଇମେଲ୍',
  },
  'electricity.field.grievanceRedressalForum': {
    en: 'Grievance redressal forum (Yes/No)',
    or: 'ଅଭିଯୋଗ ନିରାକରଣ ଫୋରମ୍ (ହଁ/ନା)',
  },
  'electricity.field.totalStaff': {
    en: 'Total staff (count)',
    or: 'ମୋଟ କର୍ମଚାରୀ (ସଂଖ୍ୟା)',
  },
  'electricity.field.engineersCountLabel': {
    en: 'Engineers (count)',
    or: 'ଇଞ୍ଜିନିୟର (ସଂଖ୍ୟା)',
  },
  'electricity.field.technicalStaffCountLabel': {
    en: 'Technical staff (count)',
    or: 'ତକନିକୀ କର୍ମଚାରୀ (ସଂଖ୍ୟା)',
  },
  'electricity.field.linemanCount': {
    en: 'Lineman (count)',
    or: 'ଲାଇନମ୍ୟାନ୍ (ସଂଖ୍ୟା)',
  },
  'electricity.field.contractStaffCount': {
    en: 'Contract staff (count)',
    or: 'ଠିକା କର୍ମଚାରୀ (ସଂଖ୍ୟା)',
  },
  'electricity.field.adminOfficeStaffCount': {
    en: 'Admin/office staff (count)',
    or: 'ପ୍ରଶାସନ / କାର୍ଯ୍ୟାଳୟ କର୍ମଚାରୀ (ସଂଖ୍ୟା)',
  },
  'electricity.field.villagesCovered': {
    en: 'Villages/localities covered (count)',
    or: 'ଆବର୍ତ୍ତନ ହୋଇଥିବା ଗ୍ରାମ/ଅଞ୍ଚଳ (ସଂଖ୍ୟା)',
  },
  'electricity.field.gpsCovered': {
    en: 'GPs covered (count)',
    or: 'ଆବର୍ତ୍ତନ ହୋଇଥିବା ଗ୍ରାମପଞ୍ଚାୟତ (ସଂଖ୍ୟା)',
  },
  'electricity.field.areaCoveredSqKm': {
    en: 'Area covered (sq. km)',
    or: 'ଆବର୍ତ୍ତନ ଅଞ୍ଚଳ (ଚ.କି.ମି.)',
  },
  'electricity.field.buildingType': {
    en: 'Building type (own/rented)',
    or: 'ଭବନ ପ୍ରକାର (ନିଜ/ଭଡା)',
  },
  'electricity.field.totalFloorsLabel': {
    en: 'Total floors',
    or: 'ମୋଟ ତଳ',
  },
  'electricity.field.officeAreaSqFt': {
    en: 'Office area (sq. ft)',
    or: 'କାର୍ଯ୍ୟାଳୟ କ୍ଷେତ୍ରଫଳ (ଚ.ଫୁଟ୍)',
  },
  'electricity.field.trainingCenter': {
    en: 'Training centre (Yes/No)',
    or: 'ପ୍ରଶିକ୍ଷଣ କେନ୍ଦ୍ର (ହଁ/ନା)',
  },
  'electricity.field.trainingCapacitySeats': {
    en: 'Training capacity (seats)',
    or: 'ପ୍ରଶିକ୍ଷଣ କ୍ଷମତା (ସୀଟ୍)',
  },
  'electricity.field.workshopGarage': {
    en: 'Workshop/garage (Yes/No)',
    or: 'ୱର୍କସପ୍ / ଗାରାଜ (ହଁ/ନା)',
  },
  'electricity.field.store': {
    en: 'Store (Yes/No)',
    or: 'ଷ୍ଟୋର୍ (ହଁ/ନା)',
  },
  'electricity.field.dgSet': {
    en: 'DG set (Yes/No)',
    or: 'DG ସେଟ୍ (ହଁ/ନା)',
  },
  'electricity.field.solar': {
    en: 'Solar (Yes/No)',
    or: 'ସୋଲାର (ହଁ/ନା)',
  },
  'electricity.field.vehiclesCountLabel': {
    en: 'Vehicles (count)',
    or: 'ଯାନବାହନ (ସଂଖ୍ୟା)',
  },
  'electricity.field.twoWheelersCount': {
    en: 'Two-wheelers (count)',
    or: 'ଦୁଇଚକିଆ ଯାନ (ସଂଖ୍ୟା)',
  },
  'electricity.field.annualRevenueCr': {
    en: 'Annual revenue (Cr, approx)',
    or: 'ବାର୍ଷିକ ଆୟ (କୋଟି, ଆନୁମାନିକ)',
  },
  'electricity.field.billingCrLastYear': {
    en: 'Billing Cr last year',
    or: 'ଗତ ବର୍ଷର ବିଲିଂ (କୋଟି)',
  },
  'electricity.field.dataAsOn': {
    en: 'Data as on (YYYY-MM-DD)',
    or: 'ତାରିଖ ଅନୁଯାୟୀ ତଥ୍ୟ (YYYY-MM-DD)',
  },
  'electricity.field.remarksDescriptionLabel': {
    en: 'Remarks / description',
    or: 'ମନ୍ତବ୍ୟ / ବିବରଣୀ',
  },
  'health.monitoring.subtitle': {
    en: 'Manage daily attendance, medicine stocks, and patient trends.',
    or: 'ଦୈନିକ ଉପସ୍ଥାନ, ଔଷଧ ଷ୍ଟକ୍ ଏବଂ ରୋଗୀଙ୍କ ସଂଖ୍ୟା ପରିଚାଳନା କରନ୍ତୁ।',
  },
  'health.monitoring.attendance.title': {
    en: 'Daily Attendance',
    or: 'ଦୈନିକ ଉପସ୍ଥାନ',
  },
  'health.monitoring.medicine.title': {
    en: 'Daily Medicine Stock',
    or: 'ଦୈନିକ ଔଷଧ ଷ୍ଟକ୍',
  },
  'health.monitoring.extra.title': {
    en: 'Daily Extra Data',
    or: 'ଦୈନିକ ଅଧିକ ତଥ୍ୟ',
  },
  'health.monitoring.patients.title': {
    en: 'Daily Patient Services',
    or: 'ଦୈନିକ ରୋଗୀ ସେବା',
  },
  'health.monitoring.attendance.count': {
    en: 'Staff present',
    or: 'ଉପସ୍ଥିତ କର୍ମଚାରୀ',
  },
  'health.monitoring.attendance.doc': {
    en: 'Doctor present',
    or: 'ଡାକ୍ତର ଉପସ୍ଥିତ',
  },
  'health.monitoring.medicine.name': {
    en: 'Medicine name',
    or: 'ଔଷଧର ନାମ',
  },
  'health.monitoring.medicine.opening': {
    en: 'Opening',
    or: 'ଆରମ୍ଭିକ',
  },
  'health.monitoring.medicine.received': {
    en: 'Received',
    or: 'ପ୍ରାପ୍ତ',
  },
  'health.monitoring.medicine.issued': {
    en: 'Issued',
    or: 'ପ୍ରଦତ୍ତ',
  },
  'health.monitoring.medicine.closing': {
    en: 'Closing',
    or: 'ଶେଷ',
  },
  'health.monitoring.extra.van': {
    en: 'Mobile van available',
    or: 'ମୋବାଇଲ୍ ଭ୍ୟାନ୍ ଉପଲବ୍ଧ',
  },
  'health.monitoring.extra.remarks': {
    en: 'Remarks',
    or: 'ମନ୍ତବ୍ୟ',
  },
  'health.monitoring.patients.opd': {
    en: 'OPD count',
    or: 'OPD ସଂଖ୍ୟା',
  },
  'health.monitoring.patients.ipd': {
    en: 'IPD count',
    or: 'IPD ସଂଖ୍ୟା',
  },
  'health.monitoring.patients.surgeries': {
    en: 'Surgeries',
    or: 'ଅସ୍ତ୍ରୋପଚାର',
  },
  'health.monitoring.patients.deliveries': {
    en: 'Deliveries',
    or: 'ପ୍ରସବ',
  },
  'health.monitoring.patients.refIn': {
    en: 'Referrals In',
    or: 'Referrals In',
  },
  'health.monitoring.patients.refOut': {
    en: 'Referrals Out',
    or: 'Referrals Out',
  },
};

export function t(key: MessageKey, language: Language): string {
  return messages[key]?.[language] ?? messages[key]?.en ?? key;
}

