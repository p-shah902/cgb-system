import {Component,AfterViewInit, inject, Renderer2, ViewChild, ElementRef, TemplateRef} from '@angular/core';
import {CKEditorModule, loadCKEditorCloud, CKEditorCloudResult} from '@ckeditor/ckeditor5-angular';
import type {ClassicEditor, EditorConfig} from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors, FormsModule
} from '@angular/forms';
import {NgbModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {CommonModule} from '@angular/common';
import {environment} from '../core/app-config';
import {Select2} from 'ng-select2-component';
import {DictionaryService} from '../../service/dictionary.service';
import {Generalervice} from '../../service/general.service';
import {UploadService} from '../../service/document.service';
import {ToastService} from '../../service/toast.service';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import {DictionaryDetail} from '../../models/dictionary';
import {LoginUser, UserDetails, GetUsersListRequest} from '../../models/user';
import {UserService} from '../../service/user.service';
import {PaperService} from '../../service/paper.service';
import {CountryDetail} from '../../models/general';
import {PaperMappingType, PaperStatusType} from '../../models/paper';
import {VendorService} from '../../service/vendor.service';
import {VendorDetail} from '../../models/vendor';
import {CURRENCY_LIST} from '../../utils/constant';
import {format} from 'date-fns';
import {BehaviorSubject} from 'rxjs';
import {TimeAgoPipe} from '../../pipes/time-ago.pipe';
import {EditorComponent} from '../../components/editor/editor.component';
import {CommentableDirective} from '../../directives/commentable.directive';
import {EditorNormalComponent} from '../../components/editor-normal/editor-normal.component';
import {CommentService} from '../../service/comment.service';
import {EditorService} from '../../service/editor.service';
import {PaperConfigService} from '../../service/paper/paper-config.service';
import {AuthService} from '../../service/auth.service';
import {ThresholdService} from '../../service/threshold.service';
import {ThresholdType} from '../../models/threshold';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import {cleanObject, base64ToFile, getMimeTypeFromFileName} from '../../utils/index';
import {ToggleService} from '../shared/services/toggle.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {NumberInputComponent} from '../../components/number-input/number-input.component';
import { COMMITTEE_CONDITIONS } from '../../utils/threshold-conditions';
import { PermissionService } from '../shared/services/permission.service';
import { ActionBarComponent } from '../shared/components/action-bar/action-bar.component';

@Component({
  selector: 'app-template2',
  standalone: true,
  imports: [CommonModule,NumberInputComponent, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, TimeAgoPipe, EditorComponent, CommentableDirective, EditorNormalComponent, RouterLink, NgbTooltip, ActionBarComponent],
  templateUrl: './template2.component.html',
  styleUrl: './template2.component.scss'
})
export class Template2Component implements AfterViewInit {
  @ViewChild('sectionDropdown') sectionDropdown!: ElementRef<HTMLSelectElement>;
  private readonly userService = inject(UserService);
  private readonly paperService = inject(PaperService);
  private readonly vendorService = inject(VendorService);
  private paperConfigService = inject(PaperConfigService);
  private commentService = inject(CommentService);
  private editorService = inject(EditorService);
  private authService = inject(AuthService);
  private readonly thresholdService = inject(ThresholdService);
  private searchTimeout: any;
  public Editor: typeof ClassicEditor | null = null;
  public config: EditorConfig | null = null;
  private allApisDone$ = new BehaviorSubject<boolean>(false);
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
  currentPaperStatus: string | null = null;
  pendingStatus: string | null = null;
  paperDetails: any = null
  vendorList: VendorDetail[] = []
  userDetails: UserDetails[] = [];
  procurementTagUsers: any[] = [];
  paperMappingData: PaperMappingType[] = [];
  cgbAtmRefOptions: { value: string; label: string }[] = [];
  countryDetails: CountryDetail[] = [];
  paperStatusList: PaperStatusType[] = [];
  isRegisterPaper: boolean = false
  private completedCount = 0;
  private totalCalls = 7;
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
  private readonly _mdlSvc = inject(NgbModal);
  thresholdData: ThresholdType[] = []
  deletedFiles: number[] = []
  selectedFiles: any[] = [];
  isDragging = false;
  isShowBenchmarking = true
  isInitialLoad = true;
  logs: any[] = [];
  comment: string = '';
  atmPaperContactValueUSD: number = 0
  totalAwardValueMismatch: boolean = false
  sectionVisibility: { [key: string]: boolean } = {
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
    section6: false,
    section7: false,
    section8: false,
    section10: false,
  };
  public psaJvOptions: { value: string; label: string }[] = [];

  constructor(private toggleService: ToggleService, private router: Router, private route: ActivatedRoute, private dictionaryService: DictionaryService,
              private fb: FormBuilder, private countryService: Generalervice, private renderer: Renderer2, private uploadService: UploadService, public toastService: ToastService,
              public permission: PermissionService
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
          } else {
            this.isExpanded = false;
          }
          console.log('Paper ID:', this.paperId);
        });
      }
    });


    this.route.queryParamMap.subscribe(queryParams => {
      this.isCopy = queryParams.get('isCopy') === 'true';
      console.log('Is Copy:', this.isCopy);
    });

    this.loadForm()
    this.loadDictionaryItems()
    this.loadUserDetails()
    this.fetchApprovedPapersForMapping()
    this.loadThresholdData()
    this.loadCountry();
    this.loadPaperStatusListData();
    this.loadVendoreDetails()
    this.onLTCCChange()
    this.onPrepaymentChange()
    this.currencyLinkedChange()
    this.conflictIntrestChanges()
    this.restrospectiveChanges()
    this.onChangeInApproachMarketChange()
    this.onHighRiskContractChange()
    this.addRow()
    this.addSupplierTechnicalnRow()
    this.addBidRow()
    this.addCommericalEvaluationRow()
    this.setupPSAListeners()
    this.setupPSACalculations()
    this.setupMethodologyListeners()
    this.setupValueDeliveryRemarksValidation()
    this.setupScoreThresholdSync()
    this.setupTechnicalGoNoGoAutoUpdate()
    this.setupJVAlignedAutoReset()
    this.setupProcurementDateValidation()


    // Note: Exchange rate is always manually entered, no auto-population from currency

    this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.valueChanges.subscribe(() => {
      this.updateContractValueOriginalCurrency();
      this.setupPSACalculationsManually();
      // Re-evaluate committee checkboxes after PSA values are recalculated
      this.reEvaluateAllCommitteeCheckboxes();
      // Recalculate prepayment amount if percentage is already entered
      const prePayPercent = this.generalInfoForm.get('generalInfo.prePayPercent')?.value;
      const isPaymentRequired = this.generalInfoForm.get('generalInfo.isPaymentRequired')?.value;
      if (isPaymentRequired === true && prePayPercent !== null && prePayPercent !== undefined && prePayPercent !== '') {
        const totalValue = Number(this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value) || 0;
        if (totalValue > 0 && prePayPercent >= 0 && prePayPercent <= 100) {
          const calculatedAmount = (Number(prePayPercent) / 100) * totalValue;
          this.generalInfoForm.get('generalInfo.prePayAmount')?.setValue(calculatedAmount, { emitEvent: false });
        }
      }
    });

    // Update contract value when exchange rate changes manually
    this.generalInfoForm.get('generalInfo.exchangeRate')?.valueChanges.subscribe(() => {
      this.updateContractValueOriginalCurrency();
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

    this.generalInfoForm.get('generalInfo.camUserId')?.valueChanges.subscribe((newCamUserId) => {
      this.updateTechnicalCorrectInAllRows(newCamUserId);
    });

    this.generalInfoForm.get('generalInfo.cgbAtmRefNo')?.valueChanges.subscribe((cgbAtmRefNo) => {
      this.updateCgbApprovalDate(Number(cgbAtmRefNo));
      // Auto-populate Contract Value when ATM Ref No is selected
      if (cgbAtmRefNo) {
        const paperId = typeof cgbAtmRefNo === 'string' ? Number(cgbAtmRefNo) : cgbAtmRefNo;
        this.fetchATMPaperDetails(paperId);
      } else {
        // Clear ATM contract value when ATM is deselected
        this.atmPaperContactValueUSD = 0;
      }
    });

    // Check for total award value mismatch
    this.checkTotalAwardValueMismatch();
    this.subscribeToTotalAwardValueChanges();

  }
  private setupJVAlignedAutoReset() {
    if (!this.generalInfoForm) { return; }
    this.generalInfoForm.valueChanges.subscribe(() => {
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


  loadForm() {
    this.generalInfoForm = this.fb.group({
      generalInfo: this.fb.group({
        paperProvision: ['', Validators.required],
        cgbAtmRefNo: [null],
        cgbApprovalDate: [null],
        isChangeinApproachMarket: [null, Validators.required],
        cgbItemRefNo: [{value: '', disabled: true}],
        cgbCirculationDate: [{value: null, disabled: true}],
        contractNo: [''],
        contactNo: [''],
        purposeRequired: [{value: '', disabled: true}],
        globalCGB: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        operatingFunction: ['', Validators.required],
        subSector: ['', Validators.required],
        sourcingType: ['', Validators.required],
        camUserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, Validators.required],
        isPHCA: [null, Validators.required],
        currencyCode: [''],
        totalAwardValueUSD: [
          null,
          [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]
        ],
        exchangeRate: [0], // Number input
        contractValue: [0],
        remunerationType: ['', Validators.required],
        isPaymentRequired: [null, Validators.required],
        prePayPercent: [{value: null, disabled: true}],
        prePayAmount: [{value: null, disabled: true}],
        workspaceNo: [''],
        isSplitAward: [null, Validators.required],
        psajv: [[], Validators.required],
        isLTCC: [null, Validators.required],
        ltccNotes: [{ value: '', disabled: true }],
        isGovtReprAligned: [null, Validators.required],
        govtReprAlignedComment: [''],
      }),
      procurementDetails: this.fb.group({
        supplierAwardRecommendations: ['', Validators.required],
        legalEntitiesAwarded: this.fb.array([]),
        isConflictOfInterest: [null, Validators.required],
        conflictOfInterestComment: [{ value: '', disabled: true }],
        isRetrospectiveApproval: [null, Validators.required],
        retrospectiveApprovalReason: [{ value: '', disabled: true }],
        nationalContent: ['', Validators.required],
      }),
      ccd: this.fb.group({
        isHighRiskContract: [null, Validators.required],
        cddCompleted: [null, Validators.required],
        highRiskExplanation: [{value: '', disabled: true}],
        flagRaisedCDD: [{value: '', disabled: true}],
        additionalCDD: [{value: '', disabled: true}],

      }),
      evaluationSummary: this.fb.group({
        invitedBidders: [0],
        submittedBids: [0],
        previousContractLearning: [''],
        performanceImprovements: [''],
        previousSupplierSpendInfo: ['', Validators.required],
        benchMarking: [''],
        commericalEvaluation: this.fb.array([]),
        supplierTechnical: this.fb.array([]),
      }),
      additionalDetails: this.fb.group({
        contractualControls: [''],
        contractCurrencyLinktoBaseCost: [null, Validators.required],
        explanationsforBaseCost: [{ value: '', disabled: true }],
        riskMitigation: this.fb.array([]),
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
      costSharing: this.fb.group({
        isCapex: [false],
        isFixOpex: [false],
        isVariableOpex: [false],
        isInventoryItems: [false],
        capexMethodology: [''],
        fixOpexMethodology: [''],
        variableOpexMethodology: [''],
        inventoryItemsMethodology: [''],
        contractSpendCommitment: ['', Validators.required]
      }),
      consultation: this.fb.array([]),

    });

  }

  fetchPaperDetails(paperId: number) {
    // isLoadingDetails is already set to true when paperId is detected
    this.paperService.getPaperDetails(paperId, 'contract').subscribe({
      next: (value) => {
        this.paperDetails = value.data as any;
      console.log("==this.paperDetails", this.paperDetails)
      // Store consultations data in paperDetails for addConsultationRow to access
      const consultationsData = value.data?.consultations || [];
      this.paperDetails.consultationsDetails = consultationsData;
      const contractAwardDetails = this.paperDetails?.contractAwardDetails || null
      const bidInvitesData = value.data?.bidInvites || []
      const valueData = this.paperDetails?.valueDeliveries[0] || null
      const jvApprovalsData = value.data?.jvApprovals[0] || null
      const costAllocationJVApprovalData = value.data?.costAllocationJVApproval || []

      const patchValues: any = {costAllocation: {}};

      const selectedPaperStatus = this.paperStatusList.find((item) => item.id.toString() === contractAwardDetails?.paperStatusId?.toString())

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
            patchValues.costAllocation[percentageKey] = psa.percentage || '';
            patchValues.costAllocation[valueKey] = psa.value || 0;
          }
        }
      });

      // Start with PSAs from contractAwardDetails
      const selectedValues = contractAwardDetails?.psajv
        ? contractAwardDetails.psajv
          .split(',')
          .map((label: any) => label.trim())
          .map((label: any) => this.psaJvOptions.find(option => option.label === label)?.value)
          .filter((value: any) => value != null) // Use != null to filter both null and undefined
        : [];

      // Also include PSAs from costAllocationJVApproval that have values
      const psasFromCostAllocation = costAllocationJVApprovalData
        .filter(psa => psa.psaValue === true)
        .map(psa => {
          // Find the PSA value from psaJvOptions by matching the psaName (case-insensitive)
          const psaNameUpper = (psa.psaName || '').toString().toUpperCase();
          const psaOption = this.psaJvOptions.find(option => {
            const optionLabelUpper = (option.label || '').toString().toUpperCase();
            const optionValueUpper = (option.value || '').toString().toUpperCase();
            return optionLabelUpper === psaNameUpper || optionValueUpper === psaNameUpper;
          });
          return psaOption?.value;
        })
        .filter((value: any) => value != null);

      // Merge and deduplicate
      const allSelectedValues = [...new Set([...selectedValues, ...psasFromCostAllocation])];

      // IMPORTANT: Create form controls BEFORE patching values, otherwise values will be lost
      allSelectedValues.forEach((psaName: string) => {
        this.addPSAJVFormControls(psaName);
      });

      const selectedValuesProcurementTagUsers = contractAwardDetails?.procurementSPAUsers
        ? contractAwardDetails.procurementSPAUsers
          .split(',')
          .map((id: any) => id.trim())
          .map((id: any) => this.procurementTagUsers.find(option => option.value === Number(id))?.value)
          .filter((value: any) => value != null)
        : [];

      if (value.data) {
        // Enable conditional CDD fields if High Risk Contract is true, before patching values
        const isHighRisk = contractAwardDetails?.isHighRiskContract === true;
        if (isHighRisk) {
          this.generalInfoForm.get('ccd.highRiskExplanation')?.enable();
          this.generalInfoForm.get('ccd.flagRaisedCDD')?.enable();
          this.generalInfoForm.get('ccd.additionalCDD')?.enable();
        }

        this.generalInfoForm.patchValue({
          generalInfo: {
            paperProvision: contractAwardDetails?.paperProvision || "",
            cgbAtmRefNo: contractAwardDetails?.cgbAtmRefNo ? contractAwardDetails?.cgbAtmRefNo.toString() : null,
            cgbApprovalDate:  contractAwardDetails?.cgbApprovalDate
              ? format(new Date(contractAwardDetails.cgbApprovalDate), 'yyyy-MM-dd')
              : null,
            isChangeinApproachMarket: contractAwardDetails?.isChangeinApproachMarket ?? null,
            cgbItemRefNo: contractAwardDetails?.cgbItemRefNo || "",
            cgbCirculationDate: contractAwardDetails?.cgbCirculationDate
              ? format(new Date(contractAwardDetails.cgbCirculationDate), 'yyyy-MM-dd')
              : null,
            contractNo: contractAwardDetails?.contractNo || "",
            contactNo: contractAwardDetails?.contactNo || "",
            purposeRequired: contractAwardDetails?.purposeRequired || "",
            globalCGB: contractAwardDetails?.globalCGB || "",
            bltMember: contractAwardDetails?.bltMemberId ? Number(contractAwardDetails.bltMemberId) : null,
            operatingFunction: contractAwardDetails?.operatingFunction || "",
            subSector: contractAwardDetails?.subSector || "",
            sourcingType: contractAwardDetails?.sourcingType || "",
            camUserId: contractAwardDetails?.camUserId || null,
            vP1UserId: contractAwardDetails?.vP1UserId || null,
            procurementSPAUsers: selectedValuesProcurementTagUsers,
            pdManagerName: contractAwardDetails?.pdManagerNameId || null,
            isPHCA: contractAwardDetails?.isPHCA || false,
            currencyCode: contractAwardDetails?.currencyCode || '',
            totalAwardValueUSD: contractAwardDetails?.contractValue || 0,
            exchangeRate: contractAwardDetails?.exchangeRate || 0,
            contractValue: (contractAwardDetails?.contractValue || 0) * (contractAwardDetails?.exchangeRate || 0),
            remunerationType: contractAwardDetails?.remunerationType || 0,
            isPaymentRequired: contractAwardDetails?.isPaymentRequired || false,
            prePayPercent: contractAwardDetails?.prePayPercent || 0,
            prePayAmount: contractAwardDetails?.prePayAmount || 0,
            workspaceNo: contractAwardDetails?.workspaceNo || '',
            isSplitAward: contractAwardDetails?.isSplitAward || false,
            psajv: allSelectedValues,
            isLTCC: contractAwardDetails?.isLTCC || false,
            ltccNotes: contractAwardDetails?.ltccNotes || '',
            isGovtReprAligned: contractAwardDetails?.isGovtReprAligned || false,
            govtReprAlignedComment: contractAwardDetails?.govtReprAlignedComment || '',
          },
          procurementDetails: {
            supplierAwardRecommendations: contractAwardDetails?.supplierAwardRecommendations || '',
            // legalEntitiesAwarded: this.fb.array([]),
            isConflictOfInterest: contractAwardDetails?.isConflictOfInterest || false,
            conflictOfInterestComment: contractAwardDetails?.conflictOfInterestComment || '',
            isRetrospectiveApproval: contractAwardDetails?.isRetrospectiveApproval || false,
            retrospectiveApprovalReason: contractAwardDetails?.retrospectiveApprovalReason || '',
            nationalContent: contractAwardDetails?.nationalContent || '',
          }, ccd: {
            isHighRiskContract: contractAwardDetails?.isHighRiskContract || false,
            cddCompleted: contractAwardDetails?.cddCompleted
              ? format(new Date(contractAwardDetails.cddCompleted), 'yyyy-MM-dd')
              : null,
            highRiskExplanation: contractAwardDetails?.highRiskExplanation || '',
            flagRaisedCDD: contractAwardDetails?.flagRaisedCDD || '',
            additionalCDD: contractAwardDetails?.additionalCDD || '',
          }, evaluationSummary: {
            invitedBidders: contractAwardDetails?.invitedBidders || 0,
            submittedBids: contractAwardDetails?.submittedBids || 0,
            previousContractLearning: contractAwardDetails?.previousContractLearning || '',
            performanceImprovements: contractAwardDetails?.performanceImprovements || '',
            benchMarking: contractAwardDetails?.benchMarking || '',
            previousSupplierSpendInfo: contractAwardDetails?.previousSupplierSpendInfo || '',
            // commericalEvaluation: this.fb.array([]),
            // supplierTechnical: this.fb.array([]),
          }, additionalDetails: {
            contractualControls: contractAwardDetails?.contractualControls || '',
            contractCurrencyLinktoBaseCost: contractAwardDetails?.contractCurrencyLinktoBaseCost || false,
            explanationsforBaseCost: contractAwardDetails?.explanationsforBaseCost || '',
            // riskMitigation: this.fb.array([]),
          },
          valueDelivery: {
            costReductionPercent: valueData?.costReductionPercent || null,
            costReductionValue: valueData?.costReductionValue || null,
            costReductionRemarks: valueData?.costReductionRemarks || '',
            operatingEfficiencyValue: valueData?.operatingEfficiencyValue || null,
            operatingEfficiencyPercent: valueData?.operatingEfficiencyPercent || null,
            operatingEfficiencyRemarks: valueData?.operatingEfficiencyRemarks || '',
            costAvoidanceValue: valueData?.costAvoidanceValue || null,
            costAvoidancePercent: valueData?.costAvoidancePercent || null,
            costAvoidanceRemarks: valueData?.costAvoidanceRemarks || '',
          },
          costSharing: {
            isCapex: valueData?.isCapex || false,
            isFixOpex: valueData?.isFixOpex || false,
            isVariableOpex: valueData?.isVariableOpex || false,
            isInventoryItems: valueData?.isInventoryItems || false,
            capexMethodology: valueData?.capexMethodology || '',
            fixOpexMethodology: valueData?.fixOpexMethodology || '',
            variableOpexMethodology: valueData?.variableOpexMethodology || '',
            inventoryItemsMethodology: valueData?.inventoryItemsMethodology || '',
            contractSpendCommitment: contractAwardDetails?.contractSpendCommitment || '',
          },
          costAllocation: patchValues.costAllocation,
        },{ emitEvent: true })
        setTimeout(() => {
          this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers, { emitEvent: false });
          this.generalInfoForm.get('generalInfo.psajv')?.setValue(allSelectedValues, { emitEvent: false });

          // Ensure form controls are created for all selected PSAs (in case they weren't created earlier)
          allSelectedValues.forEach((psaName: string) => {
            this.addPSAJVFormControls(psaName);
          });

          // Re-patch costAllocation values to ensure they're set after controls exist
          this.generalInfoForm.patchValue({
            costAllocation: patchValues.costAllocation
          }, { emitEvent: false });

          // IMPORTANT: Ensure percentage controls are enabled for all selected PSAs after patching
          // Also ensure checkboxes are set to true (fixes Shah Deniz and other PSAs not getting checked)
          allSelectedValues.forEach((psaName: string) => {
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
            if (percentageControl) {
              percentageControl.enable({ emitEvent: false });
            }
          });

          // Trigger calculations after values are patched
          this.setupPSACalculationsManually();

          // Set up listeners AFTER controls are enabled and values are set
          // Use a small delay to ensure form is stable
          setTimeout(() => {
            this.setupPSACalculations();
          }, 100);

          // Ensure purposeRequired field state is correct based on isChangeinApproachMarket
          const isChangeinApproachMarket = this.generalInfoForm.get('generalInfo.isChangeinApproachMarket')?.value;
          const purposeRequiredControl = this.generalInfoForm.get('generalInfo.purposeRequired');
          if (isChangeinApproachMarket === true) {
            purposeRequiredControl?.setValidators([Validators.required]);
            purposeRequiredControl?.enable();
          } else {
            purposeRequiredControl?.clearValidators();
            purposeRequiredControl?.disable();
          }
          purposeRequiredControl?.updateValueAndValidity();
          // Ensure prepayment fields are correctly enabled/disabled based on isPaymentRequired
          const isPaymentRequired = this.generalInfoForm.get('generalInfo.isPaymentRequired')?.value;
          const prePayAmountControl = this.generalInfoForm.get('generalInfo.prePayAmount');
          const prePayPercentControl = this.generalInfoForm.get('generalInfo.prePayPercent');
          if (isPaymentRequired === true) {
            prePayAmountControl?.enable();
            prePayPercentControl?.enable();
          } else {
            prePayAmountControl?.disable();
            prePayPercentControl?.disable();
          }
          this.isInitialLoad = false;
        }, 500)

        this.addRow(true);
        this.addSupplierTechnicalnRow(true);
        this.addBidRow(true);
        this.addConsultationRow(true, false, consultationsData);
        this.addCommericalEvaluationRow(true)
        this.setupPSAListeners()

        // Set consultation section visibility to true if there are consultation rows
        setTimeout(() => {
          if (this.consultationRows.length > 0) {
            this.sectionVisibility['section8'] = true;
          }
        }, 100);

        // Ensure consultation rows exist for all selected PSAs (in case API didn't return consultation data)
        setTimeout(() => {
          const selectedPSAs = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
          selectedPSAs.forEach((psaValue: string) => {
            const psaExists = this.consultationRows.controls.some(group =>
              group.get('psa')?.value === psaValue
            );
            if (!psaExists && psaValue) {
              this.addConsultationRowOnChangePSAJV(psaValue);
            }
          });
        }, 600);
        // Ensure High Risk Contract conditional fields are properly initialized
        setTimeout(() => {
          this.onHighRiskContractChange();
        }, 100);
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

  onSourcingTypeChange() {
    this.generalInfoForm.get('generalInfo.sourcingType')?.valueChanges.subscribe((value) => {
      const selectedType = this.sourcingTypeData.find(item => item.id === Number(value));
      this.isShowBenchmarking = !selectedType || selectedType.itemValue !== "Competitive Bid";
      // Re-evaluate committee checkboxes when sourcing type changes
      this.reEvaluateAllCommitteeCheckboxes();
    });
  }

  get generalInfo() {
    return this.generalInfoForm.get('generalInfo');
  }

  get procurementDetailsInfo() {
    return this.generalInfoForm.get('procurementDetails');
  }

  get additionalDetailsInfo() {
    return this.generalInfoForm.get('additionalDetails');
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

    const {FormatPainter} = cloud.CKEditorPremiumFeatures;

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
        viewportOffset: {top: 50, bottom: 50}  // Adjust editor's viewport
      }
    };
  }

  scrollToSection(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const section = document.getElementById(selectedValue);

    if (section) {
      // Set section visibility to true when selected from dropdown
      this.sectionVisibility[selectedValue] = true;
      section.scrollIntoView({behavior: 'smooth', block: 'start'});
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
        matchingLabel.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    }, 500); // Adjust delay as needed
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
              this.currenciesData = response.data || [];
              break;

            case 'Global CGB':
              this.globalCGBData = response.data || [];
              break;

            case 'Operating Functions':
              this.operatingFunctionsData = response.data || [];
              break;

            case 'Proposed CML':
              this.proposedCMLData = response.data || [];
              break;

            case 'PSA':
              this.psaData = (response.data || []).filter(item => item.isActive);
              // Populate psaJvOptions dynamically from PSA data
              this.psaJvOptions = this.psaData.map(item => ({
                value: item.itemValue,
                label: item.itemValue
              }));
              break;

            case 'Remuneration Type':
              this.remunerationTypeData = response.data || [];
              break;

            case 'Sourcing Rigor':
              this.sourcingRigorData = response.data || [];
              break;

            case 'Sourcing Type':
              this.sourcingTypeData = response.data || [];
              break;

            case 'Subsector':
              this.subsectorData = response.data || [];
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
          this.incrementAndCheck();
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  fetchApprovedPapersForMapping() {
    this.paperService.getApprovedPapersForMapping().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          if(response.data && response.data.length > 0) {
            // Filter by paper type and exclude Draft/Withdrawn
            this.paperMappingData = response.data.filter((item) =>
              item.paperType == "Approach to Market"
            );

            // Create formatted options for Select2
            // Format: "CGB ref number, Value, Title (first 50 symbols), Date"
            this.cgbAtmRefOptions = this.paperMappingData
              .filter((item) => item.cgbItemRefNo != null) // Filter out items with null cgbItemRefNo
              .map((item) => {
                const refNo = item.cgbItemRefNo?.toString() || '';
                const title = item.paperSubject ? (item.paperSubject.length > 50 ? item.paperSubject.substring(0, 50) + '...' : item.paperSubject) : '';
                const date = item.entryDate ? new Date(item.entryDate).toLocaleDateString() : '';
                // Note: Value field might not be available in PaperMappingType, using placeholder for now
                // This can be updated when API provides contractValue/totalContractValue field

                // Format label to include Ref#, Value, Title, Date for dropdown display
                // Select2 will automatically search through the label text
                const label = `${refNo}, ${title}, ${date}`;

                return {
                  value: refNo,
                  label: label
                };
              });
          }
          this.incrementAndCheck();
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }


  // Handle CGB ATM Ref selection - Select2 will store the value (Ref. No)
  onCgbAtmRefSelected(event: any) {
    // The form control already has the value set (Ref. No as string)
    // Select2 will display the label in dropdown, but we can customize if needed
  }

  // Get the selected display value for form control (just Ref. No)
  getSelectedCgbAtmRefDisplay(): string {
    const selectedValue = this.generalInfoForm.get('generalInfo.cgbAtmRefNo')?.value;
    if (!selectedValue) return '';
    // Return just the Ref. No (which is the value)
    return selectedValue.toString();
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

  loadCountry() {
    this.countryService.getCountryDetails().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {

          this.countryDetails = reponse.data || [];
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

  loadVendoreDetails() {

    this.vendorService.getVendorDetailsList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          this.vendorList = reponse.data.filter(vendor => vendor.isActive);
          console.log('vendor:', this.vendorList);
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

  getVendorsWithTechnicalGo() {
    // Get all vendor IDs that have Technical Go/No Go = Yes
    const technicalGoVendorIds = new Set<number>();

    this.supplierTechnical.controls.forEach(control => {
      const vendorId = control.get('vendorId')?.value;
      const isTechnical = control.get('isTechnical')?.value;

      // Only include vendors where isTechnical is true
      if (vendorId && isTechnical === true) {
        technicalGoVendorIds.add(Number(vendorId));
      }
    });

    // Filter vendorList to only include vendors with Technical Go = Yes
    return this.vendorList
      .filter(vendor => technicalGoVendorIds.has(vendor.id))
      .map(vendor => ({
        value: vendor.id,
        label: vendor.legalName
      }));
  }

  onVendorSelectionChange(rowIndex: number, formArray?: string) {
    let row: any;

    // Determine which form array to use
    if (formArray === 'supplierTechnical') {
      row = this.supplierTechnical.at(rowIndex);
    } else if (formArray === 'commericalEvaluation') {
      row = this.commericalEvaluation.at(rowIndex);
    } else {
      row = this.inviteToBid.at(rowIndex);
    }

    const legalNameControl = row.get('legalName');
    const isLocalOrJVControl = row.get('isLocalOrJV');

    // Get the value from the form control instead of the event
    const selectedValue = row.get('vendorId')?.value;

    const vendorIdNum = Number(selectedValue);
    if (vendorIdNum && !isNaN(vendorIdNum)) {
      const selectedVendor = this.vendorList.find(vendor => vendor.id === vendorIdNum);
      if (selectedVendor) {
        // Set legal name
        if (legalNameControl) {
          legalNameControl.setValue(selectedVendor.legalName || selectedVendor.vendorName);
        }
        
        // Auto-populate Local/JV checkbox based on isCGBRegistered and make it read-only (only for inviteToBid)
        if (formArray !== 'supplierTechnical' && formArray !== 'commericalEvaluation' && isLocalOrJVControl) {
          isLocalOrJVControl.setValue(selectedVendor.isCGBRegistered || false);
          isLocalOrJVControl.disable();
        }
      }
    } else {
      // Clear fields when no vendor is selected and enable them
      if (legalNameControl) {
      legalNameControl.setValue('');
      }
      if (formArray !== 'supplierTechnical' && formArray !== 'commericalEvaluation' && isLocalOrJVControl) {
        isLocalOrJVControl.setValue(false);
        isLocalOrJVControl.enable();
      }
    }
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
      const contractValue = this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value || 0;

      if (percentageValue >= 0 && percentageValue <= 100) {
        const calculatedValue = (percentageValue / 100) * contractValue;
        this.generalInfoForm.get(`costAllocation.${valueControlName}`)?.setValue(calculatedValue, { emitEvent: false });
        this.calculateTotal()
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
        // Ensure control is enabled before subscribing
        if (percentageControl.disabled) {
          percentageControl.enable({ emitEvent: false });
        }

        // Check if subscription already exists to prevent duplicates
        if (!(percentageControl as any)._psaCalculationSubscribed) {
          // Mark as subscribed to prevent duplicate subscriptions
          (percentageControl as any)._psaCalculationSubscribed = true;

          percentageControl.valueChanges.subscribe((percentageValue) => {
            const contractValue = this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value || 0;

            if (percentageValue !== null && percentageValue !== undefined && percentageValue !== '') {
              const percentageNum = Number(percentageValue);
              if (!isNaN(percentageNum) && percentageNum >= 0 && percentageNum <= 100) {
                const calculatedValue = (percentageNum / 100) * contractValue;
                valueControl.setValue(calculatedValue, { emitEvent: false });
                this.calculateTotal();

                // Trigger committee logic after value is updated
                this.triggerCommitteeLogicForPSA(psaName);
              }
            }
          });
        }
      }
    });
  }

  /**
   * Evaluate thresholds and determine if committee checkbox should be checked
   * Template 2 (Contract): Same logic as Template 1
   */
  evaluateThreshold(psaName: string, checkboxType: string, byValue: number): boolean {
    const sourcingTypeId = Number(this.generalInfoForm.get('generalInfo.sourcingType')?.value) || 0;
    const psaAgreementId = this.getPSAAgreementId(psaName);
    const paperType = 'Contract Award'; // For Template 2

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

    // Check specific Paper Type + Sourcing Type + Committee combinations and get the selected threshold
    const selectedThreshold = this.checkCommitteeConditions(paperType, sourcingTypeId, checkboxType, relevantThresholds);

    if (!selectedThreshold) {
      console.log(`Committee conditions not met for ${psaName} - ${checkboxType}`);
      return false;
    }



    // Template 2 (Contract): Use ByValue > threshold (same as Template 1)
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

  setupMethodologyListeners() {
    const controls = [
      { checkbox: 'isCapex', methodology: 'capexMethodology' },
      { checkbox: 'isFixOpex', methodology: 'fixOpexMethodology' },
      { checkbox: 'isInventoryItems', methodology: 'inventoryItemsMethodology' },
      { checkbox: 'isVariableOpex', methodology: 'variableOpexMethodology' }
    ];

    controls.forEach(({ checkbox, methodology }) => {
      const checkboxControl = this.generalInfoForm.get(`costSharing.${checkbox}`);
      const methodControl = this.generalInfoForm.get(`costSharing.${methodology}`);

      if (!checkboxControl || !methodControl) return;

      const hasInitialValue = !!methodControl.value;

      // Set initial checkbox state
      checkboxControl.setValue(hasInitialValue, { emitEvent: false });

      // Methodology fields should always be enabled so users can select radio buttons
      methodControl.enable({ emitEvent: false });

      // Enable checkbox if method has value
      if (hasInitialValue) {
        checkboxControl.enable({ emitEvent: false });
      }

      // Watch methodology field changes - when radio button is selected, auto-check checkbox
      methodControl.valueChanges.subscribe((value) => {
        const hasValue = value !== null && value !== undefined && value !== '';
        checkboxControl.setValue(hasValue, { emitEvent: false });

        if (hasValue) {
          checkboxControl.enable({ emitEvent: false });
        }
      });

      // Watch checkbox changes (only uncheck allowed - clears methodology)
      checkboxControl.valueChanges.subscribe((checked) => {
        if (!checked && methodControl.value) {
          methodControl.setValue(null, { emitEvent: false });
        }
      });
    });
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

    // Setup validation for Operating Efficiency
    const checkOperatingEfficiencyRemarks = () => {
      const percent = valueDeliveryGroup.get('operatingEfficiencyPercent')?.value;
      const value = valueDeliveryGroup.get('operatingEfficiencyValue')?.value;
      const remarksControl = valueDeliveryGroup.get('operatingEfficiencyRemarks');

      const hasValue = (percent !== null && percent !== undefined && percent !== '') ||
                      (value !== null && value !== undefined && value !== '');

      if (hasValue) {
        remarksControl?.setValidators([Validators.required]);
      } else {
        remarksControl?.clearValidators();
      }
      remarksControl?.updateValueAndValidity();
    };

    // Setup validation for Cost Avoidance
    const checkCostAvoidanceRemarks = () => {
      const percent = valueDeliveryGroup.get('costAvoidancePercent')?.value;
      const value = valueDeliveryGroup.get('costAvoidanceValue')?.value;
      const remarksControl = valueDeliveryGroup.get('costAvoidanceRemarks');

      const hasValue = (percent !== null && percent !== undefined && percent !== '') ||
                      (value !== null && value !== undefined && value !== '');

      if (hasValue) {
        remarksControl?.setValidators([Validators.required]);
      } else {
        remarksControl?.clearValidators();
      }
      remarksControl?.updateValueAndValidity();
    };

    // Subscribe to changes for Cost Reduction
    valueDeliveryGroup.get('costReductionValue')?.valueChanges.subscribe(() => {
      checkCostReductionValidation();
    });

    // Subscribe to changes for Operating Efficiency
    valueDeliveryGroup.get('operatingEfficiencyPercent')?.valueChanges.subscribe(() => {
      checkOperatingEfficiencyRemarks();
    });
    valueDeliveryGroup.get('operatingEfficiencyValue')?.valueChanges.subscribe(() => {
      checkOperatingEfficiencyRemarks();
    });

    // Subscribe to changes for Cost Avoidance
    valueDeliveryGroup.get('costAvoidancePercent')?.valueChanges.subscribe(() => {
      checkCostAvoidanceRemarks();
    });
    valueDeliveryGroup.get('costAvoidanceValue')?.valueChanges.subscribe(() => {
      checkCostAvoidanceRemarks();
    });

    // Check initial state
    checkCostReductionValidation();
    checkOperatingEfficiencyRemarks();
    checkCostAvoidanceRemarks();
  }

  // Exchange rate is always manually entered - no automatic updates

  updateContractValueOriginalCurrency() {
    const contractValueUsd = Number(this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value) || 0;
    const exchangeRate = Number(this.generalInfoForm.get('generalInfo.exchangeRate')?.value) || 0;

    const convertedValue = contractValueUsd * exchangeRate;
    this.generalInfoForm.get('generalInfo.contractValue')?.setValue(convertedValue);
  }

  updateLegalEntityContractValue(index: number) {
    const row = this.inviteToBid.at(index);
    if (!row) return;

    const totalAwardValueUSD = Number(row.get('totalAwardValueUSD')?.value) || 0;
    const exchangeRate = Number(row.get('exchangeRate')?.value) || 0;

    const contractValue = totalAwardValueUSD * exchangeRate;
    row.get('contractValue')?.setValue(contractValue, { emitEvent: false });
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

  onLTCCChange() {
    this.generalInfoForm.get('generalInfo.isLTCC')?.valueChanges.subscribe((value) => {
      const ltccNotesControl = this.generalInfoForm.get('generalInfo.ltccNotes');

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

  onPrepaymentChange() {
    this.generalInfoForm.get('generalInfo.isPaymentRequired')?.valueChanges.subscribe((value) => {
      const prePayAmount = this.generalInfoForm.get('generalInfo.prePayAmount');
      const prePayPercent = this.generalInfoForm.get('generalInfo.prePayPercent');

      if (value === true) {
        // Enable fields and set validators
        prePayAmount?.enable();
        prePayPercent?.enable();
        prePayAmount?.setValidators([Validators.required]);
        prePayPercent?.setValidators([Validators.required]);
      } else {
        // Disable fields and clear validators
        prePayAmount?.disable();
        prePayPercent?.disable();
        prePayAmount?.clearValidators();
        prePayPercent?.clearValidators();
        // Clear values when disabled
        prePayAmount?.setValue(null, { emitEvent: false });
        prePayPercent?.setValue(null, { emitEvent: false });
      }

      prePayAmount?.updateValueAndValidity();
      prePayPercent?.updateValueAndValidity();
    });

    // Handle initial state
    const initialValue = this.generalInfoForm.get('generalInfo.isPaymentRequired')?.value;
    const prePayAmount = this.generalInfoForm.get('generalInfo.prePayAmount');
    const prePayPercent = this.generalInfoForm.get('generalInfo.prePayPercent');

    if (initialValue === true) {
      prePayAmount?.enable();
      prePayPercent?.enable();
    } else {
      prePayAmount?.disable();
      prePayPercent?.disable();
    }

    // Setup automatic calculation when % changes
    this.generalInfoForm.get('generalInfo.prePayPercent')?.valueChanges.subscribe((percent) => {
      // Skip if disabled or no value
      if (prePayPercent?.disabled || percent === null || percent === undefined || percent === '') {
        return;
      }

      const totalValue = Number(this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value) || 0;
      if (totalValue > 0 && percent >= 0 && percent <= 100) {
        const calculatedAmount = (Number(percent) / 100) * totalValue;
        // Update amount without triggering its valueChanges to avoid circular calculation
        prePayAmount?.setValue(calculatedAmount, { emitEvent: false });
      }
    });

    // Setup automatic calculation when $ changes
    this.generalInfoForm.get('generalInfo.prePayAmount')?.valueChanges.subscribe((amount) => {
      // Skip if disabled or no value
      if (prePayAmount?.disabled || amount === null || amount === undefined || amount === '') {
        return;
      }

      const totalValue = Number(this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value) || 0;
      if (totalValue > 0 && Number(amount) >= 0) {
        const calculatedPercent = (Number(amount) / totalValue) * 100;
        // Update percent without triggering its valueChanges to avoid circular calculation
        prePayPercent?.setValue(Math.min(100, Math.max(0, calculatedPercent)), { emitEvent: false });
      }
    });
  }

  currencyLinkedChange() {
    this.generalInfoForm.get('additionalDetails.contractCurrencyLinktoBaseCost')?.valueChanges.subscribe((value) => {
      const explanationsControl = this.generalInfoForm.get('additionalDetails.explanationsforBaseCost');

      if (value === false) {
        explanationsControl?.setValidators([Validators.required]);
        explanationsControl?.enable();
      } else {
        explanationsControl?.clearValidators();
        explanationsControl?.disable(); // <- disables the field
      }

      explanationsControl?.updateValueAndValidity();
    });
  }

  conflictIntrestChanges() {
    this.generalInfoForm.get('procurementDetails.isConflictOfInterest')?.valueChanges.subscribe((value) => {
      const conflictOfInterestCommentControl = this.generalInfoForm.get('procurementDetails.conflictOfInterestComment');

      if (value === true) {
        conflictOfInterestCommentControl?.setValidators([Validators.required]);
        conflictOfInterestCommentControl?.enable();
      } else {
        conflictOfInterestCommentControl?.clearValidators();
        conflictOfInterestCommentControl?.disable();
      }

      conflictOfInterestCommentControl?.updateValueAndValidity();
    });
  }

  restrospectiveChanges() {
    this.generalInfoForm.get('procurementDetails.isRetrospectiveApproval')?.valueChanges.subscribe((value) => {
      const conflictOfInterestCommentControl = this.generalInfoForm.get('procurementDetails.retrospectiveApprovalReason');

      if (value === true) {
        conflictOfInterestCommentControl?.setValidators([Validators.required]);
        conflictOfInterestCommentControl?.enable();
      } else {
        conflictOfInterestCommentControl?.clearValidators();
        conflictOfInterestCommentControl?.disable();
      }

      conflictOfInterestCommentControl?.updateValueAndValidity();
    });
  }

  onHighRiskContractChange() {
    const initialValue = this.generalInfoForm.get('ccd.isHighRiskContract')?.value;
    const highRiskExplanationControl = this.generalInfoForm.get('ccd.highRiskExplanation');
    const flagRaisedCDDControl = this.generalInfoForm.get('ccd.flagRaisedCDD');
    const additionalCDDControl = this.generalInfoForm.get('ccd.additionalCDD');

    if (initialValue === true) {
      highRiskExplanationControl?.setValidators([Validators.required]);
      flagRaisedCDDControl?.setValidators([Validators.required]);
      additionalCDDControl?.setValidators([Validators.required]);
      highRiskExplanationControl?.enable();
      flagRaisedCDDControl?.enable();
      additionalCDDControl?.enable();
      highRiskExplanationControl?.updateValueAndValidity();
      flagRaisedCDDControl?.updateValueAndValidity();
      additionalCDDControl?.updateValueAndValidity();
    }

    this.generalInfoForm.get('ccd.isHighRiskContract')?.valueChanges.subscribe((value) => {
      if (value === true) {
        highRiskExplanationControl?.setValidators([Validators.required]);
        flagRaisedCDDControl?.setValidators([Validators.required]);
        additionalCDDControl?.setValidators([Validators.required]);
        highRiskExplanationControl?.enable();
        flagRaisedCDDControl?.enable();
        additionalCDDControl?.enable();
      } else {
        highRiskExplanationControl?.clearValidators();
        flagRaisedCDDControl?.clearValidators();
        additionalCDDControl?.clearValidators();
        highRiskExplanationControl?.disable();
        flagRaisedCDDControl?.disable();
        additionalCDDControl?.disable();
        highRiskExplanationControl?.setValue('', { emitEvent: false });
        flagRaisedCDDControl?.setValue('', { emitEvent: false });
        additionalCDDControl?.setValue('', { emitEvent: false });
      }
      highRiskExplanationControl?.updateValueAndValidity();
      flagRaisedCDDControl?.updateValueAndValidity();
      additionalCDDControl?.updateValueAndValidity();
    });
  }

  onChangeInApproachMarketChange() {
    // Handle initial value
    const initialValue = this.generalInfoForm.get('generalInfo.isChangeinApproachMarket')?.value;
    const purposeRequiredControl = this.generalInfoForm.get('generalInfo.purposeRequired');

    if (initialValue === true) {
      purposeRequiredControl?.setValidators([Validators.required]);
      purposeRequiredControl?.enable();
      purposeRequiredControl?.updateValueAndValidity();
    }

    // Subscribe to changes
    this.generalInfoForm.get('generalInfo.isChangeinApproachMarket')?.valueChanges.subscribe((value) => {
      if (value === true) {
        purposeRequiredControl?.setValidators([Validators.required]);
        purposeRequiredControl?.enable();
      } else {
        purposeRequiredControl?.clearValidators();
        purposeRequiredControl?.disable();
      }

      purposeRequiredControl?.updateValueAndValidity();
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

  setPaperStatus(status: string, callAPI: boolean = true): void {
    if (!this.paperStatusList?.length) return; // Check if list exists & is not empty

    this.paperStatusId = this.paperStatusList.find(item => item.paperStatus === status)?.id ?? null;
    this.currentPaperStatus = this.paperStatusList.find(item => item.paperStatus === status)?.paperStatus ?? null;

    if (callAPI && this.paperId && this.paperStatusId) {
      // For template2, paperDetails structure is different - use contractAwardDetails
      const existingStatusId = this.paperDetails?.contractAwardDetails?.paperStatusId ||
                               this.paperDetails?.paperDetails?.paperStatusId ||
                               null;

      this.paperConfigService.updateMultiplePaperStatus([{
        paperId: this.paperId,
        existingStatusId: existingStatusId,
        statusId: this.paperStatusId
      }]).subscribe({
        next: (value) => {
          this.toastService.show('Paper has been moved to ' + status);
          this.router.navigate(['/paperconfiguration']);
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
      console.log("==this.generalInfoForm?.value?", this.generalInfoForm)

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

        // Check Operating Efficiency
        const operatingEfficiencyPercent = valueDeliveryGroup.get('operatingEfficiencyPercent')?.value;
        const operatingEfficiencyValue = valueDeliveryGroup.get('operatingEfficiencyValue')?.value;
        const operatingEfficiencyRemarks = valueDeliveryGroup.get('operatingEfficiencyRemarks');
        const hasOperatingEfficiencyValue = (operatingEfficiencyPercent !== null && operatingEfficiencyPercent !== undefined && operatingEfficiencyPercent !== '') ||
                                           (operatingEfficiencyValue !== null && operatingEfficiencyValue !== undefined && operatingEfficiencyValue !== '');
        if (hasOperatingEfficiencyValue) {
          operatingEfficiencyRemarks?.setValidators([Validators.required]);
        } else {
          operatingEfficiencyRemarks?.clearValidators();
        }
        operatingEfficiencyRemarks?.updateValueAndValidity();

        // Check Cost Avoidance
        const costAvoidancePercent = valueDeliveryGroup.get('costAvoidancePercent')?.value;
        const costAvoidanceValue = valueDeliveryGroup.get('costAvoidanceValue')?.value;
        const costAvoidanceRemarks = valueDeliveryGroup.get('costAvoidanceRemarks');
        const hasCostAvoidanceValue = (costAvoidancePercent !== null && costAvoidancePercent !== undefined && costAvoidancePercent !== '') ||
                                     (costAvoidanceValue !== null && costAvoidanceValue !== undefined && costAvoidanceValue !== '');
        if (hasCostAvoidanceValue) {
          costAvoidanceRemarks?.setValidators([Validators.required]);
        } else {
          costAvoidanceRemarks?.clearValidators();
        }
        costAvoidanceRemarks?.updateValueAndValidity();
      }

      // Trigger validation checks for High Risk Contract CDD fields before marking as touched
      const ccdGroup = this.generalInfoForm.get('ccd');
      if (ccdGroup) {
        const isHighRiskContract = ccdGroup.get('isHighRiskContract')?.value;
        const highRiskExplanationControl = ccdGroup.get('highRiskExplanation');
        const flagRaisedCDDControl = ccdGroup.get('flagRaisedCDD');
        const additionalCDDControl = ccdGroup.get('additionalCDD');

        if (isHighRiskContract === true) {
          // Ensure validators are set and fields are enabled
          highRiskExplanationControl?.setValidators([Validators.required]);
          flagRaisedCDDControl?.setValidators([Validators.required]);
          additionalCDDControl?.setValidators([Validators.required]);
          highRiskExplanationControl?.enable({ emitEvent: false });
          flagRaisedCDDControl?.enable({ emitEvent: false });
          additionalCDDControl?.enable({ emitEvent: false });
          highRiskExplanationControl?.updateValueAndValidity();
          flagRaisedCDDControl?.updateValueAndValidity();
          additionalCDDControl?.updateValueAndValidity();
        } else {
          // Clear validators and disable fields if not high risk
          highRiskExplanationControl?.clearValidators();
          flagRaisedCDDControl?.clearValidators();
          additionalCDDControl?.clearValidators();
          highRiskExplanationControl?.updateValueAndValidity();
          flagRaisedCDDControl?.updateValueAndValidity();
          additionalCDDControl?.updateValueAndValidity();
        }
      }

      // Mark all invalid form controls as touched to show validation errors
      this.markFormGroupTouched(this.generalInfoForm);

      // Mark all date fields in legal entities array as touched
      this.inviteToBid.controls.forEach((control) => {
        const startDateControl = control.get('contractStartDate');
        const endDateControl = control.get('contractEndDate');
        const legalNameControl = control.get('legalName');
        if (startDateControl && startDateControl.invalid) {
          startDateControl.markAsTouched();
        }
        if (endDateControl && endDateControl.invalid) {
          endDateControl.markAsTouched();
        }
        if (legalNameControl && legalNameControl.invalid) {
          legalNameControl.markAsTouched();
        }
      });

      // Mark all form arrays as touched
      this.markFormArrayTouched(this.riskMitigation);
      this.markFormArrayTouched(this.commericalEvaluation);
      this.markFormArrayTouched(this.supplierTechnical);
      this.markFormArrayTouched(this.consultationRows);

      // Mark supplier technical fields as touched
      this.supplierTechnical.controls.forEach((control) => {
        const legalNameControl = control.get('legalName');
        const thresholdPercentControl = control.get('thresholdPercent');
        const technicalScorePercentControl = control.get('technicalScorePercent');
        const resultOfHSSEControl = control.get('resultOfHSSE');
        if (legalNameControl && legalNameControl.invalid) {
          legalNameControl.markAsTouched();
        }
        if (thresholdPercentControl && thresholdPercentControl.invalid) {
          thresholdPercentControl.markAsTouched();
        }
        if (technicalScorePercentControl && technicalScorePercentControl.invalid) {
          technicalScorePercentControl.markAsTouched();
        }
        if (resultOfHSSEControl && resultOfHSSEControl.invalid) {
          resultOfHSSEControl.markAsTouched();
        }
      });

      // Check if form is valid
      if (this.generalInfoForm.invalid) {
        this.toastService.show("Please fill all required fields", "danger");
        return;
      }
    }

    const generalInfoValue = this.generalInfoForm?.value?.generalInfo
    const procurementValue = this.generalInfoForm?.value?.procurementDetails
    const ccdValue = this.generalInfoForm?.value?.ccd
    const additionalDetailsValue = this.generalInfoForm?.value?.additionalDetails
    const evaluationSummaryValue = this.generalInfoForm?.value?.evaluationSummary

    const costSharingValues = this.generalInfoForm?.value?.costSharing
    const valueDeliveryValues = this.generalInfoForm?.value?.valueDelivery
    const costAllocationValues = this.generalInfoForm?.getRawValue()?.costAllocation // Use getRawValue to include disabled controls
    const consultationsValue = this.consultationRows.controls
      .filter(group => group.valid)
      .map(group => {
        const rawValue = group.getRawValue();
        return {
          id: rawValue.id || 0,
          psa: rawValue.psa || "",
          technicalCorrect: rawValue.technicalCorrect || 0,
          budgetStatement: rawValue.budgetStatement || 0,
          jvReview: rawValue.jvReview || 0,
          isJVReviewDone: rawValue.jvAligned || false
        };
      })

    // Build costAllocationJVApproval from costAllocation FormGroup (like template3)
    // Mapping PSAs from the costAllocation object dynamically
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
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

    const filteredRisks = this.riskMitigation.controls
      .filter(group => group.valid)
      .map((group, index) => ({
        ...group.value,
        srNo: (index + 1).toString().padStart(3, '0')
      }));


    const filteredBids = this.inviteToBid.controls
      .filter(group => group.valid)
      .map(group => group.getRawValue()); // Use getRawValue to include disabled fields

    const filterSupplierTechnical = this.supplierTechnical.controls
      .filter(group => group.valid)
      .map(group => ({
        id: group.value.id || 0,
        vendorId: group.value.vendorId || 0,
        thresholdPercent: group.value.thresholdPercent || 0,
        isTechnical: group.value.isTechnical || false,
        technicalScorePercent: group.value.technicalScorePercent || 0,
        resultOfHSSE: group.value.resultOfHSSE || "",
        commentary: group.value.commentary || ""
      }));

    const filterCommericalEvaluation = this.commericalEvaluation.controls
      .filter(group => group.valid)
      .map(group => ({
        id: group.value.id || 0,
        vendorId: group.value.vendorId || 0,
        totalValue: group.value.totalValue || 0
      }));


    const params = {
      papers: {
        ...(this.paperId && !this.isCopy ? {id: Number(this.paperId)} : {id: 0}),
        paperStatusId: this.paperStatusId,
        paperProvision: generalInfoValue?.paperProvision || "",
        purposeRequired: generalInfoValue?.paperProvision || "",
        isActive: true,
        bltMember: generalInfoValue?.bltMember || 0,
        camUserId: generalInfoValue?.camUserId || 0,
        vP1UserId: generalInfoValue?.vP1UserId || 0,
        pdManagerName: generalInfoValue?.pdManagerName || 0,
        procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "",
        cgbItemRefNo: generalInfoValue?.cgbItemRefNo || "",
        cgbCirculationDate: generalInfoValue?.cgbCirculationDate || null,
        globalCGB: generalInfoValue?.globalCGB || "",
        subSector: generalInfoValue?.subSector || "",
        operatingFunction: generalInfoValue?.operatingFunction || "",
        sourcingType: generalInfoValue?.sourcingType || "",
        isPHCA: generalInfoValue?.isPHCA || false,
        psajv: generalInfoValue?.psajv?.join(',') || "",
        totalAwardValueUSD: Number(generalInfoValue?.totalAwardValueUSD) || 0,
        contractValue: Number(generalInfoValue?.totalAwardValueUSD) || 0,
        currencyCode: generalInfoValue?.currencyCode || "",
        exchangeRate: generalInfoValue?.exchangeRate || 0,
        isLTCC: generalInfoValue?.isLTCC || false,
        ltccNotes: generalInfoValue?.ltccNotes || "",
        isGovtReprAligned: generalInfoValue?.isGovtReprAligned || false,
        govtReprAlignedComment: generalInfoValue?.govtReprAlignedComment || "",
        isIFRS16: generalInfoValue?.isIFRS16 || false,
        isConflictOfInterest: procurementValue?.isConflictOfInterest || false,
        conflictOfInterestComment: procurementValue?.conflictOfInterestComment || "",
        remunerationType: generalInfoValue?.remunerationType || "",
        contractNo: generalInfoValue?.contractNo || "",
        isRetrospectiveApproval: procurementValue?.isRetrospectiveApproval || false,
        retrospectiveApprovalReason: procurementValue?.retrospectiveApprovalReason || "",
        isGIAAPCheck: generalInfoValue?.isGIAAPCheck || false,
        cgbApprovalDate: generalInfoValue?.cgbApprovalDate || null,
        isHighRiskContract: ccdValue?.isHighRiskContract || false,
        cddCompleted: ccdValue?.cddCompleted || null,
        highRiskExplanation: ccdValue?.highRiskExplanation || "",
        flagRaisedCDD: ccdValue?.flagRaisedCDD || "",
        additionalCDD: ccdValue?.additionalCDD || ""
      },
      contractAward: {
        ...(this.paperId && !this.isCopy ? {id: Number(this.paperId)} : {id: 0}),
        cgbAtmRefNo: generalInfoValue?.cgbAtmRefNo || null,
        contactNo: generalInfoValue?.contactNo || "",
        isChangeinApproachMarket: generalInfoValue?.isChangeinApproachMarket || false,
        isPaymentRequired: generalInfoValue?.isPaymentRequired || false,
        prePayPercent: generalInfoValue?.prePayPercent || 0,
        prePayAmount: generalInfoValue?.prePayAmount || 0,
        workspaceNo: generalInfoValue?.workspaceNo || "",
        isSplitAward: generalInfoValue?.isSplitAward || false,
        supplierAwardRecommendations: procurementValue?.supplierAwardRecommendations || "",
        nationalContent: procurementValue?.nationalContent || "",
        invitedBidders: evaluationSummaryValue?.invitedBidders || 0,
        submittedBids: evaluationSummaryValue?.submittedBids || 0,
        previousContractLearning: evaluationSummaryValue?.previousContractLearning || "",
        performanceImprovements: evaluationSummaryValue?.performanceImprovements || "",
        benchMarking: evaluationSummaryValue?.benchMarking || "",
        contractualControls: additionalDetailsValue?.contractualControls || "",
        contractCurrencyLinktoBaseCost: additionalDetailsValue?.contractCurrencyLinktoBaseCost || false,
        explanationsforBaseCost: additionalDetailsValue?.explanationsforBaseCost || "",
        contractSpendCommitment: costSharingValues?.contractSpendCommitment || "",
        previousSupplierSpendInfo: evaluationSummaryValue?.previousSupplierSpendInfo || ""
      },
      consultations: consultationsValue || [],
      valueDeliveriesCostSharings: {
        ...(this.paperId && !this.isCopy ? {id: Number(this.paperId)} : {id: 0}),
        costReductionValue: valueDeliveryValues?.costReductionValue || 0,
        costReductionPercent: valueDeliveryValues?.costReductionPercent || 0,
        costReductionRemarks: valueDeliveryValues?.costReductionRemarks || "",
        operatingEfficiencyValue: valueDeliveryValues?.operatingEfficiencyValue || 0,
        operatingEfficiencyPercent: valueDeliveryValues?.operatingEfficiencyPercent || 0,
        operatingEfficiencyRemarks: valueDeliveryValues?.operatingEfficiencyRemarks || "",
        costAvoidanceValue: valueDeliveryValues?.costAvoidanceValue || 0,
        costAvoidancePercent: valueDeliveryValues?.costAvoidancePercent || 0,
        costAvoidanceRemarks: valueDeliveryValues?.costAvoidanceRemarks || "",
        capexMethodology: costSharingValues?.capexMethodology || "",
        fixOpexMethodology: costSharingValues?.fixOpexMethodology || "",
        variableOpexMethodology: costSharingValues?.variableOpexMethodology || "",
        inventoryItemsMethodology: costSharingValues?.inventoryItemsMethodology || ""
      },
      legalEntitiesAwarded: filteredBids || [],
      riskMitigation: filteredRisks || [],
      commericalEvaluation: filterCommericalEvaluation || [],
      supplierTechnical: filterSupplierTechnical || [],
      jvApproval: {
        ...(this.paperId && !this.isCopy ? {id: Number(this.paperId)} : {id: 0}),
        contractCommittee_SDCC: costAllocationValues?.contractCommittee_SDCC || false,
        contractCommittee_BTC_CCInfoNote: costAllocationValues?.contractCommittee_BTC_CCInfoNote || false,
        contractCommittee_ShAsimanValue: 0,
        contractCommittee_SCP_Co_CC: costAllocationValues?.contractCommittee_SCP_Co_CC || false,
        contractCommittee_SCP_Co_CCInfoNote: costAllocationValues?.contractCommittee_SCP_Co_CCInfoNote || false,
        contractCommittee_BPGroupValue: 0,
        contractCommittee_BTC_CC: costAllocationValues?.contractCommittee_BTC_CC || false,
        contractCommittee_CGB: costAllocationValues?.contractCommittee_CGB || false,
        coVenturers_CMC: costAllocationValues?.coVenturers_CMC || false,
        coVenturers_SDMC: costAllocationValues?.coVenturers_SDMC || false,
        coVenturers_SCP: costAllocationValues?.coVenturers_SCP || false,
        coVenturers_SCP_Board: costAllocationValues?.coVenturers_SCP_Board || false,
        steeringCommittee_SC: costAllocationValues?.steeringCommittee_SC || false
      },
      costAllocationJVApproval: costAllocationJVApproval || []
    }

    if (this.generalInfoForm.valid && this.currentPaperStatus === "Registered") {
      const isPassedCheck = this.checkThreshold(generalInfoValue?.totalAwardValueUSD || 0, Number(generalInfoValue?.sourcingType || 0))
      if (!isPassedCheck) {
        this.toastService.show('Contract value must meet or exceed the selected threshold.', 'danger');
        return;
      }

      this.generatePaper(params)

    } else if (this.currentPaperStatus === "Draft") {
      const updatedParams = cleanObject(params);

      this.generatePaper(updatedParams)
    }
  }

  generatePaper(params: any) {
    this.isSubmitting = true;
    this.paperService.upsertContractAward(params).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const docId = response.data.paperId || null
          this.uploadFiles(docId)
          this.deleteMultipleDocuments(docId)

          // Call setPaperStatus only if in edit mode and pendingStatus exists
          if (this.paperId && !this.isCopy && this.pendingStatus) {
            this.setPaperStatus(this.pendingStatus, true);
            this.pendingStatus = null; // Clear pending status
          }

          this.generalInfoForm.reset();
          this.submitted = false;
          this.toastService.show(response.message || "Added Successfully", 'success');
          setTimeout(() => {
            this.router.navigate(['/all-papers']);
          }, 1000);
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

  checkThreshold(value: number, type: number) {
    if (this.thresholdData && this.thresholdData.length > 0) {
      const data = this.thresholdData.find(item => item.paperType === "Contract Award" && item.sourcingType === type)
      return !(data && data.contractValueLimit > value);
    } else {
      return true
    }
  }

  get riskMitigation(): FormArray {
    return this.generalInfoForm.get('additionalDetails.riskMitigation') as FormArray;
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

  // Add a new risk row
  addRow(isFirst = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.riskMitigations || []
      const riskMitigationArray = this.riskMitigation;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData?.forEach((item: any, index: number) => {
        riskMitigationArray.push(
          this.fb.group({
            risks: [item.risks || ''],
            mitigations: [item.mitigations || ''],
            id: [item.id]
          })
        );
      });
    } else {
      this.riskMitigation.push(
        this.fb.group({
          risks: [''],
          mitigations: [''],
          id: [0]
        })
      );
    }
  }

  // Remove a risk row
  removeRow(index: number) {
    if (this.riskMitigation.length > 1) {
      this.riskMitigation.removeAt(index);
    }
  }

  get commericalEvaluation(): FormArray {
    return this.generalInfoForm.get('evaluationSummary.commericalEvaluation') as FormArray;
  }

  // Add a new risk row
  addCommericalEvaluationRow(isFirst = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.commericalEvaluation || []
      const riskMitigationArray = this.commericalEvaluation;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData?.forEach((item: any, index: number) => {
        // Try to find vendor by ID first, then by legalName
        let vendor = null;
        if (item.vendorId) {
          vendor = this.vendorList.find(v => v.id === item.vendorId);
        }
        if (!vendor && item.legalName) {
          vendor = this.vendorList.find(v => v.legalName === item.legalName);
        }

        const legalNameValue = item.legalName || vendor?.legalName || '';
        riskMitigationArray.push(
          this.fb.group({
            vendorId: [vendor?.id || item.vendorId || null],
            legalName: [legalNameValue, Validators.required],
            totalValue: [item.totalValue || 0, Validators.required],
            id: [item.id]
          })
        );
      });
    } else {
      this.commericalEvaluation.push(
        this.fb.group({
          vendorId: [null],
          legalName: ['', Validators.required],
          totalValue: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
          id: [0]
        })
      );
    }
  }

  // Remove a risk row
  removeCommericalEvaluation(index: number) {
    if (this.commericalEvaluation.length > 1) {
      this.commericalEvaluation.removeAt(index);
    }
  }

  get supplierTechnical(): FormArray {
    return this.generalInfoForm.get('evaluationSummary.supplierTechnical') as FormArray;
  }

  // Add a new risk row
  addSupplierTechnicalnRow(isFirst = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.supplierTechnical || []
      const riskMitigationArray = this.supplierTechnical;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData?.forEach((item: any, index: number) => {
        // Try to find vendor by ID first, then by legalName
        let vendor = null;
        if (item.vendorId) {
          vendor = this.vendorList.find(v => v.id === item.vendorId);
        }
        if (!vendor && item.legalName) {
          vendor = this.vendorList.find(v => v.legalName === item.legalName);
        }

        const legalNameValue = item.legalName || vendor?.legalName || '';
        const rowGroup = this.fb.group({
          vendorId: [vendor?.id || item.vendorId || null],
          legalName: [legalNameValue, Validators.required],
          resultOfHSSE: [item.resultOfHSSE, Validators.required],
          commentary: [item.commentary],
          thresholdPercent: [item.thresholdPercent],
          technicalScorePercent: [item.technicalScorePercent],
          isTechnical: [item.isTechnical],
          id: [item.id]
        });
        riskMitigationArray.push(rowGroup);

        // Update Technical Go/No Go based on loaded values
        setTimeout(() => {
          this.updateTechnicalGoNoGoForRow(rowGroup);
        }, 200);
      });
    } else {
      this.supplierTechnical.push(
        this.fb.group({
          vendorId: [null],
          legalName: ['', Validators.required],
          resultOfHSSE: ['', Validators.required],
          commentary: [''],
          thresholdPercent: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
          technicalScorePercent: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
          isTechnical: [false],
          id: [0]
        })
      );
    }
  }

  // Remove a risk row
  removeSupplierTechnical(index: number) {
    if (this.supplierTechnical.length > 1) {
      this.supplierTechnical.removeAt(index);
    }
  }

  setupScoreThresholdSync() {
    // Listen for form array valueChanges to detect when rows are added/removed
    this.supplierTechnical.valueChanges.subscribe(() => {
      // Delay to ensure form array is stable before setting up subscriptions
      setTimeout(() => {
        this.setupThresholdPercentSync();
      }, 100);
    });

    // Initial setup
    this.setupThresholdPercentSync();
  }

  private isUpdatingThresholds = false;

  setupThresholdPercentSync() {
    const supplierTechnicalArray = this.supplierTechnical;

    // Set up individual subscriptions for each row's thresholdPercent
    supplierTechnicalArray.controls.forEach((control, index) => {
      const thresholdControl = control.get('thresholdPercent');
      if (thresholdControl && !(thresholdControl as any)._thresholdSynced) {
        // Mark as synced to prevent duplicate subscriptions
        (thresholdControl as any)._thresholdSynced = true;

        // Subscribe to value changes for this specific control
        thresholdControl.valueChanges.subscribe((value) => {
          // Prevent infinite loops
          if (this.isUpdatingThresholds) {
            return;
          }

          // Only sync if a value is entered
          if (value !== null && value !== undefined && value !== '') {
            this.isUpdatingThresholds = true;

            // Update all other rows with the same value
            supplierTechnicalArray.controls.forEach((otherControl, otherIndex) => {
              if (otherIndex !== index) {
                const otherThresholdControl = otherControl.get('thresholdPercent');
                if (otherThresholdControl && otherThresholdControl.value !== value) {
                  otherThresholdControl.setValue(value, { emitEvent: false });
                }
              }
            });

            // Reset flag and update Technical Go/No Go for this row
            setTimeout(() => {
              this.isUpdatingThresholds = false;
              this.updateTechnicalGoNoGoForRow(control);
            }, 0);
          } else {
            // If threshold is cleared, also update Technical Go/No Go
            this.updateTechnicalGoNoGoForRow(control);
          }
        });
      }
    });
  }

  private isUpdatingTechnicalGoNoGo = false;

  setupTechnicalGoNoGoAutoUpdate() {
    // Listen for form array valueChanges to detect when rows are added/removed
    this.supplierTechnical.valueChanges.subscribe(() => {
      // Delay to ensure form array is stable before setting up subscriptions
      setTimeout(() => {
        this.setupTechnicalGoNoGoSubscriptions();
      }, 100);
    });

    // Initial setup
    this.setupTechnicalGoNoGoSubscriptions();
  }

  setupTechnicalGoNoGoSubscriptions() {
    const supplierTechnicalArray = this.supplierTechnical;

    // Set up subscriptions for each row's technicalScorePercent
    supplierTechnicalArray.controls.forEach((control) => {
      const technicalScoreControl = control.get('technicalScorePercent');
      if (technicalScoreControl && !(technicalScoreControl as any)._technicalGoSynced) {
        // Mark as synced to prevent duplicate subscriptions
        (technicalScoreControl as any)._technicalGoSynced = true;

        // Subscribe to value changes for technicalScorePercent
        technicalScoreControl.valueChanges.subscribe(() => {
          if (!this.isUpdatingTechnicalGoNoGo) {
            this.updateTechnicalGoNoGoForRow(control);
          }
        });
      }

      // Also subscribe to thresholdPercent changes for this row
      const thresholdControl = control.get('thresholdPercent');
      if (thresholdControl && !(thresholdControl as any)._technicalGoThresholdSynced) {
        (thresholdControl as any)._technicalGoThresholdSynced = true;

        thresholdControl.valueChanges.subscribe(() => {
          if (!this.isUpdatingTechnicalGoNoGo && !this.isUpdatingThresholds) {
            this.updateTechnicalGoNoGoForRow(control);
          }
        });
      }

      // Subscribe to manual changes in isTechnical to validate Commercial Evaluation
      const isTechnicalControl = control.get('isTechnical');
      if (isTechnicalControl && !(isTechnicalControl as any)._commercialValidationSynced) {
        (isTechnicalControl as any)._commercialValidationSynced = true;

        isTechnicalControl.valueChanges.subscribe(() => {
          if (!this.isUpdatingTechnicalGoNoGo) {
            // Validate Commercial Evaluation when Technical Go/No Go changes manually
            setTimeout(() => {
              this.validateCommercialEvaluationVendors();
            }, 100);
          }
        });
      }
    });
  }

  updateTechnicalGoNoGoForRow(control: any) {
    const technicalScoreControl = control.get('technicalScorePercent');
    const thresholdControl = control.get('thresholdPercent');
    const isTechnicalControl = control.get('isTechnical');

    if (!technicalScoreControl || !thresholdControl || !isTechnicalControl) {
      return;
    }

    const technicalScore = technicalScoreControl.value;
    const threshold = thresholdControl.value;

    // Only auto-update if both values are present and are numbers
    if (technicalScore !== null && technicalScore !== undefined && technicalScore !== '' &&
        threshold !== null && threshold !== undefined && threshold !== '') {
      const technicalScoreNum = Number(technicalScore);
      const thresholdNum = Number(threshold);

      if (!isNaN(technicalScoreNum) && !isNaN(thresholdNum)) {
        this.isUpdatingTechnicalGoNoGo = true;

        // Set to Yes if Technical Score >= Score Threshold
        if (technicalScoreNum >= thresholdNum) {
          isTechnicalControl.setValue(true, { emitEvent: false });
        }

        setTimeout(() => {
          this.isUpdatingTechnicalGoNoGo = false;
          // Validate Commercial Evaluation selections after Technical Go/No Go changes
          this.validateCommercialEvaluationVendors();
        }, 0);
      }
    }
  }

  validateCommercialEvaluationVendors() {
    // Get all vendor IDs that have Technical Go/No Go = Yes
    const validVendorIds = new Set<number>();

    this.supplierTechnical.controls.forEach(control => {
      const vendorId = control.get('vendorId')?.value;
      const isTechnical = control.get('isTechnical')?.value;

      if (vendorId && isTechnical === true) {
        validVendorIds.add(Number(vendorId));
      }
    });

    // Check each Commercial Evaluation row and clear invalid selections
    this.commericalEvaluation.controls.forEach(control => {
      const vendorIdControl = control.get('vendorId');
      const vendorId = vendorIdControl?.value;

      if (vendorId && !validVendorIds.has(Number(vendorId))) {
        // Clear the selection if vendor is no longer valid
        vendorIdControl?.setValue(null);
        control.get('legalName')?.setValue('');
      }
    });
  }

  // Generate ID dynamically (001, 002, etc.)
  generateId(index: number): string {
    return (index + 1).toString().padStart(3, '0');
  }

  get consultationRows(): FormArray {
    return this.generalInfoForm.get('consultation') as FormArray;
  }

  addConsultationRow(isFirst = false, isChangedCamUser = false, consultationsData?: any[]) {
    if (isFirst) {
      // Use provided consultationsData, or fall back to paperDetails.consultationsDetails
      const riskMitigationsData = consultationsData || (this.paperDetails?.consultationsDetails as any[]) || []
      const riskMitigationArray = this.consultationRows;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index: number) => {
        // Map PSA value - convert label to value if needed (case-insensitive)
        let psaValue = item.psa || item.psaValue || '';
        if (psaValue && this.psaJvOptions.length > 0) {
          const psaValueUpper = psaValue.toString().trim().toUpperCase();
          // Check if psaValue is a label and needs to be converted to value (case-insensitive)
          const psaOption = this.psaJvOptions.find(option => {
            const optionLabelUpper = (option.label || '').toString().trim().toUpperCase();
            const optionValueUpper = (option.value || '').toString().trim().toUpperCase();
            return optionLabelUpper === psaValueUpper || optionValueUpper === psaValueUpper;
          });
          if (psaOption) {
            psaValue = psaOption.value;
          }
        }

        const formGroup = this.fb.group({
          psa: [psaValue, Validators.required],
          technicalCorrect: [
            { value: item.technicalCorrect || item.technicalCorrectId || null, disabled: false },
            Validators.required
          ],
          budgetStatement: [item.budgetStatement || item.budgetStatementId || null, Validators.required],
          jvReview: [item.jvReview || item.jvReviewId || null, Validators.required],
          jvAligned: [{ value: item.isJVReviewDone || item.jvAligned || false, disabled: true }],
          id: [item.id || 0]
        });
        riskMitigationArray.push(formGroup);

        // Set JV Aligned checkbox state based on JV Review user
        setTimeout(() => {
          const jvReviewValue = item.jvReview || item.jvReviewId || null;
          this.onJVReviewChange(index, jvReviewValue);
        }, 0);
      });
    } else {
      const camUserId = this.generalInfoForm.get('generalInfo.camUserId')?.value || null;
      if (isChangedCamUser) {
        this.consultationRows.clear();
      }
      this.consultationRows.push(
        this.fb.group({
          psa: ['', Validators.required],
          technicalCorrect: [{value: camUserId ? Number(camUserId) : null, disabled: false}, Validators.required],
          budgetStatement: [null, Validators.required],
          jvReview: [null, Validators.required],
          jvAligned: [{ value: false, disabled: true }],
          id: [0]
        })
      );
    }
  }

  // JV Aligned enable/disable based on selected JV Review user
  canEditJVAligned(jvReviewUserId: number | null): boolean {
    if (!this.loggedInUser || !jvReviewUserId) {
      return false;
    }
    return this.loggedInUser.id === jvReviewUserId;
  }

  onJVReviewChange(rowIndex: number, jvReviewUserId: number | null) {
    const row = this.consultationRows.at(rowIndex);
    const jvAlignedControl = row.get('jvAligned');
    if (jvAlignedControl) {
      if (this.canEditJVAligned(jvReviewUserId)) {
        jvAlignedControl.enable();
      } else {
        jvAlignedControl.disable();
        jvAlignedControl.setValue(false);
      }
    }
  }

  // Function to remove a row
  removeConsultationRow(index: number) {
    if (this.consultationRows.length > 1) {
      this.consultationRows.removeAt(index);
    }
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
        psa: [jvValue, Validators.required],
        technicalCorrect: [
          { value: camUserId ? Number(camUserId) : null, disabled: false },
          Validators.required
        ],
        budgetStatement: [null, Validators.required],
        jvReview: [null, Validators.required],
        jvAligned: [{ value: false, disabled: true }],
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

  updateCgbApprovalDate(id: number | null) {
    // Handle both string and number IDs
    const paperId = typeof id === 'string' ? Number(id) : id;
    const cgbATM = this.paperMappingData.find((item) => item.paperID == paperId)
    if(!cgbATM || !paperId) {
      return
    }
    const convertedValue =  cgbATM.entryDate ? format(new Date(cgbATM.entryDate), 'yyyy-MM-dd') : null
    this.generalInfoForm.get('generalInfo.cgbApprovalDate')?.setValue(convertedValue);
  }

  onPopulateFromATM() {
    const cgbAtmRefNo = this.generalInfoForm.get('generalInfo.cgbAtmRefNo')?.value;
    if (!cgbAtmRefNo) {
      this.toastService.show('Please select CGB ATM Ref No first', 'warning');
      return;
    }
    // Handle both string and number IDs
    const paperId = typeof cgbAtmRefNo === 'string' ? Number(cgbAtmRefNo) : cgbAtmRefNo;
    this.fetchATMPaperDetails(paperId);
  }

  fetchATMPaperDetails(paperId: number) {
    this.paperService.getPaperDetails(paperId, 'approch').subscribe((value) => {
      const atmPaperDetails = value.data as any;
      const atmGeneralInfo = atmPaperDetails?.paperDetails || null;
      const atmValueData = atmPaperDetails?.valueDeliveriesCostsharing[0] || null;
      const atmJvApprovalsData = atmPaperDetails?.jvApprovals[0] || null;
      const atmCostAllocationJVApprovalData = atmPaperDetails?.costAllocationJVApproval || [];

      // Store ATM contract value for comparison
      // In ATM paper, contractValue is the USD value, so use that
      this.atmPaperContactValueUSD = atmGeneralInfo?.contractValue || atmGeneralInfo?.totalAwardValueUSD || atmGeneralInfo?.contractValueUsd || 0;

      // Map PSA/JV values
      const selectedValuesPSAJV = atmGeneralInfo?.psajv
        ? atmGeneralInfo.psajv
          .split(',')
          .map((label: any) => label.trim())
          .map((label: any) => this.psaJvOptions.find((option) => option.label === label)?.value)
          .filter((value: any) => value != null)
        : [];

      const selectedValuesProcurementTagUsers = atmGeneralInfo?.procurementSPAUsers
        ? atmGeneralInfo.procurementSPAUsers
          .split(',')
          .map((id: any) => id.trim())
          .map((id: any) => this.procurementTagUsers.find((option: any) => option.value === Number(id))?.value)
          .filter((value: any) => value != null)
        : [];

      // Prepare cost allocation patch values
      const patchValues: any = { costAllocation: {} };

      // Assign PSA/JV values dynamically from ATM paper using the same naming logic
      atmCostAllocationJVApprovalData.forEach((psa: any) => {
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

      // Assign JV Approvals data from ATM paper
      Object.assign(patchValues.costAllocation, {
        contractCommittee_SDCC: atmJvApprovalsData?.contractCommittee_SDCC || false,
        contractCommittee_SCP_Co_CC: atmJvApprovalsData?.contractCommittee_SCP_Co_CC || false,
        contractCommittee_SCP_Co_CCInfoNote: atmJvApprovalsData?.contractCommittee_SCP_Co_CCInfoNote || false,
        contractCommittee_BTC_CC: atmJvApprovalsData?.contractCommittee_BTC_CC || false,
        contractCommittee_BTC_CCInfoNote: atmJvApprovalsData?.contractCommittee_BTC_CCInfoNote || false,
        contractCommittee_CGB: false,
        coVenturers_CMC: atmJvApprovalsData?.coVenturers_CMC || false,
        coVenturers_SDMC: atmJvApprovalsData?.coVenturers_SDMC || false,
        coVenturers_SCP: atmJvApprovalsData?.coVenturers_SCP || false,
        coVenturers_SCP_Board: atmJvApprovalsData?.coVenturers_SCP_Board || false,
        steeringCommittee_SC: atmJvApprovalsData?.steeringCommittee_SC || false,
      });

      // Get Contract Value (USD) from ATM paper - contractValue is the USD value in ATM paper
      const atmContractValueUSD = atmGeneralInfo?.contractValue || atmGeneralInfo?.totalAwardValueUSD || atmGeneralInfo?.contractValueUsd || 0;

      // Patch all matching fields from ATM paper to Contract template
      this.generalInfoForm.patchValue({
        generalInfo: {
          // Keep the paperProvision from the current form (user entered)
          purposeRequired: atmGeneralInfo?.purposeRequired || '',
          globalCGB: atmGeneralInfo?.globalCGB || '',
          bltMember: atmGeneralInfo?.bltMemberId ? Number(atmGeneralInfo.bltMemberId) : null,
          operatingFunction: atmGeneralInfo?.operatingFunction || '',
          subSector: atmGeneralInfo?.subSector || '',
          sourcingType: atmGeneralInfo?.sourcingType || '',
          camUserId: atmGeneralInfo?.camUserId || null,
          vP1UserId: atmGeneralInfo?.vP1UserId || null,
          procurementSPAUsers: selectedValuesProcurementTagUsers,
          pdManagerName: atmGeneralInfo?.pdManagerNameId || null,
          currencyCode: atmGeneralInfo?.currencyCode || '',
          totalAwardValueUSD: atmContractValueUSD, // Set Contract Value (USD) from ATM paper
          exchangeRate: atmGeneralInfo?.exchangeRate || 0,
          // Don't set contractValue directly - it will be calculated from totalAwardValueUSD * exchangeRate
          remunerationType: atmGeneralInfo?.remunerationType || '',
          workspaceNo: atmGeneralInfo?.workspaceNo || '',
          psajv: selectedValuesPSAJV,
          isLTCC: atmGeneralInfo?.isLTCC || false,
          ltccNotes: atmGeneralInfo?.ltccNotes || '',
          isGovtReprAligned: atmGeneralInfo?.isGovtReprAligned || false,
          govtReprAlignedComment: atmGeneralInfo?.govtReprAlignedComment || '',
        },
        valueDelivery: {
          costReductionPercent: atmValueData?.costReductionPercent || null,
          costReductionValue: atmValueData?.costReductionValue || null,
          costReductionRemarks: atmValueData?.costReductionRemarks || '',
          operatingEfficiencyValue: atmValueData?.operatingEfficiencyValue || null,
          operatingEfficiencyPercent: atmValueData?.operatingEfficiencyPercent || null,
          operatingEfficiencyRemarks: atmValueData?.operatingEfficiencyRemarks || '',
          costAvoidanceValue: atmValueData?.costAvoidanceValue || null,
          costAvoidancePercent: atmValueData?.costAvoidancePercent || null,
          costAvoidanceRemarks: atmValueData?.costAvoidanceRemarks || '',
        },
        costSharing: {
          isCapex: atmValueData?.isCapex || false,
          isFixOpex: atmValueData?.isFixOpex || false,
          isVariableOpex: atmValueData?.isVariableOpex || false,
          isInventoryItems: atmValueData?.isInventoryItems || false,
          capexMethodology: atmValueData?.capexMethodology || '',
          fixOpexMethodology: atmValueData?.fixOpexMethodology || '',
          variableOpexMethodology: atmValueData?.variableOpexMethodology || '',
          inventoryItemsMethodology: atmValueData?.inventoryItemsMethodology || '',
        },
        costAllocation: patchValues.costAllocation,
      }, { emitEvent: true });

      // Calculate contractValue (Original Currency) after setting totalAwardValueUSD and exchangeRate
      setTimeout(() => {
        this.updateContractValueOriginalCurrency();
        this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers, { emitEvent: false });
        this.generalInfoForm.get('generalInfo.psajv')?.setValue(selectedValuesPSAJV, { emitEvent: false });
      }, 100);

      // Setup PSA listeners after patching values
      setTimeout(() => {
        this.setupPSAListeners();
      }, 500);
    });
  }

  get inviteToBid(): FormArray {
    return this.generalInfoForm.get('procurementDetails.legalEntitiesAwarded') as FormArray;
  }

  get isContactDiffFromATM() {
    const cgbAtmRefNo = this.generalInfoForm.get('generalInfo.cgbAtmRefNo')?.value;
    // Only check if ATM is selected
    if (!cgbAtmRefNo || !this.atmPaperContactValueUSD) {
      return true; // Hide error when no ATM is selected
    }
    const currentValue = +this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value || 0;
    // Return true if values match (to hide error), false if different (to show error)
    return Math.abs(this.atmPaperContactValueUSD - currentValue) < 0.01; // Use small tolerance for floating point comparison
  }


  addBidRow(isFirst = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.legalEntitiesAwarded || []
      const riskMitigationArray = this.inviteToBid;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index: number) => {
        // Try to find vendor by ID first, then by legalName
        let vendor = null;
        if (item.vendorId) {
          vendor = this.vendorList.find(v => v.id === item.vendorId);
        }
        if (!vendor && item.legalName) {
          vendor = this.vendorList.find(v => v.legalName === item.legalName);
        }

        const legalNameValue = item.legalName || vendor?.legalName || '';
        const newRow = this.fb.group({
          vendorId: [vendor?.id || item.vendorId || null],
          legalName: [legalNameValue, Validators.required],
          isLocalOrJV: [item.isLocalOrJV], // Checkbox
          id: [item.id],
          contractStartDate: [item.contractStartDate
            ? format(new Date(item.contractStartDate), 'yyyy-MM-dd')
            : '', Validators.required],
          contractEndDate: [item.contractEndDate
            ? format(new Date(item.contractEndDate), 'yyyy-MM-dd')
            : '', [Validators.required, this.endDateAfterStartDate('contractStartDate')]],
          extensionOption: [item.extensionOption],
          currencyCode: [item.currencyCode],
          totalAwardValueUSD: [item.totalAwardValueUSD],
          exchangeRate: [item.exchangeRate],
          contractValue: [item.contractValue],

        });

        // Setup date validation for the new row
        const startDateControl = newRow.get('contractStartDate');
        const endDateControl = newRow.get('contractEndDate');
        if (startDateControl && endDateControl) {
          startDateControl.valueChanges.subscribe(() => {
            endDateControl.updateValueAndValidity();
          });
        }

        riskMitigationArray.push(newRow);
        // Calculate contractValue based on totalAwardValueUSD and exchangeRate
        const rowIndex = this.inviteToBid.length - 1;
        setTimeout(() => {
          this.updateLegalEntityContractValue(rowIndex);
        }, 0);
      });
      this.checkTotalAwardValueMismatch();
    } else {
      const newRow = this.fb.group({
        vendorId: [null],
        legalName: ['', Validators.required],
        isLocalOrJV: [false],
        contractStartDate: ['', Validators.required],
        contractEndDate: ['', [Validators.required, this.endDateAfterStartDate('contractStartDate')]],
        extensionOption: [''],
        currencyCode: [''],
        totalAwardValueUSD: [0],
        exchangeRate: [0],
        contractValue: [0],
        id: [0]
      });

      // Setup date validation for the new row
      const startDateControl = newRow.get('contractStartDate');
      const endDateControl = newRow.get('contractEndDate');
      if (startDateControl && endDateControl) {
        startDateControl.valueChanges.subscribe(() => {
          endDateControl.updateValueAndValidity();
        });
      }

      this.inviteToBid.push(newRow);
      this.checkTotalAwardValueMismatch();
    }
  }


  // Remove an inviteToBid row
  removeBidRow(index: number) {
    if (this.inviteToBid.length > 1) {
      this.inviteToBid.removeAt(index);
      this.checkTotalAwardValueMismatch();
    }
  }

  checkTotalAwardValueMismatch() {
    const mainTotal = Number(this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value) || 0;
    const legalEntitiesArray = this.inviteToBid;
    let sumOfIndividualTotals = 0;

    legalEntitiesArray.controls.forEach((control) => {
      const individualTotal = Number(control.get('totalAwardValueUSD')?.value) || 0;
      sumOfIndividualTotals += individualTotal;
    });

    // Check if they match (allow small floating point differences)
    const difference = Math.abs(mainTotal - sumOfIndividualTotals);
    this.totalAwardValueMismatch = difference > 0.01 && (mainTotal > 0 || sumOfIndividualTotals > 0);
  }

  subscribeToTotalAwardValueChanges() {
    // Subscribe to main total award value changes
    this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.valueChanges.subscribe(() => {
      this.checkTotalAwardValueMismatch();
    });

    // Subscribe to each legal entity's total award value changes
    this.inviteToBid.valueChanges.subscribe(() => {
      this.checkTotalAwardValueMismatch();
    });

    // Also subscribe when rows are added/removed
    this.inviteToBid.statusChanges.subscribe(() => {
      this.checkTotalAwardValueMismatch();
    });
  }


  toggleComments() {
    if (!this.isExpanded) {
      this.toggleService.expandComments();
    } else {
      this.toggleService.collapseAll();
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
              this.router.navigate(['/paperconfiguration'])
              this.toastService.show('Paper Status updated successfully');
            }
          },
          error: (error) => {
            console.log('error', error);
          },
        });
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

  scrollToTop(): void {
    window.scrollTo({top: 0, behavior: 'smooth'});
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

  toggleSection(section: string): void {
    this.sectionVisibility[section] = !this.sectionVisibility[section];
  }

  setupProcurementDateValidation() {
    // Setup validation for existing rows (when loading existing data)
    this.setupDateValidationForRows();
  }

  private setupDateValidationForRows() {
    // Re-validate end dates when start dates change in the legalEntitiesAwarded FormArray
    this.inviteToBid.controls.forEach((row) => {
      const startDateControl = row.get('contractStartDate');
      const endDateControl = row.get('contractEndDate');

      if (startDateControl && endDateControl) {
        // Subscribe to start date changes to re-validate end date
        startDateControl.valueChanges.subscribe(() => {
          endDateControl.updateValueAndValidity();
        });
      }
    });
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
        // Set attachment section visibility to true if there are files
        this.sectionVisibility['section10'] = true;
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

  goToPreview(): void {
    if (this.paperId) {
      this.router.navigate(['/preview/contract-award', this.paperId]);
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

}
