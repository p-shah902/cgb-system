import { Component, inject } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-internal-add',
  standalone: true,
  imports: [NgbToastModule,CommonModule],
  templateUrl: './internal-add.component.html',
  styleUrl: './internal-add.component.scss'
})
export class InternalAddComponent {

  public toastService=inject(ToastService)
}
