import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { PaperConfig } from '../../models/paper';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../models/role';
import { PaperFilter } from '../../models/general';
import { getPaperConfigurationsList } from '../../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class PaperConfigService {

  private paperConfigListSubject = new BehaviorSubject<PaperConfig[]>([]);
  public paperConfigList$ = this.paperConfigListSubject.asObservable();

  constructor(private http:HttpClient) { }

   getPaperConfigList(filterPayload:PaperFilter):Observable<ApiResponse<PaperConfig[]>>{
        return this.http.post<ApiResponse<PaperConfig[]>>(getPaperConfigurationsList,filterPayload).pipe(
          tap(response=>{
            if(response.status && response.data)
                {
                  this.paperConfigListSubject.next(response.data);
                }
          })
          
        );
    }
}
