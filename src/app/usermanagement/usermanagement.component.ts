import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgbDropdownModule, NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../service/user.service';
import { GetUsersListRequest, UserDetails } from '../../models/user';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
@Component({
  selector: 'app-usermanagement',
  standalone: true,
  imports: [CommonModule,NgbToastModule,RouterModule,NgbNavModule,FormsModule,NgbDropdownModule],
  templateUrl: './usermanagement.component.html',
  styleUrl: './usermanagement.component.scss'
})
export class UsermanagementComponent implements OnInit, OnDestroy{
  private readonly userService=inject(UserService);
  private readonly router=inject(Router);
  public toastService=inject(ToastService);

  userDetails:UserDetails[]=[];
  allUserDetails:UserDetails[]=[]; // Store all users for filtering
  isLoading:boolean=false;
  active=1;
  
  // Search and Pagination
  searchText: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  paginatedUserDetails: UserDetails[] = [];

  ngOnInit(): void {
      this.setupSearchDebounce();
      this.loadUserDetails();
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

  loadUserDetails(){
    this.isLoading=true;
    
    // Build request payload with search filter
    // Fetch all matching results (large page size) for frontend pagination
    const request: GetUsersListRequest = {
      filter: this.buildFilter(),
      paging: {
        start: 0,
        length: 1000 // Large number to get all matching results for frontend pagination
      }
    };
    
    this.userService.getUserDetailsList(request).subscribe({
      next: (response)=>{
        // Check if response has errors (e.g., "User List Not Found")
        if (response.errors && response.errors.User && response.errors.User.length > 0) {
          // Handle "User List Not Found" error gracefully
          this.allUserDetails = [];
          this.userDetails = [];
          this.totalItems = 0;
          this.isLoading = false;
          return;
        }
        
        if(response.status && response.data && response.data.length > 0)
        {
          this.allUserDetails = response.data;
          this.userDetails = response.data;
          this.totalItems = response.data.length;
          console.log('user details',this.userDetails);
        } else {
          // No data returned
          this.allUserDetails = [];
          this.userDetails = [];
          this.totalItems = 0;
        }
        this.isLoading = false;
      },error:(error)=>{
        console.log('error',error);
        // On error, set empty arrays
        this.allUserDetails = [];
        this.userDetails = [];
        this.totalItems = 0;
        this.isLoading = false;
        this.toastService.showError(error);
      }
    })

  }

  buildFilter(): GetUsersListRequest['filter'] {
    const filter: GetUsersListRequest['filter'] = {};
    
    // If search text exists, send it to username field (assuming backend handles general search)
    // You can adjust this based on your API's search implementation
    if (this.searchText && this.searchText.trim()) {
      filter.username = this.searchText.trim();
    }
    
    return filter;
  }

  performSearch(searchTerm: string): void {
    this.currentPage = 1; // Reset to first page on search
    this.isLoading = true;
    
    // Build request payload with search filter
    // Fetch all matching results (large page size) for frontend pagination
    const request: GetUsersListRequest = {
      filter: searchTerm ? { username: searchTerm.trim() } : {},
      paging: {
        start: 0,
        length: 1000 // Large number to get all matching results for frontend pagination
      }
    };
    
    this.userService.getUserDetailsList(request).subscribe({
      next: (response)=>{
        // Check if response has errors (e.g., "User List Not Found")
        if (response.errors && response.errors.User && response.errors.User.length > 0) {
          // Handle "User List Not Found" error gracefully
          this.allUserDetails = [];
          this.userDetails = [];
          this.totalItems = 0;
          this.isLoading = false;
          return;
        }
        
        if(response.status && response.data && response.data.length > 0)
        {
          this.allUserDetails = response.data;
          this.userDetails = response.data;
          this.totalItems = response.data.length;
        } else {
          // No data returned
          this.allUserDetails = [];
          this.userDetails = [];
          this.totalItems = 0;
        }
        this.isLoading = false;
      },error:(error)=>{
        console.log('error',error);
        // On error, set empty arrays
        this.allUserDetails = [];
        this.userDetails = [];
        this.totalItems = 0;
        this.isLoading = false;
        this.toastService.showError(error);
      }
    });
  }
  
  applyPagination(): void {
    // Pagination is handled separately for active/inactive in the template
    // This method is kept for consistency but pagination happens in getActiveUsers/getInActiveUsers
  }
  
  getPaginatedActiveUsers(): UserDetails[] {
    const activeUsers = this.userDetails.filter(user => user.isActive === true);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return activeUsers.slice(start, end);
  }
  
  getPaginatedInactiveUsers(): UserDetails[] {
    const inactiveUsers = this.userDetails.filter(user => user.isActive === false);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return inactiveUsers.slice(start, end);
  }
  
  getTotalPagesForActive(): number {
    return Math.ceil(this.getTotalActiveUsers() / this.itemsPerPage);
  }
  
  getTotalPagesForInactive(): number {
    return Math.ceil(this.getTotalInactiveUsers() / this.itemsPerPage);
  }
  
  onSearchChange(): void {
    // Emit search term to subject for debouncing
    this.searchSubject.next(this.searchText);
  }

  onSearchButtonClick(): void {
    // Trigger search immediately when button is clicked
    this.searchSubject.next(this.searchText);
  }
  
  onTabChange(): void {
    this.currentPage = 1; // Reset to first page when switching tabs
    // Reload data when switching tabs
    this.loadUserDetails();
  }
  
  clearSearch(): void {
    this.searchText = '';
    this.currentPage = 1;
    // Trigger search with empty term to reload all data
    this.searchSubject.next('');
  }
  
  goToPage(page: number, isActiveTab: boolean = true): void {
    const totalPages = isActiveTab ? this.getTotalPagesForActive() : this.getTotalPagesForInactive();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      // Reload data with current search and new page
      this.loadUserDetails();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  
  nextPage(isActiveTab: boolean = true): void {
    const totalPages = isActiveTab ? this.getTotalPagesForActive() : this.getTotalPagesForInactive();
    if (this.currentPage < totalPages) {
      this.goToPage(this.currentPage + 1, isActiveTab);
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1, this.active === 1);
    }
  }
  
  getPageNumbers(isActiveTab: boolean = true): number[] {
    const totalPages = isActiveTab ? this.getTotalPagesForActive() : this.getTotalPagesForInactive();
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
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
    return this.getPaginatedActiveUsers();
  }

  getInActiveUsers():UserDetails[]
  {
    return this.getPaginatedInactiveUsers();
  }
  
  getTotalActiveUsers(): number {
    return this.userDetails.filter(user => user.isActive === true).length;
  }
  
  getTotalInactiveUsers(): number {
    return this.userDetails.filter(user => user.isActive === false).length;
  }

}
