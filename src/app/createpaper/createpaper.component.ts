import { Component, inject } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-createpaper',
  standalone: true,
  imports: [NgbToastModule,CommonModule],
  templateUrl: './createpaper.component.html',
  styleUrl: './createpaper.component.scss'
})
export class CreatepaperComponent {

  public toastService=inject(ToastService)

}
