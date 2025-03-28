import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DictionaryDetail } from '../../models/dictionary';
import { DictionaryService } from '../../service/dictionary.service';
import { ToastService } from '../../service/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Route, Router } from '@angular/router';

@Component({
  selector: 'app-dictionaries-edit',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule,CommonModule,NgbToastModule],
  templateUrl: './dictionaries-edit.component.html',
  styleUrl: './dictionaries-edit.component.scss'
})
export class DictionariesEditComponent implements OnInit {


    dictForm: FormGroup;
    dictDetails: DictionaryDetail;
    editDetail:DictionaryDetail|null=null;
    isSubmitting=false;
    isEditing=false;
    iteam:string='';
  
    constructor(
      public toastService:ToastService,
      private fb: FormBuilder,
      private dictionaryService:DictionaryService,
      private activateRoute:ActivatedRoute,
      private router:Router
    ) {
      this.dictForm = this.fb.group({
        id: [0],
        itemName: ['', [Validators.required]],
        itemValue: ['', [Validators.required]],
        isActive: [true],
      });
  
      const formValues = this.dictForm.value;
      this.dictDetails = {
        ...formValues,
        createdBy:'temp'
      };

    }

    ngOnInit(): void {
      this.activateRoute.params.subscribe(params => {
        this.iteam = params['itemName'];
        
        if (!this.iteam) {
          this.toastService.show('Item Name is required', 'danger');
          this.router.navigate(['/dictionaries-list']); 
          return;
        }

        const idParam=params['id'];
        
        if (idParam) {
          const id = Number(idParam);
          
        
          if (isNaN(id)) {
            this.toastService.show('Invalid Item ID', 'danger');
            this.router.navigate(['/dictionaries-list']);
            return;
          }

          this.isEditing=true;
          this.loadDictionaryDetail(id);
        }
        this.dictForm.get('itemName')?.setValue(this.iteam);
  
      });

      // this.resetForm();
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
              if(this.isEditing&&this.editDetail)
              {
                this.toastService.show('Dictionary Updated Successfully','success');
              }
              else{
                this.toastService.show('Dictionary Addded Successfully','success');
              }
             
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

        if(this.isEditing&&this.editDetail)
        {
          console.log("here+>");
          this.dictForm.patchValue({...this.editDetail});
        }else{
          console.log("here2>");
          this.resetToDefault();
        }
      this.mapFormValues();
    }

    resetToDefault()
    {
      this.dictForm.reset({
        id: 0,
        itemName:this.dictForm.get('itemName')?.value || '',
        itemValue: '',
        isActive: true,
        });
    }

    private mapFormValues(): void {
      const formValues = this.dictForm.value;
      this.dictDetails = {
        ...formValues,
        createdBy:'temp'
      };
    }

    loadDictionaryDetail(id:number)
    {
      this.dictionaryService.getDictionaryListByItem(this.iteam).subscribe({
        next:(response)=>{
          if(response.status && response.data)
          {
            const dictionaryData=response.data;
            console.log('Dictionary Detail',dictionaryData);

            this.editDetail=dictionaryData.find(dictData=>dictData.id===id)||null;
            console.log('Edit Dictionary Detail',this.editDetail);
            if(this.editDetail)
            {
              this.dictForm.patchValue({...this.editDetail});
            }else{
              this.toastService.show("Please Select Valid Item Value",'danger');
              this.router.navigate(['/dictionaries-list']); 
            }
  
          }else{
            this.toastService.show("Please Select Valid Item",'danger');
            this.router.navigate(['/dictionaries-list']); 
          }

        },error:(error)=>{
          console.log('error',error);
          this.toastService.show("Please Select Valid Item",'danger');
          this.router.navigate(['/dictionaries-list']); 

        }
      })
    }

}
