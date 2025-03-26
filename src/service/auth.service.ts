import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, Observable, of, tap} from 'rxjs';
import {loginUri} from '../utils/api/api';
import {Storage} from '../interfaces/storage';
import {AuthResponse, UserRoleAccess} from '../models/role';
import {LoginUser} from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {
  }

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private userRoleAccessSubject = new BehaviorSubject<UserRoleAccess[]>(this.getUserAccess());
  public userRoleAccess$ = this.userRoleAccessSubject.asObservable();

  private userDetailsSubject = new BehaviorSubject<LoginUser | null>(this.getUser());
  public userDetails$ = this.userDetailsSubject.asObservable();

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(loginUri, {email, password}).pipe(
      tap(response => {
        if (response && response.data.token) {
          localStorage.setItem(Storage.TOKEN, response.data.token);
          let details = response.data.user;
          if (response.data.userRoleAccesses && response.data.userRoleAccesses[0]) {
            details.roleName = response.data.userRoleAccesses[0].roleName
          }
          localStorage.setItem(Storage.USER_ROLE_ACCESS, JSON.stringify(response.data.userRoleAccesses));
          localStorage.setItem(Storage.USER_DETAILS, JSON.stringify(details));

          this.isAuthenticatedSubject.next(true);
          this.userRoleAccessSubject.next(response.data.userRoleAccesses)
        }
      }), catchError(error => {
        console.error('Login failed:', error);
        const errorResponse: AuthResponse = {
          status: false,
          message: "",
          data: {
            token: '',
            userRoleAccesses: [],
          }
        };
        return of(errorResponse);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(Storage.TOKEN);
    localStorage.removeItem(Storage.USER_DETAILS);
    localStorage.removeItem(Storage.USER_ROLE_ACCESS);
    this.isAuthenticatedSubject.next(false);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(Storage.TOKEN);
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(Storage.TOKEN);
  }

  getUser(): LoginUser | null {
    if (localStorage.getItem(Storage.USER_DETAILS)) {
      try {
        return JSON.parse(localStorage.getItem(Storage.USER_DETAILS) || "");
      } catch (e) {
        return null
      }
    }
    return null;
  }

  getUserAccess(): UserRoleAccess[] | [] {
    if (localStorage.getItem(Storage.USER_ROLE_ACCESS)) {
      try {
        return JSON.parse(localStorage.getItem(Storage.USER_ROLE_ACCESS) || "");
      } catch (e) {
        return []
      }
    }
    return [];
  }

  get userRoleAccess(): UserRoleAccess[] {
    return this.userRoleAccessSubject.value;
  }


}
