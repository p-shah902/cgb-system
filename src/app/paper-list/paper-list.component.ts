import { Component, inject } from '@angular/core';
import {CommonModule, DatePipe, NgForOf} from '@angular/common';
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';

@Component({
  selector: 'app-paper-list',
  standalone: true,
  imports: [
    DatePipe,
    NgForOf,
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbToastModule,
    CommonModule
  ],
  templateUrl: './paper-list.component.html',
  styleUrl: './paper-list.component.scss'
})
export class PaperListComponent {

  public toastService=inject(ToastService)

}
