import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {PaperConfig} from '../../models/paper';
import {HttpClient} from '@angular/common/http';
import {ApiResponse} from '../../models/role';
import {PaperFilter} from '../../models/general';
import {approveRejectPaper, getArchivedPaperListUri, getPaperConfigurationsList, multipleStatuUpdate} from '../../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class PaperConfigService {

  private paperConfigListSubject = new BehaviorSubject<PaperConfig[]>([]);
  public paperConfigList$ = this.paperConfigListSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getPaperConfigList(filterPayload: Partial<PaperFilter>): Observable<ApiResponse<PaperConfig[]>> {
    return this.http.post<ApiResponse<PaperConfig[]>>(getPaperConfigurationsList, filterPayload).pipe(
      tap(response => {
        if (response.status && response.data) {
          this.paperConfigListSubject.next(response.data);
        }
      })
    );
  }

  getArchivePaperList(): Observable<ApiResponse<PaperConfig[]>> {
    return this.http.post<ApiResponse<PaperConfig[]>>(getArchivedPaperListUri, {
      orderType: "DESC",
    }).pipe(
      tap(response => {
        if (response.status && response.data) {
          this.paperConfigListSubject.next(response.data);
        }
      })
    );
  }

  approveRejectPaper(paper: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(approveRejectPaper, paper);
  }

  updateMultiplePaperStatus(paper: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(multipleStatuUpdate, paper);
  }
}
