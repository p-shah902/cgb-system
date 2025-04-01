import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbDropdownModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../service/user.service';
import { UserDetails } from '../../models/user';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';
@Component({
  selector: 'app-usermanagement',
  standalone: true,
  imports: [CommonModule,NgbDropdownModule,NgbToastModule,RouterModule],
  templateUrl: './usermanagement.component.html',
  styleUrl: './usermanagement.component.scss'
})
export class UsermanagementComponent implements OnInit{

  private readonly userService=inject(UserService);
  private readonly router=inject(Router);
  public toastService=inject(ToastService);

  userDetails:UserDetails[]=[];
  isLoading:boolean=false

  ngOnInit(): void {
      this.loadUserDetails();
  }

  loadUserDetails(){
    this.userService.getUserDetailsList().subscribe({
      next: (response)=>{
        if(response.status && response.data)
        {
          this.userDetails=response.data;
          console.log('user details',this.userDetails);
        }
      },error:(error)=>{
        console.log('error',error);
      }
    })

    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
    }, 2000);
  }

  nevigate(){
    this.router.navigate(['/userdetails']);
  }

}
