import { Component, inject } from '@angular/core';
import { ToastService } from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-template3',
  standalone: true,
  imports: [NgbToastModule,CommonModule],
  templateUrl: './template3.component.html',
  styleUrl: './template3.component.scss'
})
export class Template3Component {
  public toastService=inject(ToastService)
}
