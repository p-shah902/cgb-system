import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ApiResponse} from '../models/role';
import {getCurrentCgbCycle, getPaperInboxOutBox, initiateCgbCycle, updatePaperVote} from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class InboxOutboxService {

  constructor(private http: HttpClient) {
  }

  getPaperInboxOutbox(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(getPaperInboxOutBox);
  }

}
