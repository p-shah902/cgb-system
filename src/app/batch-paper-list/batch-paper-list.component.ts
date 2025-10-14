import {
  Component,
  inject,
  ViewChild,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { CommonModule, DatePipe, NgForOf } from '@angular/common';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';

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
import {PaperConfig, PaperStatusType} from '../../models/paper';
import {LoginUser, UserDetails} from '../../models/user';
import { AuthService } from '../../service/auth.service';
import { Select2 } from 'ng-select2-component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { PaperconfigurationComponent } from '../paperconfiguration/paperconfiguration.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { SafeHtmlDirective } from '../../directives/safe-html.directive';
import {UserService} from '../../service/user.service';
import {BatchService} from '../../service/batch.service';

@Component({
  selector: 'app-batch-paper-list',
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
    NgxSliderModule, ReactiveFormsModule

  ],
  templateUrl: './batch-paper-list.component.html',
  styleUrl: './batch-paper-list.component.scss',
})
export class BatchPaperListComponent implements OnInit {
  @ViewChild('dropdownRef') dropdownRef!: NgbDropdown;
  private paperConfigService = inject(PaperConfigService);
  public router = inject(Router);
  filter: PaperFilter = {
    orderType: 'DESC',
  };
  paperList: PaperConfig[] = [];
  batchPaperList: any[] = [];
  userDetails: any[] = [];
  creatPaperList: any[] = [];
  aToZ: string = 'Z A';
  user: LoginUser | null = null;
  isLoading: boolean = false;
  isCreating: boolean = false;
  form: any = {
    papers: [],
    pdm: null,
    name: ""
  }

  constructor(
    private authService: AuthService,
    public toastService: ToastService,
    private userService: UserService,
    private batchPaperService: BatchService
  ) {
    this.authService.userDetails$.subscribe((d) => {
      this.user = d;
    });
  }

  ngOnInit(): void {
    this.loadPaperConfigList();
    this.loadUserDetails();
    this.loadBatchPapersList();
  }

  loadUserDetails() {
    this.userService.getUserDetailsList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const dataList = response.data && response.data.length > 0 ? response.data.filter(item => item.isActive) : [];
          this.userDetails = dataList.filter(f => f.roleName === 'PDM').map(d => ({value: d.id, label: d.displayName}));
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  loadPaperConfigList() {
    this.paperConfigService.getPaperConfigList({
      orderType: 'DESC',
      statusIds: []
    }).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperList = response.data.filter((paper: any) =>
            !paper.statusName?.toLowerCase().includes('draft') && paper.paperType !== 'Batch Paper'
          );
          this.creatPaperList = this.paperList.map(paper => ({value: paper.paperID, label: paper.description}))
        }
      },
      error: (error) => {
        console.log('error', error);
      }
    });
  }

  loadBatchPapersList() {
    this.isLoading = true;
    this.batchPaperService.getBatchPapersList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.batchPaperList = response.data;
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

  togalOrder() {
    this.aToZ = this.aToZ.split('').reverse().join('');
    const order = this.filter.orderType;
    if ('ASC' === order) {
      this.filter.orderType = 'DESC';
    } else {
      this.filter.orderType = 'ASC';
    }
    this.loadPaperConfigList()
  }

  private readonly _mdlSvc = inject(NgbModal);

  open(event: Event, content: TemplateRef<any>) {
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
  }

  openPage(value: any, modal: any) {
    this.router.navigate([value.value]);
    modal.close('Save click')
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove non-word characters
      .replace(/\s+/g, '-')     // Replace spaces with dashes
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

  addBatchPaper(modal: any) {
    if (!this.form.name) {
      this.toastService.show("Please enter batch paper name", "warning");
      return;
    }
    if (!this.form.pdm) {
      this.toastService.show("Please select batch paper PDM", "warning");
      return;
    }
    if (this.form.papers.length <= 0) {
      this.toastService.show("Please select papers to create batch paper", "warning");
      return;
    }
    this.isCreating = true;
    this.batchPaperService.createBatchPaper({
      "paperId": this.form.papers,
      "paperProvision": this.form.name,
      "pdManagerName": this.form.pdm,
      "purposeRequired": 'batch'
    }).subscribe({
      next: (response) => {
        this.loadBatchPapersList();
        modal.close('Save click');
      },
      error: (error) => {
        let errors = error.error.errors;
        let firstError = Object.keys(errors)[0];
        this.toastService.show(errors[firstError][0] || "Error creating batch paper.", "danger");
        this.isCreating = false;
      },
      complete: () => {
        this.isCreating = false;
      }
    })
  }

  update(event: any, key: any) {
    this.form[key] = event.value;
  }

}
