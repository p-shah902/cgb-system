import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, Observable, of, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {
  addPaperVisitorLogs,
  getPaperDetails,
  getPaperPreviewById,
  getPaperStatus,
  getPaperVisitorLogs,
  UpsertApproachToMarkets
} from '../utils/api/api';
import {ApiResponse} from '../models/role';
import {Paper, PaperStatusType} from '../models/paper';

@Injectable({
  providedIn: 'root'
})
export class PaperService {

  private isUpsertApproachToMarketsSubject = new BehaviorSubject<boolean>(false);
  public isUpsertApproachToMarkets$ = this.isUpsertApproachToMarketsSubject.asObservable();

  private paperStatusListSubject = new BehaviorSubject<any[]>([]);
  paperStatusList$ = this.paperStatusListSubject.asObservable();

  constructor(private http: HttpClient) {
  }


  upsertApproachToMarkets(upsertPayload: any) {
    return this.http.post<any>(UpsertApproachToMarkets, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isUpsertApproachToMarketsSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }


  getPaperDetailsWithPreview(paperId: number): Observable<ApiResponse<Paper>> {
    return this.http.get<ApiResponse<Paper>>(getPaperPreviewById + '/' + paperId);
  }

  getPaperDetails(paperId: number): Observable<ApiResponse<Paper>> {
    return this.http.get<ApiResponse<Paper>>(getPaperDetails + '/' + paperId);
  }

  getPaperStatusList(): Observable<ApiResponse<PaperStatusType[]>> {
    return this.http.get<ApiResponse<PaperStatusType[]>>(getPaperStatus)
      .pipe(
        tap(response => {
          if (response.status && response.data) {
            this.paperStatusListSubject.next(response.data);
          }
        })
      );
  }

  getPaperCommentLogs(paperId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(getPaperVisitorLogs + '/' + paperId, {});
  }

  addPaperCommentLogs(body: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(addPaperVisitorLogs, body)
  }

}

