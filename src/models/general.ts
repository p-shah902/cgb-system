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
}

export interface Documents{
      id: number,
      vendorId: number,
      docName: string,
      fileData:string
}
