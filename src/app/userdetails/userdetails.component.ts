import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserDetails } from '../../models/user';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-userdetails',
  standalone: true,
  imports: [FormsModule,ReactiveFormsModule],
  templateUrl: './userdetails.component.html',
  styleUrl: './userdetails.component.scss'
})
export class UserdetailsComponent {

  userForm: FormGroup;
  userDetail:UserDetails;


  constructor(private fb: FormBuilder,private userService:UserService){
    this.userForm = this.fb.group({
      id: [0],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(4)]],
      departmentId: [0, Validators.required],
      departmentName: ['', Validators.required],
      roleId: [0, Validators.required],
      roleName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      displayName: ['', Validators.required],
      isActive: [true],
      isViewPaper: [true],
      isEditPaper: [true],
      isAssignRoles: [true],
      createdDate: [new Date().toISOString()],
      modifiedDate: [new Date().toISOString()],
      tempRoleId: [0],
      isTOPTUser: [true]
    });

    const formValues = this.userForm.value;
      this.userDetail = { 
        ...formValues, 
        password: formValues.password || null, 
        createdDate: new Date(formValues.createdDate).toISOString(), 
        modifiedDate: new Date(formValues.modifiedDate).toISOString()
      };
  }

  addUserDetails():void
  {
    if (this.userForm.valid) {
      
      const formValues = this.userForm.value;
      this.userDetail = { 
        ...formValues, 
        password: formValues.password || null, 
        createdDate: new Date(formValues.createdDate).toISOString(), 
        modifiedDate: new Date(formValues.modifiedDate).toISOString()
      };
      console.log('User Details:', this.userDetail);

      this.userService.upsertUser(this.userDetail).subscribe({
        next:(response)=>{
          if(response.success===false)
          {
            console.log("Error Accured");
          }
        },error:(error)=>{
          console.log('Error',error);
        }
      })

    } else {
      console.log('Form is invalid');
    }

    this.resetForm();
  }

  resetForm(): void {
    this.userForm.reset({
      id: 0,
      isActive: true,
      isViewPaper: true,
      isEditPaper: true,
      isAssignRoles: true,
      isTOPTUser: true,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString()
    });

    const formValues = this.userForm.value;
      this.userDetail = { 
        ...formValues, 
        password: formValues.password || null, 
        createdDate: new Date(formValues.createdDate).toISOString(), 
        modifiedDate: new Date(formValues.modifiedDate).toISOString()
      };
  }
}


