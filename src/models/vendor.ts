import { Documents } from "./general"

export interface VendorDetail{
      id: number,
      vendorName:string,
      taxId: string,
      sapId: string,
      countryId: number,
      isActive: boolean,
      contactPerson: string,
      contactEmail: string,
      contactPhone: string,
      avatarPath: string,
      isCGBRegistered: boolean,
      approvalStatus: string,
      createdBy: number|null,
      createdDate: string,
      modifiedBy: number|null,
      modifiedDate: string,
      country: any,
      countryName:string|null,
      avatarBytes:string|null,
      files: any
}

export interface VendorInfo{
      vendorDetails:VendorDetail[],
      documents:Documents[]
}