import { Component, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DummyCompComponent } from '../dummy-comp/dummy-comp.component';

@Component({
  selector: 'app-template1',
  standalone: true,
  imports: [],
  templateUrl: './template1.component.html',
  styleUrl: './template1.component.scss'
})
export class Template1Component {
  private readonly _mdlSvc = inject(NgbModal);

  openModal() {
    const modalRef = this._mdlSvc.open(DummyCompComponent);
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
