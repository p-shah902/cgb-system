import {Component, inject, Renderer2, ViewChild, ElementRef} from '@angular/core';
import { CKEditorModule, loadCKEditorCloud, CKEditorCloudResult } from '@ckeditor/ckeditor5-angular';
import type { ClassicEditor, EditorConfig } from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {
  FormBuilder,
  FormArray,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,FormsModule
} from '@angular/forms';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import {environment} from '../../environments/environment';
import {Select2} from 'ng-select2-component';
import {DictionaryService} from '../../service/dictionary.service';
import {Generalervice} from '../../service/general.service';
import {UploadService} from '../../service/document.service';
import {ToastService} from '../../service/toast.service';
import {Router, ActivatedRoute} from '@angular/router';
import {DictionaryDetail} from '../../models/dictionary';
import {UserDetails} from '../../models/user';
import {UserService} from '../../service/user.service';
import {PaperService} from '../../service/paper.service';
import {CountryDetail} from '../../models/general';
import {PaperStatusType} from '../../models/paper';
import {VendorService} from '../../service/vendor.service';
import {VendorDetail} from '../../models/vendor';

@Component({
  selector: 'app-template2',
  standalone: true,
  imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule],
  templateUrl: './template2.component.html',
  styleUrl: './template2.component.scss'
})
export class Template2Component {
  private readonly userService = inject(UserService);
  private readonly paperService = inject(PaperService);
  private readonly vendorService=inject(VendorService);
  private searchTimeout: any;
  public Editor: typeof ClassicEditor | null = null;
  public config: EditorConfig | null = null;
  @ViewChild('searchInput') searchInput!: ElementRef;
  generalInfoForm!: FormGroup;
  isExpanded: boolean = true; // Default expanded
  paperId: string | null = null;
  isCopy = false;
  submitted = false;
  highlightClass = 'highlight';
  paperStatusId: number | null = null;

  vendorList: VendorDetail[] = []
  userDetails: UserDetails[] = [];
  procurementTagUsers: any[] = [];
  countryDetails: CountryDetail[] = [];
  paperStatusList: PaperStatusType[] = [];

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
  }

  public ngOnInit(): void {
    loadCKEditorCloud({
      version: '44.3.0',
      premium: true
    }).then(this._setupEditor.bind(this));


    this.route.paramMap.subscribe(params => {
      this.paperId = params.get('id');
      if (this.paperId) {
      }
      console.log('Paper ID:', this.paperId);
    });

    this.route.queryParamMap.subscribe(queryParams => {
      this.isCopy = queryParams.get('isCopy') === 'true';
      console.log('Is Copy:', this.isCopy);
    });

    this.loadForm()
    this.loadDictionaryItems()
    this.loadUserDetails()
    this.loadCountry();
    this.loadPaperStatusListData();
    this.loadVendoreDetails()
  }

  loadForm() {
    this.generalInfoForm = this.fb.group({
      generalInfo: this.fb.group({
        paperProvision: [''],
        cgbAtmRefNo: [''],
        cgbApprovalDate: [{value: '', disabled: true}],
        isChangeinApproachMarket: [false],
        cgbItemRefNo: [''],
        cgbCirculationDate: [''],
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
      }),
      procurementDetails: this.fb.group({
        supplierAwardRecommendations: ['', Validators.required],
        contractStartDate: [''],
        contractEndDate: [''],
        extensionOption: [''],
        isConflictOfInterest: [false],
        conflictOfInterestComment: [''],
        isRetrospectiveApproval: [false],
        retrospectiveApprovalReason: [''],
      }),
      ccd: this.fb.group({
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
        benchMarking: ['']
      }),
      additionalDetails: this.fb.group({
        contractualControls: [''],
        contractCurrencyLinktoBaseCost: [false],
        explanationsforBaseCost:['']
      }),
      valueDelivery: this.fb.group({
        isCapex: [false],
        isFixOpex: [false],
        isVariableOpex: [false],
        isInventoryItems: [false],
        capexMethodology: [{value: '', disabled: true}],
        fixOpexMethodology: [{value: '', disabled: true}],
        variableOpexMethodology: [{value: '', disabled: true}],
        inventoryItemsMethodology: [{value: '', disabled: true}]
      }),
      costAllocation: this.fb.group({
        isCapex: [false],
        isFixOpex: [false],
        isVariableOpex: [false],
        isInventoryItems: [false],
        capexMethodology: [{value: '', disabled: true}],
        fixOpexMethodology: [{value: '', disabled: true}],
        variableOpexMethodology: [{value: '', disabled: true}],
        inventoryItemsMethodology: [{value: '', disabled: true}]
      }),
      costSharing:  this.fb.group({
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

  get generalInfo() {
    return this.generalInfoForm.get('generalInfo');
  }

  get procurementDetailsInfo() {
    return this.generalInfoForm.get('generalInfo');
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
          console.log('Dictionary Detail:', response.data);

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
              this.psaData = response.data || [];
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
          this.userDetails = response.data;
          this.procurementTagUsers = response.data.filter(user => user.roleName === 'Procurement Tag').map(t => ({
            label: t.displayName,
            value: t.id
          }));

        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
  }

  loadCountry() {
    this.countryService.getCountryDetails().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {

          this.countryDetails = reponse.data || [];
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
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }
  loadVendoreDetails()
  {

    this.vendorService.getVendorDetailsList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          this.vendorList = reponse.data;
          console.log('vendor:', this.vendorList);
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  setPaperStatus(status: string): void {
    if (!this.paperStatusList?.length) return; // Check if list exists & is not empty

    this.paperStatusId = this.paperStatusList.find(item => item.paperStatus === status)?.id ?? null;

  }

  onSubmit() {
    this.submitted = true;
    console.log("==this.generalInfoForm?.value?", this.generalInfoForm?.value)
    const params = {}
    console.log("==params", params)

    if (this.generalInfoForm.valid) {
      this.paperService.upsertContractAward(params).subscribe({
        next: (response) => {
          if (response.status && response.data) {
            this.generalInfoForm.reset();
            this.submitted = false;
            this.toastService.show(response.message || "Added Successfully", 'success');
            setTimeout(() => {
              this.router.navigate(['/paperconfiguration']);
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
    } else {
      console.log("Form is invalid");
    }
  }


  toggleComments() {
    this.isExpanded = !this.isExpanded;
  }

}
