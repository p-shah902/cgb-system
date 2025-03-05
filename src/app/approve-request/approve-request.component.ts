import {Component, inject} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ApprovePaperComponent} from '../approve-paper/approve-paper.component';

@Component({
  selector: 'app-approve-request',
  standalone: true,
  imports: [],
  templateUrl: './approve-request.component.html',
  styleUrl: './approve-request.component.scss'
})
export class ApproveRequestComponent {
  private readonly _mdlSvc = inject(NgbModal);

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
