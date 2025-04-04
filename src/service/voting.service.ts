import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ApiResponse} from '../models/role';
import {initiateCgbCycle} from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class VotingService {

  constructor(private http: HttpClient) {
  }

  initiateCgbCycle(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(initiateCgbCycle, payload);
  }

}
