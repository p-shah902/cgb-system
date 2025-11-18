export interface CountryDetail{
      id: number,
      countryName:string,
      countryCode:string,
      currencyCode: string,
      isActive: boolean,
      createdDate: string,
      modifiedDate: string
}

export interface PaperFilter {
  statusIds?: number[],
  orderType: string,
  fromDate?: string,
  toDate?: string,
  priceMin?: number | null,
  priceMax?: number | null,
  sortHighToLow?: boolean
  sortLowToHigh?: boolean
  title?: string,
  vendor?: number,
  paperType?: string,
  cgbItemRef?: string,
  cgbApprovalFromDate?: string,
  cgbApprovalToDate?: string,
  ptName?: string,
  contractNo?: string
}

export interface GetPaperConfigurationsListPaging {
  start: number;
  length: number;
}

export interface GetPaperConfigurationsListRequest {
  filter?: Partial<PaperFilter>;
  paging?: GetPaperConfigurationsListPaging;
}

export interface Documents{
      id: number,
      vendorId: number,
      docName: string,
      fileData:string
}
