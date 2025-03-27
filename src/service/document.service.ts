import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {uploadDoc} from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  constructor(private http: HttpClient) {}

  uploadFiles(paperId: number, files: File[]): Observable<number> {
    const formData = new FormData();

    files.forEach(file => {
      formData.append('Files', file, file.name);
    });

    const uploadUrl = `${uploadDoc}/${paperId}`; // Dynamic Paper ID

    return this.http.post<HttpEvent<any>>(uploadUrl, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => this.getProgress(event)),
      catchError(this.handleError)
    );
  }

  private getProgress(event: HttpEvent<any>): number {
    switch (event.type) {
      case HttpEventType.UploadProgress:
        return Math.round((event.loaded / (event.total || 1)) * 100);
      case HttpEventType.Response:
        return 100; // Upload complete
      default:
        return 0;
    }
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Upload error:', error);
    return throwError(() => new Error(error.error?.message || 'Upload failed'));
  }
}
