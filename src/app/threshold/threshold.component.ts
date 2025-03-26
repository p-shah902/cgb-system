import { Component } from '@angular/core';
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbNavModule
} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-threshold',
  standalone: true,
  imports: [NgbNavModule, NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle],
  templateUrl: './threshold.component.html',
  styleUrl: './threshold.component.scss'
})
export class ThresholdComponent {
  active = 1;
}
