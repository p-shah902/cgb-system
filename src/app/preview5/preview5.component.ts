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
import {SafeHtmlPipe} from '../../pipes/safe-html.pipe';
import {SafeHtmlDirective} from '../../directives/safe-html.directive';
import {VendorService} from '../../service/vendor.service';
import {VendorDetail} from '../../models/vendor';
import {UploadService} from '../../service/document.service';

@Component({
  selector: 'app-preview5',
  standalone: true,
  imports: [NgIf, CommonModule, FormsModule, NgbToastModule, TimeAgoPipe, SafeHtmlPipe, SafeHtmlDirective],
  templateUrl: './preview5.component.html',
  styleUrl: './preview5.component.scss'
})
export class Preview5Component implements OnInit {
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
  paperTimelineDetails: PaperTimelineDetails[] = [];
  paperInfo: PaperDetails | null = null;
  totalPercentage: number = 0;
  totalValue: number = 0
  userDetails: UserDetails[] = [];
  vendorList: VendorDetail[] = [];
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
  constructor(private activatedRoutes: ActivatedRoute,private dictionaryService: DictionaryService, private paperService: PaperService,public toastService:ToastService, private uploadService: UploadService) {
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
    this.paperService.getPaperDetailsWithPreview(paperId, 'info').subscribe(value => {
      this.paperDetails = value.data as any;
      console.log('Paper Detail', this.paperDetails);

      if (this.paperDetails?.paperTimelineDetails) {
        this.paperTimelineDetails = this.paperDetails.paperTimelineDetails;
        console.log('paperTimelineDetails', this.paperTimelineDetails)
      }

      // API structure: data.paperDetails.paperDetails (paper info), data.paperDetails.consultationsDetails, etc.
      // They are nested under paperDetails
      const paperData = this.paperDetails?.paperDetails as any;
      
      if (paperData?.riskMitigations) {
        this.riskMitigation = paperData.riskMitigations.filter((item: any) => item.risks && item.risks.trim() !== '');
        console.log('Risk Mitigation', this.riskMitigation)
      }

      if (paperData?.bidInvites) {
        this.bidInvites = paperData.bidInvites;
        console.log('Bid Invites', this.bidInvites);
      }

      if (paperData?.valueDeliveriesCostsharing) {
        this.valueDeliveriesCostsharing = paperData.valueDeliveriesCostsharing;
        console.log('Value Delivery', this.valueDeliveriesCostsharing);
      }

      if (paperData?.jvApprovals) {
        this.jvApprovals = paperData.jvApprovals;
        console.log('jvApprovals ', this.jvApprovals);
      }

      // API returns costAllocationJVApproval (not costAllocations for Info Note)
      if (paperData?.costAllocationJVApproval) {
        this.costAllocationJVApproval = paperData.costAllocationJVApproval;
        console.log('costAllocationJVApproval ', this.costAllocationJVApproval);
        this.populateTableData();
        this.calculateTotals();
      }
      
      // consultationsDetails is under paperDetails.paperDetails
      if (paperData?.consultationsDetails) {
        this.consultationsDetails = paperData.consultationsDetails.map((consultation: any) => ({
          ...consultation,
          jvAligned: consultation.jvAligned !== undefined ? consultation.jvAligned : consultation.isJVReviewDone
        }));
        console.log('consultationsDetails ', this.consultationsDetails);
      }

      // For Info Note, paperDetails is nested under paperDetails.paperDetails
      if (paperData?.paperDetails) {
        this.paperInfo = paperData.paperDetails;
        console.log('paper Info ', this.paperInfo);
      } else if (paperData) {
        // If paperDetails is directly the paper info
        this.paperInfo = paperData as any;
        console.log('paper Info (direct)', this.paperInfo);
      }
      
      this.loadUserDetails()
      this.loadDictionaryItems()
      this.loadVendorDetails()
      this.loadSelectedFiles()
    })
  }

  loadVendorDetails() {
    this.vendorService.getVendorDetailsList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.vendorList = response.data;
          
          // Resolve vendorId to vendor name
          if (this.paperInfo && (this.paperInfo as any)?.vendorId) {
            const vendorId = Number((this.paperInfo as any).vendorId);
            const vendor = this.vendorList.find(v => v.id === vendorId);
            if (vendor) {
              this.paperInfo = {
                ...this.paperInfo,
                legalName: vendor.vendorName
              } as any;
            }
          }
        }
      },
      error: (error) => {
        console.log('error loading vendors', error);
      }
    });
  }

  loadSelectedFiles() {
    const paperId = this.activatedRoutes.snapshot.params['id'];
    if (paperId) {
      this.uploadService.getDocItemsListByPaperId(Number(paperId)).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            this.selectedFiles = response.data.map((file: any) => ({
              name: file.fileName || file.name,
              preview: file.fileUrl || file.preview,
              isImage: file.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif)$/i.test(file.fileName || file.name || ''),
              fileUrl: file.fileUrl
            }));
          }
        },
        error: (error) => {
          console.log('error loading files', error);
        }
      });
    }
  }

  // Helper method to safely access info note-specific properties
  getInfoNoteProperty(property: string): any {
    return (this.paperInfo as any)?.[property];
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

  getDisplayName(userId: number): string {
    const user = this.userDetails.find(u => u.id === userId);
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
