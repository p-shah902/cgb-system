import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { DepartmentDetails } from '../models/department';
import { ApiResponse } from '../models/role';
import { getCountryListUri, getDepartmentListUri } from '../utils/api/api';
import { CountryDetail } from '../models/general';

@Injectable({
  providedIn: 'root',
})
export class Generalervice {
  constructor(private http: HttpClient) {}

  private departmentDetailSubject = new BehaviorSubject<DepartmentDetails[]>([]);
  public departmentDetail$ = this.departmentDetailSubject.asObservable();


  private countrytDetailSubject = new BehaviorSubject<CountryDetail[]>([]);
  public countryDetail$ = this.countrytDetailSubject.asObservable();

  getDepartMentDetails(): Observable<ApiResponse<DepartmentDetails[]>> {
    return this.http
      .get<ApiResponse<DepartmentDetails[]>>(getDepartmentListUri)
      .pipe(
        tap((response) => {
          if (response.status && response.data) {
            this.departmentDetailSubject.next(response.data);
          }
        })
      );
  }

  getCountryDetails(): Observable<ApiResponse<CountryDetail[]>> {
    return this.http
      .get<ApiResponse<CountryDetail[]>>(getCountryListUri)
      .pipe(
        tap((response) => {
          if (response.status && response.data) {
            this.countrytDetailSubject.next(response.data);
          }
        })
      );
  }
}
