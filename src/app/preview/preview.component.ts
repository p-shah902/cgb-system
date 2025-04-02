import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PaperService} from '../../service/paper.service';
import {BidInvites, ConsultationsDetails, CostAllocationJVApproval, JvApprovals, Paper, PaperData, PaperDetails, PaperTimelineDetails, RiskMitigations, ValueDeliveriesCostsharing} from '../../models/paper';
import {CommonModule, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import {TimeAgoPipe} from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [NgIf, CommonModule, FormsModule, NgbToastModule, TimeAgoPipe],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {

  paperDetails: PaperData | null = null;
  comment: string = '';
  logs: any[] = [];
  riskMitigation: RiskMitigations[] = [];
  bidInvites: BidInvites[] = [];
  valueDeliveriesCostsharing: ValueDeliveriesCostsharing[] = [];
  costAllocationJVApproval:CostAllocationJVApproval[]=[];
  jvApprovals:JvApprovals[]=[];
  consultationsDetails:ConsultationsDetails[]=[];
  paperTimelineDetails:PaperTimelineDetails[]=[];
  paperInfo:PaperDetails|null=null;
  totalPercentage: number = 0;
  totalValue: number = 0


  constructor(private activatedRoutes: ActivatedRoute, private paperService: PaperService,public toastService:ToastService) {
  }

  ngOnInit() {
    this.fetchPaperDetails(this.activatedRoutes.snapshot.params['id']);
    this.getPaperCommentLogs(this.activatedRoutes.snapshot.params['id']);
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

      if(this.paperDetails.paperDetails.jvApprovals )
      {
        this.jvApprovals=this.paperDetails.paperDetails.jvApprovals;
        console.log('jvApprovals ',this.jvApprovals);
      }

      if(this.paperDetails.paperDetails.costAllocationJVApproval)
      {
        this.costAllocationJVApproval=this.paperDetails.paperDetails.costAllocationJVApproval;
        console.log('costAllocationJVApproval ',this.costAllocationJVApproval);
        this.populateTableData();
        this.calculateTotals();
      }
      if(this.paperDetails.paperDetails.consultationsDetails)
      {
          this.consultationsDetails=this.paperDetails.paperDetails.consultationsDetails;
          console.log('consultationsDetails ',this.consultationsDetails);
      }

      if(this.paperDetails.paperDetails.paperDetails)
      {
            this.paperInfo=this.paperDetails.paperDetails.paperDetails;
            console.log('paper Info ',this.paperInfo);
      }
    })
  }

  getPaperCommentLogs(paperId: number) {
    this.paperService.getPaperCommentLogs(paperId).subscribe(value => {
      this.logs = value.data;
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
    console.log('ddddd',this.costAllocationJVApproval);
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
    const previous = index > 0 ? this.paperTimelineDetails[index - 1] : null;

    if (current.isActivityDone) {
      return 'timeline-box st-aprv position-relative'; // Approved
    } else if (previous && previous.isActivityDone) {
      return 'timeline-box st-prog position-relative'; // In progress (prev completed)
    } else {
      return 'timeline-box st-pen position-relative'; // Pending
    }
  }

}
