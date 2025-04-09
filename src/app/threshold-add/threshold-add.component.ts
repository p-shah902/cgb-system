import {Component, inject} from '@angular/core';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from '../../service/toast.service';
import {CommonModule} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import {
  Validators,
  ReactiveFormsModule,
  FormsModule, FormGroup, FormBuilder
} from '@angular/forms';
import {DictionaryService} from '../../service/dictionary.service';
import {ThresholdService} from '../../service/threshold.service';
import {DictionaryDetail} from '../../models/dictionary';

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
  sourcingTypeData: DictionaryDetail[] = [];

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
      psaAgreement: [null, Validators.required],
      contractValueLimit: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      variationPercent: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    });

    this.route.queryParamMap.subscribe(queryParams => {
      this.type = queryParams.get('type') || "";
      console.log('Type:', this.type);

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
      thresholdType: this.type ? "Internal" : "Partner",
      extension: "",
      notificationSendTo: "",
      psaAgreement:0
    };

    this.thresholdService.createThreshold(payload).subscribe({
      next: ({status, data, message}) => {
        if (status && data) {
          this.thresholdForm.reset();
          this.submitted = false;
          this.toastService.show(message || "Added Successfully", 'success');

          setTimeout(() => {
            this.router.navigate(['/threshold']);
          }, 2000);
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
          console.log('Dictionary Detail:', response.data);
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
          this.sourcingTypeData = response.data || [];
        }
      },
      error: (error) => {
        console.log('Error:', error);
      }
    });
  }

  discard(): void {
    this.thresholdForm.reset();
  }

}
