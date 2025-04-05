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
      phone: ['', [Validators.required]],
      displayName: ['', Validators.required],
      isActive: [true],
      // isViewPaper: [false],
      // isEditPaper: [false],
      // isAssignRoles: [false],
      tempRoleId: [0],
      isTOPTUser: [true],
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
      this.toastService.show('Please Fill All Required Fields', 'danger');
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


}
