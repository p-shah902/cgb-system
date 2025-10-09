import {Component, inject} from '@angular/core';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from '../../service/toast.service';
import {CommonModule} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import {
  Validators,
  ReactiveFormsModule,
  FormsModule, FormGroup, FormBuilder
} from '@angular/forms';
import {DictionaryService} from '../../service/dictionary.service';
import {ThresholdService} from '../../service/threshold.service';
import {DictionaryDetail} from '../../models/dictionary';
import {ThresholdType} from '../../models/threshold';
import {Select2} from 'ng-select2-component';
import { COMMITTEE_CONDITIONS } from '../../utils/threshold-conditions';

@Component({
  selector: 'app-threshold-add',
  standalone: true,
  imports: [NgbToastModule, CommonModule, FormsModule, ReactiveFormsModule, Select2],
  templateUrl: './threshold-add.component.html',
  styleUrl: './threshold-add.component.scss'
})
export class ThresholdAddComponent {
  public toastService = inject(ToastService)
  private readonly thresholdService = inject(ThresholdService);
  submitted = false;
  type: string = ""
  thresholdForm!: FormGroup;
  psaList: DictionaryDetail[] = []
  thresholdId: null | number = null
  // sourcingTypeData: DictionaryDetail[] = [];
  sourcingTypeData: { value: string; label: string }[] = [];
  selectedThreshold: ThresholdType | null = null;
  private allApisDone$ = new BehaviorSubject<boolean>(false);
  private completedCount = 0;
  private totalCalls = 2;
  constructor(private fb: FormBuilder, private router: Router, private route: ActivatedRoute, private dictionaryService: DictionaryService) {
  }

  public paperTypeData: any = [
    {
      value: 'Approach to Market',
      label: 'Approach to Market',
    },
    {
      value: 'Contract Award',
      label: 'Contract Award',
    },
    {
      value: 'Variation Paper',
      label: 'Variation Paper',
    },
    {
      value: 'Approval of Sale / Disposal Form',
      label: 'Approval of Sale / Disposal Form',
    },
    {
      value: 'Info note',
      label: 'Info note',
    },
  ];

  // Committee dropdown data - dynamically generated from COMMITTEE_CONDITIONS
  public committeeData: { value: string; label: string }[] = [];


  ngOnInit(): void {
    // Initialize committee data from COMMITTEE_CONDITIONS
    this.initializeCommitteeData();

    this.thresholdForm = this.fb.group({
      thresholdName: ['', Validators.required],
      description: [''],
      paperTypes: [[], [Validators.required, this.arrayMinLengthValidator(1)]], // Changed to array with validation
      sourcingType: [[]], // Changed to array
      isActive: [true],
      psaAgreement: [null],
      committee: [null, Validators.required], // Add committee field
      contractValueLimit: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      variationPercent: [null],
    });

    this.allApisDone$.subscribe((done) => {
      if (done) {
        this.route.paramMap.subscribe(params => {
          this.type = params.get('type') || "";
          this.thresholdId = params.get('id') ? Number(params.get('id')) : null;     // optional
          console.log('Type:', this.type, this.thresholdId);

          if (this.type === 'internal') {
            this.thresholdForm.get('sourcingType')?.setValidators([Validators.required, this.arrayMinLengthValidator(1)]);
          } else {
            this.thresholdForm.get('sourcingType')?.clearValidators();
          }

          // Dynamic validation for psaAgreement (if type === 'partner')
          if (this.type === 'partner') {
            this.thresholdForm.get('psaAgreement')?.setValidators(Validators.required);
          } else {
            this.thresholdForm.get('psaAgreement')?.clearValidators();
          }

          this.thresholdForm.get('sourcingType')?.updateValueAndValidity();
          this.thresholdForm.get('psaAgreement')?.updateValueAndValidity();


          if(this.thresholdId) {
            this.fetchThresholdDetails(this.thresholdId)
          }
        });
      }
    });

    this.loadPSADictionaryDetails()
    this.loadSourcingDictionaryDetails()

  }

  onSubmit(): void {
    this.submitted = true;

    if (this.thresholdForm.invalid) {
      console.warn('Invalid form submission');
      return;
    }

    const formValues = this.thresholdForm.value;
    const payload = {
      ...formValues,
      thresholdType: this.type === "internal" ? "Internal" : "Partner",
      // Handle sourcingType as array - convert to numbers or set to 0 if empty
      sourcingType: Array.isArray(formValues.sourcingType) && formValues.sourcingType.length > 0
        ? formValues.sourcingType.map((id: string) => Number(id))
        : 0,
      psaAgreements: formValues.psaAgreement ? Number(formValues.psaAgreement) : 0,
      extension: formValues.committee || "", // Save committee in extension field
      notificationSendTo: "",
    };

    if(this.selectedThreshold && this.selectedThreshold.id) {
      const params = {
        ...payload,
        id: this.selectedThreshold.id
      }
      this.updateThreshold(params)
    } else {
      this.createThreshold(payload)
    }

    console.log("==payload", payload)
  }


  createThreshold(payload: any) {
    this.thresholdService.createThreshold(payload).subscribe({
      next: ({status, data, message}) => {
        if (status && data) {
          this.thresholdForm.reset();
          this.submitted = false;
          this.toastService.show(message || "Added Successfully", 'success');
          this.router.navigate(['/threshold']);
        } else {
          this.toastService.show(message || "Something went wrong.", 'danger');
        }
      },
      error: (error) => {
        console.error('Threshold creation error:', error);
        this.toastService.show("Something went wrong.", 'danger');
      }
    });
  }

  updateThreshold(payload: any) {
    this.thresholdService.updateThreshold(payload).subscribe({
      next: ({status, data, message}) => {
        if (status && data) {
          this.thresholdForm.reset();
          this.submitted = false;
          this.toastService.show(message || "Threshold updated successfully", 'success');
          this.router.navigate(['/threshold']);
        } else {
          this.toastService.show(message || "Something went wrong.", 'danger');
        }
      },
      error: (error) => {
        console.error('Threshold creation error:', error);
        this.toastService.show("Something went wrong.", 'danger');
      }
    });
  }

  loadPSADictionaryDetails() {
    this.dictionaryService.getDictionaryListByItem('psa').subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.incrementAndCheck();
          this.psaList = response.data || [];
        }
      },
      error: (error) => {
        console.log('Error:', error);
      }
    });
  }

  loadSourcingDictionaryDetails() {
    this.dictionaryService.getDictionaryListByItem('Sourcing Type').subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.incrementAndCheck();
          this.sourcingTypeData = (response.data || []).map(item => ({
            value: item.id.toString(),
            label: item.itemValue
          }));
          this.sourcingTypeData.push({
            value: "0",
            label: "Any"
          })
        }
      },
      error: (error) => {
        console.log('Error:', error);
      }
    });
  }

  fetchThresholdDetails(id: number) {
    this.thresholdService.getThresholdDetailsById(id).subscribe({
      next: (response) => {
        if (response.status && response.data && response.data.length > 0) {
          this.selectedThreshold = response.data[0] || null;
          console.log("== this.selectedThreshold",  this.selectedThreshold)

          // Patch the form values
          this.thresholdForm.patchValue({
            thresholdName: this.selectedThreshold.thresholdName,
            description: this.selectedThreshold.description,
            // Handle paperType as array or string
            paperTypes: (this.selectedThreshold.paperType as any).split(','),
            // Handle sourcingType as array or number
            sourcingType: (this.selectedThreshold.sourcingType as any).split(','),
            isActive: this.selectedThreshold.isActive,
            psaAgreement: this.selectedThreshold.psaAgreement ? this.selectedThreshold.psaAgreement.toString() : '',
            committee: this.selectedThreshold.extension || '', // Load committee from extension
            contractValueLimit: this.selectedThreshold.contractValueLimit,
            // variationPercent: this.selectedThreshold.variationPercent || '', // fallback in case field is missing
          });
        }
      },
      error: (error) => {
        console.log('Error:', error);
      }
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

  /**
   * Initialize committee dropdown data from COMMITTEE_CONDITIONS
   * Extract unique committee values and create dropdown options
   */
  private initializeCommitteeData(): void {
    // Get unique committee values from COMMITTEE_CONDITIONS
    const uniqueCommittees = new Set<string>();
    COMMITTEE_CONDITIONS.forEach(condition => {
      uniqueCommittees.add(condition.committee);
    });

    // Convert to dropdown format with readable labels
    this.committeeData = Array.from(uniqueCommittees).map(committee => ({
      value: committee,
      label: this.formatCommitteeLabel(committee)
    })).sort((a, b) => a.label.localeCompare(b.label));
  }

  /**
   * Format committee control name to readable label
   * Based on the image format: CMC, SDCC, SCP Co CC, BTC CC, SC, SDMC, SCP Board
   */
  private formatCommitteeLabel(committee: string): string {
    // Map committee control names to display labels
    const committeeLabelMap: { [key: string]: string } = {
      'coVenturers_CMC': 'CMC',
      'contractCommittee_SDCC': 'SDCC',
      'contractCommittee_SCP_Co_CC': 'SCP Co CC',
      'contractCommittee_BTC_CC': 'BTC CC',
      'steeringCommittee_SC': 'SC',
      'coVenturers_SDMC': 'SDMC',
      'coVenturers_SCP': 'SCP Board',
      'contractCommittee_CMC': 'CMC',
      'supplyChainCommittee_SDCC': 'SDCC',
      'contractCommittee_SCP_CC': 'SCP CC',
      'committeeBoard_SCP_BOARD': 'SCP Board',
      'committeeBoard_ACG_BOARD': 'ACG Board'
    };

    return committeeLabelMap[committee] || committee;
  }

  discard(): void {
    this.thresholdForm.reset();
    this.router.navigate(['/threshold']);
  }

  // Custom validator for array minimum length
  arrayMinLengthValidator(minLength: number) {
    return (control: any) => {
      if (!control.value || !Array.isArray(control.value) || control.value.length < minLength) {
        return { arrayMinLength: { requiredLength: minLength, actualLength: control.value?.length || 0 } };
      }
      return null;
    };
  }

}
