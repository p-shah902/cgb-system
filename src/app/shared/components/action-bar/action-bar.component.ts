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

  @Output() setStatus = new EventEmitter<string>();
  @Output() openReturn = new EventEmitter<Event>();
  @Output() openApprove = new EventEmitter<Event>();
  @Output() openAddReview = new EventEmitter<Event>();
  @Output() returnToRequested = new EventEmitter<void>();
  @Output() partnerApproveReject = new EventEmitter<string>();

  constructor(public permission: PermissionService) {}
}


