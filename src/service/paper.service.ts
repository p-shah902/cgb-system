import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {UpsertApproachToMarkets} from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class PaperService {

  private isUpsertApproachToMarketsSubject = new BehaviorSubject<boolean>(false);
  public  isUpsertApproachToMarkets$ = this.isUpsertApproachToMarketsSubject.asObservable();
  constructor(private http:HttpClient) { }


  upsertApproachToMarkets(upsertPayload:any){
      return this.http.post<any>(UpsertApproachToMarkets,upsertPayload).pipe(
            tap(response => {
              console.log(response);
              if (response && response.success) {

                this.isUpsertApproachToMarketsSubject.next(true);
              }
            }),
            catchError(error => {
              console.error(error);
              return of({ success: false, message: error.error?.message || 'Error Accured' });
            })
          );
    }

}

