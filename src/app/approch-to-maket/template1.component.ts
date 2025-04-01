import {Component, inject, Renderer2, ViewChild, ElementRef} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DummyCompComponent} from '../dummy-comp/dummy-comp.component';
import {CKEditorModule, loadCKEditorCloud, CKEditorCloudResult} from '@ckeditor/ckeditor5-angular';
import type {ClassicEditor, EditorConfig} from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormArray, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors} from '@angular/forms';
import {CURRENCY_LIST} from '../../utils/constant';
import {UserService} from '../../service/user.service';
import {UserDetails} from '../../models/user';
import {PaperService} from '../../service/paper.service';
import {CountryDetail} from '../../models/general';
import {Generalervice} from '../../service/general.service';
import {UploadService} from '../../service/document.service';
import {Select2} from 'ng-select2-component';
import {ToastService} from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import {DictionaryService} from '../../service/dictionary.service';
import {DictionaryDetail, Item} from '../../models/dictionary';
import { Router, ActivatedRoute } from '@angular/router';
import {PaperStatusType} from '../../models/paper';
import {environment} from '../../environments/environment';
import {EditorComponent} from '../../components/editor/editor.component';

@Component({
  selector: 'app-template1',
  standalone: true,
  imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule, Select2, NgbToastModule, EditorComponent],
  templateUrl: './template1.component.html',
  styleUrls: ['./template1.component.scss'],
})
export class Template1Component {
  generalInfoForm!: FormGroup;
  private readonly userService = inject(UserService);
  private readonly paperService = inject(PaperService);
  private searchTimeout: any;
  isEndDateDisabled: boolean = true;
  minEndDate: string = '';
  submitted = false;
  paperStatusId: number | null  = null;
  paperId: string | null = null;
  paperStatusList: PaperStatusType[] = [];

  // Global variables for dropdown selections
  currenciesData:DictionaryDetail[]=[];
  globalCGBData:DictionaryDetail[]=[];
  operatingFunctionsData:DictionaryDetail[]=[];
  proposedCMLData:DictionaryDetail[]=[];
  psaData:DictionaryDetail[]=[];
  remunerationTypeData:DictionaryDetail[]=[];
  sourcingRigorData:DictionaryDetail[]=[];
  sourcingTypeData:DictionaryDetail[]=[];
  subsectorData:DictionaryDetail[]=[];

  userDetails: UserDetails[] = [];
  countryDetails: CountryDetail[] = [];
  procurementTagUsers: any[] = [];
  @ViewChild('searchInput') searchInput!: ElementRef; // Optional: If search input needs access
  highlightClass = 'highlight'; // CSS class for highlighting
  selectedFiles: any[] = [];
  isDragging = false;

  constructor(private router: Router, private route: ActivatedRoute,     private dictionaryService:DictionaryService,
                    private fb: FormBuilder, private countryService: Generalervice, private renderer: Renderer2, private uploadService: UploadService,       public toastService:ToastService,
  ) {
  }

  public Editor: typeof ClassicEditor | null = null;
  public config: EditorConfig | null = null;
  public psaJvOptions = [
    {value: 'ACG', label: 'ACG'},
    {value: 'Shah Deniz', label: 'Shah Deniz'},
    {value: 'SCP', label: 'SCP'},
    {value: 'BTC', label: 'BTC'},
    {value: 'Sh-Asiman', label: 'Sh-Asiman'},
    {value: 'BP Group', label: 'BP Group'}
  ];


  public ngOnInit(): void {
    loadCKEditorCloud({
      version: '44.3.0',
      premium: true
    }).then(this._setupEditor.bind(this));

    this.route.paramMap.subscribe(params => {
      this.paperId = params.get('id');
      console.log('Paper ID:', this.paperId);
    });
    this.loadUserDetails();
    this.loadCountry();
    this.loadDictionaryItems();
    this.loadPaperListData();


    this.generalInfoForm = this.fb.group({
      generalInfo: this.fb.group({
        paperProvision: ['', Validators.required],
        cgbItemRefNo: [{value: '', disabled: true}],
        cgbCirculationDate: [{value: '', disabled: true}],
        whyIsThisWorkRequired: ['', Validators.required],
        scopeOfWork: [''],
        globalCGB: ['', Validators.required],
        bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        operatingFunction: ['', Validators.required],
        subSector: ['', Validators.required],
        sourcingType: ['', Validators.required],
        camUserId:[null, [Validators.required, Validators.pattern("^[0-9]+$")]],
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
        isPHCA: [false],
        psajv: [[], Validators.required],
        isLTCC: [false],
        ltccNotes: [''],
        isGovtReprAligned: [false],
        govtReprAlignedComment: [''],
        isConflictOfInterest: [false],
        conflictOfInterestComment: [''],
        strategyDescription: ['']
      }),
      procurementDetails: this.fb.group({
        remunerationType: ['', Validators.required],
        contractMgmtLevel: ['', Validators.required],
        sourcingRigor: ['', Validators.required],
        sourcingStrategy: [''],
        singleSourceJustification: [''],
        risks: this.fb.array([]),
        inviteToBid: this.fb.array([]),
        socaRsentOn: ['', Validators.required],
        socaRreceivedOn: ['', Validators.required],
        socarDescription: [''],
        preQualificationResult: [''],
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
      }, { validators: this.requireAllIfAny }),
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

    // Initialize with one row to prevent errors
    this.addRow();
    this.addBidRow();
    // Subscribe to changes in originalCurrency or contractValueUsd
    this.generalInfoForm.get('generalInfo.originalCurrency')?.valueChanges.subscribe(() => {
      this.updateExchangeRate();
    });

    this.generalInfoForm.get('generalInfo.contractValueUsd')?.valueChanges.subscribe(() => {
      this.updateContractValueOriginalCurrency();
    });

    this.generalInfoForm.get('generalInfo.psajv')?.valueChanges.subscribe(() => {
      this.onSelectChange();
    });

    // Watch changes on enable/disable Methodology


    this.setupPSAListeners()
    this.setupMethodologyListeners()
    this.setupPSACalculations()
    this.onLTCCChange()
    this.alignGovChange()
    this.conflictIntrestChanges()

  }

  get generalInfo() {
    return this.generalInfoForm.get('generalInfo');
  }

  get procurementDetailsInfo() {
    return this.generalInfoForm.get('generalInfo');
  }

  onLTCCChange() {
    this.generalInfoForm.get('generalInfo.isLTCC')?.valueChanges.subscribe((value) => {
      if (value === true) {
        this.generalInfoForm.get('generalInfo.ltccNotes')?.setValidators([Validators.required]);
      } else {
        this.generalInfoForm.get('generalInfo.ltccNotes')?.clearValidators();
      }
      this.generalInfoForm.get('generalInfo.ltccNotes')?.updateValueAndValidity(); // Refresh validation
    });
  }

  loadDictionaryItems(){

    this.dictionaryService.getDictionaryItemList().subscribe({
      next:(response)=>{
        if(response.status && response.data)
        {
          const itemData = response.data;
          if(itemData.length>0)
          {
            itemData.forEach((item) => {
              this.loadDictionaryDetails(item.itemName);
            });
          }
        }
      },error:(error)=>{
        console.log('error',error);
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
      if (value === true) {
        this.generalInfoForm.get('generalInfo.conflictOfInterestComment')?.setValidators([Validators.required]);
      } else {
        this.generalInfoForm.get('generalInfo.conflictOfInterestComment')?.clearValidators();
      }
      this.generalInfoForm.get('generalInfo.conflictOfInterestComment')?.updateValueAndValidity(); // Refresh validation
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
          console.log('country:', this.countryDetails);
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  loadPaperListData() {
    this.paperService.getPaperStatusList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {

          this.paperStatusList = reponse.data || [];
          console.log('==paperStatusList:', this.paperStatusList);
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  onSelectChange() {

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
      });
    }

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

    psaControls.forEach(({checkbox, percentage, value}) => {
      this.generalInfoForm.get(`costAllocation.${checkbox}`)?.valueChanges.subscribe((isChecked) => {
        const percentageControl = this.generalInfoForm.get(`costAllocation.${percentage}`);
        const valueControl = this.generalInfoForm.get(`costAllocation.${value}`);

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
          valueControl?.enable();

          if (checkbox === "isACG") {
            ACG1?.enable();
            ACG2?.enable();
          } else if (checkbox === "isShah") {
            SD1?.enable();
            SD2?.enable();
          } else if (checkbox === "isSCP") {
            SCP1?.enable();
            SCP2?.enable();
            SCP3?.enable();
          } else if (checkbox === "isBTC") {
            BTC1?.enable();
            BTC2?.enable();
            BTC3?.enable();
          }

        } else {
          percentageControl?.reset();
          percentageControl?.disable();
          valueControl?.reset();
          valueControl?.disable();

          if (checkbox === "isACG") {
            ACG1?.disable();
            ACG1?.reset();
            ACG2?.disable();
            ACG2?.reset();
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

    // Listen for changes in percentage and value fields to update total
    psaControls.forEach(({percentage, value}) => {
      this.generalInfoForm.get(`costAllocation.${percentage}`)?.valueChanges.subscribe(() => this.calculateTotal());
      this.generalInfoForm.get(`costAllocation.${value}`)?.valueChanges.subscribe(() => this.calculateTotal());
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
        const contractValue = this.generalInfoForm.get('generalInfo.contractValueUsd')?.value || 0;

        if (percentageValue >= 0 && percentageValue <= 100) {
          const calculatedValue = (percentageValue / 100) * contractValue;
          this.generalInfoForm.get(`costAllocation.${value}`)?.setValue(calculatedValue, {emitEvent: false});
        }
      });
    });
  }

  calculateTotal() {
    const costAllocation = this.generalInfoForm.get('costAllocation') as FormGroup;

    let totalPercentage = 0;
    let totalValue = 0;

    const percentageFields = ['percentage_isACG', 'percentage_isShah', 'percentage_isSCP', 'percentage_isBTC', 'percentage_isAsiman', 'percentage_isBPGroup'];
    const valueFields = ['value_isACG', 'value_isShah', 'value_isSCP', 'value_isBTC', 'value_isAsiman', 'value_isBPGroup'];

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
    costAllocation.get('totalPercentage')?.setValue(totalPercentage, {emitEvent: false});
    costAllocation.get('totalValue')?.setValue(totalValue, {emitEvent: false});
  }


  loadUserDetails() {
    this.userService.getUserDetailsList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.userDetails = response.data;
          this.procurementTagUsers = response.data.filter(user => user.roleName === 'Procurement Tag').map(t => ({label: t.displayName, value: t.id}));

          console.log('user details', this.userDetails);
        }
      }, error: (error) => {
        console.log('error', error);
      }
    })
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
    this.isExpanded = !this.isExpanded;
  }

  get risks(): FormArray {
    return this.generalInfoForm.get('procurementDetails.risks') as FormArray;
  }

  // Getter for inviteToBid FormArray
  get inviteToBid(): FormArray {
    return this.generalInfoForm.get('procurementDetails.inviteToBid') as FormArray;
  }


  // Getter for FormArray
  get consultationRows(): FormArray {
    return this.generalInfoForm.get('consultation') as FormArray;
  }

  // Add a new risk row
  addRow() {
    this.risks.push(
      this.fb.group({
        srNo: this.generateId(this.risks.length),
        risk: ['', Validators.required],
        mitigation: ['', Validators.required]
      })
    );
  }

  // Remove a risk row
  removeRow(index: number) {
    if (this.risks.length > 1) {
      this.risks.removeAt(index);
    }
  }

  // Generate ID dynamically (001, 002, etc.)
  generateId(index: number): string {
    return (index + 1).toString().padStart(3, '0');
  }

  // Add a new inviteToBid row
  addBidRow() {
    this.inviteToBid.push(
      this.fb.group({
        legalName: ['', Validators.required],
        isLocalOrJV: [false], // Checkbox
        countryId: ['', Validators.required],
        parentCompanyName: [''],
        remarks: ['']
      })
    );
  }

  // Remove an inviteToBid row
  removeBidRow(index: number) {
    if (this.inviteToBid.length > 1) {
      this.inviteToBid.removeAt(index);
    }
  }

  // Function to add a new consultation row
  addConsultationRow() {
    this.consultationRows.push(
      this.fb.group({
        psa: ['', Validators.required],
        isNoExistingBudget: [false], // Checkbox
        technicalCorrect: [null],
        budgetStatement: [null, Validators.required],
        jvReview: [null, Validators.required],
      })
    );
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

  setPaperStatus(status: string): void {
    if (!this.paperStatusList?.length) return; // Check if list exists & is not empty

    this.paperStatusId = this.paperStatusList.find(item => item.paperStatus === status)?.id ?? null;

    console.log('Paper Status Updated:', this.paperStatusId);
  }


  onSubmit(): void {
    this.submitted = true;

    if(!this.paperStatusId) {
      this.toastService.show("Paper status id not found", "danger")
      return
    }

    const generalInfoValue = this.generalInfoForm?.value?.generalInfo
    const procurementValue = this.generalInfoForm?.value?.procurementDetails
    const consultationsValue = this.generalInfoForm?.value?.consultation
    const costSharingValues = this.generalInfoForm?.value?.costSharing
    const valueDeliveryValues = this.generalInfoForm?.value?.valueDelivery
    const costAllocationValues = this.generalInfoForm?.value?.costAllocation

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

    const params = {
      papers: {
        paperStatusId: this.paperStatusId,
        paperProvision: generalInfoValue?.paperProvision,
        purposeRequired: "test",
        isActive: true
      },
      approachMarket: {
        cgbItemRefNo: generalInfoValue?.cgbItemRefNo || null,
        cgbCirculationDate: null,
        scopeOfWork: generalInfoValue?.scopeOfWork,
        globalCGB: generalInfoValue?.globalCGB,
        bltMember: generalInfoValue?.bltMember,
        operatingFunction: generalInfoValue?.operatingFunction,
        subSector: generalInfoValue?.subSector,
        sourcingType: generalInfoValue?.sourcingType,
        camUserId: generalInfoValue?.camUserId || 1,
        vP1UserId: generalInfoValue?.vP1UserId || "",
        procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "1,2",
        pdManagerName: generalInfoValue?.pdManagerName || 1,
        isPHCA: generalInfoValue?.isPHCA,
        psajv: generalInfoValue?.psajv?.join(',') || "",
        totalAwardValueUSD: generalInfoValue?.contractValueUsd || null,
        currencyCode: generalInfoValue?.originalCurrency || "",
        exchangeRate: generalInfoValue?.exchangeRate,
        contractValue: generalInfoValue?.contractValueOriginalCurrency,
        contractStartDate: generalInfoValue?.contractStartDate,
        contractEndDate: generalInfoValue?.contractEndDate,
        isLTCC: generalInfoValue?.isLTCC,
        ltccNotes: generalInfoValue?.ltccNotes,
        isGovtReprAligned: generalInfoValue?.isGovtReprAligned,
        govtReprAlignedComment: generalInfoValue?.govtReprAlignedComment,
        isIFRS16: generalInfoValue?.isIFRS16,
        isGIAAPCheck: generalInfoValue?.isGIAAPCheck,
        isConflictOfInterest: generalInfoValue?.isConflictOfInterest,
        conflictOfInterestComment: generalInfoValue?.conflictOfInterestComment,
        strategyDescription: generalInfoValue?.strategyDescription,
        remunerationType: procurementValue?.remunerationType,
        contractMgmtLevel: procurementValue?.contractMgmtLevel,
        sourcingRigor: procurementValue?.sourcingRigor,
        sourcingStrategy: procurementValue?.sourcingStrategy,
        singleSourceJustification: procurementValue?.singleSourceJustification,
        socaRsentOn: procurementValue?.socaRsentOn,
        socaRreceivedOn: procurementValue?.socaRreceivedOn,
        socarDescription: procurementValue?.socarDescription,
        preQualificationResult: procurementValue?.preQualificationResult,
      },
      consultations: consultationsValue,
      bidInvite: procurementValue.inviteToBid,
      riskMitigation: procurementValue.risks,
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
      costAllocationJVApproval: costAllocationJVApproval,
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
      }
    }

    console.log("==params", params)

    if (this.generalInfoForm.valid) {
      this.paperService.upsertApproachToMarkets(params).subscribe({
        next: (response) => {
          console.log("==response", response)
          if (response.status && response.data) {
            const docId = response.data || null
            this.uploadFiles(docId)
            this.generalInfoForm.reset();
            this.submitted = false;
            this.toastService.show(response.message || "Added Successfully",'success');
            setTimeout(() => {
              this.router.navigate(['/paperconfiguration']);
            }, 2000);
          } else {
            this.toastService.show(response.message || "Something went wrong.",'danger');
          }
        },
        error: (error) => {
          console.log('Error', error);
          this.toastService.show("Something went wrong.",'danger');
        },
      });
    } else {
      console.log("Form is invalid");
    }
  }

  onFileSelected(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files) {
      Array.from(inputElement.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.selectedFiles.push({file, preview: e.target?.result as string});
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
          this.selectedFiles.push({file, preview: e.target?.result as string});
        };
        reader.readAsDataURL(file);
      });
    }
  }

// Remove a selected file
  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  uploadFiles(docId: number | null) {
    if (this.selectedFiles.length === 0 || !docId) return;

    const filesToUpload = this.selectedFiles.map((item) => item.file);

    this.uploadService.uploadDocuments(docId, filesToUpload).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          console.log('Files uploaded successfully!');
          this.selectedFiles = [];
        }
      },
      error: (error) => {
        console.log('Error', error);
      },
    });
  }


}
