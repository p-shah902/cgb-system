import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { PaperService } from '../../service/paper.service';
import { PaperConfig, PartnerApprovalStatus } from '../../models/paper';
import { ToastService } from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../service/auth.service';
import { LoginUser } from '../../models/user';
import { GetPaperConfigurationsListRequest } from '../../models/general';

interface PartnerColumn {
  key: string;
  label: string;
  subColumns?: { key: string; label: string }[];
}

interface PaperApprovalData {
  paper: PaperConfig;
  preCgbStatus?: string;
  cgbStatus?: string;
  partnerApprovals: { [partnerKey: string]: PartnerApprovalStatus | null };
}

@Component({
  selector: 'app-partners-approvals',
  standalone: true,
  imports: [CommonModule, RouterLink, NgbToastModule],
  templateUrl: './partners-approvals.component.html',
  styleUrl: './partners-approvals.component.scss'
})
export class PartnersApprovalsComponent implements OnInit {
  public toastService = inject(ToastService);
  private paperConfigService = inject(PaperConfigService);
  private paperService = inject(PaperService);
  private router = inject(Router);
  private authService = inject(AuthService);

  loggedInUser: LoginUser | null = null;
  isLoading: boolean = false;
  papers: PaperConfig[] = [];
  paperApprovalData: PaperApprovalData[] = [];

  // Partner columns structure
  partnerColumns: PartnerColumn[] = [
    {
      key: 'ACG',
      label: 'ACG',
      subColumns: [
        { key: 'CMC', label: 'CMC' },
        { key: 'SC', label: 'SC' }
      ]
    },
    {
      key: 'SD',
      label: 'SD',
      subColumns: [
        { key: 'SDCC', label: 'SDCC' },
        { key: 'SDMC', label: 'SDMC' }
      ]
    },
    {
      key: 'SCP',
      label: 'SCP',
      subColumns: [
        { key: 'SCP_CC', label: 'SCP Co CC' },
        { key: 'SCP_Board', label: 'SCP Board' }
      ]
    },
    {
      key: 'BTC',
      label: 'BTC',
      subColumns: [
        { key: 'BTC_CC', label: 'BTC CC' },
        { key: 'BTC_Board', label: 'BTC Board' }
      ]
    },
    {
      key: 'Karabagh',
      label: 'Karabagh',
      subColumns: [
        { key: 'KCC', label: 'KCC' },
        { key: 'KMC', label: 'KMC' }
      ]
    },
    {
      key: 'Sh-Asiman',
      label: 'Sh-Asiman'
    }
  ];

  constructor() {
    this.loggedInUser = this.authService.getUser();
  }

  ngOnInit() {
    this.loadPapers();
  }

  loadPapers() {
    this.isLoading = true;

    // Load papers that are in Partner Approval statuses
    // Use the same approach as paper-status component
    const request: GetPaperConfigurationsListRequest = {
      filter: {
        orderType: 'DESC' as const
      },
      paging: {
        start: 0,
        length: 1000 // Large number to get all matching results
      }
    };

    this.paperConfigService.getPaperConfigList(request).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          // Filter papers using exact case-insensitive matching like paper-status component
          // Only show papers in "On Partner Approval 1st" and "On Partner Approval 2nd" (not Approved)
          const targetStatuses = [
            'On Partner Approval 1st',
            'On Partner Approval 2nd'
          ];

          this.papers = response.data.filter((paper: PaperConfig) => {
            const paperStatus = (paper.statusName || '').toLowerCase().trim();

            // Check if paper status matches any of the target statuses (case-insensitive)
            return targetStatuses.some(targetStatus => {
              const targetStatusLower = targetStatus.toLowerCase().trim();
              return paperStatus === targetStatusLower;
            });
          });

          // Load approval data for each paper
          this.loadApprovalData();
        } else {
          this.papers = [];
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading papers:', error);
        this.toastService.show('Error loading papers', 'danger');
        this.isLoading = false;
      }
    });
  }

  loadApprovalData() {
    if (this.papers.length === 0) {
      this.isLoading = false;
      return;
    }

    let loadedCount = 0;
    this.paperApprovalData = [];

    this.papers.forEach((paper, index) => {
      const approvalData: PaperApprovalData = {
        paper: paper,
        preCgbStatus: this.getPreCgbStatus(paper),
        cgbStatus: this.getCgbStatus(paper),
        partnerApprovals: {}
      };

      // Load partner approval status for this paper
      this.paperConfigService.getPartnerApprovalStatus(paper.paperID).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            // Map partner approvals by PSA/partner key
            response.data.forEach((approval: PartnerApprovalStatus) => {
              const partnerKey = this.mapPsaToPartnerKey(approval.psa);
              if (partnerKey) {
                approvalData.partnerApprovals[partnerKey] = approval;
              }
            });
          }

          // Add to array at correct index to maintain order
          this.paperApprovalData[index] = approvalData;

          loadedCount++;
          if (loadedCount === this.papers.length) {
            // Filter out any undefined entries and update
            this.paperApprovalData = this.paperApprovalData.filter(d => d !== undefined);
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error(`Error loading approval status for paper ${paper.paperID}:`, error);

          // Add to array at correct index even on error
          this.paperApprovalData[index] = approvalData;

          loadedCount++;
          if (loadedCount === this.papers.length) {
            // Filter out any undefined entries and update
            this.paperApprovalData = this.paperApprovalData.filter(d => d !== undefined);
            this.isLoading = false;
          }
        }
      });
    });
  }

  getPreCgbStatus(paper: PaperConfig): string {
    const status = (paper.statusName || '').toLowerCase();
    if (status.includes('pre-cgb') || status.includes('approved by pre-cgb')) {
      return 'Approved';
    }
    return 'Pending';
  }

  getCgbStatus(paper: PaperConfig): string {
    const status = (paper.statusName || '').toLowerCase();
    if (status.includes('cgb') && status.includes('approved')) {
      return 'Approved';
    }
    if (status.includes('on cgb')) {
      return 'Pending';
    }
    return '-';
  }

  mapPsaToPartnerKey(psa: string): string | null {
    if (!psa) return null;

    const psaUpper = psa.toUpperCase();

    // Map PSA names to partner keys
    if (psaUpper === 'CMC') {
      return 'CMC';
    }
    if (psaUpper === 'SC') {
      return 'SC';
    }
    if (psaUpper === 'SDCC') {
      return 'SDCC';
    }
    if (psaUpper === 'SDMC') {
      return 'SDMC';
    }
    if (psaUpper === 'SCP CO CC') {
      return 'SCP_CC';
    }
    if (psaUpper === 'SCP BORAD') {
      return 'SCP_Board';
    }
    if (psaUpper === 'BTC CC') {
      return 'BTC_CC';
    }
    if (psaUpper.includes('BTC') && psaUpper.includes('BOARD')) {
      return 'BTC_Board';
    }
    if (psaUpper.includes('KCC') || psaUpper.includes('KARABAGH') && psaUpper.includes('CC')) {
      return 'KCC';
    }
    if (psaUpper.includes('KMC') || psaUpper.includes('KARABAGH') && psaUpper.includes('MC')) {
      return 'KMC';
    }
    if (psaUpper.includes('SH-ASIMAN') || psaUpper.includes('SHASIMAN')) {
      return 'Sh-Asiman';
    }

    return null;
  }

  getPartnerApprovalStatus(paperData: PaperApprovalData, partnerKey: string, subKey?: string): string {
    const key = subKey || partnerKey;
    const approval = paperData.partnerApprovals[key];

    if (!approval) {
      return 'pending';
    }

    const status = (approval.approvalStatus || '').toLowerCase();
    if (status.includes('approved')) {
      return 'approved';
    }
    if (status.includes('rejected') || status.includes('reject')) {
      return 'rejected';
    }

    return 'pending';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'pending':
      default:
        return 'status-pending';
    }
  }

  gotoPaper(paperId: number, paperType: string) {
    const routePath = this.slugify(paperType);
    this.router.navigate([`/${routePath}`, paperId]);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  trackByPaperId(index: number, paperData: PaperApprovalData): number {
    return paperData.paper.paperID;
  }
}

