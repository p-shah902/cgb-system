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
    // Build request payload with search filter
    const request: GetThresholdListRequest = {
      filter: this.buildFilter(),
      paging: {
        start: 0,
        length: 1000
      }
    };
    
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
          this.internalThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Internal');
          this.partnerThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Partner');
        } else {
          // No data returned
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
    const filter: GetThresholdListRequest['filter'] = {};
    
    // If search text exists, send it to thresholdName field (assuming backend handles general search)
    if (this.searchText && this.searchText.trim()) {
      filter.thresholdName = this.searchText.trim();
    }
    
    return filter;
  }

  performSearch(searchTerm: string): void {
    this.isSearching = true;
    
    // Build request payload with search filter
    const request: GetThresholdListRequest = {
      filter: searchTerm ? { thresholdName: searchTerm.trim() } : {},
      paging: {
        start: 0,
        length: 1000
      }
    };
    
    this.thresholdService.getThresholdList(request).subscribe(
      (response: any) => {
        // Check if response has errors (e.g., "Threshold List Not Found")
        if (response.errors && response.errors.Threshold && response.errors.Threshold.length > 0) {
          // Handle "Threshold List Not Found" error gracefully
          this.internalThresholds = [];
          this.partnerThresholds = [];
          this.isSearching = false;
          return;
        }
        
        if (response && response.data && response.data.length > 0) {
          this.internalThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Internal');
          this.partnerThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Partner');
        } else {
          // No data returned
          this.internalThresholds = [];
          this.partnerThresholds = [];
        }
        this.isSearching = false;
      },
      (error) => {
        console.error('Error loading thresholds:', error);
        // On error, set empty arrays
        this.internalThresholds = [];
        this.partnerThresholds = [];
        this.isSearching = false;
        this.toastService.showError(error);
      }
    );
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
