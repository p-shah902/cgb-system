import {
  Component,
  inject,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { CommonModule, DatePipe, NgForOf } from '@angular/common';
import {
  NgbDropdown,
  NgbDropdownItem,
  NgbDropdownMenu,
  NgbDropdownToggle,
  NgbModal,
  NgbToastModule,
} from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { PaperService } from '../../service/paper.service';
import { Router, RouterLink } from '@angular/router';
import { PaperFilter } from '../../models/general';
import { PaperConfig } from '../../models/paper';
import { LoginUser } from '../../models/user';
import { AuthService } from '../../service/auth.service';
import { Select2 } from 'ng-select2-component';
import { FormsModule } from '@angular/forms';
import { SafeHtmlDirective } from '../../directives/safe-html.directive';

@Component({
  selector: 'app-pre-cgb-review',
  standalone: true,
  imports: [
    DatePipe,
    NgForOf,
    NgbDropdown,
    NgbDropdownItem,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgbToastModule,
    CommonModule,
    Select2,
    FormsModule,
    RouterLink,
    SafeHtmlDirective,
  ],
  templateUrl: './pre-cgb-review.component.html',
  styleUrl: './pre-cgb-review.component.scss',
})
export class PreCgbReviewComponent implements OnInit {
  private paperConfigService = inject(PaperConfigService);
  private paperService = inject(PaperService);
  public router = inject(Router);
  filter: PaperFilter;
  paperList: PaperConfig[] = [];
  user: LoginUser | null = null;
  approvalRemark: string = '';
  reviewBy: string = '';
  selectedPaper: any = '';
  isLoading: boolean = false;
  openType: string = '';

  constructor(
    private authService: AuthService,
    public toastService: ToastService
  ) {
    this.filter = {
      statusIds: [6],
      orderType: 'ASC',
    };
    this.authService.userDetails$.subscribe((d) => {
      this.user = d;
    });
  }

  ngOnInit(): void {
    this.loadPaperConfigList();
  }

  loadPaperConfigList() {
    this.isLoading = true;
    this.paperConfigService.getPaperConfigList(this.filter).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperList = response.data.filter((paper: any) =>
            paper.statusName?.toLowerCase().includes('pre-cgb')
          );
          this.sortByDate();
        }
      },
      error: (error) => {
        console.log('error', error);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  getStatusClass(status: string): string {
    if (status.toLowerCase().includes('approved')) {
      return 'p-approved';
    } else if (status.toLowerCase().includes('waiting')) {
      return 'p-waiting';
    } else {
      return 'p-archive';
    }
  }

  private readonly _mdlSvc = inject(NgbModal);

  open(event: Event, content: TemplateRef<any>, paper: any, type: string) {
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
          this.approvalRemark = "";
        },
        (reason) => {
          // Handle modal dismiss
          this.approvalRemark = "";
        }
      );

    if (paper) {
      this.selectedPaper = paper;
    }
    this.openType = type;
  }

  approvePaper(modal: any, type: string) {
    if (this.selectedPaper > 0) {
      this.paperConfigService.approveRejectPaper({
        paperId: this.selectedPaper,
        remarks: this.reviewBy || '',
        description: this.approvalRemark,
        type:
          this.user?.roleName === 'PDM' ? 'PDM Approval' : 'Pre-CGB Approval',
        check: type,
      })
        .subscribe({
          next: (response) => {
            if (response.status && response.data) {
              modal.close('Save click');
              this.loadPaperConfigList();
            }
          },
          error: (error) => {
            console.log('error', error);
          },
        });
    }
  }

  addReview(modal: any) {
    if (this.selectedPaper) {
      this.paperConfigService.updateMultiplePaperStatus([{
        paperId: this.selectedPaper.paperID,
        existingStatusId: this.selectedPaper.statusId,
        statusId: this.openType === 'approve' ? 7 : this.openType === 'widthdraw' ? 9 : 8,
        emailRemarks: this.approvalRemark
      }]).subscribe({
        next: (response) => {
          modal.close('Save click');
          this.toastService.show('Paper status updated successfully');
          this.loadPaperConfigList();
        }, error: (error) => {
          console.log('error', error);
        }
      });
    }
  }

  sortByDate() {
    this.paperList.sort((a, b) => {
      const dateA = new Date(a.lastModifyDate).getTime();
      const dateB = new Date(b.lastModifyDate).getTime();
      return dateB - dateA;
    });
  }

}
