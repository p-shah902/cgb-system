import {Component, inject, Renderer2, ViewChild, ElementRef, TemplateRef, AfterViewInit} from '@angular/core';
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
import {PaperStatusType, PSAEntry} from '../../models/paper';
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
import {ToggleService} from '../shared/services/toggle.service';
import {CURRENCY_LIST} from '../../utils/constant';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-template3',
  standalone: true,
  imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, EditorComponent, CommentableDirective, EditorNormalComponent, TimeAgoPipe, RouterLink, NgbTooltip],
  templateUrl: './template3.component.html',
  styleUrl: './template3.component.scss'
})
export class Template3Component  implements AfterViewInit {
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
  isShowBoxSection = false
  comment: string = '';
  isInitialLoad = true;
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
  };

  psaItems = [
    {psaName: 'ACG', control: 'isACG', percentage: 'percentage_isACG', value: 'value_isACG'},
    {psaName: 'Shah Deniz', control: 'isShah', percentage: 'percentage_isShah', value: 'value_isShah'},
    {psaName: 'SCP', control: 'isSCP', percentage: 'percentage_isSCP', value: 'value_isSCP'},
    {psaName: 'BTC', control: 'isBTC', percentage: 'percentage_isBTC', value: 'value_isBTC'},
    {psaName: 'Sh-Asiman', control: 'isAsiman', percentage: 'percentage_isAsiman', value: 'value_isAsiman'},
    {psaName: 'BP Group', control: 'isBPGroup', percentage: 'percentage_isBPGroup', value: 'value_isBPGroup'}
  ];

  allowedGroups = [
    {key: 'originalValue', label: 'Original Value'},
    {key: 'previousValue', label: 'Previous Value'},
    {key: 'thisValue', label: 'This Value'},
    {key: 'revisedValue', label: 'Revised Value'}
  ];


  public psaJvOptions = [
    {value: 'ACG', label: 'ACG'},
    {value: 'Shah Deniz', label: 'Shah Deniz'},
    {value: 'SCP', label: 'SCP'},
    {value: 'BTC', label: 'BTC'},
    {value: 'Sh-Asiman', label: 'Sh-Asiman'},
    {value: 'BP Group', label: 'BP Group'}
  ];

  constructor(private router: Router,private toggleService: ToggleService, private route: ActivatedRoute, private dictionaryService: DictionaryService,
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
    });
    this.loadUserDetails();
    this.loadDictionaryItems();
    this.loadPaperStatusListData();
    this.loadThresholdData()
    this.loadVendoreDetails()
    this.loadForm()

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

    this.generalInfoForm.get('contractValues.currencyCode')?.valueChanges.subscribe(() => {
      this.updateExchangeRate();
    });

    this.generalInfoForm.get('contractValues.revisedContractValue')?.valueChanges.subscribe(() => {
      this.updateContractValueOriginalCurrency();
    });

    this.onLTCCChange()
    this.onCurrencyLinktoBaseCostChange()
    this.onConflictofInterestChange()
    this.onApprovalChange()

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
    // let camId = null
    //
    // if(!this.paperId && this.loggedInUser?.roleName === 'CAM') {
    //   camId = this.loggedInUser?.id || null
    // }
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
        vendorId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        globalCGB: ['', Validators.required],
        camUserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, Validators.required],
        operatingFunction: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        subSector: ['', Validators.required],
        sourcingType: ['', Validators.required],
        contractStartDate: [null, Validators.required],
        contractEndDate: [null, Validators.required],
        variationStartDate: [null, Validators.required],
        variationEndDate: [null, Validators.required],
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
        prePayAmount: [0],
        isRetrospectiveApproval: [null],
        retrospectiveApprovalReason: [{ value: '', disabled: true }],
      }),
      contractValues: this.fb.group({
        originalContractValue: [0],
        previousVariationTotal: [0],
        thisVariationNote: ['', Validators.required],
        exchangeRate: [0],
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
      }),
      consultation: this.fb.array([]),
      originalValue: this.createPsaFormGroup(),
      previousValue: this.createPsaFormGroup(),
      thisValue: this.createPsaFormGroup(),
      revisedValue: this.createPsaFormGroup(),
    });

  }

  createPsaFormGroup(): FormGroup {
    const group: any = {};

    this.psaItems.forEach(item => {
      group[item.control] = [false];
      group[item.percentage] = [0];
      group[item.value] = [0];
    });

    group.totalPercentage = [0];
    group.totalValue = [0];

    return this.fb.group(group)
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

  getAllSelectedPsa(): PSAEntry[] {
    const result: PSAEntry[] = [];

    this.allowedGroups.forEach(group => {
      const section = this.generalInfoForm.get(group.key) as FormGroup;
      const values = section.value;

      this.psaItems.forEach(psa => {
        if (values[psa.control]) {
          result.push({
            id: 0,
            paperType: group.label,
            psaName: psa.psaName,
            psaValue: true,
            percentage: values[psa.percentage],
            value: values[psa.value]
          });
        }
      });
    });

    return result;
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

  onSelectChangePSAJV() {
    const selectedOptions = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    const costAllocationControl = this.generalInfoForm.get('costAllocation');
    if (costAllocationControl) {
      const mapping: { [key: string]: string } = {
        "ACG": "isACG",
        "Shah Deniz": "isShah",
        "SCP": "isSCP",
        "BTC": "isBTC",
        "Sh-Asiman": "isAsiman",
        "BP Group": "isBPGroup"
      };

      Object.keys(mapping).forEach((key) => {
        const controlName = mapping[key];
        const isSelected = selectedOptions.includes(key);
        costAllocationControl.get(controlName)?.setValue(isSelected);
        if (isSelected) {
          this.addConsultationRowOnChangePSAJV(key);
        } else {
          this.removeConsultationRowByPSAJV(key);
        }
      });
    }

  }


  loadVendoreDetails() {

    this.vendorService.getVendorDetailsList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          this.vendorList = reponse.data;
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
    this.generalInfoForm.get('contractValues.isConflictOfInterest')?.valueChanges.subscribe((value) => {
      const ltccNotesControl = this.generalInfoForm.get('contractValues.conflictOfInterestComment');

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


  fetchPaperDetails(paperId: number) {
    this.paperService.getPaperDetails(paperId).subscribe((value) => {
      this.paperDetails = value.data as any;
      console.log("==this.paperDetails", this.paperDetails)
      const generatlInfoData = this.paperDetails?.paperDetails || null
      const jvApprovalsData = value.data?.jvApprovals[0] || null
      const costAllocationsData = value.data?.costAllocations || []
      const valueDeliveriesCostSharingData = value.data?.valueDeliveriesCostSharing[0] || null

      const selectedPaperStatus = this.paperStatusList.find((item) => item.id.toString() === generatlInfoData?.paperStatusId?.toString())

      if (selectedPaperStatus?.paperStatus !== "Draft") {
        this.isRegisterPaper = true
        this.commentService.loadPaper(paperId);
      }

      const selectedValuesPSAJV = generatlInfoData?.psajv ? generatlInfoData.psajv
        .split(',')
        .map((label: any) => label.trim())
        .map((label: any) => this.psaJvOptions.find((option) => option.label === label)?.value) // Convert label to value
        .filter((value: any) => value) : []


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
            isChangeinSOW: generatlInfoData.isChangeinSOW || false,
            isIncreaseInValue: generatlInfoData.isIncreaseInValue || false,
            isExtensionOfDuration: generatlInfoData.isExtensionOfDuration || false,
            isTEToCompleteBidding: generatlInfoData.isTEToCompleteBidding || false,
            isChangeInRates: generatlInfoData.isChangeInRates || false,
            cgbItemRefNo: generatlInfoData.cgbItemRefNo || '',
            cgbCirculationDate: generatlInfoData.cgbCirculationDate
              ? format(new Date(generatlInfoData.cgbCirculationDate), 'yyyy-MM-dd')
              : null,
            cgbAwardRefNo: generatlInfoData.cgbAwardRefNo || '',
            cgbApprovalDate: generatlInfoData.cgbApprovalDate
              ? format(new Date(generatlInfoData.cgbApprovalDate), 'yyyy-MM-dd')
              : null,
            fullLegalName: generatlInfoData.fullLegalName || '',
            contractNo: generatlInfoData.contractNo || '',
            vendorId: generatlInfoData.vendorId || null,
            globalCGB: generatlInfoData.globalCGB || null,
            camUserId: generatlInfoData.camUserId || null,
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
          costAllocation: {
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
          }
        })
        setTimeout(() => {
          this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue(selectedValuesProcurementTagUsers);
          this.generalInfoForm.get('generalInfo.psajv')?.setValue(selectedValuesPSAJV);
        }, 500)

        this.addConsultationRow(true);
        this.patchPsaData(costAllocationsData);


      }
    })
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
    const costAllocationJVApproval = this.getAllSelectedPsa()
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
        remunerationType: contractInfoValue?.remunerationType || '',
        previousCGBRefNo: contractInfoValue?.previousCGBRefNo || null,
        isPaymentRequired: contractInfoValue?.isPaymentRequired || false,
        prePayAmount: contractInfoValue?.prePayAmount || 0,
        isRetrospectiveApproval: contractInfoValue?.isRetrospectiveApproval || false,
        retrospectiveApprovalReason: contractInfoValue?.retrospectiveApprovalReason || '',
        //contractValues
        originalContractValue: contractValues?.originalContractValue || 0,
        previousVariationTotal: contractValues?.previousVariationTotal || 0,
        exchangeRate: contractValues?.exchangeRate || 0,
        currencyCode: contractValues?.currencyCode || null,
        contractValue: contractValues?.contractValue || 0,
        revisedContractValue: contractValues?.revisedContractValue || 0,
        spendOnContract: contractValues?.spendOnContract || 0,
        thisVariationNote: contractValues?.thisVariationNote || '',
        isCurrencyLinktoBaseCost: contractValues?.isCurrencyLinktoBaseCost || false,
        noCurrencyLinkNotes: contractValues?.noCurrencyLinkNotes || '',
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

}
