import { Component } from '@angular/core';
import {DatePipe, NgForOf} from '@angular/common';
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-paper-list',
  standalone: true,
  imports: [
    DatePipe,
    NgForOf,
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle
  ],
  templateUrl: './paper-list.component.html',
  styleUrl: './paper-list.component.scss'
})
export class PaperListComponent {

}
