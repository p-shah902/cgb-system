import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbDropdownModule, NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../service/user.service';
import { GetUsersListRequest, UserDetails } from '../../models/user';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-usermanagement',
  standalone: true,
  imports: [CommonModule,NgbToastModule,RouterModule,NgbNavModule,FormsModule,NgbDropdownModule],
  templateUrl: './usermanagement.component.html',
  styleUrl: './usermanagement.component.scss'
})
export class UsermanagementComponent implements OnInit{
  private readonly userService=inject(UserService);
  private readonly router=inject(Router);
  public toastService=inject(ToastService);

  userDetails:UserDetails[]=[];
  allUserDetails:UserDetails[]=[]; // Store all users for filtering
  isLoading:boolean=false;
  active=1;
  
  // Search and Pagination
  searchText: string = '';
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  paginatedUserDetails: UserDetails[] = [];

  ngOnInit(): void {
      this.loadUserDetails();
  }

  loadUserDetails(){
    this.isLoading=true;
    
    // Build request payload - no filters, just pagination
    const request: GetUsersListRequest = {
      filter: {},
      paging: {
        start: (this.currentPage - 1) * this.itemsPerPage,
        length: this.itemsPerPage
      }
    };
    
    this.userService.getUserDetailsList(request).subscribe({
      next: (response)=>{
        if(response.status && response.data)
        {
          this.allUserDetails = response.data;
          this.userDetails = response.data;
          this.totalItems = response.data.length;
          this.applyFilters(); // Apply search filter
          console.log('user details',this.userDetails);
        }
      },error:(error)=>{
        console.log('error',error);
      },complete:()=>{
        this.isLoading=false;
      }
    })

  }
  
  applyFilters(): void {
    let filtered = [...this.allUserDetails];
    
    // Apply search filter - search across all fields
    if (this.searchText && this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(user => {
        return (
          (user.displayName?.toLowerCase().includes(searchLower)) ||
          (user.email?.toLowerCase().includes(searchLower)) ||
          (user.roleName?.toLowerCase().includes(searchLower)) ||
          (user.departmentName?.toLowerCase().includes(searchLower)) ||
          (user.id?.toString().includes(searchLower))
        );
      });
    }
    
    this.userDetails = filtered;
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
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }
  
  onTabChange(): void {
    this.currentPage = 1; // Reset to first page when switching tabs
  }
  
  clearSearch(): void {
    this.searchText = '';
    this.currentPage = 1;
    this.applyFilters();
  }
  
  goToPage(page: number, isActiveTab: boolean = true): void {
    const totalPages = isActiveTab ? this.getTotalPagesForActive() : this.getTotalPagesForInactive();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
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
