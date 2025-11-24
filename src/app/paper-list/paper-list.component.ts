import {
  Component,
  inject,
  ViewChild,
  OnInit,
  AfterViewInit,
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
import { GetPaperConfigurationsListRequest, PaperFilter } from '../../models/general';
import { forkJoin } from 'rxjs';
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
export class PaperListComponent implements OnInit, AfterViewInit {
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
  allPaperList: PaperConfig[] = []; // Store all papers for frontend filtering
  filteredPaperList: PaperConfig[] = []; // Filtered papers
  paginatedPaperList: PaperConfig[] = []; // Paginated papers
  searchText: string = ''; // Search input value
  totalItems: number = 0; // Total count after filtering
  isDesc = false;
  aToZ: string = 'Z A';
  user: LoginUser | null = null;
  approvalRemark: string = '';
  reviewBy: string = '';
  selectedPaper: number = 0;
  isLoading: boolean = false;
  isCardView: boolean = false;
  isArchived: boolean = false;
  isFilterApplied = false;
  paperStatusList: PaperStatusType[] = [];
  tempFilter: PaperFilter = { ...this.filter };
  priceSliderOptions: Options = {
    floor: 0,
    ceil: 1000, // Will be updated dynamically
    step: 10,
    translate: (value: number): string => `$${value}`
  };
  tempPrice: number[] = [0, 0];  // Temporary values for slider
  
  // Sorting state
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10; // Default page size
  pageSizeOptions: number[] = [10, 25, 50, 100];

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
    this.loadPaperStatusListData();
    // Initialize filter applied status
    this.updateFilterAppliedStatus();
  }

  ngAfterViewInit(): void {
    // Ensure dropdown starts closed after view is initialized
    // Use multiple checks to ensure it closes
    setTimeout(() => {
      if (this.dropdownRef) {
        // Force close the dropdown
        if (this.dropdownRef.isOpen()) {
          this.dropdownRef.close();
        }
        // Also force the internal state
        try {
          (this.dropdownRef as any)._open = false;
          (this.dropdownRef as any)._isOpen = false;
        } catch (e) {
          // Ignore if property doesn't exist
        }
      }
    }, 0);
    
    // Additional check after a longer delay to catch any delayed opening
    setTimeout(() => {
      if (this.dropdownRef) {
        if (this.dropdownRef.isOpen()) {
          this.dropdownRef.close();
        }
      }
    }, 300);
    
    // Final check after view is fully rendered
    setTimeout(() => {
      if (this.dropdownRef && this.dropdownRef.isOpen()) {
        this.dropdownRef.close();
      }
    }, 500);
  }

  onDropdownOpenChange(isOpen: boolean) {
    if (isOpen) {
      // Only sync when opening, not when closing
      this.tempFilter = JSON.parse(JSON.stringify(this.filter));
      // Sync tempPrice with filter prices, or use dynamic range if no filter applied
      if (this.filter.priceMin && this.filter.priceMax && 
          (this.filter.priceMin > 0 || this.filter.priceMax > 0)) {
        this.tempPrice = [
          this.filter.priceMin || this.priceSliderOptions.floor || 0,
          this.filter.priceMax || this.priceSliderOptions.ceil || 1000
        ];
      } else {
        // Use dynamic range if no price filter is applied
        this.tempPrice = [
          this.priceSliderOptions.floor || 0,
          this.priceSliderOptions.ceil || 1000
        ];
      }
      setTimeout(() => this.syncSwitchesWithTemp(), 0);
    }
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
    
    // Load all data without filters for frontend filtering
    const request: GetPaperConfigurationsListRequest = {
      filter: {
        orderType: 'DESC'
      },
      paging: {
        start: 0,
        length: 10000 // Large number to get all records
      }
    };

    this.paperConfigService.getPaperConfigList(request).subscribe({
      next: (data) => {
        if (data.status && data.data) {
          // Filter out batch papers and draft papers
          this.allPaperList = data.data.filter((paper: any) => {
            const isBatchPaper = paper.paperType === 'Batch Paper';
            const isDraft = paper.statusName?.toLowerCase().includes('draft');
            return !isBatchPaper && !isDraft;
          });
          
          // Sort by lastModifyDate (newest first)
          this.allPaperList.sort((a: any, b: any) => {
            if (a.lastModifyDate && b.lastModifyDate) {
              return new Date(b.lastModifyDate).getTime() - new Date(a.lastModifyDate).getTime(); // DESC (newest first)
            }
            
            // Fallback to paperID if dates are null
            if (a.lastModifyDate && !b.lastModifyDate) return -1;
            if (!a.lastModifyDate && b.lastModifyDate) return 1;
            return b.paperID - a.paperID; // DESC (newest first)
          });
          
          // Update price slider options based on actual contract values
          this.updatePriceSliderOptions();
        } else {
          this.allPaperList = [];
          // Reset to default values if no data
          this.priceSliderOptions = {
            floor: 0,
            ceil: 1000,
            step: 10,
            translate: (value: number): string => `$${value}`
          };
          this.tempPrice = [0, 0];
        }
        
        // Apply frontend filters
        this.applyFrontendFilters();
      },
      error: (error) => {
        console.log('error', error);
        this.allPaperList = [];
        this.filteredPaperList = [];
        this.paginatedPaperList = [];
        this.totalItems = 0;
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  applyFrontendFilters(): void {
    // Sync tempFilter to filter so it persists when reopening modal
    this.filter = JSON.parse(JSON.stringify(this.tempFilter));
    
    // Start with all papers
    let filtered = [...this.allPaperList];
    
    // Apply search filter
    if (this.searchText && this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(paper =>
        paper.description?.toLowerCase().includes(searchLower) ||
        paper.paperType?.toLowerCase().includes(searchLower) ||
        paper.statusName?.toLowerCase().includes(searchLower) ||
        paper.purposeTitle?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (this.filter.statusIds && this.filter.statusIds.length > 0) {
      filtered = filtered.filter(paper =>
        this.filter.statusIds!.includes(paper.statusId)
      );
    }
    
    // Apply date filter
    if (this.filter.fromDate && this.filter.fromDate !== '') {
      const fromDate = new Date(this.filter.fromDate);
      filtered = filtered.filter(paper => {
        const paperDate = new Date(paper.lastModifyDate);
        return paperDate >= fromDate;
      });
    }
    
    if (this.filter.toDate && this.filter.toDate !== '') {
      const toDate = new Date(this.filter.toDate);
      toDate.setHours(23, 59, 59, 999); // Include entire day
      filtered = filtered.filter(paper => {
        const paperDate = new Date(paper.lastModifyDate);
        return paperDate <= toDate;
      });
    }
    
    // Apply price filter
    if (this.filter.priceMin && this.filter.priceMin > 0) {
      filtered = filtered.filter(paper =>
        (paper.totalContractValue || 0) >= this.filter.priceMin!
      );
    }
    
    if (this.filter.priceMax && this.filter.priceMax > 0) {
      filtered = filtered.filter(paper =>
        (paper.totalContractValue || 0) <= this.filter.priceMax!
      );
    }
    
    // Apply sorting
    if (this.filter.sortLowToHigh) {
      filtered.sort((a, b) => (a.totalContractValue || 0) - (b.totalContractValue || 0));
    } else if (this.filter.sortHighToLow) {
      filtered.sort((a, b) => (b.totalContractValue || 0) - (a.totalContractValue || 0));
    } else if (this.sortColumn) {
      // Column-based sorting
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (this.sortColumn) {
          case 'title':
            aValue = a.description?.toLowerCase() || '';
            bValue = b.description?.toLowerCase() || '';
            break;
          case 'paperType':
            aValue = a.paperType?.toLowerCase() || '';
            bValue = b.paperType?.toLowerCase() || '';
            break;
          case 'contractValue':
            aValue = a.totalContractValue || 0;
            bValue = b.totalContractValue || 0;
            break;
          case 'status':
            aValue = a.statusName?.toLowerCase() || '';
            bValue = b.statusName?.toLowerCase() || '';
            break;
          case 'lastModify':
            aValue = new Date(a.lastModifyDate).getTime();
            bValue = new Date(b.lastModifyDate).getTime();
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sorting by last modify date (DESC)
      filtered.sort((a, b) => {
        const dateA = new Date(a.lastModifyDate).getTime();
        const dateB = new Date(b.lastModifyDate).getTime();
        return dateB - dateA;
      });
    }
    
    // Store filtered results
    this.filteredPaperList = filtered;
    this.totalItems = filtered.length;
    
    // Check if any filters are applied
    this.updateFilterAppliedStatus();
    
    // Apply pagination
    this.updatePagination();
  }
  
  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedPaperList = this.filteredPaperList.slice(start, end);
    this.paperList = this.paginatedPaperList;
  }
  
  updateFilterAppliedStatus(): void {
    // Check if any filters are active
    const hasStatusFilter = !!(this.filter.statusIds && this.filter.statusIds.length > 0);
    const hasDateFilter = !!(this.filter.fromDate && this.filter.fromDate !== '') || 
                         !!(this.filter.toDate && this.filter.toDate !== '');
    const hasPriceFilter = !!(this.filter.priceMin && this.filter.priceMin > 0) || 
                          !!(this.filter.priceMax && this.filter.priceMax > 0);
    const hasSortFilter = !!(this.filter.sortLowToHigh || this.filter.sortHighToLow);
    const hasSearchFilter = !!(this.filter.title && this.filter.title.trim() !== '');
    
    this.isFilterApplied = hasStatusFilter || hasDateFilter || hasPriceFilter || hasSortFilter || hasSearchFilter;
  }
  
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis logic
      if (this.currentPage <= 3) {
        // Show first pages
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (this.currentPage >= totalPages - 2) {
        // Show last pages
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      }
    }
    
    return pages;
  }
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updatePagination();
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.updatePagination();
    }
  }
  
  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
    this.updatePagination();
  }
  
  getTotalItems(): number {
    return this.totalItems;
  }
  
  getStartItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }
  
  getEndItem(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.totalItems ? this.totalItems : end;
  }

  onSearchChange(): void {
    // Reset to first page and apply filters
    this.currentPage = 1;
    this.applyFrontendFilters();
  }

  loadPaperStatusListData() {
    this.paperService.getPaperStatusList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          // Statuses to exclude from the filter list
          const excludedStatuses = [
            'Draft',
            'Archived',
            'Withdrawn by Pre-CGB',
            'Action Required by JV',
            'On Hold',
            'Partner Approval Done',
            'Approved by Partner'
          ];
          
          // Show all statuses except excluded ones
          this.paperStatusList = response.data.filter((status: any) =>
            !excludedStatuses.some(excluded => 
              status.paperStatus?.toLowerCase() === excluded.toLowerCase()
            )
          );
        }
      },
      error: (error) => {
        console.log('error', error);
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
    } else if (statusLower.includes('waiting')) {
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

  deletePaper(modal: any) {
    if (this.selectedPaper > 0) {
      this.isLoading = true;
      this.paperConfigService.deletePaperById(this.selectedPaper)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.status) {
              this.toastService.show(response.message || 'Paper deleted successfully', 'success');
              modal.close('Delete click');
              this.loadPaperConfigList();
            } else {
              this.toastService.show(response.message || 'Failed to delete paper', 'danger');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Delete error', error);
            this.toastService.show(error.error?.message || 'Failed to delete paper', 'danger');
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

  clearDates(): void {
    this.tempFilter.fromDate = '';
    this.tempFilter.toDate = '';
    this.currentPage = 1;
    this.applyFrontendFilters();
  }

  clearStatusFilters(): void {
    this.tempFilter.statusIds = [];
    this.currentPage = 1;
    this.applyFrontendFilters();
  }

  clearPriceFilters(): void {
    this.tempFilter.sortLowToHigh = false;
    this.tempFilter.sortHighToLow = false;
    // Reset to dynamic min/max values
    this.tempPrice = [
      this.priceSliderOptions.floor || 0,
      this.priceSliderOptions.ceil || 1000
    ];
    this.tempFilter = {
      ...this.tempFilter,
      priceMin: this.priceSliderOptions.floor || 0,
      priceMax: this.priceSliderOptions.ceil || 1000
    };
    this.currentPage = 1;
    this.applyFrontendFilters();
  }


  clearAllFilters(): void {
    this.clearDates();
    this.clearStatusFilters();
    this.clearPriceFilters();
    this.syncSwitchesWithTemp();
    
    // Clear search
    this.searchText = '';
    delete this.filter.title;
    
    // Clear column sorting when clearing all filters
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.filter.orderType = 'DESC';
    
    this.isFilterApplied = false;
    this.filter = JSON.parse(JSON.stringify(this.tempFilter));
    this.dropdownRef.close();
    this.currentPage = 1;
    this.applyFrontendFilters();
  }


  onSortChange(type: 'low' | 'high') {
    if (type === 'low') {
      this.tempFilter.sortLowToHigh = true;
      this.tempFilter.sortHighToLow = false;
    } else {
      this.tempFilter.sortLowToHigh = false;
      this.tempFilter.sortHighToLow = true;
    }
    // Clear column sorting when using price sorting
    this.sortColumn = '';
    this.currentPage = 1;
    this.applyFrontendFilters();
  }

  onDateChange(): void {
    // Update tempFilter with date changes
    this.tempFilter.fromDate = this.tempFilter.fromDate || '';
    this.tempFilter.toDate = this.tempFilter.toDate || '';
    this.currentPage = 1;
    this.applyFrontendFilters();
  }

  onPriceChange(): void {
    this.tempFilter = {
      ...this.tempFilter,
      priceMin: this.tempPrice[0],
      priceMax: this.tempPrice[1]
    };
    this.currentPage = 1;
    this.applyFrontendFilters();
  }

  cancelFilters(): void {
    // Reset tempFilter to current filter state when canceling
    this.tempFilter = JSON.parse(JSON.stringify(this.filter));
    // Sync tempPrice with filter prices, or use dynamic range if no filter applied
    if (this.filter.priceMin && this.filter.priceMax && 
        (this.filter.priceMin > 0 || this.filter.priceMax > 0)) {
      this.tempPrice = [
        this.filter.priceMin || this.priceSliderOptions.floor || 0,
        this.filter.priceMax || this.priceSliderOptions.ceil || 1000
      ];
    } else {
      // Use dynamic range if no price filter is applied
      this.tempPrice = [
        this.priceSliderOptions.floor || 0,
        this.priceSliderOptions.ceil || 1000
      ];
    }
    // Sync switches after resetting
    setTimeout(() => this.syncSwitchesWithTemp(), 0);
    if (this.dropdownRef) {
      this.dropdownRef.close();
    }
  }

  closeFilter(): void {
    // Simply close the dropdown without resetting filters
    if (this.dropdownRef && this.dropdownRef.isOpen()) {
      this.dropdownRef.close();
    }
  }

  onSwitchChange(event: Event, statusType: string): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    const status = this.paperStatusList.find(item => item.paperStatus === statusType);
    if (!status) return;

    const statusId = status.id;
    if (isChecked) {
      if (!this.tempFilter.statusIds) {
        this.tempFilter.statusIds = [];
      }
      if (!this.tempFilter.statusIds.includes(statusId)) {
        this.tempFilter.statusIds.push(statusId);
      }
    } else {
      this.tempFilter.statusIds = (this.tempFilter.statusIds || []).filter(id => id !== statusId);
    }

    // Apply filters immediately (frontend only)
    this.currentPage = 1;
    this.applyFrontendFilters();
  }

  syncSwitchesWithTemp(): void {
    // Sync status switches only (those with id starting with 'flt-sw')
    this.paperStatusList.forEach((status, index) => {
      const switchId = 'flt-sw' + (index + 1);
      const switchEl = document.getElementById(switchId) as HTMLInputElement;
      if (switchEl) {
        switchEl.checked = this.tempFilter.statusIds?.includes(status.id) || false;
      }
    });
  }

  sortByColumn(column: string): void {
    // Clear filter-based sorting when using column sorting
    if (this.filter.sortLowToHigh || this.filter.sortHighToLow) {
      this.filter.sortLowToHigh = false;
      this.filter.sortHighToLow = false;
      this.tempFilter.sortLowToHigh = false;
      this.tempFilter.sortHighToLow = false;
    }
    
    // If clicking the same column, toggle direction; otherwise, set to ascending
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Apply filters with new sort
    this.currentPage = 1;
    this.applyFrontendFilters();
  }

  applySorting(): void {
    // Note: Sorting should be handled by backend API
    // For now, we'll reload data when sorting changes
    // You may need to add sort parameters to the filter
    this.loadPaperConfigList();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'both'; // Show both arrows when not sorted
    }
    return this.sortDirection === 'asc' ? 'asc' : 'desc';
  }

  updatePriceSliderOptions(): void {
    if (!this.allPaperList || this.allPaperList.length === 0) {
      // Default values if no data
      this.priceSliderOptions = {
        floor: 0,
        ceil: 1000,
        step: 10,
        translate: (value: number): string => `$${value}`
      };
      this.tempPrice = [0, 0];
      return;
    }

    // Find min and max contract values from actual data
    const contractValues = this.allPaperList
      .map(paper => paper.totalContractValue || 0)
      .filter(value => value > 0); // Only consider papers with contract values > 0

    if (contractValues.length === 0) {
      // If no papers have contract values, use default
      this.priceSliderOptions = {
        floor: 0,
        ceil: 1000,
        step: 10,
        translate: (value: number): string => `$${value}`
      };
      this.tempPrice = [0, 0];
      return;
    }

    const minValue = Math.min(...contractValues);
    const maxValue = Math.max(...contractValues);
    
    // Round up max value to nearest 100 for better UX
    const roundedMax = Math.ceil(maxValue / 100) * 100;
    // Round down min value to nearest 10, but ensure it's at least 0
    const roundedMin = Math.max(0, Math.floor(minValue / 10) * 10);
    
    // Calculate step size based on range (smaller step for smaller ranges)
    let step = 10;
    const range = roundedMax - roundedMin;
    if (range <= 100) {
      step = 5;
    } else if (range <= 500) {
      step = 10;
    } else if (range <= 1000) {
      step = 50;
    } else {
      step = 100;
    }

    // Update slider options
    this.priceSliderOptions = {
      floor: roundedMin,
      ceil: roundedMax,
      step: step,
      translate: (value: number): string => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    };

    // Update tempPrice to match the new range (reset to min and max)
    this.tempPrice = [roundedMin, roundedMax];
    
    // Also update filter if it was using old values
    if (!this.filter.priceMin || this.filter.priceMin === 0) {
      this.filter.priceMin = roundedMin;
    }
    if (!this.filter.priceMax || this.filter.priceMax === 0 || this.filter.priceMax > roundedMax) {
      this.filter.priceMax = roundedMax;
    }
  }

}
