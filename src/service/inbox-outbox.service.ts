import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ApiResponse} from '../models/role';
import {getCurrentCgbCycle, getPaperInboxOutBox, initiateCgbCycle, updatePaperVote} from '../utils/api/api';
import {InboxOutboxRequest} from '../models/inbox-outbox';

@Injectable({
  providedIn: 'root'
})
export class InboxOutboxService {

  constructor(private http: HttpClient) {
  }

  getPaperInboxOutbox(request?: InboxOutboxRequest): Observable<ApiResponse<any>> {
    // Build payload with default values if not provided
    const payload: any = {
      orderType: request?.orderType || 'DESC',
      paging: request?.paging || {
        start: 0,
        length: 1000
      }
    };

    // Add optional fields if present
    if (request?.paperName) payload.paperName = request.paperName;
    if (request?.paperStatus && request.paperStatus.length > 0) payload.paperStatus = request.paperStatus;
    if (request?.dueDate) payload.dueDate = request.dueDate;

    return this.http.post<ApiResponse<any>>(getPaperInboxOutBox, payload);
  }

}
