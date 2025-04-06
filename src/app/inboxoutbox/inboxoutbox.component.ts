import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {NgbDropdownItem, NgbModal, NgbNavModule, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from '../../service/toast.service';
import {CommonModule} from '@angular/common';
import {InboxOutbox} from '../../models/inbox-outbox';
import {InboxOutboxService} from '../../service/inbox-outbox.service';
import {RouterLink} from '@angular/router';
import {LoginUser} from '../../models/user';
import {AuthService} from '../../service/auth.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PaperConfigService} from '../../service/paper/paper-config.service';

@Component({
  selector: 'app-inboxoutbox',
  standalone: true,
  imports: [NgbNavModule, NgbToastModule, CommonModule, RouterLink, FormsModule],
  templateUrl: './inboxoutbox.component.html',
  styleUrl: './inboxoutbox.component.scss'
})
export class InboxoutboxComponent implements OnInit {

  public toastService = inject(ToastService)

  private paperConfigService = inject(PaperConfigService);
  active = 1;
  inboxData: InboxOutbox[] = [];
  outboxData: InboxOutbox[] = [];
  loggedInUser: LoginUser | null = null
  approvalRemark: string = '';
  selectedPaper: number = 0;
  reviewBy: string = '';

  private readonly _mdlSvc = inject(NgbModal);

  constructor(private inboxOutboxService: InboxOutboxService, private authService: AuthService) {
    this.loggedInUser = this.authService.getUser();
  }

  ngOnInit() {
    this.getInboxOutBox()
  }

  getInboxOutBox() {
    this.inboxOutboxService.getPaperInboxOutbox().subscribe({
      next: response => {
        if (response.status && response.data) {
          this.inboxData = response.data.inBox;
          this.outboxData = response.data.outBox;
        }
      },
      error: err => {
        console.log('ERROR', err);
      }
    })
  }

  approvePaper(modal: any, type: string) {
    if (this.selectedPaper > 0) {
      this.paperConfigService.approveRejectPaper({
        paperId: this.selectedPaper,
        remarks: this.reviewBy || '',
        description: this.approvalRemark,
        type:
          this.loggedInUser?.roleName === 'PDM' ? 'PDM Approval' : 'Pre-CGB Approval',
        check: type,
      })
        .subscribe({
          next: (response) => {
            if (response.status && response.data) {
              modal.close('Save click');
              this.getInboxOutBox();
            }
          },
          error: (error) => {
            console.log('error', error);
          },
        });
    }
  }

  open(event: Event, content: TemplateRef<any>, paperId?: number) {
    event.preventDefault();
    this._mdlSvc
      .open(content, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true, // Ensure modal is centered
        size: 'lg', // Adjust size as needed (sm, lg, xl)
      })
      .result.then(
      (result) => {
        // Handle modal close
      },
      (reason) => {
        // Handle modal dismiss
      }
    );

    if (paperId) {
      this.selectedPaper = paperId;
    }
  }
}
