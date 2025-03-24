import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { DepartmentDetails } from '../models/department';
import { ApiResponse } from '../models/role';
import { getDepartmentListUri } from '../utils/api/api';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  constructor(private http: HttpClient) {}

  private departmentDetailSubject = new BehaviorSubject<DepartmentDetails[]>([]);
  public departmentDetail$ = this.departmentDetailSubject.asObservable();

  getDepartMentDetails(): Observable<ApiResponse<DepartmentDetails[]>> {
    return this.http
      .get<ApiResponse<DepartmentDetails[]>>(getDepartmentListUri)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.departmentDetailSubject.next(response.data);
          }
        })
      );
  }
}
