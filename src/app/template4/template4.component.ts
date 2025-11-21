import {Component, inject, Renderer2, ViewChild, ElementRef, TemplateRef, AfterViewInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DummyCompComponent} from '../dummy-comp/dummy-comp.component';
import {CKEditorModule, loadCKEditorCloud, CKEditorCloudResult} from '@ckeditor/ckeditor5-angular';
import type {ClassicEditor, EditorConfig} from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import {UserService} from '../../service/user.service';
import {LoginUser, UserDetails, GetUsersListRequest} from '../../models/user';
import {PaperService} from '../../service/paper.service';
import {CountryDetail} from '../../models/general';
import {Generalervice} from '../../service/general.service';
import {UploadService} from '../../service/document.service';
import {Select2} from 'ng-select2-component';
import {ToastService} from '../../service/toast.service';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {environment} from '../core/app-config';
import {PaperConfigService} from '../../service/paper/paper-config.service';
import {EditorService} from '../../service/editor.service';
import {CommentService} from '../../service/comment.service';
import {AuthService} from '../../service/auth.service';
import {ThresholdService} from '../../service/threshold.service';
import {CostAllocationJVApproval, Paper, PaperStatusType, PartnerApprovalStatus} from '../../models/paper';
import {DictionaryDetail} from '../../models/dictionary';
import {ThresholdType} from '../../models/threshold';
import {DictionaryService} from '../../service/dictionary.service';
import {BehaviorSubject} from 'rxjs';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import { COMMITTEE_CONDITIONS } from '../../utils/threshold-conditions';
import {EditorComponent} from '../../components/editor/editor.component';
import {CommentableDirective} from '../../directives/commentable.directive';
import {EditorNormalComponent} from '../../components/editor-normal/editor-normal.component';
import {TimeAgoPipe} from '../../pipes/time-ago.pipe';
import {NgbTooltip} from '@ng-bootstrap/ng-bootstrap';
import {cleanObject, base64ToFile, getMimeTypeFromFileName} from '../../utils/index';
import {ToggleService} from '../shared/services/toggle.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {NumberInputComponent} from '../../components/number-input/number-input.component';
import { PermissionService } from '../shared/services/permission.service';
import { ActionBarComponent } from '../shared/components/action-bar/action-bar.component';
import {BatchService} from '../../service/batch.service';

@Component({
  selector: 'app-template4',
  standalone: true,
  imports: [CommonModule, NumberInputComponent, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, EditorComponent, CommentableDirective, EditorNormalComponent, TimeAgoPipe, NgbTooltip, RouterLink, ActionBarComponent],
  templateUrl: './template4.component.html',
  styleUrl: './template4.component.scss'
})
export class Template4Component  implements AfterViewInit{
  @ViewChild('sectionDropdown') sectionDropdown!: ElementRef<HTMLSelectElement>;
  generalInfoForm!: FormGroup;
  private readonly userService = inject(UserService);
  private readonly paperService = inject(PaperService);
  private paperConfigService = inject(PaperConfigService);
  private editorService = inject(EditorService);
  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private searchTimeout: any;
  private readonly thresholdService = inject(ThresholdService);

  isEndDateDisabled: boolean = true;
  minEndDate: string = '';
  submitted = false;
  isSubmitting = false;
  isLoadingDetails = false;
  isExporting = false;
  paperStatusId: number | null = null;
  currentPaperStatus: string | null = null;
  pendingStatus: string | null = null;
  paperId: string | null = null;
  isCopy = false;
  paperStatusList: PaperStatusType[] = [];
  paperDetails: Paper | null = null
  isRegisterPaper: boolean = false

  // Global variables for dropdown selections
  currenciesData: DictionaryDetail[] = [];
  globalCGBData: DictionaryDetail[] = [];
  operatingFunctionsData: DictionaryDetail[] = [];
  psaData: DictionaryDetail[] = [];
  remunerationTypeData: DictionaryDetail[] = [];
  sourcingRigorData: DictionaryDetail[] = [];
  sourcingTypeData: DictionaryDetail[] = [];
  subsectorData: DictionaryDetail[] = [];
  userDetails: UserDetails[] = [];
  camOptions: { value: string; label: string }[] = [];
  countryDetails: CountryDetail[] = [];
  procurementTagUsers: any[] = [];
  highlightClass = 'highlight'; // CSS class for highlighting
  selectedFiles: any[] = [];
  deletedFiles: number[] = []
  isDragging = false;
  private allApisDone$ = new BehaviorSubject<boolean>(false);
  private completedCount = 0;
  private totalCalls = 3;
  logs: any[] = [];
  comment: string = '';
  loggedInUser: LoginUser | null = null;
  selectedPaper: number = 0;
  approvalRemark: string = '';
  reviewBy: string = '';
  partnerApprovalStatuses: PartnerApprovalStatus[] = [];
  canShowPartnerApproveReject: boolean = false;
  thresholdData: ThresholdType[] = []
  isInitialLoad = true;
  private isProgrammaticFormUpdate = false;
  sectionVisibility: { [key: string]: boolean } = {
    section1: true,
    section2: false,
    section3: false,
    section4: false,
  };
  constructor(private router: Router,private toggleService: ToggleService, private route: ActivatedRoute, private dictionaryService: DictionaryService,
              private fb: FormBuilder, private countryService: Generalervice, private renderer: Renderer2, private uploadService: UploadService, public toastService: ToastService,
              public permission: PermissionService,
              private batchPaperService: BatchService
  ) {
    this.authService.userDetails$.subscribe((d) => {
      this.loggedInUser = d;
    });
    this.toggleService.commentExpanded$.subscribe((expanded) => {
      this.isExpanded = expanded;
    });
  }

  public Editor: typeof ClassicEditor | null = null;
  public config: EditorConfig | null = null;
  public psaJvOptions: { value: string; label: string }[] = [];
  batchPaperList: any[] = [];
  selectedBatchPaper: any = null;

  public ngOnInit(): void {
    loadCKEditorCloud({
      version: '44.3.0',
      premium: true
    }).then(this._setupEditor.bind(this));
    this.editorService.getEditorToken().subscribe();

    // Check for paperId immediately from route snapshot to set loading state early
    const paperIdFromSnapshot = this.route.snapshot.paramMap.get('id');
    if (paperIdFromSnapshot) {
      this.paperId = paperIdFromSnapshot;
      this.isLoadingDetails = true; // Set loading immediately if paperId exists
    }

    this.allApisDone$.subscribe((done) => {
      if (done) {
        this.route.paramMap.subscribe(params => {
          this.paperId = params.get('id');
          if (this.paperId) {
            if (!this.isLoadingDetails) {
              this.isLoadingDetails = true; // Set loading if not already set
            }
            this.fetchPaperDetails(Number(this.paperId))
            this.getPaperCommentLogs(Number(this.paperId));
            this.checkPartnerApprovalStatus(Number(this.paperId));
          } else {
            this.isExpanded = false;
            if (!this.paperId && this.loggedInUser && this.loggedInUser?.roleName === 'Procurement Tag') {
              setTimeout(() => {
                this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue([this.loggedInUser?.id || null]);
              }, 1000)
            }
            if(!this.paperId && this.loggedInUser && this.loggedInUser?.roleName === 'CAM') {
              setTimeout(() => {
                const camId = this.loggedInUser?.id ? this.loggedInUser.id.toString() : null;
                this.generalInfoForm.get('generalInfo.technicalApprover')?.setValue(camId);
              }, 1000)
            }
          }
          console.log('Paper ID:', this.paperId);
        });
      }
    });

    this.route.queryParamMap.subscribe(queryParams => {
      this.isCopy = queryParams.get('isCopy') === 'true';
      console.log('Is Copy:', this.isCopy);
    });
    this.loadUserDetails();
    this.loadDictionaryItems();
    this.loadPaperStatusListData();
    this.loadThresholdData();
    this.loadBatchPapersList();

    let camId = null

    if(!this.paperId && this.loggedInUser?.roleName === 'CAM') {
      camId = this.loggedInUser?.id ? this.loggedInUser.id.toString() : null
    }

    this.generalInfoForm = this.fb.group({
      generalInfo: this.fb.group({
        paperProvision: ['', Validators.required],
        transactionType: [null],
        purposeRequired: ['', Validators.required],
        batchPaper: [null],
        cgbItemRef: [{value: '', disabled: true}],
        referenceNo: ['', Validators.required],
        cgbCirculationDate: [{value: '', disabled: true}],
        technicalApprover: [camId, [Validators.required, Validators.pattern("^[0-9]+$")]],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        operatingFunction: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        purchaserName: ['', Validators.required],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, Validators.required],
        saleDisposeValue: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        psajv: [[], Validators.required],
        isGovtReprAligned: [null],
        govtReprAlignedComment: [''],
        retrospectiveApprovalReason: [{ value: '', disabled: true }],
        isRetrospectiveApproval: [null],
      }),
      costAllocation: this.fb.group({
        contractCommittee_SDCC: [{value: false, disabled: true}],
        contractCommittee_SCP_Co_CC: [{value: false, disabled: true}],
        contractCommittee_SCP_Co_CCInfoNote: [{value: false, disabled: true}],
        contractCommittee_BTC_CC: [{value: false, disabled: true}],
        contractCommittee_BTC_CCInfoNote: [{value: false, disabled: true}],
        contractCommittee_CGB: [false], //TODO discuss
        coVenturers_CMC: [{value: false, disabled: true}],
        coVenturers_SDMC: [{value: false, disabled: true}],
        coVenturers_SCP: [{value: false, disabled: true}],
        coVenturers_SCP_Board: [{value: false, disabled: true}],
        steeringCommittee_SC: [{value: false, disabled: true}],
        isACG: [{value: false, disabled: true}],
        isShah: [{value: false, disabled: true}],
        isSCP: [{value: false, disabled: true}],
        isBTC: [{value: false, disabled: true}],
        isAsiman: [{value: false, disabled: true}],
        isBPGroup: [{value: false, disabled: true}],
        // Percentage fields with validation (0-100)
        percentage_isACG: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
        percentage_isShah: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
        percentage_isSCP: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
        percentage_isBTC: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
        percentage_isAsiman: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],
        percentage_isBPGroup: [{value: '', disabled: true}, [Validators.min(0), Validators.max(100)]],

        value_isACG: [null],
        value_isShah: [null],
        value_isSCP: [null],
        value_isBTC: [null],
        value_isAsiman: [null],
        value_isBPGroup: [null],

        totalPercentage: [0],
        totalValue: [0]
      }),

      consultation: this.fb.array([]),
    });

    this.generalInfoForm.get('generalInfo.psajv')?.valueChanges
      .pipe(
        debounceTime(300), // wait for 300ms pause
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      )
      .subscribe(() => {
        if (!this.isInitialLoad || !this.paperId) {
          this.onSelectChangePSAJV();
        }
      });

    this.generalInfoForm.get('generalInfo.technicalApprover')?.valueChanges.subscribe((newCamUserId) => {
      this.updateTechnicalCorrectInAllRows(newCamUserId);
    });

    // Re-evaluate committee checkboxes when sourcing type changes
    this.generalInfoForm.get('generalInfo.sourcingType')?.valueChanges.subscribe(() => {
      this.reEvaluateAllCommitteeCheckboxes();
    });

    // Re-evaluate committee checkboxes when sale/dispose value changes
    this.generalInfoForm.get('generalInfo.saleDisposeValue')?.valueChanges.subscribe(() => {
      this.setupPSACalculationsManually();
    });

    this.setupPSAListeners()
    this.setupPSACalculations()
    this.onLTCCChange()
    this.setupJVAlignedAutoReset()
    // this.alignGovChange()

  }
  private setupJVAlignedAutoReset() {
    if (!this.generalInfoForm) { return; }

    // Flag to track if jvAligned is being changed (to skip reset)
    let isJVAlignedChanging = false;
    // Track subscribed controls to avoid duplicates
    const subscribedControls = new Set<any>();

    // Subscribe to each jvAligned control individually to detect when they change
    const setupJVAlignedListeners = () => {
      const rows = this.consultationRows;
      rows.controls.forEach((row) => {
        const ctrl = row.get('jvAligned');
        if (ctrl && !subscribedControls.has(ctrl)) {
          subscribedControls.add(ctrl);
          ctrl.valueChanges.subscribe(() => {
            isJVAlignedChanging = true;
            // Reset flag after a delay to ensure generalInfoForm.valueChanges has processed
            setTimeout(() => {
              isJVAlignedChanging = false;
            }, 50);
          });
        }
      });
    };

    // Initial setup of listeners
    setupJVAlignedListeners();

    // Also setup listeners when rows are added/removed (check length changes)
    let previousRowCount = this.consultationRows.length;
    this.consultationRows.valueChanges.subscribe(() => {
      const currentRowCount = this.consultationRows.length;
      if (currentRowCount !== previousRowCount) {
        previousRowCount = currentRowCount;
        setupJVAlignedListeners();
      }
    });

    this.generalInfoForm.valueChanges.subscribe(() => {
      // Skip reset during initial load to preserve values from edit mode
      if (this.isInitialLoad) {
        return;
      }

      // Skip reset if change came from jvAligned control itself
      if (isJVAlignedChanging) {
        return;
      }

      // Skip reset during programmatic form updates (like ensureCostAllocationFormControls)
      if (this.isProgrammaticFormUpdate) {
        return;
      }

      // Reset jvAligned for other form changes
      const rows = this.consultationRows;
      rows.controls.forEach((row) => {
        const ctrl = row.get('jvAligned');
        if (ctrl && ctrl.value === true) {
          ctrl.setValue(false, { emitEvent: false });
        }
      });
    });
  }

  // Helper method to mark all controls in a form group as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        this.markFormArrayTouched(control);
      } else {
        if (control && control.invalid) {
          control.markAsTouched();
        }
      }
    });
  }

  // Helper method to mark all controls in a form array as touched
  markFormArrayTouched(formArray: FormArray) {
    formArray.controls.forEach((control) => {
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        this.markFormArrayTouched(control);
      } else {
        if (control && control.invalid) {
          control.markAsTouched();
        }
      }
    });
  }


  ngAfterViewInit() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.6, // 60% of section must be visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const currentSectionId = entry.target.getAttribute('data-section');
          if (currentSectionId && this.sectionDropdown) {
            this.sectionDropdown.nativeElement.value = currentSectionId;
          }
        }
      });
    }, options);

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => observer.observe(section));
  }

  fetchPaperDetails(paperId: number) {
    // isLoadingDetails is already set to true when paperId is detected
    this.paperService.getPaperDetails(paperId, 'sale').subscribe({
      next: (value) => {
        // Handle both nested (approvalOfSale.paperDetails) and flat (paperDetails) structures
        const data = value.data as any;
      const approvalOfSaleData = data?.approvalOfSale || data;
      this.paperDetails = approvalOfSaleData;

      // Store consultations data in paperDetails for addConsultationRow to access
      const consultationsData = approvalOfSaleData?.consultationsDetails || [];
      if (this.paperDetails) {
        this.paperDetails.consultationsDetails = consultationsData;
      }
      // Use paperDetails if it exists (nested structure), otherwise fall back to approvalOfSaleData (flat structure)
      const paperDetailData = approvalOfSaleData?.paperDetails || approvalOfSaleData
      const jvApprovalsData = approvalOfSaleData?.jvApprovals?.[0] || null
      const costAllocationJVApprovalData = approvalOfSaleData?.costAllocationJVApproval || []

      const patchValues: any = { costAllocation: {} };

      const selectedPaperStatus = this.paperStatusList.find((item) => item.id.toString() === paperDetailData?.paperStatusId?.toString())

      if (selectedPaperStatus?.paperStatus !== "Draft") {
        this.isRegisterPaper = true
        this.commentService.loadPaper(paperId);
      }

      console.log("==isRegisterPaper", this.isRegisterPaper)

      // Assign JV Approvals data
      Object.assign(patchValues.costAllocation, {
        contractCommittee_SDCC: jvApprovalsData?.contractCommittee_SDCC || false,
        contractCommittee_SCP_Co_CC: jvApprovalsData?.contractCommittee_SCP_Co_CC || false,
        contractCommittee_SCP_Co_CCInfoNote: jvApprovalsData?.contractCommittee_SCP_Co_CCInfoNote || false,
        contractCommittee_BTC_CC: jvApprovalsData?.contractCommittee_BTC_CC || false,
        contractCommittee_BTC_CCInfoNote: jvApprovalsData?.contractCommittee_BTC_CCInfoNote || false,
        contractCommittee_CGB: false, // TODO: Confirm this value
        coVenturers_CMC: jvApprovalsData?.coVenturers_CMC || false,
        coVenturers_SDMC: jvApprovalsData?.coVenturers_SDMC || false,
        coVenturers_SCP: jvApprovalsData?.coVenturers_SCP || false,
        coVenturers_SCP_Board: jvApprovalsData?.coVenturers_SCP_Board || false,
        steeringCommittee_SC: jvApprovalsData?.steeringCommittee_SC || false,
      });

      // Assign PSA/JV values dynamically using getPSACheckboxControlName (like template3)
      costAllocationJVApprovalData.forEach((psa: any) => {
        if (psa.psaName) {
          const checkboxKey = this.getPSACheckboxControlName(psa.psaName);
          const percentageKey = this.getPSAPercentageControlName(psa.psaName);
          const valueKey = this.getPSAValueControlName(psa.psaName);

          if (checkboxKey) {
            console.log('Setting PSA values:', psa.psaName, 'checkboxKey:', checkboxKey, 'psaValue:', psa.psaValue);
            // Handle different types for psaValue (boolean, string, number)
            const psaValueBool = typeof psa.psaValue === 'boolean' ? psa.psaValue :
                                 typeof psa.psaValue === 'string' ? psa.psaValue === 'true' :
                                 typeof psa.psaValue === 'number' ? psa.psaValue === 1 :
                                 Boolean(psa.psaValue);
            patchValues.costAllocation[checkboxKey] = psaValueBool;
            patchValues.costAllocation[percentageKey] = psa.percentage;
            patchValues.costAllocation[valueKey] = psa.value;
          }
        }
      });

      // Start with PSAs from paperDetailData
      const selectedValues = paperDetailData?.psajv ? paperDetailData.psajv
        .split(',')
        .map((label: string) => label.trim())
        .map((label: string) => this.psaJvOptions.find(option => option.label === label)?.value) // Convert label to value
        .filter((value: any) => value) : []

      // Also include PSAs from costAllocationJVApproval that have values
      const psasFromCostAllocation = costAllocationJVApprovalData
        .filter((psa: any) => psa.psaValue === true)
        .map((psa: any) => {
          // Find the PSA value from psaJvOptions by matching the psaName
          const psaOption = this.psaJvOptions.find(option =>
            option.label === psa.psaName || option.value === psa.psaName
          );
          return psaOption?.value;
        })
        .filter((value: any) => value);

      // Merge and deduplicate
      const allSelectedValues = [...new Set([...selectedValues, ...psasFromCostAllocation])];

      // IMPORTANT: Create form controls BEFORE patching values, otherwise values will be lost
      allSelectedValues
        .filter((psaName): psaName is string => !!psaName)
        .forEach((psaName: string) => {
          this.addPSAJVFormControls(psaName);
        });


      const selectedValuesProcurementTagUsers = paperDetailData?.procurementSPAUsers ? paperDetailData.procurementSPAUsers
        .split(',')
        .map((id: string) => id.trim())
        .map((id: string) => this.procurementTagUsers.find(option => option.value === Number(id))?.value) // Convert label to value
        .filter((value: any) => value) : [];

      console.log("==patchValues.costAllocation", patchValues.costAllocation)
      console.log("==paperDetailData", paperDetailData)

      if (approvalOfSaleData) {
        this.generalInfoForm.patchValue({
          generalInfo: {
            paperProvision: paperDetailData?.paperProvision || '',
            batchPaper: paperDetailData?.batchPaperId || null,
            cgbItemRef: paperDetailData?.cgbItemRefNo || paperDetailData?.cgbItemRef || '',
            cgbCirculationDate: paperDetailData?.cgbCirculationDate || '',
            transactionType: paperDetailData?.transactionType || '',
            referenceNo: paperDetailData?.referenceNo || '',
            purposeRequired: paperDetailData?.purposeRequired || '',
            bltMember: paperDetailData?.bltMemberId || null,
            operatingFunction: paperDetailData?.operatingFunction || '',
            purchaserName: paperDetailData?.purchaserName || '',
            technicalApprover: paperDetailData?.technicalApprover ? paperDetailData.technicalApprover.toString() : null,
            vP1UserId: paperDetailData?.vP1UserId || null,
            procurementSPAUsers: selectedValuesProcurementTagUsers,
            pdManagerName: paperDetailData?.pdManagerNameId || null,
            saleDisposeValue: paperDetailData?.saleDisposeValue || 0,
            contractValueOriginalCurrency: paperDetailData?.contractValue || 0,
            psajv: allSelectedValues,
            isGovtReprAligned: paperDetailData?.isGovtReprAligned || false,
            govtReprAlignedComment: paperDetailData?.govtReprAlignedComment || '',
            isRetrospectiveApproval: paperDetailData?.isRetrospectiveApproval || false,
            retrospectiveApprovalReason: paperDetailData?.retrospectiveApprovalReason || '',
          },
          costAllocation: patchValues.costAllocation,
        },{ emitEvent: true })
        setTimeout(() => {
          this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers, { emitEvent: false });
          this.generalInfoForm.get('generalInfo.psajv')?.setValue(allSelectedValues, { emitEvent: false });

          // Ensure form controls are created for all selected PSAs (in case they weren't created earlier)
          allSelectedValues
            .filter((psaName): psaName is string => !!psaName)
            .forEach((psaName: string) => {
              this.addPSAJVFormControls(psaName);
            });

          // Re-patch costAllocation values to ensure they're set after controls exist
          this.generalInfoForm.patchValue({
            costAllocation: patchValues.costAllocation
          }, { emitEvent: false });

          // Enable percentage controls for all selected PSAs and ensure checkboxes are true
          allSelectedValues
            .filter((psaName): psaName is string => !!psaName)
            .forEach((psaName: string) => {
              const checkboxControlName = this.getPSACheckboxControlName(psaName);
              const percentageControlName = this.getPSAPercentageControlName(psaName);
              const checkboxControl = this.generalInfoForm.get(`costAllocation.${checkboxControlName}`);
              const percentageControl = this.generalInfoForm.get(`costAllocation.${percentageControlName}`);

              // Ensure checkbox is true if PSA is selected
              if (checkboxControl) {
                // Enable temporarily to set value, then disable again (readonly)
                checkboxControl.enable({ emitEvent: false });
                checkboxControl.setValue(true, { emitEvent: false });
                checkboxControl.disable({ emitEvent: false });
              }

              // Enable percentage control for all selected PSAs (including BP Group)
              // But skip if user is JV Admin
              const isJVAdmin = this.loggedInUser?.roleName === 'JV Admin';
              if (percentageControl && !isJVAdmin) {
                percentageControl.enable({ emitEvent: false });
              }
            });

          this.isInitialLoad = false;
          
          // Recalculate totals and values after form is patched with data
          this.setupPSACalculationsManually();
        }, 500)


        this.addConsultationRow(true, false, consultationsData);
        this.setupPSAListeners();
        
        // Setup percentage calculation listeners after form is patched in edit mode
        // Recalculate totals after listeners are set up (similar to template5)
        setTimeout(() => {
          this.setupPSACalculations();
          // Recalculate totals after listeners are set up
          this.calculateTotal();
        }, 600);
        
        // Disable all fields for JV Admin (except Consultation section)
        // Call multiple times with delays to catch controls that get enabled later
        this.applyJVAdminReadOnlyMode();
        setTimeout(() => {
          this.applyJVAdminReadOnlyMode();
        }, 600);
        setTimeout(() => {
          this.applyJVAdminReadOnlyMode();
        }, 1200);

        // Apply read-only mode for CGB Member (Non-Voting)
        this.applyCGBMemberNonVotingReadOnlyMode();
        setTimeout(() => {
          this.applyCGBMemberNonVotingReadOnlyMode();
        }, 600);
        setTimeout(() => {
          this.applyCGBMemberNonVotingReadOnlyMode();
        }, 1200);
        
        this.getUploadedDocs(paperId);
      }
      },
      error: (error) => {
        console.error('Error loading paper details:', error);
        this.toastService.show('Error loading paper details', 'danger');
      },
      complete: () => {
        this.isLoadingDetails = false;
      }
    });
  }


  get generalInfo() {
    return this.generalInfoForm.get('generalInfo');
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  requireAllIfAny(group: AbstractControl): ValidationErrors | null {
    const validateGroup = (fields: string[]) => {
      const values = fields.map(field => group.get(field)?.value);
      const hasValue = values.some(val => val);  // If at least one field has a value
      const allFilled = values.every(val => val); // If all fields are filled

      return hasValue && !allFilled ? {requireAllFields: true} : null;
    };

    // Apply validation for each group separately
    const errors = {
      costReduction: validateGroup(['costReductionPercent', 'costReductionValue', 'costReductionRemarks']),
      operatingEfficiency: validateGroup(['operatingEfficiencyPercent', 'operatingEfficiencyValue', 'operatingEfficiencyRemarks']),
      costAvoidance: validateGroup(['costAvoidancePercent', 'costAvoidanceValue', 'costAvoidanceRemarks'])
    };

    return Object.values(errors).some(error => error) ? errors : null;
  }

  alignGovChange() {
    this.generalInfoForm.get('generalInfo.isGovtReprAligned')?.valueChanges.subscribe((value) => {
      if (value === true) {
        this.generalInfoForm.get('generalInfo.govtReprAlignedComment')?.setValidators([Validators.required]);
      } else {
        this.generalInfoForm.get('generalInfo.govtReprAlignedComment')?.clearValidators();
      }
      this.generalInfoForm.get('generalInfo.govtReprAlignedComment')?.updateValueAndValidity(); // Refresh validation
    });
  }

  onSearch(target: EventTarget | null) {
    if (!target) return;

    const inputElement = target as HTMLInputElement;
    const searchText = inputElement.value.trim().toLowerCase();

    // Remove old highlights if input is empty
    if (!searchText) {
      document.querySelectorAll(`.${this.highlightClass}`).forEach(el => {
        this.renderer.removeClass(el, this.highlightClass);
      });
      return;
    }

    // Clear previous timeout to debounce
    clearTimeout(this.searchTimeout);

    // Delay search execution
    this.searchTimeout = setTimeout(() => {
      // Remove old highlights
      document.querySelectorAll(`.${this.highlightClass}`).forEach(el => {
        this.renderer.removeClass(el, this.highlightClass);
      });

      // Find label that matches the search text
      const labels = Array.from(document.querySelectorAll('label'));
      const matchingLabel = labels.find(label => label.textContent?.toLowerCase().includes(searchText));

      if (matchingLabel) {
        // Add highlight to the label
        this.renderer.addClass(matchingLabel, this.highlightClass);

        // Scroll into view
        matchingLabel.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    }, 500); // Adjust delay as needed
  }



  addConsultationRowOnChangePSAJV(jvValue: string) {
    // Check if the JV value already exists in the rows
    const alreadyExists = this.consultationRows.controls.some(group =>
      group.get('psa')?.value === jvValue
    );

    if (alreadyExists) {
      return; // Skip adding duplicate
    }

    const technicalApprover = this.generalInfoForm.get('generalInfo.technicalApprover')?.value || null;

    this.consultationRows.push(
      this.fb.group({
        psa: [{ value: jvValue, disabled: true }, Validators.required],
        technicalCorrect: [
          {value: technicalApprover ? Number(technicalApprover) : null, disabled: true},
          Validators.required
        ],
        budgetStatement: [null, Validators.required],
        jvReview: [null, Validators.required],
        jvAligned: [{ value: false, disabled: true }], // JV Aligned checkbox - disabled by default
        id: [0]
      })
    );
  }

  removeConsultationRowByPSAJV(jvValue: string) {
    const index = this.consultationRows.controls.findIndex(
      group => group.get('psa')?.value === jvValue
    );
    if (index > -1) {
      this.consultationRows.removeAt(index);
    }
  }

  updateTechnicalCorrectInAllRows(newCamUserId: number | null) {
    this.consultationRows.controls.forEach(group => {
      const technicalCorrectControl = group.get('technicalCorrect');
      if (technicalCorrectControl) {
        technicalCorrectControl.setValue(Number(newCamUserId) || null);
      }
    });
  }


  setupPSAListeners() {
    // Get selected PSAJV columns dynamically
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    // Only setup listeners if there are selected PSAJV columns
    if (selectedPSAJV.length === 0) {
      return;
    }

    selectedPSAJV.forEach((psaName: string) => {
      const checkboxControlName = this.getPSACheckboxControlName(psaName);
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      // Check if the control exists before setting up listener
      const checkboxControl = this.generalInfoForm.get(`costAllocation.${checkboxControlName}`);
      const valueControl = this.generalInfoForm.get(`costAllocation.${valueControlName}`);

      // Function to handle committee checkbox logic
      const handleCommitteeLogic = (isChecked: boolean) => {
        const percentageControl = this.generalInfoForm.get(`costAllocation.${percentageControlName}`);
        if (isChecked) {
          percentageControl?.enable();
        }
        this.applyCommitteeLogicForPSA(psaName, isChecked);
      };

      // Set up checkbox change listener
      if (checkboxControl) {
        checkboxControl.valueChanges.subscribe((isChecked) => {
          handleCommitteeLogic(isChecked);
        });
      }

      // Note: valueControl is readonly, so we don't need to subscribe to its changes
      // The committee logic will be triggered by percentage changes in setupPSACalculations
    });
  }

  // Common method to apply committee logic for a specific PSA
  applyCommitteeLogicForPSA(psaName: string, isChecked: boolean, reEvaluate: boolean = false): void {
    const valueControlName = this.getPSAValueControlName(psaName);
    const jvApprovalsData = this.paperDetails?.jvApprovals && (this.paperDetails.jvApprovals[0] || null);
    const valueControl = this.generalInfoForm.get(`costAllocation.${valueControlName}`);
    const byValue = valueControl?.value || 0;

    if (isChecked) {
      // Handle committee checkboxes based on PSA name
      if (this.hasFirstCommitteeCheckbox(psaName)) {
        const firstCommitteeControlName = this.getFirstCommitteeControlName(psaName);
        const firstCommitteeControl = this.generalInfoForm.get(`costAllocation.${firstCommitteeControlName}`);

        if (firstCommitteeControlName && firstCommitteeControl) {
          firstCommitteeControl.enable();

          // Use new threshold evaluation system
          const shouldCheck = this.evaluateThreshold(psaName, firstCommitteeControlName, byValue);
          const initialValue = jvApprovalsData?.[firstCommitteeControlName as keyof typeof jvApprovalsData] || false;

          // When re-evaluating (e.g., after sourcing type or contract value changes),
          // use only the threshold evaluation result, not the initial saved value
          const finalValue = reEvaluate ? shouldCheck : (shouldCheck || initialValue);
          firstCommitteeControl.setValue(finalValue, { emitEvent: false });
        }
      }

      if (this.hasSecondCommitteeCheckbox(psaName)) {
        const secondCommitteeControlName = this.getSecondCommitteeControlName(psaName);
        const secondCommitteeControl = this.generalInfoForm.get(`costAllocation.${secondCommitteeControlName}`);

        if (secondCommitteeControlName && secondCommitteeControl) {
          secondCommitteeControl.enable();

          // Use new threshold evaluation system
          const shouldCheck = this.evaluateThreshold(psaName, secondCommitteeControlName, byValue);
          const initialValue = jvApprovalsData?.[secondCommitteeControlName as keyof typeof jvApprovalsData] || false;

          // When re-evaluating (e.g., after sourcing type or contract value changes),
          // use only the threshold evaluation result, not the initial saved value
          const finalValue = reEvaluate ? shouldCheck : (shouldCheck || initialValue);
          secondCommitteeControl.setValue(finalValue, { emitEvent: false });
        }
      }
    } else {
      // Handle unchecking - disable and reset committee controls
      if (this.hasFirstCommitteeCheckbox(psaName)) {
        const firstCommitteeControlName = this.getFirstCommitteeControlName(psaName);
        const firstCommitteeControl = this.generalInfoForm.get(`costAllocation.${firstCommitteeControlName}`);

        if (firstCommitteeControlName && firstCommitteeControl) {
          firstCommitteeControl.disable();
          firstCommitteeControl.reset();
        }
      }

      if (this.hasSecondCommitteeCheckbox(psaName)) {
        const secondCommitteeControlName = this.getSecondCommitteeControlName(psaName);
        const secondCommitteeControl = this.generalInfoForm.get(`costAllocation.${secondCommitteeControlName}`);

        if (secondCommitteeControlName && secondCommitteeControl) {
          secondCommitteeControl.disable();
          secondCommitteeControl.reset();
        }
      }
    }
  }

  // Trigger committee logic for a specific PSA when percentage/value changes
  triggerCommitteeLogicForPSA(psaName: string, reEvaluate: boolean = false): void {
    const checkboxControlName = this.getPSACheckboxControlName(psaName);
    const checkboxControl = this.generalInfoForm.get(`costAllocation.${checkboxControlName}`);

    // Only apply committee logic if checkbox is checked
    const isChecked = checkboxControl?.value || false;
    if (!isChecked) {
      return;
    }

    this.applyCommitteeLogicForPSA(psaName, isChecked, reEvaluate);
  }

  // Re-evaluate committee checkboxes for all checked PSAs when Sourcing Type or Contract Value changes
  reEvaluateAllCommitteeCheckboxes(): void {
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    selectedPSAJV.forEach((psaName: string) => {
      const checkboxControlName = this.getPSACheckboxControlName(psaName);
      const checkboxControl = this.generalInfoForm.get(`costAllocation.${checkboxControlName}`);

      // Only re-evaluate if PSA checkbox is checked
      if (checkboxControl?.value === true) {
        // Pass reEvaluate=true to ensure we use only threshold evaluation, not initial saved values
        this.triggerCommitteeLogicForPSA(psaName, true);
      }
    });
  }

  setupPSACalculationsManually() {
    // Get selected PSAJV columns dynamically
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    selectedPSAJV.forEach((psaName: string) => {
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      const percentageValue = this.generalInfoForm.get(`costAllocation.${percentageControlName}`)?.value
      const contractValue = this.generalInfoForm.get('generalInfo.saleDisposeValue')?.value || 0;

      if (percentageValue >= 0 && percentageValue <= 100) {
        const calculatedValue = (percentageValue / 100) * contractValue;
        this.generalInfoForm.get(`costAllocation.${valueControlName}`)?.setValue(calculatedValue, { emitEvent: false });
        this.calculateTotal();
        // Re-evaluate committee checkboxes after PSA values are recalculated
        this.reEvaluateAllCommitteeCheckboxes();
      }
    });
  }

  setupPSACalculations() {
    // Get selected PSAJV columns dynamically
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    selectedPSAJV.forEach((psaName: string) => {
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      const percentageControl = this.generalInfoForm.get(`costAllocation.${percentageControlName}`);
      const valueControl = this.generalInfoForm.get(`costAllocation.${valueControlName}`);

      if (percentageControl && valueControl) {
        // Unsubscribe from previous subscription if it exists to prevent duplicates
        // Note: In a production app, you'd want to track subscriptions and unsubscribe on destroy
        percentageControl.valueChanges.subscribe((percentageValue) => {
          const contractValue = this.generalInfoForm.get('generalInfo.saleDisposeValue')?.value || 0;

          if (percentageValue >= 0 && percentageValue <= 100) {
            const calculatedValue = (percentageValue / 100) * contractValue;
            valueControl.setValue(calculatedValue, { emitEvent: false });
            this.calculateTotal();

            // Trigger committee logic after value is updated
            this.triggerCommitteeLogicForPSA(psaName);
          }
        });
      }
    });
    
    // Calculate total after setting up listeners
    this.calculateTotal();
  }

  calculateTotal() {
    const costAllocation = this.generalInfoForm.get('costAllocation') as FormGroup;
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    let totalPercentage = 0;
    let totalValue = 0;

    // Calculate totals based on selected PSAJV columns
    selectedPSAJV.forEach((psaName: string) => {
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      const percentageControl = costAllocation.get(percentageControlName);
      const valueControl = costAllocation.get(valueControlName);

      if (percentageControl) {
        const percentageValue = percentageControl.value;
        if (!isNaN(percentageValue) && percentageValue !== null && percentageValue !== '') {
          totalPercentage += Number(percentageValue);
        }
      }

      if (valueControl) {
        const valueValue = valueControl.value;
        if (!isNaN(valueValue) && valueValue !== null && valueValue !== '') {
          totalValue += Number(valueValue);
        }
      }
    });

    // Update total fields
    costAllocation.get('totalPercentage')?.setValue(totalPercentage, { emitEvent: false });
    costAllocation.get('totalValue')?.setValue(totalValue, { emitEvent: false });

    // Add validation: totalPercentage must be exactly 100
    if (totalPercentage !== 100) {
      costAllocation.get('totalPercentage')?.setErrors({ notExactly100: true });
    } else {
      costAllocation.get('totalPercentage')?.setErrors(null);
    }

  }

  /**
   * Evaluate thresholds and determine if committee checkbox should be checked
   * Template 4 (Disposal): Same logic as Template 1 with placeholders for future disposal-specific conditions
   */
  evaluateThreshold(psaName: string, checkboxType: string, byValue: number): boolean {
    const sourcingTypeId = Number(this.generalInfoForm.get('generalInfo.sourcingType')?.value) || 0;
    const psaAgreementId = this.getPSAAgreementId(psaName);
    const paperType = 'Approval of Sale / Disposal Form'; // For Template 4

    // Filter relevant thresholds based on global conditions (PSA Agreement and Threshold Type only)
    const relevantThresholds = this.thresholdData.filter(t => {
      if (!t.isActive) return false;
      if (t.thresholdType !== 'Partner') return false;
      if (t.psaAgreement != psaAgreementId) return false;

      return true;
    });

    console.log('relevantThresholds', relevantThresholds, this.thresholdData);

    if (relevantThresholds.length === 0) {
      console.log(`No relevant thresholds found for PSA: ${psaName}, checkbox: ${checkboxType}`);
      return false;
    }

    // Apply sourcingType matching (ignore if threshold has no sourcingType, is 0, or is empty array)
    const sourcingTypeFilteredThresholds = relevantThresholds.filter(t => {
      // Handle sourcingType as comma-separated string or array
      let sourcingTypes: number[] = [];

      if (typeof t.sourcingType === 'string') {
        // Split comma-separated string and convert to numbers
        sourcingTypes = t.sourcingType.split(',').map(st => Number(st.trim())).filter(n => !isNaN(n));
      } else if (Array.isArray(t.sourcingType)) {
        sourcingTypes = t.sourcingType;
      } else if (t.sourcingType) {
        sourcingTypes = [t.sourcingType];
      }

      // If empty, 0, or null, treat as "Any"
      if (!sourcingTypes || sourcingTypes.length === 0 || sourcingTypes[0] === 0 || sourcingTypes[0] === null) {
        return true;
      }

      return sourcingTypes.includes(sourcingTypeId);
    });

    // Check specific Paper Type + Sourcing Type + Committee combinations and get the selected threshold
    const selectedThreshold = this.checkCommitteeConditions(paperType, sourcingTypeId, checkboxType, relevantThresholds);

    if (!selectedThreshold) {
      console.log(`Committee conditions not met for ${psaName} - ${checkboxType}`);
      return false;
    }



    // Template 4 (Disposal): Use ByValue > threshold (same as Template 1)
    const exceedsThreshold = byValue > selectedThreshold.contractValueLimit;

    console.log(`Threshold evaluation for ${psaName} - ${checkboxType}:`, {
      byValue,
      thresholdLimit: selectedThreshold.contractValueLimit,
      exceedsThreshold,
      thresholdId: selectedThreshold.id
    });

    return exceedsThreshold;
  }

  // Method to check specific conditions from the threshold table and return the selected threshold
  private checkCommitteeConditions(paperType: string, sourcingTypeId: number, committeeControlName: string, matchingThresholds: any[]): any | null {
    // Filter thresholds by committee from extension field
    // The committee is now stored in the threshold's extension field
    const committeeFilteredThresholds = matchingThresholds.filter(t => {
      // Check if the threshold's committee (stored in extension) matches the requested committee
      return t.extension === committeeControlName;
    });

    if (committeeFilteredThresholds.length === 0) {
      console.log(`No thresholds found for committee: ${committeeControlName}`);
      return null; // No matching thresholds for this committee
    }

    // Now apply paperType filtering
    const paperTypeFilteredThresholds = committeeFilteredThresholds.filter(t => {
      // Handle paperType as comma-separated string or array
      const thresholdPaperTypes = typeof t.paperType === 'string'
        ? t.paperType.split(',').map((pt: string) => pt.trim())
        : (Array.isArray(t.paperType) ? t.paperType : [t.paperType]);

      // Check if the paper type matches
      return thresholdPaperTypes.includes(paperType);
    });

    if (paperTypeFilteredThresholds.length === 0) {
      console.log(`No thresholds found for paper type: ${paperType}`);
      return null;
    }

    // Now apply sourcingType filtering to the paper type filtered thresholds
    const sourcingTypeFilteredThresholds = paperTypeFilteredThresholds.filter(t => {
      // Handle sourcingType as comma-separated string or array
      let thresholdSourcingTypes: number[] = [];

      if (typeof t.sourcingType === 'string') {
        // Split comma-separated string and convert to numbers
        thresholdSourcingTypes = t.sourcingType.split(',').map((st: string) => Number(st.trim())).filter((n: number) => !isNaN(n));
      } else if (Array.isArray(t.sourcingType)) {
        thresholdSourcingTypes = t.sourcingType;
      } else if (t.sourcingType) {
        thresholdSourcingTypes = [t.sourcingType];
      }

      // If threshold has no sourcingType, 0, or empty array, it matches any sourcing type
      if (!thresholdSourcingTypes || thresholdSourcingTypes.length === 0 || thresholdSourcingTypes[0] === 0 || thresholdSourcingTypes[0] === null) {
        return true;
      }

      // Check if the sourcing type matches
      return thresholdSourcingTypes.includes(sourcingTypeId);
    });

    if (sourcingTypeFilteredThresholds.length === 0) {
      console.log(`No thresholds found for sourcing type: ${sourcingTypeId}`);
      return null;
    }

    // Return the first matching threshold
    // Since we've already filtered by committee, paper type, and sourcing type,
    // we can return the first match
    return sourcingTypeFilteredThresholds[0];
  }

  /**
   * Get PSA Agreement ID from PSA name
   */
  getPSAAgreementId(psaName: string): number {
    const psaItem = this.psaData.find(p => p.itemValue.toLowerCase() === psaName.toLowerCase());
    return psaItem?.id || 0;
  }

  // Helper methods for dynamic PSAJV columns
  getSelectedPSAJVColumns(): string[] {
    if (!this.generalInfoForm || !this.generalInfoForm.get('generalInfo.psajv')) {
      return [];
    }
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    return selectedPSAJV;
  }

  getPSACheckboxControlName(psa: string): string {
    if (!psa) return '';
    // Convert PSA name to control name format (remove spaces, special chars, and add 'is' prefix)
    const cleanName = psa.replace(/[^a-zA-Z0-9]/g, '');
    return `is${cleanName}`;
  }

  getPSAPercentageControlName(psa: string): string {
    if (!psa) return '';
    // Convert PSA name to percentage control name format
    const cleanName = psa.replace(/[^a-zA-Z0-9]/g, '');
    return `percentage_is${cleanName}`;
  }

  getPSAValueControlName(psa: string): string {
    if (!psa) return '';
    // Convert PSA name to value control name format
    const cleanName = psa.replace(/[^a-zA-Z0-9]/g, '');
    return `value_is${cleanName}`;
  }

  getPSAControlSuffix(psa: string): string {
    // Convert PSA name to control suffix format
    const cleanName = psa.replace(/[^a-zA-Z0-9]/g, '');
    return `is${cleanName}`;
  }

  hasFirstCommitteeCheckbox(psa: string): boolean {
    // Check if PSA has first committee checkbox based on PSA data
    const psaLower = psa.toLowerCase();
    return ['acg', 'shah deniz', 'scp', 'btc'].includes(psaLower);
  }

  hasSecondCommitteeCheckbox(psa: string): boolean {
    // Check if PSA has second committee checkbox based on PSA data
    const psaLower = psa.toLowerCase();
    return ['acg', 'shah deniz', 'scp'].includes(psaLower);
  }

  getFirstCommitteeControlName(psa: string): string {
    const mapping: { [key: string]: string } = {
      "acg": "coVenturers_CMC",
      "shah deniz": "contractCommittee_SDCC",
      "scp": "contractCommittee_SCP_Co_CC",
      "btc": "contractCommittee_BTC_CC"
    };
    return mapping[psa.toLowerCase()] || '';
  }

  getFirstCommitteeLabel(psa: string): string {
    const mapping: { [key: string]: string } = {
      "acg": "CMC",
      "shah deniz": "SDCC",
      "scp": "SCP Co CC",
      "btc": "BTC CC"
    };
    return mapping[psa.toLowerCase()] || '';
  }

  getSecondCommitteeControlName(psa: string): string {
    const mapping: { [key: string]: string } = {
      "acg": "steeringCommittee_SC",
      "shah deniz": "coVenturers_SDMC",
      "scp": "coVenturers_SCP"
    };
    return mapping[psa.toLowerCase()] || '';
  }

  getSecondCommitteeLabel(psa: string): string {
    const mapping: { [key: string]: string } = {
      "acg": "SC",
      "shah deniz": "SDMC",
      "scp": "SCP Board"
    };
    return mapping[psa.toLowerCase()] || '';
  }

  onSelectChangePSAJV() {
    const selectedOptions = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    const costAllocationControl = this.generalInfoForm.get('costAllocation');

    if (costAllocationControl) {
      // Get all possible PSAJV options
      const allPSAJVOptions = this.psaJvOptions.map(option => option.value);

      // Handle each PSAJV option
      allPSAJVOptions.forEach((psaName) => {
        const isSelected = selectedOptions.includes(psaName);

        if (isSelected) {
          // Add form controls if they don't exist
          this.addPSAJVFormControls(psaName);
          // Set checkbox to checked and readonly
          const checkboxControlName = this.getPSACheckboxControlName(psaName);
          const checkboxControl = costAllocationControl.get(checkboxControlName);
          if (checkboxControl) {
            // Enable temporarily to set value, then disable again (readonly)
            checkboxControl.enable({ emitEvent: false });
            checkboxControl.setValue(true, { emitEvent: false });
            checkboxControl.disable({ emitEvent: false });
          }
          // Ensure As% (percentage) input is enabled like template1
          const percentageControlName = this.getPSAPercentageControlName(psaName);
          const percentageControl = costAllocationControl.get(percentageControlName);
          if (percentageControl) {
            percentageControl.enable({ emitEvent: false });
          }
          // Add consultation row
          this.addConsultationRowOnChangePSAJV(psaName);
        } else {
          // Remove consultation row
          this.removeConsultationRowByPSAJV(psaName);
        }
      });

      // After creating all form controls, setup listeners for selected PSAJV
      this.setupPSACalculations();
    }
  }

  // Method to create dynamic form controls for PSAJV columns
  createPSAJVFormControls(psaName: string): any {
    const checkboxControlName = this.getPSACheckboxControlName(psaName);
    const percentageControlName = this.getPSAPercentageControlName(psaName);
    const valueControlName = this.getPSAValueControlName(psaName);

    return {
      [checkboxControlName]: [{ value: true, disabled: true }], // Readonly and checked
      [percentageControlName]: [{ value: '', disabled: false }, [Validators.min(0), Validators.max(100)]], // Editable
      [valueControlName]: [null]
    };
  }

  // Method to add form controls for a PSAJV column
  addPSAJVFormControls(psaName: string): void {
    const costAllocationControl = this.generalInfoForm.get('costAllocation') as FormGroup;
    if (costAllocationControl) {
      const newControls = this.createPSAJVFormControls(psaName);
      Object.keys(newControls).forEach(controlName => {
        if (!costAllocationControl.get(controlName)) {
          costAllocationControl.addControl(controlName, this.fb.control(newControls[controlName][0], newControls[controlName][1]));
        }
      });
    }
  }

  onLTCCChange() {
    this.generalInfoForm.get('generalInfo.isRetrospectiveApproval')?.valueChanges.subscribe((value) => {
      const ltccNotesControl = this.generalInfoForm.get('generalInfo.retrospectiveApprovalReason');

      if (value === true) {
        ltccNotesControl?.setValidators([Validators.required]);
        ltccNotesControl?.enable();
      } else {
        ltccNotesControl?.clearValidators();
        ltccNotesControl?.disable(); // <- disables the field
      }

      ltccNotesControl?.updateValueAndValidity();
    });
  }

  loadUserDetails() {
    const request: GetUsersListRequest = {
      filter: {},
      paging: {
        start: 0,
        length: 1000
      }
    };

    this.userService.getUserDetailsList(request).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const dataList = response.data && response.data.length > 0 ? response.data.filter(item => item.isActive) : [];
          this.userDetails = dataList;
          this.procurementTagUsers = dataList.filter(user => user.roleName === 'Procurement Tag').map(t => ({
            label: t.displayName,
            value: t.id
          }));
          this.camOptions = this.userDetails
            .filter(user => user.roleName === 'CAM')
            .map(user => ({ value: user.id.toString(), label: user.displayName }))
            .sort((a, b) => a.label.localeCompare(b.label));

          // If form exists and technicalApprover is set, ensure it's properly formatted
          if (this.generalInfoForm && this.generalInfoForm.get('generalInfo.technicalApprover')) {
            const currentTechnicalApprover = this.generalInfoForm.get('generalInfo.technicalApprover')?.value;
            if (currentTechnicalApprover) {
              // Ensure the value is a string to match camOptions format
              this.generalInfoForm.get('generalInfo.technicalApprover')?.setValue(currentTechnicalApprover.toString(), { emitEvent: false });
            }
          }

          console.log('user details', this.userDetails);
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  loadDictionaryItems() {

    this.dictionaryService.getDictionaryItemList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const itemData = response.data;
          this.incrementAndCheck(itemData.length);
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
          this.incrementAndCheck();
          switch (itemName) {

            case 'Global CGB':
              this.globalCGBData = (response.data || []).filter(item => item.isActive);
              break;

            case 'Operating Functions':
              this.operatingFunctionsData = (response.data || []).filter(item => item.isActive);
              break;

            case 'PSA':
              this.psaData = (response.data || []).filter(item => item.isActive);
              // Populate psaJvOptions dynamically from PSA data
              this.psaJvOptions = this.psaData.map(item => ({
                value: item.itemValue,
                label: item.itemValue
              }));
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


  private incrementAndCheck(increaseCount: number | null = null) {
    this.completedCount++;
    if (increaseCount) {
      this.totalCalls = this.totalCalls + increaseCount;
    }
    if (this.completedCount === this.totalCalls) {
      this.allApisDone$.next(true);
    }
  }

  loadPaperStatusListData() {
    this.paperService.getPaperStatusList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {

          this.paperStatusList = reponse.data || [];
          this.incrementAndCheck();
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  loadThresholdData() {
    this.thresholdService.getThresholdList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.thresholdData = response.data;
          this.incrementAndCheck();
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  loadBatchPapersList() {
    this.batchPaperService.getBatchPapersList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.batchPaperList = response.data;
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  onBatchPaperSelectionChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedBatchId = target.value;

    if (selectedBatchId && selectedBatchId !== 'null') {
      const selectedBatch = this.batchPaperList.find(batch => batch.id == selectedBatchId);
      this.onBatchPaperChange(selectedBatch);
    } else {
      this.onBatchPaperChange(null);
    }
  }

  onBatchPaperChange(selectedBatch: any) {
    if (selectedBatch && this.paperId) {
      // Add paper to batch
      this.addPaperToBatch(selectedBatch.id, Number(this.paperId));
    } else if (this.selectedBatchPaper && this.paperId) {
      // Remove paper from batch
      this.removePaperFromBatch(this.selectedBatchPaper.id, Number(this.paperId));
    }
    this.selectedBatchPaper = selectedBatch;
  }

  addPaperToBatch(batchId: number, paperId: number) {
    const payload = {
      batchId: batchId,
      paperId: [paperId],
      action: "Add"
    };

    this.batchPaperService.upsertBatchPaper(payload).subscribe({
      next: (response) => {
        if (response.status) {
          this.toastService.show('Paper added to batch successfully', 'success');
        }
      },
      error: (error) => {
        console.log('Error adding paper to batch:', error);
        this.toastService.show('Failed to add paper to batch', 'danger');
      }
    });
  }

  removePaperFromBatch(batchId: number, paperId: number) {
    const payload = {
      batchId: batchId,
      paperId: [paperId],
      action: "Remove"
    };

    this.batchPaperService.upsertBatchPaper(payload).subscribe({
      next: (response) => {
        if (response.status) {
          this.toastService.show('Paper removed from batch successfully', 'success');
        }
      },
      error: (error) => {
        console.log('Error removing paper from batch:', error);
        this.toastService.show('Failed to remove paper from batch', 'danger');
      }
    });
  }

  scrollToSection(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const section = document.getElementById(selectedValue);

    if (section) {
      section.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }

  private _setupEditor(cloud: CKEditorCloudResult<{ version: '44.3.0', premium: true }>) {
    const {
      ClassicEditor,
      Essentials,
      Paragraph,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      BlockQuote,
      Link
    } = cloud.CKEditor;


    this.Editor = ClassicEditor;
    this.config = {
      licenseKey: environment.ckEditorLicenceKey,
      plugins: [
        Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
        BlockQuote, Link
      ],
      toolbar: [
        'undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
        'numberedList', 'bulletedList', 'blockquote', 'link', '|'
      ],
      fontSize: {
        options: [10, 12, 14, 16, 18, 20, 24, 28, 32, 36],
        supportAllValues: true
      },
      ui: {
        viewportOffset: {top: 50, bottom: 50}  // Adjust editor's viewport
      }
    };
  }

  private readonly _mdlSvc = inject(NgbModal);


  isExpanded: boolean = true; // Default expanded

  toggleComments() {
    if (!this.isExpanded) {
      this.toggleService.expandComments();
    } else {
      this.toggleService.collapseAll();
    }
  }


  // Getter for FormArray
  get consultationRows(): FormArray {
    return this.generalInfoForm.get('consultation') as FormArray;
  }

  // Generate ID dynamically (001, 002, etc.)
  generateId(index: number): string {
    return (index + 1).toString().padStart(3, '0');
  }

  addConsultationRow(isFirst = false, isChangedCamUser = false, consultationsData?: any[]) {
    if (isFirst) {
      // Use provided consultationsData, or fall back to paperDetails.consultationsDetails
      const riskMitigationsData = consultationsData || (this.paperDetails?.consultationsDetails as any[]) || []
      const riskMitigationArray = this.consultationRows;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index) => {
        // Get the initial jvAligned value from API
        const initialJVAlignedValue = item.isJVReviewDone || item.jvAligned || false;
        const jvReviewValue = item.jvReview || item.jvReviewId || null;

        const formGroup = this.fb.group({
          psa: [{ value: item.psa || item.psaValue || '', disabled: true }, Validators.required],
          technicalCorrect: [{ value: item.technicalCorrect || item.technicalCorrectId || null, disabled: true }, Validators.required],
          budgetStatement: [item.budgetStatement || item.budgetStatementId || null, Validators.required],
          jvReview: [jvReviewValue, Validators.required],
          jvAligned: [{ value: initialJVAlignedValue, disabled: true }],
          id: [item.id || 0]
        });
        riskMitigationArray.push(formGroup);

        // Set JV Aligned checkbox state based on JV Review user
        // Use setTimeout to ensure form is fully initialized
        setTimeout(() => {
          this.onJVReviewChange(index, jvReviewValue);
        }, 0);
      });
    } else {
      const camUserId = this.generalInfoForm.get('generalInfo.technicalApprover')?.value || null;
      if (isChangedCamUser) {
        this.consultationRows.clear();
      }
      this.consultationRows.push(
        this.fb.group({
          psa: [{ value: '', disabled: true }, Validators.required],
          technicalCorrect: [{ value: camUserId ? Number(camUserId) : null, disabled: true }, Validators.required],
          budgetStatement: [null, Validators.required],
          jvReview: [null, Validators.required],
          jvAligned: [{ value: false, disabled: true }],
          id: [0]
        })
      );
    }
  }

  canEditJVAligned(jvReviewUserId: number | null): boolean {
    if (!this.loggedInUser || !jvReviewUserId) {
      return false;
    }
    
    const paperStatus = this.paperDetails?.paperDetails?.paperStatusName;
    const statusLower = (paperStatus || '').toLowerCase().trim();
    
    // Check if user matches jvReviewUserId
    if (this.loggedInUser.id !== jvReviewUserId) {
      return false;
    }
    
    // JV Admin can edit JV Aligned at any stage between Registered and Approved by Pre-CGB
    if (this.loggedInUser.roleName === 'JV Admin') {
      const allowedStatuses = [
        'registered',
        'waiting for pdm',
        'on pre-cgb',
        'approved by pre-cgb'
      ];
      return allowedStatuses.includes(statusLower);
    }
    
    // For other users, JV Aligned is only editable when status is "On JV Approval"
    if (paperStatus === 'On JV Approval') {
      return true;
    }
    
    return false;
  }

  // Method to check if update button should be shown for JV Approval
  canShowUpdateForJVApproval(): boolean {
    const paperStatus = this.paperDetails?.paperDetails?.paperStatusName;
    if (paperStatus !== 'On JV Approval' || !this.loggedInUser) {
      return false;
    }
    // Check if logged-in user matches any jvReview user in consultation rows
    return this.consultationRows.controls.some(row => {
      const jvReviewUserId = row.get('jvReview')?.value;
      return jvReviewUserId && this.loggedInUser?.id === jvReviewUserId;
    });
  }

  /**
   * Check if BP Group PSA split percentage is 100%
   */
  isBPGroup100Percent(): boolean {
    const costAllocation = this.generalInfoForm.get('costAllocation') as FormGroup;
    if (!costAllocation) return false;
    
    const bpGroupPercentageControl = costAllocation.get('percentage_isBPGroup');
    if (!bpGroupPercentageControl) return false;
    
    const percentage = Number(bpGroupPercentageControl.value);
    return !isNaN(percentage) && percentage === 100;
  }

  /**
   * Check if JV Admin has assigned consultation with JV Aligned
   */
  hasJVAlignedConsultation(): boolean {
    if (!this.loggedInUser || this.loggedInUser.roleName !== 'JV Admin') {
      return false;
    }
    
    // Check if logged-in JV Admin user has any consultation row with JV Aligned
    return this.consultationRows.controls.some(row => {
      const jvReviewUserId = row.get('jvReview')?.value;
      const jvAligned = row.get('jvAligned')?.value;
      return jvReviewUserId && this.loggedInUser?.id === jvReviewUserId && jvAligned === true;
    });
  }

  /**
   * Get paper CAM user ID
   */
  getPaperCamUserId(): number | null {
    const camUserId = this.generalInfoForm.get('generalInfo.camUserId')?.value;
    return camUserId ? Number(camUserId) : null;
  }

  /**
   * Get paper Procurement SPA Users as comma-separated string
   */
  getPaperProcurementSPAUsers(): string | null {
    const procurementSPAUsers = this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.value;
    if (!procurementSPAUsers || !Array.isArray(procurementSPAUsers)) {
      return null;
    }
    return procurementSPAUsers.map(id => id.toString()).join(',');
  }

  /**
   * Apply read-only mode for JV Admin users
   * Disables all form fields except Consultation section
   */
  applyJVAdminReadOnlyMode(): void {
    if (!this.loggedInUser || this.loggedInUser.roleName !== 'JV Admin') {
      return; // Only apply for JV Admin
    }

    // Disable section dropdown
    if (this.sectionDropdown && this.sectionDropdown.nativeElement) {
      this.sectionDropdown.nativeElement.disabled = true;
    }

    // Disable all form groups except consultation
    const formGroupsToDisable = [
      'generalInfo',
      'costAllocation'
    ];

    formGroupsToDisable.forEach(groupName => {
      const group = this.generalInfoForm.get(groupName) as FormGroup;
      if (group) {
        Object.keys(group.controls).forEach(key => {
          const control = group.get(key);
          if (control && !control.disabled) {
            control.disable({ emitEvent: false });
          }
        });
      }
    });

    // Ensure all dynamically created Cost Allocation controls are disabled
    // This includes PSA checkboxes, percentage inputs, value inputs, and committee checkboxes
    // Use multiple timeouts to catch controls that might be enabled later
    const disableCostAllocationControls = () => {
      const costAllocationGroup = this.generalInfoForm.get('costAllocation') as FormGroup;
      if (costAllocationGroup) {
        // Disable all existing controls in costAllocation
        Object.keys(costAllocationGroup.controls).forEach(key => {
          const control = costAllocationGroup.get(key);
          if (control && !control.disabled) {
            control.disable({ emitEvent: false });
          }
        });

        // Also disable any dynamically created PSA controls
        const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
        selectedPSAJV.forEach((psaName: string) => {
          const checkboxControlName = this.getPSACheckboxControlName(psaName);
          const percentageControlName = this.getPSAPercentageControlName(psaName);
          const valueControlName = this.getPSAValueControlName(psaName);
          const firstCommitteeControlName = this.getFirstCommitteeControlName(psaName);

          [checkboxControlName, percentageControlName, valueControlName, firstCommitteeControlName].forEach(controlName => {
            const control = costAllocationGroup.get(controlName);
            if (control && !control.disabled) {
              control.disable({ emitEvent: false });
            }
          });
        });
      }
    };

    // Call immediately and with delays to catch controls enabled later
    disableCostAllocationControls();
    setTimeout(disableCostAllocationControls, 100);
    setTimeout(disableCostAllocationControls, 500);
    setTimeout(disableCostAllocationControls, 1000);
    setTimeout(disableCostAllocationControls, 1500);

    // Note: Consultation section is NOT disabled - it has its own enable/disable logic
    // based on canEditJVAligned() method
  }

  /**
   * Apply read-only mode for CGB Member (Non-Voting) users
   * Disables all fields except Government Representative Comment (if BP Group != 100%)
   */
  applyCGBMemberNonVotingReadOnlyMode(): void {
    if (!this.loggedInUser || this.loggedInUser.roleName !== 'CGB Member (Non-Voting)') {
      return; // Only apply for CGB Member (Non-Voting)
    }

    const statusName = this.paperDetails?.paperDetails?.paperStatusName || '';
    const isBPGroup100 = this.isBPGroup100Percent();
    
    // Check if status is after PDM Approval
    const pdmApprovedStatuses = [
      'approved by pdm',
      'on pre-cgb',
      'approved by pre-cgb',
      'on cgb',
      'approved by cgb',
      'on jv approval',
      'on partner approval 1st',
      'on partner approval 2nd',
      'approved'
    ];
    
    const statusLower = statusName.toLowerCase().trim();
    const isAfterPDMApproved = pdmApprovedStatuses.some(s => statusLower === s);
    
    if (!isAfterPDMApproved) {
      return; // Only apply after PDM Approval
    }

    // Disable section dropdown
    if (this.sectionDropdown && this.sectionDropdown.nativeElement) {
      this.sectionDropdown.nativeElement.disabled = true;
    }

    // Disable all form groups
    const formGroupsToDisable = [
      'generalInfo',
      'costAllocation'
    ];

    formGroupsToDisable.forEach(groupName => {
      const group = this.generalInfoForm.get(groupName) as FormGroup;
      if (group) {
        Object.keys(group.controls).forEach(key => {
          // Skip government comment field if BP Group != 100%
          if (key === 'govtReprAlignedComment' && !isBPGroup100) {
            return; // Keep this field enabled
          }
          
          const control = group.get(key);
          if (control && !control.disabled) {
            control.disable({ emitEvent: false });
          }
        });
      }
    });

    // Disable "Aligned with Government Representative" field (only Procurement Tag can edit)
    // Since we're in CGB Member (Non-Voting) method, always disable this field
    const isGovtReprAlignedControl = this.generalInfoForm.get('generalInfo.isGovtReprAligned');
    if (isGovtReprAlignedControl && !isGovtReprAlignedControl.disabled) {
      isGovtReprAlignedControl.disable({ emitEvent: false });
    }

    // If BP Group = 100%, also disable government comment field
    if (isBPGroup100) {
      const govtCommentControl = this.generalInfoForm.get('generalInfo.govtReprAlignedComment');
      if (govtCommentControl && !govtCommentControl.disabled) {
        govtCommentControl.disable({ emitEvent: false });
      }
    } else {
      // If BP Group != 100%, ensure government comment field is enabled
      const govtCommentControl = this.generalInfoForm.get('generalInfo.govtReprAlignedComment');
      if (govtCommentControl && govtCommentControl.disabled) {
        govtCommentControl.enable({ emitEvent: false });
      }
    }
  }

  onJVReviewChange(rowIndex: number, jvReviewUserId: number | null) {
    const row = this.consultationRows.at(rowIndex);
    const jvAlignedControl = row.get('jvAligned');
    if (jvAlignedControl) {
      // Store the current value before making any changes
      const currentValue = jvAlignedControl.value;

      if (this.canEditJVAligned(jvReviewUserId)) {
        jvAlignedControl.enable();
        // Preserve the value when enabling
        if (currentValue !== jvAlignedControl.value) {
          jvAlignedControl.setValue(currentValue, { emitEvent: false });
        }
      } else {
        jvAlignedControl.disable();
        // Preserve existing value if it's already true (from isJVReviewDone), only set to false if currently false
        // Use emitEvent: false to prevent triggering auto-reset
        if (currentValue !== true) {
          jvAlignedControl.setValue(false, { emitEvent: false }); // Only uncheck if not already checked
        } else {
          // Ensure the value stays true even when disabled
          jvAlignedControl.setValue(true, { emitEvent: false });
        }
      }
    }
  }


  // Function to remove a row
  removeConsultationRow(index: number) {
    if (this.consultationRows.length > 1) {
      this.consultationRows.removeAt(index);
    }
  }


  openModal() {
    const modalRef = this._mdlSvc.open(DummyCompComponent);
    modalRef.result.then((result) => {
      if (result) {
        console.log(result);
      }
    });
  }

  goToPreview(): void {
    if (this.paperId) {
      this.router.navigate(['/preview/approval-of-sale-disposal-form', this.paperId]);
    }
  }

  exportToPDF(): void {
    if (this.paperId) {
      this.isExporting = true;
      const paperId = Number(this.paperId);
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
        },
        complete: () => {
          this.isExporting = false;
        }
      });
    } else {
      this.toastService.show('Paper ID not found', 'danger');
    }
  }

  private downloadPDFFromBase64(fileName: string, base64Data: string): void {
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

  onFormKeyDown(event: KeyboardEvent): void {
    // Allow Enter key in CKEditor - check if event target is within editor container
    const target = event.target as HTMLElement;
    if (target && (target.closest('.editor-container') || target.closest('ckeditor') || target.closest('.ck-editor'))) {
      return; // Allow Enter in CKEditor
    }
    // Prevent Enter key from submitting form in regular inputs
    if (event.key === 'Enter' && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      event.preventDefault();
    }
  }

  onSubmit(event: SubmitEvent): void {
    if (this.isSubmitting) return;

    // Ensure section2 is visible so form controls are created and committee logic runs
    if (!this.sectionVisibility['section2']) {
      this.sectionVisibility['section2'] = true;
      // Set flag to prevent jvAligned reset during programmatic form updates
      this.isProgrammaticFormUpdate = true;

      // Ensure form controls are created for selected PSAs
      const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
      selectedPSAJV.forEach((psaName: string) => {
        this.addPSAJVFormControls(psaName);
      });

      // Get costAllocation FormGroup to access raw values
      const costAllocationFormGroup = this.generalInfoForm.get('costAllocation') as FormGroup;
      const rawCostAllocationValues = costAllocationFormGroup?.getRawValue() || {};

      // Trigger committee logic for all selected PSAs to ensure checkbox values are set
      selectedPSAJV.forEach((psaName: string) => {
        const checkboxControlName = this.getPSACheckboxControlName(psaName);
        // Check both regular value and raw value since controls might be disabled
        const isChecked = rawCostAllocationValues[checkboxControlName] === true ||
                         costAllocationFormGroup?.get(checkboxControlName)?.value === true;

        if (isChecked) {
          // Re-evaluate committee checkboxes based on current form values
          this.triggerCommitteeLogicForPSA(psaName, true);
        }
      });

      // Keep flag set until after payload is built to prevent any form changes from resetting jvAligned
      // We'll reset it after reading form values
    }

    // Get status from the submitter button
    const statusFromButton = event.submitter?.getAttribute('data-status');
    if (statusFromButton) {
      this.pendingStatus = statusFromButton;
      // Set paperStatusId and currentPaperStatus for form submission
      const selectedStatus = this.paperStatusList.find(item => item.paperStatus === statusFromButton);
      if (selectedStatus) {
        this.paperStatusId = selectedStatus.id;
        this.currentPaperStatus = selectedStatus.paperStatus;
      }
    }

    if (!this.paperStatusId) {
      this.toastService.show("Paper status id not found", "danger")
      return
    }

    // Only validate and mark fields as touched for Registered status
    if (this.currentPaperStatus === "Registered") {
      this.submitted = true;
      console.log("==this.generalInfoForm", this.generalInfoForm)

      // Mark all invalid form controls as touched to show validation errors
      this.markFormGroupTouched(this.generalInfoForm);

      // Mark all form arrays as touched
      const consultationArray = this.generalInfoForm.get('consultation') as FormArray;
      if (consultationArray) {
        this.markFormArrayTouched(consultationArray);
      }

      // Check if form is valid
      if (this.generalInfoForm.invalid) {
        this.toastService.show("Please fill all required fields", "danger");
        return;
      }
    }

    // Use getRawValue to include disabled controls (important for JV Admin and other roles with disabled fields)
    const generalInfoValue = this.generalInfoForm?.getRawValue()?.generalInfo
    const costAllocationValues = this.generalInfoForm?.getRawValue()?.costAllocation // Use getRawValue to include disabled controls
    // Use getRawValue to include disabled controls (like jvAligned which might be disabled)
    const consultationsValue = this.generalInfoForm?.getRawValue()?.consultation || this.generalInfoForm?.value?.consultation

    // Reset flag immediately after reading form values to allow normal auto-reset behavior
    // The flag was only needed to prevent reset during programmatic form setup
    this.isProgrammaticFormUpdate = false;

    // Build costAllocationJVApproval from costAllocation FormGroup (like template3)
    // Mapping PSAs from the costAllocation object dynamically
    // Use getRawValue to include disabled controls (psajv is already included in generalInfoValue from getRawValue)
    const selectedPSAJV = generalInfoValue?.psajv || [];
    const psaMappings = selectedPSAJV.map((psaName: string) => ({
      key: this.getPSACheckboxControlName(psaName),
      name: psaName
    }));

    const costAllocationJVApproval = psaMappings
      .map((psa: any, index: number) => {
        const checkboxKey = psa.key;
        const percentageKey = `percentage_${psa.key}`;
        const valueKey = `value_${psa.key}`;

        // Check if checkbox is checked (PSA is selected)
        const checkboxValue = costAllocationValues?.[checkboxKey];
        const isChecked = checkboxValue === true || checkboxValue === 'true' || checkboxValue === 1;

        // Include PSA if checkbox is checked, even if percentage is 0 or empty
        if (isChecked && costAllocationValues) {
          return {
            id: index,
            psaName: psa.name,
            psaValue: true,
            percentage: costAllocationValues[percentageKey] !== undefined && costAllocationValues[percentageKey] !== null && costAllocationValues[percentageKey] !== ''
              ? Number(costAllocationValues[percentageKey]) || 0
              : 0,
            value: costAllocationValues[valueKey] !== undefined && costAllocationValues[valueKey] !== null && costAllocationValues[valueKey] !== ''
              ? Number(costAllocationValues[valueKey]) || 0
              : 0
          };
        }
        return null;
      })
      .filter((item: any) => item !== null);


    const params = {
      papers: {
        paperStatusId: this.paperStatusId,
        paperProvision: generalInfoValue?.paperProvision || "",
        purposeRequired: generalInfoValue?.purposeRequired || "",
        isActive: true,
        bltMember: generalInfoValue?.bltMember || null,
        vP1UserId: generalInfoValue?.vP1UserId || null,
        pdManagerName: generalInfoValue?.pdManagerName || null,
        procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "",
        cgbItemRefNo: generalInfoValue?.cgbItemRef || '',
        cgbCirculationDate: generalInfoValue?.cgbCirculationDate || null,
        operatingFunction: generalInfoValue?.operatingFunction || '',
        psajv: generalInfoValue?.psajv?.join(',') || "",
        isGovtReprAligned: generalInfoValue?.isGovtReprAligned || false,
        govtReprAlignedComment: generalInfoValue?.govtReprAlignedComment || '',
        isIFRS16: false, // Not in form, defaulting to false
        isGIAAPCheck: false, // Not in form, defaulting to false
        isRetrospectiveApproval: generalInfoValue?.isRetrospectiveApproval || false,
        retrospectiveApprovalReason: generalInfoValue?.retrospectiveApprovalReason || '',
        vendorId: null, // Not in form
        cgbApprovalDate: null, // Not in form
        camUserId: generalInfoValue?.technicalApprover || null, // Map technicalApprover to camUserId
        globalCGB: '', // Not in form
        contractNo: '', // Not in form
        ...(this.paperId && !this.isCopy ? { id: Number(this.paperId) } : {})
      },
      approvalOfSale: {
        transactionType: generalInfoValue?.transactionType || '',
        technicalApprover: generalInfoValue?.technicalApprover?.toString() || '',
        purchaserName: generalInfoValue?.purchaserName || '',
        saleDisposeValue: generalInfoValue?.saleDisposeValue || 0,
        referenceNo: generalInfoValue?.referenceNo || '',
      },
      consultations: (consultationsValue || []).map((consultation: any) => ({
        id: consultation.id || 0,
        psa: consultation.psa || '',
        technicalCorrect: consultation.technicalCorrect || null,
        budgetStatement: consultation.budgetStatement || null,
        jvReview: consultation.jvReview || null,
        isJVReviewDone: consultation.jvAligned || false
      })),
      costAllocationJVApproval: costAllocationJVApproval || [],
      jvApproval: (() => {
        // Initialize all jvApproval fields to false
        const jvApprovalObj: any = {
          contractCommittee_SDCC: false,
          contractCommittee_SCP_Co_CC: false,
          contractCommittee_SCP_Co_CCInfoNote: false,
          contractCommittee_BTC_CC: false,
          contractCommittee_BTC_CCInfoNote: false,
          contractCommittee_CGB: false,
          coVenturers_CMC: false,
          coVenturers_SDMC: false,
          coVenturers_SCP: false,
          coVenturers_SCP_Board: false,
          steeringCommittee_SC: false
        };

        // Read committee checkbox values directly from form controls
        // Use getRawValue() on the costAllocation FormGroup to ensure disabled controls are included
        const costAllocationFormGroup = this.generalInfoForm.get('costAllocation') as FormGroup;
        if (costAllocationFormGroup) {
          // Get raw values from the form group (includes disabled controls)
          const rawCostAllocationValues = costAllocationFormGroup.getRawValue();

          Object.keys(jvApprovalObj).forEach((key) => {
            if (key !== 'contractCommittee_ShAsimanValue' && key !== 'contractCommittee_BPGroupValue') {
              // Read from raw values (includes disabled controls)
              const controlValue = rawCostAllocationValues?.[key];

              if (controlValue !== undefined && controlValue !== null) {
                jvApprovalObj[key] = controlValue === true || controlValue === 'true' || controlValue === 1;
              }
            }
          });
        }

        return jvApprovalObj;
      })()
    }

    if (this.generalInfoForm.valid && this.currentPaperStatus === "Registered") {
      this.generatePaper(params)
    } else if (this.currentPaperStatus === "Draft") {
      const updatedParams = cleanObject(params);

      this.generatePaper(updatedParams)
    } else if (!this.generalInfoForm.valid && this.currentPaperStatus === "Registered") {
      this.toastService.show("Please fill all mandatory fields", "danger")
    } else if (this.currentPaperStatus === "On Pre-CGB" || this.currentPaperStatus === "On JV Approval") {
      this.generatePaper(params, false)
    }
  }

  generatePaper(params: any, updateStatus = true) {
    this.isSubmitting = true;
    this.paperService.upsertApprovalOfSales(params).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const docId = response.data.paperId || null
          this.uploadFiles(docId)
          this.deleteMultipleDocuments(docId)

          if (updateStatus) {
            // Call setPaperStatus only if in edit mode and pendingStatus exists
            if (this.paperId && !this.isCopy && this.pendingStatus) {
              this.setPaperStatus(this.pendingStatus, true);
              this.pendingStatus = null; // Clear pending status
            }
          }

          this.generalInfoForm.reset();
          this.submitted = false;
          this.toastService.show(response.message || "Added Successfully", 'success');
          setTimeout(() => {
            this.router.navigate(['/all-papers']);
          }, 2000);
        } else {
          this.toastService.show(response.message || "Something went wrong.", 'danger');
        }
      },
      error: (error) => {
        console.log('Error', error);
        this.toastService.show("Something went wrong.", 'danger');
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  getPaperCommentLogs(paperId: number) {
    this.paperService.getPaperCommentLogs(paperId).subscribe(value => {
      this.logs = value.data;
    })
  }

  addPaperCommentLogs() {
    if (this.paperId) {
      this.paperService.addPaperCommentLogs({
        paperId: Number(this.paperId),
        logType: "Other",
        remarks: this.comment,
        description: this.comment,
        columnName: "string",
        isActive: true
      }).subscribe(value => {
        this.comment = '';
        this.getPaperCommentLogs(Number(this.paperId));
      })
    }
  }

  /**
   * Handle "Send for PDM Approval" button click
   * Directly updates paper status to "Waiting for PDM" (statusId = 4)
   * Similar to inbox-outbox component implementation
   */
  handleSendForPDM(): void {
    if (!this.paperId || this.isSubmitting) return;

    const currentStatusId = this.paperDetails?.paperDetails?.paperStatusId;
    if (!currentStatusId) {
      this.toastService.show('Current paper status not found', 'danger');
      return;
    }

    this.isSubmitting = true;
    
    // Status ID 4 = "Waiting for PDM" (as per paper-status.component.ts)
    this.paperConfigService.updateMultiplePaperStatus([{
      paperId: Number(this.paperId),
      existingStatusId: Number(currentStatusId),
      statusId: 4 // "Waiting for PDM"
    }]).subscribe({
      next: (response) => {
        if (response.status) {
          this.toastService.show('Paper has been sent for PDM Approval', 'success');
          // Reload paper details to reflect status change
          if (this.paperId) {
            this.fetchPaperDetails(Number(this.paperId));
          }
          // Optionally navigate to all papers list
          setTimeout(() => {
            this.router.navigate(['/all-papers']);
            this.isSubmitting = false;
          }, 1500);
        } else {
          this.toastService.show(response?.message || 'Failed to send paper for PDM Approval', 'danger');
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        console.error('Error sending paper for PDM Approval:', error);
        this.toastService.show('Error sending paper for PDM Approval', 'danger');
        this.isSubmitting = false;
      }
    });
  }

  setPaperStatus(status: string, callAPI: boolean = true): void {
    if (!this.paperStatusList?.length) return; // Check if list exists & is not empty

    this.paperStatusId = this.paperStatusList.find(item => item.paperStatus === status)?.id ?? null;
    this.currentPaperStatus = this.paperStatusList.find(item => item.paperStatus === status)?.paperStatus ?? null;
    if (callAPI && this.paperId) {
      this.paperConfigService.updateMultiplePaperStatus([{
        paperId: this.paperId,
        existingStatusId: this.paperDetails?.paperDetails.paperStatusId,
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

  approvePaper(modal: any, type: string) {
    if (this.selectedPaper > 0) {
      this.paperConfigService.approveRejectPaper({
        paperId: this.selectedPaper,
        remarks: this.reviewBy || '',
        description: this.approvalRemark,
        type:
          this.loggedInUser?.roleName === 'PDM' ? 'PDM Approval' : 'Pre-CGB Approval',
        check: type,
      })
        .subscribe({
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

  checkPartnerApprovalStatus(paperId: number) {
    if (!this.loggedInUser) {
      this.canShowPartnerApproveReject = true; // Default to showing buttons if user not loaded
      return;
    }

    this.paperConfigService.getPartnerApprovalStatus(paperId).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.partnerApprovalStatuses = response.data;
          // Check if logged-in user's ID is NOT in any approvedByUserId
          const hasUserApproved = response.data.some(
            (status) => status.approvedByUserId === this.loggedInUser?.id
          );
          this.canShowPartnerApproveReject = !hasUserApproved;
        } else {
          // Default to showing buttons if API fails or returns no data
          this.canShowPartnerApproveReject = true;
        }
      },
      error: (error) => {
        console.error('Error fetching partner approval status:', error);
        // Default to showing buttons if API fails
        this.canShowPartnerApproveReject = true;
      }
    });
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

  addReview(modal: any) {
    if (this.selectedPaper > 0) {
      this.paperService.addPaperCommentLogs({
        paperId: this.selectedPaper,
        logType: 'Other',
        remarks: this.approvalRemark,
        description: this.approvalRemark,
        columnName: '',
        isActive: true,
      })
        .subscribe({
          next: (response) => {
            if (response.status && response.data) {
              modal.close('Save click');
            }
          },
          error: (error) => {
            console.log('error', error);
          },
        });
    }
  }

  open(event: Event, content: TemplateRef<any>, paperId?: any) {
    event.preventDefault();
    this._mdlSvc
      .open(content, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true, // Ensure modal is centered
        size: 'lg', // Adjust size as needed (sm, lg, xl)
      })
      .result.then(
      (result) => {
        // Handle modal close
      },
      (reason) => {
        // Handle modal dismiss
      }
    );

    if (paperId) {
      this.selectedPaper = paperId;
    }
  }

  toggleSection(section: string): void {
    this.sectionVisibility[section] = !this.sectionVisibility[section];
  }

  // Attachment methods
  getUploadedDocs(paperId: number): void {
    this.uploadService.getDocItemsListByPaperId(paperId).subscribe((value: any) => {
      const response = value?.data;

      if (response && Array.isArray(response) && response.length > 0) {
        this.selectedFiles = response.map((doc: any) => {
          const mimeType = getMimeTypeFromFileName(doc.docName);
          return {
            name: doc.docName,
            preview: `data:${mimeType};base64,${doc.fileData}`,
            file: null,
            isImage: mimeType.startsWith('image'),
            id: doc.id
          };
        });
      } else {
        this.selectedFiles = []; // Clear or handle empty state
      }
    });
  }

  onFileSelected(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files) {
      Array.from(inputElement.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileType = getMimeTypeFromFileName(file.name);
          this.selectedFiles.push({ file,name: file.name, preview: e.target?.result as string, isImage: fileType.startsWith('image'),id: null });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      Array.from(event.dataTransfer.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const fileType = getMimeTypeFromFileName(file.name);

          this.selectedFiles.push({ file,name: file.name, preview: e.target?.result as string, isImage: fileType.startsWith('image'), id: null });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // Remove a selected file
  removeFile(index: number, file: any = null) {
    this.selectedFiles.splice(index, 1);
    if(file.id && !this.isCopy) {
      this.deletedFiles.push(Number(file.id))
    }
  }

  deleteMultipleDocuments(paperId: number | null) {
    if (!paperId || this.deletedFiles.length === 0) return;

    this.deletedFiles.forEach(docId => {
      this.uploadService.deleteDocuments(paperId, docId).subscribe({
        next: (res: any) => {
          if (res.success) {
            console.log(`Deleted docId: ${docId}`);
          }
        },
        error: (err: any) => {
          console.error(`Failed to delete docId ${docId}:`, err);
        }
      });
    });
  }

  uploadFiles(docId: number | null) {
    if (!docId || this.selectedFiles.length === 0) return;

    const formData = new FormData();

    this.selectedFiles.forEach(item => {
      let file: File | null = null;

      if (item.file) {
        file = item.file;
      } else if (item.preview) {
        const base64 = item.preview.split(',')[1];
        const mimeType = getMimeTypeFromFileName(item.name);
        file = base64ToFile(base64, item.name, mimeType);
      }

      if (file) {
        formData.append('Files', file);
      }
    });

    if (formData.has('Files')) {
      this.uploadService.uploadDocuments(docId, formData).subscribe({
        next: (response: any) => {
          if (response.status && response.data) {
            console.log('Files uploaded successfully!');
            this.selectedFiles = [];
          }
        },
        error: (error: any) => {
          console.error('Upload error:', error);
        },
      });
    }
  }

}
