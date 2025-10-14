import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {
  createBatchPaper, updateBatchPaper, getBatchPaperList
} from '../utils/api/api';
import {ApiResponse} from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class BatchService {

  constructor(private http: HttpClient) {
  }

  createBatchPaper(upsertPayload: any) {
    return this.http.post<any>(createBatchPaper, upsertPayload);
  }

  upsertBatchPaper(upsertPayload: any) {
    return this.http.post<any>(updateBatchPaper, upsertPayload)
  }

  getBatchPapersList(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(getBatchPaperList);
  }

}

