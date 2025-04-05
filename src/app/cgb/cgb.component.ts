import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {NgbModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from '../../service/toast.service';
import {CommonModule} from '@angular/common';
import {VotingService} from '../../service/voting.service';
import {VotingCycle} from '../../models/voting';
import {LoginUser} from '../../models/user';
import {AuthService} from '../../service/auth.service';
import {FormsModule} from '@angular/forms';

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

  private readonly _mdlSvc = inject(NgbModal);

  constructor(private authService: AuthService) {
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

  getCgbCycle() {
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
                  paperTitle: "Test 1",
                  result: '1',
                },
                users: []
              };
            }
            this.cycleObject[item.paperID].users.push(item);
          });

          Object.keys(this.cycleObject).forEach(key => {
            this.cycleObject[key].paperInfo.result = "Approved";
            let result = this.cycleObject[key].users.find(d => d.voteStatus === 'Pending');
            if (result) {
              this.cycleObject[key].paperInfo.result = "Pending";
            }
            result = this.cycleObject[key].users.find(d => d.voteStatus === 'Action Required');
            if (result) {
              this.cycleObject[key].paperInfo.result = "Action Required";
            }
            result = this.cycleObject[key].users.find(d => d.voteStatus === 'Withdrawn');
            if (result) {
              this.cycleObject[key].paperInfo.result = "Withdrawn";
            }
          })

          this.currentCgbCycle?.papersData.forEach(item => {
            let userThere = this.users.find(d => item.userID === d.userId);
            if (!userThere) {
              this.users.push({
                userId: item.userID,
                role: item.userRoleId,
                roleName: item.userRoleName,
              })
            }
          })
        }
      }, error: err => {
        console.log('ERROR', err);
      }
    })
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
}
