import {Component, inject, Renderer2, ViewChild, AfterViewInit, ElementRef, TemplateRef} from '@angular/core';
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
import {LoginUser, UserDetails} from '../../models/user';
import {PaperService} from '../../service/paper.service';
import {CountryDetail} from '../../models/general';
import {Generalervice} from '../../service/general.service';
import {Select2} from 'ng-select2-component';
import {ToastService} from '../../service/toast.service';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {environment} from '../../environments/environment';
import {PaperConfigService} from '../../service/paper/paper-config.service';
import {EditorService} from '../../service/editor.service';
import {CommentService} from '../../service/comment.service';
import {AuthService} from '../../service/auth.service';
import {ThresholdService} from '../../service/threshold.service';
import {CostAllocationJVApproval, Paper, PaperDetails, PaperStatusType} from '../../models/paper';
import {DictionaryDetail} from '../../models/dictionary';
import {ThresholdType} from '../../models/threshold';
import {DictionaryService} from '../../service/dictionary.service';
import {VendorService} from '../../service/vendor.service';
import {VendorDetail} from '../../models/vendor';
import {BehaviorSubject} from 'rxjs';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import {EditorComponent} from '../../components/editor/editor.component';
import {NumberInputComponent} from '../../components/number-input/number-input.component';
import {CommentableDirective} from '../../directives/commentable.directive';
import {EditorNormalComponent} from '../../components/editor-normal/editor-normal.component';
import {TimeAgoPipe} from '../../pipes/time-ago.pipe';
import {NgbTooltip} from '@ng-bootstrap/ng-bootstrap';
import {cleanObject} from '../../utils/index';
import {format} from 'date-fns';
import {ToggleService} from '../shared/services/toggle.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-template5',
  standalone: true,
  imports: [CommonModule, NumberInputComponent, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, EditorComponent, CommentableDirective, EditorNormalComponent, TimeAgoPipe, NgbTooltip, RouterLink],
  templateUrl: './template5.component.html',
  styleUrl: './template5.component.scss'
})
export class Template5Component  implements AfterViewInit{
  @ViewChild('sectionDropdown') sectionDropdown!: ElementRef<HTMLSelectElement>;

  generalInfoForm!: FormGroup;
  private readonly userService = inject(UserService);
  private readonly paperService = inject(PaperService);
  private readonly vendorService = inject(VendorService);
  private paperConfigService = inject(PaperConfigService);
  private editorService = inject(EditorService);
  private commentService = inject(CommentService);
  private authService = inject(AuthService);
  private searchTimeout: any;
  private readonly thresholdService = inject(ThresholdService);

  isEndDateDisabled: boolean = true;
  minEndDate: string = '';
  submitted = false;
  paperStatusId: number | null = null;
  currentPaperStatus: string | null = null;
  paperId: string | null = null;
  isCopy = false;
  paperStatusList: PaperStatusType[] = [];
  paperDetails: any = null
  isRegisterPaper: boolean = false
  vendorList: VendorDetail[] = []
  previousCGBItemOptions: any[] = []
  paperMappingData: any[] = []

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
  countryDetails: CountryDetail[] = [];
  procurementTagUsers: any[] = [];
  highlightClass = 'highlight'; // CSS class for highlighting
  selectedFiles: any[] = [];
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
  thresholdData: ThresholdType[] = []
  isInitialLoad = true;
  sectionVisibility: { [key: string]: boolean } = {
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
  };
  constructor(private router: Router,private toggleService: ToggleService, private route: ActivatedRoute, private dictionaryService: DictionaryService,
              private fb: FormBuilder, private countryService: Generalervice, private renderer: Renderer2, public toastService: ToastService,
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
    this.loadVendorDetails();
    // this.loadThresholdData()

    this.generalInfoForm = this.fb.group({
      generalInfo: this.fb.group({
        paperProvision: ['', Validators.required],
        purposeRequired: ['qw', Validators.required],
        transactionType: ['', Validators.required],
        isRetrospectiveApproval: [null],
        retrospectiveApprovalReason: [{ value: '', disabled: true }],
        reasontoChangeRequired: [''],
        cgbItemRefNo: [{value: '', disabled: true}],
        cgbCirculationDate: [{value: '', disabled: true}],
        legalName: ['', Validators.required],
        contractNumber: [''],
        operatingFunction: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        previousCGBItemRefNo: ['', Validators.required],
        subSector: ['', Validators.required],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, Validators.required],
        sourcingType: ['', Validators.required],
        camUserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        contractStartDate: [null, Validators.required],
        contractEndDate: [null, Validators.required],
        variationStartDate: [null, Validators.required],
        variationEndDate: [null, Validators.required],
        contractValue: [null],
        psajv: [[], Validators.required],
      }),
      ccd: this.fb.group({
        isHighRiskContract: [null],
        cddCompleted: [null],
        highRiskExplanation: [''],
        flagRaisedCDD: [''],
        additionalCDD: [''],
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

    this.generalInfoForm.get('generalInfo.camUserId')?.valueChanges.subscribe((newCamUserId) => {
      this.updateTechnicalCorrectInAllRows(newCamUserId);
    });
    this.setupPSAListeners()
    this.setupPSACalculations()
    this.onRTOhange()
    this.alignGovChange()
    this.setupPreviousCGBItemReference()

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
    this.paperService.getPaperDetails(paperId, 'info').subscribe((value) => {
      this.paperDetails = value.data as any;
      const paperDetailData = value.data?.paperDetails || null
      const generatlInfoData = this.paperDetails?.paperDetails || null

      const jvApprovalsData = value.data?.jvApprovals[0] || null
      const costAllocationJVApprovalData = value.data?.costAllocationJVApproval || []

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

      // Assign PSA/JV values dynamically using helper names
      costAllocationJVApprovalData.forEach((psa: any) => {
        const checkboxKey = this.getPSACheckboxControlName(psa.psaName);
        const percentageKey = this.getPSAPercentageControlName(psa.psaName);
        const valueKey = this.getPSAValueControlName(psa.psaName);
        if (checkboxKey) {
          patchValues.costAllocation[checkboxKey] = psa.psaValue;
          patchValues.costAllocation[percentageKey] = psa.percentage;
          patchValues.costAllocation[valueKey] = psa.value;
        }
      });

      const selectedValues = paperDetailData?.psajv ? paperDetailData.psajv
        .split(',')
        .map(label => label.trim())
        .map(label => this.psaJvOptions.find(option => option.label === label)?.value) // Convert label to value
        .filter(value => value) : []


      const selectedValuesProcurementTagUsers = paperDetailData?.procurementSPAUsers ? paperDetailData.procurementSPAUsers
        .split(',')
        .map(id => id.trim())
        .map(id => this.procurementTagUsers.find(option => option.value === Number(id))?.value) // Convert label to value
        .filter(value => value) : [];

      console.log("==patchValues.costAllocation", patchValues.costAllocation)

      if (value.data) {
        this.generalInfoForm.patchValue({
          generalInfo: {
            paperProvision: generatlInfoData?.paperProvision || '',
            purposeRequired: generatlInfoData?.purposeRequired || '',
            transactionType: generatlInfoData?.transactionType || '',
            isRetrospectiveApproval: generatlInfoData?.isRetrospectiveApproval || false,
            retrospectiveApprovalReason: generatlInfoData?.retrospectiveApprovalReason || '',
            reasontoChangeRequired: generatlInfoData?.reasontoChangeRequired || '',
            cgbItemRefNo: generatlInfoData?.cgbItemRef || '',
            cgbCirculationDate: generatlInfoData?.cgbCirculationDate || '',
            legalName: generatlInfoData?.vendorId || null,
            contractNumber: generatlInfoData?.contractNumber || '',
            operatingFunction: generatlInfoData?.operatingFunction || '',
            bltMember: generatlInfoData?.bltMemberId || null,
            previousCGBItemRefNo: generatlInfoData?.previousCGBItemRefNo ? generatlInfoData.previousCGBItemRefNo.toString() : '',
            contractValue: generatlInfoData?.contractValue || null,
            subSector: generatlInfoData?.subSector || '',
            sourcingType: generatlInfoData?.sourcingType || '',
            camUserId: generatlInfoData?.camUserId ? Number(generatlInfoData?.camUserId) : null,
            vP1UserId: generatlInfoData?.vP1UserId || null,

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
            psajv: selectedValues,
            procurementSPAUsers: selectedValuesProcurementTagUsers,
            pdManagerName: generatlInfoData?.pdManagerNameId || null,
          },
          ccd: {
            isHighRiskContract: generatlInfoData?.isHighRiskContract || false,
            daCDDCompleted: generatlInfoData?.daCDDCompleted
              ? format(new Date(generatlInfoData.daCDDCompleted), 'yyyy-MM-dd')
              : '',
            highRiskExplanation: generatlInfoData?.highRiskExplanation || '',
            flagRaisedCDD: generatlInfoData?.highRiskExplanation || '',
            additionalCDD: generatlInfoData?.highRiskExplanation || '',
          },
          costAllocation: patchValues.costAllocation,
        })
        setTimeout(() => {
          this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers);
          this.generalInfoForm.get('generalInfo.psajv')?.setValue(selectedValues);
          this.isInitialLoad = false;
        }, 500)


        this.addConsultationRow(true);
        this.setupPSAListeners()
      }
    })
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


  onSelectChangePSAJV() {
    const selectedOptions = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    const costAllocationControl = this.generalInfoForm.get('costAllocation') as FormGroup;
    if (costAllocationControl) {
      selectedOptions.forEach((psaName: string) => {
        this.addPSAJVFormControls(psaName);
        const checkboxControlName = this.getPSACheckboxControlName(psaName);
        costAllocationControl.get(checkboxControlName)?.setValue(true);
        this.addConsultationRowOnChangePSAJV(psaName);
      });
    }
    this.setupPSAListeners();
    this.setupPSACalculations();
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
          {value: camUserId ? Number(camUserId) : null, disabled: false},
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


  setupPSAListeners() {
    const psaControls = [
      {checkbox: 'isACG', percentage: 'percentage_isACG', value: 'value_isACG'},
      {checkbox: 'isShah', percentage: 'percentage_isShah', value: 'value_isShah'},
      {checkbox: 'isSCP', percentage: 'percentage_isSCP', value: 'value_isSCP'},
      {checkbox: 'isBTC', percentage: 'percentage_isBTC', value: 'value_isBTC'},
      {checkbox: 'isAsiman', percentage: 'percentage_isAsiman', value: 'value_isAsiman'},
      {checkbox: 'isBPGroup', percentage: 'percentage_isBPGroup', value: 'value_isBPGroup'}
    ];
    const costAllocationJVApprovalData = this.paperDetails?.costAllocationJVApproval || []
    const patchValues: any = {costAllocation: {}};

    const psaNameToCheckbox: Record<string, string> = {
      "ACG": "isACG",
      "Shah Deniz": "isShah",
      "SCP": "isSCP",
      "BTC": "isBTC",
      "Asiman": "isAsiman",
      "BP Group": "isBPGroup"
    };

    // Assign PSA/JV values dynamically
    costAllocationJVApprovalData.forEach((psa: any) => {
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

    psaControls.forEach(({checkbox, percentage, value}) => {
      this.generalInfoForm.get(`costAllocation.${checkbox}`)?.valueChanges.subscribe((isChecked) => {
        const percentageControl = this.generalInfoForm.get(`costAllocation.${percentage}`);
        const valueControl = this.generalInfoForm.get(`costAllocation.${value}`);
        const jvApprovalsData = this.paperDetails?.jvApprovals[0] || null

        //checkboxes
        const ACG1 = this.generalInfoForm.get(`costAllocation.coVenturers_CMC`)
        const ACG2 = this.generalInfoForm.get(`costAllocation.steeringCommittee_SC`)

        const SD1 = this.generalInfoForm.get(`costAllocation.contractCommittee_SDCC`)
        const SD2 = this.generalInfoForm.get(`costAllocation.coVenturers_SDMC`)

        const SCP1 = this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CC`)
        const SCP2 = this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CCInfoNote`)
        const SCP3 = this.generalInfoForm.get(`costAllocation.coVenturers_SCP`)

        const BTC1 = this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CC`)
        const BTC2 = this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CCInfoNote`)
        const BTC3 = this.generalInfoForm.get(`costAllocation.coVenturers_SCP_Board`)


        if (isChecked) {
          percentageControl?.enable();
          percentageControl?.setValue(patchValues.costAllocation[percentage] || 0, {emitEvent: false});
          valueControl?.setValue(patchValues.costAllocation[value] || 0, {emitEvent: false});

          if (checkbox === "isACG") {
            ACG1?.enable();
            ACG2?.enable();
            this.generalInfoForm.get(`costAllocation.coVenturers_CMC`)?.setValue(jvApprovalsData?.coVenturers_CMC || false, {emitEvent: false});
            this.generalInfoForm.get(`costAllocation.steeringCommittee_SC`)?.setValue(jvApprovalsData?.steeringCommittee_SC || false, {emitEvent: false});

          } else if (checkbox === "isShah") {
            SD1?.enable();
            SD2?.enable();
            this.generalInfoForm.get(`costAllocation.contractCommittee_SDCC`)?.setValue(jvApprovalsData?.contractCommittee_SDCC || false, {emitEvent: false});
            this.generalInfoForm.get(`costAllocation.coVenturers_SDMC`)?.setValue(jvApprovalsData?.coVenturers_SDMC || false, {emitEvent: false});
          } else if (checkbox === "isSCP") {
            SCP1?.enable();
            SCP2?.enable();
            SCP3?.enable();
            this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CC`)?.setValue(jvApprovalsData?.contractCommittee_SCP_Co_CC || false, {emitEvent: false});
            this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CCInfoNote`)?.setValue(jvApprovalsData?.contractCommittee_SCP_Co_CCInfoNote || false, {emitEvent: false});
            this.generalInfoForm.get(`costAllocation.coVenturers_SCP`)?.setValue(jvApprovalsData?.coVenturers_SCP || false, {emitEvent: false});
          } else if (checkbox === "isBTC") {
            BTC1?.enable();
            BTC2?.enable();
            BTC3?.enable();

            this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CC`)?.setValue(jvApprovalsData?.contractCommittee_BTC_CC || false, {emitEvent: false});
            this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CCInfoNote`)?.setValue(jvApprovalsData?.contractCommittee_BTC_CCInfoNote || false, {emitEvent: false});
            this.generalInfoForm.get(`costAllocation.coVenturers_SCP_Board`)?.setValue(jvApprovalsData?.coVenturers_SCP_Board || false, {emitEvent: false});
          }

        } else {
          percentageControl?.reset();
          percentageControl?.disable();
          valueControl?.reset();

          if (checkbox === "isACG") {
            ACG1?.disable();
            ACG1?.reset();
            ACG2?.disable();
            ACG2?.reset();
            this.generalInfoForm.get(`costAllocation.coVenturers_SCP_Board`)?.setValue(jvApprovalsData?.coVenturers_SCP_Board || false, {emitEvent: false});
          } else if (checkbox === "isShah") {
            SD1?.disable();
            SD1?.reset();
            SD2?.disable();
            SD2?.reset();
          } else if (checkbox === "isSCP") {
            SCP1?.enable();
            SCP2?.enable();
            SCP3?.enable();
            SCP1?.reset();
            SCP2?.reset();
            SCP3?.reset();
          } else if (checkbox === "isBTC") {
            BTC1?.disable();
            BTC2?.disable();
            BTC3?.disable();
            BTC1?.reset();
            BTC2?.reset();
            BTC3?.reset();
          }
        }
      });
    });
  }

  setupPSACalculations() {
    const psaControls = [
      {percentage: 'percentage_isACG', value: 'value_isACG'},
      {percentage: 'percentage_isShah', value: 'value_isShah'},
      {percentage: 'percentage_isSCP', value: 'value_isSCP'},
      {percentage: 'percentage_isBTC', value: 'value_isBTC'},
      {percentage: 'percentage_isAsiman', value: 'value_isAsiman'},
      {percentage: 'percentage_isBPGroup', value: 'value_isBPGroup'}
    ];

    psaControls.forEach(({percentage, value}) => {
      this.generalInfoForm.get(`costAllocation.${percentage}`)?.valueChanges.subscribe((percentageValue) => {
        const contractValue = this.generalInfoForm.get('generalInfo.saleDisposeValue')?.value || 0;

        if (percentageValue >= 0 && percentageValue <= 100) {
          const calculatedValue = (percentageValue / 100) * contractValue;
          this.generalInfoForm.get(`costAllocation.${value}`)?.setValue(calculatedValue, {emitEvent: false});
          this.calculateTotal()
        }
      });
    });
  }

  calculateTotal() {
    const costAllocation = this.generalInfoForm.get('costAllocation') as FormGroup;

    let totalPercentage = 0;
    let totalValue = 0;

    const percentageFields = [
      'percentage_isACG', 'percentage_isShah', 'percentage_isSCP',
      'percentage_isBTC', 'percentage_isAsiman', 'percentage_isBPGroup'
    ];
    const valueFields = [
      'value_isACG', 'value_isShah', 'value_isSCP',
      'value_isBTC', 'value_isAsiman', 'value_isBPGroup'
    ];

    percentageFields.forEach((field) => {
      const value = costAllocation.get(field)?.value;
      if (!isNaN(value) && value !== null && value !== '') {
        totalPercentage += Number(value);
      }
    });

    valueFields.forEach((field) => {
      const value = costAllocation.get(field)?.value;
      if (!isNaN(value) && value !== null && value !== '') {
        totalValue += Number(value);
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

  onRTOhange() {
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
    this.userService.getUserDetailsList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.userDetails = response.data;
          this.procurementTagUsers = response.data.filter(user => user.roleName !== 'Procurement Tag').map(t => ({
            label: t.displayName,
            value: t.id
          }));

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
              this.psaJvOptions = this.psaData.map(item => ({ value: item.itemValue, label: item.itemValue }));
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

  // Dynamic PSA helpers (mirroring template1/template2)
  getSelectedPSAJVColumns(): string[] {
    if (!this.generalInfoForm || !this.generalInfoForm.get('generalInfo.psajv')) {
      return [];
    }
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    return selectedPSAJV;
  }

  getPSACheckboxControlName(psa: string): string {
    if (!psa) return '';
    const cleanName = psa.replace(/[^a-zA-Z0-9]/g, '');
    return `is${cleanName}`;
  }

  getPSAPercentageControlName(psa: string): string {
    if (!psa) return '';
    const cleanName = psa.replace(/[^a-zA-Z0-9]/g, '');
    return `percentage_is${cleanName}`;
  }

  getPSAValueControlName(psa: string): string {
    if (!psa) return '';
    const cleanName = psa.replace(/[^a-zA-Z0-9]/g, '');
    return `value_is${cleanName}`;
  }

  getPSAControlSuffix(psa: string): string {
    const cleanName = psa.replace(/[^a-zA-Z0-9]/g, '');
    return `is${cleanName}`;
  }

  hasFirstCommitteeCheckbox(psa: string): boolean {
    const psaLower = psa.toLowerCase();
    return ['acg', 'shah deniz', 'scp', 'btc'].includes(psaLower);
  }

  hasSecondCommitteeCheckbox(psa: string): boolean {
    const psaLower = psa.toLowerCase();
    return ['acg', 'shah deniz', 'scp'].includes(psaLower);
  }

  getFirstCommitteeControlName(psa: string): string {
    const mapping: { [key: string]: string } = {
      'acg': 'coVenturers_CMC',
      'shah deniz': 'contractCommittee_SDCC',
      'scp': 'contractCommittee_SCP_Co_CC',
      'btc': 'contractCommittee_BTC_CC'
    };
    return mapping[psa.toLowerCase()] || '';
  }

  getFirstCommitteeLabel(psa: string): string {
    const mapping: { [key: string]: string } = {
      'acg': 'CMC',
      'shah deniz': 'SDCC',
      'scp': 'SCP Co CC',
      'btc': 'BTC CC'
    };
    return mapping[psa.toLowerCase()] || '';
  }

  getSecondCommitteeControlName(psa: string): string {
    const mapping: { [key: string]: string } = {
      'acg': 'steeringCommittee_SC',
      'shah deniz': 'coVenturers_SDMC',
      'scp': 'coVenturers_SCP'
    };
    return mapping[psa.toLowerCase()] || '';
  }

  getSecondCommitteeLabel(psa: string): string {
    const mapping: { [key: string]: string } = {
      'acg': 'SC',
      'shah deniz': 'SDMC',
      'scp': 'SCP Board'
    };
    return mapping[psa.toLowerCase()] || '';
  }

  // Add PSA controls dynamically into costAllocation group
  addPSAJVFormControls(psaName: string): void {
    const costAllocationControl = this.generalInfoForm.get('costAllocation') as FormGroup;
    if (costAllocationControl) {
      const checkboxControlName = this.getPSACheckboxControlName(psaName);
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      if (!costAllocationControl.get(checkboxControlName)) {
        costAllocationControl.addControl(checkboxControlName, this.fb.control({ value: true, disabled: true }));
      }
      if (!costAllocationControl.get(percentageControlName)) {
        costAllocationControl.addControl(percentageControlName, this.fb.control({ value: '', disabled: false }, [Validators.min(0), Validators.max(100)]));
      }
      if (!costAllocationControl.get(valueControlName)) {
        costAllocationControl.addControl(valueControlName, this.fb.control(null));
      }
    }
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

  loadVendorDetails() {
    this.vendorService.getVendorDetailsList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          this.vendorList = reponse.data.filter(vendor => vendor.isActive);
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
    // Update Previous CGB Item Reference options when vendor changes
    this.updatePreviousCGBItemOptions();
    
    // If a linked paper is selected and it's a Contract Award with split award,
    // recalculate the contract value based on the new vendor selection
    const previousCGBItemRefNo = this.generalInfoForm.get('generalInfo.previousCGBItemRefNo')?.value;
    if (previousCGBItemRefNo) {
      const linkedPaper = this.paperMappingData.find(p => p.paperID?.toString() === previousCGBItemRefNo.toString());
      if (linkedPaper && linkedPaper.paperType === 'Contract Award') {
        // Re-populate contract value for split award scenario
        this.populateContractValueFromLinkedPaper(Number(previousCGBItemRefNo));
      }
    }
  }

  setupPreviousCGBItemReference() {
    // Fetch all papers for mapping
    this.paperService.getApprovedPapersForMapping().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperMappingData = response.data || [];
          // Initial update based on current vendor selection
          this.updatePreviousCGBItemOptions();
        }
      },
      error: (error) => {
        console.log('error fetching papers for mapping', error);
      }
    });

    // Subscribe to legalName changes to update options
    this.generalInfoForm.get('generalInfo.legalName')?.valueChanges.subscribe(() => {
      this.updatePreviousCGBItemOptions();
    });
  }

  updatePreviousCGBItemOptions() {
    const selectedVendorId = this.generalInfoForm.get('generalInfo.legalName')?.value;
    
    if (!selectedVendorId || !this.paperMappingData.length) {
      this.previousCGBItemOptions = [];
      return;
    }

    // Find the vendor's legal name
    const selectedVendor = this.vendorList.find(v => v.id === Number(selectedVendorId));
    const vendorLegalName = selectedVendor?.legalName;

    if (!vendorLegalName) {
      this.previousCGBItemOptions = [];
      return;
    }

    // Filter papers by same vendor (legalName)
    // Filter by paperType = "Info Note" (template5 papers) and excluding Draft/Withdrawn
    // Also filter by vendorId if available in the API response
    const filteredPapers = this.paperMappingData.filter((item) => {
      // Exclude current paper if editing
      if (this.paperId && item.paperID?.toString() === this.paperId) {
        return false;
      }
      
      // Basic filters
      if (item.paperStatusName === "Draft" || item.paperStatusName === "Withdrawn") {
        return false;
      }
      
      if (item.paperType !== "Info Note") {
        return false;
      }
      
      // Filter by vendorId if available in the response
      // If vendorId is available, match it with selected vendor
      if (item.vendorId !== undefined && item.vendorId !== null) {
        return Number(item.vendorId) === Number(selectedVendorId);
      }
      
      // If vendorId not available, include all Info Note papers (vendor filtering will need backend support)
      return true;
    });

    // Create formatted options for Select2
    this.previousCGBItemOptions = filteredPapers.map((item) => {
      const refNo = item.paperID.toString();
      const title = item.paperSubject ? (item.paperSubject.length > 50 ? item.paperSubject.substring(0, 50) + '...' : item.paperSubject) : '';
      const date = item.entryDate ? new Date(item.entryDate).toLocaleDateString() : '';
      
      const label = `${refNo}, ${title}, ${date}`;
      
      return {
        value: refNo,
        label: label
      };
    });
  }

  onPreviousCGBItemSelected(event: any) {
    // The form control already has the value set (Ref. No as string)
    const selectedPaperId = event;
    if (selectedPaperId) {
      this.populateContractValueFromLinkedPaper(Number(selectedPaperId));
    } else {
      // Clear contract value if no paper is selected
      this.generalInfoForm.get('generalInfo.contractValue')?.setValue(null);
    }
  }

  populateContractValueFromLinkedPaper(paperId: number) {
    // Find the paper from mapping data to determine its type
    const linkedPaper = this.paperMappingData.find(p => p.paperID === paperId);
    
    if (!linkedPaper) {
      return;
    }

    const paperType = linkedPaper.paperType;
    const contractValueControl = this.generalInfoForm.get('generalInfo.contractValue');

    // Fetch paper details based on type
    let apiType = '';
    if (paperType === 'Approach to Market') {
      apiType = 'approch';
    } else if (paperType === 'Contract Award') {
      apiType = 'contract';
    } else if (paperType === 'Variation') {
      apiType = 'variation';
    } else {
      return;
    }

    this.paperService.getPaperDetails(paperId, apiType).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const paperData = response.data as any;
          let contractValue = null;

          if (paperType === 'Approach to Market') {
            // Linked AtM: Take Contract Value
            const generalInfo = paperData?.paperDetails || null;
            contractValue = generalInfo?.contractValue || null;
          } else if (paperType === 'Contract Award') {
            // Linked Award: Take Award Value or Award Value for selected Vendor (if Split Award)
            const generalInfo = paperData?.paperDetails || null;
            const isSplitAward = generalInfo?.isSplitAward || false;
            const selectedVendorId = this.generalInfoForm.get('generalInfo.legalName')?.value;

            if (isSplitAward && selectedVendorId) {
              // For split award, get vendor-specific award value
              const legalEntitiesAwarded = paperData?.legalEntitiesAwarded || [];
              const vendorEntity = legalEntitiesAwarded.find((entity: any) => 
                entity.vendorId === Number(selectedVendorId)
              );
              contractValue = vendorEntity?.totalAwardValueUSD || null;
            } else {
              // Use total award value
              contractValue = generalInfo?.totalAwardValueUSD || null;
            }
          } else if (paperType === 'Variation') {
            // Linked Variation: Take Total Revised Value
            const contractValues = paperData?.contractValues || null;
            contractValue = contractValues?.revisedContractValue || null;
          }

          if (contractValue !== null && contractValue !== undefined) {
            contractValueControl?.setValue(Number(contractValue));
          }
        }
      },
      error: (error) => {
        console.log('Error fetching linked paper details:', error);
      }
    });
  }

  getVendorLegalName(vendorId: number | null): string {
    if (!vendorId) return '';
    const vendor = this.vendorList.find(v => v.id === vendorId);
    return vendor?.legalName || '';
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

  addConsultationRow(isFirst = false, isChangedCamUser = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.consultationsDetails || []
      const riskMitigationArray = this.consultationRows;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index: number) => {
        riskMitigationArray.push(
          this.fb.group({
            psa: [item.psa, Validators.required],
            technicalCorrect: [{ value: item.technicalCorrectId, disabled: false }, Validators.required],
            budgetStatement: [item.budgetStatementId, Validators.required],
            jvReview: [item.jvReviewId, Validators.required],
            jvAligned: [{ value: (item as any).jvAligned || false, disabled: true }],
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
          technicalCorrect: [{ value: camUserId ? Number(camUserId) : null, disabled: false }, Validators.required],
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


  openModal() {
    const modalRef = this._mdlSvc.open(DummyCompComponent);
    modalRef.result.then((result) => {
      if (result) {
        console.log(result);
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    console.log("==this.generalInfoForm", this.generalInfoForm)
    if (!this.paperStatusId) {
      this.toastService.show("Paper status id not found", "danger")
      return
    }

    const generalInfoValue = this.generalInfoForm?.value?.generalInfo
    const consultationsValue = this.generalInfoForm?.value?.consultation
    const costAllocationValues = this.generalInfoForm?.value?.costAllocation
    const ccdValues = this.generalInfoForm?.value?.ccd

    // Mapping PSAs from the costAllocation object
    const psaMappings = [
      { key: "isACG", name: "ACG" },
      { key: "isShah", name: "Shah Deniz" },
      { key: "isSCP", name: "SCP" },
      { key: "isBTC", name: "BTC" },
      { key: "isAsiman", name: "Sh-Asiman" },
      { key: "isBPGroup", name: "BP Group" }
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


    const params = {
      papers: {
        paperStatusId: this.paperStatusId,
        paperProvision: generalInfoValue?.paperProvision,
        purposeRequired: generalInfoValue?.purposeRequired,
        isActive: true,
        ...(this.paperId && !this.isCopy ? { id: Number(this.paperId) } : {})
      },
      masterInfoNote: {
        transactionType: generalInfoValue?.transactionType || null,
        retrospectiveApprovalReason: generalInfoValue?.retrospectiveApprovalReason,
        isRetrospectiveApproval: generalInfoValue?.isRetrospectiveApproval || false,
        reasontoChangeRequired: generalInfoValue?.reasontoChangeRequired || "",
        cgbItemRefNo: generalInfoValue?.cgbItemRefNo || '',
        cgbCirculationDate: generalInfoValue?.cgbCirculationDate || null,
        vendorId: generalInfoValue?.legalName || '',
        contractNumber: generalInfoValue?.contractNumber || '',
        operatingFunction: generalInfoValue?.operatingFunction,
        bltMember: generalInfoValue?.bltMember,
        previousCGBItemRefNo: generalInfoValue?.previousCGBItemRefNo || null,
        contractValue: generalInfoValue?.contractValue || null,
        subSector: generalInfoValue?.subSector,
        sourcingType: generalInfoValue?.sourcingType,
        cam: generalInfoValue?.camUserId || null, //TODO
        vP1UserId: generalInfoValue?.vP1UserId || null,
        contractStartDate: generalInfoValue?.contractStartDate || null,
        contractEndDate: generalInfoValue?.contractEndDate || null,
        variationStartDate: generalInfoValue?.variationStartDate || null,
        variationEndDate: generalInfoValue?.variationEndDate || null,
        psajv: generalInfoValue?.psajv?.join(',') || "",
        procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "",
        pdManagerName: generalInfoValue?.pdManagerName || null,
        //ccd
        isHighRiskContract: ccdValues?.isHighRiskContract || false,
        daCDDCompleted: ccdValues?.daCDDCompleted || null,
        highRiskExplanation: ccdValues?.highRiskExplanation || '',
        flagRaisedCDD: ccdValues?.flagRaisedCDD || '',
        additionalCDD: ccdValues?.additionalCDD || '',
      },
      consultations: consultationsValue || [],
      costAllocationJVApproval: costAllocationJVApproval || [],
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
      }
    }

    if (this.currentPaperStatus === "Registered") {
      if (!this.generalInfoForm.valid) {
        this.toastService.show("Please fill all mandatory fields", "danger");
        return; // Early stop!
      }
      this.generatePaper(params);
    }
    else if (this.currentPaperStatus === "Draft") {
      if (!params?.masterInfoNote?.transactionType) {
        this.toastService.show('Please select a Transaction Type before saving as Draft.', 'danger');
        return; // Early stop!
      }
      const updatedParams = cleanObject(params);
      this.generatePaper(updatedParams);
    }

  }

  generatePaper(params: any) {
    this.paperService.upsertInfoNote(params).subscribe({
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

}

