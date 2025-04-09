import { Component, inject } from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbNavModule,
  NgbToastModule
} from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';
import {Router} from '@angular/router';


@Component({
  selector: 'app-threshold',
  standalone: true,
  imports: [NgbNavModule, NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbToastModule,
    CommonModule
  ],
  templateUrl: './threshold.component.html',
  styleUrl: './threshold.component.scss'
})
export class ThresholdComponent {
  public toastService=inject(ToastService)
  active = 1;

  constructor(private router: Router) {

  }

  navigateToThreshold(): void {
    const type = this.active === 1 ? 'internal' : 'partner';
    this.router.navigate(['/threshold-add'], { queryParams: { type } });
  }
}
