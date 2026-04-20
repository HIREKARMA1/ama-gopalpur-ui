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
  | 'dept.agriculture'
  | 'dept.education'
  | 'dept.health'
  | 'dept.icds'
  | 'dept.roads'
  | 'dept.electricity'
  | 'dept.drainage'
  | 'dept.water'
  | 'dept.irrigation'
  | 'dept.minorIrrigation'
  | 'dept.revenueLand'
  | 'dept.arcs'
  | 'minor.dashboard.title'
  | 'minor.dashboard.subtitle'
  | 'minor.details.title'
  | 'minor.tab.overview'
  | 'minor.tab.technical'
  | 'minor.tab.operations'
  | 'minor.tab.finance'
  | 'minor.stat.catchment'
  | 'minor.stat.ayacut'
  | 'minor.stat.storage'
  | 'minor.map.title'
  | 'minor.map.subtitle'
  | 'minor.map.loading'
  | 'minor.field.department'
  | 'irrigation.field.blockUlb'
  | 'irrigation.field.gpWard'
  | 'irrigation.field.villageLocality'
  | 'irrigation.field.workName'
  | 'irrigation.field.category'
  | 'irrigation.field.typeOfIrrigation'
  | 'irrigation.field.managedBy'
  | 'irrigation.field.physicalCondition'
  | 'irrigation.field.functionalityStatus'
  | 'irrigation.field.yearOfCommissioning'
  | 'irrigation.field.latitude'
  | 'irrigation.field.longitude'
  | 'shell.departmentsTab'
  | 'map.legend'
  | 'map.deptInfo.open'
  | 'map.deptInfo.title'
  | 'map.deptInfo.empty'
  | 'map.deptInfo.close'
  | 'map.controls.map'
  | 'map.controls.satellite'
  | 'map.controls.fullscreen'
  | 'admin.dept.mapSummary.title'
  | 'admin.dept.mapSummary.subtitle'
  | 'admin.dept.mapSummary.label'
  | 'admin.dept.mapSummary.placeholder'
  | 'admin.dept.mapSummary.charCount'
  | 'admin.dept.mapSummary.save'
  | 'admin.dept.mapSummary.saving'
  | 'admin.dept.mapSummary.saved'
  | 'admin.dept.mapSummary.error'
  | 'map.drainage.legend.mainChannel'
  | 'map.drainage.legend.branchLink'
  | 'map.revenue.legend.tahasil'
  | 'map.viewProfile'
  | 'map.edu.primarySchool'
  | 'map.edu.upperPrimarySchool'
  | 'map.edu.highSchool'
  | 'map.edu.higherSecondary'
  | 'map.edu.seniorSecondary'
  | 'map.edu.college'
  | 'map.edu.university'
  | 'map.edu.sub.school'
  | 'map.edu.sub.ps'
  | 'map.edu.sub.ups'
  | 'map.edu.sub.hs'
  | 'map.edu.sub.hss'
  | 'map.edu.sub.sss'
  | 'map.edu.sub.other'
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
  | 'awc.snp.closingBalance'
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
  | 'agriculture.monitoring.title'
  | 'water.monitoring.title'
  | 'electricity.monitoring.title'
  | 'revenueLand.monitoring.title'
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
  | 'icds.monitoring.title'
  | 'icds.monitoring.tab.attendance'
  | 'icds.monitoring.tab.snp'
  | 'icds.monitoring.tab.inspection'
  | 'icds.monitoring.tab.nutrition'
  | 'icds.monitoring.attendance.children'
  | 'icds.monitoring.attendance.worker'
  | 'icds.monitoring.snp.opening'
  | 'icds.monitoring.snp.received'
  | 'icds.monitoring.snp.exp'
  | 'icds.monitoring.inspection.date'
  | 'icds.monitoring.inspection.repair'
  | 'icds.monitoring.inspection.notes'
  | 'icds.monitoring.nutrition.mealType'
  | 'icds.monitoring.nutrition.count'
  | 'portfolio.loadingMap'
  | 'portfolio.facilityDetails'
  | 'portfolio.facilityLocation'
  | 'portfolio.facilityLocationDesc'
  | 'portfolio.subtitleFromData'
  | 'portfolio.selectDate'
  | 'portfolio.selectMonitoringDate'
  | 'health.portfolio.title'
  | 'health.portfolio.subtitle'
  | 'health.portfolio.resources'
  | 'health.portfolio.facilityName'
  | 'health.portfolio.facilityType'
  | 'health.portfolio.id'
  | 'health.portfolio.totalStaff'
  | 'health.portfolio.mapSubtitle'
  | 'health.portfolio.dailyMonitoringSubtitle'
  | 'health.portfolio.showingRowsRange'
  | 'health.portfolio.noDailyDataYet'
  | 'health.portfolio.chart.staffAttendanceTrend'
  | 'health.portfolio.chart.opdIpdDaily'
  | 'health.portfolio.chart.medicineTotalsDaily'
  | 'health.portfolio.chart.medicineTotalsHint'
  | 'health.portfolio.chartNoSeries'
  | 'health.portfolio.tableEmptyAttendance'
  | 'health.portfolio.tableEmptyMedicine'
  | 'health.portfolio.tableEmptyPatients'
  | 'health.portfolio.noDoctorsAvailable'
  | 'health.portfolio.recordDate'
  | 'health.portfolio.monitoringLoadErrorTitle'
  | 'health.portfolio.noDailyDataAfterError'
  | 'awc.portfolio.title'
  | 'awc.portfolio.subtitle'
  | 'awc.portfolio.heroSubtitle'
  | 'awc.portfolio.centreDetailsSection'
  | 'awc.portfolio.orgNameLabel'
  | 'awc.portfolio.nameOfAwcLabel'
  | 'awc.portfolio.awcIdLabel'
  | 'awc.portfolio.buildingStatusLabel'
  | 'awc.portfolio.mapTitle'
  | 'awc.portfolio.mapSubtitle'
  | 'awc.portfolio.aboutCentre'
  | 'awc.portfolio.totalEnrollment'
  | 'awc.portfolio.children'
  | 'awc.portfolio.awwWorkerTitle'
  | 'awc.portfolio.awwWorkerSubtitle'
  | 'awc.portfolio.supervisorTitle'
  | 'awc.portfolio.supervisorSubtitle'
  | 'awc.portfolio.snpDailyStockTitle'
  | 'awc.portfolio.snpDailyStockDesc'
  | 'awc.portfolio.chart.stockTrend'
  | 'awc.portfolio.chart.receivedVsExp'
  | 'awc.portfolio.chart.opening'
  | 'awc.portfolio.chart.closing'
  | 'awc.portfolio.chart.received'
  | 'awc.portfolio.chart.expenditure'
  | 'awc.portfolio.noSnpData'
  | 'awc.portfolio.noSnpDataHint'
  | 'awc.portfolio.dailyRecords'
  | 'awc.portfolio.noSnpRows'
  | 'awc.contact.cpdoContactNo'
  | 'awc.contact.supervisorContact'
  | 'awc.contact.awwContactNo'
  | 'awc.contact.awhName'
  | 'awc.contact.awhContactNo'
  | 'awc.portfolio.showingDaysRange'
  | 'awc.portfolio.pageOf'
  | 'awc.portfolio.awwMessageHeading'
  | 'awc.portfolio.beneficiary03'
  | 'awc.portfolio.beneficiary36'
  | 'awc.portfolio.beneficiaryPregnant'
  | 'awc.portfolio.beneficiaryLactating'
  | 'awc.portfolio.beneficiaryTotal'
  | 'awc.portfolio.servicesTableTitle'
  | 'awc.portfolio.keyHighlightsTitle'
  | 'awc.portfolio.snpMonitoringTitle'
  | 'awc.portfolio.chipCentreType'
  | 'awc.portfolio.chipAwwContact'
  | 'awc.portfolio.notSpecified'
  | 'awc.portfolio.chartOpeningClosing'
  | 'awc.portfolio.chartOpeningClosingHint'
  | 'awc.portfolio.chartReceivedExpHint'
  | 'awc.portfolio.snpDaySnapshotTitle'
  | 'awc.portfolio.snpDaySnapshotHint'
  | 'awc.portfolio.noSnpRowsForDate'
  | 'water.portfolio.title'
  | 'water.portfolio.subtitle'
  | 'water.portfolio.schemeDetails'
  | 'water.tab.profile'
  | 'water.assets.waterAssets'
  | 'water.assets.generalData'
  | 'water.assets.waterQuality'
  | 'water.assets.treatmentPlant'
  | 'water.assets.pumpingPower'
  | 'water.assets.distribution'
  | 'water.assets.otherSpecs'
  | 'water.field.stationName'
  | 'water.field.stationId'
  | 'water.field.stationType'
  | 'water.field.schemeName'
  | 'water.field.populationServed'
  | 'water.field.sourceType'
  | 'water.field.sourceName'
  | 'water.overview.intakeCapacity'
  | 'water.overview.designCapacity'
  | 'water.overview.operationalCapacity'
  | 'water.overview.supplyHours'
  | 'water.overview.perCapita'
  | 'water.overview.nrw'
  | 'water.top.intakeCapacity'
  | 'water.top.designCapacity'
  | 'water.top.perCapita'
  | 'water.daily.title'
  | 'water.daily.subtitle'
  | 'water.daily.activeLeakages'
  | 'water.daily.leakagesCountLine'
  | 'water.daily.leakagesNone'
  | 'water.daily.productionVsSupply'
  | 'water.daily.volumeMld15'
  | 'water.daily.legend.produced'
  | 'water.daily.legend.supplied'
  | 'water.daily.pumpHours'
  | 'water.daily.pumpHoursSubtitle'
  | 'water.daily.tankLevelsTitle'
  | 'water.daily.tankLevelsForDate'
  | 'water.daily.tankName'
  | 'water.daily.openingMl'
  | 'water.daily.intakeMl'
  | 'water.daily.distributedMl'
  | 'water.daily.closingMl'
  | 'water.daily.noTankData'
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
  | 'edu.stat.highestSalaryMonthly'
  | 'edu.portfolio.institutionName'
  | 'edu.portfolio.institutionType'
  | 'edu.portfolio.id'
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
  | 'roads.type.nh'
  | 'roads.type.pwd'
  | 'roads.type.rd'
  | 'roads.type.other'
  | 'watco.type.megaEsr'
  | 'watco.type.existingEsr'
  | 'watco.type.ibpsPumpHouse'
  | 'watco.type.intakeWell'
  | 'watco.type.productionWell'
  | 'watco.legend.esr'
  | 'watco.legend.svs'
  | 'watco.legend.gsr'
  | 'watco.legend.pumpHouse'
  | 'irrigation.category.tank'
  | 'irrigation.category.checkDam'
  | 'irrigation.category.anicut'
  | 'irrigation.category.canal'
  | 'irrigation.category.flowMip'
  | 'map.info.sector'
  | 'map.info.gp'
  | 'map.info.block'
  | 'map.electricity.office'
  | 'electricity.type.govt'
  | 'electricity.type.pvt'
  | 'map.arcs.society'
  | 'arcs.type.rural'
  | 'arcs.type.urban'
  | 'arcs.type.mixed'
  | 'arcs.dashboard.title'
  | 'arcs.dashboard.subtitle'
  | 'arcs.details.title'
  | 'arcs.tab.overview'
  | 'arcs.stat.registration'
  | 'arcs.stat.jurisdiction'
  | 'arcs.stat.members'
  | 'arcs.stat.status'
  | 'arcs.field.societyName'
  | 'arcs.field.blockUlb'
  | 'arcs.field.registration'
  | 'arcs.field.establishedYear'
  | 'arcs.field.secretary'
  | 'arcs.field.phone'
  | 'arcs.field.email'
  | 'arcs.field.areaOperation'
  | 'arcs.map.title'
  | 'arcs.map.subtitle'
  | 'arcs.map.loading'
  | 'arcs.group.societyIdentity'
  | 'arcs.group.locationContact'
  | 'arcs.group.governanceCompliance'
  | 'arcs.group.membership'
  | 'arcs.group.digitization'
  | 'arcs.fieldLabel.jurisdictionType'
  | 'arcs.field.state'
  | 'arcs.field.district'
  | 'arcs.fieldLabel.fullAddress'
  | 'arcs.fieldLabel.pinCode'
  | 'arcs.fieldLabel.latitude'
  | 'arcs.fieldLabel.longitude'
  | 'arcs.fieldLabel.secretaryName'
  | 'arcs.fieldLabel.functioningOrNot'
  | 'arcs.fieldLabel.auditCompletedLastFy'
  | 'arcs.fieldLabel.electionsConductedLastFy'
  | 'arcs.fieldLabel.inspectorsExtensionOfficers'
  | 'arcs.fieldLabel.totalMembership'
  | 'arcs.fieldLabel.membershipSc'
  | 'arcs.fieldLabel.membershipSt'
  | 'arcs.fieldLabel.membershipObc'
  | 'arcs.fieldLabel.membershipGen'
  | 'arcs.fieldLabel.membershipWomen'
  | 'arcs.fieldLabel.computerizationStatus'
  | 'arcs.fieldLabel.onlineRegistrationFacility'
  | 'arcs.fieldLabel.digitizedRecords'
  | 'arcs.fieldLabel.fileTrackingSystem'
  | 'revenue.type.govt'
  | 'revenue.type.private'
  | 'revenue.type.other'
  | 'agriculture.type.serviceCenter'
  | 'agriculture.type.extensionCenter'
  | 'agriculture.type.agrilFarmersEmpowerment'
  | 'agriculture.type.odishaStateSeedCorporation';

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
  'dept.agriculture': {
    en: 'Agriculture',
    or: 'କୃଷି',
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
    or: 'ସମନ୍ୱିତ ଶିଶୁ ବିକାଶ ସେବା',
  },
  'dept.roads': {
    en: 'Roads',
    or: 'ରାସ୍ତାଘାଟ',
  },
  'dept.electricity': {
    en: 'Electricity',
    or: 'ବିଦ୍ୟୁତ',
  },
  'dept.irrigation': {
    en: 'Irrigation',
    or: 'ଜଳସେଚନ',
  },
  'dept.minorIrrigation': {
    en: 'Minor Irrigation',
    or: 'କ୍ଷୁଦ୍ର ଜଳସେଚନ',
  },
  'dept.drainage': {
    en: 'Drainage',
    or: 'ନିସ୍କାଷଣ',
  },
  'dept.water': {
    en: 'WATCO/RWSS',
    or: 'ଜଳ ଯୋଗାଣ ଓ ପରିମଳ',
  },
  'dept.revenueLand': {
    en: 'Revenue Govt Land',
    or: 'ରାଜସ୍ୱ ଓ ସରକାରୀ ଜମି',
  },
  'dept.arcs': {
    en: 'ARCS',
    or: 'ସମବାୟ',
  },
  'minor.dashboard.title': {
    en: 'Minor Irrigation Portfolio Dashboard',
    or: 'କ୍ଷୁଦ୍ର ଜଳସେଚନ ପୋର୍ଟଫୋଲିଓ ଡ୍ୟାସବୋର୍ଡ',
  },
  'minor.dashboard.subtitle': {
    en: 'Project details from minister CSV data',
    or: 'ମନ୍ତ୍ରୀଙ୍କ CSV ତଥ୍ୟରୁ ପ୍ରକଳ୍ପ ବିବରଣୀ',
  },
  'minor.details.title': {
    en: 'Project details',
    or: 'ପ୍ରକଳ୍ପ ବିବରଣୀ',
  },
  'minor.tab.overview': { en: 'Overview', or: 'ସାରାଂଶ' },
  'minor.tab.technical': { en: 'Technical', or: 'ପ୍ରାଯୁକ୍ତିକ' },
  'minor.tab.operations': { en: 'Operations', or: 'ପରିଚାଳନା' },
  'minor.tab.finance': { en: 'Finance', or: 'ଆର୍ଥିକ' },
  'minor.stat.catchment': { en: 'Catchment (sq km)', or: 'କ୍ୟାଚମେଣ୍ଟ (ଚ.କି.ମି.)' },
  'minor.stat.ayacut': { en: 'Total ayacut (acres)', or: 'ମୋଟ ଆୟାକଟ୍ (ଏକର)' },
  'minor.stat.storage': { en: 'Storage (MCUM)', or: 'ସଂରକ୍ଷଣ (MCUM)' },
  'minor.map.title': { en: 'Project Location', or: 'ପ୍ରକଳ୍ପ ଅବସ୍ଥିତି' },
  'minor.map.subtitle': { en: 'Minor irrigation project location on map.', or: 'ମାନଚିତ୍ରରେ କ୍ଷୁଦ୍ର ଜଳସେଚନ ପ୍ରକଳ୍ପର ସ୍ଥାନ।' },
  'minor.map.loading': { en: 'Loading map…', or: 'ମାନଚିତ୍ର ଲୋଡ୍ ହେଉଛି…' },
  'minor.field.department': { en: 'Department', or: 'ବିଭାଗ' },
  'irrigation.field.blockUlb': { en: 'Block / ULB', or: 'ବ୍ଲକ୍ / ULB' },
  'irrigation.field.gpWard': { en: 'GP / Ward', or: 'ଜି.ପି. / ୱାର୍ଡ' },
  'irrigation.field.villageLocality': { en: 'Village / Locality', or: 'ଗ୍ରାମ / ଅଞ୍ଚଳ' },
  'irrigation.field.workName': { en: 'Work name', or: 'କାର୍ଯ୍ୟର ନାମ' },
  'irrigation.field.category': { en: 'Category', or: 'ଶ୍ରେଣୀ' },
  'irrigation.field.typeOfIrrigation': { en: 'Type of irrigation', or: 'ସେଚନ ପ୍ରକାର' },
  'irrigation.field.managedBy': { en: 'Managed by', or: 'ପରିଚାଳନା କରୁଥିବା' },
  'irrigation.field.physicalCondition': { en: 'Physical condition', or: 'ଭୂତଳ ଅବସ୍ଥା' },
  'irrigation.field.functionalityStatus': { en: 'Functionality status', or: 'କାର୍ଯ୍ୟକ୍ଷମତା ସ୍ଥିତି' },
  'irrigation.field.yearOfCommissioning': { en: 'Year of commissioning', or: 'ଚାଲୁ ହେବାର ବର୍ଷ' },
  'irrigation.field.latitude': { en: 'Latitude', or: 'ଅକ୍ଷାଂଶ' },
  'irrigation.field.longitude': { en: 'Longitude', or: 'ଦ୍ରାଘିମାଂଶ' },
  'map.legend': {
    en: 'Legend',
    or: 'ସୂଚନା',
  },
  'map.deptInfo.open': {
    en: 'About this department',
    or: 'ଏହି ବିଭାଗ ବିଷୟରେ',
  },
  'map.deptInfo.title': {
    en: 'Department summary',
    or: 'ବିଭାଗ ସାରାଂଶ',
  },
  'map.deptInfo.empty': {
    en: 'No summary has been added for this department yet.',
    or: 'ଏହି ବିଭାଗ ପାଇଁ ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ସାରାଂଶ ଯୋଡ଼ା ଯାଇ ନାହିଁ ।',
  },
  'map.deptInfo.close': {
    en: 'Close',
    or: 'ବନ୍ଦ କରନ୍ତୁ',
  },
  'map.controls.map': {
    en: 'Map',
    or: 'ମାନଚିତ୍ର',
  },
  'map.controls.satellite': {
    en: 'Satellite',
    or: 'ଉପଗ୍ରହ',
  },
  'map.controls.fullscreen': {
    en: 'Full screen',
    or: 'ପୂର୍ଣ୍ଣ ପରଦା',
  },
  'admin.dept.mapSummary.title': {
    en: 'Constituency map summary',
    or: 'ନିର୍ବାଚନ ମଣ୍ଡଳୀ ମାନଚିତ୍ର ସାରାଂଶ',
  },
  'admin.dept.mapSummary.subtitle': {
    en: 'Short text shown to citizens when they tap the information button on the public map (max {max} characters).',
    or: 'ସର୍ବସାଧାରଣ ମାନଚିତ୍ରରେ ସୂଚନା ବଟନ୍ ଦବାଇଲେ ଦେଖାଯିବ — ସଂକ୍ଷିପ୍ତ ବିବରଣୀ (ସର୍ବାଧିକ {max} ଅକ୍ଷର) ।',
  },
  'admin.dept.mapSummary.label': {
    en: 'Summary for map',
    or: 'ମାନଚିତ୍ର ପାଇଁ ସାରାଂଶ',
  },
  'admin.dept.mapSummary.placeholder': {
    en: 'Describe what this department layer shows on the map…',
    or: 'ଏହି ବିଭାଗର ମାନଚିତ୍ରରେ କଣ ଦେଖାଯାଏ ତାର ବର୍ଣ୍ଣନା ଲେଖନ୍ତୁ…',
  },
  'admin.dept.mapSummary.charCount': {
    en: '{used} / {max} characters',
    or: '{used} / {max} ଅକ୍ଷର',
  },
  'admin.dept.mapSummary.save': {
    en: 'Save summary',
    or: 'ସାରାଂଶ ସଂରକ୍ଷଣ',
  },
  'admin.dept.mapSummary.saving': {
    en: 'Saving…',
    or: 'ସଂରକ୍ଷଣ ହେଉଛି…',
  },
  'admin.dept.mapSummary.saved': {
    en: 'Saved',
    or: 'ସଂରକ୍ଷିତ',
  },
  'admin.dept.mapSummary.error': {
    en: 'Could not save. Try again.',
    or: 'ସଂରକ୍ଷଣ ହେଲା ନାହିଁ । ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ ।',
  },
  'map.drainage.legend.mainChannel': {
    en: 'Main drain / nalla',
    or: 'ମୁଖ୍ୟ ଡ୍ରେନ୍ / ନଳା',
  },
  'map.drainage.legend.branchLink': {
    en: 'Branch / link',
    or: 'ଶାଖା / ଲିଙ୍କ୍',
  },
  'map.revenue.legend.tahasil': {
    en: 'Tahasil office',
    or: 'ତହସିଲ କାର୍ଯ୍ୟାଳୟ',
  },
  'map.viewProfile': {
    en: 'View profile',
    or: 'ପ୍ରୋଫାଇଲ୍ ଦେଖନ୍ତୁ',
  },
  'map.edu.primarySchool': { en: 'Primary School', or: 'ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ' },
  'map.edu.upperPrimarySchool': { en: 'Upper Primary School', or: 'ଉଚ୍ଚ ପ୍ରାଥମିକ ବିଦ୍ୟାଳୟ' },
  'map.edu.highSchool': { en: 'High School', or: 'ହାଇସ୍କୁଲ୍' },
  'map.edu.higherSecondary': { en: 'Higher Secondary', or: 'ଉଚ୍ଚ ମାଧ୍ୟମିକ' },
  'map.edu.seniorSecondary': { en: 'Senior Secondary', or: 'ସିନିଅର ସେକେଣ୍ଡାରୀ' },
  'map.edu.college': { en: 'College', or: 'ମହାବିଦ୍ୟାଳୟ' },
  'map.edu.university': { en: 'University', or: 'ବିଶ୍ୱବିଦ୍ୟାଳୟ' },
  'map.edu.sub.school': { en: 'School', or: 'ବିଦ୍ୟାଳୟ' },
  'map.edu.sub.ps': { en: 'PS', or: 'ପି.ଏସ୍.' },
  'map.edu.sub.ups': { en: 'UPS', or: 'ୟୁ.ପି.ଏସ୍.' },
  'map.edu.sub.hs': { en: 'HS', or: 'ଏଚ୍.ଏସ୍.' },
  'map.edu.sub.hss': { en: 'HSS', or: 'ଏଚ୍.ଏସ୍.ଏସ୍.' },
  'map.edu.sub.sss': { en: 'SSS', or: 'ଏସ୍.ଏସ୍.ଏସ୍.' },
  'map.edu.sub.other': { en: 'Other', or: 'ଅନ୍ୟ' },
  'map.edu.sub.engineeringCollege': { en: 'Engineering College', or: 'ଇଞ୍ଜିନିୟରିଂ କଲେଜ' },
  'map.edu.sub.iti': { en: 'ITI', or: 'ଆଇ.ଟି.ଆଇ.' },
  'map.edu.sub.university': { en: 'University', or: 'ବିଶ୍ୱବିଦ୍ୟାଳୟ' },
  'map.edu.sub.diplomaCollege': { en: 'Diploma College', or: 'ଡିପ୍ଲୋମା କଲେଜ' },
  'map.health.hospital': { en: 'Hospital', or: 'ଡାକ୍ତରଖାନା' },
  'map.health.chc': { en: 'CHC', or: 'ଗୋଷ୍ଠୀ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର' },
  'map.health.phc': { en: 'PHC', or: 'ପ୍ରାଥମିକ ସ୍ୱାସ୍ଥ୍ୟ କେନ୍ଦ୍ର' },
  'map.health.sc': { en: 'SC', or: 'ସବ୍-ସେଣ୍ଟର' },
  'map.health.uaam': { en: 'UAAM', or: 'ୟୁଏଏଏମ୍' },
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
  'awc.snp.closingBalance': {
    en: 'Closing balance',
    or: 'ଶେଷ ବାକି',
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
  'edu.stat.highestSalaryMonthly': { en: 'Highest Salary (Monthly)', or: 'ସର୍ବାଧିକ ଦରମା (ମାସିକ)' },
  'edu.portfolio.institutionName': { en: 'Institution Name', or: 'ଅନୁଷ୍ଠାନର ନାମ' },
  'edu.portfolio.institutionType': { en: 'Institution Type', or: 'ଅନୁଷ୍ଠାନ ପ୍ରକାର' },
  'edu.portfolio.id': { en: 'ID', or: 'ଆଇଡି' },
  'edu.location.title': { en: 'Institution Location', or: 'ଅନୁଷ୍ଠାନର ଅବସ୍ଥିତି' },
  'edu.location.subtitle': { en: 'Geographic coordinates and mapping details', or: 'ଭୌଗୋଳିକ ସଂଯୋଜକ ଏବଂ ମାନଚିତ୍ର ବିବରଣୀ' },
  'edu.details.title': { en: 'Institution Details', or: 'ଅନୁଷ୍ଠାନର ବିବରଣୀ' },
  'map.search.placeholder': { en: 'Search {dept}…', or: '{dept} ସନ୍ଧାନ କରନ୍ତୁ…' },
  'map.search.noResults': { en: 'No locations match your search yet.', or: 'ଆପଣଙ୍କ ସନ୍ଧାନ ସହିତ କୌଣସି ସ୍ଥାନ ମେଳ ଖାଉ ନାହିଁ' },
  'map.search.submit': { en: 'Search', or: 'ସନ୍ଧାନ' },
  'map.legend.showAll': { en: 'Show all', or: 'ସବୁ ଦେଖାନ୍ତୁ' },
  'map.legend.showOnly': { en: 'Show only', or: 'କେବଳ ଦେଖାନ୍ତୁ' },
  'roads.type.nh': { en: 'National Highway', or: 'ଜାତୀୟ ରାଜପଥ' },
  'roads.type.pwd': { en: 'PWD / R&B', or: 'PWD / R&B' },
  'roads.type.rd': { en: 'Rural / Village Road', or: 'ଗ୍ରାମୀଣ / ଗାଁ ରାସ୍ତାଘାଟ' },
  'roads.type.other': { en: 'Other', or: 'ଅନ୍ୟ' },
  'watco.type.megaEsr': { en: 'MEGA ESR', or: 'ମେଗା ESR' },
  'watco.type.existingEsr': { en: 'EXISTING ESR', or: 'ବିଦ୍ୟମାନ ESR' },
  'watco.type.ibpsPumpHouse': { en: 'IBPS PUMP HOUSE', or: 'IBPS ପମ୍ପ ହାଉସ୍' },
  'watco.type.intakeWell': { en: 'INTAKE WELL', or: 'ଇଣ୍ଟେକ୍ ୱେଲ୍' },
  'watco.type.productionWell': { en: 'PRODUCTION WELL', or: 'ପ୍ରଡକ୍ସନ୍ ୱେଲ୍' },
  'watco.legend.esr': { en: 'ESR', or: 'ଇ.ଏସ.ଆର୍' },
  'watco.legend.svs': { en: 'SVS', or: 'ଏସ୍.ଭି.ଏସ୍' },
  'watco.legend.gsr': { en: 'GSR', or: 'ଜି.ଏସ.ଆର୍' },
  'watco.legend.pumpHouse': { en: 'PUMP HOUSE', or: 'ପମ୍ପ ହାଉସ୍' },
  'irrigation.category.tank': { en: 'Tank', or: 'ଟ୍ୟାଙ୍କ' },
  'irrigation.category.checkDam': { en: 'Check Dam', or: 'ଚେକ୍ ଡ୍ୟାମ୍' },
  'irrigation.category.anicut': { en: 'Anicut', or: 'ଆନିକଟ୍' },
  'irrigation.category.canal': { en: 'Canal', or: 'କ୍ୟାନାଲ୍' },
  'irrigation.category.flowMip': {
    en: 'Flow MIP',
    or: 'ଫ୍ଲୋ ଏମ.ଆଇ.ପି. (ପ୍ରବାହ କ୍ଷୁଦ୍ର ଜଳସେଚନ)',
  },
  'map.info.sector': { en: 'Sector', or: 'ସେକ୍ଟର' },
  'map.info.gp': { en: 'GP', or: 'ଜି.ପି.' },
  'map.info.block': { en: 'Block', or: 'ବ୍ଲକ' },
  'map.electricity.office': { en: 'Electricity Office', or: 'ବିଦ୍ୟୁତ କାର୍ଯ୍ୟାଳୟ' },
  'electricity.type.govt': {
    en: 'Govt',
    or: 'ସରକାରୀ',
  },
  'electricity.type.pvt': {
    en: 'Pvt',
    or: 'ବେସରକାରୀ',
  },
  'map.arcs.society': {
    en: 'Cooperative society',
    or: 'ସମବାୟ',
  },
  'arcs.type.rural': { en: 'Rural', or: 'ଗ୍ରାମୀଣ' },
  'arcs.type.urban': { en: 'Urban', or: 'ସହରୀ' },
  'arcs.type.mixed': { en: 'Mixed', or: 'ମିଶ୍ରିତ' },
  'arcs.dashboard.title': {
    en: 'Cooperative Society Portfolio',
    or: 'ସମବାୟ ପୋର୍ଟଫୋଲିଓ',
  },
  'arcs.dashboard.subtitle': {
    en: 'Registration, membership and digitization metrics from ARCS records.',
    or: 'ARCS ରେକର୍ଡରୁ ପଞ୍ଜୀକରଣ, ସଦସ୍ୟତା ଓ ଡିଜିଟାଇଜେସନ ତଥ୍ୟ।',
  },
  'arcs.details.title': { en: 'Society details', or: 'ସମିତି ବିବରଣୀ' },
  'arcs.tab.overview': { en: 'Overview', or: 'ସାରାଂଶ' },
  'arcs.stat.registration': { en: 'Registration no.', or: 'ପଞ୍ଜୀକରଣ ନଂ.' },
  'arcs.stat.jurisdiction': { en: 'Jurisdiction', or: 'କ୍ଷେତ୍ର' },
  'arcs.stat.members': { en: 'Total members', or: 'ମୋଟ ସଦସ୍ୟ' },
  'arcs.stat.status': { en: 'Functioning', or: 'କାର୍ଯ୍ୟକ୍ଷମ' },
  'arcs.field.societyName': { en: 'Society name', or: 'ସମିତି ନାମ' },
  'arcs.field.blockUlb': { en: 'Block / ULB', or: 'ବ୍ଲକ୍ / ULB' },
  'arcs.field.registration': { en: 'Registration number', or: 'ପଞ୍ଜୀକରଣ ନମ୍ବର' },
  'arcs.field.establishedYear': { en: 'Established year', or: 'ପ୍ରତିଷ୍ଠା ବର୍ଷ' },
  'arcs.field.secretary': { en: 'Secretary', or: 'ସଚିବ' },
  'arcs.field.phone': { en: 'Office phone', or: 'କାର୍ଯ୍ୟାଳୟ ଫୋନ' },
  'arcs.field.email': { en: 'Office email', or: 'ଇମେଲ' },
  'arcs.field.areaOperation': { en: 'Area of operation', or: 'କାର୍ଯ୍ୟ କେନ୍ଦ୍ର' },
  'arcs.map.title': { en: 'Registered location', or: 'ପଞ୍ଜୀକୃତ ସ୍ଥାନ' },
  'arcs.map.subtitle': { en: 'Geotagged coordinates for this society.', or: 'ଏହି ସମିତିର ଅବସ୍ଥାନ।' },
  'arcs.map.loading': { en: 'Loading map…', or: 'ମାନଚିତ୍ର ଲୋଡ୍…' },
  'arcs.group.societyIdentity': { en: 'Society identity', or: 'ସମିତି ପରିଚୟ' },
  'arcs.group.locationContact': { en: 'Location & contact', or: 'ଅବସ୍ଥାନ ଓ ଯୋଗାଯୋଗ' },
  'arcs.group.governanceCompliance': { en: 'Governance & compliance', or: 'ଶାସନ ଓ ଅନୁପାଲନ' },
  'arcs.group.membership': { en: 'Membership', or: 'ସଦସ୍ୟତା' },
  'arcs.group.digitization': { en: 'Digitization', or: 'ଡିଜିଟାଇଜେସନ' },
  'arcs.fieldLabel.jurisdictionType': {
    en: 'Jurisdiction type (rural/urban/mixed)',
    or: 'କ୍ଷେତ୍ର ପ୍ରକାର (ଗ୍ରାମୀଣ/ସହରୀ/ମିଶ୍ରିତ)',
  },
  'arcs.field.state': { en: 'State', or: 'ରାଜ୍ୟ' },
  'arcs.field.district': { en: 'District', or: 'ଜିଲ୍ଲା' },
  'arcs.fieldLabel.fullAddress': { en: 'Full address', or: 'ପୂର୍ଣ୍ଣ ଠିକଣା' },
  'arcs.fieldLabel.pinCode': { en: 'PIN code', or: 'ପିନ୍ କୋଡ୍' },
  'arcs.fieldLabel.latitude': { en: 'Latitude', or: 'ଅକ୍ଷାଂଶ' },
  'arcs.fieldLabel.longitude': { en: 'Longitude', or: 'ଦ୍ରାଘିମା' },
  'arcs.fieldLabel.secretaryName': { en: 'Secretary name', or: 'ସଚିବଙ୍କ ନାମ' },
  'arcs.fieldLabel.functioningOrNot': { en: 'Functioning or not', or: 'ଚାଲୁ ଅଛି କି ନାହିଁ' },
  'arcs.fieldLabel.auditCompletedLastFy': {
    en: 'Audit completed (last FY)',
    or: 'ଅଡିଟ ସମାପ୍ତ (ଗତ ଆର୍ଥିକ ବର୍ଷ)',
  },
  'arcs.fieldLabel.electionsConductedLastFy': {
    en: 'Elections conducted (last FY)',
    or: 'ନିର୍ବାଚନ ଅନୁଷ୍ଠିତ (ଗତ ଆର୍ଥିକ ବର୍ଷ)',
  },
  'arcs.fieldLabel.inspectorsExtensionOfficers': {
    en: 'Inspectors / extension officers (count)',
    or: 'ଇନସ୍ପେକ୍ଟର / ବିସ୍ତାର ଅଧିକାରୀ (ସଂଖ୍ୟା)',
  },
  'arcs.fieldLabel.totalMembership': { en: 'Total membership', or: 'ମୋଟ ସଦସ୍ୟତା' },
  'arcs.fieldLabel.membershipSc': { en: 'Membership (SC)', or: 'ସଦସ୍ୟ (SC)' },
  'arcs.fieldLabel.membershipSt': { en: 'Membership (ST)', or: 'ସଦସ୍ୟ (ST)' },
  'arcs.fieldLabel.membershipObc': { en: 'Membership (OBC)', or: 'ସଦସ୍ୟ (OBC)' },
  'arcs.fieldLabel.membershipGen': { en: 'Membership (General)', or: 'ସଦସ୍ୟ (ସାଧାରଣ)' },
  'arcs.fieldLabel.membershipWomen': { en: 'Membership (women)', or: 'ସଦସ୍ୟ (ମହିଳା)' },
  'arcs.fieldLabel.computerizationStatus': {
    en: 'Computerization status (yes/no)',
    or: 'କମ୍ପ୍ୟୁଟରାଇଜେସନ ସ୍ଥିତି (ହଁ/ନା)',
  },
  'arcs.fieldLabel.onlineRegistrationFacility': {
    en: 'Online registration facility (yes/no)',
    or: 'ଅନଲାଇନ ପଞ୍ଜୀକରଣ (ହଁ/ନା)',
  },
  'arcs.fieldLabel.digitizedRecords': {
    en: 'Digitized records (yes/no)',
    or: 'ଡିଜିଟାଲ ରେକର୍ଡ (ହଁ/ନା)',
  },
  'arcs.fieldLabel.fileTrackingSystem': {
    en: 'File tracking system (yes/no)',
    or: 'ଫାଇଲ ଟ୍ରାକିଂ ବ୍ୟବସ୍ଥା (ହଁ/ନା)',
  },
  'revenue.type.govt': {
    en: 'Govt land',
    or: 'ସରକାରୀ ଜମି',
  },
  'revenue.type.private': {
    en: 'Private land',
    or: 'ବେସରକାରୀ ଜମି',
  },
  'revenue.type.other': {
    en: 'Other land',
    or: 'ଅନ୍ୟାନ୍ୟ ଜମି',
  },
  'agriculture.type.serviceCenter': {
    en: 'Agriculture Service Center',
    or: 'କୃଷି ସେବା କେନ୍ଦ୍ର',
  },
  'agriculture.type.extensionCenter': {
    en: 'Agriculture Extension Center',
    or: 'କୃଷି ବିସ୍ତାର କେନ୍ଦ୍ର',
  },
  'agriculture.type.agrilFarmersEmpowerment': {
    en: 'Agril. & Farmers Empowerment',
    or: 'କୃଷି ଏବଂ କୃଷକ ସଶକ୍ତିକରଣ',
  },
  'agriculture.type.odishaStateSeedCorporation': {
    en: 'Odisha State Seed Corporation',
    or: 'ଓଡ଼ିଶା ରାଜ୍ୟ ବିହନ ନିଗମ',
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
  'health.monitoring.title': {
    en: 'Daily Health Monitoring',
    or: 'ଦୈନିକ ସ୍ୱାସ୍ଥ୍ୟ ଅନୁମାନ',
  },
  'agriculture.monitoring.title': {
    en: 'Agriculture Monitoring',
    or: 'କୃଷି ନିରୀକ୍ଷଣ',
  },
  'water.monitoring.title': {
    en: 'Daily Water Monitoring Data',
    or: 'ଦୈନିକ ଜଳ ଯୋଗାଣ ଓ ପରିମଳ ତଥ୍ୟ',
  },
  'electricity.monitoring.title': {
    en: 'Electricity Operations Monitoring',
    or: 'ବିଦ୍ୟୁତ ସେବା ନିରୀକ୍ଷଣ',
  },
  'revenueLand.monitoring.title': {
    en: 'Land Parcel Monitoring',
    or: 'ଜମି ପାର୍ସେଲ ମନିଟରିଂ',
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
  'icds.monitoring.title': {
    en: 'ICDS daily monitoring',
    or: 'ICDS daily monitoring',
  },
  'icds.monitoring.tab.attendance': {
    en: 'Attendance',
    or: 'Attendance',
  },
  'icds.monitoring.tab.snp': {
    en: 'SNP stock',
    or: 'SNP stock',
  },
  'icds.monitoring.tab.inspection': {
    en: 'Inspection',
    or: 'Inspection',
  },
  'icds.monitoring.tab.nutrition': {
    en: 'Nutrition served',
    or: 'Nutrition served',
  },
  'icds.monitoring.attendance.children': {
    en: 'Children present',
    or: 'Children present',
  },
  'icds.monitoring.attendance.worker': {
    en: 'Worker present',
    or: 'Worker present',
  },
  'icds.monitoring.snp.opening': {
    en: 'Opening balance (kg)',
    or: 'Opening balance (kg)',
  },
  'icds.monitoring.snp.received': {
    en: 'Received (kg)',
    or: 'Received (kg)',
  },
  'icds.monitoring.snp.exp': {
    en: 'Expended (kg)',
    or: 'Expended (kg)',
  },
  'icds.monitoring.inspection.date': {
    en: 'Inspection date',
    or: 'Inspection date',
  },
  'icds.monitoring.inspection.repair': {
    en: 'Repair required',
    or: 'Repair required',
  },
  'icds.monitoring.inspection.notes': {
    en: 'Notes',
    or: 'Notes',
  },
  'icds.monitoring.nutrition.mealType': {
    en: 'Meal type',
    or: 'Meal type',
  },
  'icds.monitoring.nutrition.count': {
    en: 'Count served',
    or: 'Count served',
  },
  'portfolio.loadingMap': {
    en: 'Loading map…',
    or: 'ମାନଚିତ୍ର ଲୋଡ୍ ହେଉଛି…',
  },
  'portfolio.facilityDetails': {
    en: 'Facility details',
    or: 'ସୁବିଧା ବିବରଣୀ',
  },
  'portfolio.facilityLocation': {
    en: 'Facility Location',
    or: 'ସୁବିଧା ଅବସ୍ଥିତି',
  },
  'portfolio.facilityLocationDesc': {
    en: 'Facility location on map.',
    or: 'ମାନଚିତ୍ରରେ ସୁବିଧା ଅବସ୍ଥିତି।',
  },
  'portfolio.subtitleFromData': {
    en: 'Facility details and resources from available data',
    or: 'ଉପଲବ୍ଧ ତଥ୍ୟରୁ ସୁବିଧା ବିବରଣୀ ଓ ସମ୍ପତ୍ତି',
  },
  'portfolio.selectDate': {
    en: 'Select date',
    or: 'ତାରିଖ ବାଛନ୍ତୁ',
  },
  'portfolio.selectMonitoringDate': {
    en: 'Select Monitoring Date',
    or: 'ନିରୀକ୍ଷଣ ତାରିଖ ବାଛନ୍ତୁ',
  },
  'health.portfolio.title': {
    en: 'Health Facility Dashboard',
    or: 'ସ୍ୱାସ୍ଥ୍ୟ ସୁବିଧା ଡ୍ୟାସବୋର୍ଡ',
  },
  'health.portfolio.subtitle': {
    en: 'Facility details and resources from available data',
    or: 'ଉପଲବ୍ଧ ତଥ୍ୟରୁ ସୁବିଧା ବିବରଣୀ ଓ ସମ୍ପତ୍ତି',
  },
  'health.portfolio.resources': {
    en: 'Resources',
    or: 'ସମ୍ପତ୍ତି',
  },
  'health.portfolio.facilityName': {
    en: 'Facility Name',
    or: 'ସୁବିଧା ନାମ',
  },
  'health.portfolio.facilityType': {
    en: 'Facility Type',
    or: 'ସୁବିଧା ପ୍ରକାର',
  },
  'health.portfolio.id': {
    en: 'ID',
    or: 'ଆଇଡି',
  },
  'health.portfolio.totalStaff': {
    en: 'Total staff',
    or: 'ମୋଟ କର୍ମଚାରୀ',
  },
  'health.portfolio.mapSubtitle': {
    en: 'Health facility location on map.',
    or: 'ମାନଚିତ୍ରରେ ସ୍ୱାସ୍ଥ୍ୟ ସୁବିଧା ଅବସ୍ଥିତି।',
  },
  'health.portfolio.dailyMonitoringSubtitle': {
    en: 'Daily tracking of medicine inventory, attendance and patient traffic.',
    or: 'ଔଷଧ ଭଣ୍ଡାର, ଉପସ୍ଥିତି ଓ ରୋଗୀ ଚାପର ଦୈନିକ ଅନୁଧ୍ୟାନ।',
  },
  'health.portfolio.showingRowsRange': {
    en: 'Showing {start}–{end} of {total} records',
    or: 'Showing {start}–{end} of {total} records',
  },
  'health.portfolio.noDailyDataYet': {
    en: 'No daily monitoring records for this facility yet. In dept admin, open Daily Health Monitoring, select this same facility from the list, then add attendance, medicine, patients, or extra data — it will show here for the public.',
    or: 'No daily monitoring records for this facility yet. In dept admin, open Daily Health Monitoring, select this same facility from the list, then add attendance, medicine, patients, or extra data — it will show here for the public.',
  },
  'health.portfolio.monitoringLoadErrorTitle': {
    en: 'Could not load monitoring data from the server',
    or: 'Could not load monitoring data from the server',
  },
  'health.portfolio.noDailyDataAfterError': {
    en: 'Fix the issue above (often API URL, network, or server errors), then refresh. If the problem persists, check the browser Network tab for /api/v1/health/organizations/… requests.',
    or: 'Fix the issue above (often API URL, network, or server errors), then refresh. If the problem persists, check the browser Network tab for /api/v1/health/organizations/… requests.',
  },
  'health.portfolio.chart.staffAttendanceTrend': {
    en: 'Staff present (daily)',
    or: 'Staff present (daily)',
  },
  'health.portfolio.chart.opdIpdDaily': {
    en: 'OPD vs IPD (daily)',
    or: 'OPD vs IPD (daily)',
  },
  'health.portfolio.chart.medicineTotalsDaily': {
    en: 'Medicine received vs issued (daily totals)',
    or: 'Medicine received vs issued (daily totals)',
  },
  'health.portfolio.chart.medicineTotalsHint': {
    en: 'Totals sum all medicine rows recorded for each day.',
    or: 'Totals sum all medicine rows recorded for each day.',
  },
  'health.portfolio.chartNoSeries': {
    en: 'No data for this chart in the loaded history.',
    or: 'No data for this chart in the loaded history.',
  },
  'health.portfolio.tableEmptyAttendance': {
    en: 'No attendance rows in the loaded history.',
    or: 'No attendance rows in the loaded history.',
  },
  'health.portfolio.tableEmptyMedicine': {
    en: 'No medicine stock rows in the loaded history.',
    or: 'No medicine stock rows in the loaded history.',
  },
  'health.portfolio.tableEmptyPatients': {
    en: 'No patient service rows in the loaded history.',
    or: 'No patient service rows in the loaded history.',
  },
  'health.portfolio.noDoctorsAvailable': {
    en: 'No doctors available.',
    or: 'କୌଣସି ଡାକ୍ତର ଉପଲବ୍ଧ ନାହାଁନ୍ତି।',
  },
  'health.portfolio.recordDate': {
    en: 'Date',
    or: 'ତାରିଖ',
  },
  'awc.portfolio.title': {
    en: 'Anganwadi Centre Dashboard',
    or: 'ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ର ଡ୍ୟାସବୋର୍ଡ',
  },
  'awc.portfolio.subtitle': {
    en: 'Centre profile and services from available data',
    or: 'ଉପଲବ୍ଧ ତଥ୍ୟରୁ କେନ୍ଦ୍ର ପ୍ରୋଫାଇଲ୍ ଓ ସେବା',
  },
  'awc.portfolio.heroSubtitle': {
    en: 'Centre details and location from available data',
    or: 'ଉପଲବ୍ଧ ତଥ୍ୟରୁ କେନ୍ଦ୍ର ବିବରଣୀ ଓ ଅବସ୍ଥାନ',
  },
  'awc.portfolio.centreDetailsSection': {
    en: 'Centre details',
    or: 'କେନ୍ଦ୍ର ବିବରଣୀ',
  },
  'awc.portfolio.orgNameLabel': { en: 'Org name', or: 'ସଂସ୍ଥା ନାମ' },
  'awc.portfolio.nameOfAwcLabel': { en: 'Name of AWC', or: 'ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ରର ନାମ' },
  'awc.portfolio.awcIdLabel': { en: 'AWC ID', or: 'ଆଙ୍ଗନୱାଡି ଆଇଡି' },
  'awc.portfolio.buildingStatusLabel': { en: 'Building status', or: 'ଭବନ ସ୍ଥିତି' },
  'awc.portfolio.mapTitle': { en: 'Centre Location', or: 'କେନ୍ଦ୍ର ଅବସ୍ଥିତି' },
  'awc.portfolio.mapSubtitle': {
    en: 'Anganwadi centre location on map.',
    or: 'ମାନଚିତ୍ରରେ ଆଙ୍ଗନୱାଡି କେନ୍ଦ୍ର ଅବସ୍ଥିତି।',
  },
  'awc.portfolio.aboutCentre': { en: 'About this centre', or: 'ଏହି କେନ୍ଦ୍ର ବିଷୟରେ' },
  'awc.portfolio.totalEnrollment': { en: 'Total enrollment', or: 'ମୋଟ ନାମଲେଖା' },
  'awc.portfolio.children': { en: 'children', or: 'ଶିଶୁ' },
  'awc.portfolio.awwWorkerTitle': { en: 'AWW (Worker)', or: 'AWW (କର୍ମୀ)' },
  'awc.portfolio.awwWorkerSubtitle': { en: 'Anganwadi Worker', or: 'ଆଙ୍ଗନୱାଡି କର୍ମୀ' },
  'awc.portfolio.supervisorTitle': { en: 'Supervisor', or: 'ପର୍ଯ୍ୟବେକ୍ଷକ' },
  'awc.portfolio.supervisorSubtitle': { en: 'Centre supervisor', or: 'କେନ୍ଦ୍ର ପର୍ଯ୍ୟବେକ୍ଷକ' },
  'awc.portfolio.snpDailyStockTitle': { en: 'SNP Daily Stock', or: 'SNP ଦୈନିକ ଭଣ୍ଡାର' },
  'awc.portfolio.snpDailyStockDesc': {
    en: 'Opening balance, received and expenditure for Supplementary Nutrition Programme.',
    or: 'ଅନୁପୂରକ ପୋଷଣ କାର୍ଯ୍ୟକ୍ରମ ପାଇଁ ଆରମ୍ଭିକ ସନ୍ତୁଳନ, ଗ୍ରହଣ ଓ ଖର୍ଚ୍ଚ।',
  },
  'awc.portfolio.chart.stockTrend': { en: 'Stock trend (Kg)', or: 'ଭଣ୍ଡାର ପ୍ରବୃତ୍ତି (କି.ଗ୍ରା.)' },
  'awc.portfolio.chart.receivedVsExp': {
    en: 'Received vs expenditure (Kg)',
    or: 'ଗ୍ରହଣ ବିପରୀତ ଖର୍ଚ୍ଚ (କି.ଗ୍ରା.)',
  },
  'awc.portfolio.chart.opening': { en: 'Opening', or: 'ଆରମ୍ଭିକ' },
  'awc.portfolio.chart.closing': { en: 'Closing', or: 'ଶେଷ' },
  'awc.portfolio.chart.received': { en: 'Received', or: 'ଗ୍ରହଣ' },
  'awc.portfolio.chart.expenditure': { en: 'Expenditure', or: 'ଖର୍ଚ୍ଚ' },
  'awc.portfolio.noSnpData': { en: 'No SNP data', or: 'କୌଣସି SNP ତଥ୍ୟ ନାହିଁ' },
  'awc.portfolio.noSnpDataHint': {
    en: 'Add daily stock records to see the chart',
    or: 'ଚାର୍ଟ ଦେଖିବାକୁ ଦୈନିକ ଭଣ୍ଡାର ରେକର୍ଡ ଯୋଗ କରନ୍ତୁ',
  },
  'awc.portfolio.dailyRecords': { en: 'Daily records', or: 'ଦୈନିକ ରେକର୍ଡ' },
  'awc.portfolio.noSnpRows': { en: 'No SNP stock records available yet.', or: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି SNP ଭଣ୍ଡାର ରେକର୍ଡ ନାହିଁ।' },
  'awc.contact.cpdoContactNo': { en: 'CPDO contact no', or: 'CPDO ଯୋଗାଯୋଗ ନମ୍ବର' },
  'awc.contact.supervisorContact': { en: 'Supervisor contact', or: 'ସୁପରଭାଇଜର ଯୋଗାଯୋଗ' },
  'awc.contact.awwContactNo': { en: 'AWW contact no', or: 'AWW ଯୋଗାଯୋଗ ନମ୍ବର' },
  'awc.contact.awhName': { en: 'AWH name', or: 'AWH ନାମ' },
  'awc.contact.awhContactNo': { en: 'AWH contact no', or: 'AWH ଯୋଗାଯୋଗ ନମ୍ବର' },
  'awc.portfolio.showingDaysRange': {
    en: 'Showing {start}–{end} of {total} days',
    or: '{total} ଦିନ ମଧ୍ୟରୁ {start}–{end} ଦେଖାଯାଉଛି',
  },
  'awc.portfolio.pageOf': {
    en: 'Page {page} of {total}',
    or: 'ପୃଷ୍ଠା {page} / {total}',
  },
  'awc.portfolio.awwMessageHeading': {
    en: "AWW's message",
    or: "AWW's message",
  },
  'awc.portfolio.beneficiary03': {
    en: 'Children 0-3 years',
    or: 'Children 0-3 years',
  },
  'awc.portfolio.beneficiary36': {
    en: 'Children 3-6 years',
    or: 'Children 3-6 years',
  },
  'awc.portfolio.beneficiaryPregnant': {
    en: 'Pregnant women',
    or: 'Pregnant women',
  },
  'awc.portfolio.beneficiaryLactating': {
    en: 'Lactating mothers',
    or: 'Lactating mothers',
  },
  'awc.portfolio.beneficiaryTotal': {
    en: 'Total active beneficiaries',
    or: 'Total active beneficiaries',
  },
  'awc.portfolio.servicesTableTitle': {
    en: 'SNP / Nutrition and health services',
    or: 'SNP / Nutrition and health services',
  },
  'awc.portfolio.keyHighlightsTitle': {
    en: 'Key highlights',
    or: 'Key highlights',
  },
  'awc.portfolio.snpMonitoringTitle': {
    en: 'Daily SNP monitoring',
    or: 'Daily SNP monitoring',
  },
  'awc.portfolio.chipCentreType': {
    en: 'Centre type',
    or: 'Centre type',
  },
  'awc.portfolio.chipAwwContact': {
    en: 'AWW contact',
    or: 'AWW contact',
  },
  'awc.portfolio.notSpecified': {
    en: 'Not specified',
    or: 'Not specified',
  },
  'awc.portfolio.chartOpeningClosing': {
    en: 'Opening vs closing stock',
    or: 'Opening vs closing stock',
  },
  'awc.portfolio.chartOpeningClosingHint': {
    en: 'Last 15 records (kg)',
    or: 'Last 15 records (kg)',
  },
  'awc.portfolio.chartReceivedExpHint': {
    en: 'Last 15 records (kg)',
    or: 'Last 15 records (kg)',
  },
  'awc.portfolio.snpDaySnapshotTitle': {
    en: 'Daily SNP stock snapshot',
    or: 'Daily SNP stock snapshot',
  },
  'awc.portfolio.snpDaySnapshotHint': {
    en: 'Stock figures for {date}',
    or: 'Stock figures for {date}',
  },
  'awc.portfolio.noSnpRowsForDate': {
    en: 'No SNP stock data available for this date.',
    or: 'No SNP stock data available for this date.',
  },
  'water.portfolio.title': {
    en: 'Water Supply Asset Dashboard',
    or: 'ଜଳ ଯୋଗାଣ ଓ ପରିମଳ ସଂପତ୍ତି ଡ୍ୟାସବୋର୍ଡ',
  },
  'water.portfolio.subtitle': {
    en: 'Scheme details and location from available WATCO/RWSS data.',
    or: 'ଉପଲବ୍ଧ WATCO/RWSS ତଥ୍ୟରୁ ଯୋଜନା ବିବରଣୀ ଓ ଅବସ୍ଥାନ।',
  },
  'water.portfolio.schemeDetails': { en: 'Scheme details', or: 'ଯୋଜନା ବିବରଣୀ' },
  'water.tab.profile': { en: 'Profile', or: 'ପ୍ରୋଫାଇଲ୍' },
  'water.assets.waterAssets': { en: 'Water Assets', or: 'ଜଳ ସମ୍ପତ୍ତି' },
  'water.assets.generalData': { en: 'General Data', or: 'ସାଧାରଣ ତଥ୍ୟ' },
  'water.assets.waterQuality': { en: 'Water Quality', or: 'ଜଳ ଗୁଣବତ୍ତା' },
  'water.assets.treatmentPlant': { en: 'Treatment Plant (WTP)', or: 'ଶୁଦ୍ଧିକରଣ କେନ୍ଦ୍ର (WTP)' },
  'water.assets.pumpingPower': { en: 'Pumping & Power', or: 'ପମ୍ପିଂ ଓ ବିଦ୍ୟୁତ୍' },
  'water.assets.distribution': { en: 'Distribution & More', or: 'ବିତରଣ ଓ ଅଧିକ' },
  'water.assets.otherSpecs': { en: 'Other Specs', or: 'ଅନ୍ୟାନ୍ୟ ବିବରଣ' },
  'water.field.stationName': { en: 'Station Name', or: 'ଷ୍ଟେସନ୍ ନାମ' },
  'water.field.stationId': { en: 'Station ID', or: 'ଷ୍ଟେସନ୍ ଆଇଡି' },
  'water.field.stationType': { en: 'Station Type', or: 'ଷ୍ଟେସନ୍ ପ୍ରକାର' },
  'water.field.schemeName': { en: 'Scheme Name', or: 'ଯୋଜନା ନାମ' },
  'water.field.populationServed': { en: 'Population served', or: 'ସେବା ପ୍ରାପ୍ତ ଜନସଂଖ୍ୟା' },
  'water.field.sourceType': { en: 'Source Type', or: 'ଉତ୍ସ ପ୍ରକାର' },
  'water.field.sourceName': { en: 'Source Name', or: 'ଉତ୍ସ ନାମ' },
  'water.overview.intakeCapacity': { en: 'Intake Capacity (MLD)', or: 'ଗ୍ରହଣ କ୍ଷମତା (MLD)' },
  'water.overview.designCapacity': { en: 'Design Capacity (MLD)', or: 'ଡିଜାଇନ୍ କ୍ଷମତା (MLD)' },
  'water.overview.operationalCapacity': { en: 'Operational Capacity (MLD)', or: 'କାର୍ଯ୍ୟକ୍ଷମ କ୍ଷମତା (MLD)' },
  'water.overview.supplyHours': { en: 'Supply Hours / Day', or: 'ଯୋଗାଣ ଘଣ୍ଟା / ଦିନ' },
  'water.overview.perCapita': { en: 'Per Capita Supply (LPCD)', or: 'ମୁଣ୍ଡପିଛା ଯୋଗାଣ (LPCD)' },
  'water.overview.nrw': { en: 'NRW (%)', or: 'NRW (%)' },
  'water.top.intakeCapacity': { en: 'Intake Capacity (MLD)', or: 'ଗ୍ରହଣ କ୍ଷମତା (MLD)' },
  'water.top.designCapacity': { en: 'Design Capacity (MLD)', or: 'ଡିଜାଇନ୍ କ୍ଷମତା (MLD)' },
  'water.top.perCapita': { en: 'Per Capita Supply (LPCD)', or: 'ମୁଣ୍ଡପିଛା ଯୋଗାଣ (LPCD)' },
  'water.daily.title': { en: 'Daily Monitoring', or: 'ଦୈନିକ ନିରୀକ୍ଷଣ' },
  'water.daily.subtitle': {
    en: 'Daily tracking of water operations, pump logs, and tank levels.',
    or: 'ଜଳ କାର୍ଯ୍ୟ, ପମ୍ପ ଲଗ୍ ଓ ଟାଙ୍କି ସ୍ତରର ଦୈନିକ ଅନୁଧ୍ୟାନ।',
  },
  'water.daily.activeLeakages': { en: 'Active Leakages', or: 'ସକ୍ରିୟ ଲିକେଜ୍' },
  'water.daily.leakagesCountLine': { en: '{count} reported', or: '{count} ରିପୋର୍ଟ' },
  'water.daily.leakagesNone': { en: 'None', or: 'କିଛି ନାହିଁ' },
  'water.daily.productionVsSupply': { en: 'Water Production vs Supply', or: 'ଜଳ ଉତ୍ପାଦନ ବିପରୀତ ଯୋଗାଣ' },
  'water.daily.volumeMld15': { en: 'Volume in MLD (Last 15 records)', or: 'MLD ରେ ଆୟତନ (ଶେଷ ୧୫ ରେକର୍ଡ)' },
  'water.daily.legend.produced': { en: 'Produced', or: 'ଉତ୍ପାଦିତ' },
  'water.daily.legend.supplied': { en: 'Supplied', or: 'ଯୋଗାଣ' },
  'water.daily.pumpHours': { en: 'Pump Running Hours', or: 'ପମ୍ପ ଚାଲନ ଘଣ୍ଟା' },
  'water.daily.pumpHoursSubtitle': { en: 'Total run time (Last 15 records)', or: 'ମୋଟ ଚାଲନ ସମୟ (ଶେଷ ୧୫ ରେକର୍ଡ)' },
  'water.daily.tankLevelsTitle': { en: 'Daily Reservoir / Tank Levels', or: 'ଦୈନିକ ଜଳାଶୟ / ଟାଙ୍କି ସ୍ତର' },
  'water.daily.tankLevelsForDate': { en: 'Volume levels for {date}', or: '{date} ପାଇଁ ଆୟତନ ସ୍ତର' },
  'water.daily.tankName': { en: 'Tank Name', or: 'ଟାଙ୍କି ନାମ' },
  'water.daily.openingMl': { en: 'Opening (ML)', or: 'ଆରମ୍ଭ (ML)' },
  'water.daily.intakeMl': { en: 'Intake (ML)', or: 'ଗ୍ରହଣ (ML)' },
  'water.daily.distributedMl': { en: 'Distributed (ML)', or: 'ବିତରିତ (ML)' },
  'water.daily.closingMl': { en: 'Closing (ML)', or: 'ଶେଷ (ML)' },
  'water.daily.noTankData': {
    en: 'No tank level data available for this date.',
    or: 'ଏହି ତାରିଖ ପାଇଁ ଟାଙ୍କି ସ୍ତର ତଥ୍ୟ ଉପଲବ୍ଧ ନାହିଁ।',
  },
};

export function t(key: MessageKey, language: Language): string {
  return messages[key]?.[language] ?? messages[key]?.en ?? key;
}

