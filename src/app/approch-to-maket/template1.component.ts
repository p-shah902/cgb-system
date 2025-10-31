import { Component, inject, Renderer2, ViewChild, ElementRef, TemplateRef, AfterViewInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DummyCompComponent } from '../dummy-comp/dummy-comp.component';
import { CKEditorModule, loadCKEditorCloud, CKEditorCloudResult } from '@ckeditor/ckeditor5-angular';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import type { ClassicEditor, EditorConfig } from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,ValidatorFn
} from '@angular/forms';
import { CURRENCY_LIST } from '../../utils/constant';
import { UserService } from '../../service/user.service';
import { LoginUser, UserDetails } from '../../models/user';
import { PaperService } from '../../service/paper.service';
import { CountryDetail } from '../../models/general';
import { Generalervice } from '../../service/general.service';
import { UploadService } from '../../service/document.service';
import { Select2 } from 'ng-select2-component';
import { ToastService } from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { DictionaryService } from '../../service/dictionary.service';
import { DictionaryDetail, Item } from '../../models/dictionary';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Paper, PaperStatusType } from '../../models/paper';
import { environment } from '../../environments/environment';
import { EditorComponent } from '../../components/editor/editor.component';
import { format } from 'date-fns';
import { CommentableDirective } from '../../directives/commentable.directive';
import { EditorNormalComponent } from '../../components/editor-normal/editor-normal.component';
import { BehaviorSubject } from 'rxjs';
import { PaperConfigService } from '../../service/paper/paper-config.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { EditorService } from '../../service/editor.service';
import { CommentService } from '../../service/comment.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ActionBarComponent } from '../shared/components/action-bar/action-bar.component';
import { AuthService } from '../../service/auth.service';
import { ThresholdService } from '../../service/threshold.service';
import { ThresholdType } from '../../models/threshold';
import { cleanObject } from '../../utils';
import {ToggleService} from '../shared/services/toggle.service';
import { PermissionService } from '../shared/services/permission.service';
import {base64ToFile, getMimeTypeFromFileName} from '../../utils/index';
import {NumberInputComponent} from '../../components/number-input/number-input.component';
import {BatchService} from '../../service/batch.service';
import { COMMITTEE_CONDITIONS } from '../../utils/threshold-conditions';
import { VendorService } from '../../service/vendor.service';
import { VendorDetail } from '../../models/vendor';

@Component({
  selector: 'app-template1',
  standalone: true,
  imports: [CommonModule,NumberInputComponent, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, EditorComponent, CommentableDirective, EditorNormalComponent, TimeAgoPipe, NgbTooltip, RouterLink, NgbCollapseModule, ActionBarComponent],
  templateUrl: './template1.component.html',
  styleUrls: ['./template1.component.scss'],
})
export class Template1Component implements AfterViewInit  {
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
  private readonly vendorService = inject(VendorService);
  private psaCalculationListenersSet = new Set<string>(); // Track which PSAJV columns have calculation listeners

  isEndDateDisabled: boolean = true;
  minEndDate: string = '';
  submitted = false;
  paperStatusId: number | null = null;
  currentPaperStatus: string | null = null;
  paperId: string | null = null;
  isCopy = false;
  paperStatusList: PaperStatusType[] = [];
  paperDetails: Paper | null = null
  isRegisterPaper: boolean = false
  isInitialLoad = true;
  isExpanded: boolean = false; // Default expanded

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
  isShowJustification = false
  isShowBoxSection = false
  userDetails: UserDetails[] = [];
  countryDetails: CountryDetail[] = [];
  procurementTagUsers: any[] = [];
  vendorData: VendorDetail[] = [];
  highlightClass = 'highlight'; // CSS class for highlighting
  selectedFiles: any[] = [];
  isDragging = false;
  private allApisDone$ = new BehaviorSubject<boolean>(false);
  private completedCount = 0;
  private totalCalls = 5;
  logs: any[] = [];
  comment: string = '';
  loggedInUser: LoginUser | null = null;
  selectedPaper: number = 0;
  approvalRemark: string = '';
  reviewBy: string = '';
  thresholdData: ThresholdType[] = []
  deletedFiles: number[] = []
  sectionVisibility: { [key: string]: boolean } = {
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
    section6: false,
    section7: false,
  };
  batchPaperList: any[] = [];
  selectedBatchPaper: any = null;

  constructor(private toggleService: ToggleService,private router: Router, private route: ActivatedRoute, private dictionaryService: DictionaryService,
    private fb: FormBuilder, private countryService: Generalervice, private renderer: Renderer2, private uploadService: UploadService, public toastService: ToastService,
              private batchPaperService: BatchService,
              public permission: PermissionService
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
            this.getUploadedDocs(Number(this.paperId))
            this.getPaperCommentLogs(Number(this.paperId));
          } else {
            if(!this.paperId && this.loggedInUser && this.loggedInUser?.roleName === 'Procurement Tag') {
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
    this.loadCountry();
    this.loadDictionaryItems();
    this.loadPaperStatusListData();
    this.loadThresholdData()
    this.loadBatchPapersList();
    this.loadVendorData();
    this.setupJVAlignedAutoReset();

    let camId = null

    if(!this.paperId && this.loggedInUser?.roleName === 'CAM') {
      camId = this.loggedInUser?.id || null
    }

    this.generalInfoForm = this.fb.group({
      batchPaper: [null], // Add batch paper field
      generalInfo: this.fb.group({
        paperProvision: ['', Validators.required],
        cgbItemRefNo: [{ value: '', disabled: true }],
        cgbCirculationDate: [{ value: '', disabled: true }],
        purposeRequired: ['', Validators.required],
        scopeOfWork: [''],
        globalCGB: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        operatingFunction: ['', Validators.required],
        subSector: ['', Validators.required],
        sourcingType: ['', Validators.required],
        camUserId: [camId, [Validators.required, Validators.pattern("^[0-9]+$")]],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, Validators.required],
        contractValueUsd: [null, [Validators.required, Validators.min(0)]],
        originalCurrency: [''],
        exchangeRate: [0], // Number input
        contractValueOriginalCurrency: [0], // Number input
        contractStartDate: ['', Validators.required],
        contractEndDate: ['', Validators.required],
        isIFRS16: [false],
        isGIAAPCheck: [false],
        isPHCA: [null],
        psajv: [[], Validators.required],
        isLTCC: [null],
        ltccNotes: [{ value: '', disabled: true }],
        isGovtReprAligned: [null],
        govtReprAlignedComment: [''],
        isConflictOfInterest: [null],
        conflictOfInterestComment: [{ value: '', disabled: true }],
        strategyDescription: ['']
      }),
      procurementDetails: this.fb.group({
        remunerationType: ['', Validators.required],
        contractMgmtLevel: ['', Validators.required],
        sourcingRigor: ['', Validators.required],
        sourcingStrategy: [''],
        singleSourceJustification: [''],
        riskMitigation: this.fb.array([]),
        inviteToBid: this.fb.array([]),
        socaRsentOn: ['', Validators.required],
        socaRreceivedOn: ['', Validators.required],
        socarDescription: [''],
        preQualificationResult: [''],
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
        contractCommittee_SDCC: [{ value: false, disabled: true }],
        contractCommittee_SCP_Co_CC: [{ value: false, disabled: true }],
        contractCommittee_SCP_Co_CCInfoNote: [{ value: false, disabled: true }],
        contractCommittee_BTC_CC: [{ value: false, disabled: true }],
        contractCommittee_BTC_CCInfoNote: [{ value: false, disabled: true }],
        contractCommittee_CGB: [false], //TODO discuss
        coVenturers_CMC: [{ value: false, disabled: true }],
        coVenturers_SDMC: [{ value: false, disabled: true }],
        coVenturers_SCP: [{ value: false, disabled: true }],
        coVenturers_SCP_Board: [{ value: false, disabled: true }],
        steeringCommittee_SC: [{ value: false, disabled: true }],
        isACG: [{ value: false, disabled: true }],
        isShah: [{ value: false, disabled: true }],
        isSCP: [{ value: false, disabled: true }],
        isBTC: [{ value: false, disabled: true }],
        isAsiman: [{ value: false, disabled: true }],
        isBPGroup: [{ value: false, disabled: true }],
        // Percentage fields with validation (0-100)
        percentage_isACG: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isShah: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isSCP: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isBTC: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isAsiman: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isBPGroup: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],

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
        inventoryItemsMethodology: ['']
      }),
      consultation: this.fb.array([]),
      isNoExistingBudget: [false]
    });

    // Initialize with one row to prevent errors
    this.addRow();
    this.addBidRow();
    // Subscribe to changes in originalCurrency or contractValueUsd
    this.generalInfoForm.get('generalInfo.originalCurrency')?.valueChanges.subscribe(() => {
      // this.updateExchangeRate();
    });
    // Subscribe to changes in originalCurrency or contractValueUsd
    this.generalInfoForm.get('generalInfo.exchangeRate')?.valueChanges.subscribe(() => {
      this.updateContractValueOriginalCurrency();
    });

    this.generalInfoForm.get('generalInfo.contractValueUsd')?.valueChanges.subscribe(() => {
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


    // Watch changes on enable/disable Methodology


    this.setupPSAListeners()
    this.setupMethodologyListeners()
    this.setupPSACalculations()
    this.onLTCCChange()
    // this.alignGovChange()
    this.onSourcingTypeChange()
    this.conflictIntrestChanges()
    if(!this.paperId && this.loggedInUser && this.loggedInUser?.roleName === 'Procurement Tag') {
      setTimeout(() => {
        this.generalInfoForm.get('generalInfo.procurementSPAUsers')?.setValue([this.loggedInUser?.id || null]);
      }, 1000)
    }
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
      complete: () => {
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

  getPaperCommentLogs(paperId: number) {
    this.paperService.getPaperCommentLogs(paperId).subscribe(value => {
      this.logs = value.data;
    })
  }

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

  get batchPaper() {
    return this.generalInfoForm.get('batchPaper');
  }

  get generalInfo() {
    return this.generalInfoForm.get('generalInfo');
  }

  get procurementDetailsInfo() {
    return this.generalInfoForm.get('procurementDetails');
  }

  onLTCCChange() {
    this.generalInfoForm.get('generalInfo.isLTCC')?.valueChanges.subscribe((value) => {
      const ltccNotesControl = this.generalInfoForm.get('generalInfo.ltccNotes');

      if (value === true) {
        ltccNotesControl?.setValidators([Validators.required]);
        ltccNotesControl?.enable();
        this.isShowBoxSection= true
      } else {
        ltccNotesControl?.clearValidators();
        ltccNotesControl?.disable(); // <- disables the field
        this.isShowBoxSection= false
      }

      ltccNotesControl?.updateValueAndValidity();
    });
  }


  onSourcingTypeChange() {
    this.generalInfoForm.get('generalInfo.sourcingType')?.valueChanges.subscribe((value) => {
      const selectedType = this.sourcingTypeData.find(item => item.id === Number(value));
      this.isShowJustification = !selectedType || selectedType.itemValue !== "Competitive Bid";
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

  fetchPaperDetails(paperId: number) {
      this.paperService.getPaperDetails(paperId, 'approch').subscribe((value) => {
      this.paperDetails = value.data;
      // Store consultations data in paperDetails for addConsultationRow to access
      const consultationsData = value.data?.consultationsDetails || [];
      console.log('consultationsData from API:', consultationsData);
      if (!this.paperDetails.consultationsDetails) {
        this.paperDetails.consultationsDetails = [];
      }
      this.paperDetails.consultationsDetails = consultationsData;
      const paperDetailData = value.data?.paperDetails || null
      const bidInvitesData = value.data?.bidInvites || []
      const valueData = value.data?.valueDeliveriesCostsharing && (value.data?.valueDeliveriesCostsharing[0] || null)
      const jvApprovalsData = value.data?.jvApprovals && (value.data?.jvApprovals[0] || null)
      const costAllocationJVApprovalData = value.data?.costAllocationJVApproval || []

      const patchValues: any = { costAllocation: {} };

      const selectedPaperStatus = this.paperStatusList.find((item) => item.id.toString() === paperDetailData?.paperStatusId?.toString())

      if (selectedPaperStatus?.paperStatus !== "Draft") {
        this.isRegisterPaper = true
        this.commentService.loadPaper(paperId);
      }

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

      // PSA/JV mappings - dynamically create mapping from PSA data
      const psaNameToCheckbox: Record<string, string> = {};
      this.psaData.forEach(psa => {
        const checkboxName = this.getPSACheckboxControlName(psa.itemValue);
        psaNameToCheckbox[psa.itemValue.toLowerCase()] = checkboxName;
      });

      // Assign PSA/JV values dynamically
      costAllocationJVApprovalData.forEach(psa => {
        const checkboxKey = psaNameToCheckbox[psa.psaName?.toLowerCase() as keyof typeof psaNameToCheckbox];
        if (checkboxKey) {
          console.log('checkboxKey', `percentage_${checkboxKey}`);
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

      console.log('patchValues.costAllocation', patchValues.costAllocation);

      // Start with PSAs from paperDetailData
      const selectedValues = paperDetailData?.psajv ? paperDetailData.psajv
        .split(',')
        .map(label => label.trim())
        .map(label => this.psaJvOptions.find(option => option.label === label)?.value) // Convert label to value
        .filter(value => value) : []

      // Also include PSAs from costAllocationJVApproval that have values
      const psasFromCostAllocation = costAllocationJVApprovalData
        .filter(psa => psa.psaValue === true)
        .map(psa => {
          // Find the PSA value from psaJvOptions by matching the psaName
          const psaOption = this.psaJvOptions.find(option => 
            option.label === psa.psaName || option.value === psa.psaName
          );
          return psaOption?.value;
        })
        .filter(value => value);

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
        .map(id => id.trim())
        .map(id => this.procurementTagUsers.find(option => option.value === Number(id))?.value) // Convert label to value
        .filter(value => value) : [];

      if (value.data) {
        console.log('v', this.paperDetails);
        this.generalInfoForm.patchValue({
          batchPaper: paperDetailData?.batchPaperId || null,
          generalInfo: {
            paperProvision: paperDetailData?.paperProvision || '',
            cgbItemRefNo: paperDetailData?.cgbItemRefNo || '',
            cgbCirculationDate: paperDetailData?.cgbCirculationDate || '',
            purposeRequired: paperDetailData?.purposeRequired || '',
            scopeOfWork: paperDetailData?.scopeOfWork || '',
            globalCGB: paperDetailData?.globalCGB || '',
            bltMember: paperDetailData?.bltMemberId || null,
            operatingFunction: paperDetailData?.operatingFunction || '',
            subSector: paperDetailData?.subSector || '',
            sourcingType: paperDetailData?.sourcingType || '',
            camUserId: paperDetailData?.camUserId || null,
            vP1UserId: paperDetailData?.vP1UserId || null,
            procurementSPAUsers: selectedValuesProcurementTagUsers,
            pdManagerName: paperDetailData?.pdManagerNameId || null,
            contractValueUsd: paperDetailData?.contractValue || null,
            originalCurrency: paperDetailData?.currencyCode || '',
            exchangeRate: paperDetailData?.exchangeRate || 0,
            contractValueOriginalCurrency: (paperDetailData?.contractValue || 0) * (paperDetailData?.exchangeRate || 0),
            contractStartDate: paperDetailData?.contractStartDate
              ? format(new Date(paperDetailData.contractStartDate), 'yyyy-MM-dd')
              : '',
            contractEndDate: paperDetailData?.contractEndDate
              ? format(new Date(paperDetailData.contractEndDate), 'yyyy-MM-dd')
              : '',
            isIFRS16: paperDetailData?.isIFRS16 || false,
            isGIAAPCheck: paperDetailData?.isGIAAPCheck || false,
            isPHCA: paperDetailData?.isPHCA || false,
            psajv: allSelectedValues,
            isLTCC: paperDetailData?.isLTCC || false,
            ltccNotes: paperDetailData?.ltccNotes || '',
            isGovtReprAligned: paperDetailData?.isGovtReprAligned || false,
            govtReprAlignedComment: paperDetailData?.govtReprAlignedComment || '',
            isConflictOfInterest: paperDetailData?.isConflictOfInterest || false,
            conflictOfInterestComment: paperDetailData?.conflictOfInterestComment || '',
            strategyDescription: paperDetailData?.strategyDescription || '',
          },
          procurementDetails: {
            remunerationType: paperDetailData?.remunerationType || '',
            contractMgmtLevel: paperDetailData?.contractMgmtLevel || '',
            sourcingRigor: paperDetailData?.sourcingRigor || '',
            sourcingStrategy: paperDetailData?.sourcingStrategy || '',
            singleSourceJustification: paperDetailData?.singleSourceJustification || '',
            inviteToBid: bidInvitesData,
            socaRsentOn: paperDetailData?.socaRsentOn
              ? format(new Date(paperDetailData.socaRsentOn), 'yyyy-MM-dd')
              : '',
            socaRreceivedOn: paperDetailData?.socaRreceivedOn
              ? format(new Date(paperDetailData.socaRreceivedOn), 'yyyy-MM-dd')
              : '',
            socarDescription: paperDetailData?.socarDescription || '',
            preQualificationResult: paperDetailData?.preQualificationResult || ''
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
          isNoExistingBudget: paperDetailData?.isNoExistingBudget || false
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
          
          this.isInitialLoad = false;
        }, 500)

        this.addRow(true);
        this.addBidRow(true);
        this.addConsultationRow(true, false, consultationsData);
        this.setupPSAListeners()
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
              // Populate psaJvOptions dynamically from PSA data
              this.psaJvOptions = this.psaData.filter(item => item.isActive).map(item => ({
                value: item.itemValue,
                label: item.itemValue
              }));
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

  conflictIntrestChanges() {
    this.generalInfoForm.get('generalInfo.isConflictOfInterest')?.valueChanges.subscribe((value) => {
      const conflictOfInterestCommentControl = this.generalInfoForm.get('generalInfo.conflictOfInterestComment');

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

  onStartDateChange() {
    const startDate = this.generalInfoForm.get('generalInfo.contractStartDate')?.value;

    if (startDate) {
      this.isEndDateDisabled = false;
      this.minEndDate = startDate;
    } else {
      this.isEndDateDisabled = true;
      this.generalInfoForm.get('generalInfo.contractEndDate')?.setValue(''); // Reset end date
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

  onSelectChangePSAJV() {
    const selectedOptions = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    const costAllocationControl = this.generalInfoForm.get('costAllocation');
    if (costAllocationControl) {
      // Clear the listeners set to allow re-setup
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
          costAllocationControl.get(checkboxControlName)?.setValue(true);
          // Add consultation row
          this.addConsultationRowOnChangePSAJV(psaName);
        } else {
          // Remove consultation row
          this.removeConsultationRowByPSAJV(psaName);
        }
      });

      // After creating all form controls, setup listeners for selected PSAJV
      this.setupPSAListeners();
      this.setupPSACalculations();
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

  setupPSACalculationsManually() {
    // Get selected PSAJV columns dynamically
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    selectedPSAJV.forEach((psaName: string) => {
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      const percentageControl = this.generalInfoForm.get(`costAllocation.${percentageControlName}`);
      const valueControl = this.generalInfoForm.get(`costAllocation.${valueControlName}`);

      if (percentageControl && valueControl) {
        const percentageValue = percentageControl.value;
        const contractValue = this.generalInfoForm.get('generalInfo.contractValueUsd')?.value || 0;

        if (percentageValue >= 0 && percentageValue <= 100) {
          const calculatedValue = (percentageValue / 100) * contractValue;
          valueControl.setValue(calculatedValue, { emitEvent: false });
          this.calculateTotal();
        }
      }
    });
  }

  setupPSACalculations() {
    // Get selected PSAJV columns dynamically
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
        percentageControl.valueChanges.subscribe((percentageValue) => {
          const contractValue = this.generalInfoForm.get('generalInfo.contractValueUsd')?.value || 0;

          if (percentageValue >= 0 && percentageValue <= 100) {
            const calculatedValue = (percentageValue / 100) * contractValue;
            valueControl.setValue(calculatedValue, { emitEvent: false });
            this.calculateTotal();

            // Trigger committee logic after value is updated
            this.triggerCommitteeLogicForPSA(psaName);
          }
        });

        // Mark this PSAJV column as having listeners set up
        this.psaCalculationListenersSet.add(psaName);
      }
    });
  }

  /**
   * Evaluate thresholds and determine if committee checkbox should be checked
   * This implements the comprehensive Partner Threshold System logic
   */
  evaluateThreshold(psaName: string, checkboxType: string, byValue: number): boolean {
    const sourcingTypeId = Number(this.generalInfoForm.get('generalInfo.sourcingType')?.value) || 0;
    const psaAgreementId = this.getPSAAgreementId(psaName);
    const paperType = 'Approach to Market'; // For Template 1

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

    // Check specific Paper Type + Sourcing Type + Committee combinations and get the selected threshold
    const selectedThreshold = this.checkCommitteeConditions(paperType, sourcingTypeId, checkboxType, relevantThresholds);

    if (!selectedThreshold) {
      console.log(`Committee conditions not met for ${psaName} - ${checkboxType}`);
      return false;
    }

    // Template 1 & 2 (Approach to Market & Contract): Use ByValue > threshold
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
    console.log('====', matchingThresholds, committeeFilteredThresholds, committeeControlName, paperTypeFilteredThresholds);

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

    // Uncheck JV Aligned checkbox for the corresponding PSA in consultation rows
    this.uncheckJVAlignedForPSA(psaName);
  }

  // Method to uncheck JV Aligned checkbox for a specific PSA
  uncheckJVAlignedForPSA(psaName: string): void {
    this.consultationRows.controls.forEach((row, index) => {
      const psaControl = row.get('psa');
      const jvAlignedControl = row.get('jvAligned');

      if (psaControl?.value === psaName && jvAlignedControl) {
        jvAlignedControl.setValue(false);
      }
    });
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

  loadVendorData() {
    this.vendorService.getVendorDetailsList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.vendorData = response.data.filter(vendor => vendor.isActive);
          this.incrementAndCheck();
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  getVendorOptions() {
    return this.vendorData.map(vendor => ({
      value: vendor.id,
      label: vendor.legalName
    }));
  }

  onVendorSelectionChange(rowIndex: number) {
    const row = this.inviteToBid.at(rowIndex);
    const parentCompanyNameControl = row.get('parentCompanyName');
    
    // Get the value from the form control instead of the event
    const selectedValue = row.get('legalName')?.value;
    
    const vendorIdNum = Number(selectedValue);
    if (vendorIdNum && !isNaN(vendorIdNum) && parentCompanyNameControl) {
      const selectedVendor = this.vendorData.find(vendor => vendor.id === vendorIdNum);
      if (selectedVendor) {
        parentCompanyNameControl.setValue(selectedVendor.legalName);
      }
    } else if (parentCompanyNameControl) {
      parentCompanyNameControl.setValue('');
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

      // Enable only if method has value
      if (hasInitialValue) {
        checkboxControl.enable({ emitEvent: false });
      } else {
        checkboxControl.disable({ emitEvent: false });
      }

      // Watch methodology field changes
      methodControl.valueChanges.subscribe((value) => {
        const hasValue = value !== null && value !== undefined && value !== '';
        checkboxControl.setValue(hasValue, { emitEvent: false });

        if (hasValue) {
          checkboxControl.enable({ emitEvent: false });
        } else {
          checkboxControl.disable({ emitEvent: false });
        }
      });

      // Watch checkbox changes (only uncheck allowed)
      checkboxControl.valueChanges.subscribe((checked) => {
        if (!checked && methodControl.value) {
          methodControl.setValue(null);
        }
      });
    });
  }

  updateExchangeRate() {
    const originalCurrency = this.generalInfoForm.get('generalInfo.originalCurrency')?.value;
    const currencyItem = this.currenciesData.find((item) => item.id === Number(originalCurrency)) || null
    const currency = CURRENCY_LIST.find(c => c.code === currencyItem?.itemValue);
    const exchangeRate = currency ? currency.rate : 0;

    this.generalInfoForm.get('generalInfo.exchangeRate')?.setValue(exchangeRate);
    this.updateContractValueOriginalCurrency();
  }

  updateContractValueOriginalCurrency() {
    const contractValueUsd = Number(this.generalInfoForm.get('generalInfo.contractValueUsd')?.value) || 0;
    const exchangeRate = Number(this.generalInfoForm.get('generalInfo.exchangeRate')?.value) || 0;

    const convertedValue = contractValueUsd * exchangeRate;
    this.generalInfoForm.get('generalInfo.contractValueOriginalCurrency')?.setValue(convertedValue);
  }

  scrollToSection(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const section = document.getElementById(selectedValue);

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        viewportOffset: { top: 50, bottom: 50 }  // Adjust editor's viewport
      }
    };
  }

  private readonly _mdlSvc = inject(NgbModal);


  toggleComments() {
    if (!this.isExpanded) {
      this.toggleService.expandComments();
    } else {
      this.toggleService.collapseAll();
    }
  }

  get riskMitigation(): FormArray {
    return this.generalInfoForm.get('procurementDetails.riskMitigation') as FormArray;
  }

  // Getter for inviteToBid FormArray
  get inviteToBid(): FormArray {
    return this.generalInfoForm.get('procurementDetails.inviteToBid') as FormArray;
  }


  // Getter for FormArray
  get consultationRows(): FormArray {
    return this.generalInfoForm.get('consultation') as FormArray;
  }

  riskMitigationValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const risks = group.get('risks')?.value?.trim();
    const mitigations = group.get('mitigations')?.value?.trim();

    // If one is filled but the other is not, return error
    if ((risks && !mitigations) || (!risks && mitigations)) {
      return { bothRequired: true };
    }

    return null; // valid
  };

  // Add a new risk row
  addRow(isFirst = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.riskMitigations || []
      const riskMitigationArray = this.riskMitigation;
      riskMitigationArray.clear(); // Clear existing controls

      if(riskMitigationsData.length > 0){
        riskMitigationsData.forEach((item, index) => {
          riskMitigationArray.push(
            this.fb.group({
              srNo: item.srNo || this.generateId(index), // Use API value or generate ID
              risks: [item.risks || '', Validators.required],
              mitigations: [item.mitigations || '', Validators.required],
              id: [item.id]
            }, { validators: this.riskMitigationValidator })
          );
        });
      }
    } else {
      this.riskMitigation.push(
        this.fb.group({
          srNo: this.generateId(this.riskMitigation.length),
          risks: [''],
          mitigations: [''],
          id: [0]
        }, { validators: this.riskMitigationValidator })
      );
    }
  }

  // Remove a risk row
  removeRow(index: number) {
      this.riskMitigation.removeAt(index);
  }

  // Generate ID dynamically (001, 002, etc.)
  generateId(index: number): string {
    return (index + 1).toString().padStart(3, '0');
  }


  addBidRow(isFirst = false) {
    if (isFirst && this.paperDetails) {
      const riskMitigationsData = this.paperDetails.bidInvites || []
      const riskMitigationArray = this.inviteToBid;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item, index) => {
        // Find vendor by legalName to get vendorId
        const vendor = this.vendorData.find(v => v.vendorName === item.legalName);
        riskMitigationArray.push(
          this.fb.group({
            legalName: [vendor?.id || null, Validators.required], // Now stores vendorId
            isLocalOrJV: [item.isLocalOrJV], // Checkbox
            countryId: [item.countryId, Validators.required],
            parentCompanyName: [item.parentCompanyName],
            remarks: [item.remarks],
            id: [item.id]
          })
        );
      });
    } else {
      this.inviteToBid.push(
        this.fb.group({
          legalName: ['', Validators.required],
          isLocalOrJV: [false], // Checkbox
          countryId: [null, Validators.required],
          parentCompanyName: [''],
          remarks: [''],
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

  // Method to check if current user can edit JV Aligned checkbox
  canEditJVAligned(jvReviewUserId: number | null): boolean {
    if (!this.loggedInUser || !jvReviewUserId) {
      return false;
    }
    // JV Aligned is only editable by the user selected in JV Review column
    return this.loggedInUser.id === jvReviewUserId;
  }

  // Method to handle JV Review user change and enable/disable JV Aligned
  onJVReviewChange(rowIndex: number, jvReviewUserId: number | null) {
    const row = this.consultationRows.at(rowIndex);
    const jvAlignedControl = row.get('jvAligned');

    if (jvAlignedControl) {
      if (this.canEditJVAligned(jvReviewUserId)) {
        jvAlignedControl.enable();
      } else {
        jvAlignedControl.disable();
        jvAlignedControl.setValue(false); // Uncheck if not editable
      }
    }
  }



  addConsultationRow(isFirst = false, isChangedCamUser = false, consultationsData?: any[]) {
    if (isFirst) {
      // Use provided consultationsData, or fall back to paperDetails.consultationsDetails
      const riskMitigationsData = consultationsData || (this.paperDetails?.consultationsDetails as any[]) || []
      console.log('addConsultationRow - isFirst:', isFirst, 'paperDetails:', !!this.paperDetails);
      console.log('addConsultationRow - consultationsData param:', consultationsData);
      console.log('addConsultationRow - consultationsDetails from paperDetails:', this.paperDetails?.consultationsDetails);
      console.log('addConsultationRow - using riskMitigationsData:', riskMitigationsData);
      const riskMitigationArray = this.consultationRows;
      riskMitigationArray.clear(); // Clear existing controls

      riskMitigationsData.forEach((item: any, index) => {
        console.log('Creating consultation row:', index, item);
        const formGroup = this.fb.group({
          psa: [item.psa || item.psaValue || '', Validators.required],
          technicalCorrect: [{ value: item.technicalCorrect || item.technicalCorrectId || null, disabled: false }, Validators.required],
          budgetStatement: [item.budgetStatement || item.budgetStatementId || null, Validators.required],
          jvReview: [item.jvReview || item.jvReviewId || null, Validators.required],
          jvAligned: [{ value: item.isJVReviewDone || item.jvAligned || false, disabled: true }], // JV Aligned checkbox - disabled by default
          id: [item.id || 0]
        });
        riskMitigationArray.push(formGroup);
        console.log('Consultation row created, total rows:', riskMitigationArray.length);
        
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
          technicalCorrect: [{ value: camUserId ? Number(camUserId) : null, disabled: false }, Validators.required],
          budgetStatement: [null, Validators.required],
          jvReview: [null, Validators.required],
          jvAligned: [{ value: false, disabled: true }], // JV Aligned checkbox - disabled by default
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


  openModal() {
    const modalRef = this._mdlSvc.open(DummyCompComponent);
    modalRef.result.then((result) => {
      if (result) {
        console.log(result);
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
      }]).subscribe(value => {
        this.toastService.show('Paper has been moved to ' + status);
        this.router.navigate(['/all-papers'])
      });
    }

  }


  onSubmit(): void {
    this.submitted = true;
    console.log("==this.generalInfoForm", this.generalInfoForm)
    if (!this.paperStatusId) {
      this.toastService.show("Paper status id not found", "danger")
      return
    }

    const generalInfoValue = this.generalInfoForm?.value?.generalInfo
    const procurementValue = this.generalInfoForm?.value?.procurementDetails
    const consultationsValue = this.generalInfoForm?.value?.consultation
    const costSharingValues = this.generalInfoForm?.value?.costSharing
    const valueDeliveryValues = this.generalInfoForm?.value?.valueDelivery
    const costAllocationValues = this.generalInfoForm?.value?.costAllocation

    // Mapping PSAs from the costAllocation object dynamically
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    const psaMappings = selectedPSAJV.map((psaName: string) => ({
      key: this.getPSACheckboxControlName(psaName),
      name: psaName
    }));

    const costAllocationJVApproval = psaMappings
      .map((psa: any, index: number) => {
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
      .filter((item: any) => item !== null);


    const filteredRisks = this.riskMitigation.controls
      .filter(group => group.valid)
      .map(group => group.value);


    const filteredBids = this.inviteToBid.controls
      .filter(group => group.valid)
      .map(group => group.value); // only include valid rows

    const params = {
      papers: {
        id: this.paperId && !this.isCopy ? Number(this.paperId) : 0,
        paperStatusId: this.paperStatusId,
        paperProvision: generalInfoValue?.paperProvision,
        purposeRequired: generalInfoValue?.purposeRequired,
        isActive: true,
        bltMember: generalInfoValue?.bltMember,
        camUserId: generalInfoValue?.camUserId || null,
        vP1UserId: generalInfoValue?.vP1UserId || null,
        pdManagerName: generalInfoValue?.pdManagerName || null,
        procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "",
        cgbItemRefNo: generalInfoValue?.cgbItemRefNo || null,
        cgbCirculationDate: generalInfoValue?.cgbCirculationDate || null,
        globalCGB: generalInfoValue?.globalCGB,
        subSector: generalInfoValue?.subSector,
        operatingFunction: generalInfoValue?.operatingFunction,
        sourcingType: generalInfoValue?.sourcingType,
        isPHCA: generalInfoValue?.isPHCA || false,
        psajv: generalInfoValue?.psajv?.join(',') || "",
        contractValue: generalInfoValue?.contractValueUsd || 0,
        currencyCode: generalInfoValue?.originalCurrency || null,
        exchangeRate: generalInfoValue?.exchangeRate || 0,
        contractStartDate: generalInfoValue?.contractStartDate || null,
        contractEndDate: generalInfoValue?.contractEndDate || null,
        isLTCC: generalInfoValue?.isLTCC || false,
        isGovtReprAligned: generalInfoValue?.isGovtReprAligned || false,
        ltccNotes: generalInfoValue?.ltccNotes,
        govtReprAlignedComment: generalInfoValue?.govtReprAlignedComment,
        isIFRS16: generalInfoValue?.isIFRS16 || false,
        isConflictOfInterest: generalInfoValue?.isConflictOfInterest || false,
        conflictOfInterestComment: generalInfoValue?.conflictOfInterestComment,
        remunerationType: procurementValue?.remunerationType,
        isGIAAPCheck: generalInfoValue?.isGIAAPCheck || false
      },
      approachMarket: {
        scopeOfWork: generalInfoValue?.scopeOfWork,
        strategyDescription: generalInfoValue?.strategyDescription,
        contractMgmtLevel: procurementValue?.contractMgmtLevel,
        sourcingRigor: procurementValue?.sourcingRigor,
        sourcingStrategy: procurementValue?.sourcingStrategy,
        singleSourceJustification: procurementValue?.singleSourceJustification,
        socaRsentOn: procurementValue?.socaRsentOn || null,
        socaRreceivedOn: procurementValue?.socaRreceivedOn || null,
        socarDescription: procurementValue?.socarDescription,
        preQualificationResult: procurementValue?.preQualificationResult,
        isNoExistingBudget: this.generalInfoForm?.value?.isNoExistingBudget || false
      },
      consultations: consultationsValue?.map((consultation: any) => ({
        id: consultation.id || 0,
        psa: consultation.psa,
        technicalCorrect: consultation.technicalCorrect,
        budgetStatement: consultation.budgetStatement,
        jvReview: consultation.jvReview,
        isJVReviewDone: consultation.jvAligned || false
      })) || [],
      valueDeliveriesCostSharings: {
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
      bidInvite: filteredBids?.map((bid: any) => ({
        id: bid.id || 0,
        vendorId: bid.legalName || 0, // legalName now contains vendorId
        isLocalOrJV: bid.isLocalOrJV || false,
        countryId: bid.countryId,
        parentCompanyName: bid.parentCompanyName,
        remarks: bid.remarks
      })) || [],
      riskMitigation: filteredRisks?.map((risk: any) => ({
        id: risk.id || 0,
        srNo: risk.srNo,
        risks: risk.risks,
        mitigations: risk.mitigations
      })) || [],
      jvApproval: {
        contractCommittee_SDCC: costAllocationValues?.contractCommittee_SDCC || false,
        contractCommittee_BTC_CCInfoNote: costAllocationValues?.contractCommittee_BTC_CCInfoNote || false,
        contractCommittee_ShAsimanValue: 0, // This field is not in the form, setting to 0
        contractCommittee_SCP_Co_CC: costAllocationValues?.contractCommittee_SCP_Co_CC || false,
        contractCommittee_SCP_Co_CCInfoNote: costAllocationValues?.contractCommittee_SCP_Co_CCInfoNote || false,
        contractCommittee_BPGroupValue: 0, // This field is not in the form, setting to 0
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
      const isPassedCheck = this.checkThreshold(generalInfoValue?.contractValueUsd || 0, Number(generalInfoValue?.sourcingType || 0))
      if (!isPassedCheck) {
        this.toastService.show('Contract value must meet or exceed the selected threshold.', 'danger');
        return;
      }

      this.generatePaper(params)

    } else if (this.currentPaperStatus === "Draft") {
      const updatedParams = cleanObject(params);

      this.generatePaper(updatedParams)
    } else if (!this.generalInfoForm.valid && this.currentPaperStatus === "Registered") {
      this.toastService.show("Please fill all mandatory fields", "danger")
    }
  }

  generatePaper(params: any) {
    this.paperService.upsertApproachToMarkets(params).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          const docId = response.data.paperId || null
          this.uploadFiles(docId)
          this.deleteMultipleDocuments(docId)

          // Handle batch paper if selected
          const selectedBatch = this.generalInfoForm.get('batchPaper')?.value;
          if (selectedBatch && docId) {
            this.addPaperToBatch(selectedBatch.id, docId);
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
    });
  }

  checkThreshold(value: number, type: number) {
    if (this.thresholdData && this.thresholdData.length > 0) {
      const data = this.thresholdData.find(item => item.paperType === "Approach to Market" && item.sourcingType === type)
      return !(data && data.contractValueLimit > value);
    } else {
      return true
    }
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
      } else if (item.preview && item.id && this.isCopy) {
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

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleSection(section: string): void {
    this.sectionVisibility[section] = !this.sectionVisibility[section];

    // If opening section4 (Cost Allocation), ensure form controls are created
    if (section === 'section4' && this.sectionVisibility[section]) {
      this.ensureCostAllocationFormControls();
    }
  }

  // Ensure form controls are created for selected PSAJV columns
  ensureCostAllocationFormControls(): void {
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];
    const costAllocationControl = this.generalInfoForm.get('costAllocation') as FormGroup;

    selectedPSAJV.forEach((psaName: string) => {
      this.addPSAJVFormControls(psaName);
      // Set checkbox to checked and readonly
      const checkboxControlName = this.getPSACheckboxControlName(psaName);
      const percentageControlName = this.getPSAPercentageControlName(psaName);

      if (costAllocationControl) {
        if (costAllocationControl.get(checkboxControlName)) {
          costAllocationControl.get(checkboxControlName)?.setValue(true);
        }
        // Ensure percentage field is enabled
        if (costAllocationControl.get(percentageControlName)) {
          costAllocationControl.get(percentageControlName)?.enable();
        }
      }
    });

    // Setup calculations after ensuring all controls are created
    this.setupPSACalculations();
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
    // This can be extended to include a property in the PSA data if needed
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
      // BTC doesn't have 2nd Committee checkbox, so it's not included in the mapping
    };
    return mapping[psa.toLowerCase()] || '';
  }

  getSecondCommitteeLabel(psa: string): string {
    const mapping: { [key: string]: string } = {
      "acg": "SC",
      "shah deniz": "SDMC",
      "scp": "SCP Board"
      // BTC doesn't have 2nd Committee checkbox, so it's not included in the mapping
    };
    return mapping[psa.toLowerCase()] || '';
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

  // Method to remove form controls for a PSAJV column
  removePSAJVFormControls(psaName: string): void {
    const costAllocationControl = this.generalInfoForm.get('costAllocation') as FormGroup;
    if (costAllocationControl) {
      const checkboxControlName = this.getPSACheckboxControlName(psaName);
      const percentageControlName = this.getPSAPercentageControlName(psaName);
      const valueControlName = this.getPSAValueControlName(psaName);

      [checkboxControlName, percentageControlName, valueControlName].forEach(controlName => {
        if (costAllocationControl.get(controlName)) {
          costAllocationControl.removeControl(controlName);
        }
      });
    }
  }


}
