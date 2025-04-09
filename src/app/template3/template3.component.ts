import {Component, inject, Renderer2, ViewChild, ElementRef} from '@angular/core';
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
import {PaperStatusType} from '../../models/paper';
import {VendorService} from '../../service/vendor.service';
import {VendorDetail} from '../../models/vendor';
import {TimeAgoPipe} from '../../pipes/time-ago.pipe';
import {EditorComponent} from '../../components/editor/editor.component';
import {CommentableDirective} from '../../directives/commentable.directive';
import {EditorNormalComponent} from '../../components/editor-normal/editor-normal.component';
import {PaperConfigService} from '../../service/paper/paper-config.service';
import {CommentService} from '../../service/comment.service';
import {EditorService} from '../../service/editor.service';
import {AuthService} from '../../service/auth.service';
import {format} from 'date-fns';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: 'app-template3',
  standalone: true,
  imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, TimeAgoPipe, EditorComponent, CommentableDirective, EditorNormalComponent, RouterLink],
  templateUrl: './template3.component.html',
  styleUrl: './template3.component.scss'
})
export class Template3Component {
  private readonly userService = inject(UserService);
  private readonly paperService = inject(PaperService);
  private readonly vendorService = inject(VendorService);
  private paperConfigService = inject(PaperConfigService);
  private commentService = inject(CommentService);
  private editorService = inject(EditorService);
  private authService = inject(AuthService);
  private searchTimeout: any;
  public Editor: typeof ClassicEditor | null = null;
  public config: EditorConfig | null = null;
  private allApisDone$ = new BehaviorSubject<boolean>(false);
  @ViewChild('searchInput') searchInput!: ElementRef;
  generalInfoForm!: FormGroup;
  isExpanded: boolean = true; // Default expanded
  paperId: string | null = null;
  isCopy = false;
  submitted = false;
  highlightClass = 'highlight';
  paperStatusId: number | null = null;
  paperDetails: any = null
  vendorList: VendorDetail[] = []
  userDetails: UserDetails[] = [];
  procurementTagUsers: any[] = [];
  countryDetails: CountryDetail[] = [];
  paperStatusList: PaperStatusType[] = [];
  isRegisterPaper: boolean = false
  private completedCount = 0;
  private totalCalls = 5;
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

  public psaJvOptions = [
    {value: 'ACG', label: 'ACG'},
    {value: 'Shah Deniz', label: 'Shah Deniz'},
    {value: 'SCP', label: 'SCP'},
    {value: 'BTC', label: 'BTC'},
    {value: 'Sh-Asiman', label: 'Sh-Asiman'},
    {value: 'BP Group', label: 'BP Group'}
  ];

  constructor(private router: Router, private route: ActivatedRoute, private dictionaryService: DictionaryService,
              private fb: FormBuilder, private countryService: Generalervice, private renderer: Renderer2, private uploadService: UploadService, public toastService: ToastService,
  ) {
    this.authService.userDetails$.subscribe((d) => {
      this.loggedInUser = d;
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


  loadForm() {
    this.generalInfoForm = this.fb.group({
      generalInfo: this.fb.group({
        paperProvision: ['', Validators.required],
        cgbAtmRefNo: ['', Validators.required],
        cgbApprovalDate: [{value: '', disabled: true}],
        isChangeinApproachMarket: [false],
        cgbItemRefNo: [''],
        cgbCirculationDate: [''],
        contractNo: ['', Validators.required],
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
        isPHCA: [false],
        currencyCode: [''],
        totalAwardValueUSD: [0], // Number input
        exchangeRate: [0], // Number input
        contractValue: [0],
        remunerationType: ['', Validators.required],
        isPaymentRequired: [false],
        prePayPercent: [0],
        prePayAmount: [{value: null, disabled: true}],
        workspaceNo: [''],
        isSplitAward: [false],
        psajv: [[], Validators.required],
        isLTCC: [false],
        ltccNotes: [''],
        isGovtReprAligned: [false],
        govtReprAlignedComment: [''],
        contractSpendCommitment: [''],
      }),
      justificationSection: this.fb.group({
        supplierAwardRecommendations: ['', Validators.required],
        contractStartDate: [''],
        contractEndDate: [''],
        extensionOption: [''],
        isConflictOfInterest: [false],
        conflictOfInterestComment: [''],
        isRetrospectiveApproval: [false],
        retrospectiveApprovalReason: [''],
        nationalContent: [''],
      }),
      contractInfo: this.fb.group({
        isHighRiskContract: [false],
        cddCompleted: [''],
        highRiskExplanation: [''],
        flagRaisedCDD: [''],
        additionalCDD: [''],

      }),
      evaluationSummary: this.fb.group({
        invitedBidders: [0],
        submittedBids: [0],
        previousContractLearning: [''],
        performanceImprovements: [''],
        benchMarking: [''],
        commericalEvaluation: this.fb.array([]),
        supplierTechnical: this.fb.array([]),
      }),
      additionalDetails: this.fb.group({
        contractualControls: [''],
        contractCurrencyLinktoBaseCost: [false],
        explanationsforBaseCost: [''],
        riskMitigation: this.fb.array([]),
      }),
      valueDelivery: this.fb.group({
        costReductionPercent: [0],
        costReductionValue: [0],
        costReductionRemarks: [''],
        operatingEfficiencyValue: [0],
        operatingEfficiencyPercent: [0],
        operatingEfficiencyRemarks: [''],
        costAvoidanceValue: [0],
        costAvoidancePercent: [0],
        costAvoidanceRemarks: [''],
      }, {validators: this.requireAllIfAny}),
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

        value_isACG: [{value: '', disabled: true}],
        value_isShah: [{value: '', disabled: true}],
        value_isSCP: [{value: '', disabled: true}],
        value_isBTC: [{value: '', disabled: true}],
        value_isAsiman: [{value: '', disabled: true}],
        value_isBPGroup: [{value: '', disabled: true}],

        totalPercentage: [{value: 0, disabled: true}, [Validators.min(0), Validators.max(100)]],
        totalValue: [{value: 0, disabled: true}]
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
    this.paperService.getPaperDetails(paperId).subscribe((value) => {
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
            cgbAtmRefNo: contractAwardDetails?.cgbAtmRefNo || "",
            cgbApprovalDate: contractAwardDetails?.cgbApprovalDate || "",
            isChangeinApproachMarket: contractAwardDetails?.isChangeinApproachMarket || "",
            cgbItemRefNo: contractAwardDetails?.cgbItemRefNo || "",
            cgbCirculationDate: contractAwardDetails?.cgbCirculationDate
              ? format(new Date(contractAwardDetails.cgbCirculationDate), 'yyyy-MM-dd')
              : '',
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
              : '',
            highRiskExplanation: contractAwardDetails?.highRiskExplanation || '',
            flagRaisedCDD: contractAwardDetails?.flagRaisedCDD || '',
            additionalCDD: contractAwardDetails?.additionalCDD || '',
          }, evaluationSummary: {
            invitedBidders: contractAwardDetails?.invitedBidders || 0,
            submittedBids: contractAwardDetails?.submittedBids || 0,
            previousContractLearning: contractAwardDetails?.previousContractLearning || '',
            performanceImprovements: contractAwardDetails?.performanceImprovements || '',
            benchMarking: contractAwardDetails?.benchMarking || '',
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
        })
        setTimeout(() => {
          this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers);
          this.generalInfoForm.get('generalInfo.psajv')?.setValue(selectedValues);
        }, 500)

      }
    })
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


  onSubmit() {
    console.log("==this.generalInfoForm?.value?", this.generalInfoForm)
  }

  toggleComments() {
    this.isExpanded = !this.isExpanded;
  }

  setPaperStatus(status: string): void {
    if (!this.paperStatusList?.length) return; // Check if list exists & is not empty

    this.paperStatusId = this.paperStatusList.find(item => item.paperStatus === status)?.id ?? null;

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

  scrollToSection(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const section = document.getElementById(selectedValue);

    if (section) {
      section.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  }
}
