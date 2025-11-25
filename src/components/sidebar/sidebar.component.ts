import {NgClass, NgForOf, NgIf, NgTemplateOutlet} from '@angular/common';
import {Component, EventEmitter, Input, Output, ChangeDetectorRef} from '@angular/core';
import {Menu, menuItems} from '../../models/menu';
import {SafeHtmlDirective} from '../../directives/safe-html.directive';
import {ActivatedRoute, Router, NavigationEnd, RouterLink, RouterLinkActive} from '@angular/router';
import {filter} from 'rxjs/operators';
import {AuthService} from '../../service/auth.service';
import {ToggleService} from '../../app/shared/services/toggle.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, NgForOf, SafeHtmlDirective, NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent {
  @Input() isExpanded: boolean = true;
  @Output() toggleSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();

  expandedMenus: { [key: string]: boolean } = {};
  protected menuItems: Menu[] = [];
  private loggedInUserRole: string | null = null;

  constructor(private toggleService: ToggleService, private router: Router, private activatedRoute: ActivatedRoute, private authService: AuthService, private cdr: ChangeDetectorRef) {
    // Initialize active state on component load
    this.updateCurrentPath();
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateCurrentPath();
      this.cdr.detectChanges();
    });

    // Get logged in user's role
    this.authService.userDetails$.subscribe(user => {
      if (user) {
        this.loggedInUserRole = user.roleName || null;
        // Re-filter menu items when role changes
        const accessList = this.authService.userRoleAccess || [];
        this.menuItems = this.filterMenuItemsByPermissions(menuItems, accessList);
      }
    });

    this.authService.userRoleAccess$.subscribe(value => {
      this.menuItems = this.filterMenuItemsByPermissions(menuItems, value);
    });

    this.toggleService.sidebarExpanded$.subscribe((expanded) => {
      this.isExpanded = expanded;
      this.toggleSidebar.emit(expanded);
    });
  }

  filterMenuItemsByPermissions(items: any[], accessList: any[]): any[] {
    const result: any[] = [];

    // Roles allowed to see "Create" and "My Drafts" menu items
    const allowedRolesForCreateAndDrafts = ['Secretary', 'Procurement Tag', 'CAM', "Super Admin"];
    
    // Roles allowed to see "Administration" menu item
    const allowedRolesForAdministration = ['Super Admin', 'Secretary'];
    
    // Roles allowed to see "Partners" menu item
    const allowedRolesForPartners = ['Secretary', 'Super Admin'];

    for (const item of items) {
      // Check if this is "Create" or "My Drafts" menu item
      const isCreateOrMyDrafts = item.title === 'Create' || item.title === 'My Drafts';
      
      if (isCreateOrMyDrafts) {
        // Only show if user has one of the allowed roles
        if (!this.loggedInUserRole || !allowedRolesForCreateAndDrafts.includes(this.loggedInUserRole)) {
          continue; // Skip this menu item
        }
      }
      
      // Check if this is "Administration" menu item
      if (item.title === 'Administration') {
        // Only show if user has one of the allowed roles
        if (!this.loggedInUserRole || !allowedRolesForAdministration.includes(this.loggedInUserRole)) {
          continue; // Skip this menu item
        }
      }
      
      // Check if this is "Partners" menu item
      if (item.title === 'Partners') {
        // Only show if user has one of the allowed roles
        if (!this.loggedInUserRole || !allowedRolesForPartners.includes(this.loggedInUserRole)) {
          continue; // Skip this menu item
        }
      }
      
      // Check if this is "CGB" menu item
      if (item.title === 'CGB') {
        // Hide CGB menu for JV Admin users
        if (this.loggedInUserRole === 'JV Admin') {
          continue; // Skip this menu item
        }
      }

      const hasPermission = (key: string) =>
        accessList.some(f =>
          (f.typeName === key || f.particularsName === key) &&
          (f.isWriteAccess || f.isReadAccess)
        );

      const hasAllAccess = accessList.some(f =>
        f.typeName === item.title &&
        f.particularsName === 'All Access' &&
        (f.isWriteAccess || f.isReadAccess)
      );

      if (!item.checkPermission) {
        // No permission check needed — include as-is
        const filteredChildren = this.filterMenuItemsByPermissions(item.children || [], accessList);
        result.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        });
        continue;
      }

      if (hasAllAccess) {
        // Parent has full access — include everything under it
        const filteredChildren = this.filterMenuItemsByPermissions(item.children || [], accessList);
        result.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        });
        continue;
      }

      // Filter children recursively
      const filteredChildren = this.filterMenuItemsByPermissions(item.children || [], accessList);

      const allowParent = hasPermission(item.title) || hasPermission(item.roleMap) || filteredChildren.length > 0;

      if (allowParent) {
        result.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : undefined
        });
      }
    }

    return result;
  }

  findMenuItemPath(items: any[], path: string, trail: any[] = []): any[] | null {
    for (const item of items) {
      const newTrail = [...trail, item];

      // Normalize paths for comparison
      const normalizedPath = path.split('?')[0].split('#')[0];
      const normalizedItemPath = item.path?.split('?')[0].split('#')[0];

      if (normalizedItemPath && (normalizedPath === normalizedItemPath || normalizedPath.startsWith(normalizedItemPath + '/'))) {
        return newTrail;
      }

      if (item.children?.length) {
        const result = this.findMenuItemPath(item.children, path, newTrail);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  updateCurrentPath(): void {
    const currentUrl = this.router.url.split('?')[0]; // Remove query params
    const itemTrail = this.findMenuItemPath(this.menuItems, currentUrl);

    if (itemTrail) {
      for (const item of itemTrail) {
        if (item.title && item.children && item.children.length > 0) {
          // Only expand parent menus, don't toggle them
          this.expandedMenus[item.title] = true;
        }
      }
    }
  }

  getFullPath(route: ActivatedRoute): string {
    let path = route.routeConfig?.path || '';

    if (route.firstChild) {
      const childPath = this.getFullPath(route.firstChild);
      if (childPath) {
        path += `/${childPath}`;
      }
    }

    return path;
  }

  handleSidebarToggle() {
    if (!this.isExpanded) {
      this.toggleService.expandSidebar();
    } else {
      this.toggleService.collapseAll();
    }
  }

  toggleSubmenu(menu: string) {
    this.expandedMenus[menu] = !this.expandedMenus[menu];
  }

  isMenuItemActive(item: Menu): boolean {
    if (!item.path || item.path === '#') {
      // For items without path, check if any child is active
      if (item.children && item.children.length > 0) {
        return item.children.some(child => this.isMenuItemActive(child));
      }
      return false;
    }
    
    const currentUrl = this.router.url.split('?')[0].split('#')[0];
    const normalizedPath = item.path.split('?')[0].split('#')[0];
    
    // Check if current URL matches or starts with item path
    if (normalizedPath && (currentUrl === normalizedPath || currentUrl.startsWith(normalizedPath + '/'))) {
      return true;
    }
    
    // Check if any child is active (recursive)
    if (item.children && item.children.length > 0) {
      return item.children.some(child => this.isMenuItemActive(child));
    }
    
    return false;
  }

  hasActiveChild(item: Menu): boolean {
    if (!item.children || item.children.length === 0) {
      return false;
    }
    return item.children.some(child => this.isMenuItemActive(child));
  }
}
