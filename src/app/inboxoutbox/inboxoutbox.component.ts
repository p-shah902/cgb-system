import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { NgbDropdownItem, NgbModal, NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';
import { InboxOutbox } from '../../models/inbox-outbox';
import { InboxOutboxService } from '../../service/inbox-outbox.service';
import {Router, RouterLink} from '@angular/router';
import { LoginUser } from '../../models/user';
import { AuthService } from '../../service/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { PaperService } from '../../service/paper.service';

@Component({
  selector: 'app-inboxoutbox',
  standalone: true,
  imports: [NgbNavModule, NgbToastModule, CommonModule, RouterLink, FormsModule],
  templateUrl: './inboxoutbox.component.html',
  styleUrl: './inboxoutbox.component.scss'
})
export class InboxoutboxComponent implements OnInit {

  public toastService = inject(ToastService)
  private paperConfigService = inject(PaperConfigService);
  private paperService = inject(PaperService);
  active = 1;
  inboxData: InboxOutbox[] = [];
  outboxData: InboxOutbox[] = [];
  loggedInUser: LoginUser | null = null
  approvalRemark: string = '';
  selectedPaper: number = 0;
  reviewBy: string = '';
  isLoading: boolean = false;
  downloadingPapers: Set<number> = new Set();

  private readonly _mdlSvc = inject(NgbModal);

  constructor(private inboxOutboxService: InboxOutboxService, private authService: AuthService, private router: Router) {
    this.loggedInUser = this.authService.getUser();
  }

  ngOnInit() {
    this.getInboxOutBox()
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
    this.inboxOutboxService.getPaperInboxOutbox().subscribe({
      next: response => {
        if (response.status && response.data) {
          this.inboxData = response.data.inbox;
          this.outboxData = response.data.outbox;
        }
      },
      error: err => {
        console.log('ERROR', err);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }

  approvePaper(modal: any, type: string) {
    if (this.selectedPaper > 0) {
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
              modal.close('Save click');
              this.approvalRemark = ''; // Reset the approval remark
              this.reviewBy = ''; // Reset the review by
              this.selectedPaper = 0; // Reset the selected paper ID
              this.getInboxOutBox();
            }
          },
          error: (error) => {
            console.log('error', error);
          },
        });
    }
  }

  updateProject(paperId: any, currentStatus: any, id: number = 10) {
    this.paperConfigService.updateMultiplePaperStatus([{
      paperId: paperId,
      existingStatusId: Number(currentStatus),
      statusId: id
    }]).subscribe(value => {
      this.getInboxOutBox();
      this.toastService.show('Paper status updated.');
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

    // Send For PDM button
    if ((roleName === 'Procurement Tag' || roleName === 'CAM') && 
        (status === 'Waiting for PDM' || status === 'Action Required by Pre-CGB')) {
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
