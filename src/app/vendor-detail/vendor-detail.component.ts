import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendorService } from '../../service/vendor.service';
import { VendorDetail } from '../../models/vendor';
import { Generalervice } from '../../service/general.service';
import { CountryDetail } from '../../models/general';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule,CommonModule],
  templateUrl: './vendor-detail.component.html',
  styleUrl: './vendor-detail.component.scss'
})
export class VendorDetailComponent  implements OnInit{

  vendorDetail: VendorDetail|null=null; 

  vendorForm!: FormGroup;
  originalVendorDetail!: VendorDetail;
  editMode = false;
  selectedFile: File | null = null;
  fileError: string | null = null;
  countryDetails:CountryDetail[]=[];

  constructor(private fb: FormBuilder,
     private vendorService: VendorService,private countryService:Generalervice) {

    this.vendorForm = this.fb.group({
      id: [0],
      vendorName: ['', Validators.required],
      taxId: ['', Validators.required],
      sapId: ['', Validators.required],
      country: [null, Validators.required],
      isActive: [true],
      contactPerson: ['Temp', Validators.required],
      contactEmail: ['Temp@gmail.com', [Validators.required, Validators.email]],
      contactPhone: ['9090909090', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      avatarPath: ['Temp'],
      isCGBRegistered: [true],
      approvalStatus: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCountry();

    console.log('vendor',this.vendorDetail);

    if (this.vendorDetail && this.vendorDetail.id > 0) {
      this.editMode = true;
      this.setVendorData(this.vendorDetail);
    } else {
      this.resetToDefault();
    }

    this.mapFormValues();
  }

  private setVendorData(vendor: VendorDetail): void {
    this.vendorForm.patchValue({
      ...vendor,
      country:this.countryDetails.find(country=>country.id===vendor.countryId)||null});
    this.originalVendorDetail = { ...vendor }; 
  }

  private resetToDefault(): void {
    this.originalVendorDetail = {
      id: 0,
      vendorName: '',
      taxId: '',
      sapId: '',
      countryId: this.countryDetails.length>0?this.countryDetails[0].id:1,
      isActive: true,
      contactPerson: 'Temp',
      contactEmail: 'Temp@gmail.com',
      contactPhone: '9090909090',
      avatarPath: 'Temp',
      isCGBRegistered: true,
      approvalStatus: 'Pending',
      createdBy: 1,
      createdDate: new Date().toISOString(),
      modifiedBy: 1,
      modifiedDate: new Date().toISOString(),
      country: null,
      createdUser: null,
      modifiedUser: null
    };
    this.vendorForm.patchValue({
      ...this.originalVendorDetail,
        country:this.countryDetails.find(country=>country.id==this.originalVendorDetail.countryId)||null
    });
  }

  resetForm(): void {
    if (this.editMode) {
      this.vendorForm.patchValue({
        ...this.originalVendorDetail,
        country:this.countryDetails.find(country=>country.id==this.originalVendorDetail.countryId)||null
      });
    } else {
      this.resetToDefault();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];

    if (!file) {
      this.selectedFile = null;
      this.fileError = 'File is required.';
      return;
    }
  
    if (file.size > 10 * 1024 * 1024) {
      this.selectedFile = null;
      this.fileError = 'File size must not exceed 10MB.';
      return;
    }
  
    this.selectedFile = file;
    this.fileError = null;

 
}

  private mapFormValues(): VendorDetail {
    const formValues = this.vendorForm.value;
    console.log('form Vale',formValues);
    return {
      ...formValues,
      countryId:formValues.country?.id || 0,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString()
    };
  }

  submitVendor(): void {
    
    if (this.vendorForm.invalid || this.fileError) {
        console.log('Form is invalid');
        Object.keys(this.vendorForm.controls).forEach((key) => {
        const control = this.vendorForm.get(key);
        if (control && control.invalid) {
          console.log(`Invalid field: ${key}`, control.errors);
        }
      });
      return;
    }

    const vendorData = this.mapFormValues();
    console.log('vendor Details',vendorData);
    this.vendorService.upsertVendorDetail(vendorData, this.selectedFile).subscribe({
      next: (response) => {
        if (response.success === false) {
          console.log('Error Accured');
        }
      },
      error: (error) => {
        console.log('Error', error);
      },
    });

    this.resetToDefault();
  }

  loadCountry() {
    this.countryService.getCountryDetails().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          
          this.countryDetails = reponse.data;
          console.log('country:', this.countryDetails);

          if (this.countryDetails.length > 0) {
            this.vendorForm.patchValue({ country: this.countryDetails[0] });
          }
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }
}
