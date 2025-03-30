import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { UserDetails } from '../models/user';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiResponse } from '../models/role';
import { getUserDetailsByIdUri, getUserListUri, upsertUserUri } from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userListSubject = new BehaviorSubject<UserDetails[]>([]);
  public userList$ = this.userListSubject.asObservable();

  private isUpsertUserSubject = new BehaviorSubject<boolean>(false);
  public isUpsertUser$ = this.isUpsertUserSubject.asObservable();
  constructor(private http:HttpClient) { }

  getUserDetailsList():Observable<ApiResponse<UserDetails[]>>{
      return this.http.get<ApiResponse<UserDetails[]>>(getUserListUri).pipe(
        tap(response=>{
          if(response.status && response.data)
          {
            this.userListSubject.next(response.data);
          }
        })
      );
  }

   getUserInfoById(id:number): Observable<ApiResponse<UserDetails[]>> {
            const params = new HttpParams().set('Id', id);
            return this.http
              .get<ApiResponse<UserDetails[]>>(getUserDetailsByIdUri,{params})
              .pipe(
                tap((response)=>{
                  if(response.status&&response.data)
                  {
                    this.userListSubject.next(response.data);
                  }
                })
              );
          }

  upsertUser(upsertPayload:UserDetails):Observable<ApiResponse<any>>{
      return this.http.post<ApiResponse<any>>(upsertUserUri,upsertPayload).pipe(
            tap(response => {
              console.log(response);
              if (response && response.status) {
  
                this.isUpsertUserSubject.next(true);
              }
            })
          );
    }

}

