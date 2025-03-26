import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DictionaryDetail } from '../../models/dictionary';
import { DictionaryService } from '../../service/dictionary.service';
import { ToastService } from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-dictionaries-edit',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,CommonModule,NgbToastModule],
  templateUrl: './dictionaries-edit.component.html',
  styleUrl: './dictionaries-edit.component.scss'
})
export class DictionariesEditComponent {


    dictForm: FormGroup;
    dictDetails: DictionaryDetail;
    isSubmitting=false;
  
    constructor(
      public toastService:ToastService,
      private fb: FormBuilder,
      private dictionaryService:DictionaryService
    ) {
      this.dictForm = this.fb.group({
        id: [0],
        itemName: ['', [Validators.required]],
        itemValue: ['', [Validators.required]],
        isActive: [true],
        createdDate: [new Date().toISOString()],
        modifiedDate: [new Date().toISOString()],
        createdBy: ['temp'],
        modifiedBy: ['Temp'],
      });
  
      const formValues = this.dictForm.value;
      this.dictDetails = {
        ...formValues
      };

    }

    addDictionaryDetails(): void {
      if (this.dictForm.valid) {
        if (this.isSubmitting) return;
        this.mapFormValues();
        console.log('Dict Details:', this.dictDetails);
        this.isSubmitting=true;
        this.dictionaryService.upsertDictionary(this.dictDetails).subscribe({
          next: (response) => {
            if (response&&response.status) {
              this.toastService.show('Dictionary Addded Successfully','success');
            }
            else{
              this.toastService.show('Something Went Wrong','warning');
            }
          },
          error: (error) => {
            console.log('Error', error);
            this.toastService.show('Error Occurred','danger');
          },complete:()=>{
            this.isSubmitting=false;
          }
        });
      } else {
        console.log('form is invalid');
        this.toastService.show('Please Fill All Required Fields','danger')
        return;
      }
  
      this.resetForm();
    }
  
    resetForm(): void {
        this.dictForm.reset({
        id: 0,
        itemName:'',
        itemValue: '',
        isActive: true,
        createdDate:new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        createdBy: 'temp',
        modifiedBy: 'Temp',
        });
      this.mapFormValues();
    }

    private mapFormValues(): void {
      const formValues = this.dictForm.value;
      this.dictDetails = {
        ...formValues
      };
    }

}
