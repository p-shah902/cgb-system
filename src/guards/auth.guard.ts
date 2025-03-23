
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { UserRoleAccess } from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  userRoles: UserRoleAccess[] = [];
  constructor(private authService: AuthService, private router: Router) {}
  
  canActivate(): boolean {
    if (this.authService.isAuthenticated) {
      console.log(this.authService.userRoleAccess);
      this.userRoles=this.authService.userRoleAccess;
      return true;
    }
    
    
    this.router.navigate(['/login']);
    return false;
  }

  getUserRoles(): UserRoleAccess[] {
    return this.userRoles;
  }
}
