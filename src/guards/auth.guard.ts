import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../service/auth.service';
import {UserRoleAccess} from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  userRoles: UserRoleAccess[] = [];

  constructor(private authService: AuthService, private router: Router) {
  }

  canActivate(): boolean {
    if (this.authService.isAuthenticated) {
      this.userRoles = this.authService.userRoleAccess;
      return true;
    }


    this.router.navigate(['/login']);
    return false;
  }
}
