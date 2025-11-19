import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {PaperConfig} from '../../models/paper';
import {HttpClient} from '@angular/common/http';
import {ApiResponse} from '../../models/role';
import {GetPaperConfigurationsListRequest, PaperFilter} from '../../models/general';
import {approveRejectPaper, getArchivedPaperListUri, getPaperConfigurationsList, getPartnerApprovalStatus, multipleStatuUpdate, updatePartnerApprovalStatus} from '../../utils/api/api';
import {PartnerApprovalStatus} from '../../models/paper';

@Injectable({
  providedIn: 'root'
})
export class PaperConfigService {

  private paperConfigListSubject = new BehaviorSubject<PaperConfig[]>([]);
  public paperConfigList$ = this.paperConfigListSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getPaperConfigList(request?: GetPaperConfigurationsListRequest | Partial<PaperFilter>): Observable<ApiResponse<PaperConfig[]>> {
    // Extract filter and paging from request
    let filter: Partial<PaperFilter> = {};
    let paging = { start: 0, length: 1000 };
    
    // Check if request is in new format (has filter/paging structure) or old format (direct filter)
    if (request && ('filter' in request || 'paging' in request)) {
      // New format with pagination
      const newFormatRequest = request as GetPaperConfigurationsListRequest;
      filter = newFormatRequest.filter || {};
      paging = newFormatRequest.paging || { start: 0, length: 1000 };
    } else {
      // Old format - direct filter
      filter = request as Partial<PaperFilter> || {};
    }
    
    // Build payload with required fields at root level (API expects OrderType and StatusIds at root)
    // Ensure OrderType is always present (required by API)
    const payload: any = {
      OrderType: filter.orderType || 'DESC',
      StatusIds: filter.statusIds || [],
      Paging: {
        Start: paging.start,
        Length: paging.length
      }
    };
    
    // Add optional filter fields if present
    if (filter.fromDate) payload.FromDate = filter.fromDate;
    if (filter.toDate) payload.ToDate = filter.toDate;
    if (filter.priceMin !== null && filter.priceMin !== undefined) payload.PriceMin = filter.priceMin;
    if (filter.priceMax !== null && filter.priceMax !== undefined) payload.PriceMax = filter.priceMax;
    if (filter.sortHighToLow !== undefined) payload.SortHighToLow = filter.sortHighToLow;
    if (filter.sortLowToHigh !== undefined) payload.SortLowToHigh = filter.sortLowToHigh;
    if (filter.title) payload.Title = filter.title;
    if (filter.vendor !== null && filter.vendor !== undefined) payload.Vendor = filter.vendor;
    if (filter.paperType) payload.PaperType = filter.paperType;
    if (filter.cgbItemRef) payload.CgbItemRef = filter.cgbItemRef;
    if (filter.cgbApprovalFromDate) payload.CgbApprovalFromDate = filter.cgbApprovalFromDate;
    if (filter.cgbApprovalToDate) payload.CgbApprovalToDate = filter.cgbApprovalToDate;
    if (filter.ptName) payload.PtName = filter.ptName;
    if (filter.contractNo) payload.ContractNo = filter.contractNo;
    
    return this.http.post<ApiResponse<PaperConfig[]>>(getPaperConfigurationsList, payload).pipe(
      tap(response => {
        if (response.status && response.data) {
          this.paperConfigListSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Get total count of records matching the filter criteria
   * Makes a request with length: 1 to get minimal data but the total count
   */
  getPaperConfigListCount(filter?: Partial<PaperFilter>): Observable<ApiResponse<PaperConfig[]>> {
    // Build payload with same filters but length: 1 to get count
    const payload: any = {
      OrderType: filter?.orderType || 'DESC',
      StatusIds: filter?.statusIds || [],
      Paging: {
        Start: 0,
        Length: 1 // Request only 1 record to get the total count
      }
    };
    
    // Add optional filter fields if present
    if (filter?.fromDate) payload.FromDate = filter.fromDate;
    if (filter?.toDate) payload.ToDate = filter.toDate;
    if (filter?.priceMin !== null && filter?.priceMin !== undefined) payload.PriceMin = filter.priceMin;
    if (filter?.priceMax !== null && filter?.priceMax !== undefined) payload.PriceMax = filter.priceMax;
    if (filter?.sortHighToLow !== undefined) payload.SortHighToLow = filter.sortHighToLow;
    if (filter?.sortLowToHigh !== undefined) payload.SortLowToHigh = filter.sortLowToHigh;
    if (filter?.title) payload.Title = filter.title;
    if (filter?.vendor !== null && filter?.vendor !== undefined) payload.Vendor = filter.vendor;
    if (filter?.paperType) payload.PaperType = filter.paperType;
    if (filter?.cgbItemRef) payload.CgbItemRef = filter.cgbItemRef;
    if (filter?.cgbApprovalFromDate) payload.CgbApprovalFromDate = filter.cgbApprovalFromDate;
    if (filter?.cgbApprovalToDate) payload.CgbApprovalToDate = filter.cgbApprovalToDate;
    if (filter?.ptName) payload.PtName = filter.ptName;
    if (filter?.contractNo) payload.ContractNo = filter.contractNo;
    
    return this.http.post<ApiResponse<PaperConfig[]>>(getPaperConfigurationsList, payload);
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

  updatePartnerApprovalStatus(paperId: number, status: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(updatePartnerApprovalStatus, {
      paperId: paperId,
      status: status
    });
  }

  getPartnerApprovalStatus(paperId: number): Observable<ApiResponse<PartnerApprovalStatus[]>> {
    return this.http.get<ApiResponse<PartnerApprovalStatus[]>>(`${getPartnerApprovalStatus}/${paperId}`);
  }
}
