import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbToastModule} from "@ng-bootstrap/ng-bootstrap";
import { VendorService } from '../../service/vendor.service';
import { GetVendorsListRequest, VendorDetail } from '../../models/vendor';
import { CommonModule } from '@angular/common';
import { ApiResponse } from '../../models/role';
import { NavigationExtras, Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

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
        RouterModule,
        FormsModule
    ],
  templateUrl: './vendors.component.html',
  styleUrl: './vendors.component.scss'
})
export class VendorsComponent implements OnInit, OnDestroy {

  private readonly vendorService=inject(VendorService);
  private readonly router=inject(Router);
  public toastService=inject(ToastService);
  isLoading:boolean=false
  selectAll: boolean = false;
  vendorDetails:VendorDetail[]=[];
  allVendorDetails:VendorDetail[]=[]; // Store all vendors for filtering
  
  // Search
  searchText: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(){
    console.log('vendore Details');
  }

  ngOnInit(): void {
      this.setupSearchDebounce();
      this.loadVendoreDetails();
      console.log(this.vendorDetails);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged(), // Only trigger if value changed
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  loadVendoreDetails()
  {
    this.isLoading=true;
    
    // Build request payload with search filter
    const request: GetVendorsListRequest = {
      filter: this.buildFilter(),
      paging: {
        start: 0,
        length: 1000 // Large number to get all matching results
      }
    };
    
    this.vendorService.getVendorDetailsList(request).subscribe({
      next: (response) => {
        // Check if response has errors (e.g., "Vendor List Not Found")
        if (response.errors && response.errors.Vendor && response.errors.Vendor.length > 0) {
          // Handle "Vendor List Not Found" error gracefully
          this.vendorDetails = [];
          this.isLoading = false;
          return;
        }
        
        if (response.status && response.data && response.data.length > 0) {
          // Store all vendors for frontend filtering
          this.allVendorDetails = response.data;
          
          // Apply current search filter if any
          if (this.searchText && this.searchText.trim()) {
            this.performSearch(this.searchText);
          } else {
            // No search, show all active vendors
            this.vendorDetails = this.allVendorDetails.filter(f => f.isActive);
            this.sortByDate();
          }
          console.log('vendor:', this.vendorDetails);
        } else {
          // No data returned
          this.allVendorDetails = [];
          this.vendorDetails = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.log('error', error);
        // On error, set empty array
        this.vendorDetails = [];
        this.isLoading = false;
        this.toastService.showError(error);
      }
    });
  }

  buildFilter(): GetVendorsListRequest['filter'] {
    // Always fetch all vendors - filtering will be done on frontend
    return {};
  }

  performSearch(searchTerm: string): void {
    // Filter vendors on frontend based on search term
    const searchValue = searchTerm ? searchTerm.trim().toLowerCase() : '';
    
    if (!searchValue) {
      // If no search term, show all active vendors
      this.vendorDetails = this.allVendorDetails.filter(f => f.isActive);
      this.sortByDate();
      return;
    }
    
    // Filter vendors based on multiple fields
    this.vendorDetails = this.allVendorDetails.filter((vendor: VendorDetail) => {
      // Search in vendorName
      const matchesVendorName = vendor.vendorName?.toLowerCase().includes(searchValue);
      
      // Search in legalName
      const matchesLegalName = vendor.legalName?.toLowerCase().includes(searchValue);
      
      // Search in countryName
      const matchesCountryName = vendor.countryName?.toLowerCase().includes(searchValue);
      
      // Search in contactEmail
      const matchesContactEmail = vendor.contactEmail?.toLowerCase().includes(searchValue);
      
      // Search in taxId
      const matchesTaxId = vendor.taxId?.toLowerCase().includes(searchValue);
      
      // Search in sapId
      const matchesSapId = vendor.sapId?.toLowerCase().includes(searchValue);
      
      // Search in parentCompanyName
      const matchesParentCompany = vendor.parentCompanyName?.toLowerCase().includes(searchValue);
      
      // Search in contactPerson
      const matchesContactPerson = vendor.contactPerson?.toLowerCase().includes(searchValue);
      
      return matchesVendorName || matchesLegalName || matchesCountryName || 
             matchesContactEmail || matchesTaxId || matchesSapId || 
             matchesParentCompany || matchesContactPerson;
    }).filter(f => f.isActive); // Only show active vendors
    
    this.sortByDate();
  }

  onSearchChange(): void {
    // Emit search term to subject for debouncing
    this.searchSubject.next(this.searchText);
  }

  onSearchButtonClick(): void {
    // Trigger search immediately when button is clicked
    this.searchSubject.next(this.searchText);
  }

  clearSearch(): void {
    this.searchText = '';
    // Trigger search with empty term to reload all data
    this.searchSubject.next('');
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
    const confirmed = window.confirm(`Are you sure you want to delete the vendor "${vendor.legalName || vendor.vendorName}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    this.isLoading = true;
    this.vendorService.deleteVendor(vendor.id).subscribe({
      next: (response) => {
        if (response && response.status) {
          this.toastService.show('Vendor deleted successfully', 'success');
          // Refresh the vendor list with current search
          this.loadVendoreDetails();
        } else {
          this.toastService.show(response?.message || 'Failed to delete vendor', 'danger');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error deleting vendor:', error);
        this.toastService.showError(error);
        this.isLoading = false;
      }
    });
  }

}
