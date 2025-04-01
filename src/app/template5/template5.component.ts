import { Component, inject } from '@angular/core';
import { ToastService } from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-template5',
  standalone: true,
  imports: [NgbToastModule,CommonModule],
  templateUrl: './template5.component.html',
  styleUrl: './template5.component.scss'
})
export class Template5Component {
  public toastService=inject(ToastService)
}
