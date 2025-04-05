import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import {CommonModule, DatePipe, NgForOf} from '@angular/common';
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
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
import { PaperconfigurationComponent } from '../paperconfiguration/paperconfiguration.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

@Component({
  selector: 'app-paper-list',
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
    PaperconfigurationComponent,
    SafeHtmlPipe,

  ],
  templateUrl: './paper-list.component.html',
  styleUrl: './paper-list.component.scss'
})
export class PaperListComponent implements OnInit {

  private paperConfigService = inject(PaperConfigService);
    private paperService = inject(PaperService);
    public router = inject(Router);
    filter: PaperFilter;
    paperList: PaperConfig[] = [];
    isDesc = false;
    aToZ: string = 'A Z';
    user: LoginUser | null = null;
    approvalRemark: string = '';
    reviewBy: string = '';
    selectedPaper: number = 0;
    isLoading:boolean=false
    isCardView:boolean=false


    constructor(private authService: AuthService,public toastService:ToastService) {
      this.filter = {
        statusIds: [],
        orderType: "ASC"
      }
      this.authService.userDetails$.subscribe(d => {
        this.user = d;
      })
    }

    togalView(){
      this.isCardView=!this.isCardView
    }

    ngOnInit(): void {
      this.loadPaperConfigList();
    }

    loadPaperConfigList() {
      this.isLoading=true
      this.paperConfigService.getPaperConfigList(this.filter).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            this.paperList = response.data;
            console.log('paper List', this.paperList);
          }
        }, error: (error) => {
          console.log('error', error);
        },complete:()=>{
          this.isLoading=false;
        }
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

    isDisabled(status: string): boolean {
      return status.toLowerCase().includes('approved');
    }

    togalOrder() {
      this.isDesc = !this.isDesc;
      this.aToZ = this.aToZ.split('').reverse().join('');
      const order = this.filter.orderType;
      if ('ASC' === order) {
        this.filter.orderType = 'DESC';
      } else {
        this.filter.orderType = 'ASC';
      }
      this.loadPaperConfigList();
    }


    private readonly _mdlSvc = inject(NgbModal);

    public paperListData: any = [
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

    open(event: Event, content: TemplateRef<any>, paperId?: number) {
      event.preventDefault();
      this._mdlSvc.open(content, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true,  // Ensure modal is centered
        size: 'lg'       // Adjust size as needed (sm, lg, xl)
      }).result.then(
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

    openPage(value: any, modal: any) {
      this.router.navigate([value.value]);
      modal.close('Save click')
    }

    approvePaper(modal: any, type: string) {
      if (this.selectedPaper > 0) {
        this.paperConfigService.approveRejectPaper({
          paperId: this.selectedPaper,
          remarks: this.reviewBy || '',
          description: this.approvalRemark,
          type: this.user?.roleName === 'PDM' ? "PDM Approval" : "Pre-CGB Approval",
          check: type,
        }).subscribe({
          next: (response) => {
            if (response.status && response.data) {
              modal.close('Save click');
              this.loadPaperConfigList();
            }
          }, error: (error) => {
            console.log('error', error);
          }
        });
      }
    }

    addReview(modal: any) {
      if (this.selectedPaper > 0) {
        this.paperService.addPaperCommentLogs({
          paperId: this.selectedPaper,
          logType: "Other",
          remarks: this.approvalRemark,
          description: this.approvalRemark,
          columnName: "",
          isActive: true
        }).subscribe({
          next: (response) => {
            if (response.status && response.data) {
              modal.close('Save click');
            }
          }, error: (error) => {
            console.log('error', error);
          }
        });
      }
    }

}
