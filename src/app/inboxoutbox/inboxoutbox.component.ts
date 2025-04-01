import { Component, inject } from '@angular/core';
import { NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-inboxoutbox',
  standalone: true,
  imports: [NgbNavModule,NgbToastModule,CommonModule],
  templateUrl: './inboxoutbox.component.html',
  styleUrl: './inboxoutbox.component.scss'
})
export class InboxoutboxComponent {

  public toastService=inject(ToastService)
  active = 1;
}
