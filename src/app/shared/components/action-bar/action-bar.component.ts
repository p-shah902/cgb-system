import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-action-bar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent {
  @Input() paperId: string | null = null;
  @Input() isCopy: boolean = false;
  @Input() roleName: string | null | undefined = null;
  @Input() statusName: string | null | undefined = null;
  @Input() isLoading: boolean = false;
  @Input() canShowUpdateForJVApproval: boolean = false;
  @Input() canShowPartnerApproveReject: boolean = true;
  
  // Additional inputs for edit paper condition logic
  @Input() currentUserId: number | null = null; // Logged in user's ID
  @Input() paperCamUserId: number | null = null; // CAM user ID assigned to paper
  @Input() paperProcurementSPAUsers: string | null = null; // Comma-separated list of Procurement Tag user IDs
  @Input() isBPGroup100Percent: boolean = false; // Whether BP Group PSA split = 100%
  @Input() hasJVAlignedConsultation: boolean = false; // Whether JV Admin has assigned consultation with JV Aligned
  @Input() canEditAnyJVAlignedCheckbox: boolean = false; // Whether JV Admin can edit any JV Aligned checkbox
  @Input() hasBatchPaperSelected: boolean = false; // Whether a batch paper is selected (hide Draft button in create mode)

  @Output() setStatus = new EventEmitter<string>();
  @Output() openReturn = new EventEmitter<Event>();
  @Output() openApprove = new EventEmitter<Event>();
  @Output() openAddReview = new EventEmitter<Event>();
  @Output() returnToRequested = new EventEmitter<void>();
  @Output() partnerApproveReject = new EventEmitter<string>();
  @Output() sendForPDM = new EventEmitter<void>();

  constructor(public permission: PermissionService) {}

  /**
   * Check if user can edit the paper
   */
  canEditPaper(): boolean {
    return this.permission.canEditPaper(
      this.roleName,
      this.statusName,
      this.currentUserId,
      this.paperCamUserId,
      this.paperProcurementSPAUsers,
      this.isBPGroup100Percent,
      this.hasJVAlignedConsultation
    );
  }

  /**
   * Check if user can edit all fields (vs. only government comment)
   */
  canEditAllFields(): boolean {
    return this.permission.canEditAllFields(
      this.roleName,
      this.statusName,
      this.isBPGroup100Percent
    );
  }
}


