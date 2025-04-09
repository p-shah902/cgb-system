import {Component, inject} from '@angular/core';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from '../../service/toast.service';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {
  Validators,
  ReactiveFormsModule,
  FormsModule, FormGroup, FormBuilder
} from '@angular/forms';
import {DictionaryService} from '../../service/dictionary.service';
import {ThresholdService} from '../../service/threshold.service';

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

  thresholdForm!: FormGroup;
  psaList: any = []

  constructor(private fb: FormBuilder, private router: Router, private dictionaryService: DictionaryService) {
  }

  public paperTypeData: any = [
    {
      value: 'Approach to Market',
      label: 'Approach to Market',
    },
    {
      value: 'Contact Award',
      label: 'Contact Award',
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
    this.loadDictionaryDetails()
    this.thresholdForm = this.fb.group({
      thresholdName: ['', Validators.required],
      description: [''],
      paperType: ['', Validators.required],
      isActive: [true],
      psaAgreement: ['', Validators.required],
      contractValueLimit: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
      variationPercent: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    });
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
      thresholdType: "Internal",
      extension: "",
      notificationSendTo: ""
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

  loadDictionaryDetails() {
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

  discard(): void {
    this.thresholdForm.reset();
  }

}
