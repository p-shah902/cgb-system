import { Component, inject } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cgb',
  standalone: true,
  imports: [NgbToastModule,CommonModule],
  templateUrl: './cgb.component.html',
  styleUrl: './cgb.component.scss'
})
export class CgbComponent {

  public toastService=inject(ToastService)

}
