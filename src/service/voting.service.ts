import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ApiResponse} from '../models/role';
import {getCurrentCgbCycle, initiateCgbCycle, updatePaperVote} from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class VotingService {

  constructor(private http: HttpClient) {
  }

  initiateCgbCycle(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(initiateCgbCycle, payload);
  }

  getCgbCycle(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(getCurrentCgbCycle);
  }

  updateVote(voteBody: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(updatePaperVote, voteBody);
  }

}
