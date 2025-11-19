import {Component, OnInit, inject, ViewChild, TemplateRef} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {PaperService} from '../../service/paper.service';
import {BidInvites, ConsultationsDetails, CostAllocationJVApproval, JvApprovals, Paper, PaperData, PaperDetails, PaperTimelineDetails, RiskMitigations, ValueDeliveriesCostsharing, PaperStatusType} from '../../models/paper';
import {CommonModule, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import { NgbToastModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import {TimeAgoPipe} from '../../pipes/time-ago.pipe';
import {UserService} from '../../service/user.service';
import {UserDetails, LoginUser} from '../../models/user';
import {DictionaryDetail} from '../../models/dictionary';
import {DictionaryService} from '../../service/dictionary.service';
import {AuthService} from '../../service/auth.service';
import {PaperConfigService} from '../../service/paper/paper-config.service';
import {ActionBarComponent} from '../shared/components/action-bar/action-bar.component';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [NgIf, CommonModule, FormsModule, NgbToastModule, TimeAgoPipe, ActionBarComponent],
  templateUrl: './preview.component.html',
  styleUrl: './preview.component.scss'
})
export class PreviewComponent implements OnInit {
  @ViewChild('content2') content2!: TemplateRef<any>;
  @ViewChild('content3') content3!: TemplateRef<any>;
  @ViewChild('content4') content4!: TemplateRef<any>;
  
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly paperConfigService = inject(PaperConfigService);
  private readonly _mdlSvc = inject(NgbModal);
  private readonly router = inject(Router);
  
  loggedInUser: LoginUser | null = null;
  paperId: string | null = null;
  isSubmitting: boolean = false;
  approvalRemark: string = '';
  reviewBy: string = '';
  selectedPaper: number = 0;
  paperStatusList: PaperStatusType[] = [];
  paperStatusId: number | null = null;
  
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
    this.paperId = this.activatedRoutes.snapshot.params['id'];
    this.authService.userDetails$.subscribe((user: LoginUser | null) => {
      this.loggedInUser = user;
    });
    this.paperService.getPaperStatusList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperStatusList = response.data;
        }
      }
    });
    if (this.paperId) {
      this.fetchPaperDetails(Number(this.paperId));
      this.getPaperCommentLogs(Number(this.paperId));
    }
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
              // Subsector is now a text field, no dictionary lookup needed
              break;
          }
        }
      }
    });
  }


  fetchPaperDetails(paperId: number) {
    this.paperService.getPaperDetailsWithPreview(paperId, 'approch').subscribe(value => {
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
      if (this.paperId) {
        this.getPaperCommentLogs(Number(this.paperId));
      }
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

  handleStatusChange(status: string): void {
    if (status === 'Waiting for PDM') {
      this.setPaperStatus(status, true);
    } else {
      this.setPaperStatus(status, false);
    }
  }

  setPaperStatus(status: string, callAPI: boolean = true): void {
    if (!this.paperStatusList?.length) return;

    this.paperStatusId = this.paperStatusList.find(item => item.paperStatus === status)?.id ?? null;
    if (callAPI && this.paperId) {
      if (this.isSubmitting) return;
      this.isSubmitting = true;
      this.paperConfigService.updateMultiplePaperStatus([{
        paperId: Number(this.paperId),
        existingStatusId: (this.paperDetails?.paperDetails as any)?.paperStatusId,
        statusId: this.paperStatusId
      }]).subscribe({
        next: (value) => {
          this.toastService.show('Paper has been moved to ' + status);
          this.router.navigate(['/all-papers'])
        },
        error: (error) => {
          console.error('Error updating paper status:', error);
          this.toastService.show('Error updating paper status', 'danger');
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  open(event: Event, content: TemplateRef<any>, paperId?: any) {
    event.preventDefault();
    this._mdlSvc.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size: 'lg',
    }).result.then(
      (result) => {},
      (reason) => {}
    );

    if (paperId) {
      this.selectedPaper = Number(paperId);
    } else if (this.paperId) {
      this.selectedPaper = Number(this.paperId);
    }
  }

  addReview(modal: any) {
    if (this.selectedPaper > 0) {
      this.paperService.addPaperCommentLogs({
        paperId: this.selectedPaper,
        logType: 'Other',
        remarks: this.approvalRemark,
        description: this.approvalRemark,
        columnName: '',
        isActive: true,
      }).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            modal.close('Save click');
            this.approvalRemark = '';
            if (this.paperId) {
              this.getPaperCommentLogs(Number(this.paperId));
            }
          }
        },
        error: (error) => {
          console.log('error', error);
        },
      });
    }
  }

  approvePaper(modal: any, type: string) {
    if (this.selectedPaper > 0) {
      this.paperConfigService.approveRejectPaper({
        paperId: this.selectedPaper,
        remarks: this.reviewBy || '',
        description: this.approvalRemark,
        type: this.loggedInUser?.roleName === 'PDM' ? 'PDM Approval' : 'Pre-CGB Approval',
        check: type,
      }).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            modal.close('Save click');
            this.router.navigate(['/all-papers'])
            this.toastService.show('Paper Status updated successfully');
          }
        },
        error: (error) => {
          console.log('error', error);
        },
      });
    }
  }

  handlePartnerApproveReject(status: string) {
    if (!this.paperId) {
      this.toastService.show('Paper ID not found', 'danger');
      return;
    }

    this.isSubmitting = true;
    this.paperConfigService.updatePartnerApprovalStatus(Number(this.paperId), status)
      .subscribe({
        next: (response) => {
          if (response.status && response.data) {
            this.toastService.show(`Paper ${status.toLowerCase()} successfully`, 'success');
            setTimeout(() => {
              this.router.navigate(['/all-papers']);
            }, 2000);
          } else {
            this.toastService.show(response.message || 'Something went wrong', 'danger');
          }
        },
        error: (error) => {
          console.error('Error updating partner approval status:', error);
          this.toastService.show('Failed to update approval status', 'danger');
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }

  getPaperStatusName(): string | null | undefined {
    return (this.paperDetails?.paperDetails as any)?.paperStatusName;
  }

}
