import { Component, inject, Inject, OnInit } from '@angular/core';
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle} from "@ng-bootstrap/ng-bootstrap";
import { VendorService } from '../../service/vendor.service';
import { VendorDetail } from '../../models/vendor';
import { CommonModule } from '@angular/common';
import { ApiResponse } from '../../models/role';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-vendors',
  standalone: true,
    imports: [
        NgbDropdown,
        NgbDropdownItem,
        NgbDropdownMenu,
        NgbDropdownToggle,
        CommonModule
    ],
  templateUrl: './vendors.component.html',
  styleUrl: './vendors.component.scss'
})
export class VendorsComponent implements OnInit {

  private readonly vendorService=inject(VendorService);

  vendorDetails:VendorDetail[]=[];

  constructor(){
    console.log('vendore Details');
  }


  ngOnInit(): void {
      this.loadVendoreDetails();
      console.log(this.vendorDetails);
  }

  loadVendoreDetails()
  {
    
    this.vendorService.getVendorDetailsList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          
          this.vendorDetails = reponse.data;
          console.log('vendor:', this.vendorDetails);
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
    console.log('vendore Details2');
  }

}
