import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../service/user.service';
import { UserDetails } from '../../models/user';
@Component({
  selector: 'app-usermanagement',
  standalone: true,
  imports: [CommonModule,NgbDropdownModule],
  templateUrl: './usermanagement.component.html',
  styleUrl: './usermanagement.component.scss'
})
export class UsermanagementComponent implements OnInit{

  private readonly userService=inject(UserService);

  userDetails:UserDetails[]=[];

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
  }

}
