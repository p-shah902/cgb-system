import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { NgbModal, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';
import { VotingService } from '../../service/voting.service';
import { VotingCycle } from '../../models/voting';
import { LoginUser } from '../../models/user';
import { AuthService } from '../../service/auth.service';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cgb',
  standalone: true,
  imports: [NgbToastModule, CommonModule, FormsModule],
  templateUrl: './cgb.component.html',
  styleUrl: './cgb.component.scss'
})
export class CgbComponent implements OnInit {
  public toastService = inject(ToastService)
  private votingService = inject(VotingService);

  currentCgbCycle: VotingCycle | null = null;
  users: {
    userId: number,
    role: number,
    roleName: string
  }[] = [];
  loggedInUser: LoginUser | null;
  cycleObject: {
    [key: string]: {
      paperInfo: {
        paperID: number;
        paperTitle: string;
        result: string;
        cgbRef: string;
        paperType: string;
      };
      users: any[];
    }
  } = {};

  selectedPaper: number = 0;

  classMap: { [key: string]: string } = {
    "Pending": "inprocess",
    "Approved": "approved",
    "Withdrawn": "withdrawn",
    "Action Required": "Actionreq",
  }
  approvalRemark = "";
  status = "";
  isLoading: boolean = false;

  private readonly _mdlSvc = inject(NgbModal);

  constructor(private authService: AuthService, private router: Router) {
    this.loggedInUser = this.authService.getUser();
  }

  open(event: Event, content: TemplateRef<any>, paperId: number) {
    event.preventDefault();
    this.selectedPaper = paperId;
    this._mdlSvc.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,  // Ensure modal is centered
      size: 'lg'       // Adjust size as needed (sm, lg, xl)
    }).result.then(
      (result) => {
        // Handle modal close
        this.approvalRemark = '';
      },
      (reason) => {
        // Handle modal dismiss
        this.approvalRemark = '';
      }
    );
  }

  ngOnInit() {
    this.getCgbCycle();
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

  getCgbCycle() {
    this.isLoading = true;
    this.cycleObject = {};
    this.votingService.getCgbCycle().subscribe({
      next: response => {
        if (response.status && response.data) {
          this.currentCgbCycle = response.data;

          this.currentCgbCycle?.papersData.forEach(item => {
            if (!this.cycleObject.hasOwnProperty(item.paperID)) {
              this.cycleObject[item.paperID] = {
                paperInfo: {
                  paperID: item.paperID,
                  paperType: item.paperType,
                  paperTitle: item.paperProvision,
                  cgbRef: (item.cgbItemRef || ''),
                  result: '1',
                },
                users: []
              };
            }
            this.cycleObject[item.paperID].users.push(item);
          });

          Object.keys(this.cycleObject).forEach(key => {
            const paperUsers = this.cycleObject[key].users;
            
            // Priority: Withdrawn > Action Required > Pending > Approved
            let result = paperUsers.find(d => d.voteStatus === 'Withdrawn');
            if (result) {
              this.cycleObject[key].paperInfo.result = "Withdrawn";
            } else {
              result = paperUsers.find(d => d.voteStatus === 'Action Required');
              if (result) {
                this.cycleObject[key].paperInfo.result = "Action Required";
              } else {
                result = paperUsers.find(d => d.voteStatus === 'Pending');
                if (result) {
                  this.cycleObject[key].paperInfo.result = "Pending";
                } else {
                  // All votes are Approved
                  this.cycleObject[key].paperInfo.result = "Approved";
                }
              }
            }
          })

          console.log("=====", this.cycleObject);

          this.currentCgbCycle?.papersData.forEach(item => {
            // Check if role already exists (not userId) to avoid duplicate columns for same role
            let roleExists = this.users.find(d => d.role === item.userRoleId);
            if (!roleExists) {
              this.users.push({
                userId: item.userID,
                role: item.userRoleId,
                roleName: item.userRoleName,
              })
            }
          })

          // Sort users in the specified order: CGB Chair, CPO, Legal VP, BLT, PHCA
          this.sortUsersByRoleOrder();
        }
      }, error: err => {
        console.log('ERROR', err);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    })
  }

  /**
   * Sort users array by role order: CGB Chair, CPO, Legal VP, BLT, PHCA
   */
  private sortUsersByRoleOrder() {
    const roleOrder: { [key: string]: number } = {
      'CGB Chair': 1,
      'CPO': 2,
      'Legal VP': 3,
      'Legal VP-1': 3,
      'BLT': 4,
      'PHCA': 5
    };

    this.users.sort((a, b) => {
      const orderA = roleOrder[a.roleName] || 999; // Unknown roles go to the end
      const orderB = roleOrder[b.roleName] || 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // If same order, maintain original order (or sort by userId)
      return a.userId - b.userId;
    });
  }

  updateVote(modal: any) {
    this.votingService.updateVote({
      paperId: this.selectedPaper,
      votingCycleId: this.currentCgbCycle?.voteCycleId,
      voteStatus: this.status,
      remarks: this.approvalRemark
    }).subscribe({
      next: (response) => {
        modal.close('Save click');
        this.getCgbCycle();
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  /**
   * Find user vote for a specific paper by roleId (not userId) to handle multiple users with same role
   */
  findUserVote(paperUsers: any[], userId: number, roleId: number): any | null {
    // Match by roleId only, not userId, since multiple users can have the same role
    return paperUsers.find(u => u.userRoleId === roleId) || null;
  }
}
