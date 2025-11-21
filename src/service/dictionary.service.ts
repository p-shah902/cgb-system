import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { DictionaryDetail, GetDictionaryItemsListRequest, GetDictionaryListByItemNameRequest, Item } from '../models/dictionary';
import { ApiResponse } from '../models/role';
import { HttpClient, HttpParams } from '@angular/common/http';
import { getDictionaryItemsListUri, getDictionaryListByItemNameUri, upsertDictionariesUri } from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {



    private itemDetailSubject = new BehaviorSubject<Item[]>([]);
    public itemDetail$ = this.itemDetailSubject.asObservable();

    private dictionaryDetailSubject = new BehaviorSubject<DictionaryDetail[]>([]);
    public dictionaryDetail$ = this.dictionaryDetailSubject.asObservable();


     constructor(private http:HttpClient) { }
  
    getDictionaryItemList(request?: GetDictionaryItemsListRequest): Observable<ApiResponse<Item[]>> {
      // Default request payload if not provided
      const payload: GetDictionaryItemsListRequest = request || {
        filter: {},
        paging: {
          start: 0,
          length: 1000
        }
      };

      return this.http
        .post<ApiResponse<Item[]>>(getDictionaryItemsListUri, payload)
        .pipe(
          tap((response)=>{
            if(response.status&&response.data)
            {
              this.itemDetailSubject.next(response.data);
            }
          })
        );
    }

    getDictionaryListByItem(itemName:string, request?: GetDictionaryListByItemNameRequest): Observable<ApiResponse<DictionaryDetail[]>> {
      // Build payload with default values if not provided
      const payload: GetDictionaryListByItemNameRequest = request || {
        filter: {
          itemNames: itemName
        },
        paging: {
          start: 0,
          length: 1000
        }
      };
      
      // Ensure itemNames is set if not provided in request
      if (!payload.filter) {
        payload.filter = { itemNames: itemName };
      } else if (!payload.filter.itemNames) {
        payload.filter.itemNames = itemName;
      }
      
      // Ensure paging is set and length is never 0
      if (!payload.paging) {
        payload.paging = {
          start: 0,
          length: 1000
        };
      } else if (!payload.paging.length || payload.paging.length === 0) {
        // Ensure length is always a valid number (never 0)
        payload.paging.length = 1000;
      }
      
      return this.http
        .post<ApiResponse<DictionaryDetail[]>>(getDictionaryListByItemNameUri, payload)
        .pipe(
          tap((response)=>{
            if(response.status&&response.data)
            {
              this.dictionaryDetailSubject.next(response.data);
            }
          })
        );
    }

     upsertDictionary(upsertPayload:DictionaryDetail):Observable<ApiResponse<any>>{
          return this.http.post<ApiResponse<any>>(upsertDictionariesUri,upsertPayload).pipe(
                tap(response => {
                  console.log(response);
                  if (response && response.status) {
      
                    console.log('Dictionary Added');
                  }
                })
              );
        }
}
