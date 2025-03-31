import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PaperService} from '../../service/paper.service';
import {BidInvites, Paper, RiskMitigations, ValueDeliveriesCostsharing} from '../../models/paper';
import {CommonModule, NgIf} from '@angular/common';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [NgIf,CommonModule],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {

  paperDetails: Paper | null = null;
  riskMitigation: RiskMitigations[]=[];
  bidInvites:BidInvites[]=[];
  valueDeliveriesCostsharing:ValueDeliveriesCostsharing[]=[];

  constructor(private activatedRoutes: ActivatedRoute, private paperService: PaperService) {
  }

  ngOnInit() {
    this.fetchPaperDetails(this.activatedRoutes.snapshot.params['id']);
  }

  fetchPaperDetails(paperId: number) {
    this.paperService.getPaperDetails(paperId).subscribe(value => {
      this.paperDetails = value.data;
      console.log('Paper Detail',this.paperDetails);
      if(this.paperDetails.riskMitigations)
      {
        this.riskMitigation=this.paperDetails.riskMitigations;
        console.log('Risk Mitigation',this.riskMitigation)
      }

      if(this.paperDetails.bidInvites)
      {
        this.bidInvites=this.paperDetails.bidInvites;
        console.log('Bid Invites',this.bidInvites);
      }

      if(this.paperDetails.valueDeliveriesCostsharing)
      {
        this.valueDeliveriesCostsharing=this.paperDetails.valueDeliveriesCostsharing;
        console.log('Value Delivery',this.valueDeliveriesCostsharing);
      }
    })
  }
}
