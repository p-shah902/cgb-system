import { Component, inject, Renderer2, ViewChild, ElementRef, TemplateRef, AfterViewInit } from '@angular/core';
import { CKEditorModule, loadCKEditorCloud, CKEditorCloudResult } from '@ckeditor/ckeditor5-angular';
import type { ClassicEditor, EditorConfig } from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors, FormsModule
} from '@angular/forms';
import { NgbModal, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { environment } from '../core/app-config';
import { Select2 } from 'ng-select2-component';
import { DictionaryService } from '../../service/dictionary.service';
import { Generalervice } from '../../service/general.service';
import { UploadService } from '../../service/document.service';
import { ToastService } from '../../service/toast.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DictionaryDetail } from '../../models/dictionary';
import { LoginUser, UserDetails, GetUsersListRequest } from '../../models/user';
import { UserService } from '../../service/user.service';
import { PaperService } from '../../service/paper.service';
import { CountryDetail } from '../../models/general';
import { PaperMappingType, PaperStatusType, PSAEntry, PartnerApprovalStatus } from '../../models/paper';
import { VendorService } from '../../service/vendor.service';
import { VendorDetail } from '../../models/vendor';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { EditorComponent } from '../../components/editor/editor.component';
import { CommentableDirective } from '../../directives/commentable.directive';
import { EditorNormalComponent } from '../../components/editor-normal/editor-normal.component';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { CommentService } from '../../service/comment.service';
import { EditorService } from '../../service/editor.service';
import { AuthService } from '../../service/auth.service';
import { format } from 'date-fns';
import { BehaviorSubject } from 'rxjs';
import { DummyCompComponent } from '../dummy-comp/dummy-comp.component';
import { cleanObject, base64ToFile, getMimeTypeFromFileName } from '../../utils/index';
import { ThresholdType } from '../../models/threshold';
import { ThresholdService } from '../../service/threshold.service';
import { ToggleService } from '../shared/services/toggle.service';
import { PermissionService } from '../shared/services/permission.service';
import { CURRENCY_LIST } from '../../utils/constant';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NumberInputComponent } from '../../components/number-input/number-input.component';
import { COMMITTEE_CONDITIONS } from '../../utils/threshold-conditions';
import { ActionBarComponent } from '../shared/components/action-bar/action-bar.component';
import {BatchService} from '../../service/batch.service';

@Component({
  selector: 'app-template3',
  standalone: true,
  imports: [CommonModule, NumberInputComponent, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, EditorComponent, CommentableDirective, EditorNormalComponent, TimeAgoPipe, RouterLink, NgbTooltip, ActionBarComponent],
  templateUrl: './template3.component.html',
  styleUrl: './template3.component.scss'
})
export class Template3Component implements AfterViewInit {
  @ViewChild('sectionDropdown') sectionDropdown!: ElementRef<HTMLSelectElement>;

  private readonly userService = inject(UserService);
  private readonly paperService = inject(PaperService);
  private readonly vendorService = inject(VendorService);
  private paperConfigService = inject(PaperConfigService);
  private readonly thresholdService = inject(ThresholdService);
  private commentService = inject(CommentService);
  private editorService = inject(EditorService);
  private authService = inject(AuthService);
  private searchTimeout: any;
  public Editor: typeof ClassicEditor | null = null;
  public config: EditorConfig | null = null;
  private allApisDone$ = new BehaviorSubject<boolean>(false);
  private psaCalculationListenersSet = new Set<string>(); // Track which PSAJV columns have calculation listeners
  generalInfoForm!: FormGroup;
  isExpanded: boolean = true; // Default expanded
  paperId: string | null = null;
  isCopy = false;
  submitted = false;
  isSubmitting = false;
  isLoadingDetails = false;
  isExporting = false;
  highlightClass = 'highlight';
  paperStatusId: number | null = null;
  pendingStatus: string | null = null;
  paperDetails: any = null
  vendorList: VendorDetail[] = []
  userDetails: UserDetails[] = [];
  procurementTagUsers: any[] = [];
  camOptions: { value: string; label: string }[] = [];
  vendorOptions: { value: string; label: string }[] = [];
  countryDetails: CountryDetail[] = [];
  paperStatusList: PaperStatusType[] = [];
  isRegisterPaper: boolean = false
  private completedCount = 0;
  private totalCalls = 6;
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
  loggedInUser: LoginUser | null = null;
  selectedPaper: number = 0;
  approvalRemark: string = '';
  reviewBy: string = '';
  partnerApprovalStatuses: PartnerApprovalStatus[] = [];
  canShowPartnerApproveReject: boolean = false;
  currentPaperStatus: string | null = null;
  private readonly _mdlSvc = inject(NgbModal);
  thresholdData: ThresholdType[] = []
  deletedFiles: number[] = []
  selectedFiles: any[] = [];
  isDragging = false;
  logs: any[] = [];
  isShowBoxSection = false
  comment: string = '';
  isInitialLoad = true;
  private isProgrammaticFormUpdate = false;
  sectionVisibility: { [key: string]: boolean } = {
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
    section6: false,
    section7: false,
    section8: false,
    section9: false,
    section10: false,
  };
  paperMappingData: PaperMappingType[] = [];
  previousCGBRefOptions: any[] = [];

  psaItems: Array<{ psaName: string, control: string, percentage: string, value: string }> = [];

  allowedGroups = [
    { key: 'originalValue', label: 'Original Value' },
    { key: 'previousValue', label: 'Previous Value' },
    { key: 'thisValue', label: 'This Value' },
    { key: 'revisedValue', label: 'Revised Value' }
  ];


  public psaJvOptions: { value: string; label: string }[] = [];
  batchPaperList: any[] = [];
  selectedBatchPaper: any = null;

  constructor(private router: Router, private toggleService: ToggleService, private route: ActivatedRoute, private dictionaryService: DictionaryService,
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
                this.generalInfoForm.get('generalInfo.camUserId')?.setValue(camId);
              }, 1000)
            }
          }
          console.log('Paper ID:', this.paperId);
        });
      }
    });


    this.route.queryParamMap.subscribe(queryParams => {
      this.isCopy = queryParams.get('isCopy') === 'true';
    });
    this.loadUserDetails();
    this.loadDictionaryItems();
    this.loadPaperStatusListData();
    this.loadThresholdData()
    this.loadBatchPapersList();
    this.loadVendoreDetails()
    this.loadForm()
    this.fetchApprovedPapersForMapping()
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


    this.generalInfoForm.get('generalInfo.camUserId')?.valueChanges.subscribe((newCamUserId) => {
      this.updateTechnicalCorrectInAllRows(newCamUserId);
    });

    // Exchange rate is manually entered - auto-populate as default but allow manual override
    this.generalInfoForm.get('contractValues.currencyCode')?.valueChanges.subscribe(() => {
      // Only auto-populate if exchange rate is 0 or empty (initial state)
      const currentExchangeRate = this.generalInfoForm.get('contractValues.exchangeRate')?.value;
      if (!currentExchangeRate || currentExchangeRate === 0) {
        this.updateExchangeRate();
      }
    });

    // Update contract value when exchange rate changes manually
    this.generalInfoForm.get('contractValues.exchangeRate')?.valueChanges.subscribe(() => {
      this.updateContractValueOriginalCurrency();
    });

    this.generalInfoForm.get('contractValues.revisedContractValue')?.valueChanges.subscribe(() => {
      this.updateContractValueOriginalCurrency();
    });

    // Exchange rate is manually editable - no automatic updates after initial population

    this.generalInfoForm.get('contractValues.thisVariationNote')?.valueChanges.subscribe(() => {
      // Recalculate all "By value $" fields when "This Value" changes (like template1 does with contractValueUsd)
      this.recalculateAllPSAValues();
      // Auto-calculate revised contract value
      this.calculateRevisedContractValue();
      // Re-evaluate committee checkboxes after PSA values are recalculated
      this.reEvaluateAllCommitteeCheckboxes();
    });

    // Auto-calculate revised contract value when original or previous variation changes
    this.generalInfoForm.get('contractValues.originalContractValue')?.valueChanges.subscribe(() => {
      this.calculateRevisedContractValue();
    });

    this.generalInfoForm.get('contractValues.previousVariationTotal')?.valueChanges.subscribe(() => {
      this.calculateRevisedContractValue();
    });

    // Re-evaluate committee checkboxes when sourcing type changes
    this.generalInfoForm.get('generalInfo.sourcingType')?.valueChanges.subscribe(() => {
      this.reEvaluateAllCommitteeCheckboxes();
    });

    // Re-evaluate committee checkboxes when revised contract value changes
    this.generalInfoForm.get('contractValues.revisedContractValue')?.valueChanges.subscribe(() => {
      this.reEvaluateAllCommitteeCheckboxes();
    });

    // Setup date validation
    this.setupDateValidation();

    this.generalInfoForm.get('generalInfo.cgbAwardRefNo')?.valueChanges.subscribe((cgbAwardRefNo) => {
      this.updateCgbApprovalDate(Number(cgbAwardRefNo));
    });

    this.onLTCCChange()
    this.onCurrencyLinktoBaseCostChange()
    this.onConflictofInterestChange()
    this.onApprovalChange()
    this.setupJVAlignedAutoReset()

  }

  setupValueDeliveryRemarksValidation() {
    const valueDeliveryGroup = this.generalInfoForm.get('valueDelivery');
    if (!valueDeliveryGroup) return;

    // Setup validation for Cost Reduction
    const checkCostReductionValidation = () => {
      const value = valueDeliveryGroup.get('costReductionValue')?.value;
      const percentControl = valueDeliveryGroup.get('costReductionPercent');
      const remarksControl = valueDeliveryGroup.get('costReductionRemarks');

      const hasValue = value !== null && value !== undefined && value !== '' && value !== 0;

      if (hasValue) {
        // If $ is entered, both % and Remark are required
        percentControl?.setValidators([Validators.required]);
        remarksControl?.setValidators([Validators.required]);
      } else {
        // If $ is not entered, clear validators
        percentControl?.clearValidators();
        remarksControl?.clearValidators();
      }
      percentControl?.updateValueAndValidity();
      remarksControl?.updateValueAndValidity();
    };

    // Subscribe to changes for Cost Reduction
    valueDeliveryGroup.get('costReductionValue')?.valueChanges.subscribe(() => {
      checkCostReductionValidation();
    });

    // Check initial state
    checkCostReductionValidation();
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

    const { FormatPainter } = cloud.CKEditorPremiumFeatures;

    this.Editor = ClassicEditor;
    this.config = {
      licenseKey: environment.ckEditorLicenceKey,
      plugins: [
        Essentials, Paragraph, Bold, Italic, Underline, Strikethrough,
        BlockQuote, Link, FormatPainter
      ],
      toolbar: [
        'undo', 'redo', '|', 'bold', 'italic', 'underline', 'strikethrough', '|',
        'numberedList', 'bulletedList', 'blockquote', 'link', '|', 'formatPainter'
      ],
      fontSize: {
        options: [10, 12, 14, 16, 18, 20, 24, 28, 32, 36],
        supportAllValues: true
      },
      ui: {
        viewportOffset: { top: 50, bottom: 50 }  // Adjust editor's viewport
      }
    };
  }

  getPaperCommentLogs(paperId: number) {
    this.paperService.getPaperCommentLogs(paperId).subscribe(value => {
      // Reverse the array to show newest comments first
      this.logs = value.data ? [...value.data].reverse() : [];
    })
  }

  loadForm() {
    let camId = null

    if(!this.paperId && this.loggedInUser?.roleName === 'CAM') {
      camId = this.loggedInUser?.id ? this.loggedInUser.id.toString() : null
    }

    this.generalInfoForm = this.fb.group({
      generalInfo: this.fb.group({
        paperProvision: ['', Validators.required],
        purposeRequired: ['', Validators.required],
        isChangeinSOW: [false],
        isIncreaseInValue: [false],
        isExtensionOfDuration: [false],
        isTEToCompleteBidding: [false],
        teToCompleteBiddingJustification: [''],
        isChangeInRates: [false],
        batchPaper: [null],
        cgbItemRefNo: [{ value: '', disabled: true }],
        cgbCirculationDate: [{ value: '', disabled: true }],
        cgbAwardRefNo: [''],
        cgbApprovalDate: [null],
        otherRelatedCgbPapers: [''],
        fullLegalName: ['', Validators.required],
        contractNo: [''],
        globalCGB: ['', Validators.required],
        camUserId: [camId, [Validators.required, Validators.pattern("^[0-9]+$")]],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, Validators.required],
        operatingFunction: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        subSector: ['', Validators.required],
        sourcingType: ['', Validators.required],
        contractStartDate: [null, Validators.required],
        contractEndDate: [null, [Validators.required, this.endDateAfterStartDate('contractStartDate')]],
        variationStartDate: [null, Validators.required],
        variationEndDate: [null, [Validators.required, this.endDateAfterStartDate('variationStartDate')]],
        psajv: [[], Validators.required],
        isLTCC: [null],
        ltccNotes: [''],
        isGovtReprAligned: [null],
        govtReprAlignedComment: [''],
        isIFRS16: [false],
        isGIAAPCheck: [false],
      }),
      justificationSection: this.fb.group({
        whyChangeRequired: ['', Validators.required],
        longTermStrategy: ['', Validators.required],
      }),
      contractInfo: this.fb.group({
        isPHCA: [null],
        workspaceNo: [''],
        remunerationType: ['', Validators.required],
        previousCGBRefNo: [''],
        isPaymentRequired: [null],
        prePayAmount: [null],
        isRetrospectiveApproval: [null],
        retrospectiveApprovalReason: [{ value: '', disabled: true }],
        isConflictOfInterest: [null],
        conflictOfInterestComment: [{ value: '', disabled: true }],
      }),
      contractValues: this.fb.group({
        originalContractValue: [0],
        previousVariationTotal: [0],
        thisVariationNote: [0, Validators.required],
        exchangeRate: [1.00], // Default to 1.00 for USD
        currencyCode: [''],
        contractValue: [0],
        revisedContractValue: [0],
        spendOnContract: [0],
        isCurrencyLinktoBaseCost: [null],
        noCurrencyLinkNotes: [{ value: '', disabled: true }],
        isConflictOfInterest: [null],
        conflictOfInterestComment: [{ value: '', disabled: true }],
      }),
      ccd: this.fb.group({
        isHighRiskContract: [null],
        daCDDCompleted: [null],
        highRiskExplanation: [''],
        flagRaisedCDD: [''],
        additionalCDD: [''],
      }),
      valueDelivery: this.fb.group({
        costReductionPercent: [null],
        costReductionValue: [null],
        costReductionRemarks: [''],
        operatingEfficiencyValue: [null],
        operatingEfficiencyPercent: [null],
        operatingEfficiencyRemarks: [''],
        costAvoidanceValue: [null],
        costAvoidancePercent: [null],
        costAvoidanceRemarks: [''],
      }),
      costAllocation: this.fb.group({
        contractCommittee_SDCC: [false],
        contractCommittee_SCP_Co_CC: [false],
        contractCommittee_SCP_Co_CCInfoNote: [false],
        contractCommittee_BTC_CC: [false],
        contractCommittee_BTC_CCInfoNote: [false],
        contractCommittee_CGB: [false], //TODO discuss
        coVenturers_CMC: [false],
        coVenturers_SDMC: [false],
        coVenturers_SCP: [false],
        coVenturers_SCP_Board: [false],
        steeringCommittee_SC: [false],
        // isACG: [{value: false, disabled: true}],
        // isShah: [{value: false, disabled: true}],
        // isSCP: [{value: false, disabled: true}],
        // isBTC: [{value: false, disabled: true}],
        // isAsiman: [{value: false, disabled: true}],
        // isBPGroup: [{value: false, disabled: true}],
        totalPercentage: [0],
        totalValue: [0]
      }),
      consultation: this.fb.array([]),
      originalValue: this.createPsaFormGroup(),
      previousValue: this.createPsaFormGroup(),
      thisValue: this.createPsaFormGroup(),
      revisedValue: this.createPsaFormGroup(),
    });

    // Initialize PSA controls if PSA data is already loaded
    if (this.psaJvOptions.length > 0) {
      this.initializeAllPSAControls();
    }
  }

  createPsaFormGroup(): FormGroup {
    const group: any = {};

    this.psaItems.forEach(item => {
      group[item.control] = [false];
      group[item.percentage] = [0];
      group[item.value] = [0];
    });

    group.totalPercentage = [0];
    // group.totalPercentage = [0, this.exactHundredValidator];
    group.totalValue = [0];

    return this.fb.group(group)
  }


  exactHundredValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value !== 100) {
      return { notHundred: true };
    }
    return null;
  }


  getGroupForm(key: string): FormGroup {
    return this.generalInfoForm.get(key) as FormGroup;
  }

  updateExchangeRate() {
    const currencyCode = this.generalInfoForm.get('contractValues.currencyCode')?.value;
    const currencyItem = this.currenciesData.find((item) => item.id === Number(currencyCode)) || null
    const currency = CURRENCY_LIST.find(c => c.code === currencyItem?.itemValue);
    const exchangeRate = currency ? currency.rate : 0;

    this.generalInfoForm.get('contractValues.exchangeRate')?.setValue(exchangeRate);
    this.updateContractValueOriginalCurrency();
  }

  updateContractValueOriginalCurrency() {
    const contractValueUsd = Number(this.generalInfoForm.get('contractValues.revisedContractValue')?.value) || 0;
    const exchangeRate = Number(this.generalInfoForm.get('contractValues.exchangeRate')?.value) || 0;

    const convertedValue = contractValueUsd * exchangeRate;
    this.generalInfoForm.get('contractValues.contractValue')?.setValue(convertedValue);
  }

  calculateRevisedContractValue() {
    // Revised Contract Value = Original Contract Value + Previous Variation Total + This Value
    const originalContractValue = Number(this.generalInfoForm.get('contractValues.originalContractValue')?.value) || 0;
    const previousVariationTotal = Number(this.generalInfoForm.get('contractValues.previousVariationTotal')?.value) || 0;
    const thisVariationNote = Number(this.generalInfoForm.get('contractValues.thisVariationNote')?.value) || 0;

    const revisedContractValue = originalContractValue + previousVariationTotal + thisVariationNote;
    this.generalInfoForm.get('contractValues.revisedContractValue')?.setValue(revisedContractValue, { emitEvent: false });

    // Update Value in Original Currency when Revised Contract Value changes
    this.updateContractValueOriginalCurrency();
  }

  updateCgbApprovalDate(id: number | null) {
    const cgbAward = this.paperMappingData.find((item) => item.paperID == id)
    if (!cgbAward || !id) {
      return
    }
    const convertedValue = cgbAward.entryDate ? format(new Date(cgbAward.entryDate), 'yyyy-MM-dd') : null
    this.generalInfoForm.get('generalInfo.cgbApprovalDate')?.setValue(convertedValue);
  }

  onPopulateFromContract() {
    const cgbAwardRefNo = this.generalInfoForm.get('generalInfo.cgbAwardRefNo')?.value;
    if (!cgbAwardRefNo) {
      this.toastService.show('Please select CGB Award Ref No first', 'warning');
      return;
    }
    this.fetchCAPaperDetails(Number(cgbAwardRefNo));
  }

  fetchCAPaperDetails(paperId: number) {
    if (!this.generalInfoForm) {
      this.toastService.show('Form not initialized. Please try again.', 'warning');
      return;
    }

    // Detect paper type from paperMappingData
    const selectedPaper = this.paperMappingData.find(item => item.paperID === paperId);
    const paperType = selectedPaper?.paperType || 'Contract Award';
    const apiType = paperType === 'Variation Paper' ? 'variation' : paperType === 'Approach to Market' ? 'approch' : 'contract';

    console.log(`Populating from ${paperType} (paperId: ${paperId}, apiType: ${apiType})`);

    this.paperService.getPaperDetailsWithPreview(paperId, apiType).subscribe({
      next: (value) => {
        if (!value || !value.data) {
          this.toastService.show('No data received from the selected paper.', 'warning');
          return;
        }

        const contractPaperDetails = value.data as any;
        console.log('Paper Details:', contractPaperDetails);

        // Extract data based on paper type
        let contractGeneralInfo: any = null;
        let contractValueData: any = null;
        let contractJvApprovalsData: any = null;
        let contractCostAllocationJVApprovalData: any[] = [];
        let variationContractValues: any = null;
        let contractConsultationsData: any[] = [];

        if (paperType === 'Variation Paper') {
          // For Variation Papers, data is in paperDetails.paperDetails
          contractGeneralInfo = contractPaperDetails?.paperDetails?.paperDetails || null;
          contractValueData = contractPaperDetails?.paperDetails?.valueDeliveriesCostsharing?.[0] || null;
          contractJvApprovalsData = contractPaperDetails?.paperDetails?.jvApprovals?.[0] || null;
          contractCostAllocationJVApprovalData = contractPaperDetails?.paperDetails?.costAllocationJVApproval || [];
          contractConsultationsData = contractPaperDetails?.paperDetails?.consultationsDetails || contractPaperDetails?.consultationsDetails || [];
          // Contract values are in the same paperDetails object
          variationContractValues = contractPaperDetails?.paperDetails?.paperDetails || null;

          console.log('Variation Paper contract values:', variationContractValues);
        } else if (paperType === 'Approach to Market') {
          // For Approach to Market Papers, data structure is similar to Variation Papers
          contractGeneralInfo = contractPaperDetails?.paperDetails?.paperDetails || contractPaperDetails?.paperDetails || null;
          contractValueData = contractPaperDetails?.paperDetails?.valueDeliveriesCostsharing?.[0] || contractPaperDetails?.valueDeliveriesCostsharing?.[0] || null;
          contractJvApprovalsData = contractPaperDetails?.paperDetails?.jvApprovals?.[0] || contractPaperDetails?.jvApprovals?.[0] || null;
          contractCostAllocationJVApprovalData = contractPaperDetails?.paperDetails?.costAllocationJVApproval || contractPaperDetails?.costAllocationJVApproval || [];
          contractConsultationsData = contractPaperDetails?.paperDetails?.consultationsDetails || contractPaperDetails?.consultationsDetails || [];
          // For ATM, contract values are in the same paperDetails object
          variationContractValues = contractPaperDetails?.paperDetails?.paperDetails || contractPaperDetails?.paperDetails || null;

          console.log('Approach to Market Paper contract values:', variationContractValues);
        } else {
          // For Contract Award Papers, use existing structure
          contractGeneralInfo = contractPaperDetails?.paperDetails?.contractAwardDetails || null;
          contractValueData = contractPaperDetails?.paperDetails?.valueDeliveries?.[0] || null;
          contractJvApprovalsData = contractPaperDetails?.paperDetails?.jvApprovals?.[0] || null;
          contractCostAllocationJVApprovalData = contractPaperDetails?.paperDetails?.costAllocationJVApproval || [];
          contractConsultationsData = contractPaperDetails?.paperDetails?.consultationsDetails || contractPaperDetails?.consultationsDetails || [];
        }

        if (!contractGeneralInfo) {
          this.toastService.show(`${paperType} details not found in the selected paper.`, 'warning');
          return;
        }

        console.log('Contract General Info:', contractGeneralInfo);
        console.log('PSA JV Options:', this.psaJvOptions);

      // Start with PSAs from contractGeneralInfo
      const selectedValuesPSAJV = contractGeneralInfo?.psajv
        ? contractGeneralInfo.psajv
          .split(',')
          .map((label: any) => label.trim())
          .map((label: any) => this.psaJvOptions.find((option) => option.label === label)?.value)
          .filter((value: any) => value != null)
        : [];

      // Also include PSAs from costAllocationJVApproval that have values
      const psasFromCostAllocation = contractCostAllocationJVApprovalData
        .filter((psa: any) => psa.psaValue === true)
        .map((psa: any) => {
          // Find the PSA value from psaJvOptions by matching the psaName
          const psaOption = this.psaJvOptions.find(option =>
            option.label === psa.psaName || option.value === psa.psaName
          );
          return psaOption?.value;
        })
        .filter((value: any) => value != null);

      // Merge and deduplicate
      const allSelectedValuesPSAJV = [...new Set([...selectedValuesPSAJV, ...psasFromCostAllocation])];

      // IMPORTANT: Create form controls BEFORE patching values, otherwise values will be lost
      allSelectedValuesPSAJV.forEach((psaName: string) => {
        this.addPSAJVFormControls(psaName);
      });

      // Handle procurementSPAUsers - it might be comma-separated IDs or names
      let selectedValuesProcurementTagUsers: any[] = [];
      if (contractGeneralInfo?.procurementSPAUsers) {
        const userIds = contractGeneralInfo.procurementSPAUsers
          .split(',')
          .map((id: any) => id.trim());

        // If procurementTagUsers is loaded, map IDs to values
        if (this.procurementTagUsers && this.procurementTagUsers.length > 0) {
          selectedValuesProcurementTagUsers = userIds
            .map((id: any) => {
              const numId = Number(id);
              const found = this.procurementTagUsers.find((option: any) => option.value === numId);
              return found ? found.value : numId; // Return the ID if not found in options
            })
            .filter((value: any) => value != null);
        } else {
          // If procurementTagUsers not loaded yet, use the IDs directly
          selectedValuesProcurementTagUsers = userIds
            .map((id: any) => Number(id))
            .filter((id: any) => !isNaN(id));
        }
      }
      console.log('Selected Procurement SPA Users:', selectedValuesProcurementTagUsers);

      // Prepare cost allocation patch values
      const patchValues: any = { costAllocation: {} };

      // Assign PSA/JV values dynamically from Contract paper using the same naming logic
      contractCostAllocationJVApprovalData.forEach((psa: any) => {
        // Use the same method that creates control names to ensure consistency
        const checkboxKey = this.getPSACheckboxControlName(psa.psaName);
        const percentageKey = this.getPSAPercentageControlName(psa.psaName);
        const valueKey = this.getPSAValueControlName(psa.psaName);

        if (checkboxKey) {
          patchValues.costAllocation[checkboxKey] = psa.psaValue;
          patchValues.costAllocation[percentageKey] = psa.percentage;
          patchValues.costAllocation[valueKey] = psa.value;
        }
      });

      // Assign JV Approvals data from Contract paper
      Object.assign(patchValues.costAllocation, {
        contractCommittee_SDCC: contractJvApprovalsData?.contractCommittee_SDCC || false,
        contractCommittee_SCP_Co_CC: contractJvApprovalsData?.contractCommittee_SCP_Co_CC || false,
        contractCommittee_SCP_Co_CCInfoNote: contractJvApprovalsData?.contractCommittee_SCP_Co_CCInfoNote || false,
        contractCommittee_BTC_CC: contractJvApprovalsData?.contractCommittee_BTC_CC || false,
        contractCommittee_BTC_CCInfoNote: contractJvApprovalsData?.contractCommittee_BTC_CCInfoNote || false,
        contractCommittee_CGB: false,
        coVenturers_CMC: contractJvApprovalsData?.coVenturers_CMC || false,
        coVenturers_SDMC: contractJvApprovalsData?.coVenturers_SDMC || false,
        coVenturers_SCP: contractJvApprovalsData?.coVenturers_SCP || false,
        coVenturers_SCP_Board: contractJvApprovalsData?.coVenturers_SCP_Board || false,
        steeringCommittee_SC: contractJvApprovalsData?.steeringCommittee_SC || false,
      });

      // Patch all matching fields from Contract paper to Variation template
      console.log('Patching form with data:', {
        contractGeneralInfo,
        selectedValuesProcurementTagUsers,
        allSelectedValuesPSAJV
      });

      this.generalInfoForm.patchValue({
        generalInfo: {
          // Keep the paperProvision from the current form (user entered)
          batchPaper: contractPaperDetails?.batchPaperId || null,
          cgbItemRefNo: contractGeneralInfo?.cgbItemRefNo || '',
          cgbCirculationDate: contractGeneralInfo?.cgbCirculationDate
            ? format(new Date(contractGeneralInfo.cgbCirculationDate), 'yyyy-MM-dd')
            : null,
          cgbApprovalDate: contractGeneralInfo?.cgbApprovalDate
            ? format(new Date(contractGeneralInfo.cgbApprovalDate), 'yyyy-MM-dd')
            : null,
          purposeRequired: contractGeneralInfo?.purposeRequired || '',
          otherRelatedCgbPapers: contractGeneralInfo?.otherRelatedCgbPapers || '',
          fullLegalName: contractGeneralInfo?.vendorId ? contractGeneralInfo.vendorId.toString() : (contractGeneralInfo?.fullLegalName ? contractGeneralInfo.fullLegalName.toString() : null),
          contractNo: contractGeneralInfo?.contractNo || '',
          globalCGB: contractGeneralInfo?.globalCGB ? contractGeneralInfo.globalCGB.toString() : '',
          camUserId: contractGeneralInfo?.camUserId ? contractGeneralInfo.camUserId.toString() : null,
          vP1UserId: contractGeneralInfo?.vP1UserId || null,
          procurementSPAUsers: selectedValuesProcurementTagUsers,
          pdManagerName: contractGeneralInfo?.pdManagerNameId || contractGeneralInfo?.pdManagerName || null,
          operatingFunction: contractGeneralInfo?.operatingFunction ? contractGeneralInfo.operatingFunction.toString() : '',
          bltMember: contractGeneralInfo?.bltMemberId ? Number(contractGeneralInfo.bltMemberId) : contractGeneralInfo?.bltMember || null,
          subSector: contractGeneralInfo?.subSector ? contractGeneralInfo.subSector.toString() : '',
          sourcingType: contractGeneralInfo?.sourcingType ? contractGeneralInfo.sourcingType.toString() : '',
          psajv: allSelectedValuesPSAJV,
          isLTCC: contractGeneralInfo?.isLTCC || false,
          ltccNotes: contractGeneralInfo?.ltccNotes || '',
          isGovtReprAligned: contractGeneralInfo?.isGovtReprAligned || false,
          govtReprAlignedComment: contractGeneralInfo?.govtReprAlignedComment || '',
          contractStartDate: contractGeneralInfo?.contractStartDate
            ? format(new Date(contractGeneralInfo.contractStartDate), 'yyyy-MM-dd')
            : null,
          contractEndDate: contractGeneralInfo?.contractEndDate
            ? format(new Date(contractGeneralInfo.contractEndDate), 'yyyy-MM-dd')
            : null,
        },
        contractInfo: {
          isPHCA: contractGeneralInfo?.isPHCA || false,
          workspaceNo: contractGeneralInfo?.workspaceNo || '',
          remunerationType: contractGeneralInfo?.remunerationType ? contractGeneralInfo.remunerationType.toString() : '',
          isPaymentRequired: contractGeneralInfo?.isPaymentRequired || false,
          prePayAmount: contractGeneralInfo?.prePayAmount || 0,
          isRetrospectiveApproval: contractGeneralInfo?.isRetrospectiveApproval || false,
          retrospectiveApprovalReason: contractGeneralInfo?.retrospectiveApprovalReason || '',
        },
        contractValues: (() => {
          if (paperType === 'Variation Paper') {
            // For Variation Paper: Different calculation logic
            const currentPreviousVariationTotal = Number(this.generalInfoForm.get('contractValues.previousVariationTotal')?.value) || 0;
            const linkedVariationThisValue = Number(variationContractValues?.contractValue) || 0;
            const linkedVariationOriginal = Number(variationContractValues?.originalContractValue) || 0;

            // Previous Variation Total = Current Prev + This Value from linked Variation
            const newPreviousVariationTotal = currentPreviousVariationTotal + linkedVariationThisValue;

            // Original Contract Value = Contract Value from linked Variation
            const originalContractValue = linkedVariationOriginal;

            // This Value = leave empty (user input)
            const thisVariationNote = 0;

            // Revised Contract Value = Original + Prev + This (will be auto-calculated)
            const revisedContractValue = originalContractValue + newPreviousVariationTotal + thisVariationNote;

            console.log('Variation Paper populate values:', {
              originalContractValue,
              newPreviousVariationTotal,
              thisVariationNote,
              revisedContractValue,
              currentPreviousVariationTotal,
              linkedVariationThisValue
            });

            return {
              originalContractValue: originalContractValue,
              previousVariationTotal: newPreviousVariationTotal,
              thisVariationNote: thisVariationNote,
              currencyCode: variationContractValues?.currencyCode ? variationContractValues.currencyCode.toString() : '',
              exchangeRate: variationContractValues?.exchangeRate || 0,
              contractValue: 0,
              revisedContractValue: revisedContractValue,
              spendOnContract: variationContractValues?.spendOnContract || 0,
              isCurrencyLinktoBaseCost: variationContractValues?.isCurrencyLinktoBaseCost || false,
              noCurrencyLinkNotes: variationContractValues?.noCurrencyLinkNotes || '',
              isConflictOfInterest: variationContractValues?.isConflictOfInterest || contractGeneralInfo?.isConflictOfInterest || false,
              conflictOfInterestComment: variationContractValues?.conflictOfInterestComment || contractGeneralInfo?.conflictOfInterestComment || '',
            };
          } else if (paperType === 'Approach to Market') {
            // For Approach to Market: Similar to Contract Award logic
            // ATM papers have contractValue in generalInfo
            const procurementDetails = contractPaperDetails?.paperDetails?.procurementDetails || null;
            return {
              // Map Contract value to Previous Variation Total in Variation template
              previousVariationTotal: contractGeneralInfo?.contractValue || contractGeneralInfo?.totalAwardValueUSD || 0,
              originalContractValue: contractGeneralInfo?.contractValue || 0,
              currencyCode: contractGeneralInfo?.currencyCode ? contractGeneralInfo.currencyCode.toString() : '',
              exchangeRate: contractGeneralInfo?.exchangeRate || 0,
              contractValue: 0,
              isCurrencyLinktoBaseCost: contractGeneralInfo?.contractCurrencyLinktoBaseCost || false,
              noCurrencyLinkNotes: contractGeneralInfo?.explanationsforBaseCost || '',
              isConflictOfInterest: procurementDetails?.isConflictOfInterest || contractGeneralInfo?.isConflictOfInterest || false,
              conflictOfInterestComment: procurementDetails?.conflictOfInterestComment || contractGeneralInfo?.conflictOfInterestComment || '',
            };
          } else {
            // For Contract Award: Use existing logic
            // Note: Contract Award has conflict of interest in procurementDetails, but we need to check the actual structure
            const procurementDetails = contractPaperDetails?.paperDetails?.procurementDetails || null;
            return {
              // Map Contract value to Previous Variation Total in Variation template
              previousVariationTotal: contractGeneralInfo?.totalAwardValueUSD || 0,
              originalContractValue: contractGeneralInfo?.contractValue || 0,
              currencyCode: contractGeneralInfo?.currencyCode ? contractGeneralInfo.currencyCode.toString() : '',
              exchangeRate: contractGeneralInfo?.exchangeRate || 0,
              contractValue: 0,
              isCurrencyLinktoBaseCost: contractGeneralInfo?.contractCurrencyLinktoBaseCost || false,
              noCurrencyLinkNotes: contractGeneralInfo?.explanationsforBaseCost || '',
              isConflictOfInterest: procurementDetails?.isConflictOfInterest || contractGeneralInfo?.isConflictOfInterest || false,
              conflictOfInterestComment: procurementDetails?.conflictOfInterestComment || contractGeneralInfo?.conflictOfInterestComment || '',
            };
          }
        })(),
        ccd: {
          isHighRiskContract: contractGeneralInfo?.isHighRiskContract || false,
          daCDDCompleted: contractGeneralInfo?.cddCompleted
            ? format(new Date(contractGeneralInfo.cddCompleted), 'yyyy-MM-dd')
            : null,
          highRiskExplanation: contractGeneralInfo?.highRiskExplanation || '',
          flagRaisedCDD: contractGeneralInfo?.flagRaisedCDD || '',
          additionalCDD: contractGeneralInfo?.additionalCDD || '',
        },
        valueDelivery: {
          costReductionPercent: contractValueData?.costReductionPercent || null,
          costReductionValue: contractValueData?.costReductionValue || null,
          costReductionRemarks: contractValueData?.costReductionRemarks || '',
          operatingEfficiencyValue: contractValueData?.operatingEfficiencyValue || null,
          operatingEfficiencyPercent: contractValueData?.operatingEfficiencyPercent || null,
          operatingEfficiencyRemarks: contractValueData?.operatingEfficiencyRemarks || '',
          costAvoidanceValue: contractValueData?.costAvoidanceValue || null,
          costAvoidancePercent: contractValueData?.costAvoidancePercent || null,
          costAvoidanceRemarks: contractValueData?.costAvoidanceRemarks || '',
        },
        costAllocation: patchValues.costAllocation,
      }, { emitEvent: true });

      // Set PSA/JV values with delay to ensure proper initialization
      setTimeout(() => {
        this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers, { emitEvent: false });
        this.generalInfoForm.get('generalInfo.psajv')?.setValue(allSelectedValuesPSAJV, { emitEvent: false });

        // Ensure form controls are created for all selected PSAs (in case they weren't created earlier)
        allSelectedValuesPSAJV.forEach((psaName: string) => {
          this.addPSAJVFormControls(psaName);
        });

        // Re-patch costAllocation values to ensure they're set after controls exist
        this.generalInfoForm.patchValue({
          costAllocation: patchValues.costAllocation
        }, { emitEvent: false });

        // Auto-calculate revised contract value after populating (especially important for Variation Papers)
        this.calculateRevisedContractValue();

        // Calculate totals after populating cost allocation values (with a small delay to ensure all controls are ready)
        setTimeout(() => {
          this.calculateTotalCostAllocation();
        }, 100);
      }, 500);

      // Setup PSA listeners after patching values
      this.setupPSAListeners();
      this.setupValueDeliveryRemarksValidation();
      
      // Populate consultation rows from contract paper
      if (contractConsultationsData && contractConsultationsData.length > 0) {
        // Use isFirst=true to properly populate all consultation rows from contract paper
        this.addConsultationRow(true, false, contractConsultationsData);
      }
      },
      error: (error) => {
        console.error('Error fetching contract paper details:', error);
        this.toastService.show('Failed to load contract paper details. Please try again.', 'danger');
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

  onApprovalChange() {
    this.generalInfoForm.get('contractInfo.isRetrospectiveApproval')?.valueChanges.subscribe((value) => {
      const ltccNotesControl = this.generalInfoForm.get('contractInfo.retrospectiveApprovalReason');

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

  loadVendoreDetails() {

    this.vendorService.getVendorDetailsList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          this.vendorList = reponse.data.filter(vendor => vendor.isActive);
          this.vendorOptions = this.vendorList
            .filter(vendor => vendor.legalName)
            .map(vendor => ({ value: vendor.id.toString(), label: vendor.legalName! }))
            .sort((a, b) => a.label.localeCompare(b.label));

          // If form exists and fullLegalName is set, ensure it's properly formatted
          if (this.generalInfoForm && this.generalInfoForm.get('generalInfo.fullLegalName')) {
            const currentFullLegalName = this.generalInfoForm.get('generalInfo.fullLegalName')?.value;
            if (currentFullLegalName) {
              // Ensure the value is a string to match vendorOptions format
              this.generalInfoForm.get('generalInfo.fullLegalName')?.setValue(currentFullLegalName.toString(), { emitEvent: false });
            }
          }
          this.incrementAndCheck();
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  getVendorOptions() {
    return this.vendorList.map(vendor => ({
      value: vendor.id,
      label: vendor.legalName
    }));
  }

  onVendorSelectionChange() {
    // Reset approval date when vendor changes
    this.generalInfoForm.get('generalInfo.cgbApprovalDate')?.setValue(null);
  }

  getVendorLegalName(vendorId: number | null): string {
    if (!vendorId) return '';
    const vendor = this.vendorList.find(v => v.id === vendorId);
    return vendor?.legalName || '';
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
          this.userDetails = dataList
          this.procurementTagUsers = dataList.filter(user => user.roleName === 'Procurement Tag').map(t => ({
            label: t.displayName,
            value: t.id
          }));
          this.camOptions = this.userDetails
            .filter(user => user.roleName === 'CAM')
            .map(user => ({ value: user.id.toString(), label: user.displayName }))
            .sort((a, b) => a.label.localeCompare(b.label));

          // If form exists and camUserId is set, ensure it's properly formatted
          if (this.generalInfoForm && this.generalInfoForm.get('generalInfo.camUserId')) {
            const currentCamUserId = this.generalInfoForm.get('generalInfo.camUserId')?.value;
            if (currentCamUserId) {
              // Ensure the value is a string to match camOptions format
              this.generalInfoForm.get('generalInfo.camUserId')?.setValue(currentCamUserId.toString(), { emitEvent: false });
            }
          }
          this.incrementAndCheck();
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  fetchApprovedPapersForMapping() {
    this.paperService.getApprovedPapersForMapping().subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          if (response.data && response.data.length > 0) {
            // Filter for Final Approved AtM/Award/Variations
            const filteredPapers = response.data.filter((item: any) => {
              // Exclude current paper if editing
              if (this.paperId && item.paperID?.toString() === this.paperId) {
                return false;
              }

              // Exclude Draft and Withdrawn status
              if (item.paperStatusName === "Draft" || item.paperStatusName === "Withdrawn") {
                return false;
              }

              // Only show Final Approved papers (status = "Approved")
              const statusLower = item.paperStatusName?.toLowerCase() || '';
              if (statusLower !== 'approved' && statusLower !== 'approved by partner') {
                return false;
              }

              // Include all paper types: Approach to Market, Contract Award, and Variation Paper
              const paperType = item.paperType || '';
              return paperType === "Approach to Market" || 
                     paperType === "Contract Award" || 
                     paperType === "Variation Paper";
            });

            this.paperMappingData = filteredPapers;

            // Create formatted options for Select2 - format: "Ref#, Paper Type, Title (first 50 chars), Date"
            this.previousCGBRefOptions = this.paperMappingData.map((item: any) => {
              const refNo = item.paperID?.toString() || '';
              const paperType = item.paperType || '';
              const title = item.paperSubject ? (item.paperSubject.length > 50 ? item.paperSubject.substring(0, 50) + '...' : item.paperSubject) : '';
              const date = item.entryDate ? new Date(item.entryDate).toLocaleDateString() : '';

              // Format label to include Ref#, Paper Type, Title, Date for dropdown display
              const label = `${refNo}, ${paperType}, ${title}, ${date}`;

              return {
                value: refNo,
                label: label
              };
            });
          } else {
            this.previousCGBRefOptions = [];
          }
          this.incrementAndCheck();
        }
      }, error: (error: any) => {
        console.log('error', error);
        this.previousCGBRefOptions = [];
      }
    })
  }

  onPreviousCGBRefSelected(event: any) {
    const selectedPaperId = event;
    if (selectedPaperId) {
      // Update CGB Approval Date when selection changes
      const paperIdNumber = Number(selectedPaperId);
      if (paperIdNumber) {
        this.updateCgbApprovalDate(paperIdNumber);
      }
    } else {
      // Clear CGB Approval Date if selection is cleared
      this.generalInfoForm.get('generalInfo.cgbApprovalDate')?.setValue(null);
    }
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
      next: (response: any) => {
        if (response.status && response.data) {
          this.batchPaperList = response.data;
        }
      },
      error: (error: any) => {
        console.log('error', error);
      },
    });
  }

  onBatchPaperSelectionChange(event: Event) {
    const selectedBatchId = this.generalInfoForm.get('generalInfo.batchPaper')?.value;

    if (selectedBatchId !== null && selectedBatchId !== undefined) {
      const selectedBatch = this.batchPaperList.find(batch => batch.id === selectedBatchId);
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
      next: (response: any) => {
        if (response.status) {
          this.toastService.show('Paper added to batch successfully', 'success');
        }
      },
      error: (error: any) => {
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
      next: (response: any) => {
        if (response.status) {
          this.toastService.show('Paper removed from batch successfully', 'success');
        }
      },
      error: (error: any) => {
        console.log('Error removing paper from batch:', error);
        this.toastService.show('Failed to remove paper from batch', 'danger');
      }
    });
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
            case 'Currencies':
              this.currenciesData = (response.data || []).filter(item => item.isActive);
              // Set default currency to USD if creating new paper
              if (!this.paperId && this.currenciesData.length > 0) {
                const usdCurrency = this.currenciesData.find(item => 
                  item.itemValue?.toUpperCase() === 'USD' || 
                  item.itemValue?.toUpperCase().includes('USD') ||
                  item.itemValue?.toUpperCase().includes('US DOLLAR')
                );
                if (usdCurrency) {
                  const currentCurrency = this.generalInfoForm.get('contractValues.currencyCode')?.value;
                  const currentExchangeRate = this.generalInfoForm.get('contractValues.exchangeRate')?.value;
                  // Only set defaults if not already set
                  if (!currentCurrency || currentCurrency === '') {
                    this.generalInfoForm.get('contractValues.currencyCode')?.setValue(usdCurrency.id.toString());
                  }
                  if (!currentExchangeRate || currentExchangeRate === 0) {
                    this.generalInfoForm.get('contractValues.exchangeRate')?.setValue(1.00);
                  }
                }
              }
              break;

            case 'Global CGB':
              this.globalCGBData = (response.data || []).filter(item => item.isActive);
              break;

            case 'Operating Functions':
              this.operatingFunctionsData = (response.data || []).filter(item => item.isActive);
              break;

            case 'Proposed CML':
              this.proposedCMLData = (response.data || []).filter(item => item.isActive);
              break;

            case 'PSA':
              this.psaData = (response.data || []).filter(item => item.isActive);
              // Populate psaJvOptions dynamically from PSA data
              this.psaJvOptions = this.psaData.map(item => ({
                value: item.itemValue,
                label: item.itemValue
              }));
              // Populate psaItems dynamically for Template 3
              this.psaItems = this.psaData.map(item => {
                const cleanName = item.itemValue.replace(/[^a-zA-Z0-9]/g, '');
                return {
                  psaName: item.itemValue,
                  control: `is${cleanName}`,
                  percentage: `percentage_is${cleanName}`,
                  value: `value_is${cleanName}`
                };
              });
              // Initialize costAllocation form controls for ALL PSAs (like template1)
              // This ensures controls exist before HTML tries to bind to them
              if (this.generalInfoForm) {
                this.initializeAllPSAControls();
              }
              break;

            case 'Remuneration Type':
              this.remunerationTypeData = (response.data || []).filter(item => item.isActive);
              break;

            case 'Sourcing Rigor':
              this.sourcingRigorData = (response.data || []).filter(item => item.isActive);
              break;

            case 'Sourcing Type':
              this.sourcingTypeData = (response.data || []).filter(item => item.isActive);
              break;

            case 'Subsector':
              this.subsectorData = (response.data || []).filter(item => item.isActive);
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

  onLTCCChange() {
    this.generalInfoForm.get('generalInfo.isLTCC')?.valueChanges.subscribe((value) => {
      const ltccNotesControl = this.generalInfoForm.get('generalInfo.ltccNotes');

      if (value === true) {
        ltccNotesControl?.setValidators([Validators.required]);
        ltccNotesControl?.enable();
        this.isShowBoxSection = true
      } else {
        ltccNotesControl?.clearValidators();
        ltccNotesControl?.disable(); // <- disables the field
        this.isShowBoxSection = false
      }

      ltccNotesControl?.updateValueAndValidity();
    });
  }

  onCurrencyLinktoBaseCostChange() {
    this.generalInfoForm.get('contractValues.isCurrencyLinktoBaseCost')?.valueChanges.subscribe((value) => {
      const ltccNotesControl = this.generalInfoForm.get('contractValues.noCurrencyLinkNotes');

      if (value === false) {
        ltccNotesControl?.setValidators([Validators.required]);
        ltccNotesControl?.enable();
      } else {
        ltccNotesControl?.clearValidators();
        ltccNotesControl?.disable(); // <- disables the field
      }

      ltccNotesControl?.updateValueAndValidity();
    });
  }

  onConflictofInterestChange() {
    // Handle contractValues.isConflictOfInterest (for contract values section)
    this.generalInfoForm.get('contractValues.isConflictOfInterest')?.valueChanges.subscribe((value) => {
      const conflictCommentControl = this.generalInfoForm.get('contractValues.conflictOfInterestComment');

      if (value === true) {
        conflictCommentControl?.setValidators([Validators.required]);
        conflictCommentControl?.enable();
      } else {
        conflictCommentControl?.clearValidators();
        conflictCommentControl?.disable();
        conflictCommentControl?.setValue(''); // Clear value when disabled
      }

      conflictCommentControl?.updateValueAndValidity();
    });

    // Handle contractInfo.isConflictOfInterest (for Section 3 - Contract Information)
    this.generalInfoForm.get('contractInfo.isConflictOfInterest')?.valueChanges.subscribe((value) => {
      const conflictCommentControl = this.generalInfoForm.get('contractInfo.conflictOfInterestComment');

      if (value === true) {
        conflictCommentControl?.setValidators([Validators.required]);
        conflictCommentControl?.enable();
      } else {
        conflictCommentControl?.clearValidators();
        conflictCommentControl?.disable();
        conflictCommentControl?.setValue(''); // Clear value when disabled
      }

      conflictCommentControl?.updateValueAndValidity();
    });
  }


  handleStatusChange(status: string): void {
    // For "Waiting for PDM", always call the API to update status
    if (status === 'Waiting for PDM') {
      this.setPaperStatus(status, true);
    } else {
      // For other statuses, don't call API (form submission will handle it)
      this.setPaperStatus(status, false);
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

  fetchPaperDetails(paperId: number) {
    // isLoadingDetails is already set to true when paperId is detected
    this.getUploadedDocs(paperId); // Load attachments
    this.paperService.getPaperDetails(paperId, 'variation').subscribe({
      next: (value) => {
        this.paperDetails = value.data as any;
      // Store consultations data in paperDetails for addConsultationRow to access
      const consultationsData = value.data?.consultationsDetails || [];
      this.paperDetails.consultationsDetails = consultationsData;
      console.log("==this.paperDetails", this.paperDetails)
      const generatlInfoData = this.paperDetails?.paperDetails || null
      const jvApprovalsData = value.data?.jvApprovals[0] || null
      const costAllocationsData = value.data?.costAllocations || []
      const costAllocationJVApprovalData = value.data?.costAllocationJVApproval || [] // Get costAllocation data like template1
      const valueDeliveriesCostSharingData = value.data?.valueDeliveriesCostSharing[0] || null

      const selectedPaperStatus = this.paperStatusList.find((item) => item.id.toString() === generatlInfoData?.paperStatusId?.toString())

      if (selectedPaperStatus?.paperStatus !== "Draft") {
        this.isRegisterPaper = true
        this.commentService.loadPaper(paperId);
      }

      console.log('costAllocationJVApprovalData:', costAllocationJVApprovalData);
      console.log('costAllocationsData:', costAllocationsData);
      console.log('psaJvOptions:', this.psaJvOptions);
      console.log('generatlInfoData?.psajv:', generatlInfoData?.psajv);

      // Start with PSAs from paperDetailData (like template1)
      const selectedValuesPSAJV = generatlInfoData?.psajv ? generatlInfoData.psajv
        .split(',')
        .map((label: any) => label.trim())
        .map((label: any) => {
          const found = this.psaJvOptions.find((option) => option.label === label);
          return found?.value;
        }) // Convert label to value
        .filter((value: any) => value) : []

      // Also include PSAs from costAllocationJVApproval that have values (like template1)
      const psasFromCostAllocation = costAllocationJVApprovalData
        .filter((psa: any) => psa.psaValue === true)
        .map((psa: any) => {
          // Find the PSA value from psaJvOptions by matching the psaName (case-insensitive)
          const psaOption = this.psaJvOptions.find(option =>
            option.label?.toLowerCase() === psa.psaName?.toLowerCase() ||
            option.value?.toLowerCase() === psa.psaName?.toLowerCase()
          );
          return psaOption?.value;
        })
        .filter((value: any) => value);

      // Also extract PSAs from costAllocations array (template3 specific structure)
      // costAllocations has structure: [{ psaName, paperType, psaValue, percentage, value }]
      const psasFromCostAllocations = costAllocationsData
        .filter((item: any) => item.psaValue === true)
        .map((item: any) => {
          const psaOption = this.psaJvOptions.find(option =>
            option.label?.toLowerCase() === item.psaName?.toLowerCase() ||
            option.value?.toLowerCase() === item.psaName?.toLowerCase()
          );
          return psaOption?.value;
        })
        .filter((value: any) => value);

      // Merge and deduplicate (like template1) - include all sources
      const allSelectedValuesPSAJV = [...new Set([...selectedValuesPSAJV, ...psasFromCostAllocation, ...psasFromCostAllocations])];

      console.log('selectedValuesPSAJV:', selectedValuesPSAJV);
      console.log('psasFromCostAllocation:', psasFromCostAllocation);
      console.log('psasFromCostAllocations:', psasFromCostAllocations);
      console.log('allSelectedValuesPSAJV:', allSelectedValuesPSAJV);


      const selectedValuesProcurementTagUsers = generatlInfoData?.procurementSPAUsers ? generatlInfoData.procurementSPAUsers
        .split(',')
        .map((id: any) => id.trim())
        .map((id: any) => this.procurementTagUsers.find((option: any) => option.value === Number(id))?.value) // Convert label to value
        .filter((value: any) => value) : [];

      if (value.data) {
        this.generalInfoForm.patchValue({
          generalInfo: {
            paperProvision: generatlInfoData.paperProvision || "",
            purposeRequired: generatlInfoData.purposeRequired || "",
            otherRelatedCgbPapers: generatlInfoData?.otherRelatedCgbPapers || '',
            isChangeinSOW: generatlInfoData.isChangeinSOW || false,
            isIncreaseInValue: generatlInfoData.isIncreaseInValue || false,
            isExtensionOfDuration: generatlInfoData.isExtensionOfDuration || false,
            isTEToCompleteBidding: generatlInfoData.isTEToCompleteBidding || false,
            isChangeInRates: generatlInfoData.isChangeInRates || false,
            batchPaper: value.data?.batchPaperId || null,
            cgbItemRefNo: generatlInfoData.cgbItemRefNo || '',
            cgbCirculationDate: generatlInfoData.cgbCirculationDate
              ? format(new Date(generatlInfoData.cgbCirculationDate), 'yyyy-MM-dd')
              : null,
            cgbAwardRefNo: generatlInfoData.cgbAwardRefNo || '',
            cgbApprovalDate: generatlInfoData.cgbApprovalDate
              ? format(new Date(generatlInfoData.cgbApprovalDate), 'yyyy-MM-dd')
              : null,
            fullLegalName: generatlInfoData.fullLegalName ? generatlInfoData.fullLegalName.toString() : null,
            contractNo: generatlInfoData.contractNo || '',
            globalCGB: generatlInfoData.globalCGB || null,
            camUserId: generatlInfoData.camUserId ? generatlInfoData.camUserId.toString() : null,
            vP1UserId: generatlInfoData.vP1UserId || null,
            procurementSPAUsers: selectedValuesProcurementTagUsers,
            pdManagerName: generatlInfoData?.pdManagerNameId || null,
            operatingFunction: generatlInfoData?.operatingFunction || '',
            bltMember: generatlInfoData?.bltMemberId || null,
            subSector: generatlInfoData?.subSector || '',
            sourcingType: generatlInfoData?.sourcingType || '',
            contractStartDate: generatlInfoData.contractStartDate
              ? format(new Date(generatlInfoData.contractStartDate), 'yyyy-MM-dd')
              : '',
            contractEndDate: generatlInfoData.contractEndDate
              ? format(new Date(generatlInfoData.contractEndDate), 'yyyy-MM-dd')
              : '',
            variationStartDate: generatlInfoData.variationStartDate
              ? format(new Date(generatlInfoData.variationStartDate), 'yyyy-MM-dd')
              : '',
            variationEndDate: generatlInfoData.variationEndDate
              ? format(new Date(generatlInfoData.variationEndDate), 'yyyy-MM-dd')
              : '',
            psajv: selectedValuesPSAJV,
            isLTCC: generatlInfoData?.isLTCC || false,
            ltccNotes: generatlInfoData?.ltccNotes || '',
            isGovtReprAligned: generatlInfoData?.isGovtReprAligned || false,
            govtReprAlignedComment: generatlInfoData?.govtReprAlignedComment || '',
            isIFRS16: generatlInfoData?.isIFRS16 || false,
            isGIAAPCheck: generatlInfoData?.isGIAAPCheck || false,
          },
          justificationSection: {
            whyChangeRequired: generatlInfoData?.whyChangeRequired || '',
            longTermStrategy: generatlInfoData?.longTermStrategy || '',
          },
          contractInfo: {
            isPHCA: generatlInfoData?.isPHCA || false,
            workspaceNo: generatlInfoData?.workspaceNo || '',
            remunerationType: generatlInfoData?.remunerationType || '',
            previousCGBRefNo: generatlInfoData?.previousCGBRefNo || '',
            isPaymentRequired: generatlInfoData?.isPaymentRequired || false,
            prePayAmount: generatlInfoData?.prePayAmount || 0,
            isRetrospectiveApproval: generatlInfoData?.isRetrospectiveApproval || false,
            retrospectiveApprovalReason: generatlInfoData?.retrospectiveApprovalReason || '',
            isConflictOfInterest: generatlInfoData?.isConflictOfInterest || false,
            conflictOfInterestComment: generatlInfoData?.conflictOfInterestComment || '',
          },
          contractValues: {
            originalContractValue: generatlInfoData?.originalContractValue || 0,
            previousVariationTotal: generatlInfoData?.previousVariationTotal || 0,
            thisVariationNote: generatlInfoData?.thisVariationNote || '',
            exchangeRate: generatlInfoData?.exchangeRate || 0,
            currencyCode: generatlInfoData?.currencyCode || '',
            contractValue: generatlInfoData?.contractValue || 0,
            revisedContractValue: generatlInfoData?.revisedContractValue || 0,
            spendOnContract: generatlInfoData?.spendOnContract || 0,
            isCurrencyLinktoBaseCost: generatlInfoData?.isCurrencyLinktoBaseCost || false,
            noCurrencyLinkNotes: generatlInfoData?.noCurrencyLinkNotes || '',
            isConflictOfInterest: generatlInfoData?.isConflictOfInterest || false,
            conflictOfInterestComment: generatlInfoData?.conflictOfInterestComment || '',
          },
          ccd: {
            isHighRiskContract: generatlInfoData?.isHighRiskContract || false,
            daCDDCompleted: generatlInfoData.daCDDCompleted
              ? format(new Date(generatlInfoData.daCDDCompleted), 'yyyy-MM-dd')
              : '',
            highRiskExplanation: generatlInfoData?.highRiskExplanation || '',
            flagRaisedCDD: generatlInfoData?.highRiskExplanation || '',
            additionalCDD: generatlInfoData?.highRiskExplanation || '',
          },
          valueDelivery: {
            costReductionPercent: valueDeliveriesCostSharingData?.costReductionPercent || null,
            costReductionValue: valueDeliveriesCostSharingData?.costReductionValue || null,
            costReductionRemarks: valueDeliveriesCostSharingData?.costReductionRemarks || '',
            operatingEfficiencyValue: valueDeliveriesCostSharingData?.operatingEfficiencyValue || null,
            operatingEfficiencyPercent: valueDeliveriesCostSharingData?.operatingEfficiencyPercent || null,
            operatingEfficiencyRemarks: valueDeliveriesCostSharingData?.operatingEfficiencyRemarks || '',
            costAvoidanceValue: valueDeliveriesCostSharingData?.costAvoidanceValue || null,
            costAvoidancePercent: valueDeliveriesCostSharingData?.costAvoidancePercent || null,
            costAvoidanceRemarks: valueDeliveriesCostSharingData?.costAvoidanceRemarks || '',
          },
          costAllocation: (() => {
            const costAllocationPatch: any = {
              contractCommittee_SDCC: jvApprovalsData?.contractCommittee_SDCC || false,
              contractCommittee_SCP_Co_CC: jvApprovalsData?.contractCommittee_SCP_Co_CC || false,
              contractCommittee_SCP_Co_CCInfoNote: jvApprovalsData?.contractCommittee_SCP_Co_CCInfoNote || false,
              contractCommittee_BTC_CC: jvApprovalsData?.contractCommittee_BTC_CC || false,
              contractCommittee_BTC_CCInfoNote: jvApprovalsData?.contractCommittee_BTC_CCInfoNote || false,
              contractCommittee_CGB: jvApprovalsData?.contractCommittee_CGB || false,
              coVenturers_CMC: jvApprovalsData?.coVenturers_CMC || false,
              coVenturers_SDMC: jvApprovalsData?.coVenturers_SDMC || false,
              coVenturers_SCP: jvApprovalsData?.coVenturers_SCP || false,
              coVenturers_SCP_Board: jvApprovalsData?.coVenturers_SCP_Board || false,
              steeringCommittee_SC: jvApprovalsData?.steeringCommittee_SC || false,
            };

            // Patch PSA percentage and value fields from costAllocationJVApproval (like template1)
            costAllocationJVApprovalData.forEach((psa: any) => {
              const checkboxKey = this.getPSACheckboxControlName(psa.psaName);
              const percentageKey = this.getPSAPercentageControlName(psa.psaName);
              const valueKey = this.getPSAValueControlName(psa.psaName);

              if (checkboxKey && psa.psaValue === true) {
                costAllocationPatch[checkboxKey] = true;
                costAllocationPatch[percentageKey] = psa.percentage || '';
                costAllocationPatch[valueKey] = psa.value || null;
              }
            });

            return costAllocationPatch;
          })()
        })
        // IMPORTANT: Create form controls BEFORE patching values, otherwise values will be lost (like template1)
        allSelectedValuesPSAJV
          .filter((psaName: string | undefined): psaName is string => !!psaName)
          .forEach((psaName: string) => {
            this.addPSAJVFormControls(psaName);
          });

        setTimeout(() => {
          this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers, { emitEvent: false });
          this.generalInfoForm.get('generalInfo.psajv')?.setValue(allSelectedValuesPSAJV, { emitEvent: false });

          // Ensure form controls are created for all selected PSAs (in case they weren't created earlier)
          allSelectedValuesPSAJV
            .filter((psaName: string | undefined): psaName is string => !!psaName)
            .forEach((psaName: string) => {
              this.addPSAJVFormControls(psaName);
            });

          // Re-patch costAllocation values to ensure they're set after controls exist (like template1)
          const costAllocationPatch: any = {
            contractCommittee_SDCC: jvApprovalsData?.contractCommittee_SDCC || false,
            contractCommittee_SCP_Co_CC: jvApprovalsData?.contractCommittee_SCP_Co_CC || false,
            contractCommittee_SCP_Co_CCInfoNote: jvApprovalsData?.contractCommittee_SCP_Co_CCInfoNote || false,
            contractCommittee_BTC_CC: jvApprovalsData?.contractCommittee_BTC_CC || false,
            contractCommittee_BTC_CCInfoNote: jvApprovalsData?.contractCommittee_BTC_CCInfoNote || false,
            contractCommittee_CGB: jvApprovalsData?.contractCommittee_CGB || false,
            coVenturers_CMC: jvApprovalsData?.coVenturers_CMC || false,
            coVenturers_SDMC: jvApprovalsData?.coVenturers_SDMC || false,
            coVenturers_SCP: jvApprovalsData?.coVenturers_SCP || false,
            coVenturers_SCP_Board: jvApprovalsData?.coVenturers_SCP_Board || false,
            steeringCommittee_SC: jvApprovalsData?.steeringCommittee_SC || false,
          };

          // Patch PSA percentage and value fields from costAllocationJVApproval
          costAllocationJVApprovalData.forEach((psa: any) => {
            const checkboxKey = this.getPSACheckboxControlName(psa.psaName);
            const percentageKey = this.getPSAPercentageControlName(psa.psaName);
            const valueKey = this.getPSAValueControlName(psa.psaName);

            if (checkboxKey) {
              // Handle different types for psaValue (boolean, string, number)
              const psaValueBool = typeof psa.psaValue === 'boolean' ? psa.psaValue :
                typeof psa.psaValue === 'string' ? psa.psaValue === 'true' :
                  typeof psa.psaValue === 'number' ? psa.psaValue === 1 :
                    Boolean(psa.psaValue);

              if (psaValueBool) {
                costAllocationPatch[checkboxKey] = true;
                costAllocationPatch[percentageKey] = psa.percentage || '';
                costAllocationPatch[valueKey] = psa.value || null;
              }
            }
          });

          // Also patch from costAllocations array (template3 specific)
          // costAllocations structure: [{ id, psaName, psaValue, percentage, value }]
          // If costAllocationJVApprovalData is empty, use costAllocationsData instead
          if (costAllocationJVApprovalData.length === 0 && costAllocationsData.length > 0) {
            // Use costAllocationsData as primary source if costAllocationJVApprovalData is empty
            costAllocationsData.forEach((item: any) => {
              const checkboxKey = this.getPSACheckboxControlName(item.psaName);
              const percentageKey = this.getPSAPercentageControlName(item.psaName);
              const valueKey = this.getPSAValueControlName(item.psaName);

              if (checkboxKey && item.psaValue === true) {
                costAllocationPatch[checkboxKey] = true;
                costAllocationPatch[percentageKey] = item.percentage || null;
                costAllocationPatch[valueKey] = item.value || null;
              }
            });
          } else {
            // If costAllocationJVApprovalData exists, only patch costAllocations that aren't already set
            const thisValueCostAllocations = costAllocationsData.filter((item: any) => {
              // Filter by psaValue === true, and optionally check paperType if it exists
              return item.psaValue === true && (!item.paperType || item.paperType === 'This Value');
            });

            thisValueCostAllocations.forEach((item: any) => {
              const checkboxKey = this.getPSACheckboxControlName(item.psaName);
              const percentageKey = this.getPSAPercentageControlName(item.psaName);
              const valueKey = this.getPSAValueControlName(item.psaName);

              if (checkboxKey && !costAllocationPatch[checkboxKey]) {
                // Only set if not already set from costAllocationJVApproval
                costAllocationPatch[checkboxKey] = true;
                costAllocationPatch[percentageKey] = item.percentage || null;
                costAllocationPatch[valueKey] = item.value || null;
              }
            });
          }

          // Ensure percentage controls are enabled before patching
          allSelectedValuesPSAJV
            .filter((psaName: string | undefined): psaName is string => !!psaName)
            .forEach((psaName: string) => {
              const percentageControlName = this.getPSAPercentageControlName(psaName);
              const percentageControl = this.generalInfoForm.get(`costAllocation.${percentageControlName}`);
              // Don't enable if user is JV Admin
              const isJVAdmin = this.loggedInUser?.roleName === 'JV Admin';
              if (percentageControl && percentageControl.disabled && !isJVAdmin) {
                percentageControl.enable({ emitEvent: false });
              }
            });

          this.generalInfoForm.patchValue({
            costAllocation: costAllocationPatch
          }, { emitEvent: false });

          // Enable conflictOfInterestComment field if isConflictOfInterest is true (for Section 3 - Contract Information)
          const contractInfoConflictValue = this.generalInfoForm.get('contractInfo.isConflictOfInterest')?.value;
          if (contractInfoConflictValue === true) {
            const conflictCommentControl = this.generalInfoForm.get('contractInfo.conflictOfInterestComment');
            conflictCommentControl?.setValidators([Validators.required]);
            conflictCommentControl?.enable();
            conflictCommentControl?.updateValueAndValidity();
          }

          // Enable conflictOfInterestComment field if isConflictOfInterest is true (for contractValues section)
          const contractValuesConflictValue = this.generalInfoForm.get('contractValues.isConflictOfInterest')?.value;
          if (contractValuesConflictValue === true) {
            const conflictCommentControl = this.generalInfoForm.get('contractValues.conflictOfInterestComment');
            conflictCommentControl?.setValidators([Validators.required]);
            conflictCommentControl?.enable();
            conflictCommentControl?.updateValueAndValidity();
          }

          this.isInitialLoad = false;

          // Call setupPSACalculationsManually to calculate initial values (like template1)
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.setupPSACalculationsManually();
          }, 0);
        }, 500)

        this.addConsultationRow(true, false, consultationsData);
        this.patchPsaData(costAllocationsData);
        
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

        // Update all JV Aligned states after all initialization is complete
        // This ensures JV Aligned checkboxes are properly enabled/disabled based on user permissions
        setTimeout(() => {
          this.updateAllJVAlignedStates();
        }, 1500);

        // Setup PSA listeners and calculations after data is loaded (like template1)
        setTimeout(() => {
          // Ensure percentage controls are enabled for all selected PSAs and checkboxes are true
          allSelectedValuesPSAJV
            .filter((psaName: string | undefined): psaName is string => !!psaName)
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

          // Setup listeners for PSA calculations (critical for percentage input changes)
          this.setupPSAListeners();
          this.setupPSACalculations();
          this.setupValueDeliveryRemarksValidation();
        }, 600); // Slightly after the re-patch setTimeout to ensure controls exist

        // Set consultation section visibility if there are rows (like template1 would)
        if (consultationsData && consultationsData.length > 0) {
          setTimeout(() => {
            this.sectionVisibility['section8'] = true;
          }, 100);
        }


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

  patchPsaData(psaData: any[]) {
    psaData.forEach(entry => {
      const groupKey = this.getGroupKeyFromLabel(entry.paperType);
      const group = this.generalInfoForm.get(groupKey) as FormGroup;
      if (!group) return;

      const psaConfig = this.psaItems.find(p => p.psaName === entry.psaName);
      if (!psaConfig) return;

      group.patchValue({
        [psaConfig.control]: entry.psaValue,
        [psaConfig.percentage]: entry.percentage,
        [psaConfig.value]: entry.value ?? 0
      });
    });
  }


  getGroupKeyFromLabel(label: string): string {
    switch (label) {
      case 'Original Value':
        return 'originalValue';
      case 'Previous Value':
        return 'previousValue';
      case 'This Value':
        return 'thisValue';
      case 'Revised Value':
        return 'revisedValue';
      default:
        return '';
    }
  }

  /**
   * Evaluate thresholds for Template 3 (Variation)
   * Each committee checkbox has its own calculation rule
   */
  evaluateThreshold(psaName: string, checkboxType: string, values: { thisValue: number, revisedValue: number, byValue?: number }, vendorId?: number): boolean {
    const sourcingTypeId = Number(this.generalInfoForm.get('generalInfo.sourcingType')?.value) || 0;
    const psaAgreementId = this.getPSAAgreementId(psaName);
    const paperType = 'Variation Paper'; // For Template 3

    // Early return if essential data is missing
    if (!psaAgreementId || psaAgreementId === 0) {
      console.log(`Invalid PSA Agreement ID for ${psaName}`);
      return false;
    }

    // Early return if sourcing type is not selected
    if (!sourcingTypeId || sourcingTypeId === 0) {
      console.log(`Sourcing type not selected for ${psaName} - ${checkboxType}`);
      return false;
    }

    // Filter relevant thresholds based on global conditions (PSA Agreement and Threshold Type only)
    const relevantThresholds = this.thresholdData.filter(t => {
      if (!t.isActive) return false;
      if (t.thresholdType !== 'Partner') return false;
      if (t.psaAgreement != psaAgreementId) return false;

      return true;
    });

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

    // If no thresholds match the sourcing type, don't check the checkbox
    if (sourcingTypeFilteredThresholds.length === 0) {
      console.log(`No thresholds match sourcing type ${sourcingTypeId} for PSA: ${psaName}, checkbox: ${checkboxType}`);
      return false;
    }

    // Check specific Paper Type + Sourcing Type + Committee combinations and get the selected threshold
    // IMPORTANT: Use sourcingTypeFilteredThresholds, not relevantThresholds
    const selectedThreshold = this.checkCommitteeConditions(paperType, sourcingTypeId, checkboxType, sourcingTypeFilteredThresholds);

    if (!selectedThreshold) {
      console.log(`Committee conditions not met for ${psaName} - ${checkboxType}`);
      return false;
    }



    // Validate that threshold limit exists and is a valid number
    if (!selectedThreshold.contractValueLimit || isNaN(selectedThreshold.contractValueLimit)) {
      console.log(`Invalid threshold limit for ${psaName} - ${checkboxType}:`, selectedThreshold.contractValueLimit);
      return false;
    }

    let exceedsThreshold = false;

    // Template 3 (Variation): Different rules for different checkboxes
    switch (checkboxType) {
      case 'coVenturers_CMC': // CMC
        // Only check if thisValue is valid and exceeds threshold
        if (values.thisValue && !isNaN(values.thisValue) && values.thisValue > 0) {
          exceedsThreshold = values.thisValue > selectedThreshold.contractValueLimit;
        }
        break;

      case 'steeringCommittee_SC': // SC
        // Only check if revisedValue is valid and exceeds threshold
        if (values.revisedValue && !isNaN(values.revisedValue) && values.revisedValue > 0) {
          exceedsThreshold = values.revisedValue > selectedThreshold.contractValueLimit;
        }
        break;

      case 'contractCommittee_SDCC': // SDCC
        // Only check if thisValue is valid and exceeds threshold
        if (values.thisValue && !isNaN(values.thisValue) && values.thisValue > 0) {
          exceedsThreshold = values.thisValue > selectedThreshold.contractValueLimit;
        }
        break;

      case 'contractCommittee_SCP_Co_CC': // SCP CC - Hardcoded 10% ratio rule
        // Only check if both values are valid
        if (values.revisedValue && values.thisValue &&
            !isNaN(values.revisedValue) && !isNaN(values.thisValue) &&
            values.revisedValue > values.thisValue) {
          const denominator = values.revisedValue - values.thisValue;
          const ratio = values.thisValue / denominator;
          exceedsThreshold = ratio >= 0.10; // 10% threshold
        }
        break;

      case 'coVenturers_SCP': // SCP Board - Vendor override + ByValue logic
        // Check vendor override first
        if (vendorId) {
          const vendor = this.vendorList.find(v => v.id === vendorId);
          if (vendor?.isCGBRegistered) {
            exceedsThreshold = true;
            console.log(`SCP Board auto-checked due to vendor isCGBRegistered for PSA: ${psaName}`);
            break;
          }
        }
        // Otherwise use ByValue logic - only if byValue is valid
        if (values.byValue && !isNaN(values.byValue) && values.byValue > 0) {
          exceedsThreshold = values.byValue > selectedThreshold.contractValueLimit;
        }
        break;

      default: // All other checkboxes use ByValue logic
        // Only check if byValue is valid and exceeds threshold
        if (values.byValue && !isNaN(values.byValue) && values.byValue > 0) {
          exceedsThreshold = values.byValue > selectedThreshold.contractValueLimit;
        }
        break;
    }

    console.log(`Threshold evaluation for ${psaName} - ${checkboxType}:`, {
      thisValue: values.thisValue,
      revisedValue: values.revisedValue,
      byValue: values.byValue,
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

    console.log('=====', paperTypeFilteredThresholds);

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

    // For variation, we need thisValue and revisedValue from contractValues (not from form groups)
    const thisValue = Number(this.generalInfoForm.get('contractValues.thisVariationNote')?.value) || 0;
    const revisedValue = Number(this.generalInfoForm.get('contractValues.revisedContractValue')?.value) || 0;
    const byValue = valueControl?.value || 0;
    const vendorId = Number(this.generalInfoForm.get('generalInfo.fullLegalName')?.value) || undefined;

    if (isChecked) {
      // Handle committee checkboxes based on PSA name
      if (this.hasFirstCommitteeCheckbox(psaName)) {
        const firstCommitteeControlName = this.getFirstCommitteeControlName(psaName);
        const firstCommitteeControl = this.generalInfoForm.get(`costAllocation.${firstCommitteeControlName}`);

        if (firstCommitteeControlName && firstCommitteeControl) {
          firstCommitteeControl.enable();

          // Use new threshold evaluation system with variation-specific values
          const shouldCheck = this.evaluateThreshold(psaName, firstCommitteeControlName, { thisValue, revisedValue, byValue }, vendorId);
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

          // Use new threshold evaluation system with variation-specific values
          const shouldCheck = this.evaluateThreshold(psaName, secondCommitteeControlName, { thisValue, revisedValue, byValue }, vendorId);
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

  onSelectChangePSAJV() {
    const selectedOptions = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    const costAllocationControl = this.generalInfoForm.get('costAllocation');

    if (costAllocationControl) {
      // Clear listeners set when PSAs change (like template1) to allow fresh setup
      this.psaCalculationListenersSet.clear();

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
          // Remove from listeners set (already cleared above, but keeping for clarity)
          this.psaCalculationListenersSet.delete(psaName);
        }
      });

      // After creating all form controls, setup listeners for selected PSAJV
      // Use setTimeout to ensure controls are fully initialized
      setTimeout(() => {
        this.setupPSAListeners();
        this.setupPSACalculations();
      }, 0);
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

  setupPSACalculationsManually() {
    // Calculate By Value for costAllocation based on This Value (variation) - manual calculation without subscriptions
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    selectedPSAJV.forEach((psaName: string) => {
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      const percentageControl = this.generalInfoForm.get(`costAllocation.${percentageControlName}`);
      const valueControl = this.generalInfoForm.get(`costAllocation.${valueControlName}`);

      if (percentageControl && valueControl) {
        const percentageValue = percentageControl.value;
        const thisValue = Number(this.generalInfoForm.get('contractValues.thisVariationNote')?.value) || 0;

        if (percentageValue >= 0 && percentageValue <= 100) {
          const calculatedValue = (Number(percentageValue) / 100) * thisValue;
          valueControl.setValue(calculatedValue, { emitEvent: false });
          this.calculateTotalCostAllocation();
        }
      }
    });
  }

  setupPSACalculations() {
    // Calculate By Value for costAllocation based on This Value (variation) and keep totals in sync
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    selectedPSAJV.forEach((psaName: string) => {
      // Skip if listener already set up for this PSAJV column
      if (this.psaCalculationListenersSet.has(psaName)) {
        return;
      }

      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      const percentageControl = this.generalInfoForm.get(`costAllocation.${percentageControlName}`);
      const valueControl = this.generalInfoForm.get(`costAllocation.${valueControlName}`);

      if (percentageControl && valueControl) {
        // Ensure percentage control is enabled before subscribing
        if (percentageControl.disabled) {
          percentageControl.enable({ emitEvent: false });
        }

        percentageControl.valueChanges.subscribe((percentageValue) => {
          const thisValue = Number(this.generalInfoForm.get('contractValues.thisVariationNote')?.value) || 0;

          // Handle empty string, null, or undefined values
          const percentageNum = percentageValue === '' || percentageValue === null || percentageValue === undefined ? 0 : Number(percentageValue);

          if (!isNaN(percentageNum) && percentageNum >= 0 && percentageNum <= 100) {
            const calculatedValue = (percentageNum / 100) * thisValue;
            valueControl.setValue(calculatedValue, { emitEvent: false });
            this.calculateTotalCostAllocation();
            // Trigger committee logic after value is updated
            this.triggerCommitteeLogicForPSA(psaName);
          } else if (percentageNum === 0 || percentageValue === '' || percentageValue === null) {
            // Handle clearing/resetting
            valueControl.setValue(0, { emitEvent: false });
            this.calculateTotalCostAllocation();
          }
        });

        // Mark this PSAJV column as having listeners set up
        this.psaCalculationListenersSet.add(psaName);
      }
    });
  }

  private recalculateAllPSAValues(): void {
    // Recalculate all "By value $" fields when "This Value" changes
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    const thisValue = Number(this.generalInfoForm.get('contractValues.thisVariationNote')?.value) || 0;

    selectedPSAJV.forEach((psaName: string) => {
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      const percentageControl = this.generalInfoForm.get(`costAllocation.${percentageControlName}`);
      const valueControl = this.generalInfoForm.get(`costAllocation.${valueControlName}`);

      if (percentageControl && valueControl) {
        const percentageValue = Number(percentageControl.value) || 0;
        if (percentageValue >= 0 && percentageValue <= 100) {
          const calculatedValue = (percentageValue / 100) * thisValue;
          valueControl.setValue(calculatedValue, { emitEvent: false });
        }
      }
    });

    // Recalculate totals after updating all values
    this.calculateTotalCostAllocation();
  }

  private calculateTotalCostAllocation() {
    const costAllocation = this.generalInfoForm.get('costAllocation') as FormGroup;
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    let totalPercentage = 0;
    let totalValue = 0;

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

    costAllocation.get('totalPercentage')?.setValue(totalPercentage, { emitEvent: false });
    costAllocation.get('totalValue')?.setValue(totalValue, { emitEvent: false });

    if (totalPercentage !== 100) {
      costAllocation.get('totalPercentage')?.setErrors({ notExactly100: true });
    } else {
      costAllocation.get('totalPercentage')?.setErrors(null);
    }
  }

  requireAllIfAny(group: AbstractControl): ValidationErrors | null {
    const validateGroup = (fields: string[]) => {
      const values = fields.map(field => group.get(field)?.value);
      const hasValue = values.some(val => val);  // If at least one field has a value
      const allFilled = values.every(val => val); // If all fields are filled

      return hasValue && !allFilled ? { requireAllFields: true } : null;
    };

    // Apply validation for each group separately
    const errors = {
      costReduction: validateGroup(['costReductionPercent', 'costReductionValue', 'costReductionRemarks']),
      operatingEfficiency: validateGroup(['operatingEfficiencyPercent', 'operatingEfficiencyValue', 'operatingEfficiencyRemarks']),
      costAvoidance: validateGroup(['costAvoidancePercent', 'costAvoidanceValue', 'costAvoidanceRemarks'])
    };

    return Object.values(errors).some(error => error) ? errors : null;
  }

  // Custom validator to check if end date is after start date
  endDateAfterStartDate(startDateControlName: string): (control: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }

      const startDateControl = control.parent.get(startDateControlName);
      if (!startDateControl || !startDateControl.value || !control.value) {
        return null; // Don't validate if either date is empty (required validator will handle that)
      }

      // Parse dates and compare only the date part (ignore time)
      const startDate = new Date(startDateControl.value);
      const endDate = new Date(control.value);

      // Set time to midnight to compare only dates
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      // Check if end date is after start date (not equal or before)
      if (endDate <= startDate) {
        return { endDateBeforeOrEqualStartDate: true };
      }

      return null;
    };
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

    // Ensure section7 is visible so form controls are created and committee logic runs
    if (!this.sectionVisibility['section7']) {
      this.sectionVisibility['section7'] = true;
      // Set flag to prevent jvAligned reset during programmatic form updates
      this.isProgrammaticFormUpdate = true;

      this.ensureCostAllocationFormControls();

      // Get costAllocation FormGroup to access raw values
      const costAllocationFormGroup = this.generalInfoForm.get('costAllocation') as FormGroup;
      const rawCostAllocationValues = costAllocationFormGroup?.getRawValue() || {};

      // Trigger committee logic for all selected PSAs to ensure checkbox values are set
      const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
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

      // Trigger validation checks for value delivery remarks before marking as touched
      const valueDeliveryGroup = this.generalInfoForm.get('valueDelivery');
      if (valueDeliveryGroup) {
        // Check Cost Reduction - if $ is entered, both % and Remark are required
        const costReductionValue = valueDeliveryGroup.get('costReductionValue')?.value;
        const costReductionPercent = valueDeliveryGroup.get('costReductionPercent');
        const costReductionRemarks = valueDeliveryGroup.get('costReductionRemarks');
        const hasCostReductionValue = costReductionValue !== null && costReductionValue !== undefined && costReductionValue !== '' && costReductionValue !== 0;
        if (hasCostReductionValue) {
          costReductionPercent?.setValidators([Validators.required]);
          costReductionRemarks?.setValidators([Validators.required]);
        } else {
          costReductionPercent?.clearValidators();
          costReductionRemarks?.clearValidators();
        }
        costReductionPercent?.updateValueAndValidity();
        costReductionRemarks?.updateValueAndValidity();
      }

      // Mark all invalid form controls as touched to show validation errors
      this.markFormGroupTouched(this.generalInfoForm);

      // Mark all form arrays as touched
      if (this.consultationRows) {
        this.markFormArrayTouched(this.consultationRows);
      }

      // Check if form is valid
      if (this.generalInfoForm.invalid) {
        this.toastService.show("Please fill all required fields", "danger");
        return;
      }
    }

    // Use getRawValue to include disabled controls (important for JV Admin and other roles with disabled fields)
    const generalInfoValue = this.generalInfoForm?.getRawValue()?.generalInfo
    const justificationSectionValue = this.generalInfoForm?.getRawValue()?.justificationSection
    const contractInfoValue = this.generalInfoForm?.getRawValue()?.contractInfo
    const contractValues = this.generalInfoForm?.getRawValue()?.contractValues
    const ccdValues = this.generalInfoForm?.getRawValue()?.ccd
    const valueDeliveryValues = this.generalInfoForm?.getRawValue()?.valueDelivery
    const costAllocationValues = this.generalInfoForm?.getRawValue()?.costAllocation // Use getRawValue to include disabled controls
    // Use getRawValue to include disabled controls (like jvAligned which might be disabled)
    const consultationsValue = this.generalInfoForm?.getRawValue()?.consultation || this.generalInfoForm?.value?.consultation

    // Reset flag immediately after reading form values to allow normal auto-reset behavior
    // The flag was only needed to prevent reset during programmatic form setup
    this.isProgrammaticFormUpdate = false;

    // Build costAllocationJVApproval from costAllocation FormGroup (like template1)
    // Mapping PSAs from the costAllocation object dynamically
    // Use getRawValue to include disabled controls (psajv is already included in generalInfoValue from getRawValue)
    const selectedPSAJV = generalInfoValue?.psajv || [];
    console.log('======', selectedPSAJV);
    const psaMappings = selectedPSAJV.map((psaName: string) => ({
      key: this.getPSACheckboxControlName(psaName),
      name: psaName
    }));
    console.log('======', psaMappings);

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
              : 0,
            valueType: 'Original Value'
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
        camUserId: generalInfoValue?.camUserId || null,
        vP1UserId: generalInfoValue?.vP1UserId || null,
        pdManagerName: generalInfoValue?.pdManagerName || null,
        procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "",
        cgbItemRefNo: generalInfoValue?.cgbItemRefNo || '',
        cgbCirculationDate: generalInfoValue?.cgbCirculationDate || null,
        globalCGB: generalInfoValue?.globalCGB || '',
        subSector: generalInfoValue?.subSector || '',
        operatingFunction: generalInfoValue?.operatingFunction || '',
        sourcingType: generalInfoValue?.sourcingType || '',
        isPHCA: contractInfoValue?.isPHCA || false,
        psajv: generalInfoValue?.psajv?.join(',') || "",
        currencyCode: contractValues?.currencyCode || '',
        exchangeRate: contractValues?.exchangeRate || 0,
        contractStartDate: generalInfoValue?.contractStartDate || null,
        contractEndDate: generalInfoValue?.contractEndDate || null,
        isLTCC: generalInfoValue?.isLTCC || false,
        ltccNotes: generalInfoValue?.ltccNotes || '',
        isGovtReprAligned: generalInfoValue?.isGovtReprAligned || false,
        govtReprAlignedComment: generalInfoValue?.govtReprAlignedComment || '',
        isIFRS16: generalInfoValue?.isIFRS16 || false,
        isConflictOfInterest: contractInfoValue?.isConflictOfInterest || false,
        conflictOfInterestComment: contractInfoValue?.conflictOfInterestComment || '',
        remunerationType: contractInfoValue?.remunerationType || '',
        contractNo: generalInfoValue?.contractNo || '',
        isRetrospectiveApproval: contractInfoValue?.isRetrospectiveApproval || false,
        retrospectiveApprovalReason: contractInfoValue?.retrospectiveApprovalReason || '',
        isGIAAPCheck: generalInfoValue?.isGIAAPCheck || false,
        cgbApprovalDate: generalInfoValue?.cgbApprovalDate || null,
        isHighRiskContract: ccdValues?.isHighRiskContract || false,
        cddCompleted: ccdValues?.daCDDCompleted || null,
        highRiskExplanation: ccdValues?.highRiskExplanation || '',
        flagRaisedCDD: ccdValues?.flagRaisedCDD || '',
        additionalCDD: ccdValues?.additionalCDD || '',
        ...(this.paperId && !this.isCopy ? { id: Number(this.paperId) } : {})
      },
      variationPaper: {
        cgbAwardRefNo: generalInfoValue?.cgbAwardRefNo || '',
        variationStartDate: generalInfoValue?.variationStartDate || null,
        variationEndDate: generalInfoValue?.variationEndDate || null,
        whyChangeRequired: justificationSectionValue?.whyChangeRequired || '',
        longTermStrategy: justificationSectionValue?.longTermStrategy || '',
        workspaceNo: contractInfoValue?.workspaceNo || '',
        previousCGBRefNo: contractInfoValue?.previousCGBRefNo || '',
        isPaymentRequired: contractInfoValue?.isPaymentRequired || false,
        prePayAmount: contractInfoValue?.prePayAmount || 0,
        originalContractValue: contractValues?.originalContractValue || 0,
        previousVariationTotal: contractValues?.previousVariationTotal || 0,
        thisVariationNote: contractValues?.thisVariationNote?.toString() || '',
        revisedContractValue: contractValues?.revisedContractValue || 0,
        spendOnContract: contractValues?.spendOnContract || 0,
        isCurrencyLinktoBaseCost: contractValues?.isCurrencyLinktoBaseCost || false,
        isChangeinSOW: generalInfoValue?.isChangeinSOW || false,
        isIncreaseInValue: generalInfoValue?.isIncreaseInValue || false,
        isExtensionOfDuration: generalInfoValue?.isExtensionOfDuration || false,
        isTEToCompleteBidding: generalInfoValue?.isTEToCompleteBidding || false,
        isChangeInRates: generalInfoValue?.isChangeInRates || false,
        fullLegalName: generalInfoValue?.fullLegalName || null,
        noCurrencyLinkNotes: contractValues?.noCurrencyLinkNotes || '',
      },
      valueDeliveriesCostSharings: {
        costReductionPercent: valueDeliveryValues?.costReductionPercent || 0,
        costReductionValue: valueDeliveryValues?.costReductionValue || 0,
        costReductionRemarks: valueDeliveryValues?.costReductionRemarks || "",
        operatingEfficiencyValue: valueDeliveryValues?.operatingEfficiencyValue || 0,
        operatingEfficiencyPercent: valueDeliveryValues?.operatingEfficiencyPercent || 0,
        operatingEfficiencyRemarks: valueDeliveryValues?.operatingEfficiencyRemarks || "",
        costAvoidanceValue: valueDeliveryValues?.costAvoidanceValue || 0,
        costAvoidancePercent: valueDeliveryValues?.costAvoidancePercent || 0,
        costAvoidanceRemarks: valueDeliveryValues?.costAvoidanceRemarks || "",
      },
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
      })(),
      consultations: (consultationsValue || []).map((consultation: any) => ({
        id: consultation.id || 0,
        psa: consultation.psa || '',
        technicalCorrect: consultation.technicalCorrect || null,
        budgetStatement: consultation.budgetStatement || null,
        jvReview: consultation.jvReview || null,
        isJVReviewDone: consultation.jvAligned || false
      })),

    }

    if (this.generalInfoForm.valid && this.currentPaperStatus === "Registered") {
      // const isPassedCheck = this.checkThreshold(generalInfoValue?.contractValueUsd || 0, Number(generalInfoValue?.sourcingType || 0))
      // if (!isPassedCheck) {
      //   this.toastService.show('Contract value must meet or exceed the selected threshold.', 'danger');
      //   return;
      // }

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

  checkThreshold(value: number, type: number) {
    if (this.thresholdData && this.thresholdData.length > 0) {
      const data = this.thresholdData.find(item => item.paperType === "Approach to Market" && item.sourcingType === type)
      return !(data && data.contractValueLimit > value);
    } else {
      return true
    }
  }

  generatePaper(params: any, updateStatus = true) {
    this.isSubmitting = true;
    this.paperService.upsertVariationPaper(params).subscribe({
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

  toggleComments() {
    if (!this.isExpanded) {
      this.toggleService.expandComments();
    } else {
      this.toggleService.collapseAll();
    }
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
        matchingLabel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500); // Adjust delay as needed
  }

  scrollToSection(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const section = document.getElementById(selectedValue);

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get generalInfo() {
    return this.generalInfoForm.get('generalInfo');
  }

  get contractInfo() {
    return this.generalInfoForm.get('contractInfo');
  }

  // Getter for FormArray
  get consultationRows(): FormArray {
    return this.generalInfoForm.get('consultation') as FormArray;
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

  addConsultationRowOnChangePSAJV(jvValue: string) {
    // Check if the JV value already exists in the rows
    const alreadyExists = this.consultationRows.controls.some(group =>
      group.get('psa')?.value === jvValue
    );

    if (alreadyExists) {
      return; // Skip adding duplicate
    }

    const camUserId = this.generalInfoForm.get('generalInfo.camUserId')?.value || null;

    this.consultationRows.push(
      this.fb.group({
        psa: [{ value: jvValue, disabled: true }, Validators.required],
        technicalCorrect: [
          { value: camUserId ? Number(camUserId) : null, disabled: true },
          Validators.required
        ],
        budgetStatement: [null, Validators.required],
        jvReview: [null, Validators.required],
        jvAligned: [{ value: false, disabled: true }], // JV Aligned checkbox - disabled by default (like template1)
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

  addConsultationRow(isFirst = false, isChangedCamUser = false, consultationsData?: any[]) {
    if (isFirst) {
      // Use provided consultationsData, or fall back to paperDetails.consultationsDetails
      const riskMitigationsData = consultationsData || (this.paperDetails?.consultationsDetails as any[]) || []
      const riskMitigationArray = this.consultationRows;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index: number) => {
        // Get the initial jvAligned value from API
        const isJVReviewDone = item.isJVReviewDone === true; // Store if review is already done
        const initialJVAlignedValue = item.isJVReviewDone === true || item.jvAligned === true;
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
        // Convert to number to ensure proper comparison
        const userIdForCheck = jvReviewValue ? Number(jvReviewValue) : null;
        setTimeout(() => {
          const row = this.consultationRows.at(index);
          const jvAlignedControl = row?.get('jvAligned');
          
          if (jvAlignedControl) {
            // If isJVReviewDone is true, checkbox should be checked and disabled (read-only)
            if (isJVReviewDone) {
              jvAlignedControl.setValue(true, { emitEvent: false });
              jvAlignedControl.disable(); // Always disabled when review is done
            } else {
              // If review is not done, enable/disable based on user permissions
              this.onJVReviewChange(index, userIdForCheck, isJVReviewDone);
            }
          }
        }, 0);
      });
    } else {
      const camUserId = this.generalInfoForm.get('generalInfo.camUserId')?.value || null;
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

  canEditJVAligned(jvReviewUserId: number | null, isJVReviewDone: boolean = false): boolean {
    // If review is already done, no one can edit (checkbox is read-only)
    if (isJVReviewDone) {
      return false;
    }
    
    if (!this.loggedInUser || !jvReviewUserId) {
      return false;
    }
    
    const paperStatus = this.paperDetails?.paperDetails?.paperStatusName;
    const statusLower = (paperStatus || '').toLowerCase().trim();
    
    // Check if user matches jvReviewUserId
    const loggedInUserId = Number(this.loggedInUser.id);
    const reviewUserId = Number(jvReviewUserId);
    if (loggedInUserId !== reviewUserId) {
      return false;
    }
    
    // JV Admin can edit JV Aligned at any stage between Registered and Approved by Pre-CGB
    if (this.loggedInUser.roleName === 'JV Admin') {
      const allowedStatuses = [
        'registered',
        'waiting for pdm',
        'on pre-cgb',
        'approved by pre-cgb',
        'on jv approval'
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
    const loggedInUserId = Number(this.loggedInUser.id);
    return this.consultationRows.controls.some(row => {
      const jvReviewUserId = row.get('jvReview')?.value;
      const jvAligned = row.get('jvAligned')?.value;
      const reviewUserId = jvReviewUserId ? Number(jvReviewUserId) : null;
      return reviewUserId && loggedInUserId === reviewUserId && jvAligned === true;
    });
  }

  // Method to check if user can edit any JV Aligned checkbox (for Update button enable/disable)
  canEditAnyJVAlignedCheckbox(): boolean {
    if (!this.loggedInUser) {
      return false;
    }
    
    const consultationsData = this.paperDetails?.consultationsDetails || [];
    const loggedInUserId = Number(this.loggedInUser?.id);
    
    // Check if user has any consultation row where they can edit the checkbox
    return this.consultationRows.controls.some((row, index) => {
      const jvReviewUserId = row.get('jvReview')?.value;
      const reviewUserId = jvReviewUserId ? Number(jvReviewUserId) : null;
      
      if (!reviewUserId || loggedInUserId !== reviewUserId) {
        return false;
      }
      
      // Check if this row has isJVReviewDone from original API data
      const originalItem = consultationsData[index] as any;
      const isJVReviewDone = originalItem?.isJVReviewDone === true;
      
      // User can edit if checkbox is not already reviewed and they have permission
      return !isJVReviewDone && this.canEditJVAligned(reviewUserId, isJVReviewDone);
    });
  }

  // Method to get isJVReviewDone for a specific row index
  getIsJVReviewDoneForRow(rowIndex: number): boolean {
    const consultationsData = this.paperDetails?.consultationsDetails || [];
    const originalItem = consultationsData[rowIndex] as any;
    return originalItem?.isJVReviewDone === true;
  }

  // Method to update JV Aligned state for all consultation rows
  updateAllJVAlignedStates(): void {
    // Get the original consultations data to check isJVReviewDone
    const consultationsData = this.paperDetails?.consultationsDetails || [];
    
    this.consultationRows.controls.forEach((row, index) => {
      const jvReviewUserId = row.get('jvReview')?.value;
      const jvAlignedValue = row.get('jvAligned')?.value;
      // Convert to number if it's a string to ensure proper comparison
      const userId = jvReviewUserId ? Number(jvReviewUserId) : null;
      
      // Check if this row has isJVReviewDone from original API data
      const originalItem = consultationsData[index] as any;
      const isJVReviewDone = originalItem?.isJVReviewDone === true;
      
      if (userId) {
        const jvAlignedControl = row.get('jvAligned');
        if (jvAlignedControl) {
          // If isJVReviewDone is true, checkbox should be checked and disabled (read-only for all users)
          if (isJVReviewDone) {
            jvAlignedControl.setValue(true, { emitEvent: false });
            jvAlignedControl.disable(); // Always disabled when review is done
          } else {
            // If review is not done, enable/disable based on user permissions
            this.onJVReviewChange(index, userId, isJVReviewDone);
          }
        }
      } else {
        // If no JV Review user assigned, ensure checkbox is disabled
        const jvAlignedControl = row.get('jvAligned');
        if (jvAlignedControl && !jvAlignedControl.disabled) {
          jvAlignedControl.disable();
        }
      }
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
      'justificationSection',
      'contractInfo',
      'contractValues',
      'ccd',
      'valueDelivery',
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
    // This includes PSA checkboxes, percentage inputs, value inputs
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

          [checkboxControlName, percentageControlName, valueControlName].forEach(controlName => {
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
      'justificationSection',
      'contractInfo',
      'contractValues',
      'ccd',
      'valueDelivery',
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

  onJVReviewChange(rowIndex: number, jvReviewUserId: number | null, isJVReviewDone: boolean = false) {
    const row = this.consultationRows.at(rowIndex);
    const jvAlignedControl = row.get('jvAligned');
    if (jvAlignedControl) {
      // Store the current value before making any changes
      const currentValue = jvAlignedControl.value;

      // If review is already done, checkbox should be checked and disabled for all users
      if (isJVReviewDone) {
        jvAlignedControl.setValue(true, { emitEvent: false });
        jvAlignedControl.disable();
        return;
      }

      // Convert to number if it's a string to ensure proper comparison
      const userId = jvReviewUserId ? Number(jvReviewUserId) : null;

      if (this.canEditJVAligned(userId, isJVReviewDone)) {
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
      this.router.navigate(['/preview/variation-paper', this.paperId]);
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

  addReview(modal: any) {
    if (this.selectedPaper > 0) {
      this.isSubmitting = true;
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
              this.isSubmitting = false;
            }
          },
          error: (error) => {
            console.log('error', error);
            this.toastService.showError(error);
            this.isSubmitting = false;
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

  toggleSection(section: string): void {
    this.sectionVisibility[section] = !this.sectionVisibility[section];
  }

  initializeAllPSAControls(): void {
    // Initialize controls for ALL possible PSAs from psaJvOptions (like template1 does)
    // This ensures controls exist when HTML tries to bind to them
    const costAllocationControl = this.generalInfoForm.get('costAllocation') as FormGroup;
    if (!costAllocationControl) return;

    this.psaJvOptions.forEach(psaOption => {
      const psaName = psaOption.value;
      const newControls = this.createPSAJVFormControls(psaName);

      Object.keys(newControls).forEach(controlName => {
        if (!costAllocationControl.get(controlName)) {
          costAllocationControl.addControl(controlName, this.fb.control(newControls[controlName][0], newControls[controlName][1]));
        }
      });
    });
  }

  ensureCostAllocationFormControls(): void {
    // Set flag to prevent jvAligned reset during programmatic form updates
    // Note: Flag is managed by caller (onSubmit) to ensure it stays set during entire operation
    this.isProgrammaticFormUpdate = true;

    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    const costAllocationControl = this.generalInfoForm.get('costAllocation') as FormGroup;

    selectedPSAJV.forEach((psaName: string) => {
      this.addPSAJVFormControls(psaName);
      // Set checkbox to checked and readonly
      const checkboxControlName = this.getPSACheckboxControlName(psaName);
      const percentageControlName = this.getPSAPercentageControlName(psaName);

      if (costAllocationControl) {
        const checkboxControl = costAllocationControl.get(checkboxControlName);
        if (checkboxControl) {
          // Enable temporarily to set value, then disable again (readonly)
          checkboxControl.enable({ emitEvent: false });
          checkboxControl.setValue(true, { emitEvent: false });
          checkboxControl.disable({ emitEvent: false });
        }
        // Ensure percentage field is enabled
        const percentageControl = costAllocationControl.get(percentageControlName);
        if (percentageControl) {
          percentageControl.enable({ emitEvent: false });
        }
      }
    });

    // Setup calculations after ensuring all controls are created
    this.setupPSACalculations();
  }

  // Attachment methods
  getUploadedDocs(paperId: number): void {
    this.uploadService.getDocItemsListByPaperId(paperId).subscribe(value => {
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
          this.selectedFiles.push({ file, name: file.name, preview: e.target?.result as string, isImage: fileType.startsWith('image'), id: null });
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

          this.selectedFiles.push({ file, name: file.name, preview: e.target?.result as string, isImage: fileType.startsWith('image'), id: null });
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // Remove a selected file
  removeFile(index: number, file: any = null) {
    this.selectedFiles.splice(index, 1);
    if (file.id && !this.isCopy) {
      this.deletedFiles.push(Number(file.id))
    }
  }

  deleteMultipleDocuments(paperId: number | null) {
    if (!paperId || this.deletedFiles.length === 0) return;

    this.deletedFiles.forEach(docId => {
      this.uploadService.deleteDocuments(paperId, docId).subscribe({
        next: (res) => {
          if (res.success) {
            console.log(`Deleted docId: ${docId}`);
          }
        },
        error: (err) => {
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
        next: (response) => {
          if (response.status && response.data) {
            console.log('Files uploaded successfully!');
            this.selectedFiles = [];
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
        },
      });
    }
  }

  setupDateValidation() {
    // Re-validate contract end date when contract start date changes
    this.generalInfoForm.get('generalInfo.contractStartDate')?.valueChanges.subscribe(() => {
      this.generalInfoForm.get('generalInfo.contractEndDate')?.updateValueAndValidity();
    });

    // Re-validate variation end date when variation start date changes
    this.generalInfoForm.get('generalInfo.variationStartDate')?.valueChanges.subscribe(() => {
      this.generalInfoForm.get('generalInfo.variationEndDate')?.updateValueAndValidity();
    });
  }

  /**
   * Check if CKEditor fields should be disabled
   * On Pre-CGB: Only Secretary (and Super Admin) can edit CKEditor fields
   */
  isCKEditorDisabled(): boolean {
    const status = this.currentPaperStatus || this.paperDetails?.paperDetails?.paperStatusName || '';
    const isOnPreCGB = status === 'On Pre-CGB' || status === 'on pre-cgb' || status === 'On CGB' || status === 'on cgb';
    const userRole = this.loggedInUser?.roleName || '';
    const isSecretary = userRole === 'Secretary' || userRole === 'Super Admin';
    
    // If status is On Pre-CGB and user is not Secretary, disable CKEditor
    return isOnPreCGB && !isSecretary;
  }

}
