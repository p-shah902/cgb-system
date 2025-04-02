export interface PaperConfig {
  paperID: number,
  statusName: string,
  statusId: number,
  description: string,
  purposeTitle: string,
  lastModifyBy: string,
  lastModifyName: string,
  lastModifyDate: string,
  price: number,
  isActive: boolean
  checked?: boolean
}

export interface PaperDetails {
  id: number,
  paperType: string,
  paperStatusId: string,
  paperStatusName: string,
  paperProvision: string,
  purposeRequired: string,
  isActive: boolean,
  cgbCirculationDate: Date | null,
  scopeOfWork: string,
  globalCGB: string
  bltMemberId: number
  bltMemberName: string
  operatingFunction: string
  subSector: string
  sourcingType: string
  camUserId: number
  camUserName: string
  vP1UserId: number
  vP1UserName: string
  procurementSPAUsers: string
  pdManagerNameId: number
  pdManagerName: string
  isPHCA: boolean
  psajv: string
  totalAwardValueUSD: number
  currencyCode: string
  exchangeRate: number
  contractValue: number
  contractStartDate: Date | string
  contractEndDate: Date | string
  isLTCC: boolean
  ltccNotes: string
  isGovtReprAligned: boolean
  govtReprAlignedComment: string
  isIFRS16: boolean
  isGIAAPCheck: boolean
  isConflictOfInterest: boolean
  conflictOfInterestComment: string
  strategyDescription: string
  remunerationType: string
  contractMgmtLevel: string
  sourcingRigor: string
  sourcingStrategy: string
  singleSourceJustification: string
  socaRsentOn: Date | string
  socaRreceivedOn: Date | string
  socarDescription: string
  preQualificationResult: string
  cgbItemRefNo:string
  conflictOfInterestCommen:string
  remunerationTypeData:string
  isConflictOfInteres:boolean

}

export interface ConsultationsDetails {
  id: number
  psa: string
  isNoExistingBudget: boolean
  technicalCorrectId: number
  technicalCorrectName: string
  budgetStatementId: number
  budgetStatementName: string
  jvReviewId: number
  jvReviewName: string
}

export interface BidInvites {
  id: number
  legalName: string
  isLocalOrJV: boolean
  countryId: number
  countryName: string
  parentCompanyName: string
  remarks: string
}

export interface RiskMitigations {
  id: number
  srNo: string
  risks: string | any
  mitigations: string | any
}

export interface ValueDeliveriesCostsharing {
  id: number
  costReductionPercent: number
  costReductionValue: number
  costReductionRemarks: string
  operatingEfficiencyPercent: number
  operatingEfficiencyValue: number
  operatingEfficiencyRemarks: string
  costAvoidancePercent: number
  costAvoidanceValue: number
  costAvoidanceRemarks: string
  isCapex: boolean
  capexMethodology: string
  isFixOpex: boolean
  fixOpexMethodology: string
  isVariableOpex: boolean
  variableOpexMethodology: string
  isInventoryItems: boolean
  inventoryItemsMethodology: string
}

export interface JvApprovals {
  id: number
  contractCommittee_SDCC: boolean
  contractCommittee_BTC_CCInfoNote: boolean
  contractCommittee_ShAsimanValue: string | any
  contractCommittee_SCP_Co_CC: boolean
  contractCommittee_SCP_Co_CCInfoNote: boolean
  contractCommittee_BPGroupValue: string | any
  contractCommittee_BTC_CC: boolean
  contractCommittee_CGB: boolean
  coVenturers_CMC: boolean
  coVenturers_SDMC: boolean
  coVenturers_SCP: boolean
  coVenturers_SCP_Board: boolean
  steeringCommittee_SC: boolean
}

export interface CostAllocationJVApproval {
  id: number
  psaName: string
  psaValue: boolean
  percentage: number
  value: number
}

export interface Paper {
  paperDetails: PaperDetails,
  consultationsDetails: ConsultationsDetails[],
  bidInvites: BidInvites[]
  riskMitigations: RiskMitigations[],
  valueDeliveriesCostsharing: ValueDeliveriesCostsharing[]
  jvApprovals: JvApprovals[]
  costAllocationJVApproval: CostAllocationJVApproval[]
  paperTimelineDetails:PaperTimelineDetails[]
}

export interface PaperDetailsType {
  paperDetails: PaperDetails,
  consultationsDetails: ConsultationsDetails[],
  bidInvites: BidInvites[]
  riskMitigations: RiskMitigations[],
  valueDeliveriesCostsharing: ValueDeliveriesCostsharing
  jvApprovals: JvApprovals[]
  costAllocationJVApproval: CostAllocationJVApproval[]
}

export interface PaperStatusType {
  id: number
  isActive: boolean
  lastModifyDate: string
  paperStatus: string
  statusDesc: string

}

export interface PaperTimelineDetails{
  id: number,
  activityName: string,
  isActivityDone: boolean,
  activityDate: Date | string,

}