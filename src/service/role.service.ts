import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { ApiResponse, ParticularType, UpsertUserRolesPaylod, UserRole } from '../models/role';
import { getUserParticularsListUri, getUserRolesUri, UpsertUserRolesUri } from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  private userParticularsSubject = new BehaviorSubject<ParticularType[]>([]);
  userParticulars$ = this.userParticularsSubject.asObservable();

  private isUpsertUserRoleSubject = new BehaviorSubject<boolean>(false);
  public isUpsertUserRole$ = this.isUpsertUserRoleSubject.asObservable();

  private userRoleListSubject = new BehaviorSubject<UserRole[]>([]);
  userRoleList$ = this.userRoleListSubject.asObservable();

  constructor(private http:HttpClient) { }

  getUserParticularsList(typeId:number):Observable<ApiResponse<ParticularType[]>>{
    return this.http.get<ApiResponse<ParticularType[]>>(`${getUserParticularsListUri}/${typeId}`)
            .pipe(
              tap(response=>{
                if(response.status && response.data)
                {
                  this.userParticularsSubject.next(response.data);
                }
              })
            );
  }

  upsertUserRoles(upsertPayload:UpsertUserRolesPaylod){
    return this.http.post<any>(UpsertUserRolesUri,upsertPayload).pipe(
          tap(response => {
            console.log(response);
            if (response && response.success) {

              this.isUpsertUserRoleSubject.next(true);
            }
          }),
          catchError(error => {
            console.error(error);
            return of({ success: false, message: error.error?.message || 'Error Accured' });
          })
        );
  }

  getUserRolesList():Observable<ApiResponse<UserRole[]>>{
    return this.http.get<ApiResponse<UserRole[]>>(getUserRolesUri)
            .pipe(
              tap(response=>{
                if(response.status && response.data)
                {
                  this.userRoleListSubject.next(response.data);
                }
              })
            );
  }
}
