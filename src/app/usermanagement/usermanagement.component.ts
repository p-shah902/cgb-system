import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbDropdownModule, NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../service/user.service';
import { UserDetails } from '../../models/user';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';
@Component({
  selector: 'app-usermanagement',
  standalone: true,
  imports: [CommonModule,NgbDropdownModule,NgbToastModule,RouterModule,NgbNavModule],
  templateUrl: './usermanagement.component.html',
  styleUrl: './usermanagement.component.scss'
})
export class UsermanagementComponent implements OnInit{

  private readonly userService=inject(UserService);
  private readonly router=inject(Router);
  public toastService=inject(ToastService);

  userDetails:UserDetails[]=[];
  isLoading:boolean=false;
  active=1

  ngOnInit(): void {
      this.loadUserDetails();
  }

  loadUserDetails(){
    this.isLoading=true;
    this.userService.getUserDetailsList().subscribe({
      next: (response)=>{
        if(response.status && response.data)
        {
          this.userDetails=response.data;
          this.sortByDate();
          console.log('user details',this.userDetails);
        }
      },error:(error)=>{
        console.log('error',error);
      },complete:()=>{
        this.isLoading=false;
      }
    })

  }

  nevigate(){
    this.router.navigate(['/userdetails']);
  }

  sortByDate(){
    this.userDetails.sort((a,b)=>{
      const dateA = new Date(a.modifiedDate || a.createdDate).getTime();
      const dateB = new Date(b.modifiedDate || b.createdDate).getTime();
      return dateB - dateA;
    })
  }

  getActiveUsers():UserDetails[]
  {
    return this.userDetails.filter(user => user.isActive === true);
  }

  getInActiveUsers():UserDetails[]
  {
    return this.userDetails.filter(user => user.isActive === false);
  }

}
