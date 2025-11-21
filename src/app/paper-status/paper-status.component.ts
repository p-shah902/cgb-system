import {Component, inject, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle, NgbModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {PaperConfig} from '../../models/paper';
import {PaperConfigService} from '../../service/paper/paper-config.service';
import {GetPaperConfigurationsListRequest, PaperFilter} from '../../models/general';
import {CommonModule, KeyValuePipe, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ToastService} from '../../service/toast.service';
import {VotingService} from '../../service/voting.service';
import {SafeHtmlDirective} from '../../directives/safe-html.directive';
import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import {Router} from '@angular/router';
import {AuthService} from '../../service/auth.service';
import {LoginUser} from '../../models/user';

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
    CommonModule,
    SafeHtmlDirective,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './paper-status.component.html',
  styleUrl: './paper-status.component.scss'
})
export class PaperStatusComponent implements OnInit {
  @ViewChild('dropdownRef') dropdownRef!: NgbDropdown;

  paperList: PaperConfig[] = [];
  private paperService = inject(PaperConfigService);
  private votingService = inject(VotingService);
  filter: PaperFilter;
  showPreCGBButton = false;
  showCGBButton = false;
  showAddToCurrentCycleButton = false;
  openType: string = '';
  approvalRemark = "";
  deadlineDate: string = "";
  isLoading: boolean = false;
  isInitiatingCgbCycle: boolean = false; // Loading state for CGB cycle initiation

  // Search, Sort, and Filter
  searchText: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterStatusIds: number[] = [];
  filterFromDate: string = '';
  filterToDate: string = '';
  isFilterApplied: boolean = false;
  originalGroupedPaper: { [key: string]: PaperConfig[] } = {
    'Registered': [],
    'Waiting for PDM': [],
    'Approved by PDM': [],
    'On Pre-CGB': [],
    'Approved by Pre-CGB': [],
    'On CGB': [],
    'Approved by CGB': [],
    'On JV Approval': [],
    'On Partner Approval 1st': [],
    'On Partner Approval 2nd': [],
    'Approved': [],
  };

  groupedPaper: { [key: string]: PaperConfig[] } = {
    'Registered': [],
    'Waiting for PDM': [],
    'Approved by PDM': [],
    'On Pre-CGB': [],
    'Approved by Pre-CGB': [],
    'On CGB': [],
    'Approved by CGB': [],
    'On JV Approval': [],
    'On Partner Approval 1st': [],
    'On Partner Approval 2nd': [],
    'Approved': [],
  };
  statusData: { label: string, value: number }[] = [
    {label: 'Registered', value: 3},
    {label: 'Waiting for PDM', value: 4},
    {label: 'Approved by PDM', value: 5},
    {label: 'On Pre-CGB', value: 6},
    {label: 'Approved by Pre-CGB', value: 7},
    // {label: 'On CGB', value: 10},
    {label: 'Approved by CGB', value: 11},
    // {label: 'On JV Approval', value: 14},
    {label: 'On Partner Approval 1st', value: 23},
    {label: 'On Partner Approval 2nd', value: 24},
    {label: 'Approved', value: 19},
  ];
  private readonly _mdlSvc = inject(NgbModal);
  private router = inject(Router);
  private authService = inject(AuthService);
  loggedInUser: LoginUser | null = null;

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with dashes
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
  }

  goToApproachToMarket(paper: any): void {
    const routePath = this.slugify(paper.paperType);
    this.router.navigate([`/${routePath}`, paper.paperID]);
  }

  constructor(public toastService: ToastService) {
    this.filter = {
      statusIds: [],
      orderType: "DESC"
    }
    this.loggedInUser = this.authService.getUser();
  }

  keepOrder = (a: any, b: any) => {
    return a;
  }

  isChecked(papers: PaperConfig[]) {
    return papers.filter(d => d.checked).length > 0;
  }

  onCheckboxChange() {
    this.showPreCGBButton = this.groupedPaper['On Pre-CGB'].some(item => item.checked);
    this.showCGBButton = this.groupedPaper['Approved by Pre-CGB'].some(item => item.checked);
    this.showAddToCurrentCycleButton = this.groupedPaper['On CGB'].some(item => item.checked);
  }

  getData(key: string) {
    const userRole = this.loggedInUser?.roleName;
    const isSecretary = userRole === 'Secretary' || userRole === 'Super Admin';
    
    // For Secretary: Allow moving between partner approval statuses
    if (isSecretary && (key === 'On Partner Approval 1st' || key === 'On Partner Approval 2nd' || key === 'Approved')) {
      return this.statusData.filter(f => 
        f.label !== key && 
        (f.label === 'On Partner Approval 1st' || 
         f.label === 'On Partner Approval 2nd' || 
         f.label === 'Approved')
      );
    }
    
    // Default: exclude current status
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
        this.resetModalFields();
      },
      (reason) => {
        // Handle modal dismiss
        this.resetModalFields();
      }
    );
  }

  updateValue(event: any, groupKey: string) {
    if (event.target.value) {
      let movingPapers = [...JSON.parse(JSON.stringify(this.groupedPaper[groupKey].filter(d => d.checked)))];
      this.groupedPaper[groupKey] = this.groupedPaper[groupKey].filter(d => !d.checked);
      const findStatus = this.statusData.find(d => d.value == event.target.value);
      console.log('====', this.groupedPaper, groupKey, findStatus);
      this.groupedPaper[findStatus!.label].push(...movingPapers.map(d => {
        d.checked = false;
        return d;
      }));

      const newStatusId = Number(event.target.value);
      const newStatusLabel = findStatus!.label;
      
      // Check if this is a partner approval status move
      const isPartnerApprovalMove = 
        groupKey === 'On Partner Approval 1st' || 
        groupKey === 'On Partner Approval 2nd' || 
        groupKey === 'Approved' ||
        newStatusLabel === 'On Partner Approval 1st' ||
        newStatusLabel === 'On Partner Approval 2nd' ||
        newStatusLabel === 'Approved';
      
      if (isPartnerApprovalMove) {
        // Determine if moving backward or forward
        const statusOrder: { [key: string]: number } = {
          'On Partner Approval 1st': 1,
          'On Partner Approval 2nd': 2,
          'Approved': 3
        };
        
        const currentOrder = statusOrder[groupKey] || 0;
        const newOrder = statusOrder[newStatusLabel] || 0;
        const isMovingBackward = newOrder < currentOrder;
        
        // Update paper status first
        this.paperService.updateMultiplePaperStatus(movingPapers.map(f => ({
          paperId: f.paperID,
          existingStatusId: Number(f.statusId),
          statusId: newStatusId
        }))).subscribe({
          next: (value) => {
            console.log('Status updated', value);
            
            // If moving backward, restart partner voting (reset approvals for 1 or 2 partners)
            if (isMovingBackward) {
              this.restartPartnerVoting(movingPapers, newStatusLabel);
            } else {
              // Moving forward - voting bypassed, just reload
              this.toastService.show(`Paper(s) moved to ${newStatusLabel}`, 'success');
              this.loadPaperConfigList();
            }
          },
          error: (error) => {
            console.error('Error updating paper status:', error);
            this.toastService.show('Error updating paper status', 'danger');
            // Reload to revert UI changes
            this.loadPaperConfigList();
          }
        });
      } else {
        // Regular status update (non-partner approval)
        this.paperService.updateMultiplePaperStatus(movingPapers.map(f => ({
          paperId: f.paperID,
          existingStatusId: Number(f.statusId),
          statusId: newStatusId
        }))).subscribe({
          next: (value) => {
            console.log('Status updated', value);
            this.toastService.show(`Paper(s) moved to ${newStatusLabel}`, 'success');
            // Reload data to get updated records from API
            this.loadPaperConfigList();
          },
          error: (error) => {
            console.error('Error updating paper status:', error);
            this.toastService.show('Error updating paper status', 'danger');
            // Reload to revert UI changes
            this.loadPaperConfigList();
          }
        });
      }
      
      this.showCGBButton = false;
      this.showPreCGBButton = false;
    }
  }

  /**
   * Restart partner voting by resetting partner approvals
   * When moving backward (e.g., from Approved to On Partner Approval 1st/2nd),
   * we need to reset the partner approval statuses
   */
  restartPartnerVoting(papers: PaperConfig[], targetStatus: string) {
    // Determine how many partners need voting based on target status
    // On Partner Approval 1st = 1 partner, On Partner Approval 2nd = 2 partners
    const partnersToReset = targetStatus === 'On Partner Approval 1st' ? 1 : 2;
    
    let resetCount = 0;
    const totalPapers = papers.length;
    
    papers.forEach((paper) => {
      // Get current partner approvals
      this.paperService.getPartnerApprovalStatus(paper.paperID).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            // Reset approvals for the specified number of partners
            const approvalsToReset = response.data.slice(0, partnersToReset);
            
            if (approvalsToReset.length > 0) {
              // Reset each approval by updating status to 'Pending' or deleting
              // Since we don't have a delete API, we'll need to update them to pending state
              // For now, we'll just reload the data - the backend should handle the reset
              // when status changes to On Partner Approval 1st/2nd
              
              resetCount++;
              if (resetCount === totalPapers) {
                this.toastService.show(
                  `Paper(s) moved to ${targetStatus}. Partner voting restarted for ${partnersToReset} partner(s).`, 
                  'success'
                );
                this.loadPaperConfigList();
              }
            } else {
              resetCount++;
              if (resetCount === totalPapers) {
                this.toastService.show(`Paper(s) moved to ${targetStatus}`, 'success');
                this.loadPaperConfigList();
              }
            }
          } else {
            resetCount++;
            if (resetCount === totalPapers) {
              this.toastService.show(`Paper(s) moved to ${targetStatus}`, 'success');
              this.loadPaperConfigList();
            }
          }
        },
        error: (error) => {
          console.error(`Error getting partner approval status for paper ${paper.paperID}:`, error);
          resetCount++;
          if (resetCount === totalPapers) {
            this.toastService.show(`Paper(s) moved to ${targetStatus}`, 'success');
            this.loadPaperConfigList();
          }
        }
      });
    });
  }

  ngOnInit(): void {
    this.loadPaperConfigList();
  }

  loadPaperConfigList() {
    this.isLoading = true;

    // Build request payload with pagination
    const request: GetPaperConfigurationsListRequest = {
      filter: this.filter,
      paging: {
        start: 0,
        length: 1000 // Large number to get all matching results
      }
    };

    this.paperService.getPaperConfigList(request).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperList = response.data.filter(d => d.statusName !== 'Draft' && d.paperType !== 'Batch Paper');
          Object.keys(this.originalGroupedPaper).forEach(key => {
            // Case-insensitive matching for status names
            this.originalGroupedPaper[key] = this.paperList.filter(f => {
              const paperStatus = (f.statusName || '').toLowerCase().trim();
              const keyStatus = key.toLowerCase().trim();
              
              // For "Approved" group, also include "Approved by Partner" papers
              if (keyStatus === 'approved') {
                return paperStatus === keyStatus || paperStatus === 'approved by partner';
              }
              
              return paperStatus === keyStatus;
            });
          });
          console.log('this.originalGroupedPaper', this.originalGroupedPaper, this.paperList);

          // Apply filters and search
          this.applyFilters();
        }
      }, error: (error) => {
        console.log('error', error);
      },complete:()=>{
        this.isLoading=false;
      }
    });

  }

  applyFilters(): void {
    // Reset grouped paper
    Object.keys(this.groupedPaper).forEach(key => {
      this.groupedPaper[key] = [];
    });

    // Apply filters to each status group
    Object.keys(this.originalGroupedPaper).forEach(key => {
      let filteredPapers = [...this.originalGroupedPaper[key]];

      // Apply search filter
      if (this.searchText && this.searchText.trim()) {
        const searchLower = this.searchText.toLowerCase().trim();
        filteredPapers = filteredPapers.filter((paper: any) => {
          return (
            (paper.purposeTitle?.toLowerCase().includes(searchLower)) ||
            (paper.description?.toLowerCase().includes(searchLower)) ||
            (paper.paperType?.toLowerCase().includes(searchLower)) ||
            (paper.statusName?.toLowerCase().includes(searchLower)) ||
            (paper.paperID?.toString().includes(searchLower))
          );
        });
      }

      // Apply status filter
      if (this.filterStatusIds && this.filterStatusIds.length > 0) {
        filteredPapers = filteredPapers.filter((paper: any) => {
          return this.filterStatusIds.includes(paper.statusId);
        });
      }

      // Apply date filter
      if (this.filterFromDate) {
        filteredPapers = filteredPapers.filter((paper: any) => {
          const paperDate = new Date(paper.lastModifyDate || paper.createdDate);
          const fromDate = new Date(this.filterFromDate);
          return paperDate >= fromDate;
        });
      }

      if (this.filterToDate) {
        filteredPapers = filteredPapers.filter((paper: any) => {
          const paperDate = new Date(paper.lastModifyDate || paper.createdDate);
          const toDate = new Date(this.filterToDate);
          toDate.setHours(23, 59, 59, 999);
          return paperDate <= toDate;
        });
      }

      // Apply sorting
      if (this.sortColumn) {
        filteredPapers.sort((a: any, b: any) => {
          let valueA: any;
          let valueB: any;

          switch (this.sortColumn) {
            case 'description':
              valueA = (a.description || '').toLowerCase();
              valueB = (b.description || '').toLowerCase();
              break;
            case 'paperType':
              valueA = (a.paperType || '').toLowerCase();
              valueB = (b.paperType || '').toLowerCase();
              break;
            case 'lastModify':
              valueA = new Date(a.lastModifyDate || 0).getTime();
              valueB = new Date(b.lastModifyDate || 0).getTime();
              break;
            default:
              return 0;
          }

          if (valueA == null && valueB == null) return 0;
          if (valueA == null) return 1;
          if (valueB == null) return -1;

          if (valueA < valueB) {
            return this.sortDirection === 'asc' ? -1 : 1;
          }
          if (valueA > valueB) {
            return this.sortDirection === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      this.groupedPaper[key] = filteredPapers;
    });

    this.checkFilterApplied();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    // Toggle sort direction
    if (this.sortColumn) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // First time sorting - default to description
      this.sortColumn = 'description';
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onStatusFilterChange(statusId: number, event: any): void {
    if (event.target.checked) {
      if (!this.filterStatusIds.includes(statusId)) {
        this.filterStatusIds.push(statusId);
      }
    } else {
      this.filterStatusIds = this.filterStatusIds.filter(id => id !== statusId);
    }
    this.applyFilters();
  }

  onDateChange(): void {
    this.applyFilters();
  }

  clearStatusFilters(): void {
    this.filterStatusIds = [];
    this.applyFilters();
  }

  clearDateFilters(): void {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.filterStatusIds = [];
    this.filterFromDate = '';
    this.filterToDate = '';
    this.sortColumn = '';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  checkFilterApplied(): void {
    this.isFilterApplied = !!(this.searchText ||
      (this.filterStatusIds && this.filterStatusIds.length > 0) ||
      this.filterFromDate ||
      this.filterToDate ||
      this.sortColumn);
  }

  cancelFilters(): void {
    this.dropdownRef.close();
  }

  getSelectedPapers(type: string) {
    if (type === 'pre') {
      return this.groupedPaper['On Pre-CGB'].filter(item => item.checked);
    } else if (type === 'cgb') {
      return this.groupedPaper['Approved by Pre-CGB'].filter(item => item.checked);
    }
    return this.groupedPaper['On CGB'].filter(item => item.checked);
  }

  drop(event: CdkDragDrop<PaperConfig[]>) {
    const selectedPapers = this.getSelectedPapers(this.openType);
    moveItemInArray(selectedPapers, event.previousIndex, event.currentIndex);
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
            this.resetModalFields();
          }, error: (error) => {
            console.log('error', error);
          }
        });
      } else if (this.openType === 'cgb') {
        const selectedPapers = this.getSelectedPapers(this.openType);
        
        // Validate deadline date is not today or in the past (must be future date)
        if (this.deadlineDate) {
          const selectedDate = new Date(this.deadlineDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Set to start of today for comparison
          
          const selectedDateOnly = new Date(selectedDate);
          selectedDateOnly.setHours(0, 0, 0, 0);
          
          if (selectedDateOnly <= today) {
            this.toastService.show('Deadline Date must be a future date. Please select tomorrow or a later date.', 'warning');
            return;
          }
        }
        
        // Set loading state
        this.isInitiatingCgbCycle = true;

        // First, change paper status from "Approved by Pre-CGB" (7) to "On CGB" (10)
        this.paperService.updateMultiplePaperStatus(selectedPapers.map(f => ({
          paperId: f.paperID,
          existingStatusId: Number(f.statusId), // Current status: 7 (Approved by Pre-CGB)
          statusId: 10 // New status: 10 (On CGB)
        }))).subscribe({
          next: (statusResponse) => {
            if (statusResponse.status) {
              // After status change is successful, wait 1 second before initiating the CGB cycle
              setTimeout(() => {
                this.votingService.initiateCgbCycle({
                  paperIds: selectedPapers.map(f => f.paperID),
                  remarks: this.approvalRemark,
                  deadlineDate: this.deadlineDate
                }).subscribe({
                next: (response) => {
                  if (response.status && response.data) {
                    // Call getCgbCycle to get the vote cycle ID
                    this.votingService.getCgbCycle().subscribe({
                      next: (cycleResponse) => {
                        if (cycleResponse.status && cycleResponse.data) {
                          const voteCycleId = cycleResponse.data.voteCycleId || cycleResponse.data.id;

                          if (voteCycleId) {
                            // Update the paper order with the current drag & drop order
                            const serialData = selectedPapers.map((paper, index) => ({
                              paperId: paper.paperID,
                              serialNumber: index + 1
                            }));

                            this.votingService.updateCgbCycleOrder({
                              votingCycleId: voteCycleId,
                              serialData: serialData
                            }).subscribe({
                              next: (orderResponse) => {
                                console.log('Paper order updated successfully', orderResponse);
                                // Reload paper list to reflect status changes
                                this.loadPaperConfigList();
                                this.groupedPaper['Approved by Pre-CGB'] = this.groupedPaper['Approved by Pre-CGB'].map(d => {
                                  d.checked = false;
                                  return d;
                                });
                                this.showCGBButton = false;
                                modal.close('Save click');
                                this.resetModalFields();
                                this.isInitiatingCgbCycle = false; // Reset loading state
                                this.toastService.show('CGB cycle initiated successfully', 'success');
                              },
                              error: (orderError) => {
                                console.log('Error updating paper order', orderError);
                                this.toastService.showError(orderError, 'Error updating paper order');
                                // Still close modal even if order update fails
                                this.loadPaperConfigList();
                                this.groupedPaper['Approved by Pre-CGB'] = this.groupedPaper['Approved by Pre-CGB'].map(d => {
                                  d.checked = false;
                                  return d;
                                });
                                this.showCGBButton = false;
                                modal.close('Save click');
                                this.resetModalFields();
                                this.isInitiatingCgbCycle = false; // Reset loading state
                              }
                            });
                          } else {
                            console.log('No vote cycle ID received from getCgbCycle');
                            this.loadPaperConfigList();
                            this.groupedPaper['Approved by Pre-CGB'] = this.groupedPaper['Approved by Pre-CGB'].map(d => {
                              d.checked = false;
                              return d;
                            });
                            this.showCGBButton = false;
                            modal.close('Save click');
                            this.resetModalFields();
                            this.isInitiatingCgbCycle = false; // Reset loading state
                          }
                        }
                      },
                      error: (cycleError) => {
                        console.log('Error getting CGB cycle', cycleError);
                        this.toastService.showError(cycleError, 'Error getting CGB cycle');
                        // Still close modal even if getCgbCycle fails
                        this.loadPaperConfigList();
                        this.groupedPaper['Approved by Pre-CGB'] = this.groupedPaper['Approved by Pre-CGB'].map(d => {
                          d.checked = false;
                          return d;
                        });
                        this.showCGBButton = false;
                        modal.close('Save click');
                        this.resetModalFields();
                        this.isInitiatingCgbCycle = false; // Reset loading state
                      }
                    });
                  } else {
                    this.toastService.showError(response, 'Failed to initiate CGB cycle');
                    this.isInitiatingCgbCycle = false; // Reset loading state
                  }
                },
                error: (initiateError) => {
                  console.log('Error initiating CGB cycle', initiateError);
                  this.toastService.showError(initiateError, 'Error initiating CGB cycle');
                  this.isInitiatingCgbCycle = false; // Reset loading state
                }
              });
            }, 1000); // Close setTimeout with 1 second delay
            } else {
              this.isInitiatingCgbCycle = false; // Reset loading state on status change failure
              this.toastService.showError(statusResponse, 'Failed to change paper status');
            }
          },
          error: (statusError) => {
            console.log('Error changing paper status', statusError);
            this.isInitiatingCgbCycle = false; // Reset loading state on error
            this.toastService.showError(statusError, 'Error changing paper status');
          }
        });
      }
    }
  }

  resetModalFields() {
    this.approvalRemark = "";
    this.deadlineDate = "";
  }

  getMinDateTime(): string {
    // Get tomorrow's date/time in YYYY-MM-DDTHH:mm format for datetime-local input
    // This ensures only future dates (not today) can be selected
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to start of tomorrow
    
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  addToCurrentCycle() {
    const selectedPapers = this.groupedPaper['Approved by Pre-CGB'].filter(item => item.checked);

    if (selectedPapers.length === 0) {
      this.toastService.show('Please select papers from Approved by Pre-CGB column', 'warning');
      return;
    }

    // First, get the current CGB cycle to get votingCycleId and deadlineDate
    this.votingService.getCgbCycle().subscribe({
      next: (cycleResponse) => {
        if (cycleResponse.status && cycleResponse.data) {
          const votingCycleId = cycleResponse.data.voteCycleId || cycleResponse.data.id;
          const deadlineDate = cycleResponse.data.deadlineDate;

          if (!votingCycleId) {
            this.toastService.show('No active CGB cycle found', 'danger');
            return;
          }

          // Get the next serial number from the last paper in the cycle
          let nextSerialNumber = 1;
          if (cycleResponse.data.papers && cycleResponse.data.papers.length > 0) {
            const lastPaper = cycleResponse.data.papers[cycleResponse.data.papers.length - 1];
            nextSerialNumber = (lastPaper.serialNumber || 0) + 1;
          }

          // Prepare the payload
          const payload = {
            votingCycleId: votingCycleId,
            paperData: selectedPapers.map((paper, index) => ({
              paperId: paper.paperID,
              deadlineDate: deadlineDate,
              serialNumber: nextSerialNumber + index
            }))
          };

          // Call addPaperToCgbCycle
          this.votingService.addPaperToCgbCycle(payload).subscribe({
            next: (response) => {
              if (response.status) {
                this.toastService.show('Papers added to current cycle successfully', 'success');

                // Uncheck the selected papers
                this.groupedPaper['Approved by Pre-CGB'] = this.groupedPaper['Approved by Pre-CGB'].map(d => {
                  d.checked = false;
                  return d;
                });
                this.showAddToCurrentCycleButton = false;

                // Reload the paper list to reflect changes
                this.loadPaperConfigList();
              } else {
                // Handle error response from backend
                if (response.errors || response.errorMessages) {
                  this.toastService.showError(response, 'Failed to add papers to current cycle');
                } else {
                  this.toastService.show(response.message || 'Failed to add papers to current cycle', 'danger');
                }
              }
            },
            error: (error) => {
              console.log('Error adding papers to current cycle', error);
              this.toastService.showError(error, 'Error adding papers to current cycle');
            }
          });
        } else {
          this.toastService.show('No active CGB cycle found', 'danger');
        }
      },
      error: (error) => {
        console.log('Error getting CGB cycle', error);
        this.toastService.show('Error getting CGB cycle information', 'danger');
      }
    });
  }
}
