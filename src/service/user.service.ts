import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { UserDetails } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../models/role';
import { getUserListUri } from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userListSubject = new BehaviorSubject<UserDetails[]>([]);
  public userList$ = this.userListSubject.asObservable();
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
}
