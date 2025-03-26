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
        costReductionRemarks: [null],
        operatingEfficiencyValue: [null],
        operatingEfficiencyPercent: [null],
        operatingEfficiencyRemarks: [null],
        costAvoidanceValue: [null],
        costAvoidancePercent: [null],
        costAvoidanceRemarks: [null],
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
        isACG: [{ value: false, disabled: true }],
        isShah:  [{ value: false, disabled: true }],
        isSCP:  [{ value: false, disabled: true }],
        isBTC:  [{ value: false, disabled: true }],
        isAsiman:  [{ value: false, disabled: true }],
        isBPGroup:  [{ value: false, disabled: true }],
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
