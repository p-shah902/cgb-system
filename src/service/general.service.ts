import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { DepartmentDetails } from '../models/department';
import { ApiResponse } from '../models/role';
import { getCountryListUri, getDepartmentListUri, getAuditLogs } from '../utils/api/api';
import { CountryDetail } from '../models/general';
import { AuditLogs, GetAuditLogsListRequest } from '../models/auditlogs';

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

  getAuditLogs(request?: GetAuditLogsListRequest): Observable<ApiResponse<AuditLogs[]>> {
    // Build payload with default values if not provided
    const payload: any = {
      orderType: request?.orderType || 'DESC',
      paging: request?.paging || {
        start: 0,
        length: 1000
      }
    };

    // Add optional filter fields if present
    if (request?.filter?.searchTerm) payload.searchTerm = request.filter.searchTerm;
    if (request?.filter?.paperId) payload.paperId = request.filter.paperId;
    if (request?.filter?.activityType) payload.activityType = request.filter.activityType;

    return this.http.post<ApiResponse<AuditLogs[]>>(getAuditLogs, payload);
  }
}
