import {NgClass, NgForOf, NgIf, NgTemplateOutlet} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Menu, menuItems} from '../../models/menu';
import {SafeHtmlDirective} from '../../directives/safe-html.directive';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';
import {AuthService} from '../../service/auth.service';
import {ToggleService} from '../../app/shared/services/toggle.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, NgForOf, SafeHtmlDirective, NgTemplateOutlet],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent {
  @Input() isExpanded: boolean = true;
  @Output() toggleSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();

  expandedMenus: { [key: string]: boolean } = {};
  protected menuItems: Menu[] = [];
  private loggedInUserRole: string | null = null;

  constructor(private toggleService: ToggleService,private router: Router, private activatedRoute: ActivatedRoute, private authService: AuthService) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateCurrentPath();
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

    for (const item of items) {
      // Check if this is "Create" or "My Drafts" menu item
      const isCreateOrMyDrafts = item.title === 'Create' || item.title === 'My Drafts';
      
      if (isCreateOrMyDrafts) {
        // Only show if user has one of the allowed roles
        if (!this.loggedInUserRole || !allowedRolesForCreateAndDrafts.includes(this.loggedInUserRole)) {
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

      if (item.path === path) {
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
    const fullPath = this.getFullPath(this.activatedRoute);
    const itemTrail = this.findMenuItemPath(this.menuItems, fullPath);

    if (itemTrail) {
      for (const item of itemTrail) {
        if (item.title) {
          this.toggleSubmenu(item.title);
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
}
