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

@Component({
  selector: 'app-threshold-add',
  standalone: true,
  imports: [NgbToastModule, CommonModule, FormsModule, ReactiveFormsModule],
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
  sourcingTypeData: DictionaryDetail[] = [];
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


  ngOnInit(): void {
    this.thresholdForm = this.fb.group({
      thresholdName: ['', Validators.required],
      description: [''],
      paperType: [null, Validators.required],
      sourcingType: [null],
      isActive: [true],
      psaAgreement: [null],
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
            this.thresholdForm.get('sourcingType')?.setValidators(Validators.required);
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
      sourcingType: formValues.sourcingType ? Number(formValues.sourcingType) : 0,
      psaAgreement: formValues.psaAgreement ? Number(formValues.psaAgreement) : 0,
      extension: "",
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
          this.sourcingTypeData = response.data || [];
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
            paperType: this.selectedThreshold.paperType,
            sourcingType: this.selectedThreshold.sourcingType ? this.selectedThreshold.sourcingType.toString() : '',
            isActive: this.selectedThreshold.isActive,
            psaAgreement: this.selectedThreshold.psaAgreement ? this.selectedThreshold.psaAgreement.toString() : '',
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

  discard(): void {
    this.thresholdForm.reset();
    this.router.navigate(['/threshold']);

  }

}
