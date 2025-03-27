import {NgClass, NgForOf, NgIf} from '@angular/common';
import {Component, EventEmitter, inject, Input, Output, TemplateRef} from '@angular/core';
import {menuItems} from '../../models/menu';
import {SafeHtmlDirective} from '../../directives/safe-html.directive';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {filter} from 'rxjs/operators';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Select2, Select2Hint, Select2Label} from 'ng-select2-component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, NgForOf, SafeHtmlDirective, Select2, Select2Hint, Select2Label],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent {
  @Input() isExpanded: boolean = true;
  @Output() toggleSidebar: EventEmitter<boolean> = new EventEmitter<boolean>();
  private readonly _mdlSvc = inject(NgbModal);

  expandedMenus: { [key: string]: boolean } = {};
  protected readonly menuItems = menuItems;

  public paperList: any = [
    {
      value: '/approach-to-market',
      label: 'Approach to Market'
    },
    {
      value: '/contract-award',
      label: 'Contact Award'
    },
    {
      value: '/contract-variation-or-amendment-approval',
      label: 'Variation Paper'
    },
    {
      value: '/approval-of-sale-disposal-form',
      label: 'Approval of Sale / Disposal Form'
    },
    {
      value: '/info-note',
      label: 'Info note'
    }
  ];

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateCurrentPath();
    });
  }

  open(event: any, content: TemplateRef<any>) {
    event.preventDefault();
    this._mdlSvc.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then(
      (result) => {

      },
      (reason) => {

      },
    );
  }

  openPage(value: any, modal: any) {
    this.router.navigate([value.value]);
    modal.close('Save click')
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
