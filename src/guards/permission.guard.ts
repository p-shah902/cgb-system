import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { ToastService } from '../service/toast.service';
import { Menu, menuItems } from '../models/menu';
import { UserRoleAccess } from '../models/role';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // First check if user is authenticated
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }

    const currentPath = route.routeConfig?.path || '';
    // Remove route params (everything after first :)
    let normalizedPath = currentPath.split(':')[0];
    // Remove trailing slash if present (except root)
    if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    // Ensure path starts with /
    if (normalizedPath && !normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
    }
    // Handle empty path (root route)
    if (!normalizedPath || normalizedPath === '/') {
      normalizedPath = '/inboxoutbox'; // Default route
    }

    // Find menu item for this route
    const menuItem = this.findMenuItemByPath(menuItems, normalizedPath);

    // If no menu item found, allow access (might be a preview route or dynamic route)
    if (!menuItem) {
      return true;
    }

    // Check permissions
    const hasAccess = this.checkPermission(menuItem);

    if (!hasAccess) {
      this.toastService.show('You are not allowed to access this page', 'danger');
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }

  /**
   * Find menu item by path, handling nested routes
   */
  private findMenuItemByPath(items: Menu[], path: string): Menu | null {
    // Normalize the search path
    const normalizedSearchPath = path.split('?')[0].split('#')[0];

    for (const item of items) {
      // Normalize item path for comparison
      const normalizedItemPath = item.path?.split('?')[0].split('#')[0];

      if (!normalizedItemPath) {
        continue;
      }

      // Check if path matches exactly
      if (normalizedSearchPath === normalizedItemPath) {
        return item;
      }

      // Check if path starts with item path (for nested routes)
      // e.g., /approach-to-market/123 should match /approach-to-market
      if (normalizedSearchPath.startsWith(normalizedItemPath + '/')) {
        return item;
      }

      // Check children recursively
      if (item.children && item.children.length > 0) {
        const found = this.findMenuItemByPath(item.children, normalizedSearchPath);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * Check if user has permission to access the menu item
   * Uses the same logic as filterMenuItemsByPermissions in sidebar component
   */
  private checkPermission(menuItem: Menu): boolean {
    const accessList = this.authService.userRoleAccess || [];
    const user = this.authService.getUser();
    const loggedInUserRole = user?.roleName || null;

    // Roles allowed to see "Create" and "My Drafts" menu items
    const allowedRolesForCreateAndDrafts = ['Secretary', 'Procurement Tag', 'CAM', 'Super Admin'];
    
    // Roles allowed to see "Administration" menu item
    const allowedRolesForAdministration = ['Super Admin', 'Secretary'];

    // Check if this is "Create" or "My Drafts" menu item
    const isCreateOrMyDrafts = menuItem.title === 'Create' || menuItem.title === 'My Drafts';
    
    if (isCreateOrMyDrafts) {
      // Only allow if user has one of the allowed roles
      if (!loggedInUserRole || !allowedRolesForCreateAndDrafts.includes(loggedInUserRole)) {
        return false;
      }
    }
    
    // Check if this is "Administration" menu item
    if (menuItem.title === 'Administration') {
      // Only allow if user has one of the allowed roles
      if (!loggedInUserRole || !allowedRolesForAdministration.includes(loggedInUserRole)) {
        return false;
      }
    }

    const hasPermission = (key: string) =>
      accessList.some(f =>
        (f.typeName === key || f.particularsName === key) &&
        (f.isWriteAccess || f.isReadAccess)
      );

    const hasAllAccess = accessList.some(f =>
      f.typeName === menuItem.title &&
      f.particularsName === 'All Access' &&
      (f.isWriteAccess || f.isReadAccess)
    );

    // If no permission check needed, allow access
    if (!menuItem.checkPermission) {
      return true;
    }

    // If user has all access for this type, allow
    if (hasAllAccess) {
      return true;
    }

    // Check if user has permission via title or roleMap
    const allowAccess = hasPermission(menuItem.title) || hasPermission(menuItem.roleMap || '');

    return allowAccess;
  }
}

