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
import {environment} from '../../environments/environment';
import {Select2} from 'ng-select2-component';
import {DictionaryService} from '../../service/dictionary.service';
import {Generalervice} from '../../service/general.service';
import {UploadService} from '../../service/document.service';
import {ToastService} from '../../service/toast.service';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import {DictionaryDetail} from '../../models/dictionary';
import {LoginUser, UserDetails} from '../../models/user';
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

@Component({
  selector: 'app-template2',
  standalone: true,
  imports: [CommonModule,NumberInputComponent, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, TimeAgoPipe, EditorComponent, CommentableDirective, EditorNormalComponent, RouterLink, NgbTooltip],
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
  highlightClass = 'highlight';
  paperStatusId: number | null = null;
  currentPaperStatus: string | null = null;
  paperDetails: any = null
  vendorList: VendorDetail[] = []
  userDetails: UserDetails[] = [];
  procurementTagUsers: any[] = [];
  paperMappingData: PaperMappingType[] = [];
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


    this.allApisDone$.subscribe((done) => {
      if (done) {
        this.route.paramMap.subscribe(params => {
          this.paperId = params.get('id');
          if (this.paperId) {
            this.fetchPaperDetails(Number(this.paperId))
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
    this.addRow()
    this.addSupplierTechnicalnRow()
    this.addBidRow()
    this.addCommericalEvaluationRow()
    this.setupPSAListeners()
    this.setupPSACalculations()
    this.setupMethodologyListeners()


    // Subscribe to changes in originalCurrency or contractValueUsd
    this.generalInfoForm.get('generalInfo.currencyCode')?.valueChanges.subscribe(() => {
      this.updateExchangeRate();
    });

    this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.valueChanges.subscribe(() => {
      this.updateContractValueOriginalCurrency();
      this.setupPSACalculationsManually()
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
        isChangeinApproachMarket: [null],
        cgbItemRefNo: [{value: '', disabled: true}],
        cgbCirculationDate: [{value: null, disabled: true}],
        contractNo: [''],
        contactNo: [''],
        vendorId: [null],
        purposeRequired: ['', Validators.required],
        globalCGB: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        operatingFunction: ['', Validators.required],
        subSector: ['', Validators.required],
        sourcingType: ['', Validators.required],
        camUserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, Validators.required],
        isPHCA: [null],
        currencyCode: [''],
        totalAwardValueUSD: [
          null,
          [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]
        ],
        exchangeRate: [0], // Number input
        contractValue: [0],
        remunerationType: ['', Validators.required],
        isPaymentRequired: [null],
        prePayPercent: [null],
        prePayAmount: [null],
        workspaceNo: [''],
        isSplitAward: [null],
        psajv: [[], Validators.required],
        isLTCC: [null],
        ltccNotes: [{ value: '', disabled: true }],
        isGovtReprAligned: [null],
        govtReprAlignedComment: [''],
        contractSpendCommitment: [''],
      }),
      procurementDetails: this.fb.group({
        supplierAwardRecommendations: ['', Validators.required],
        legalEntitiesAwarded: this.fb.array([]),
        isConflictOfInterest: [null],
        conflictOfInterestComment: [{ value: '', disabled: true }],
        isRetrospectiveApproval: [null],
        retrospectiveApprovalReason: [{ value: '', disabled: true }],
        nationalContent: [''],
      }),
      ccd: this.fb.group({
        isHighRiskContract: [null],
        cddCompleted: [null],
        highRiskExplanation: [''],
        flagRaisedCDD: [''],
        additionalCDD: [''],

      }),
      evaluationSummary: this.fb.group({
        invitedBidders: [0],
        submittedBids: [0],
        previousContractLearning: [''],
        performanceImprovements: [''],
        previousSupplierSpendInfo: [''],
        benchMarking: [''],
        commericalEvaluation: this.fb.array([]),
        supplierTechnical: this.fb.array([]),
      }),
      additionalDetails: this.fb.group({
        contractualControls: [''],
        contractCurrencyLinktoBaseCost: [null],
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
        capexMethodology: [{value: '', disabled: true}],
        fixOpexMethodology: [{value: '', disabled: true}],
        variableOpexMethodology: [{value: '', disabled: true}],
        inventoryItemsMethodology: [{value: '', disabled: true}]
      }),
      consultation: this.fb.array([]),

    });

  }

  fetchPaperDetails(paperId: number) {
    this.paperService.getPaperDetails(paperId, 'contract').subscribe((value) => {
      this.paperDetails = value.data as any;
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

// PSA/JV mappings
      const psaNameToCheckbox: Record<string, string> = {
        "ACG": "isACG",
        "Shah Deniz": "isShah",
        "SCP": "isSCP",
        "BTC": "isBTC",
        "Asiman": "isAsiman",
        "BP Group": "isBPGroup"
      };

      // Assign PSA/JV values dynamically
      costAllocationJVApprovalData.forEach(psa => {
        const checkboxKey = psaNameToCheckbox[psa.psaName as keyof typeof psaNameToCheckbox];
        if (checkboxKey) {
          patchValues.costAllocation[checkboxKey] = psa.psaValue;
          patchValues.costAllocation[`percentage_${checkboxKey}`] = psa.percentage;
          patchValues.costAllocation[`value_${checkboxKey}`] = psa.value;
        }
      });

// Assign default values for all PSA/JV fields if not in API data
      Object.keys(psaNameToCheckbox).forEach(key => {
        const checkboxKey = psaNameToCheckbox[key];
        if (!patchValues.costAllocation.hasOwnProperty(checkboxKey)) {
          patchValues.costAllocation[checkboxKey] = false;
          patchValues.costAllocation[`percentage_${checkboxKey}`] = '';
          patchValues.costAllocation[`value_${checkboxKey}`] = '';
        }
      });

      const selectedValues = contractAwardDetails?.psajv
        ? contractAwardDetails.psajv
          .split(',')
          .map((label: any) => label.trim())
          .map((label: any) => this.psaJvOptions.find(option => option.label === label)?.value)
          .filter((value: any) => value != null) // Use != null to filter both null and undefined
        : [];

      const selectedValuesProcurementTagUsers = contractAwardDetails?.procurementSPAUsers
        ? contractAwardDetails.procurementSPAUsers
          .split(',')
          .map((id: any) => id.trim())
          .map((id: any) => this.procurementTagUsers.find(option => option.value === Number(id))?.value)
          .filter((value: any) => value != null)
        : [];

      if (value.data) {
        this.generalInfoForm.patchValue({
          generalInfo: {
            paperProvision: contractAwardDetails?.paperProvision || "",
            cgbAtmRefNo: contractAwardDetails?.cgbAtmRefNo ? Number(contractAwardDetails?.cgbAtmRefNo) : null,
            cgbApprovalDate:  contractAwardDetails?.cgbApprovalDate
              ? format(new Date(contractAwardDetails.cgbApprovalDate), 'yyyy-MM-dd')
              : null,
            isChangeinApproachMarket: contractAwardDetails?.isChangeinApproachMarket || null,
            cgbItemRefNo: contractAwardDetails?.cgbItemRefNo || "",
            cgbCirculationDate: contractAwardDetails?.cgbCirculationDate
              ? format(new Date(contractAwardDetails.cgbCirculationDate), 'yyyy-MM-dd')
              : null,
            contractNo: contractAwardDetails?.contractNo || "",
            contactNo: contractAwardDetails?.contactNo || "",
            vendorId: contractAwardDetails?.vendorId || null,
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
            totalAwardValueUSD: contractAwardDetails?.totalAwardValueUSD || 0,
            exchangeRate: contractAwardDetails?.exchangeRate || 0,
            contractValue: contractAwardDetails?.contractValue || 0,
            remunerationType: contractAwardDetails?.remunerationType || 0,
            isPaymentRequired: contractAwardDetails?.isPaymentRequired || false,
            prePayPercent: contractAwardDetails?.prePayPercent || 0,
            prePayAmount: contractAwardDetails?.prePayAmount || 0,
            workspaceNo: contractAwardDetails?.workspaceNo || '',
            isSplitAward: contractAwardDetails?.isSplitAward || false,
            psajv: selectedValues,
            isLTCC: contractAwardDetails?.isLTCC || false,
            ltccNotes: contractAwardDetails?.ltccNotes || '',
            isGovtReprAligned: contractAwardDetails?.isGovtReprAligned || false,
            govtReprAlignedComment: contractAwardDetails?.govtReprAlignedComment || '',
            contractSpendCommitment: contractAwardDetails?.contractSpendCommitment || '',
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
          },
          costAllocation: patchValues.costAllocation,
        },{ emitEvent: true })
        setTimeout(() => {
          this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers, { emitEvent: false });
          this.generalInfoForm.get('generalInfo.psajv')?.setValue(selectedValues, { emitEvent: false });
          this.isInitialLoad = false;
        }, 500)

        this.addRow(true);
        this.addSupplierTechnicalnRow(true);
        this.addBidRow(true);
        this.addConsultationRow(true);
        this.addCommericalEvaluationRow(true)
        this.setupPSAListeners()
        this.getUploadedDocs(paperId);
      }
    })
  }

  onSourcingTypeChange() {
    this.generalInfoForm.get('generalInfo.sourcingType')?.valueChanges.subscribe((value) => {
      const selectedType = this.sourcingTypeData.find(item => item.id === Number(value));
      this.isShowBenchmarking = !selectedType || selectedType.itemValue !== "Competitive Bid";
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
    this.userService.getUserDetailsList().subscribe({
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
            this.paperMappingData = response.data.filter((item) => item.paperType == "Approach to Market")
          }
          this.incrementAndCheck();
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
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
          this.vendorList = reponse.data;
          console.log('vendor:', this.vendorList);
          this.incrementAndCheck();
        }
      },
      error: (error) => {
        console.log('error', error);
      },
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
  applyCommitteeLogicForPSA(psaName: string, isChecked: boolean): void {
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

          firstCommitteeControl.setValue(shouldCheck || initialValue, { emitEvent: false });
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

          secondCommitteeControl.setValue(shouldCheck || initialValue, { emitEvent: false });
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
  triggerCommitteeLogicForPSA(psaName: string): void {
    const checkboxControlName = this.getPSACheckboxControlName(psaName);
    const checkboxControl = this.generalInfoForm.get(`costAllocation.${checkboxControlName}`);

    // Only apply committee logic if checkbox is checked
    const isChecked = checkboxControl?.value || false;
    if (!isChecked) {
      return;
    }

    this.applyCommitteeLogicForPSA(psaName, isChecked);
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
        percentageControl.valueChanges.subscribe((percentageValue) => {
        const contractValue = this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value || 0;

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
  }

  /**
   * Evaluate thresholds and determine if committee checkbox should be checked
   * Template 2 (Contract): Same logic as Template 1
   */
  evaluateThreshold(psaName: string, checkboxType: string, byValue: number): boolean {
    const sourcingTypeId = Number(this.generalInfoForm.get('generalInfo.sourcingType')?.value) || 0;
    const psaAgreementId = this.getPSAAgreementId(psaName);
    const paperType = 'Contract'; // For Template 2

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
          costAllocationControl.get(checkboxControlName)?.setValue(true);
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
      {checkbox: 'isCapex', methodology: 'capexMethodology'},
      {checkbox: 'isFixOpex', methodology: 'fixOpexMethodology'},
      {checkbox: 'isInventoryItems', methodology: 'inventoryItemsMethodology'},
      {checkbox: 'isVariableOpex', methodology: 'variableOpexMethodology'}
    ];

    controls.forEach(({checkbox, methodology}) => {
      this.generalInfoForm.get(`costSharing.${checkbox}`)?.valueChanges.subscribe((isChecked) => {
        const methodControl = this.generalInfoForm.get(`costSharing.${methodology}`);

        if (isChecked) {
          methodControl?.enable();
        } else {
          methodControl?.reset(); // Clears value and sets it to default (empty string in your case)
          methodControl?.disable();
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

  updateExchangeRate() {
    const originalCurrency = this.generalInfoForm.get('generalInfo.currencyCode')?.value;
    const currencyItem = this.currenciesData.find((item) => item.id === Number(originalCurrency)) || null
    const currency = CURRENCY_LIST.find(c => c.code === currencyItem?.itemValue);
    const exchangeRate = currency ? currency.rate : 0;

    this.generalInfoForm.get('generalInfo.exchangeRate')?.setValue(exchangeRate);
    this.updateContractValueOriginalCurrency();
  }

  updateContractValueOriginalCurrency() {
    const contractValueUsd = Number(this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value) || 0;
    const exchangeRate = Number(this.generalInfoForm.get('generalInfo.exchangeRate')?.value) || 0;

    const convertedValue = contractValueUsd * exchangeRate;
    this.generalInfoForm.get('generalInfo.contractValue')?.setValue(convertedValue);
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
        prePayAmount?.setValidators([Validators.required]);
        prePayPercent?.setValidators([Validators.required]);
      } else {
        prePayAmount?.clearValidators();
        prePayPercent?.clearValidators();
      }

      prePayAmount?.updateValueAndValidity();
      prePayPercent?.updateValueAndValidity();
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

  setPaperStatus(status: string, callAPI: boolean = true): void {
    if (!this.paperStatusList?.length) return; // Check if list exists & is not empty

    this.paperStatusId = this.paperStatusList.find(item => item.paperStatus === status)?.id ?? null;
    this.currentPaperStatus = this.paperStatusList.find(item => item.paperStatus === status)?.paperStatus ?? null;

    if (callAPI && this.paperId) {
      this.paperConfigService.updateMultiplePaperStatus([{
        paperId: this.paperId,
        existingStatusId: this.paperDetails?.paperDetails.paperStatusId,
        statusId: this.paperStatusId
      }]).subscribe(value => {
        this.toastService.show('Paper has been moved to ' + status);
        this.router.navigate(['/paperconfiguration'])
      });
    }
  }

  onSubmit() {
    this.submitted = true;
    console.log("==this.generalInfoForm?.value?", this.generalInfoForm)
    if (!this.paperStatusId) {
      this.toastService.show("Paper status id not found", "danger")
      return
    }

    const generalInfoValue = this.generalInfoForm?.value?.generalInfo
    const procurementValue = this.generalInfoForm?.value?.procurementDetails
    const ccdValue = this.generalInfoForm?.value?.ccd
    const additionalDetailsValue = this.generalInfoForm?.value?.additionalDetails
    const evaluationSummaryValue = this.generalInfoForm?.value?.evaluationSummary

    const costSharingValues = this.generalInfoForm?.value?.costSharing
    const valueDeliveryValues = this.generalInfoForm?.value?.valueDelivery
    const costAllocationValues = this.generalInfoForm?.value?.costAllocation
    const consultationsValue = this.generalInfoForm?.value?.consultation

    // Mapping PSAs from the costAllocation object
    const psaMappings = [
      {key: "isACG", name: "ACG"},
      {key: "isShah", name: "Shah Deniz"},
      {key: "isSCP", name: "SCP"},
      {key: "isBTC", name: "BTC"},
      {key: "isAsiman", name: "Sh-Asiman"},
      {key: "isBPGroup", name: "BP Group"}
    ];

    const costAllocationJVApproval = psaMappings
      .map((psa, index) => {
        const percentageKey = `percentage_${psa.key}`;
        const valueKey = `value_${psa.key}`;

        if (costAllocationValues[percentageKey] !== undefined) {
          return {
            id: index,
            psaName: psa.name,
            psaValue: true,
            percentage: costAllocationValues[percentageKey] || 0,
            value: costAllocationValues[valueKey] || 0
          };
        }
        return null;
      })
      .filter(item => item !== null);

    const filteredRisks = this.riskMitigation.controls
      .filter(group => group.valid)
      .map(group => group.value);


    const filteredBids = this.inviteToBid.controls
      .filter(group => group.valid)
      .map(group => group.value);

    const filterSupplierTechnical = this.supplierTechnical.controls
      .filter(group => group.valid)
      .map(group => group.value);

    const filterCommericalEvaluation = this.commericalEvaluation.controls
      .filter(group => group.valid)
      .map(group => group.value);


    const params = {
      papers: {
        paperStatusId: this.paperStatusId,
        paperProvision: generalInfoValue?.paperProvision,
        purposeRequired: generalInfoValue?.purposeRequired,
        isActive: true,
        ...(this.paperId && !this.isCopy ? {id: Number(this.paperId)} : {})
      },
      contractAward: {
        ...generalInfoValue, ...ccdValue,
        supplierAwardRecommendations: procurementValue.supplierAwardRecommendations || "",
        isConflictOfInterest: procurementValue.isConflictOfInterest || false,
        conflictOfInterestComment: procurementValue.conflictOfInterestComment || "",
        isRetrospectiveApproval: procurementValue.isRetrospectiveApproval || false,
        retrospectiveApprovalReason: procurementValue.retrospectiveApprovalReason || "",
        nationalContent: procurementValue.nationalContent || "",
        invitedBidders: evaluationSummaryValue?.invitedBidders || 0,
        submittedBids: evaluationSummaryValue?.submittedBids || 0,
        previousContractLearning: evaluationSummaryValue?.previousContractLearning || "",
        performanceImprovements: evaluationSummaryValue?.performanceImprovements || "",
        benchMarking: evaluationSummaryValue?.benchMarking || "",
        previousSupplierSpendInfo: evaluationSummaryValue?.previousSupplierSpendInfo || "",
        contractualControls: additionalDetailsValue?.contractualControls || "",
        contractCurrencyLinktoBaseCost: additionalDetailsValue?.contractCurrencyLinktoBaseCost || false,
        explanationsforBaseCost: additionalDetailsValue?.explanationsforBaseCost || "",
        contractSpendCommitment: "",
        psajv: generalInfoValue?.psajv?.join(',') || "",
        procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "",
      },
      consultations: consultationsValue || [],
      riskMitigation: filteredRisks || [],
      commericalEvaluation: filterCommericalEvaluation || [],
      supplierTechnical: filterSupplierTechnical || [],
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
        capexMethodology: costSharingValues.capexMethodology || "",
        fixOpexMethodology: costSharingValues.fixOpexMethodology || "",
        variableOpexMethodology: costSharingValues.variableOpexMethodology || "",
        inventoryItemsMethodology: costSharingValues.inventoryItemsMethodology || "",
      },
      costAllocationJVApproval: costAllocationJVApproval || [],
      jvApproval: {
        // ...costAllocationValues,
        contractCommittee_SDCC: costAllocationValues?.contractCommittee_SDCC || false,
        contractCommittee_SCP_Co_CC: costAllocationValues?.contractCommittee_SCP_Co_CC || false,
        contractCommittee_SCP_Co_CCInfoNote: costAllocationValues?.contractCommittee_SCP_Co_CCInfoNote || false,
        contractCommittee_BTC_CC: costAllocationValues?.contractCommittee_BTC_CC || false,
        contractCommittee_BTC_CCInfoNote: costAllocationValues?.contractCommittee_BTC_CCInfoNote || false,
        contractCommittee_CGB: costAllocationValues?.contractCommittee_CGB || false,
        coVenturers_CMC: costAllocationValues?.coVenturers_CMC || false,
        coVenturers_SDMC: costAllocationValues?.coVenturers_SDMC || false,
        coVenturers_SCP: costAllocationValues?.coVenturers_SCP || false,
        coVenturers_SCP_Board: costAllocationValues?.coVenturers_SCP_Board || false,
        steeringCommittee_SC: costAllocationValues?.steeringCommittee_SC || false,
      },
      legalEntitiesAwarded: filteredBids || []
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
    this.paperService.upsertContractAward(params).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const docId = response.data || null
          this.uploadFiles(docId)
          this.deleteMultipleDocuments(docId)

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

  // Add a new risk row
  addRow(isFirst = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.riskMitigations || []
      const riskMitigationArray = this.riskMitigation;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData?.forEach((item: any, index: number) => {
        riskMitigationArray.push(
          this.fb.group({
            risks: [item.risks || '', Validators.required],
            mitigations: [item.mitigations || '', Validators.required],
            id: [item.id]
          })
        );
      });
    } else {
      this.riskMitigation.push(
        this.fb.group({
          risks: ['', Validators.required],
          mitigations: ['', Validators.required],
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
        riskMitigationArray.push(
          this.fb.group({
            legalName: [item.legalName || '', Validators.required],
            totalValue: [item.totalValue || 0, Validators.required],
            id: [item.id]
          })
        );
      });
    } else {
      this.commericalEvaluation.push(
        this.fb.group({
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
        riskMitigationArray.push(
          this.fb.group({
            legalName: [item.legalName, Validators.required],
            resultOfHSSE: [item.resultOfHSSE, Validators.required],
            commentary: [item.commentary],
            thresholdPercent: [item.thresholdPercent],
            technicalScorePercent: [item.technicalScorePercent],
            isTechnical: [item.isTechnical],
            id: [item.id]
          })
        );
      });
    } else {
      this.supplierTechnical.push(
        this.fb.group({
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

  // Generate ID dynamically (001, 002, etc.)
  generateId(index: number): string {
    return (index + 1).toString().padStart(3, '0');
  }

  get consultationRows(): FormArray {
    return this.generalInfoForm.get('consultation') as FormArray;
  }

  addConsultationRow(isFirst = false, isChangedCamUser = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.consultations || []
      const riskMitigationArray = this.consultationRows;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index: number) => {
        riskMitigationArray.push(
          this.fb.group({
            psa: [item.psa, Validators.required],
            technicalCorrect: [item.technicalCorrectId, Validators.required],
            budgetStatement: [item.budgetStatementId, Validators.required],
            jvReview: [item.jvReviewId, Validators.required],
            id: [item.id]
          })
        );
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
          id: [0]
        })
      );
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
    const cgbATM = this.paperMappingData.find((item) => item.paperID == id)
    if(!cgbATM || !id) {
      return
    }
    const convertedValue =  cgbATM.entryDate ? format(new Date(cgbATM.entryDate), 'yyyy-MM-dd') : null
    this.generalInfoForm.get('generalInfo.cgbApprovalDate')?.setValue(convertedValue);
    this.fetchATMPaperDetails(id)
  }

  fetchATMPaperDetails(paperId: number) {
    this.paperService.getPaperDetails(paperId, 'contract').subscribe((value) => {
      const atmPaperDetails = value.data as any;
      this.atmPaperContactValueUSD = atmPaperDetails?.paperDetails?.totalAwardValueUSD || 0
      this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.setValue(atmPaperDetails?.paperDetails?.totalAwardValueUSD || 0,{ emitEvent: true });
    })}

  get inviteToBid(): FormArray {
    return this.generalInfoForm.get('procurementDetails.legalEntitiesAwarded') as FormArray;
  }

  get isContactDiffFromATM() {
    const currentValue = +this.generalInfoForm.get('generalInfo.totalAwardValueUSD')?.value || 0;
    return this.atmPaperContactValueUSD === currentValue;
  }


  addBidRow(isFirst = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.legalEntitiesAwarded || []
      const riskMitigationArray = this.inviteToBid;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index: number) => {
        riskMitigationArray.push(
          this.fb.group({
            legalName: [item.legalName, Validators.required],
            isLocalOrJV: [item.isLocalOrJV], // Checkbox
            id: [item.id],
            contractStartDate: [item.contractStartDate
              ? format(new Date(item.contractStartDate), 'yyyy-MM-dd')
              : ''],
            contractEndDate: [item.contractEndDate
              ? format(new Date(item.contractEndDate), 'yyyy-MM-dd')
              : ''],
            extensionOption: [item.extensionOption],
            currencyCode: [item.currencyCode],
            totalAwardValueUSD: [item.totalAwardValueUSD],
            exchangeRate: [item.exchangeRate],
            contractValue: [item.contractValue],

          })
        );
      });
    } else {
      this.inviteToBid.push(
        this.fb.group({
          legalName: ['', Validators.required],
          isLocalOrJV: [false],
          contractStartDate: [''],
          contractEndDate: [''],
          extensionOption: [''],
          currencyCode: [''],
          totalAwardValueUSD: [0],
          exchangeRate: [0],
          contractValue: [0],
          id: [0]
        })
      );
    }
  }


  // Remove an inviteToBid row
  removeBidRow(index: number) {
    if (this.inviteToBid.length > 1) {
      this.inviteToBid.removeAt(index);
    }
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

}
