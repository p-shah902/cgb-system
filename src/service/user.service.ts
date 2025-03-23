import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { UserDetails } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../models/role';
import { getUserListUri, upsertUserUri } from '../utils/api/api';

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
          if(response.success && response.data)
          {
            this.userListSubject.next(response.data);
          }
        })
      );
  }

  upsertUser(upsertPayload:UserDetails){
      return this.http.post<any>(upsertUserUri,upsertPayload).pipe(
            tap(response => {
              console.log(response);
              if (response && response.success) {
  
                this.isUpsertUserSubject.next(true);
              }
            }),
            catchError(error => {
              console.error(error);
              return of({ success: false, message: error.error?.message || 'Error Accured' });
            })
          );
    }

}

