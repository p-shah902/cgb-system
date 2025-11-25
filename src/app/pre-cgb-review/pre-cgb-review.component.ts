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
import { GetPaperConfigurationsListRequest, PaperFilter } from '../../models/general';
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
  gotoPaper(paperId: any, type: string) {
    let route = 'preview/approach-to-market';
    if (type === 'Contract Award') {
      route = 'preview/contract-award';
    }
    this.router.navigate([route, paperId])
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word characters
      .replace(/\s+/g, '-')     // Replace spaces with dashes
  }

  goToPreview(paper: any): void {
    const routePath = this.slugify(paper.paperType);

    this.router.navigate([`/preview/${routePath}`, paper.paperID]);
  }

  goToApproachToMarket(paper: any, isCopy: boolean = false): void {
    const routePath = this.slugify(paper.paperType);

    const queryParams: any = {};
    if (isCopy) {
      queryParams.isCopy = 'true';
    }

    this.router.navigate([`/${routePath}`, paper.paperID], {
      queryParams: queryParams
    });
  }

  ngOnInit(): void {
    this.loadPaperConfigList();
  }

  loadPaperConfigList() {
    this.isLoading = true;
    
    // Build request payload with pagination
    const request: GetPaperConfigurationsListRequest = {
      filter: this.filter,
      paging: {
        start: 0,
        length: 1000 // Large number to get all matching results
      }
    };
    
    this.paperConfigService.getPaperConfigList(request).subscribe({
      next: (response) => {
        // Check if response has errors (e.g., "No paper configurations found")
        if (response.errors && Object.keys(response.errors).length > 0) {
          // Handle error response gracefully
          this.paperList = [];
          this.isLoading = false;
          return;
        }
        
        if (response.status && response.data && response.data.length > 0) {
          this.paperList = response.data.filter((paper: any) =>
            paper.statusName?.toLowerCase().includes('pre-cgb')
          );
          this.sortByDate();
        } else {
          // No data returned
          this.paperList = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.log('error', error);
        // On error, set empty array and stop loading
        this.paperList = [];
        this.isLoading = false;
        this.toastService.showError(error);
      },
      complete: () => {
        // Ensure loading is always stopped
        this.isLoading = false;
      },
    });
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('approved')) {
      return 'p-approved';
    } else if (statusLower.includes('draft')) {
      return 'p-draft';
    } else if (statusLower.includes('registered')) {
      return 'p-registered';
    } else if (statusLower.includes('waiting') || statusLower.includes('on pre-cgb') || statusLower.includes('on cgb') || statusLower.includes('action required')) {
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
      const dateA = a.lastModifyDate || (a as any).createdDate;
      const dateB = b.lastModifyDate || (b as any).createdDate;
      
      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime(); // DESC (newest first)
      }
      
      // Fallback to paperID if dates are null
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      return b.paperID - a.paperID; // DESC (newest first)
    });
  }

  isPreCGBMember(): boolean {
    const roleName = this.user?.roleName;
    // Hide Approve, Withdraw, Action Required for Secretary and Super Admin
    // Show only for Pre-CGB members (CGB Chair, CPO, JV Admin, Legal VP-1, Performance Manager, etc.)
    if (!roleName) {
      return false;
    }
    // Exclude Secretary and Super Admin
    if (roleName === 'Secretary' || roleName === 'Super Admin') {
      return false;
    }
    // Include Pre-CGB member roles
    const preCGBRoles = [
      'CGB Chair',
      'JV Admin',
      'Legal VP-1',
      'Performance Manager',
    ];
    return preCGBRoles.includes(roleName);
  }

}
