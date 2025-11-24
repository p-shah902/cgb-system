import { Component, inject, OnInit, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbModal, NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';
import { InboxOutbox, InboxOutboxRequest } from '../../models/inbox-outbox';
import { InboxOutboxService } from '../../service/inbox-outbox.service';
import {Router, RouterLink} from '@angular/router';
import { LoginUser } from '../../models/user';
import { AuthService } from '../../service/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { PaperService } from '../../service/paper.service';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-inboxoutbox',
  standalone: true,
  imports: [NgbNavModule, NgbToastModule, CommonModule, RouterLink, FormsModule, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle],
  templateUrl: './inboxoutbox.component.html',
  styleUrl: './inboxoutbox.component.scss'
})
export class InboxoutboxComponent implements OnInit, OnDestroy {
  @ViewChild('dropdownRef') dropdownRef!: NgbDropdown;

  public toastService = inject(ToastService)
  private paperConfigService = inject(PaperConfigService);
  private paperService = inject(PaperService);
  active = 1;
  inboxData: InboxOutbox[] = [];
  outboxData: InboxOutbox[] = [];
  filteredInboxData: InboxOutbox[] = [];
  filteredOutboxData: InboxOutbox[] = [];
  loggedInUser: LoginUser | null = null
  approvalRemark: string = '';
  selectedPaper: number = 0;
  reviewBy: string = '';
  isLoading: boolean = false;
  isApproving: boolean = false;
  downloadingPapers: Set<number> = new Set();
  updatingPapers: Set<number> = new Set();
  searchTerm: string = '';
  filterStatus: string = '';
  filterPaperType: string = '';
  isFilterOpen: boolean = false;
  isDesc: boolean = false;
  isFilterApplied: boolean = false;
  
  // Debouncing for search
  private searchSubject = new Subject<string>();
  private searchSubscription: any;

  // Pagination
  currentPageInbox: number = 1;
  currentPageOutbox: number = 1;
  itemsPerPage: number = 12; // 3x3 grid
  pageSizeOptions: number[] = [12, 24, 48, 96];
  paginatedInboxData: InboxOutbox[] = [];
  paginatedOutboxData: InboxOutbox[] = [];
  totalItemsInbox: number = 0;
  totalItemsOutbox: number = 0;

  private readonly _mdlSvc = inject(NgbModal);

  constructor(private inboxOutboxService: InboxOutboxService, private authService: AuthService, private router: Router) {
    this.loggedInUser = this.authService.getUser();
  }

  ngOnInit() {
    this.getInboxOutBox();
    this.setupSearchDebounce();
  }
  
  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
  
  setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged() // Only trigger if value actually changed
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm);
      });
  }
  
  performSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.checkFilterApplied();
    this.currentPageInbox = 1;
    this.currentPageOutbox = 1;
    this.getInboxOutBox();
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with dashes
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }

  gotoPaper(paperId: any, type: string) {
    const routePath = this.slugify(type);
    this.router.navigate([`/${routePath}`, paperId]);
  }

  getInboxOutBox() {
    this.isLoading = true;
    
    // Calculate start index for inbox
    const inboxStart = (this.currentPageInbox - 1) * this.itemsPerPage;
    // Calculate start index for outbox
    const outboxStart = (this.currentPageOutbox - 1) * this.itemsPerPage;
    
    // Build request for inbox
    const inboxRequest: InboxOutboxRequest = {
      orderType: this.isDesc ? 'ASC' : 'DESC',
      paging: {
        start: inboxStart,
        length: this.itemsPerPage
      }
    };
    
    // Build request for outbox
    const outboxRequest: InboxOutboxRequest = {
      orderType: this.isDesc ? 'ASC' : 'DESC',
      paging: {
        start: outboxStart,
        length: this.itemsPerPage
      }
    };
    
    // Add search filter if present
    if (this.searchTerm && this.searchTerm.trim()) {
      inboxRequest.paperName = this.searchTerm.trim();
      outboxRequest.paperName = this.searchTerm.trim();
    } else {
      // Explicitly remove paperName if search is empty
      delete inboxRequest.paperName;
      delete outboxRequest.paperName;
    }
    
    if (this.filterStatus) {
      // Convert status name to status ID if needed
      // For now, we'll filter on frontend after getting data
    }
    
    // Make parallel requests for inbox and outbox
    forkJoin({
      inbox: this.inboxOutboxService.getPaperInboxOutbox(inboxRequest),
      outbox: this.inboxOutboxService.getPaperInboxOutbox(outboxRequest),
      inboxCount: this.inboxOutboxService.getPaperInboxOutbox({
        ...inboxRequest,
        paging: { start: 0, length: 10000 } // Get all for count
      }),
      outboxCount: this.inboxOutboxService.getPaperInboxOutbox({
        ...outboxRequest,
        paging: { start: 0, length: 10000 } // Get all for count
      })
    }).subscribe({
      next: ({ inbox, outbox, inboxCount, outboxCount }) => {
        if (inbox.status && inbox.data) {
          let inboxList = inbox.data.inbox || [];
          let outboxList = outbox.data.outbox || [];
          
          // Apply frontend filters (status, paper type) if needed
          if (this.filterStatus) {
            inboxList = inboxList.filter((item: InboxOutbox) => item.paperStatus === this.filterStatus);
          }
          if (this.filterPaperType) {
            inboxList = inboxList.filter((item: InboxOutbox) => item.paperType === this.filterPaperType);
          }
          
          if (this.filterStatus) {
            outboxList = outboxList.filter((item: InboxOutbox) => item.paperStatus === this.filterStatus);
          }
          if (this.filterPaperType) {
            outboxList = outboxList.filter((item: InboxOutbox) => item.paperType === this.filterPaperType);
          }
          
          this.paginatedInboxData = inboxList;
          this.paginatedOutboxData = outboxList;
          
          // Get total counts
          if (inboxCount.status && inboxCount.data) {
            let countList = inboxCount.data.inbox || [];
            if (this.filterStatus) {
              countList = countList.filter((item: InboxOutbox) => item.paperStatus === this.filterStatus);
            }
            if (this.filterPaperType) {
              countList = countList.filter((item: InboxOutbox) => item.paperType === this.filterPaperType);
            }
            this.totalItemsInbox = inboxCount.totalCount || inboxCount.recordsTotal || inboxCount.recordsFiltered || countList.length;
          } else {
            this.totalItemsInbox = inboxList.length;
          }
          
          if (outboxCount.status && outboxCount.data) {
            let countList = outboxCount.data.outbox || [];
            if (this.filterStatus) {
              countList = countList.filter((item: InboxOutbox) => item.paperStatus === this.filterStatus);
            }
            if (this.filterPaperType) {
              countList = countList.filter((item: InboxOutbox) => item.paperType === this.filterPaperType);
            }
            this.totalItemsOutbox = outboxCount.totalCount || outboxCount.recordsTotal || outboxCount.recordsFiltered || countList.length;
          } else {
            this.totalItemsOutbox = outboxList.length;
          }
        } else {
          this.paginatedInboxData = [];
          this.paginatedOutboxData = [];
          this.totalItemsInbox = 0;
          this.totalItemsOutbox = 0;
        }
      },
      error: err => {
        console.log('ERROR', err);
        this.paginatedInboxData = [];
        this.paginatedOutboxData = [];
        this.totalItemsInbox = 0;
        this.totalItemsOutbox = 0;
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    // Reset to first page when filters change
    this.currentPageInbox = 1;
    this.currentPageOutbox = 1;
    
    // Reload data from backend with new filters
    this.getInboxOutBox();
  }

  getTotalPagesInbox(): number {
    return Math.ceil(this.totalItemsInbox / this.itemsPerPage);
  }

  getTotalPagesOutbox(): number {
    return Math.ceil(this.totalItemsOutbox / this.itemsPerPage);
  }
  
  getStartItemInbox(): number {
    if (this.totalItemsInbox === 0) return 0;
    return (this.currentPageInbox - 1) * this.itemsPerPage + 1;
  }
  
  getEndItemInbox(): number {
    const end = this.currentPageInbox * this.itemsPerPage;
    return end > this.totalItemsInbox ? this.totalItemsInbox : end;
  }
  
  getStartItemOutbox(): number {
    if (this.totalItemsOutbox === 0) return 0;
    return (this.currentPageOutbox - 1) * this.itemsPerPage + 1;
  }
  
  getEndItemOutbox(): number {
    const end = this.currentPageOutbox * this.itemsPerPage;
    return end > this.totalItemsOutbox ? this.totalItemsOutbox : end;
  }



  goToPageInbox(page: number): void {
    const totalPages = this.getTotalPagesInbox();
    if (page >= 1 && page <= totalPages) {
      this.currentPageInbox = page;
      this.getInboxOutBox();
      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPageOutbox(page: number): void {
    const totalPages = this.getTotalPagesOutbox();
    if (page >= 1 && page <= totalPages) {
      this.currentPageOutbox = page;
      this.getInboxOutBox();
      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPageInbox(): void {
    const totalPages = this.getTotalPagesInbox();
    if (this.currentPageInbox < totalPages) {
      this.goToPageInbox(this.currentPageInbox + 1);
    }
  }

  prevPageInbox(): void {
    if (this.currentPageInbox > 1) {
      this.goToPageInbox(this.currentPageInbox - 1);
    }
  }

  nextPageOutbox(): void {
    const totalPages = this.getTotalPagesOutbox();
    if (this.currentPageOutbox < totalPages) {
      this.goToPageOutbox(this.currentPageOutbox + 1);
    }
  }

  prevPageOutbox(): void {
    if (this.currentPageOutbox > 1) {
      this.goToPageOutbox(this.currentPageOutbox - 1);
    }
  }
  
  onPageSizeChange(): void {
    this.currentPageInbox = 1;
    this.currentPageOutbox = 1;
    this.getInboxOutBox();
  }

  getPageNumbersInbox(): number[] {
    const totalPages = this.getTotalPagesInbox();
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPageInbox <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (this.currentPageInbox >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPageInbox - 2; i <= this.currentPageInbox + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  }

  getPageNumbersOutbox(): number[] {
    const totalPages = this.getTotalPagesOutbox();
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPageOutbox <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (this.currentPageOutbox >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPageOutbox - 2; i <= this.currentPageOutbox + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  }

  onSearchChange(): void {
    // Emit search term to subject for debouncing
    this.searchSubject.next(this.searchTerm);
  }

  onFilterChange(): void {
    this.checkFilterApplied();
    this.currentPageInbox = 1;
    this.currentPageOutbox = 1;
    this.getInboxOutBox();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterPaperType = '';
    this.isFilterApplied = false;
    this.applyFilters();
    this.dropdownRef.close();
  }

  clearStatusFilter(): void {
    this.filterStatus = '';
    this.checkFilterApplied();
    this.applyFilters();
  }

  clearPaperTypeFilter(): void {
    this.filterPaperType = '';
    this.checkFilterApplied();
    this.applyFilters();
  }

  cancelFilters(): void {
    this.dropdownRef.close();
  }

  onFilterDropdownOpen(): void {
    // This method is called when dropdown opens/closes
  }

  checkFilterApplied(): void {
    this.isFilterApplied = !!(this.filterStatus || this.filterPaperType);
  }

  toggleSort(): void {
    this.isDesc = !this.isDesc;
    this.currentPageInbox = 1;
    this.currentPageOutbox = 1;
    this.getInboxOutBox();
  }

  getUniqueStatuses(): string[] {
    const allStatuses = [
      ...this.paginatedInboxData.map(item => item.paperStatus),
      ...this.paginatedOutboxData.map(item => item.paperStatus)
    ];
    return [...new Set(allStatuses)].filter(s => s).sort();
  }

  getUniquePaperTypes(): string[] {
    const allTypes = [
      ...this.paginatedInboxData.map(item => item.paperType),
      ...this.paginatedOutboxData.map(item => item.paperType)
    ];
    return [...new Set(allTypes)].filter(t => t).sort();
  }

  goToPreview(paper: InboxOutbox): void {
    const routePath = this.slugify(paper.paperType);
    this.router.navigate([`/preview/${routePath}`, paper.paperID]);
  }

  approvePaper(modal: any, type: string) {
    if (this.selectedPaper > 0 && !this.isApproving) {
      this.isApproving = true;
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
              this.toastService.show('Paper approved successfully', 'success');
              // Reset form fields first
              this.approvalRemark = '';
              this.reviewBy = '';
              const paperId = this.selectedPaper;
              this.selectedPaper = 0;
              // Close modal immediately
              try {
                modal.close('Approved');
              } catch (e) {
                console.log('Error closing modal:', e);
              }
              // Refresh inbox/outbox data after a short delay to ensure modal is closed
              setTimeout(() => {
                this.getInboxOutBox();
              }, 300);
            } else {
              this.toastService.show(response?.message || 'Failed to approve paper', 'danger');
              this.isApproving = false;
            }
          },
          error: (error) => {
            console.log('error', error);
            this.toastService.showError(error);
            this.isApproving = false;
          },
          complete: () => {
            // Reset isApproving flag after a delay to ensure UI updates
            setTimeout(() => {
              this.isApproving = false;
            }, 500);
          }
        });
    }
  }

  updateProject(paperId: any, currentStatus: any, id: number = 10) {
    // Add paperId to updating set
    this.updatingPapers.add(paperId);

    this.paperConfigService.updateMultiplePaperStatus([{
      paperId: paperId,
      existingStatusId: Number(currentStatus),
      statusId: id
    }]).subscribe({
      next: (value) => {
        this.getInboxOutBox();
        this.toastService.show('Paper status updated.');
      },
      error: (error) => {
        console.error('Error updating paper status:', error);
        this.toastService.show('Failed to update paper status.', 'danger');
        // Remove paperId from updating set on error
        this.updatingPapers.delete(paperId);
      },
      complete: () => {
        // Remove paperId from updating set when complete
        this.updatingPapers.delete(paperId);
      }
    });
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

  exportToPDF(paperId: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (paperId) {
      // Add paperId to downloading set
      this.downloadingPapers.add(paperId);

      this.paperService.generatePaperPDf(paperId).subscribe({
        next: (response) => {
          if (response && response.status) {
            this.toastService.show('PDF generated successfully!', 'success');
            // Handle PDF download from base64 data
            if (response.data && response.data.fileName && response.data.pdfBytes) {
              this.downloadPDFFromBase64(response.data.fileName, response.data.pdfBytes);
            }
          } else {
            this.toastService.show(response?.message || 'Failed to generate PDF', 'danger');
          }
        },
        error: (error) => {
          console.error('Error generating PDF:', error);
          this.toastService.show('Error generating PDF. Please try again.', 'danger');
          // Remove paperId from downloading set on error
          this.downloadingPapers.delete(paperId);
        },
        complete: () => {
          // Remove paperId from downloading set when complete
          this.downloadingPapers.delete(paperId);
        }
      });
    } else {
      this.toastService.show('Paper ID not found', 'danger');
    }
  }

  isDownloading(paperId: number): boolean {
    return this.downloadingPapers.has(paperId);
  }

  isUpdating(paperId: number): boolean {
    return this.updatingPapers.has(paperId);
  }

  private downloadPDFFromBase64(fileName: string, base64Data: string) {
    try {
      // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
      const base64Content = base64Data.replace(/^data:application\/pdf;base64,/, '');

      // Convert base64 to blob
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error processing PDF download:', error);
      this.toastService.show('Error processing PDF download', 'danger');
    }
  }

  hasActionButtons(inbox: InboxOutbox): boolean {
    const roleName = this.loggedInUser?.roleName;
    const status = inbox.paperStatus;

    // Vote Now button
    if ((roleName === 'CGB Chair' || roleName === 'CPO' || roleName === 'JV Admin' ||
         roleName === 'Legal VP-1' || roleName === 'Performance Manager' ||
         roleName === 'Legal VP' || roleName === 'PHCA' || roleName === 'BLT') &&
        status === 'On CGB') {
      return true;
    }

    // Send For PDM button - Only for Secretary and Super Admin when paper is Registered
    if ((roleName === 'Secretary' || roleName === 'Super Admin') &&
        status === 'Registered') {
      return true;
    }

    // Return to Originator button
    if (roleName === 'PDM' && (status === 'Waiting for PDM' || status === 'Action Required by Pre-CGB')) {
      return true;
    }

    // Approve button
    if (roleName === 'PDM' && (status === 'Waiting for PDM' || status === 'Action Required by Pre-CGB')) {
      return true;
    }

    // Add Review button
    if ((roleName === 'CGB Chair' || roleName === 'CPO' || roleName === 'JV Admin' ||
         roleName === 'Legal VP-1' || roleName === 'Performance Manager') &&
        status === 'On Pre-CGB') {
      return true;
    }

    // Return to requested button
    if (roleName === 'Procurement Tag' && status === 'Action Required by CGB') {
      return true;
    }

    return false;
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
}
