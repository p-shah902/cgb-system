import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, Observable, of, tap} from 'rxjs';
import {
  ApiResponse,
  ParticularType,
  UpsertUserRolesPaylod,
  UserRole,
  UserRoleAccesses
} from '../models/role';
import {
  CreateUserRolesUri,
  getAllRoleAccessListUri,
  getUserParticularsListUri,
  getUserRolesUri,
  UpsertUserRolesUri
} from '../utils/api/api';

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

  private userAccessListSubject = new BehaviorSubject<UserRoleAccesses[]>([]);
  userAccessList$ = this.userAccessListSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  getUserParticularsList(typeId: number): Observable<ApiResponse<ParticularType[]>> {
    return this.http.get<ApiResponse<ParticularType[]>>(`${getUserParticularsListUri}/${typeId}`)
      .pipe(
        tap(response => {
          if (response.status && response.data) {
            this.userParticularsSubject.next(response.data);
          }
        })
      );
  }

  getAllRoleAccessList(): Observable<ApiResponse<UserRoleAccesses[]>> {
    return this.http.get<ApiResponse<UserRoleAccesses[]>>(`${getAllRoleAccessListUri}`)
      .pipe(
        tap(response => {
          if (response.status && response.data) {
            this.userAccessListSubject.next(response.data);
          }
        })
      );
  }

  upsertUserRoles(upsertPayload: UpsertUserRolesPaylod) {
    return this.http.post<any>(UpsertUserRolesUri, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isUpsertUserRoleSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }

  createUserRoles(upsertPayload: UpsertUserRolesPaylod) {
    return this.http.post<any>(CreateUserRolesUri, upsertPayload).pipe(
      tap(response => {
        console.log(response);
        if (response && response.success) {

          this.isUpsertUserRoleSubject.next(true);
        }
      }),
      catchError(error => {
        console.error(error);
        return of({success: false, message: error.error?.message || 'Error Accured'});
      })
    );
  }

  getUserRolesList(): Observable<ApiResponse<UserRole[]>> {
    return this.http.get<ApiResponse<UserRole[]>>(getUserRolesUri)
      .pipe(
        tap(response => {
          if (response.status && response.data) {
            this.userRoleListSubject.next(response.data);
          }
        })
      );
  }
}
