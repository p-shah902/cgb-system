import { Injectable } from '@angular/core';
import { VendorDetail } from '../models/vendor';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../models/role';
import { getVendorListUri, upsertVendorsUri } from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class VendorService {

    private vendorListSubject = new BehaviorSubject<VendorDetail[]>([]);
    public vendorList$ = this.vendorListSubject.asObservable();

    constructor(private http:HttpClient) { }
  
    getVendorDetailsList():Observable<ApiResponse<VendorDetail[]>>{
      
        return this.http.get<ApiResponse<VendorDetail[]>>(getVendorListUri).pipe(
          tap(response=>{
            if(response.status && response.data)
            {
              this.vendorListSubject.next(response.data);
              
            }
          })
          
        );
    }

    upsertVendorDetail(vendorPayload:VendorDetail,file:File|null):Observable<ApiResponse<any>>{
        const formData=this.createFormData(vendorPayload,file);
        return this.http.post<ApiResponse<any>>(upsertVendorsUri,formData).pipe(
              tap(response => {
                console.log(response);
                if (response && response.status) {
                  console.log('response',response.data);
                }
              })
            );
      }

    private createFormData(vendor: VendorDetail, file: File|null): FormData {
      const formData = new FormData();
      formData.append('Id', vendor.id.toString());
      formData.append('VendorName', vendor.vendorName);
      formData.append('TaxId', vendor.taxId);
      formData.append('SAPId', vendor.sapId);
      formData.append('CountryId', vendor.countryId.toString());
      formData.append('IsActive', vendor.isActive.toString());
      formData.append('ContactPerson', vendor.contactPerson);
      formData.append('ContactEmail', vendor.contactEmail);
      formData.append('ContactPhone', vendor.contactPhone);
      formData.append('IsCGBRegistered', vendor.isCGBRegistered.toString());
      formData.append('ApprovalStatus', vendor.approvalStatus);
      formData.append('AvatarPath', vendor.avatarPath);
  
      if (file) {
        formData.append('Files', file, file.name);
      }
  
      console.log('Form Data',formData);
      return formData;
    }

}
