import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { Generalervice } from '../../service/general.service';
import { AuditLogs, ApiResponse, GetAuditLogsListRequest } from '../../models/auditlogs';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.scss']
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLogs[] = [];
  isLoading = false;
  searchTerm = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  totalItems: number = 0;

  constructor(
    public toastService: ToastService,
    private generalService: Generalervice
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    
    // Calculate start index based on current page
    const start = (this.currentPage - 1) * this.itemsPerPage;
    
    // Build filter with search term if provided
    const filter: GetAuditLogsListRequest['filter'] = {};
    if (this.searchTerm && this.searchTerm.trim()) {
      filter.searchTerm = this.searchTerm.trim();
    }
    
    // Build request payload with backend pagination
    const request: GetAuditLogsListRequest = {
      filter: filter,
      paging: {
        start: start,
        length: this.itemsPerPage
      },
      orderType: 'DESC'
    };

    // Make parallel requests: one for paginated data, one for total count
    forkJoin({
      data: this.generalService.getAuditLogs(request),
      count: this.generalService.getAuditLogs({
        filter: filter,
        paging: {
          start: 0,
          length: 10000 // Large number to get all records for counting
        },
        orderType: 'DESC'
      })
    }).subscribe({
      next: ({ data, count }) => {
        if (data.status && data.data) {
          this.auditLogs = data.data || [];
        } else {
          this.auditLogs = [];
        }
        
        // Get total count from count response
        if (count.status && count.data) {
          this.totalItems = count.totalCount || count.recordsTotal || count.recordsFiltered || count.data.length;
        } else {
          // Fallback to data response if count fails
          this.totalItems = data.totalCount || data.recordsTotal || data.recordsFiltered || this.auditLogs.length;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading audit logs:', error);
        this.toastService.show('Error loading audit logs', 'danger');
        this.auditLogs = [];
        this.totalItems = 0;
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    // Reset to first page when search changes
    this.currentPage = 1;
    this.loadAuditLogs();
  }

  getStatusClass(status: string): string {
    // Add status styling logic if needed
    return 'status-badge';
  }

  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(totalPages);
      } else if (this.currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
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
      this.loadAuditLogs();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadAuditLogs();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.loadAuditLogs();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadAuditLogs();
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
}
