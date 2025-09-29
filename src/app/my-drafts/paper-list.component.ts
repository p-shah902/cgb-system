import {
  Component,
  inject,
  OnInit,
  TemplateRef,ViewChild
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
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { ToastService } from '../../service/toast.service';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { PaperService } from '../../service/paper.service';
import { Router, RouterLink } from '@angular/router';
import { PaperFilter } from '../../models/general';
import {PaperConfig, PaperStatusType} from '../../models/paper';
import { LoginUser } from '../../models/user';
import { AuthService } from '../../service/auth.service';
import { Select2 } from 'ng-select2-component';
import { FormsModule } from '@angular/forms';
import { PaperconfigurationComponent } from '../paperconfiguration/paperconfiguration.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { SafeHtmlDirective } from '../../directives/safe-html.directive';

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
    SafeHtmlDirective,NgxSliderModule

  ],
  templateUrl: './paper-list.component.html',
  styleUrl: './paper-list.component.scss',
})
export class PaperListComponent implements OnInit {
  @ViewChild('dropdownRef') dropdownRef!: NgbDropdown;
  private paperConfigService = inject(PaperConfigService);
  private paperService = inject(PaperService);
  public router = inject(Router);
  filter: PaperFilter = {
    statusIds: [],
    orderType: 'DESC',
    fromDate: '',
    toDate: '',
    priceMin: null,
    priceMax: null,
    sortLowToHigh: false,
    sortHighToLow: false,
  };
  paperList: PaperConfig[] = [];
  isDesc = false;
  aToZ: string = 'Z A';
  user: LoginUser | null = null;
  approvalRemark: string = '';
  reviewBy: string = '';
  selectedPaper: number = 0;
  isLoading: boolean = false;
  isCardView: boolean = false;
  isArchived: boolean = false;
  paperStatusList: PaperStatusType[] = [];
  isFilterApplied = false;
  tempFilter: PaperFilter = { ...this.filter };
  priceSliderOptions: Options = {
    floor: 0,
    ceil: 500,
    step: 10,
    translate: (value: number): string => `$${value}`
  };
  readonly allowedStatusNames = [
    'Approved by PDM',
    'On Pre-CGB',
    'Approved by Pre-CGB',
    'On CGB'
  ];
  tempPrice: number[] = [0, 0];  // Temporary values for slider

  constructor(
    private authService: AuthService,
    public toastService: ToastService
  ) {
    this.authService.userDetails$.subscribe((d) => {
      this.user = d;
    });
  }

  togalView() {
    this.isCardView = !this.isCardView;
  }

  ngOnInit(): void {
    this.loadPaperConfigList();
    this.loadPaperStatusListData()
  }

  private getCleanFilter(filter: PaperFilter): Partial<PaperFilter> {
    const cleaned: Partial<PaperFilter> = {};

    Object.entries(filter as Record<string, any>).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        // Skip priceMin and priceMax if both are 0
        if ((key === 'priceMin' || key === 'priceMax') &&
          filter.priceMin === 0 &&
          filter.priceMax === 0) {
          return;
        }

        // Skip sortLowToHigh and sortHighToLow if false
        if ((key === 'sortLowToHigh' || key === 'sortHighToLow') && value === false) {
          return;
        }

        cleaned[key as keyof PaperFilter] = value;
      }
    });

    return cleaned;
  }


  loadPaperConfigList() {
    this.isLoading = true;
    const cleanedFilter = this.getCleanFilter(this.filter);

    this.paperConfigService.getPaperConfigList(cleanedFilter).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperList = response.data.filter((paper: any) =>
            paper.statusName?.toLowerCase().includes('draft') && paper.paperType !== 'Batch Paper'
          );
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

  getStatusClassCardView(status: string): string {
    if (status.toLowerCase().includes('approved')) {
      return 'status-green';
    } else if (status.toLowerCase().includes('waiting')) {
      return 'status-blue';
    } else {
      return 'status-red';
    }
  }

  isDisabled(status: string): boolean {
    return status.toLowerCase().includes('approved');
  }

  loadPaperStatusListData() {
    this.paperService.getPaperStatusList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperStatusList = response.data.filter((status: any) =>
            this.allowedStatusNames.includes(status.paperStatus)
          );
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
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
    this.isArchived ? this.sortArchivedPaper() : this.loadPaperConfigList();
  }

  private readonly _mdlSvc = inject(NgbModal);

  public paperListData: any = [
    {
      value: '/approach-to-market',
      label: 'Approach to Market',
    },
    {
      value: '/contract-award',
      label: 'Contract Award',
    },
    {
      value: '/variation-paper',
      label: 'Variation Paper',
    },
    {
      value: '/approval-of-sale-disposal-form',
      label: 'Approval of Sale / Disposal Form',
    },
    {
      value: '/info-note',
      label: 'Info note',
    },
  ];

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
    if (this.selectedPaper > 0) {
      this.paperService.addPaperCommentLogs({
        paperId: this.selectedPaper,
        logType: 'Other',
        remarks: this.approvalRemark,
        description: this.approvalRemark,
        columnName: '',
        isActive: true,
      })
        .subscribe({
          next: (response) => {
            if (response.status && response.data) {
              modal.close('Save click');
            }
          },
          error: (error) => {
            console.log('error', error);
          },
        });
    }
  }

  togalArchived() {
    this.isArchived = !this.isArchived;
    this.isArchived ? this.getArchivePaperList() : this.loadPaperConfigList();
  }

  getArchivePaperList() {
    this.isLoading = true;
    this.paperConfigService.getArchivePaperList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperList = response.data;
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

  sortArchivedPaper() {
    this.paperList.sort((a, b) => {
      const nameA = a.purposeTitle.toLowerCase();
      const nameB = b.purposeTitle.toLowerCase();

      if (nameA < nameB) return this.isDesc ? 1 : -1;
      if (nameA > nameB) return this.isDesc ? -1 : 1;
      return 0;
    });

  }

  sortByDate() {
    this.paperList.sort((a, b) => {
      const dateA = new Date(a.lastModifyDate).getTime();
      const dateB = new Date(b.lastModifyDate).getTime();
      return dateB - dateA;
    });
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

  goToPreview(paper: any): void {
    const routePath = this.slugify(paper.paperType);

    this.router.navigate([`/preview/${routePath}`, paper.paperID]);
  }

  openDropdown() {
    this.tempFilter = JSON.parse(JSON.stringify(this.filter));
    setTimeout(() => this.syncSwitchesWithTemp(), 0);
  }

  clearDates(): void {
    this.tempFilter.fromDate = '';
    this.tempFilter.toDate = '';
  }

  clearStatusFilters(): void {
    this.tempFilter.statusIds = [];
  }

  clearPriceFilters(): void {
    this.tempFilter.sortLowToHigh = false;
    this.tempFilter.sortHighToLow = false;
    this.tempPrice = [0, 0];
    this.tempFilter = {
      ...this.tempFilter,
      priceMin: 0,
      priceMax: 0
    };
  }


  clearAllFilters(): void {
    this.clearDates();
    this.clearStatusFilters();
    this.clearPriceFilters();
    this.syncSwitchesWithTemp();
    this.isFilterApplied = false;
    this.filter = JSON.parse(JSON.stringify(this.tempFilter));
    this.dropdownRef.close();
    this.loadPaperConfigList();
  }



  onSortChange(type: 'low' | 'high') {
    if (type === 'low') {
      this.tempFilter.sortLowToHigh = true;
      this.tempFilter.sortHighToLow = false;
    } else {
      this.tempFilter.sortLowToHigh = false;
      this.tempFilter.sortHighToLow = true;
    }
  }


  applyFilters(): void {
    this.tempFilter = {
      ...this.tempFilter,
      priceMin: this.tempPrice[0],
      priceMax: this.tempPrice[1]
    };
    this.filter = JSON.parse(JSON.stringify(this.tempFilter));
    this.isFilterApplied = true;
    this.dropdownRef.close();
    this.loadPaperConfigList();
  }

  cancelFilters(): void {
    this.dropdownRef.close(); // Do NOT modify `filter`
  }

  onSwitchChange(event: Event, statusType: string): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const status = this.paperStatusList.find(item => item.paperStatus === statusType);
    if (!status) return;

    const statusId = status.id;
    if (isChecked) {
      if (!this.tempFilter.statusIds?.includes(statusId)) {
        this.tempFilter.statusIds?.push(statusId);
      }
    } else {
      this.tempFilter.statusIds = (this.tempFilter.statusIds || []).filter(id => id !== statusId);
    }
  }

  syncSwitchesWithTemp(): void {
    const switches = document.querySelectorAll('.form-check-input') as NodeListOf<HTMLInputElement>;
    switches.forEach(switchEl => {
      const statusType = switchEl.id.replace('flt-sw', '');
      const label = this.getStatusLabelById(statusType);
      const status = this.paperStatusList.find(s => s.paperStatus === label);
      if (status) {
        switchEl.checked = this.tempFilter.statusIds?.includes(status.id) || false;
      }
    });
  }
  getStatusLabelById(suffix: string): string {
    const map: { [key: string]: string } = {
      '1': 'Approved by PDM',
      '2': 'On Pre-CGB',
      '3': 'Approved by Pre-CGB',
      '4': 'On CGB'
    };
    return map[suffix] || '';
  }
}
