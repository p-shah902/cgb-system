import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {getCkEditorToken} from '../utils/api/api';
import {BehaviorSubject, catchError, of, tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  private isTokenSubject = new BehaviorSubject<string>("");
  public isTokenSubject$ = this.isTokenSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getEditorToken() {
    return this.http.get(getCkEditorToken).pipe(
      tap((response: any) => {
        if (response.status && response.data) {
          this.isTokenSubject.next(response.data.result);
        }
      }),
      catchError(error => {
        return of({success: false, message: error.error?.message || 'Upload Failed'});
      }));
  }

}
