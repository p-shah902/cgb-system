import { Injectable } from '@angular/core';
import { VendorDetail } from '../models/vendor';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../models/role';
import { getVendorListUri } from '../utils/api/api';

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
            if(response.success && response.data)
            {
              this.vendorListSubject.next(response.data);
            }
          })
          
        );
    }
}
