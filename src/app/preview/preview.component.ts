import {Component, OnInit, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PaperService} from '../../service/paper.service';
import {BidInvites, ConsultationsDetails, CostAllocationJVApproval, JvApprovals, Paper, PaperData, PaperDetails, PaperTimelineDetails, RiskMitigations, ValueDeliveriesCostsharing} from '../../models/paper';
import {CommonModule, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import {TimeAgoPipe} from '../../pipes/time-ago.pipe';
import {UserService} from '../../service/user.service';
import {UserDetails} from '../../models/user';
import {DictionaryDetail} from '../../models/dictionary';
import {DictionaryService} from '../../service/dictionary.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [NgIf, CommonModule, FormsModule, NgbToastModule, TimeAgoPipe],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {
  private readonly userService = inject(UserService);
  paperDetails: PaperData | null = null;
  comment: string = '';
  logs: any[] = [];
  riskMitigation: RiskMitigations[] = [];
  bidInvites: BidInvites[] = [];
  valueDeliveriesCostsharing: ValueDeliveriesCostsharing[] = [];
  costAllocationJVApproval: CostAllocationJVApproval[] = [];
  jvApprovals: JvApprovals[] = [];
  consultationsDetails: ConsultationsDetails[] = [];
  paperTimelineDetails: PaperTimelineDetails[] = [];
  paperInfo: PaperDetails | null = null;
  totalPercentage: number = 0;
  totalValue: number = 0
  userDetails: UserDetails[] = [];
  // Global variables for dropdown selections
  currenciesData: DictionaryDetail[] = [];
  globalCGBData: DictionaryDetail[] = [];
  operatingFunctionsData: DictionaryDetail[] = [];
  proposedCMLData: DictionaryDetail[] = [];
  psaData: DictionaryDetail[] = [];
  remunerationTypeData: DictionaryDetail[] = [];
  sourcingRigorData: DictionaryDetail[] = [];
  sourcingTypeData: DictionaryDetail[] = [];
  subsectorData: DictionaryDetail[] = [];
  constructor(private activatedRoutes: ActivatedRoute,private dictionaryService: DictionaryService, private paperService: PaperService,public toastService:ToastService) {
  }

  ngOnInit() {
    this.fetchPaperDetails(this.activatedRoutes.snapshot.params['id']);
    this.getPaperCommentLogs(this.activatedRoutes.snapshot.params['id']);
  }

  loadDictionaryItems() {

    this.dictionaryService.getDictionaryItemList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const itemData = response.data;
          if (itemData.length > 0) {
            itemData.forEach((item) => {
              this.loadDictionaryDetails(item.itemName);
            });
          }
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }


  loadDictionaryDetails(itemName: string) {
    this.dictionaryService.getDictionaryListByItem(itemName).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          switch (itemName) {
            case 'Currencies':
              this.currenciesData = (response.data || []).filter(item => item.isActive);
              if(this.paperInfo && this.paperInfo?.currencyCode) {
                const data  = this.currenciesData.find(item => item.id === Number(this.paperInfo?.currencyCode))
                this.paperInfo = {...this.paperInfo, currencyCode: data?.itemValue || ""}
              }
              break;

            case 'Global CGB':
              this.globalCGBData = (response.data || []).filter(item => item.isActive);
              if(this.paperInfo && this.paperInfo?.globalCGB) {
                const data  = this.globalCGBData.find(item => item.id === Number(this.paperInfo?.globalCGB))
                this.paperInfo = {...this.paperInfo, globalCGB: data?.itemValue || ""}
              }
              break;

            case 'Operating Functions':
              this.operatingFunctionsData = (response.data || []).filter(item => item.isActive);
              if(this.paperInfo && this.paperInfo?.operatingFunction) {
                const data  = this.operatingFunctionsData.find(item => item.id === Number(this.paperInfo?.operatingFunction))
                this.paperInfo = {...this.paperInfo, operatingFunction: data?.itemValue || ""}
              }
              break;

            case 'Proposed CML':
              this.proposedCMLData = (response.data || []).filter(item => item.isActive);
              if(this.paperInfo && this.paperInfo?.contractMgmtLevel) {
                const data  = this.proposedCMLData.find(item => item.id === Number(this.paperInfo?.contractMgmtLevel))
                this.paperInfo = {...this.paperInfo, contractMgmtLevel: data?.itemValue || ""}
              }
              break;

            case 'PSA':
              this.psaData = (response.data || []).filter(item => item.isActive);
              break;

            case 'Remuneration Type':
              this.remunerationTypeData = (response.data || []).filter(item => item.isActive);
              if(this.paperInfo && this.paperInfo?.remunerationType) {
                const data  = this.remunerationTypeData.find(item => item.id === Number(this.paperInfo?.remunerationType))
                this.paperInfo = {...this.paperInfo, remunerationType: data?.itemValue || ""}
              }
              break;

            case 'Sourcing Rigor':
              this.sourcingRigorData = (response.data || []).filter(item => item.isActive);
              if(this.paperInfo && this.paperInfo?.sourcingRigor) {
                const data  = this.sourcingRigorData.find(item => item.id === Number(this.paperInfo?.sourcingRigor))
                this.paperInfo = {...this.paperInfo, sourcingRigor: data?.itemValue || ""}
              }
              break;

            case 'Sourcing Type':
              this.sourcingTypeData = (response.data || []).filter(item => item.isActive);
              if(this.paperInfo && this.paperInfo?.sourcingType) {
                const data  = this.sourcingTypeData.find(item => item.id === Number(this.paperInfo?.sourcingType))
                this.paperInfo = {...this.paperInfo, sourcingType: data?.itemValue || ""}
              }
              break;

            case 'Subsector':
              this.subsectorData = (response.data || []).filter(item => item.isActive);
              if(this.paperInfo && this.paperInfo?.subSector) {
                const data  = this.subsectorData.find(item => item.id === Number(this.paperInfo?.subSector))
                this.paperInfo = {...this.paperInfo, subSector: data?.itemValue || ""}
              }
              break;

            default:
              console.log('Unknown item:', itemName);
              break;
          }
        }
      },
      error: (error) => {
        console.log('Error:', error);
      }
    });
  }


  fetchPaperDetails(paperId: number) {
    this.paperService.getPaperDetailsWithPreview(paperId).subscribe(value => {
      this.paperDetails = value.data;
      console.log('Paper Detail', this.paperDetails);

      if (this.paperDetails.paperTimelineDetails) {
        this.paperTimelineDetails = this.paperDetails.paperTimelineDetails;
        console.log('paperTimelineDetails', this.paperTimelineDetails)
      }

      if (this.paperDetails.paperDetails.riskMitigations) {
        this.riskMitigation = this.paperDetails.paperDetails.riskMitigations;
        console.log('Risk Mitigation', this.riskMitigation)
      }

      if (this.paperDetails.paperDetails.bidInvites) {
        this.bidInvites = this.paperDetails.paperDetails.bidInvites;
        console.log('Bid Invites', this.bidInvites);
      }

      if (this.paperDetails.paperDetails.valueDeliveriesCostsharing) {
        this.valueDeliveriesCostsharing = this.paperDetails.paperDetails.valueDeliveriesCostsharing;
        console.log('Value Delivery', this.valueDeliveriesCostsharing);
      }

      if (this.paperDetails.paperDetails.jvApprovals) {
        this.jvApprovals = this.paperDetails.paperDetails.jvApprovals;
        console.log('jvApprovals ', this.jvApprovals);
      }

      if (this.paperDetails.paperDetails.costAllocationJVApproval) {
        this.costAllocationJVApproval = this.paperDetails.paperDetails.costAllocationJVApproval;
        console.log('costAllocationJVApproval ', this.costAllocationJVApproval);
        this.populateTableData();
        this.calculateTotals();
      }
      if (this.paperDetails.paperDetails.consultationsDetails) {
        this.consultationsDetails = this.paperDetails.paperDetails.consultationsDetails;
        console.log('consultationsDetails ', this.consultationsDetails);
      }

      if (this.paperDetails.paperDetails.paperDetails) {
        this.paperInfo = this.paperDetails.paperDetails.paperDetails;
        console.log('paper Info ', this.paperInfo);
      }
this.loadUserDetails()
      this.loadDictionaryItems()
    })
  }

  getPaperCommentLogs(paperId: number) {
    this.paperService.getPaperCommentLogs(paperId).subscribe(value => {
      this.logs = value.data;
    })
  }

  loadUserDetails() {
    this.userService.getUserDetailsList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.userDetails  = response.data && response.data.length > 0 ? response.data.filter(item => item.isActive) : [];

          if (this.paperInfo?.procurementSPAUsers) {
            const ids = this.paperInfo.procurementSPAUsers
              .split(',')
              .map(id => id.trim())
              .map(id => Number(id));

            console.log("==ids", ids)

            const names = ids
              .map(id => this.userDetails.find(item => item.id === id)?.displayName)
              .filter(name => !!name) // remove undefined/null if not found

            console.log("==names",names)

            this.paperInfo = {
              ...this.paperInfo,
              procurementSPAUsers: names.join(', ')
            };
          }
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  addPaperCommentLogs() {
    this.paperService.addPaperCommentLogs({
      paperId: this.activatedRoutes.snapshot.params['id'],
      logType: "Other",
      remarks: this.comment,
      description: this.comment,
      columnName: "string",
      isActive: true
    }).subscribe(value => {
      this.comment = '';
      this.getPaperCommentLogs(this.activatedRoutes.snapshot.params['id']);
    })
  }

  // Data structure to hold PSA columns
  psaColumns = [
    { name: 'ACG', value: false, percentage: null as number | null, amount: null as number | null },
    { name: 'Shah Deniz', value: false, percentage: null as number | null, amount: null as number | null },
    { name: 'SCP', value: false, percentage: null as number | null, amount: null as number | null },
    { name: 'BTC', value: false, percentage: null as number | null, amount: null as number | null },
    { name: 'Sh-Asiman', value: false, percentage: null as number | null, amount: null as number | null },
    { name: 'BP Group', value: false, percentage: null as number | null, amount: null as number | null }
  ];

  populateTableData(): void {
    // Process PSA columns from costAllocationJVApproval
    this.costAllocationJVApproval.forEach(item => {
      const psaColumn = this.psaColumns.find(col => col.name === item.psaName);
      if (psaColumn) {
        psaColumn.value = item.psaValue;
        psaColumn.percentage = item.percentage;
        psaColumn.amount = item.value;
      }
    });
  }
  calculateTotals(): void {
    // Calculate total percentage and values
    this.psaColumns.forEach(column => {
      if (column.percentage) {
        this.totalPercentage += column.percentage;
      }
      if (column.amount) {
        this.totalValue += column.amount;
      }
    });
  }

  getStatusClass(index: number): string {
    const current = this.paperTimelineDetails[index];
    const status = this.paperDetails?.paperDetails?.paperDetails?.paperStatusName;



    if (current.activityName === 'Pre CGB' && status === 'On Pre-CGB') {
      return 'timeline-box st-prog position-relative'; // In progress
    }
    if (current.activityName === 'Pre CGB' && status === 'Action Required by Pre-CGB') {
      return 'timeline-box st-warn position-relative'; // In progress
    }
    if (current.activityName === 'Pre CGB' && status === 'Withdrawn by Pre-CGB') {
      return 'timeline-box st-rejected position-relative'; // In progress
    }

    if (current.activityName === 'CGB' && status === 'On CGB') {
      return 'timeline-box st-prog position-relative'; // In progress
    }
    if (current.activityName === 'CGB' && status === 'Action Required by CGB') {
      return 'timeline-box st-warn position-relative'; // In progress
    }
    if (current.activityName === 'CGB' && status === 'Withdrawn by CGB') {
      return 'timeline-box st-rejected position-relative'; // In progress
    }

    // ✅ Handle PDM "in progress" status
    if (current.activityName === 'PDM Approval' && status === 'Waiting for PDM') {
      return 'timeline-box st-prog position-relative'; // In progress for PDM
    }
    if (current.isActivityDone) {
      return 'timeline-box st-aprv position-relative'; // Approved
    }
    return 'timeline-box st-pen position-relative'; // Pending
  }

}
