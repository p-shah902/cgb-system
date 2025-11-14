import {Component, OnInit} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {UserDetails} from '../../models/user';
import {UserService} from '../../service/user.service';
import {DepartmentDetails} from '../../models/department';
import {Generalervice} from '../../service/general.service';
import {UserRole} from '../../models/role';
import {RoleService} from '../../service/role.service';
import {CommonModule} from '@angular/common';
import {NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from '../../service/toast.service';
import {ActivatedRoute, Router} from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-userdetails',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, NgbToastModule],
  templateUrl: './userdetails.component.html',
  styleUrl: './userdetails.component.scss',
})
export class UserdetailsComponent implements OnInit {
  userForm: FormGroup;
  userDetail: UserDetails;
  editUserDetail:UserDetails|null=null;
  departments: DepartmentDetails[] = [];
  userRoles: UserRole[] = [];
  isEditMode = false;
  isSubmitting = false;
  psaOptions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private departmentService: Generalervice,
    private roleService: RoleService,
    public toastService: ToastService,
    private router: Router,
    private activateRoute:ActivatedRoute
  ) {
    this.userForm = this.fb.group({
      id: [0],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(4)]],
      roleId: [0, Validators.min(1)],
      departmentId: [0, Validators.min(1)],
      phone: ['', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]{7,15}$/)]],
      displayName: ['', Validators.required],
      isActive: [true],
      // isViewPaper: [false],
      // isEditPaper: [false],
      // isAssignRoles: [false],
      tempRoleId: [0],
      isTOPTUser: [true],
      commiteeType: [''],
      psa: [''],
    });

    const formValues = this.userForm.value;
    this.userDetail = {
      ...formValues,
      roleName: this.userRoles.find(role => role.id === formValues.roleId)?.name || '',
      departmentName: this.departments.find(dept => dept.id === formValues.departmentId)?.displayName || ''
    };
  }

  ngOnInit(): void {
    this.loadDepartment();
    this.loadRole();

    // Subscribe to role changes to clear committee fields when role is not Partner
    this.userForm.get('roleId')?.valueChanges.subscribe(roleId => {
      if (!this.isPartnerRole(roleId)) {
        this.userForm.patchValue({ commiteeType: '', psa: '' });
        this.psaOptions = [];
      }
    });

    // Subscribe to committee type changes to update PSA options
    this.userForm.get('commiteeType')?.valueChanges.subscribe(value => {
      this.updatePsaOptions(value);
      // Reset PSA when committee type changes
      this.userForm.patchValue({ psa: '' });
    });

    this.activateRoute.params.subscribe(params => {
      const idParam=params['id'];

      if (idParam) {
        const id = Number(idParam);

        if (isNaN(id)) {
          this.toastService.show('Invalid User ID', 'danger');
          this.router.navigate(['/usermanagement']);
          return;
        }

        this.isEditMode=true;
        this.loadUserById(id);
      }

    });
  }

  addUserDetails(): void {
    if (this.userForm.valid) {

      if (this.isSubmitting) return;
      this.mapFormValues();
      console.log('User Details:', this.userDetail);
      this.isSubmitting = true;
      this.userService.upsertUser(this.userDetail).subscribe({
        next: (response) => {
          if (response&&response.status) {
            if(this.isEditMode&&this.editUserDetail)
            {
              this.toastService.show('User Updated Successfully','success');
            }
            else{
              this.toastService.show('User Addded Successfully','success');
            }
            this.router.navigate(['/usermanagement']);

          }
          else{
            this.toastService.show('Something Went Wrong','warning');
          }
        },
        error: (error) => {
          console.log('Error', error);
          this.toastService.show('Error Occured', 'danger');
        }, complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      console.log('Form is invalid');
      const errorMessage = this.getValidationErrorMessage();
      this.toastService.show(errorMessage, 'danger');
      Object.keys(this.userForm.controls).forEach((key) => {
        const control = this.userForm.get(key);
        if (control && control.invalid) {
          console.log(`Invalid field: ${key}`, control.errors);
        }
      });
      return;
    }

    this.resetForm();
  }

  resetForm(): void {

    if(this.isEditMode&&this.editUserDetail)
    {
      this.userForm.patchValue({...this.editUserDetail});
      // Update PSA options based on committee type when editing
      if (this.editUserDetail.commiteeType) {
        this.updatePsaOptions(this.editUserDetail.commiteeType);
      }
    }else{
      this.userForm.reset({
        id: 0,
        roleId: 0,
        departmentId: 0,
        isActive: true,
        // isViewPaper: false,
        // isEditPaper: false,
        // isAssignRoles: false,
        isTOPTUser: true,
        commiteeType: '',
        psa: '',
      });
      this.psaOptions = [];
    }
    this.mapFormValues();
  }

  loadDepartment() {
    this.departmentService.getDepartMentDetails().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {

          this.departments = reponse.data;
          console.log('department:', this.departments);
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  loadRole() {
    this.roleService.getUserRolesList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {

          this.userRoles = reponse.data;
          console.log('user roles:', this.userRoles);
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  private mapFormValues(): void {
    const formValues = this.userForm.value;
    this.userDetail = {
      ...formValues,
      roleName: this.userRoles.find(role => role.id === Number(formValues.roleId))?.name || '',
      departmentName: this.departments.find(dept => dept.id === Number(formValues.departmentId))?.displayName || ''
    };
  }


  loadUserById(id:number)
  {
    this.userService.getUserInfoById(id).subscribe({
      next:(response)=>{
        if(response.status && response.data)
        {
          this.editUserDetail=response.data[0];
          console.log('User Detail',this.editUserDetail);

          if(this.editUserDetail)
          {
            this.userForm.patchValue({...this.editUserDetail});
            // Update PSA options based on committee type when loading user
            if (this.editUserDetail.commiteeType) {
              this.updatePsaOptions(this.editUserDetail.commiteeType);
            }
          }else{
            this.toastService.show("Please Select Valid User",'danger');
            this.router.navigate(['/usermanagement']);
          }

        }else{
          this.toastService.show("Please Select Valid User",'danger');
          this.router.navigate(['/usermanagement']);
        }

      },error:(error)=>{
        console.log('error',error);
        this.toastService.show("Something Went Wrong",'danger');
        this.router.navigate(['/usermanagement']);

      }
    })
  }

  isPartnerRole(roleId: number | null | undefined): boolean {
    // Handle undefined, null, or zero values
    if (roleId === null || roleId === undefined || roleId === 0) {
      return false;
    }
    // Check if userRoles is loaded
    if (!this.userRoles || this.userRoles.length === 0) {
      return false;
    }
    const role = this.userRoles.find(r => r.id === Number(roleId));
    return role?.name?.toLowerCase() === 'partner';
  }

  get isPartnerRoleSelected(): boolean {
    const roleId = this.userForm.get('roleId')?.value;
    return this.isPartnerRole(roleId);
  }

  private updatePsaOptions(commiteeType: string): void {
    if (commiteeType === '1st Commitee') {
      this.psaOptions = ['CMC', 'SDCC', 'SCP Co CC', 'BTC CC'];
    } else if (commiteeType === '2nd Commitee') {
      this.psaOptions = ['SC', 'SDMC', 'SCP Board'];
    } else {
      this.psaOptions = [];
    }
  }

  private getValidationErrorMessage(): string {
    const controls = this.userForm.controls;

    // Check email field
    if (controls['email'].invalid) {
      if (controls['email'].errors?.['required']) {
        return 'Email address is required';
      }
      if (controls['email'].errors?.['email']) {
        return 'Please enter a valid email address';
      }
    }

    // Check phone field
    if (controls['phone'].invalid) {
      if (controls['phone'].errors?.['required']) {
        return 'Phone number is required';
      }
      if (controls['phone'].errors?.['pattern']) {
        return 'Please enter a valid phone number';
      }
    }

    // Check displayName field
    if (controls['displayName'].invalid) {
      if (controls['displayName'].errors?.['required']) {
        return 'Full name is required';
      }
    }

    // Check password field
    if (controls['password'].invalid) {
      if (controls['password'].errors?.['minlength']) {
        return 'Password must be at least 4 characters long';
      }
    }

    // Check roleId field
    if (controls['roleId'].invalid) {
      if (controls['roleId'].errors?.['min']) {
        return 'Please select a role';
      }
    }

    // Check departmentId field
    if (controls['departmentId'].invalid) {
      if (controls['departmentId'].errors?.['min']) {
        return 'Please select a department';
      }
    }

    // Default fallback message
    return 'Please fill all required fields correctly';
  }

}
