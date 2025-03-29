export interface CountryDetail{
      id: number,
      countryName:string,
      countryCode:string,
      currencyCode: string,
      isActive: boolean,
      createdDate: string,
      modifiedDate: string
}

export interface PaperFilter{
      statusIds: number[],
      orderType: string
    }