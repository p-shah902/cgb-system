import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError,Observable, of, tap} from 'rxjs';

import {
  CreateThresholdUri, deleteThresholdByIdUri, getThresholdByIdUri, GetThresholdList, updateThresholdUri
} from '../utils/api/api';
import {ThresholdType} from '../models/threshold';
import {ApiResponse} from '../models/role';
import {Paper} from '../models/paper';

@Injectable({
  providedIn: 'root'
})
export class ThresholdService {

  private thresholdSubject = new BehaviorSubject<ThresholdType[]>([]);
  public threshold$ = this.thresholdSubject.asObservable();

  private isAddThresholdSubject = new BehaviorSubject<boolean>(false);
  public isAddThreshold$ = this.isAddThresholdSubject.asObservable();

  private isUpdateThresholdSubject = new BehaviorSubject<boolean>(false);
  public isUpdateThreshold$ = this.isUpdateThresholdSubject.asObservable();


  constructor(private http: HttpClient) {
  }

  getThresholdList(): Observable<ApiResponse<ThresholdType[]>> {
    return this.http.get<ApiResponse<ThresholdType[]>>(`${GetThresholdList}`)
      .pipe(
        tap(response => {
          if (response.status && response.data) {
            this.thresholdSubject.next(response.data);
          }
        })
      );
  }

  getThresholdDetailsById(id: number): Observable<ApiResponse<ThresholdType[]>> {
    return this.http.get<ApiResponse<ThresholdType[]>>(`${getThresholdByIdUri}?ID=${id}` );
  }

  deleteThresholdDetailsById(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${deleteThresholdByIdUri}?ID=${id}` );
  }



  createThreshold(upsertPayload: ThresholdType) {
    return this.http.post<any>(CreateThresholdUri, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isAddThresholdSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }

  updateThreshold(upsertPayload: ThresholdType) {
    return this.http.post<any>(updateThresholdUri, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isUpdateThresholdSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }


}
