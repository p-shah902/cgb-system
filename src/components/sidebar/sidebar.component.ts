import {NgClass, NgForOf, NgIf} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Menu, menuItems} from '../../models/menu';
import {SafeHtmlDirective} from '../../directives/safe-html.directive';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';
import {AuthService} from '../../service/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, NgForOf, SafeHtmlDirective],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent {
  @Input() isExpanded: boolean = true;
  @Output() toggleSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();

  expandedMenus: { [key: string]: boolean } = {};
  protected readonly menuItems: Menu[] = [];

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private authService: AuthService) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateCurrentPath();
    });

    this.authService.userRoleAccess$.subscribe(value => {
      menuItems.forEach(item => {
        if (!item.checkPermission) {
          this.menuItems.push(item);
        } else {
          if (item.title === 'Admin Panel') {
            if (value.some(f => f.typeName === item.roleMap && (f.isWriteAccess || f.isReadAccess))) {
              let findChild = value.find(f => f.typeName === item.title && f.particularsName === "All Access" && (f.isWriteAccess || f.isReadAccess));
              if (findChild) {
                this.menuItems.push(item);
              } else {
                item.children = (item.children || []).filter(child => {
                  return value.some(f => f.particularsName === child.roleMap && (f.isWriteAccess || f.isReadAccess));
                }) as any;

                if (item.children && item.children?.length > 0) {
                  this.menuItems.push(item);
                }
              }
            }
          } else {
            if (value.some(f => f.typeName === item.title && (f.isWriteAccess || f.isReadAccess))) {
              this.menuItems.push(item);
            }
          }
        }
      })
    })
  }

  updateCurrentPath(): void {
    let menuItem = this.menuItems.find(f => f.path === this.getFullPath(this.activatedRoute) || (f.children || []).find(d => d.path === this.getFullPath(this.activatedRoute)));
    if (menuItem?.title) {
      this.toggleSubmenu(menuItem?.title);
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

  handleSidebarToggle = () => {
    this.isExpanded = !this.isExpanded;
    this.toggleSidebar.emit(this.isExpanded);
  };

  toggleSubmenu(menu: string) {
    this.expandedMenus[menu] = !this.expandedMenus[menu];
  }
}
