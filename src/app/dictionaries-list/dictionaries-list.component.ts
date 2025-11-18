import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { DictionaryService } from '../../service/dictionary.service';
import { DictionaryDetail, GetDictionaryItemsListRequest, GetDictionaryListByItemNameRequest, Item } from '../../models/dictionary';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, forkJoin } from 'rxjs';
@Component({
  selector: 'app-dictionaries-list',
  standalone: true,
  imports: [
    NgbNavModule,
    NgbNavModule,
    CommonModule,
    RouterModule,
    NgbToastModule,
    FormsModule,
  ],
  templateUrl: './dictionaries-list.component.html',
  styleUrl: './dictionaries-list.component.scss',
})
export class DictionariesListComponent implements OnInit, OnDestroy {
  active: string = 'top';

  private dictionaryService = inject(DictionaryService);
  private router = inject(Router);
  public toastService = inject(ToastService);

  dictionaryItem: Item[] = [];
  dictionaryDetail: DictionaryDetail[] = [];
  isLoading: boolean = false;
  
  // Search
  searchText: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  totalItems: number = 0;
  currentItemName: string = '';

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadDictionaryIteams();
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

  loadDictionaryIteams() {
    this.isLoading = true;
    
    // Build request payload with search filter
    const request: GetDictionaryItemsListRequest = {
      filter: this.buildFilter(),
      paging: {
        start: 0,
        length: 1000
      }
    };
    
    this.dictionaryService.getDictionaryItemList(request).subscribe({
      next: (response) => {
        // Check if response has errors (e.g., "Dictionary List Not Found")
        if (response.errors && response.errors.Dictionary && response.errors.Dictionary.length > 0) {
          // Handle "Dictionary List Not Found" error gracefully
          this.dictionaryItem = [];
          this.isLoading = false;
          return;
        }
        
        if (response.status && response.data && response.data.length > 0) {
          // Filter out "Subsector" from the dictionary items list
          this.dictionaryItem = response.data.filter(item => item.itemName !== 'Subsector');
          console.log('Dictionary Item', this.dictionaryItem);
          if (this.dictionaryItem.length > 0) {
            const iteamName = this.dictionaryItem[0].itemName;
            this.loadDictionaryDetails(iteamName);
          }
        } else {
          // No data returned
          this.dictionaryItem = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.log('error', error);
        // On error, set empty array
        this.dictionaryItem = [];
        this.isLoading = false;
        this.toastService.showError(error);
      },
    });
  }

  buildFilter(): GetDictionaryItemsListRequest['filter'] {
    const filter: GetDictionaryItemsListRequest['filter'] = {};
    
    // If search text exists, send it to itemNames field
    if (this.searchText && this.searchText.trim()) {
      filter.itemNames = this.searchText.trim();
    }
    
    return filter;
  }

  performSearch(searchTerm: string): void {
    this.isLoading = true;
    
    // Build request payload with search filter
    const request: GetDictionaryItemsListRequest = {
      filter: searchTerm ? { itemNames: searchTerm.trim() } : {},
      paging: {
        start: 0,
        length: 1000
      }
    };
    
    this.dictionaryService.getDictionaryItemList(request).subscribe({
      next: (response) => {
        // Check if response has errors (e.g., "Dictionary List Not Found")
        if (response.errors && response.errors.Dictionary && response.errors.Dictionary.length > 0) {
          // Handle "Dictionary List Not Found" error gracefully
          this.dictionaryItem = [];
          this.dictionaryDetail = [];
          this.isLoading = false;
          return;
        }
        
        if (response.status && response.data && response.data.length > 0) {
          // Filter out "Subsector" from the dictionary items list
          this.dictionaryItem = response.data.filter(item => item.itemName !== 'Subsector');
          if (this.dictionaryItem.length > 0) {
            const iteamName = this.dictionaryItem[0].itemName;
            this.loadDictionaryDetails(iteamName);
          } else {
            this.dictionaryDetail = [];
          }
        } else {
          // No data returned
          this.dictionaryItem = [];
          this.dictionaryDetail = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.log('error', error);
        // On error, set empty arrays
        this.dictionaryItem = [];
        this.dictionaryDetail = [];
        this.isLoading = false;
        this.toastService.showError(error);
      },
    });
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

  loadDictionaryDetails(itemName: string) {
    this.active = itemName;
    this.currentItemName = itemName;
    this.currentPage = 1; // Reset to first page when loading new item
    this.getDictionaryDetails();
  }
  
  getDictionaryDetails() {
    if (!this.currentItemName) return;
    
    this.isLoading = true;
    
    // Calculate start index based on current page
    const start = (this.currentPage - 1) * this.itemsPerPage;
    
    // Build request for paginated data
    const dataRequest: GetDictionaryListByItemNameRequest = {
      filter: {
        itemNames: this.currentItemName
      },
      paging: {
        start: start,
        length: this.itemsPerPage
      }
    };
    
    // Build request for total count
    const countRequest: GetDictionaryListByItemNameRequest = {
      filter: {
        itemNames: this.currentItemName
      },
      paging: {
        start: 0,
        length: 10000 // Large number to get all records for counting
      }
    };
    
    // Make parallel requests: one for paginated data, one for total count
    forkJoin({
      data: this.dictionaryService.getDictionaryListByItem(this.currentItemName, dataRequest),
      count: this.dictionaryService.getDictionaryListByItem(this.currentItemName, countRequest)
    }).subscribe({
      next: ({ data, count }) => {
        // Check if response has errors
        if (data.errors && data.errors.Dictionary && data.errors.Dictionary.length > 0) {
          // Handle error gracefully
          this.dictionaryDetail = [];
          this.totalItems = 0;
          this.isLoading = false;
          return;
        }
        
        if (data.status && data.data) {
          this.dictionaryDetail = data.data;
          this.sortByDate();
          console.log('Dictionary Detail', this.dictionaryDetail);
        } else {
          this.dictionaryDetail = [];
        }
        
        // Get total count
        if (count.status && count.data) {
          this.totalItems = count.totalCount || count.recordsTotal || count.recordsFiltered || count.data.length;
        } else {
          this.totalItems = this.dictionaryDetail.length;
        }
      },
      error: (error) => {
        console.log('error', error);
        // On error, set empty array
        this.dictionaryDetail = [];
        this.totalItems = 0;
        this.toastService.showError(error);
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  nevigate() {
    this.router.navigate(['/dictionaries-edit', this.active]);
  }

  sortByDate() {
    this.dictionaryDetail.sort((a, b) => {
      const dateA = new Date(a.modifiedDate || a.createdDate).getTime();
      const dateB = new Date(b.modifiedDate || b.createdDate).getTime();
      return dateB - dateA;
    });
  }
  
  // Pagination methods
  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
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
  
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.getDictionaryDetails();
    }
  }
  
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.getDictionaryDetails();
    }
  }
  
  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.getDictionaryDetails();
    }
  }
  
  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
    this.getDictionaryDetails();
  }
  
  getStartItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }
  
  getEndItem(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.totalItems ? this.totalItems : end;
  }
}
