import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaperService } from '../../service/paper.service';
import { BidInvites, CommericalEvaluation, ConsultationsDetails, ContractAwardDetails, CostAllocationJVApproval, JvApprovals, LegalEntitiesAwarded, Paper, PaperData, PaperDetails, PaperTimelineDetails, RiskMitigations, SupplierTechnical, ValueDeliveriesCostsharing } from '../../models/paper';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { SafeHtmlDirective } from '../../directives/safe-html.directive';
import { DictionaryService } from '../../service/dictionary.service';
import { UserService } from '../../service/user.service';
import { DictionaryDetail } from '../../models/dictionary';
import { UserDetails } from '../../models/user';
import { VendorDetail } from '../../models/vendor';
import { VendorService } from '../../service/vendor.service';

@Component({
  selector: 'app-preview2',
  standalone: true,
  imports: [NgIf, CommonModule, FormsModule, NgbToastModule, TimeAgoPipe, SafeHtmlPipe, SafeHtmlDirective],
  templateUrl: './preview2.component.html',
  styleUrl: './preview2.component.scss'
})
export class Preview2Component implements OnInit {
  private readonly userService = inject(UserService);
  private readonly vendorService = inject(VendorService);

  paperDetails: PaperData | null = null;
  comment: string = '';
  logs: any[] = [];
  showComments: boolean = true;
  riskMitigation: RiskMitigations[] = [];
  bidInvites: BidInvites[] = [];
  valueDeliveriesCostsharing: ValueDeliveriesCostsharing[] = [];
  costAllocationJVApproval: CostAllocationJVApproval[] = [];
  jvApprovals: JvApprovals[] = [];
  consultationsDetails: ConsultationsDetails[] = [];
  contractAwardDetails: ContractAwardDetails | null = null;
  legalEntitiesAwarded: LegalEntitiesAwarded[] = [];
  commericalEvaluation: CommericalEvaluation[] = []
  supplierTechnical: SupplierTechnical[] = [];
  paperTimelineDetails: PaperTimelineDetails[] = [];
  paperInfo: PaperDetails | null = null;
  totalPercentage: number = 0;
  totalValue: number = 0
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
  userDetails: UserDetails[] = [];
  vendorList: VendorDetail[] = []


  constructor(private activatedRoutes: ActivatedRoute, private dictionaryService: DictionaryService, private paperService: PaperService, public toastService: ToastService) {
  }

  ngOnInit() {
    this.fetchPaperDetails(this.activatedRoutes.snapshot.params['id']);
    this.getPaperCommentLogs(this.activatedRoutes.snapshot.params['id']);
  }

  fetchPaperDetails(paperId: number) {
    this.paperService.getPaperDetailsWithPreview(paperId, 'contract').subscribe(value => {
      this.paperDetails = value.data;
      console.log('Paper Detail', this.paperDetails);

      if (this.paperDetails.paperTimelineDetails) {
        this.paperTimelineDetails = this.paperDetails.paperTimelineDetails;
        console.log('paperTimelineDetails', this.paperTimelineDetails)
      }

      if (this.paperDetails.paperDetails.riskMitigations) {
        this.riskMitigation = this.paperDetails.paperDetails.riskMitigations.filter(item => item.risks && item.risks.trim() !== '');
        console.log('Risk Mitigation', this.riskMitigation)
      }

      if (this.paperDetails.paperDetails.bidInvites) {
        this.bidInvites = this.paperDetails.paperDetails.bidInvites;
        console.log('Bid Invites', this.bidInvites);
      }

      if (this.paperDetails.paperDetails.valueDeliveries) {
        this.valueDeliveriesCostsharing = this.paperDetails.paperDetails.valueDeliveries;
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
      if (this.paperDetails.paperDetails.consultations) {
        this.consultationsDetails = this.paperDetails.paperDetails.consultations;
        console.log('consultationsDetails ', this.consultationsDetails);
      }

      if (this.paperDetails.paperDetails.paperDetails) {
        this.paperInfo = this.paperDetails.paperDetails.paperDetails;
        console.log('paper Info ', this.paperInfo);
      }

      if (this.paperDetails.paperDetails.commericalEvaluation) {
        this.commericalEvaluation = this.paperDetails.paperDetails.commericalEvaluation;
        console.log('commericalEvaluation ', this.commericalEvaluation);
      }

      if (this.paperDetails.paperDetails.legalEntitiesAwarded) {
        this.legalEntitiesAwarded = this.paperDetails.paperDetails.legalEntitiesAwarded;
        console.log('legalEntitiesAwarded ', this.legalEntitiesAwarded);
      }

      if (this.paperDetails.paperDetails.contractAwardDetails) {
        this.contractAwardDetails = this.paperDetails.paperDetails.contractAwardDetails;
        console.log('contractAwardDetails ', this.contractAwardDetails);
      }

      if (this.paperDetails.paperDetails.supplierTechnical) {
        this.supplierTechnical = this.paperDetails.paperDetails.supplierTechnical;
        console.log('supplierTechnical ', this.supplierTechnical);
      }

      this.loadUserDetails()
      this.loadDictionaryItems()
      this.loadVendoreDetails()
    })
  }

  loadVendoreDetails() {

    this.vendorService.getVendorDetailsList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          this.vendorList = reponse.data;

          if (this.contractAwardDetails && this.contractAwardDetails?.vendorId) {
            const data = this.vendorList.find(item => item.id === Number(this.contractAwardDetails?.vendorId))
            this.contractAwardDetails = { ...this.contractAwardDetails, vendorId: data?.vendorName || "" }
          }
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
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
              if (this.contractAwardDetails && this.contractAwardDetails?.currencyCode) {
                const data = this.currenciesData.find(item => item.id === Number(this.contractAwardDetails?.currencyCode))
                this.contractAwardDetails = { ...this.contractAwardDetails, currencyCode: data?.itemValue || "" }
              }
              break;

            case 'Global CGB':
              this.globalCGBData = (response.data || []).filter(item => item.isActive);
              if (this.contractAwardDetails && this.contractAwardDetails?.globalCGB) {
                const data = this.globalCGBData.find(item => item.id === Number(this.contractAwardDetails?.globalCGB))
                this.contractAwardDetails = { ... this.contractAwardDetails, globalCGB: data?.itemValue || "" }
              }
              break;

            case 'Operating Functions':
              this.operatingFunctionsData = (response.data || []).filter(item => item.isActive);
              if (this.contractAwardDetails && this.contractAwardDetails?.operatingFunction) {
                const data = this.operatingFunctionsData.find(item => item.id === Number(this.contractAwardDetails?.operatingFunction))
                this.contractAwardDetails = { ... this.contractAwardDetails, operatingFunction: data?.itemValue || "" }
              }
              break;

            case 'Proposed CML':
              this.proposedCMLData = (response.data || []).filter(item => item.isActive);
              // if( this.contractAwardDetails &&  this.contractAwardDetails?.contractMgmtLevel) {
              //   const data  = this.proposedCMLData.find(item => item.id === Number( this.contractAwardDetails?.contractMgmtLevel))
              //    this.contractAwardDetails = {... this.contractAwardDetails, contractMgmtLevel: data?.itemValue || ""}
              // }
              break;

            case 'PSA':
              this.psaData = (response.data || []).filter(item => item.isActive);
              break;

            case 'Remuneration Type':
              this.remunerationTypeData = (response.data || []).filter(item => item.isActive);
              if (this.contractAwardDetails && this.contractAwardDetails?.remunerationType) {
                const data = this.remunerationTypeData.find(item => item.id === Number(this.contractAwardDetails?.remunerationType))
                this.contractAwardDetails = { ... this.contractAwardDetails, remunerationType: data?.itemValue || "" }
              }
              break;

            case 'Sourcing Rigor':
              this.sourcingRigorData = (response.data || []).filter(item => item.isActive);
              // if( this.contractAwardDetails &&  this.contractAwardDetails?.sourcingRigor) {
              //   const data  = this.sourcingRigorData.find(item => item.id === Number( this.contractAwardDetails?.sourcingRigor))
              //    this.contractAwardDetails = {... this.contractAwardDetails, sourcingRigor: data?.itemValue || ""}
              // }
              break;

            case 'Sourcing Type':
              this.sourcingTypeData = (response.data || []).filter(item => item.isActive);
              if (this.contractAwardDetails && this.contractAwardDetails?.sourcingType) {
                const data = this.sourcingTypeData.find(item => item.id === Number(this.contractAwardDetails?.sourcingType))
                this.contractAwardDetails = { ... this.contractAwardDetails, sourcingType: data?.itemValue || "" }
              }
              break;

            case 'Subsector':
              this.subsectorData = (response.data || []).filter(item => item.isActive);
              if (this.contractAwardDetails && this.contractAwardDetails?.subSector) {
                const data = this.subsectorData.find(item => item.id === Number(this.contractAwardDetails?.subSector))
                this.contractAwardDetails = { ... this.contractAwardDetails, subSector: data?.itemValue || "" }
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

  loadUserDetails() {
    this.userService.getUserDetailsList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.userDetails = response.data && response.data.length > 0 ? response.data.filter(item => item.isActive) : [];

          if (this.contractAwardDetails?.procurementSPAUsers) {
            const ids = this.contractAwardDetails.procurementSPAUsers
              .split(',')
              .map(id => id.trim())
              .map(id => Number(id));

            console.log("==ids", ids)

            const names = ids
              .map(id => this.userDetails.find(item => item.id === id)?.displayName)
              .filter(name => !!name) // remove undefined/null if not found

            console.log("==names", names)

            this.contractAwardDetails = {
              ... this.contractAwardDetails,
              procurementSPAUsers: names.join(', ')
            };
          }
        }
      }, error: (error) => {
        console.log('error', error);
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
    console.log('ddddd', this.costAllocationJVApproval);
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

  // Helper methods for dynamic PSAJV columns (similar to template1)
  getSelectedPSAJVColumns(): string[] {
    if (!this.contractAwardDetails?.psajv) {
      return [];
    }
    return this.contractAwardDetails.psajv.split(',').map((psa: string) => psa.trim());
  }

  getPSACheckboxValue(psa: string): boolean {
    const psaEntry = this.costAllocationJVApproval.find(entry => entry.psaName === psa);
    return psaEntry?.psaValue || false;
  }

  getPSAPercentageValue(psa: string): number | null {
    const psaEntry = this.costAllocationJVApproval.find(entry => entry.psaName === psa);
    return psaEntry?.percentage || null;
  }

  getPSAValueValue(psa: string): number | null {
    const psaEntry = this.costAllocationJVApproval.find(entry => entry.psaName === psa);
    return psaEntry?.value || null;
  }

  getTotalPercentage(): number {
    return this.totalPercentage;
  }

  getTotalValue(): number {
    return this.totalValue;
  }

  hasFirstCommitteeCheckbox(psa: string): boolean {
    const psaLower = psa.toLowerCase();
    return ['acg', 'shah deniz', 'scp', 'btc'].includes(psaLower);
  }

  hasSecondCommitteeCheckbox(psa: string): boolean {
    const psaLower = psa.toLowerCase();
    return ['acg', 'shah deniz', 'scp'].includes(psaLower);
  }

  getFirstCommitteeValue(psa: string): boolean {
    if (!this.jvApprovals || this.jvApprovals.length === 0) return false;
    
    const psaLower = psa.toLowerCase();
    const jvApproval = this.jvApprovals[0];
    
    switch (psaLower) {
      case 'acg':
        return jvApproval.coVenturers_CMC || false;
      case 'shah deniz':
        return jvApproval.contractCommittee_SDCC || false;
      case 'scp':
        return jvApproval.contractCommittee_SCP_Co_CC || false;
      case 'btc':
        return jvApproval.contractCommittee_BTC_CC || false;
      default:
        return false;
    }
  }

  getSecondCommitteeValue(psa: string): boolean {
    if (!this.jvApprovals || this.jvApprovals.length === 0) return false;
    
    const psaLower = psa.toLowerCase();
    const jvApproval = this.jvApprovals[0];
    
    switch (psaLower) {
      case 'acg':
        return jvApproval.steeringCommittee_SC || false;
      case 'shah deniz':
        return jvApproval.coVenturers_SDMC || false;
      case 'scp':
        return jvApproval.coVenturers_SCP || false;
      default:
        return false;
    }
  }

  getFirstCommitteeLabel(psa: string): string {
    const psaLower = psa.toLowerCase();
    const mapping: { [key: string]: string } = {
      "acg": "CMC",
      "shah deniz": "SDCC",
      "scp": "SCP Co CC",
      "btc": "BTC CC"
    };
    return mapping[psaLower] || '';
  }

  getSecondCommitteeLabel(psa: string): string {
    const psaLower = psa.toLowerCase();
    const mapping: { [key: string]: string } = {
      "acg": "SC",
      "shah deniz": "SDMC",
      "scp": "SCP Board"
    };
    return mapping[psaLower] || '';
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
  }

}
