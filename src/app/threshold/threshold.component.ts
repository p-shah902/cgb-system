import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ThresholdService } from '../../service/threshold.service';
import { GetThresholdListRequest } from '../../models/threshold';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

@Component({
  selector: 'app-threshold',
  standalone: true,
  imports: [NgbNavModule, NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbToastModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './threshold.component.html',
  styleUrl: './threshold.component.scss'
})
export class ThresholdComponent implements OnInit, OnDestroy {
  public toastService = inject(ToastService);
  active = 1;
  internalThresholds: any[] = [];
  partnerThresholds: any[] = [];
  allInternalThresholds: any[] = []; // Store all thresholds for filtering
  allPartnerThresholds: any[] = []; // Store all thresholds for filtering
  isLoading: boolean = false;
  isSearching: boolean = false; // Loading state for search only
  
  // Search
  searchText: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private router: Router, private thresholdService: ThresholdService) { }

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadThresholds();
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

  // Load internal and partner thresholds from the API
  loadThresholds(): void {
    // Build request payload with search filter - ensure length is never 0
    const request: GetThresholdListRequest = {
      filter: this.buildFilter(),
      paging: {
        start: 0,
        length: 1000  // Always ensure length is never 0
      }
    };
    
    // Ensure paging is always present with valid values
    if (!request.paging || request.paging.length === 0) {
      request.paging = {
        start: 0,
        length: 1000
      };
    }
    
    this.thresholdService.getThresholdList(request).subscribe(
      (response: any) => {
        // Check if response has errors (e.g., "Threshold List Not Found")
        if (response.errors && response.errors.Threshold && response.errors.Threshold.length > 0) {
          // Handle "Threshold List Not Found" error gracefully
          this.internalThresholds = [];
          this.partnerThresholds = [];
          return;
        }
        
        if (response && response.data && response.data.length > 0) {
          // Store all thresholds for frontend filtering
          this.allInternalThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Internal');
          this.allPartnerThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Partner');
          
          // Apply current search filter if any
          if (this.searchText && this.searchText.trim()) {
            this.performSearch(this.searchText);
          } else {
            // No search, show all
            this.internalThresholds = [...this.allInternalThresholds];
            this.partnerThresholds = [...this.allPartnerThresholds];
          }
        } else {
          // No data returned
          this.allInternalThresholds = [];
          this.allPartnerThresholds = [];
          this.internalThresholds = [];
          this.partnerThresholds = [];
        }
      },
      (error) => {
        console.error('Error loading thresholds:', error);
        // On error, set empty arrays
        this.internalThresholds = [];
        this.partnerThresholds = [];
        this.toastService.showError(error);
      }
    );
  }

  buildFilter(): GetThresholdListRequest['filter'] {
    // Always fetch all thresholds - filtering will be done on frontend
    return {};
  }

  performSearch(searchTerm: string): void {
    this.isSearching = true;
    
    // Filter thresholds on frontend based on search term
    const searchValue = searchTerm ? searchTerm.trim().toLowerCase() : '';
    
    if (!searchValue) {
      // If no search term, show all thresholds
      this.internalThresholds = [...this.allInternalThresholds];
      this.partnerThresholds = [...this.allPartnerThresholds];
      this.isSearching = false;
      return;
    }
    
    // Filter internal thresholds
    this.internalThresholds = this.allInternalThresholds.filter((threshold: any) => {
      // Search in thresholdName
      const matchesName = threshold.thresholdName?.toLowerCase().includes(searchValue);
      
      // Search in paperType (handle both string and array)
      let matchesPaperType = false;
      if (threshold.paperType) {
        if (Array.isArray(threshold.paperType)) {
          matchesPaperType = threshold.paperType.some((pt: string) => 
            pt?.toLowerCase().includes(searchValue)
          );
        } else {
          matchesPaperType = threshold.paperType.toLowerCase().includes(searchValue);
        }
      }
      
      // Search in sourcingTypeName
      const matchesSourcingType = threshold.sourcingTypeName?.toLowerCase().includes(searchValue);
      
      return matchesName || matchesPaperType || matchesSourcingType;
    });
    
    // Filter partner thresholds
    this.partnerThresholds = this.allPartnerThresholds.filter((threshold: any) => {
      // Search in thresholdName
      const matchesName = threshold.thresholdName?.toLowerCase().includes(searchValue);
      
      // Search in paperType (handle both string and array)
      let matchesPaperType = false;
      if (threshold.paperType) {
        if (Array.isArray(threshold.paperType)) {
          matchesPaperType = threshold.paperType.some((pt: string) => 
            pt?.toLowerCase().includes(searchValue)
          );
        } else {
          matchesPaperType = threshold.paperType.toLowerCase().includes(searchValue);
        }
      }
      
      // Search in sourcingTypeName
      const matchesSourcingType = threshold.sourcingTypeName?.toLowerCase().includes(searchValue);
      
      return matchesName || matchesPaperType || matchesSourcingType;
    });
    
    this.isSearching = false;
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

  navigateToThreshold(): void {
    const type = this.active === 1 ? 'internal' : 'partner';
    this.router.navigate(['/threshold-add', type]);
  }

  deleteThreshold(id: number) {
    this.thresholdService.deleteThresholdDetailsById(id).subscribe({
      next: (response) => {
        if (response.status) {
          this.toastService.show("Threshold deleted successfully", 'success');
          this.loadThresholds(); // Reload with current search
        }
      },
      error: (error) => {
        console.log('Error:', error);
        this.toastService.showError(error);
      }
    });
  }

  // Helper method to get sourcing type name by ID
  getSourcingTypeName(id: number): string {
    const sourcingTypeMap: { [key: number]: string } = {
      1: 'Single Source',
      2: 'Sole Source',
      3: 'Competitive Bid'
      // Add more mappings as needed
    };
    return sourcingTypeMap[id] || `Unknown (${id})`;
  }

  // Helper method to get multiple sourcing type names by IDs
  getSourcingTypeNames(ids: number[]): string[] {
    return ids.map(id => this.getSourcingTypeName(id));
  }

  // Helper method to check if value is array
  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}
