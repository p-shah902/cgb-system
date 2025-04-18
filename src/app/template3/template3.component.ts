import {Component, inject, Renderer2, ViewChild, ElementRef, TemplateRef} from '@angular/core';
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
import {DummyCompComponent} from '../dummy-comp/dummy-comp.component';
import {cleanObject} from '../../utils/index';
import {ThresholdType} from '../../models/threshold';
import {ThresholdService} from '../../service/threshold.service';

@Component({
  selector: 'app-template3',
  standalone: true,
  imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, EditorComponent, CommentableDirective, EditorNormalComponent, TimeAgoPipe, RouterLink],
  templateUrl: './template3.component.html',
  styleUrl: './template3.component.scss'
})
export class Template3Component {
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
  currentPaperStatus: string | null = null;
  private readonly _mdlSvc = inject(NgbModal);
  thresholdData: ThresholdType[] = []
  logs: any[] = [];


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
            this.getPaperCommentLogs(Number(this.paperId));
          } else {
            this.isExpanded = false;
            if (!this.paperId && this.loggedInUser && this.loggedInUser?.roleName === 'Procurement Tag') {
              setTimeout(() => {
                this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue([this.loggedInUser?.id || null]);
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
    this.loadThresholdData()
    this.loadVendoreDetails()
    this.loadForm()

    this.generalInfoForm.get('generalInfo.camUserId')?.valueChanges.subscribe(() => {
      this.addConsultationRow(false, true);
    });

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

  getPaperCommentLogs(paperId: number) {
    this.paperService.getPaperCommentLogs(paperId).subscribe(value => {
      this.logs = value.data;
    })
  }

  loadForm() {
    this.generalInfoForm = this.fb.group({
      generalInfo: this.fb.group({
        paperProvision: ['', Validators.required],
        purposeRequired: ['', Validators.required],
        isChangeinSOW: [false],
        isIncreaseInValue: [false],
        isExtensionOfDuration: [false],
        isTEToCompleteBidding: [false],
        isChangeInRates: [false],
        cgbItemRefNo: [{value: '', disabled: true}],
        cgbCirculationDate: [{value: '', disabled: true}],
        cgbAwardRefNo: ['', Validators.required],
        cgbApprovalDate: [null],
        fullLegalName: ['', Validators.required],
        contractNo: [''],
        vendorId:[null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        globalCGB: ['', Validators.required],
        camUserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, Validators.required],
        operatingFunction: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        subSector: ['', Validators.required],
        sourcingType: ['', Validators.required],
        contractStartDate:  [null, Validators.required],
        contractEndDate: [null, Validators.required],
        variationStartDate: [null, Validators.required],
        variationEndDate:  [null, Validators.required],
        psajv: [[], Validators.required],
        isLTCC: [null],
        ltccNotes: [''],
        isGovtReprAligned: [null],
        govtReprAlignedComment: [''],
        isIFRS16: [false],
        isGIAAPCheck: [false],
      }),
      justificationSection: this.fb.group({
        whyChangeRequired:  ['', Validators.required],
        longTermStrategy:  ['', Validators.required],
      }),
      contractInfo: this.fb.group({
        isPHCA: [null],
        workspaceNo: [''],
        remunerationType: ['', Validators.required],
        previousCGBRefNo: [''],
        isPaymentRequired: [null],
        prePayAmount: [0],
        isRetrospectiveApproval: [null],
        retrospectiveApprovalReason: [''],
      }),
      contractValues: this.fb.group({
        originalContractValue: [0],
        previousVariationTotal: [0],
        thisVariationNote: ['', Validators.required],
        exchangeRate: [0],
        contractValue: [0],
        revisedContractValue: [0],
        spendOnContract: [0],
        isCurrencyLinktoBaseCost: [null],
        isConflictOfInterest: [null],
        conflictOfInterestComment: [''],
        // explain: [''], //TODO missing
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
        contractCommittee_SCP_Co_CC:[false],
        contractCommittee_SCP_Co_CCInfoNote:[false],
        contractCommittee_BTC_CC: [false],
        contractCommittee_BTC_CCInfoNote: [false],
        contractCommittee_CGB: [false], //TODO discuss
        coVenturers_CMC: [false],
        coVenturers_SDMC:[false],
        coVenturers_SCP: [false],
        coVenturers_SCP_Board: [false],
        steeringCommittee_SC: [false],
        // isACG: [{value: false, disabled: true}],
        // isShah: [{value: false, disabled: true}],
        // isSCP: [{value: false, disabled: true}],
        // isBTC: [{value: false, disabled: true}],
        // isAsiman: [{value: false, disabled: true}],
        // isBPGroup: [{value: false, disabled: true}],
      }),
      consultation: this.fb.array([]),
      costAllocationJVApproval: this.fb.array([]),

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


  onSubmit(): void {
    this.submitted = true;
    console.log("==this.generalInfoForm", this.generalInfoForm)
    if (!this.paperStatusId) {
      this.toastService.show("Paper status id not found", "danger")
      return
    }

    const generalInfoValue = this.generalInfoForm?.value?.generalInfo
    const justificationSectionValue = this.generalInfoForm?.value?.justificationSection
    const contractInfoValue = this.generalInfoForm?.value?.contractInfo
    const contractValues = this.generalInfoForm?.value?.contractValues
    const ccdValues = this.generalInfoForm?.value?.ccd
    const valueDeliveryValues = this.generalInfoForm?.value?.valueDelivery
    const costAllocationValues = this.generalInfoForm?.value?.costAllocation
    const consultationsValue = this.generalInfoForm?.value?.consultation


    const params = {
      papers: {
        paperStatusId: this.paperStatusId,
        paperProvision: generalInfoValue?.paperProvision || "",
        purposeRequired: generalInfoValue?.purposeRequired || "",
        isActive: true,
        ...(this.paperId && !this.isCopy ? {id: Number(this.paperId)} : {})
      },
      variationPaper: {
        isChangeinSOW: generalInfoValue?.isChangeinSOW || false,
        isIncreaseInValue: generalInfoValue?.isIncreaseInValue || false,
        isExtensionOfDuration: generalInfoValue?.isExtensionOfDuration || false,
        isTEToCompleteBidding: generalInfoValue?.isTEToCompleteBidding || false,
        isChangeInRates: generalInfoValue?.isChangeInRates || false,
        cgbCirculationDate: generalInfoValue?.cgbCirculationDate || null,
        cgbApprovalDate: generalInfoValue?.cgbApprovalDate || null,
        cgbItemRefNo: generalInfoValue?.cgbItemRefNo || '',
        cgbAwardRefNo: generalInfoValue?.cgbAwardRefNo || '',
        fullLegalName: generalInfoValue?.fullLegalName || '',
        contractNo: generalInfoValue?.contractNo || '',
        vendorId: generalInfoValue?.vendorId || null,
        globalCGB: generalInfoValue?.globalCGB,
        camUserId: generalInfoValue?.camUserId || null,
        vP1UserId: generalInfoValue?.vP1UserId || null,
        procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "",
        pdManagerName: generalInfoValue?.pdManagerName || null,
        operatingFunction: generalInfoValue?.operatingFunction,
        bltMember: generalInfoValue?.bltMember,
        subSector: generalInfoValue?.subSector,
        sourcingType: generalInfoValue?.sourcingType,
        contractStartDate: generalInfoValue?.contractStartDate || null,
        contractEndDate: generalInfoValue?.contractEndDate || null,
        variationStartDate: generalInfoValue?.variationStartDate || null,
        variationEndDate: generalInfoValue?.variationEndDate || null,
        psajv: generalInfoValue?.psajv?.join(',') || "",
        isLTCC: generalInfoValue?.isLTCC || false,
        ltccNotes: generalInfoValue?.ltccNotes,
        isGovtReprAligned: generalInfoValue?.isGovtReprAligned || false,
        govtReprAlignedComment: generalInfoValue?.govtReprAlignedComment,
        isIFRS16: generalInfoValue?.isIFRS16 || false,
        isGIAAPCheck: generalInfoValue?.isGIAAPCheck || false,
        //justificationSection
        whyChangeRequired: justificationSectionValue?.whyChangeRequired || '',
        longTermStrategy: justificationSectionValue?.longTermStrategy || '',
        //contractInfo

        isPHCA: contractInfoValue?.isPHCA || false,
        workspaceNo: contractInfoValue?.workspaceNo || '',
        remunerationType: contractInfoValue?.remunerationType || null,
        previousCGBRefNo: contractInfoValue?.previousCGBRefNo || null,
        isPaymentRequired: contractInfoValue?.isPaymentRequired || false,
        prePayAmount: contractInfoValue?.prePayAmount || 0,
        isRetrospectiveApproval: contractInfoValue?.isRetrospectiveApproval || false,
        retrospectiveApprovalReason: contractInfoValue?.retrospectiveApprovalReason || '',
        //contractValues
        originalContractValue: contractValues?.originalContractValue || 0,
        previousVariationTotal: contractValues?.previousVariationTotal || 0,
        exchangeRate: contractValues?.exchangeRate || 0,
        contractValue: contractValues?.contractValue || 0,
        revisedContractValue: contractValues?.revisedContractValue || 0,
        spendOnContract: contractValues?.spendOnContract || 0,
        thisVariationNote: contractValues?.thisVariationNote || '',
        isCurrencyLinktoBaseCost: contractValues?.isCurrencyLinktoBaseCost || false,
        isConflictOfInterest: contractValues?.isConflictOfInterest || false,
        conflictOfInterestComment: contractValues?.conflictOfInterestComment || '',
        //ccd
        isHighRiskContract: ccdValues?.isHighRiskContract || false,
        daCDDCompleted: ccdValues?.daCDDCompleted || null,
        highRiskExplanation: ccdValues?.highRiskExplanation || '',
        flagRaisedCDD: ccdValues?.flagRaisedCDD || '',
        additionalCDD: ccdValues?.additionalCDD || '',
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
      costAllocationJVApproval: [],
      jvApproval: {
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
      consultations: consultationsValue || [],

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

  generatePaper(params: any) {
    this.paperService.upsertVariationPaper(params).subscribe({
      next: (response) => {
        if (response.status && response.data) {
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
    });
  }

  toggleComments() {
    this.isExpanded = !this.isExpanded;
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
        this.router.navigate(['/all-papers'])
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

  scrollToTop(): void {
    window.scrollTo({top: 0, behavior: 'smooth'});
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

  addConsultationRow(isFirst = false, isChangedCamUser = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.consultationsDetails || []
      const riskMitigationArray = this.consultationRows;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index: number) => {
        riskMitigationArray.push(
          this.fb.group({
            psa: [item.psa, Validators.required],
            technicalCorrect: [{value: item.technicalCorrectId, disabled: false}, Validators.required],
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

}
