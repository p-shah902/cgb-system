import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, Observable, of, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {
  addPaperVisitorLogs,
  getPaperDetails,
  getPaperPreviewById,
  getPaperStatus,
  getPaperVisitorLogs,
  UpsertApproachToMarkets, UpsertApprovalOfSales, upsertContractAward, upsertInfoNoteUri, upsertVariationPaper
} from '../utils/api/api';
import {ApiResponse} from '../models/role';
import {Paper, PaperData, PaperStatusType} from '../models/paper';

@Injectable({
  providedIn: 'root'
})
export class PaperService {

  private isUpsertApproachToMarketsSubject = new BehaviorSubject<boolean>(false);
  public isUpsertApproachToMarkets$ = this.isUpsertApproachToMarketsSubject.asObservable();

  private isUpsertContractAwardSubject = new BehaviorSubject<boolean>(false);
  public isUpsertContractAward$ = this.isUpsertContractAwardSubject.asObservable();

  private isUpsertVariationPaperSubject = new BehaviorSubject<boolean>(false);
  public isUpsertVariationPaper$ = this.isUpsertVariationPaperSubject.asObservable();

  private isUpsertApprovalOfSalesSubject = new BehaviorSubject<boolean>(false);
  public isUpsertApprovalOfSales$ = this.isUpsertApprovalOfSalesSubject.asObservable();

  private isUpsertInfoNoteSubject = new BehaviorSubject<boolean>(false);
  public isUpsertInfoNote$ = this.isUpsertInfoNoteSubject.asObservable();

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

  upsertContractAward(upsertPayload: any) {
    return this.http.post<any>(upsertContractAward, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isUpsertContractAwardSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }

  upsertVariationPaper(upsertPayload: any) {
    return this.http.post<any>(upsertVariationPaper, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isUpsertVariationPaperSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }

  upsertApprovalOfSales(upsertPayload: any) {
    return this.http.post<any>(UpsertApprovalOfSales, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isUpsertApprovalOfSalesSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }

  upsertInfoNote(upsertPayload: any) {
    return this.http.post<any>(upsertInfoNoteUri, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isUpsertInfoNoteSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }


  getPaperDetailsWithPreview(paperId: number): Observable<ApiResponse<PaperData>> {
    return this.http.get<ApiResponse<PaperData>>(getPaperPreviewById + '/' + paperId);
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

