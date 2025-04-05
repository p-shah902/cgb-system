import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {PaperConfig} from '../../models/paper';
import {PaperConfigService} from '../../service/paper/paper-config.service';
import {PaperFilter} from '../../models/general';
import {CommonModule, KeyValuePipe, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ToastService} from '../../service/toast.service';
import {VotingService} from '../../service/voting.service';

@Component({
  selector: 'app-paper-status',
  standalone: true,
  imports: [
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgForOf,
    KeyValuePipe,
    FormsModule,
    NgIf,
    NgbToastModule,
    CommonModule
  ],
  templateUrl: './paper-status.component.html',
  styleUrl: './paper-status.component.scss'
})
export class PaperStatusComponent implements OnInit {
  paperList: PaperConfig[] = [];
  private paperService = inject(PaperConfigService);
  private votingService = inject(VotingService);
  filter: PaperFilter;
  showPreCGBButton = false;
  showCGBButton = false;
  openType: string = '';
  approvalRemark = "";
  isLoading: boolean = false
  groupedPaper: { [key: string]: PaperConfig[] } = {
    'Registered': [],
    'Waiting for PDM': [],
    'Approved by PDM': [],
    'On Pre-CGB': [],
    'Approved by Pre-CGB': [],
    'On CGB': [],
    'Approved by CGB': [],
    'Approved': [],
  };
  statusData: { label: string, value: number }[] = [
    {label: 'Registered', value: 3},
    {label: 'Waiting for PDM', value: 4},
    {label: 'Approved by PDM', value: 5},
    {label: 'On Pre-CGB', value: 6},
    {label: 'Approved by Pre-CGB', value: 7},
    {label: 'On CGB', value: 10},
    {label: 'Approved by CGB', value: 11},
    {label: 'Approved', value: 19},
  ];
  private readonly _mdlSvc = inject(NgbModal);

  constructor(public toastService: ToastService) {
    this.filter = {
      statusIds: [],
      orderType: "DESC"
    }
  }

  keepOrder = (a: any, b: any) => {
    return a;
  }

  isChecked(papers: PaperConfig[]) {
    return papers.filter(d => d.checked).length > 0;
  }

  onCheckboxChange() {
    this.showPreCGBButton = this.groupedPaper['On Pre-CGB'].some(item => item.checked);
    this.showCGBButton = this.groupedPaper['On CGB'].some(item => item.checked);
  }

  getData(key: string) {
    return this.statusData.filter(f => f.label !== key);
  }

  trackByGroupKey(index: number, item: { key: string, value: any }): string {
    return item.key;
  }

  open(event: Event, content: TemplateRef<any>, type: string) {
    event.preventDefault();
    this.openType = type;
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

  updateValue(event: any, groupKey: string) {
    if (event.target.value) {
      let movingPapers = [...JSON.parse(JSON.stringify(this.groupedPaper[groupKey].filter(d => d.checked)))];
      this.groupedPaper[groupKey] = this.groupedPaper[groupKey].filter(d => !d.checked);
      const findStatus = this.statusData.find(d => d.value == event.target.value);
      this.groupedPaper[findStatus!.label].push(...movingPapers.map(d => {
        d.checked = false;
        return d;
      }));

      this.paperService.updateMultiplePaperStatus(movingPapers.map(f => ({
        paperId: f.paperID,
        existingStatusId: Number(f.statusId),
        statusId: Number(event.target.value)
      }))).subscribe(value => {
        console.log('DD', value);
      });
    }
  }

  ngOnInit(): void {
    this.loadPaperConfigList();
  }

  loadPaperConfigList() {
    this.isLoading = true;
    this.paperService.getPaperConfigList(this.filter).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperList = response.data.filter(d => d.statusName !== 'Draft');
          Object.keys(this.groupedPaper).forEach(key => {
            this.groupedPaper[key] = this.paperList.filter(f => f.statusName === key);
          })

        }
      }, error: (error) => {
        console.log('error', error);
      },complete:()=>{
        this.isLoading=false;
      }
    });

  }

  getSelectedPapers(type: string) {
    return this.groupedPaper[type === 'pre' ? 'On Pre-CGB' : 'On CGB'].filter(item => item.checked);
  }

  addReview(modal: any) {
    if (this.openType) {
      if (this.openType === 'pre') {
        let papers = this.getSelectedPapers(this.openType);
        this.paperService.updateMultiplePaperStatus(papers.map(f => ({
          paperId: f.paperID,
          existingStatusId: f.statusId,
          statusId: f.statusId,
          emailRemarks: this.approvalRemark
        }))).subscribe({
          next: (response) => {
            modal.close('Save click');
            this.groupedPaper['On Pre-CGB'] = this.groupedPaper['On Pre-CGB'].map(d => {
              d.checked = false;
              return d;
            });
            this.showPreCGBButton = false;
          }, error: (error) => {
            console.log('error', error);
          }
        });
      } else if (this.openType === 'cgb') {
        this.votingService.initiateCgbCycle({
          paperIds: this.getSelectedPapers(this.openType).map(f => f.paperID),
          remarks: this.approvalRemark,
        }).subscribe({
          next: (response) => {
            if (response.status && response.data) {
              this.groupedPaper['On CGB'] = this.groupedPaper['On CGB'].map(d => {
                d.checked = false;
                return d;
              });
              this.showCGBButton = false;
              modal.close('Save click');
            }
          }, error: (error) => {
            console.log('error', error);
          }
        });
      }
    }
  }
}
