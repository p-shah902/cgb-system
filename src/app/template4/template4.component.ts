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
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-template4',
  standalone: true,
  imports: [CommonModule, CKEditorModule, FormsModule, ReactiveFormsModule, Select2,NgbToastModule],
  templateUrl: './template4.component.html',
  styleUrl: './template4.component.scss'
})
export class Template4Component {
  generalInfoForm!: FormGroup;
    private readonly userService = inject(UserService);
    private searchTimeout: any;
    isEndDateDisabled: boolean = true;
    minEndDate: string = '';
    submitted = false;

    userDetails: UserDetails[] = [];
    procurementTagUsers: any[] = [];
    @ViewChild('searchInput') searchInput!: ElementRef; // Optional: If search input needs access
    highlightClass = 'highlight'; // CSS class for highlighting

    constructor(private fb: FormBuilder, public toastService:ToastService,private renderer:Renderer2
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

      this.loadUserDetails();



      this.generalInfoForm = this.fb.group({
        generalInfo: this.fb.group({
          paperProvision: ['', Validators.required],
          cgbItemRef: ['', Validators.required ],
          cgbCirculationDate: ['', Validators.required],
          bltMember: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
          operatingFunction: ['', Validators.required],
          vP1UserId: [null, [Validators.required, Validators.pattern("^[0-9]+$")]],
          procurementSPAUsers: [[1,2], Validators.required],
          isIFRS16: [false],
          isGIAAPCheck: [false],
          psajv: [[], Validators.required],
          isGovtReprAligned: [false],
          govtReprAlignedComment: [''],
          technicalApprovar:[''],
          purchaserName:[''],
          saleDisposeValue:[0],
          retrospectiveApprovalReason:[''],
          referenceNo:[''],
          isRetrospectiveApproval:[true],// need to discuss
          transactionType:['']//need to discuss
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

          value_isACG: [{value: '', disabled: true}],
          value_isShah: [{value: '', disabled: true}],
          value_isSCP: [{value: '', disabled: true}],
          value_isBTC: [{value: '', disabled: true}],
          value_isAsiman: [{value: '', disabled: true}],
          value_isBPGroup: [{value: '', disabled: true}],

          totalPercentage: [{value: 0, disabled: true}, [Validators.min(0), Validators.max(100)]],
          totalValue: [{value: 0, disabled: true}]
        }),
        consultation: this.fb.array([]),
      });

      this.generalInfoForm.get('generalInfo.psajv')?.valueChanges.subscribe(() => {
        this.onSelectChange();
      });

      // Watch changes on enable/disable Methodology


      this.setupPSAListeners()
      // this.setupMethodologyListeners()
      this.setupPSACalculations()
      // this.onLTCCChange()
      this.alignGovChange()
      // this.conflictIntrestChanges()

    }

    get generalInfo() {
      return this.generalInfoForm.get('generalInfo');
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
            this.procurementTagUsers = response.data.filter(user => user.roleName !== 'Procurement Tag').map(t => ({label: t.displayName, value: t.id}));

            console.log('user details', this.userDetails);
          }
        }, error: (error) => {
          console.log('error', error);
        }
      })
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


    // Getter for FormArray
    get consultationRows(): FormArray {
      return this.generalInfoForm.get('consultation') as FormArray;
    }

    // Generate ID dynamically (001, 002, etc.)
    generateId(index: number): string {
      return (index + 1).toString().padStart(3, '0');
    }

    // Function to add a new consultation row
    addConsultationRow() {
      this.consultationRows.push(
        this.fb.group({
          psa: ['', Validators.required],
          isNoExistingBudget: [false], // Checkbox
          technicalCorrect: [1],
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

    onSubmit(): void {
      this.submitted = true;

      if (this.generalInfoForm.invalid) {
        console.log("=========", this.generalInfoForm);
      }
      const generalInfoValue = this.generalInfoForm?.value?.generalInfo
      const consultationsValue = this.generalInfoForm?.value?.consultation
      const costAllocationValues = this.generalInfoForm?.value?.costAllocation
      console.log("costValue==>",costAllocationValues)

      const params = {
        papers: {
          paperStatusId: 1,
          paperProvision: generalInfoValue?.paperProvision,
          purposeRequired: "test",
          isActive: true
        },
        approvalOfSale: {
          cgbItemRef: generalInfoValue?.cgbItemRef || null,
          cgbCirculationDate: generalInfoValue?.cgbCirculationDate || null,
          bltMember: generalInfoValue?.bltMember,
          operatingFunction: generalInfoValue?.operatingFunction,
          vP1UserId: generalInfoValue?.vP1UserId || "",
          procurementSPAUsers: generalInfoValue?.procurementSPAUsers?.join(',') || "1,2",
          psajv: generalInfoValue?.psajv?.join(',') || "",
          isGovtReprAligned: generalInfoValue?.isGovtReprAligned,
          govtReprAlignedComment: generalInfoValue?.govtReprAlignedComment,
          isIFRS16: generalInfoValue?.isIFRS16,
          isGIAAPCheck: generalInfoValue?.isGIAAPCheck,
          transactionType:generalInfoValue?.transactionType,
          technicalApprovar:generalInfoValue?.technicalApprovar,
          purchaserName:generalInfoValue?.purchaserName,
          saleDisposeValue:generalInfoValue?.saleDisposeValue,
          isRetrospectiveApproval:generalInfoValue?.isRetrospectiveApproval,
          retrospectiveApprovalReason:generalInfoValue?.retrospectiveApprovalReason,
          referenceNo:generalInfoValue?.referenceNo
        },
        consultations: consultationsValue,
        costAllocation: {
          id: 0,
          // PSA flags
          psA_ACG: costAllocationValues.isACG?.value || false,
          psA_ShahDeniz: costAllocationValues.isShah?.value || false,
          psA_SCP: costAllocationValues.isSCP?.value || false,
          psA_BTC: costAllocationValues.isBTC?.value || false,
          psA_ShAsiman: costAllocationValues.isAsiman?.value || false,
          psA_BPGroup: costAllocationValues.isBPGroup?.value || false,

          // Percentage values
          acG_AsPercentage: parseFloat(costAllocationValues.percentage_isACG?.value) || 0,
          shahDeniz_AsPercentage: parseFloat(costAllocationValues.percentage_isShah?.value) || 0,
          scP_AsPercentage: parseFloat(costAllocationValues.percentage_isSCP?.value) || 0,
          btC_AsPercentage: parseFloat(costAllocationValues.percentage_isBTC?.value) || 0,
          shAsiman_AsPercentage: parseFloat(costAllocationValues.percentage_isAsiman?.value) || 0,
          bpGroup_AsPercentage: parseFloat(costAllocationValues.percentage_isBPGroup?.value) || 0,

          // Value amounts
          acG_ByValue: parseFloat(costAllocationValues.value_isACG?.value) || 0,
          shahDeniz_ByValue: parseFloat(costAllocationValues.value_isShah?.value) || 0,
          scP_ByValue: parseFloat(costAllocationValues.value_isSCP?.value) || 0,
          btC_ByValue: parseFloat(costAllocationValues.value_isBTC?.value) || 0,
          shAsiman_ByValue: parseFloat(costAllocationValues.value_isAsiman?.value) || 0,
          bpGroup_ByValue: parseFloat(costAllocationValues.value_isBPGroup?.value) || 0,

          // Totals
          total_Percentage: parseFloat(costAllocationValues.totalPercentage?.value) || 0,
          total_Value: parseFloat(costAllocationValues.totalValue?.value) || 0
        },
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
      console.log('form value:====>',this.generalInfoForm.value)
      if (this.generalInfoForm.valid) {
        console.log('form value:====>',this.generalInfoForm.value)
      } else {
        console.log("Form is invalid");
      }
    }

}
