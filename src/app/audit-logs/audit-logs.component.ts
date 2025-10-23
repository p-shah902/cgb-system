import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { Generalervice } from '../../service/general.service';
import { AuditLogs, ApiResponse } from '../../models/auditlogs';

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

  constructor(
    public toastService: ToastService,
    private generalService: Generalervice
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.generalService.getAuditLogs().subscribe({
      next: (response: ApiResponse<AuditLogs[]>) => {
        if (response.status) {
          this.auditLogs = response.data || [];
        } else {
          this.toastService.show('Error loading audit logs', 'danger');
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading audit logs:', error);
        this.toastService.show('Error loading audit logs', 'danger');
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    // Implement search functionality if needed
    console.log('Search term:', this.searchTerm);
  }

  getStatusClass(status: string): string {
    // Add status styling logic if needed
    return 'status-badge';
  }
}
