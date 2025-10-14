// no-auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated) {
      // Redirect authenticated users to the dashboard
      this.router.navigate(['/inboxoutbox']);
      return false;
    }

    // Allow access if not authenticated
    return true;
  }
}
