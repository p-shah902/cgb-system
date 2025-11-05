import {Component, OnInit, inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {PaperService} from '../../service/paper.service';
import {BidInvites, ConsultationsDetails, CostAllocationJVApproval, JvApprovals, Paper, PaperData, PaperDetails, PaperTimelineDetails, RiskMitigations, ValueDeliveriesCostsharing} from '../../models/paper';
import {CommonModule, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import {UserService} from '../../service/user.service';
import {UserDetails} from '../../models/user';
import {DictionaryDetail} from '../../models/dictionary';
import {DictionaryService} from '../../service/dictionary.service';
import {TimeAgoPipe} from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-preview4',
  standalone: true,
  imports: [NgIf, CommonModule, FormsModule, NgbToastModule, TimeAgoPipe],
  templateUrl: './preview4.component.html',
  styleUrl: './preview4.component.scss'
})
export class Preview4Component implements OnInit {
  private readonly userService = inject(UserService);
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
  paperTimelineDetails: PaperTimelineDetails[] = [];
  paperInfo: PaperDetails | null = null;
  totalPercentage: number = 0;
  totalValue: number = 0
  userDetails: UserDetails[] = [];
  selectedFiles: any[] = [];
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
    this.paperService.getPaperDetailsWithPreview(paperId, 'sale').subscribe(value => {
      this.paperDetails = value.data as any;
      console.log('Paper Detail', this.paperDetails);

      if (this.paperDetails?.paperTimelineDetails) {
        this.paperTimelineDetails = this.paperDetails.paperTimelineDetails;
        console.log('paperTimelineDetails', this.paperTimelineDetails)
      }

      if (this.paperDetails?.paperDetails?.riskMitigations) {
        this.riskMitigation = this.paperDetails.paperDetails.riskMitigations.filter(item => item.risks && item.risks.trim() !== '');
        console.log('Risk Mitigation', this.riskMitigation)
      }

      if (this.paperDetails?.paperDetails?.bidInvites) {
        this.bidInvites = this.paperDetails.paperDetails.bidInvites;
        console.log('Bid Invites', this.bidInvites);
      }

      if (this.paperDetails?.paperDetails?.valueDeliveriesCostsharing) {
        this.valueDeliveriesCostsharing = this.paperDetails.paperDetails.valueDeliveriesCostsharing;
        console.log('Value Delivery', this.valueDeliveriesCostsharing);
      }

      if (this.paperDetails?.paperDetails?.jvApprovals) {
        this.jvApprovals = this.paperDetails.paperDetails.jvApprovals;
        console.log('jvApprovals ', this.jvApprovals);
      }

      if (this.paperDetails?.paperDetails?.costAllocationJVApproval) {
        this.costAllocationJVApproval = this.paperDetails.paperDetails.costAllocationJVApproval;
        console.log('costAllocationJVApproval ', this.costAllocationJVApproval);
        this.populateTableData();
        this.calculateTotals();
      }
      if (this.paperDetails?.paperDetails?.consultationsDetails) {
        // Map consultation fields to match HTML expectations
        this.consultationsDetails = this.paperDetails.paperDetails.consultationsDetails.map((item: any) => ({
          ...item,
          technicalCorrectId: item.technicalCorrect || item.technicalCorrectId,
          budgetStatementId: item.budgetStatement || item.budgetStatementId,
          jvReviewId: item.jvReview || item.jvReviewId,
          // Ensure names are available
          technicalCorrectName: item.technicalCorrectName,
          budgetStatementName: item.budgetStatementName,
          jvReviewName: item.jvReviewName
        }));
        console.log('consultationsDetails ', this.consultationsDetails);
      }

      if (this.paperDetails?.paperDetails?.paperDetails) {
        const paperInfoData = this.paperDetails.paperDetails.paperDetails as any;
        // Map property names to match HTML expectations
        this.paperInfo = {
          ...paperInfoData,
          cgbItemRefNo: paperInfoData.cgbItemRef || paperInfoData.cgbItemRefNo || '',
          cgbCirculationDate: paperInfoData.cgbCirculationDate || null
        };
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
    // Reset totals before recalculating
    this.totalPercentage = 0;
    this.totalValue = 0;
    
    // Reset all PSA columns
    this.psaColumns.forEach(col => {
      col.value = false;
      col.percentage = null;
      col.amount = null;
    });
    
    // Process PSA columns from costAllocationJVApproval
    this.costAllocationJVApproval.forEach(item => {
      const psaColumn = this.psaColumns.find(col => col.name === item.psaName);
      if (psaColumn) {
        psaColumn.value = item.psaValue;
        psaColumn.percentage = item.percentage;
        psaColumn.amount = item.value;
        
        // Add to totals
        if (item.percentage) {
          this.totalPercentage += item.percentage;
        }
        if (item.value) {
          this.totalValue += item.value;
        }
      }
    });
  }
  
  calculateTotals(): void {
    // Totals are now calculated in populateTableData
    // This method is kept for backward compatibility
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
    if (!this.paperInfo?.psajv) {
      return [];
    }
    return this.paperInfo.psajv.split(',').map((psa: string) => psa.trim());
  }

  getPSACheckboxValue(psa: string): boolean {
    const psaEntry = this.costAllocationJVApproval.find(entry => entry.psaName === psa);
    return psaEntry?.psaValue || false;
  }

  getPSAPercentageValue(psa: string): number | null {
    const psaEntry = this.costAllocationJVApproval.find(entry => entry.psaName === psa);
    return psaEntry?.percentage ?? null;
  }

  getPSAValueValue(psa: string): number | null {
    const psaEntry = this.costAllocationJVApproval.find(entry => entry.psaName === psa);
    return psaEntry?.value ?? null;
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

  getDisplayName(userId: number | null | undefined): string {
    if (!userId) return 'N/A';
    const user = this.userDetails.find(u => u.id === Number(userId));
    return user ? user.displayName : 'N/A';
  }

  exportToPDF() {
    if (this.activatedRoutes.snapshot.params['id']) {
      const paperId = Number(this.activatedRoutes.snapshot.params['id']);
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
        }
      });
    } else {
      this.toastService.show('Paper ID not found', 'danger');
    }
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

  scrollToSection(event: any) {
    // Implementation for scroll to section
  }

  onSearch(event: any) {
    // Implementation for search functionality
  }

  toggleComments(): void {
    this.showComments = !this.showComments;
  }

  calculateContractValue(): string {
    if (this.paperInfo?.contractValue && this.paperInfo?.exchangeRate) {
      const contractValue = Number(this.paperInfo.contractValue);
      const exchangeRate = Number(this.paperInfo.exchangeRate);
      const calculatedValue = contractValue * exchangeRate;
      return `${calculatedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${this.paperInfo?.contractValue || 0} * ${this.paperInfo?.exchangeRate || 0}`;
  }

}
