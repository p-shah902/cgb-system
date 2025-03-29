import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {uploadDoc} from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  private isUploadSuccessSubject = new BehaviorSubject<boolean>(false);
  public isUploadSuccess$ = this.isUploadSuccessSubject.asObservable();

  constructor(private http: HttpClient) {}

  uploadDocuments(documentId: number, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('Files', file); // Ensure backend expects 'Files'
    });

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
}
