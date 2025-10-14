import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, of, tap, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {deleteDocUri, getDocItemsListByPaperIdUri, uploadDoc} from '../utils/api/api';
import {ApiResponse} from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  private isUploadSuccessSubject = new BehaviorSubject<boolean>(false);
  public isUploadSuccess$ = this.isUploadSuccessSubject.asObservable();

  private isDeleteSuccessSubject = new BehaviorSubject<boolean>(false);
  public isDeleteSuccess$ = this.isDeleteSuccessSubject.asObservable();

  constructor(private http: HttpClient) {}

  uploadDocuments(documentId: number, formData: FormData) {
    return this.http.post<any>(`${uploadDoc}/${documentId}`, formData).pipe(
      tap(response => {
        console.log('Upload Response:', response);
        if (response && response.success) {
          this.isUploadSuccessSubject.next(true);
        }
      }),
      catchError(error => {
        console.error('Upload Error:', error);
        return of({ success: false, message: error.error?.message || 'Upload Failed' });
      })
    );
  }

  getDocItemsListByPaperId(paperId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(getDocItemsListByPaperIdUri + '/' + paperId);
  }

  deleteDocuments(paperId: number, docId: number) {
    return this.http.post<any>(`${deleteDocUri}/${paperId},${docId}`,{}).pipe(
      tap(response => {
        console.log('Upload Response:', response);
        if (response && response.success) {
          this.isDeleteSuccessSubject.next(true);
        }
      }),
      catchError(error => {
        console.error('Upload Error:', error);
        return of({ success: false, message: error.error?.message || 'Upload Failed' });
      })
    );
  }
}
