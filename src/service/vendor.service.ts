import { Injectable } from '@angular/core';
import { GetVendorsListRequest, VendorDetail, VendorInfo } from '../models/vendor';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse } from '../models/role';
import { deleteVendorsUri, getVendorDetailsByIdUri, getVendorListUri, upsertVendorsUri } from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class VendorService {

    private vendorListSubject = new BehaviorSubject<VendorDetail[]>([]);
    public vendorList$ = this.vendorListSubject.asObservable();

    private vendorInfoSubject = new BehaviorSubject<VendorInfo|null>(null);
    public vendorInfo$ = this.vendorInfoSubject.asObservable();

    constructor(private http:HttpClient) { }

    getVendorDetailsList(request?: GetVendorsListRequest):Observable<ApiResponse<VendorDetail[]>>{
        // Default request payload if not provided
        const payload: GetVendorsListRequest = request || {
          filter: {},
          paging: {
            start: 0,
            length: 1000
          }
        };

        return this.http.post<ApiResponse<VendorDetail[]>>(getVendorListUri, payload).pipe(
          tap(response=>{
            if(response.status && response.data)
            {
              this.vendorListSubject.next(response.data);
            }
          })
        );
    }

     getVendorInfoById(id:number): Observable<ApiResponse<VendorInfo>> {
          const params = new HttpParams().set('Id', id);
          return this.http
            .get<ApiResponse<VendorInfo>>(getVendorDetailsByIdUri,{params})
            .pipe(
              tap((response)=>{
                if(response.status&&response.data)
                {
                  this.vendorInfoSubject.next(response.data);
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

    deleteVendor(id: number): Observable<ApiResponse<any>> {
      return this.http.delete<ApiResponse<any>>(`${deleteVendorsUri}?id=${id}`).pipe(
        tap(response => {
          console.log('Delete Vendor Response:', response);
          if (response && response.status) {
            // Update the vendor list by removing the deleted vendor
            const currentList = this.vendorListSubject.value;
            const updatedList = currentList.filter(vendor => vendor.id !== id);
            this.vendorListSubject.next(updatedList);
          }
        })
      );
    }

    private createFormData(vendor: VendorDetail, file: File|null): FormData {
      const formData = new FormData();
      formData.append('Id', vendor.id.toString());
      formData.append('LegalName', vendor.vendorName);
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
