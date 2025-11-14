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
import {LoginUser, UserDetails, GetUsersListRequest} from '../../models/user';
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
import { PermissionService } from '../shared/services/permission.service';
import { ActionBarComponent } from '../shared/components/action-bar/action-bar.component';

@Component({
  selector: 'app-template5',
  standalone: true,
  imports: [CommonModule, NumberInputComponent, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, EditorComponent, CommentableDirective, EditorNormalComponent, TimeAgoPipe, NgbTooltip, RouterLink, ActionBarComponent],
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
  isSubmitting = false;
  isLoadingDetails = false;
  isExporting = false;
  paperStatusId: number | null = null;
  currentPaperStatus: string | null = null;
  pendingStatus: string | null = null;
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
        purposeRequired: ['', Validators.required],
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
        contractEndDate: [null, [Validators.required, this.endDateAfterStartDate('contractStartDate')]],
        variationStartDate: [null, Validators.required],
        variationEndDate: [null, [Validators.required, this.endDateAfterStartDate('variationStartDate')]],
        contractValue: [{value: null, disabled: true}],
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

    // Subscribe to Previous CGB Item Reference changes to auto-populate contract value
    this.generalInfoForm.get('generalInfo.previousCGBItemRefNo')?.valueChanges.subscribe((previousCGBItemRefNo) => {
      if (previousCGBItemRefNo) {
        console.log('Previous CGB Item Reference changed via valueChanges:', previousCGBItemRefNo);
        this.populateContractValueFromLinkedPaper(Number(previousCGBItemRefNo));
      } else {
        // Clear contract value if no paper is selected
        console.log('Previous CGB Item Reference cleared via valueChanges');
        this.generalInfoForm.get('generalInfo.contractValue')?.setValue(null);
      }
    });

    // Recalculate PSA values when contract value changes
    this.generalInfoForm.get('generalInfo.contractValue')?.valueChanges.subscribe(() => {
      this.setupPSACalculationsManually();
    });

    this.setupPSAListeners()
    this.setupPSACalculations()
    this.onRTOhange()
    this.alignGovChange()
    this.setupPreviousCGBItemReference()
    this.setupJVAlignedAutoReset()
    this.setupDateValidation()

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

  fetchPaperDetails(paperId: number) {
    // isLoadingDetails is already set to true when paperId is detected
    this.paperService.getPaperDetails(paperId, 'info').subscribe({
      next: (value) => {
        // Handle both nested (infoNote.paperDetails) and flat (paperDetails) structures
        const data = value.data as any;
      const infoNoteData = data?.infoNote || data;
      this.paperDetails = infoNoteData;

      // Store consultations data in paperDetails for addConsultationRow to access
      const consultationsData = infoNoteData?.consultationsDetails || [];
      this.paperDetails.consultationsDetails = consultationsData;
      // Use paperDetails if it exists (nested structure), otherwise fall back to infoNoteData (flat structure)
      const generatlInfoData = infoNoteData?.paperDetails || infoNoteData

      const jvApprovalsData = infoNoteData?.jvApprovals?.[0] || null
      const costAllocationJVApprovalData = infoNoteData?.costAllocationJVApproval || []

      const patchValues: any = { costAllocation: {} };

      const selectedPaperStatus = this.paperStatusList.find((item) => item.id.toString() === generatlInfoData?.paperStatusId?.toString())

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

      // Start with PSAs from generatlInfoData
      const selectedValues = generatlInfoData?.psajv ? generatlInfoData.psajv
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


      const selectedValuesProcurementTagUsers = generatlInfoData?.procurementSPAUsers ? generatlInfoData.procurementSPAUsers
        .split(',')
        .map((id: string) => id.trim())
        .map((id: string) => this.procurementTagUsers.find(option => option.value === Number(id))?.value) // Convert label to value
        .filter((value: any) => value) : [];

      console.log("==patchValues.costAllocation", patchValues.costAllocation)
      console.log("==generatlInfoData", generatlInfoData)

      if (infoNoteData) {
        this.generalInfoForm.patchValue({
          generalInfo: {
            paperProvision: generatlInfoData?.paperProvision || '',
            purposeRequired: generatlInfoData?.purposeRequired || '',
            transactionType: generatlInfoData?.transactionType || '',
            isRetrospectiveApproval: generatlInfoData?.isRetrospectiveApproval || false,
            retrospectiveApprovalReason: generatlInfoData?.retrospectiveApprovalReason || '',
            reasontoChangeRequired: generatlInfoData?.reasontoChangeRequired || '',
            cgbItemRefNo: generatlInfoData?.cgbItemRefNo || '',
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
            psajv: allSelectedValues,
            procurementSPAUsers: selectedValuesProcurementTagUsers,
            pdManagerName: generatlInfoData?.pdManagerNameId || null,
          },
          ccd: {
            isHighRiskContract: generatlInfoData?.isHighRiskContract || false,
            cddCompleted: generatlInfoData?.cddCompleted
              ? format(new Date(generatlInfoData.cddCompleted), 'yyyy-MM-dd')
              : '',
            highRiskExplanation: generatlInfoData?.highRiskExplanation || '',
            flagRaisedCDD: generatlInfoData?.flagRaisedCDD || '',
            additionalCDD: generatlInfoData?.additionalCDD || '',
          },
          costAllocation: patchValues.costAllocation,
        })
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
                checkboxControl.setValue(true, { emitEvent: false });
              }

              // Enable percentage control for all selected PSAs (including BP Group)
              if (percentageControl) {
                percentageControl.enable({ emitEvent: false });
              }
            });

          // Calculate totals after all values are patched and controls are enabled
          this.calculateTotal();

          this.isInitialLoad = false;
        }, 500)


        this.addConsultationRow(true, false, consultationsData);
        this.setupPSAListeners();
        // Setup percentage calculation listeners after form is patched in edit mode
        setTimeout(() => {
          this.setupPSACalculations();
          // Recalculate totals after listeners are set up
          this.calculateTotal();
        }, 600);
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
      // Get all possible PSAJV options
      const allPSAJVOptions = this.psaJvOptions.map(option => option.value);

      // Handle each PSAJV option
      allPSAJVOptions.forEach((psaName) => {
        const isSelected = selectedOptions.includes(psaName);

        if (isSelected) {
          // Add form controls if they don't exist
          this.addPSAJVFormControls(psaName);
          // Set checkbox to checked
          const checkboxControlName = this.getPSACheckboxControlName(psaName);
          costAllocationControl.get(checkboxControlName)?.setValue(true);
          // Ensure As% (percentage) input is enabled like template1
          const percentageControlName = this.getPSAPercentageControlName(psaName);
          costAllocationControl.get(percentageControlName)?.enable({ emitEvent: false });
          // Add consultation row
          this.addConsultationRowOnChangePSAJV(psaName);
        } else {
          // Remove consultation row
          this.removeConsultationRowByPSAJV(psaName);
        }
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


  setupPSAListeners() {
    // Get selected PSAJV columns dynamically
    const selectedPSAJV = this.generalInfoForm.get('generalInfo.psajv')?.value || [];

    const costAllocationJVApprovalData = this.paperDetails?.costAllocationJVApproval || []
    const patchValues: any = {costAllocation: {}};

    // Create dynamic mapping from PSA data
    const psaNameToCheckbox: Record<string, string> = {};
    this.psaData.forEach(psa => {
      const checkboxName = this.getPSACheckboxControlName(psa.itemValue);
      psaNameToCheckbox[psa.itemValue.toLowerCase()] = checkboxName;
    });

    // Assign PSA/JV values dynamically
    costAllocationJVApprovalData.forEach((psa: any) => {
      // Try exact match first, then lowercase match
      const psaNameLower = psa.psaName?.toLowerCase().trim();
      const checkboxKey = psaNameToCheckbox[psaNameLower as keyof typeof psaNameToCheckbox];

      if (checkboxKey) {
        console.log('Setting PSA values:', psa.psaName, 'checkboxKey:', checkboxKey, 'psaValue:', psa.psaValue);
        // Handle different types for psaValue (boolean, string, number)
        const psaValueBool = typeof psa.psaValue === 'boolean' ? psa.psaValue :
                             typeof psa.psaValue === 'string' ? psa.psaValue === 'true' :
                             typeof psa.psaValue === 'number' ? psa.psaValue === 1 :
                             Boolean(psa.psaValue);
        patchValues.costAllocation[checkboxKey] = psaValueBool;
        patchValues.costAllocation[`percentage_${checkboxKey}`] = psa.percentage;
        patchValues.costAllocation[`value_${checkboxKey}`] = psa.value;
      } else {
        console.warn('PSA not found in mapping:', psa.psaName, 'Available keys:', Object.keys(psaNameToCheckbox));
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

    // Setup listeners for selected PSAJV columns dynamically
    selectedPSAJV.forEach((psaName: string) => {
      const checkbox = this.getPSACheckboxControlName(psaName);
      const percentage = this.getPSAPercentageControlName(psaName);
      const value = this.getPSAValueControlName(psaName);
      this.generalInfoForm.get(`costAllocation.${checkbox}`)?.valueChanges.subscribe((isChecked) => {
        const percentageControl = this.generalInfoForm.get(`costAllocation.${percentage}`);
        const valueControl = this.generalInfoForm.get(`costAllocation.${value}`);
        const jvApprovalsData = this.paperDetails?.jvApprovals[0] || null

        //checkboxes - use helper methods to get committee control names dynamically
        const firstCommitteeControlName = this.getFirstCommitteeControlName(psaName);
        const secondCommitteeControlName = this.getSecondCommitteeControlName(psaName);
        const firstCommitteeControl = firstCommitteeControlName ? this.generalInfoForm.get(`costAllocation.${firstCommitteeControlName}`) : null;
        const secondCommitteeControl = secondCommitteeControlName ? this.generalInfoForm.get(`costAllocation.${secondCommitteeControlName}`) : null;

        if (isChecked) {
          percentageControl?.enable();
          percentageControl?.setValue(patchValues.costAllocation[percentage] || 0, {emitEvent: false});
          valueControl?.setValue(patchValues.costAllocation[value] || 0, {emitEvent: false});

          // Handle committee checkboxes based on PSA name
          if (this.hasFirstCommitteeCheckbox(psaName) && firstCommitteeControl) {
            firstCommitteeControl.enable();
            const initialValue = jvApprovalsData?.[firstCommitteeControlName as keyof typeof jvApprovalsData] || false;
            firstCommitteeControl.setValue(initialValue, {emitEvent: false});
          }

          if (this.hasSecondCommitteeCheckbox(psaName) && secondCommitteeControl) {
            secondCommitteeControl.enable();
            const initialValue = jvApprovalsData?.[secondCommitteeControlName as keyof typeof jvApprovalsData] || false;
            secondCommitteeControl.setValue(initialValue, {emitEvent: false});
          }

          // Handle special cases for SCP and BTC which have additional checkboxes
          if (psaName.toLowerCase() === 'scp') {
            const scpInfoNote = this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CCInfoNote`);
            scpInfoNote?.enable();
            scpInfoNote?.setValue(jvApprovalsData?.contractCommittee_SCP_Co_CCInfoNote || false, {emitEvent: false});
          } else if (psaName.toLowerCase() === 'btc') {
            const btcInfoNote = this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CCInfoNote`);
            const scpBoard = this.generalInfoForm.get(`costAllocation.coVenturers_SCP_Board`);
            btcInfoNote?.enable();
            scpBoard?.enable();
            btcInfoNote?.setValue(jvApprovalsData?.contractCommittee_BTC_CCInfoNote || false, {emitEvent: false});
            scpBoard?.setValue(jvApprovalsData?.coVenturers_SCP_Board || false, {emitEvent: false});
          }

        } else {
          percentageControl?.reset();
          percentageControl?.disable();
          valueControl?.reset();

          // Disable and reset committee checkboxes
          if (firstCommitteeControl) {
            firstCommitteeControl.disable();
            firstCommitteeControl.reset();
          }
          if (secondCommitteeControl) {
            secondCommitteeControl.disable();
            secondCommitteeControl.reset();
          }

          // Handle special cases
          if (psaName.toLowerCase() === 'scp') {
            const scpInfoNote = this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CCInfoNote`);
            scpInfoNote?.disable();
            scpInfoNote?.reset();
          } else if (psaName.toLowerCase() === 'btc') {
            const btcInfoNote = this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CCInfoNote`);
            const scpBoard = this.generalInfoForm.get(`costAllocation.coVenturers_SCP_Board`);
            btcInfoNote?.disable();
            scpBoard?.disable();
            btcInfoNote?.reset();
            scpBoard?.reset();
          }
        }
      });
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
          const contractValue = this.generalInfoForm.get('generalInfo.contractValue')?.value || 0;

          if (percentageValue >= 0 && percentageValue <= 100) {
            const calculatedValue = (percentageValue / 100) * contractValue;
            valueControl.setValue(calculatedValue, {emitEvent: false});
            this.calculateTotal();
          }
        });
      }
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
        const contractValue = this.generalInfoForm.get('generalInfo.contractValue')?.value || 0;

        if (percentageValue >= 0 && percentageValue <= 100) {
          const calculatedValue = (percentageValue / 100) * contractValue;
          valueControl.setValue(calculatedValue, {emitEvent: false});
          this.calculateTotal();
        }
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
    // If a linked paper is selected and it's a Contract Award with split award,
    // recalculate the contract value based on the new vendor selection
    const previousCGBItemRefNo = this.generalInfoForm.get('generalInfo.previousCGBItemRefNo')?.value;
    if (previousCGBItemRefNo) {
      const linkedPaper = this.paperMappingData.find((p: any) => p.paperID?.toString() === previousCGBItemRefNo.toString());
      if (linkedPaper && linkedPaper.paperType === 'Contract Award') {
        // Re-populate contract value for split award scenario
        this.populateContractValueFromLinkedPaper(Number(previousCGBItemRefNo));
      }
    }
  }

  setupPreviousCGBItemReference() {
    // Initialize with empty array
    this.previousCGBItemOptions = [];

    // Fetch all papers for mapping - similar to template2/template3
    this.paperService.getApprovedPapersForMapping().subscribe({
      next: (response) => {
        console.log('getApprovedPapersForMapping response:', response);
        if (response && response.status && response.data) {
          if (response.data && response.data.length > 0) {
            // Filter papers: exclude Draft/Withdrawn and current paper if editing
            const filteredPapers = response.data.filter((item: any) => {
              // Exclude current paper if editing
              if (this.paperId && item.paperID?.toString() === this.paperId) {
                return false;
              }

              // Exclude Draft and Withdrawn status
              if (item.paperStatusName === "Draft" || item.paperStatusName === "Withdrawn") {
                return false;
              }

              // Show all approved paper types for Previous CGB Item Reference
              // This allows referencing any previous approved paper
              return true;
            });

            console.log('Filtered papers for Previous CGB Item Reference:', filteredPapers);
            console.log('Total filtered papers:', filteredPapers.length);
            this.paperMappingData = filteredPapers;

            // Create formatted options for Select2 - similar to template2 format
            // Format: "Ref#, Paper Type, Title (first 50 chars), Date"
            this.previousCGBItemOptions = this.paperMappingData.map((item: any) => {
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

            console.log('previousCGBItemOptions created:', this.previousCGBItemOptions.length, 'items');
            console.log('Sample options:', this.previousCGBItemOptions.slice(0, 3));

            // Force change detection
            if (this.previousCGBItemOptions.length > 0) {
              console.log('Options populated successfully');
            } else {
              console.warn('No options were created from the filtered papers');
            }
          } else {
            console.log('No papers found in response data array');
            this.previousCGBItemOptions = [];
          }
        } else {
          console.log('Response status is false or no data. Response:', response);
          this.previousCGBItemOptions = [];
        }
      },
      error: (error) => {
        console.error('Error fetching papers for mapping:', error);
        this.previousCGBItemOptions = [];
        this.toastService?.show('Failed to load previous CGB item references', 'danger');
      }
    });
  }

  onPreviousCGBItemSelected(event: any) {
    // The form control already has the value set (Ref. No as string)
    const selectedPaperId = event;
    console.log('Previous CGB Item Reference selected:', selectedPaperId);

    if (selectedPaperId) {
      // Automatically populate contract value based on selected paper
      this.populateContractValueFromLinkedPaper(Number(selectedPaperId));
    } else {
      // Clear contract value if no paper is selected
      console.log('Previous CGB Item Reference cleared - clearing contract value');
      this.generalInfoForm.get('generalInfo.contractValue')?.setValue(null);
    }
  }

  populateContractValueFromLinkedPaper(paperId: number) {
    // Find the paper from mapping data to determine its type
    const linkedPaper = this.paperMappingData.find((p: any) => p.paperID?.toString() === paperId.toString());

    if (!linkedPaper) {
      console.log('Linked paper not found in mapping data for ID:', paperId);
      return;
    }

    const paperType = linkedPaper.paperType;
    const contractValueControl = this.generalInfoForm.get('generalInfo.contractValue');

    console.log('Populating contract value from linked paper:', paperId, 'Type:', paperType);

    // Handle Info Note type - Info Notes don't typically have contract values to inherit
    if (paperType === 'Info Note') {
      console.log('Info Note selected - contract value not automatically populated');
      // For Info Note, we don't auto-populate contract value as per requirements
      return;
    }

    // Fetch paper details based on type
    let apiType = '';
    if (paperType === 'Approach to Market') {
      apiType = 'approch';
    } else if (paperType === 'Contract Award') {
      apiType = 'contract';
    } else if (paperType === 'Variation') {
      apiType = 'variation';
    } else {
      console.log('Unknown paper type:', paperType);
      return;
    }

    this.paperService.getPaperDetails(paperId, apiType).subscribe({
      next: (response) => {
        console.log('Paper details API response:', response);
        if (response.status && response.data) {
          const paperData = response.data as any;
          let contractValue = null;

          if (paperType === 'Approach to Market') {
            // Linked AtM: Take Contract Value
            // Data structure: response.data.paperDetails or response.data.approachToMarket.paperDetails
            const generalInfo = paperData?.paperDetails || paperData?.approachToMarket?.paperDetails || null;
            contractValue = generalInfo?.contractValue || null;
            console.log('AtM - GeneralInfo:', generalInfo);
            console.log('AtM Contract Value:', contractValue);
          } else if (paperType === 'Contract Award') {
            // Linked Award: Take Award Value or Award Value for selected Vendor (if Split Award)
            // Data structure: response.data.paperDetails or response.data.contractAward?.paperDetails
            const generalInfo = paperData?.paperDetails || paperData?.contractAward?.paperDetails || paperData?.contractAwardDetails || null;
            const isSplitAward = generalInfo?.isSplitAward || false;
            const selectedVendorId = this.generalInfoForm.get('generalInfo.legalName')?.value;

            console.log('Contract Award - GeneralInfo:', generalInfo);
            console.log('Contract Award - Split Award:', isSplitAward, 'Selected Vendor:', selectedVendorId);

            if (isSplitAward && selectedVendorId) {
              // For split award, get vendor-specific award value
              const legalEntitiesAwarded = paperData?.legalEntitiesAwarded || paperData?.contractAward?.legalEntitiesAwarded || [];
              console.log('Legal Entities Awarded:', legalEntitiesAwarded);
              const vendorEntity = legalEntitiesAwarded.find((entity: any) =>
                entity.vendorId === Number(selectedVendorId)
              );
              contractValue = vendorEntity?.totalAwardValueUSD || vendorEntity?.awardValue || null;
              console.log('Split Award - Vendor Entity:', vendorEntity);
              console.log('Split Award - Vendor-specific value:', contractValue);
            } else {
              // Use total award value
              contractValue = generalInfo?.totalAwardValueUSD || generalInfo?.awardValue || null;
              console.log('Regular Award - Total value:', contractValue);
            }
          } else if (paperType === 'Variation') {
            // Linked Variation: Take Total Revised Value
            // Data structure: response.data.contractValues or response.data.variationPaper?.contractValues
            const contractValues = paperData?.contractValues || paperData?.variationPaper?.contractValues || null;
            contractValue = contractValues?.revisedContractValue || contractValues?.totalRevisedValue || null;
            console.log('Variation - Contract Values:', contractValues);
            console.log('Variation - Revised Contract Value:', contractValue);
          }

          if (contractValue !== null && contractValue !== undefined) {
            const numericValue = Number(contractValue);
            if (!isNaN(numericValue)) {
              // Enable control temporarily to set value, then disable again (since it's read-only)
              if (contractValueControl?.disabled) {
                contractValueControl.enable({ emitEvent: false });
                contractValueControl.setValue(numericValue, { emitEvent: false });
                contractValueControl.disable({ emitEvent: false });
              } else {
                contractValueControl?.setValue(numericValue, { emitEvent: false });
              }
              console.log('Contract value populated successfully:', numericValue);
              this.toastService?.show(`Contract value populated: ${numericValue}`, 'success');
            } else {
              console.warn('Contract value is not a valid number:', contractValue);
              if (contractValueControl?.disabled) {
                contractValueControl.enable({ emitEvent: false });
                contractValueControl.setValue(null, { emitEvent: false });
                contractValueControl.disable({ emitEvent: false });
              } else {
                contractValueControl?.setValue(null);
              }
            }
          } else {
            console.log('No contract value found for linked paper');
            if (contractValueControl?.disabled) {
              contractValueControl.enable({ emitEvent: false });
              contractValueControl.setValue(null, { emitEvent: false });
              contractValueControl.disable({ emitEvent: false });
            } else {
              contractValueControl?.setValue(null);
            }
            this.toastService?.show('No contract value available for the selected paper', 'warning');
          }
        } else {
          console.log('Failed to fetch paper details - response status:', response.status, 'Response:', response);
          this.toastService?.show('Failed to fetch paper details', 'danger');
        }
      },
      error: (error) => {
        console.error('Error fetching linked paper details:', error);
        this.toastService?.show('Failed to load contract value from linked paper', 'danger');
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

      riskMitigationsData.forEach((item: any, index: number) => {
        const formGroup = this.fb.group({
          psa: [item.psa || item.psaValue || '', Validators.required],
          technicalCorrect: [{ value: item.technicalCorrect || item.technicalCorrectId || null, disabled: false }, Validators.required],
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

  goToPreview(): void {
    if (this.paperId) {
      this.router.navigate(['/preview/info-note', this.paperId]);
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

    const generalInfoValue = this.generalInfoForm?.value?.generalInfo
    const consultationsValue = this.generalInfoForm?.value?.consultation
    const costAllocationValues = this.generalInfoForm?.value?.costAllocation
    const ccdValues = this.generalInfoForm?.value?.ccd
    const toIsoOrNull = (v: any) => v ? new Date(v).toISOString() : null;

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
        cgbCirculationDate: toIsoOrNull(generalInfoValue?.cgbCirculationDate),
        subSector: generalInfoValue?.subSector || '',
        operatingFunction: generalInfoValue?.operatingFunction || '',
        sourcingType: generalInfoValue?.sourcingType || '',
        psajv: generalInfoValue?.psajv?.join(',') || "",
        contractStartDate: toIsoOrNull(generalInfoValue?.contractStartDate),
        contractEndDate: toIsoOrNull(generalInfoValue?.contractEndDate),
        isLTCC: false, // Not in form, defaulting to false
        ltccNotes: '', // Not in form, defaulting to empty string
        isIFRS16: false, // Not in form, defaulting to false
        contractNo: generalInfoValue?.contractNumber || '',
        isRetrospectiveApproval: generalInfoValue?.isRetrospectiveApproval || false,
        retrospectiveApprovalReason: generalInfoValue?.retrospectiveApprovalReason || '',
        isGIAAPCheck: false, // Not in form, defaulting to false
        isHighRiskContract: ccdValues?.isHighRiskContract || false,
        cddCompleted: toIsoOrNull(ccdValues?.cddCompleted),
        highRiskExplanation: ccdValues?.highRiskExplanation || '',
        flagRaisedCDD: ccdValues?.flagRaisedCDD || '',
        additionalCDD: ccdValues?.additionalCDD || '',
        ...(this.paperId && !this.isCopy ? { id: Number(this.paperId) } : {})
      },
      masterInfoNote: {
        transactionType: generalInfoValue?.transactionType || '',
        reasontoChangeRequired: generalInfoValue?.reasontoChangeRequired || '',
        vendorId: generalInfoValue?.legalName || null,
        previousCGBItemRefNo: generalInfoValue?.previousCGBItemRefNo || '',
        variationStartDate: toIsoOrNull(generalInfoValue?.variationStartDate),
        variationEndDate: toIsoOrNull(generalInfoValue?.variationEndDate),
        referenceNo: '', // Not in form, defaulting to empty string
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
    this.isSubmitting = true;
    this.paperService.upsertInfoNote(params).subscribe({
      next: (response) => {
        if (response.status && response.data) {
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

}

