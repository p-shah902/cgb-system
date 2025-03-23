import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap } from 'rxjs';
import { loginUri } from '../utils/api/api';
import { Storage } from '../interfaces/storage';
import { AuthResponse, UserRoleAccess } from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http:HttpClient) { }

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private userRoleAccessSubject = new BehaviorSubject<UserRoleAccess[]>([]);
  public userRoleAccess$ = this.userRoleAccessSubject.asObservable();
  
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(loginUri, { email, password }).pipe(
      tap(response => {
        console.log(response);
        if (response && response.token) {
          console.log("+++++++");
          console.log(response.userRoleAccesses);
          localStorage.setItem(Storage.TOKEN, response.token);
        
          this.isAuthenticatedSubject.next(true);
          this.userRoleAccessSubject.next(response.userRoleAccesses)
        }
      }),catchError(error => {
        console.error('Login failed:', error);
        const errorResponse: AuthResponse = {
          success: false,
          token: '',
          userRoleAccesses: [],
          
        };
        return of(errorResponse); 
      })
    );
  }

  logout(): void {
    localStorage.removeItem(Storage.TOKEN);
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
  
  get userRoleAccess():UserRoleAccess[]{
    return this.userRoleAccessSubject.value;
  }

  
}
