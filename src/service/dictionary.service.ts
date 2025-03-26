import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { DictionaryDetail, Item } from '../models/dictionary';
import { ApiResponse } from '../models/role';
import { HttpClient, HttpParams } from '@angular/common/http';
import { getDictionaryItemsListUri, getDictionaryListByItemNameUri } from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {



    private itemDetailSubject = new BehaviorSubject<Item[]>([]);
    public itemDetail$ = this.itemDetailSubject.asObservable();

    private dictionaryDetailSubject = new BehaviorSubject<DictionaryDetail[]>([]);
    public dictionaryDetail$ = this.dictionaryDetailSubject.asObservable();


     constructor(private http:HttpClient) { }
  
    getDictionaryItemList(): Observable<ApiResponse<Item[]>> {
      return this.http
        .get<ApiResponse<Item[]>>(getDictionaryItemsListUri)
        .pipe(
          tap((response)=>{
            if(response.status&&response.data)
            {
              this.itemDetailSubject.next(response.data);
            }
          })
        );
    }

    getDictionaryListByItem(itemName:string): Observable<ApiResponse<DictionaryDetail[]>> {
      const params = new HttpParams().set('ItemName', itemName);
      return this.http
        .get<ApiResponse<DictionaryDetail[]>>(getDictionaryListByItemNameUri,{params})
        .pipe(
          tap((response)=>{
            if(response.status&&response.data)
            {
              this.dictionaryDetailSubject.next(response.data);
            }
          })
        );
    }
}
