import {Component, inject} from '@angular/core';
import {NgbModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ApprovePaperComponent} from '../approve-paper/approve-paper.component';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-approve-request',
  standalone: true,
  imports: [NgbToastModule,CommonModule],
  templateUrl: './approve-request.component.html',
  styleUrl: './approve-request.component.scss'
})
export class ApproveRequestComponent {
  private readonly _mdlSvc = inject(NgbModal);
  public toastService=inject(ToastService)

  approvePaper() {
    const modalRef = this._mdlSvc.open(ApprovePaperComponent,{ centered: true,modalDialogClass: 'custom-modal' });

    modalRef.result.then((result) => {
      if (result) {
        console.log(result);
      }
    });
    // modalRef.componentInstance.passEntry.subscribe((receivedEntry) => {
    //   console.log(receivedEntry);
    // })
  }
}
