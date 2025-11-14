import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminRoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }

    // Get current user's role
    const user = this.authService.getUser();
    const userRole = user?.roleName;

    // Only allow Super Admin and Secretary roles
    const allowedRoles = ['Super Admin', 'Secretary'];
    
    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Redirect unauthorized users to inboxoutbox
    this.router.navigate(['/inboxoutbox']);
    return false;
  }
}

