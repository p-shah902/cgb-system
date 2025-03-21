import {Component, inject} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddNewRoleComponent} from '../add-new-role/add-new-role.component';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-roleaccess',
  standalone: true,
  imports: [NgbAccordionModule],
  templateUrl: './roleaccess.component.html',
  styleUrl: './roleaccess.component.scss'
})
export class RoleaccessComponent {
  private readonly _mdlSvc = inject(NgbModal);

  newRole() {
    const modalRef = this._mdlSvc.open(AddNewRoleComponent,{ centered: true,modalDialogClass: 'custom-modal' });

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
