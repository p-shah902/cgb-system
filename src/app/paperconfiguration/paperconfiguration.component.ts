import {Component, inject, TemplateRef} from '@angular/core';
import {Select2} from 'ng-select2-component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';

@Component({
  selector: 'app-paperconfiguration',
  standalone: true,
  imports: [
    Select2
  ],
  templateUrl: './paperconfiguration.component.html',
  styleUrl: './paperconfiguration.component.scss'
})
export class PaperconfigurationComponent {

  constructor(private router: Router) {
  }

  private readonly _mdlSvc = inject(NgbModal);

  public paperList: any = [
    {
      value: '/approach-to-market',
      label: 'Approach to Market'
    },
    {
      value: '/contract-award',
      label: 'Contact Award'
    },
    {
      value: '/contract-variation-or-amendment-approval',
      label: 'Variation Paper'
    },
    {
      value: '/approval-of-sale-disposal-form',
      label: 'Approval of Sale / Disposal Form'
    },
    {
      value: '/info-note',
      label: 'Info note'
    }
  ];

  open(event: any, content: TemplateRef<any>) {
    event.preventDefault();
    this._mdlSvc.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then(
      (result) => {

      },
      (reason) => {

      },
    );
  }

  openPage(value: any, modal: any) {
    this.router.navigate([value.value]);
    modal.close('Save click')
  }
}
