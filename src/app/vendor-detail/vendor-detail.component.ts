import {CommonModule} from '@angular/common';
import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {VendorService} from '../../service/vendor.service';
import {VendorDetail, VendorInfo} from '../../models/vendor';
import {Generalervice} from '../../service/general.service';
import {CountryDetail} from '../../models/general';
import {ToastService} from '../../service/toast.service';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, NgbToastModule],
  templateUrl: './vendor-detail.component.html',
  styleUrl: './vendor-detail.component.scss'
})
export class VendorDetailComponent implements OnInit {

  vendorDetail: VendorDetail | null = null;
  vendorInfo:VendorInfo|null=null;
  vendorForm!: FormGroup;
  originalVendorDetail!: VendorDetail;
  editMode = false;
  selectedFile: File | null = null;
  fileError: string | null = null;
  countryDetails: CountryDetail[] = [];

  isSubmitting = false;

  previewFile: any;

  constructor(private fb: FormBuilder, public toastService: ToastService,
              private vendorService: VendorService, private countryService: Generalervice,
             private router:Router,private activateRoute:ActivatedRoute) {

    this.vendorForm = this.fb.group({
      id: [0],
      vendorName: ['', Validators.required],
      parentCompanyName: [''],
      taxId: ['', Validators.required],
      sapId: ['', Validators.required],
      countryId: [0, Validators.min(1)],
      isActive: [true],
      contactPerson: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: [''],
      avatarPath: [''],
      isCGBRegistered: [true],
      isLocalJV: [false]
    });
  }

  ngOnInit(): void {
    this.loadCountry();

    this.activateRoute.params.subscribe(params => {
      const idParam=params['id'];

      if (idParam) {
        const id = Number(idParam);

        if (isNaN(id)) {
          this.toastService.show('Invalid Vendor ID', 'danger');
          this.router.navigate(['/vendors']);
          return;
        }

        this.editMode=true;
        this.loadVendorById(id);
      }

    });

  }

  // private setVendorData(vendor: VendorDetail): void {
  //   this.vendorForm.patchValue({
  //     ...vendor
  //   });
  //   this.originalVendorDetail = {...vendor};
  // }

  private resetToDefault(): void {
    this.originalVendorDetail = {
      id: 0,
      vendorName: '',
      parentCompanyName: '',
      taxId: '',
      sapId: '',
      countryId: 0,
      isActive: true,
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      avatarPath: '',
      isCGBRegistered: true,
      isLocalJV: false,
      createdBy: null,
      createdDate: '',
      modifiedBy: null,
      modifiedDate: '',
      country: null,
      countryName:null,
      avatarBytes:null,
      files:null

    };
    this.vendorForm.patchValue({
      ...this.originalVendorDetail
    });
  }

  resetForm(): void {
    if (this.editMode&&this.vendorDetail) {
      this.vendorForm.patchValue({
        ...this.vendorDetail,
      });
    } else {
      this.resetToDefault();
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (!file) {
      this.selectedFile = null;
      this.fileError = null;
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'        // XLSX
    ];

    if (!allowedTypes.includes(file.type)) {
      this.selectedFile = null;
      this.fileError = 'Invalid file type. Only PDF, DOCX, and XLSX are allowed.';
      if(this.fileError) {
        this.toastService.show(this.fileError , 'danger');
      }
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.selectedFile = null;
      this.fileError = 'File size must not exceed 10MB.';
      if(this.fileError) {
        this.toastService.show(this.fileError , 'danger');
      }
      return;
    }

    this.selectedFile = file;
    this.fileError = null;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewFile = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  private mapFormValues(): VendorDetail {
    const formValues = this.vendorForm.value;
    return {
      ...formValues,
      countryId: formValues.countryId,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString()
    };
  }

  submitVendor(): void {
    if (this.vendorForm.invalid) {
      this.toastService.show('Please Fill All Required Fields', 'danger');
      return;
    }
    if (this.isSubmitting) return;

    const vendorData = this.mapFormValues();
    this.isSubmitting = true;
    this.vendorService.upsertVendorDetail(vendorData, this.selectedFile).subscribe({
      next: (response) => {
        if (response && response.status) {
          if (this.editMode && this.vendorDetail) {
            this.toastService.show('Vendor Updated Successfully', 'success');
          } else {
            this.toastService.show('Vendor Addded Successfully', 'success');
          }
          this.router.navigate(['/vendors']);
          this.resetToDefault();
        } else {
          this.toastService.show(response?.message || 'Something Went Wrong', 'warning');
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        console.log('Error', error);
        
        // Parse error response to show user-friendly messages
        let errorMessage = 'Failed to save vendor details';
        
        if (error?.error?.errors) {
          const errors = error.error.errors;
          
          // Check for Email errors
          if (errors.Email && Array.isArray(errors.Email) && errors.Email.length > 0) {
            const emailError = errors.Email[0].toLowerCase();
            if (emailError.includes('email') || emailError.includes('contact email')) {
              errorMessage = 'Email already exists';
            } else if (emailError.includes('vendor name')) {
              errorMessage = 'Vendor name already exists';
            } else if (emailError.includes('vendor name') && emailError.includes('email')) {
              errorMessage = 'Vendor name or Email already exists';
            } else {
              errorMessage = errors.Email[0];
            }
          }
          // Check for VendorName errors
          else if (errors.VendorName && Array.isArray(errors.VendorName) && errors.VendorName.length > 0) {
            errorMessage = 'Vendor name already exists';
          }
          // Check for vendorName (camelCase)
          else if (errors.vendorName && Array.isArray(errors.vendorName) && errors.vendorName.length > 0) {
            errorMessage = 'Vendor name already exists';
          }
          // Check for contactEmail errors
          else if (errors.contactEmail && Array.isArray(errors.contactEmail) && errors.contactEmail.length > 0) {
            errorMessage = 'Email already exists';
          }
          // Check for generic error messages
          else {
            // Try to find any error message
            const errorKeys = Object.keys(errors);
            if (errorKeys.length > 0) {
              const firstError = errors[errorKeys[0]];
              if (Array.isArray(firstError) && firstError.length > 0) {
                const errorText = firstError[0].toLowerCase();
                if (errorText.includes('vendor name') && errorText.includes('email')) {
                  errorMessage = 'Vendor name or Email already exists';
                } else if (errorText.includes('vendor name')) {
                  errorMessage = 'Vendor name already exists';
                } else if (errorText.includes('email') || errorText.includes('contact email')) {
                  errorMessage = 'Email already exists';
                } else {
                  errorMessage = firstError[0];
                }
              }
            }
          }
        } else if (error?.error?.message) {
          // Check if error message contains vendor name or email
          const errorMsg = error.error.message.toLowerCase();
          if (errorMsg.includes('vendor name') && errorMsg.includes('email')) {
            errorMessage = 'Vendor name or Email already exists';
          } else if (errorMsg.includes('vendor name')) {
            errorMessage = 'Vendor name already exists';
          } else if (errorMsg.includes('email') || errorMsg.includes('contact email')) {
            errorMessage = 'Email already exists';
          } else {
            errorMessage = error.error.message;
          }
        }
        
        this.toastService.show(errorMessage, 'danger');
      }, complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  loadCountry() {
    this.countryService.getCountryDetails().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {

          this.countryDetails = reponse.data;
          console.log('country:', this.countryDetails);
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  loadVendorById(id:number)
  {
    this.vendorService.getVendorInfoById(id).subscribe({
      next:(response)=>{
        if(response.status && response.data)
        {
          this.vendorInfo=response.data;
          console.log('vendore Detail',this.vendorInfo);

          //for file handling
          const document=this.vendorInfo.documents;
          if(document&&document.length>0)
          {
             const extension = document[0].docName.split('.').pop()?.toLowerCase();
             const fileType=this.getFileTypeFromExtension(extension);
             const file=this.setFile(document[0].fileData,document[0].docName,fileType);
             this.previewFile = document[0].fileData.startsWith('data:')
             ? document[0].fileData
             : `data:${fileType};base64,${document[0].fileData}`;

             let reader = new FileReader();

            reader.onload = (e: any) => {
                this.previewFile = e.target.result;
            };
            reader.readAsDataURL(file);
            this.fileError=null;
            this.selectedFile=file;
          }


          if(this.vendorInfo.vendorDetails && this.vendorInfo.vendorDetails.length>0)
          {
            this.vendorDetail={...this.vendorInfo.vendorDetails[0]};
            this.vendorForm.patchValue({...this.vendorDetail, vendorName: this.vendorInfo.vendorDetails[0].legalName});
          }else{
            this.toastService.show("Please Select Valid Vendor",'danger');
            this.router.navigate(['/vendors']);
          }

        }else{
          this.toastService.show("Please Select Valid Vendore",'danger');
          this.router.navigate(['/vendors']);
        }

      },error:(error)=>{
        console.log('error',error);
        this.toastService.show("Something Went Wrong",'danger');
        this.router.navigate(['/vendors']);

      }
    })
  }

  private getFileTypeFromExtension(extension: string | undefined): string {
    if (!extension) return 'application/octet-stream';

    const mimeTypes: {[key: string]: string} = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      // Add more types as needed
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  setFile(fileData:string,fileName:string,type:string):File
  {
    const byteCharacters = atob(fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const fileBlob = new Blob([byteArray], { type });
    return new File([fileBlob], fileName, {type});
  }

}
