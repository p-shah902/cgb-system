import {Component, inject} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {DummyCompComponent} from '../dummy-comp/dummy-comp.component';
import {CKEditorModule, loadCKEditorCloud, CKEditorCloudResult} from '@ckeditor/ckeditor5-angular';
import type {ClassicEditor, EditorConfig} from 'https://cdn.ckeditor.com/typings/ckeditor5.d.ts';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormArray, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {CURRENCY_LIST} from '../../utils/constant';
import {UserService} from '../../service/user.service';
import {UserDetails} from '../../models/user';

@Component({
  selector: 'app-template1',
  standalone: true,
  imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule],
  templateUrl: './template1.component.html',
  styleUrls: ['./template1.component.scss'],
})
export class Template1Component {
  generalInfoForm!: FormGroup;
  private readonly userService=inject(UserService);
  userDetails:UserDetails[]=[];

  constructor(private fb: FormBuilder) {
  }

  public Editor: typeof ClassicEditor | null = null;
  public config: EditorConfig | null = null;
  public psaJvOptions = ['ACG', 'Shah Deniz', 'SCP', 'BTC', 'Sh-Asiman', 'BP Group'];

  public ngOnInit(): void {
    loadCKEditorCloud({
      version: '44.3.0',
      premium: true
    }).then(this._setupEditor.bind(this));

    this.loadUserDetails();


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
        camUserId: [{value: '', disabled: true}],
        vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        procurementSPAUsers: [[], Validators.required],
        pdManagerName: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
        contractValueUsd: [null, [Validators.required, Validators.min(0)]],
        originalCurrency: [''],
        exchangeRate: [{ value: 0, disabled: true }], // Number input
        contractValueOriginalCurrency: [{ value: 0, disabled: true }], // Number input
        contractStartDate: ['', Validators.required],
        contractEndDate: ['', Validators.required],
        isIFRS16: [false],
        isGIAAPCheck: [false],
        isPHCA:  [false],
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
        sourceJustification: [''],
        socaRsentOn: [''],
        socaRreceivedOn: [''],
        socarDescription: [''],
        preQualificationResult: [''],
      }),
      valueDelivery: this.fb.group({
        costReductionPercent: [null],
        costReductionValue: [null],
        costReductionRemarks: [null],
        operatingEfficiencyValue: [null],
        operatingEfficiencyPercent: [null],
        operatingEfficiencyRemarks: [null],
        costAvoidanceValue: [null],
        costAvoidancePercent: [null],
        costAvoidanceRemarks: [null],
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
        isShah:  [{ value: false, disabled: true }],
        isSCP:  [{ value: false, disabled: true }],
        isBTC:  [{ value: false, disabled: true }],
        isAsiman:  [{ value: false, disabled: true }],
        isBPGroup:  [{ value: false, disabled: true }],
        // Percentage fields with validation (0-100)
        percentage_isACG: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isShah: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isSCP: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isBTC: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isAsiman: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],
        percentage_isBPGroup: [{ value: '', disabled: true }, [Validators.min(0), Validators.max(100)]],

        value_isACG: [{ value: '', disabled: true }],
        value_isShah: [{ value: '', disabled: true }],
        value_isSCP: [{ value: '', disabled: true }],
        value_isBTC: [{ value: '', disabled: true }],
        value_isAsiman: [{ value: '', disabled: true }],
        value_isBPGroup: [{ value: '', disabled: true }],

        totalPercentage: [{ value: 0, disabled: true }, [Validators.min(0), Validators.max(100)]],
        totalValue: [{ value: 0, disabled: true }]
      }),
      costSharing: this.fb.group({
        isCapex: [false],
        isFixOpex: [false],
        isVariableOpex: [false],
        isInventoryItems: [false],
        capexMethodology: [{ value: '', disabled: true }],
        fixOpexMethodology: [{ value: '', disabled: true }],
        variableOpexMethodology: [{ value: '', disabled: true }],
        inventoryItemsMethodology: [{ value: '', disabled: true }]
      }),
      consultation: this.fb.group({
        consultation: this.fb.array([]),
      })

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

    // Watch changes on enable/disable Methodology


    this.setupPSAListeners()
    this.setupMethodologyListeners()
    this.setupPSACalculations()

  }

  onSelectChange(event: any) {
    const selectedOptions = Array.from(event.target.selectedOptions)
      .map((option) => (option as HTMLOptionElement).text);

    this.generalInfoForm.get('generalInfo.psajv')?.setValue(selectedOptions);

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
       const ACG1=  this.generalInfoForm.get(`costAllocation.coVenturers_CMC`)
        const ACG2 = this.generalInfoForm.get(`costAllocation.steeringCommittee_SC`)

        const SD1=  this.generalInfoForm.get(`costAllocation.contractCommittee_SDCC`)
        const SD2 = this.generalInfoForm.get(`costAllocation.coVenturers_SDMC`)

        const SCP1=  this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CC`)
        const SCP2 = this.generalInfoForm.get(`costAllocation.contractCommittee_SCP_Co_CCInfoNote`)
        const SCP3 = this.generalInfoForm.get(`costAllocation.coVenturers_SCP`)

        const BTC1 = this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CC`)
        const BTC2 = this.generalInfoForm.get(`costAllocation.contractCommittee_BTC_CCInfoNote`)
        const BTC3 = this.generalInfoForm.get(`costAllocation.coVenturers_SCP_Board`)


        if (isChecked) {
          percentageControl?.enable();
          valueControl?.enable();

          if(checkbox === "isACG") {
            ACG1?.enable();
            ACG2?.enable();
          } else if(checkbox === "isShah") {
            SD1?.enable();
            SD2?.enable();
          } else if(checkbox === "isSCP") {
            SCP1?.enable();
            SCP2?.enable();
            SCP3?.enable();
          }  else if(checkbox === "isBTC") {
            BTC1?.enable();
            BTC2?.enable();
            BTC3?.enable();
          }

        } else {
          percentageControl?.reset();
          percentageControl?.disable();
          valueControl?.reset();
          valueControl?.disable();

          if(checkbox === "isACG") {
            ACG1?.disable();
            ACG1?.reset();
            ACG2?.disable();
            ACG2?.reset();
          } else if(checkbox === "isShah") {
            SD1?.disable();
            SD1?.reset();
            SD2?.disable();
            SD2?.reset();
          }  else if(checkbox === "isSCP") {
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
    psaControls.forEach(({ percentage, value }) => {
      this.generalInfoForm.get(`costAllocation.${percentage}`)?.valueChanges.subscribe(() => this.calculateTotal());
      this.generalInfoForm.get(`costAllocation.${value}`)?.valueChanges.subscribe(() => this.calculateTotal());
    });
  }

  setupPSACalculations() {
    const psaControls = [
      { percentage: 'percentage_isACG', value: 'value_isACG' },
      { percentage: 'percentage_isShah', value: 'value_isShah' },
      { percentage: 'percentage_isSCP', value: 'value_isSCP' },
      { percentage: 'percentage_isBTC', value: 'value_isBTC' },
      { percentage: 'percentage_isAsiman', value: 'value_isAsiman' },
      { percentage: 'percentage_isBPGroup', value: 'value_isBPGroup' }
    ];

    psaControls.forEach(({ percentage, value }) => {
      this.generalInfoForm.get(`costAllocation.${percentage}`)?.valueChanges.subscribe((percentageValue) => {
        const contractValue = this.generalInfoForm.get('generalInfo.contractValueUsd')?.value || 0;

        if (percentageValue >= 0 && percentageValue <= 100) {
          const calculatedValue = (percentageValue / 100) * contractValue;
          this.generalInfoForm.get(`costAllocation.${value}`)?.setValue(calculatedValue, { emitEvent: false });
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
    costAllocation.get('totalPercentage')?.setValue(totalPercentage, { emitEvent: false });
    costAllocation.get('totalValue')?.setValue(totalValue, { emitEvent: false });
  }



  loadUserDetails(){
    this.userService.getUserDetailsList().subscribe({
      next: (response)=>{
        if(response.status && response.data)
        {
          this.userDetails=response.data;
          console.log('user details',this.userDetails);
        }
      },error:(error)=>{
        console.log('error',error);
      }
    })
  }

  setupMethodologyListeners(){
    const controls = [
      { checkbox: 'isCapex', methodology: 'capexMethodology' },
      { checkbox: 'isFixOpex', methodology: 'fixOpexMethodology' },
      { checkbox: 'isInventoryItems', methodology: 'inventoryItemsMethodology' },
      { checkbox: 'isVariableOpex', methodology: 'variableOpexMethodology' }
    ];

    controls.forEach(({ checkbox, methodology }) => {
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
    const currency = CURRENCY_LIST.find(c => c.code === originalCurrency);
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

  onSubmit(): void {
    console.log("=========", this.generalInfoForm.value);

    if (this.generalInfoForm.valid) {
      console.log(this.generalInfoForm.value);
    } else {
      console.log("Form is invalid");
    }
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
      licenseKey: 'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzMwMTQzOTksImp0aSI6IjQyYjY3MzM5LTliZWMtNDM4Yi1iNDI1LTBkMjQwMTA5NGVmYSIsImxpY2Vuc2VkSG9zdHMiOlsiMTI3LjAuMC4xIiwibG9jYWxob3N0IiwiMTkyLjE2OC4qLioiLCIxMC4qLiouKiIsIjE3Mi4qLiouKiIsIioudGVzdCIsIioubG9jYWxob3N0IiwiKi5sb2NhbCJdLCJ1c2FnZUVuZHBvaW50IjoiaHR0cHM6Ly9wcm94eS1ldmVudC5ja2VkaXRvci5jb20iLCJkaXN0cmlidXRpb25DaGFubmVsIjpbImNsb3VkIiwiZHJ1cGFsIl0sImxpY2Vuc2VUeXBlIjoiZGV2ZWxvcG1lbnQiLCJmZWF0dXJlcyI6WyJEUlVQIl0sInZjIjoiNzUzNGFkZTYifQ.ptjYqAzuyzYYdfXiEUfb2mQrv7-3XqE05iiZULTOdDBOVgDmYdcViq1PnQr8S4phuDtWIaUe8mukF_hb_OsGnA', // Replace with your CKEditor license key
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

  // Add a new risk row
  addRow() {
    this.risks.push(
      this.fb.group({
        id: this.generateId(this.risks.length),
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
        fullName: ['', Validators.required],
        localJV: [false], // Checkbox
        country: ['', Validators.required],
        parentCompany: [''],
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


  openModal() {
    const modalRef = this._mdlSvc.open(DummyCompComponent);
    modalRef.result.then((result) => {
      if (result) {
        console.log(result);
      }
    });
  }
}
