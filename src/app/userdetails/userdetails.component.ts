import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserDetails } from '../../models/user';
import { UserService } from '../../service/user.service';
import { DepartmentDetails } from '../../models/department';
import { Generalervice } from '../../service/general.service';
import { UserRole } from '../../models/role';
import { RoleService } from '../../service/role.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-userdetails',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule,CommonModule],
  templateUrl: './userdetails.component.html',
  styleUrl: './userdetails.component.scss',
})
export class UserdetailsComponent implements OnInit {
  userForm: FormGroup;
  userDetail: UserDetails;
  departments: DepartmentDetails[] = [];
  userRoles: UserRole[] = [];
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private departmentService: Generalervice,
    private roleService: RoleService
  ) {
    this.userForm = this.fb.group({
      id: [0],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(4)]],
      role: [null, Validators.required],
      dept: [null, Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      displayName:['', Validators.required],
      isActive: [true],
      isViewPaper: [false],
      isEditPaper: [false],
      isAssignRoles: [false],
      createdDate: [new Date().toISOString()],
      modifiedDate: [new Date().toISOString()],
      tempRoleId: [0],
      isTOPTUser: [true],
    });

    const formValues = this.userForm.value;
    this.userDetail = {
      ...formValues,
      password: formValues.password || '123456',
      createdDate: new Date(formValues.createdDate).toISOString(),
      modifiedDate: new Date(formValues.modifiedDate).toISOString(),
      roleId: formValues.role?.id || 0,
      roleName: formValues.role?.name || '',
      departmentId: formValues.dept?.id || 0,
      departmentName: formValues.dept?.displayName || ''
    };
  }

  ngOnInit(): void {
    this.loadDepartment();
    this.loadRole();  

    if (this.userDetail) {
      this.isEditMode = true;
      this.userForm.patchValue({
        ...this.userDetail,
        role: this.userRoles.find(role => role.id === this.userDetail?.roleId) || null,
        department: this.departments.find(dept => dept.id === this.userDetail?.departmentId) || null
      });
    }
  }

  addUserDetails(): void {
    if (this.userForm.valid) {
      
      this.mapFormValues();
      console.log('User Details:', this.userDetail);

      this.userService.upsertUser(this.userDetail).subscribe({
        next: (response) => {
          if (response.success === false) {
            console.log('Error Accured');
          }
        },
        error: (error) => {
          console.log('Error', error);
        },
      });
    } else {
      console.log('Form is invalid');
        Object.keys(this.userForm.controls).forEach((key) => {
        const control = this.userForm.get(key);
        if (control && control.invalid) {
          console.log(`Invalid field: ${key}`, control.errors);
        }
      });
      return;
    }
  }

  resetForm(): void {
    if (this.isEditMode && this.userDetail) {
      this.userForm.patchValue({
        ...this.userDetail,
        role: this.userRoles.find(role => role.id === this.userDetail?.roleId) || null,
        department: this.departments.find(dept => dept.id === this.userDetail?.departmentId) || null
      });
    } 
    else{
      this.userForm.reset({
        id: 0,
        role: this.userRoles.length > 0 ? this.userRoles[0] : null, 
        dept: this.departments.length > 0 ? this.departments[0] : null,
        isActive: true,
        isViewPaper: false,
        isEditPaper: false,
        isAssignRoles: false,
        isTOPTUser: true,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
      });
    }

    this.mapFormValues();
  }

  loadDepartment() {
    this.departmentService.getDepartMentDetails().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          
          this.departments = reponse.data;
          console.log('department:', this.departments);

          if (this.departments.length > 0) {
            this.userForm.patchValue({ dept: this.departments[0] });
          }
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

          if (this.userRoles.length > 0) {
            this.userForm.patchValue({ role: this.userRoles[0] });
          }
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
      password: formValues.password || '123456',
      createdDate: new Date(formValues.createdDate).toISOString(),
      modifiedDate: new Date(formValues.modifiedDate).toISOString(),
      roleId: formValues.role?.id || 0,
      roleName: formValues.role?.name || '',
      departmentId: formValues.dept?.id || 0,
      departmentName: formValues.dept?.displayName || ''
    };
  }
}
