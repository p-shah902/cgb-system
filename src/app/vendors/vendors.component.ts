import { Component, inject, Inject, OnInit } from '@angular/core';
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbToastModule} from "@ng-bootstrap/ng-bootstrap";
import { VendorService } from '../../service/vendor.service';
import { VendorDetail } from '../../models/vendor';
import { CommonModule } from '@angular/common';
import { ApiResponse } from '../../models/role';
import { NavigationExtras, Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';

@Component({
  selector: 'app-vendors',
  standalone: true,
    imports: [
        NgbDropdown,
        NgbDropdownItem,
        NgbDropdownMenu,
        NgbDropdownToggle,
        CommonModule,
        NgbToastModule,
        RouterModule
    ],
  templateUrl: './vendors.component.html',
  styleUrl: './vendors.component.scss'
})
export class VendorsComponent implements OnInit {

  private readonly vendorService=inject(VendorService);
  private readonly router=inject(Router);
  public toastService=inject(ToastService);
  isLoading:boolean=false
  selectAll: boolean = false;
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
    this.isLoading=true;
    this.vendorService.getVendorDetailsList().subscribe({
      next: (reponse) => {
        if (reponse.status && reponse.data) {
          
          this.vendorDetails = reponse.data;
          this.sortByDate();
          console.log('vendor:', this.vendorDetails);
        }
      },
      error: (error) => {
        console.log('error', error);
      },complete:()=>{
        this.isLoading=false;
      }
    });
    
  }

  nevigate(){
    this.router.navigate(['/vendor-detail']);
  }

  sortByDate(){
    this.vendorDetails.sort((a,b)=>{
      const dateA = new Date(a.modifiedDate || a.createdDate).getTime();
      const dateB = new Date(b.modifiedDate || b.createdDate).getTime();
      return dateB - dateA;
    })
  }

  deleteVendor(vendor: VendorDetail, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete the vendor "${vendor.legalName}"? This action cannot be undone.`);
    
    if (!confirmed) {
      return;
    }

    this.isLoading = true;
    this.vendorService.deleteVendor(vendor.id).subscribe({
      next: (response) => {
        if (response && response.status) {
          this.toastService.show('Vendor deleted successfully', 'success');
          // Refresh the vendor list
          this.loadVendoreDetails();
        } else {
          this.toastService.show(response?.message || 'Failed to delete vendor', 'danger');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error deleting vendor:', error);
        this.toastService.show('An error occurred while deleting the vendor', 'danger');
        this.isLoading = false;
      }
    });
  }

}
