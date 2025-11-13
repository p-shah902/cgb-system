import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { DictionaryService } from '../../service/dictionary.service';
import { DictionaryDetail, GetDictionaryItemsListRequest, Item } from '../../models/dictionary';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
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
          this.dictionaryItem = response.data;
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
          this.dictionaryItem = response.data;
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
    this.isLoading = true;
    this.dictionaryService.getDictionaryListByItem(itemName).subscribe({
      next: (response) => {
        // Check if response has errors
        if (response.errors && response.errors.Dictionary && response.errors.Dictionary.length > 0) {
          // Handle error gracefully
          this.dictionaryDetail = [];
          return;
        }
        
        if (response.status && response.data && response.data.length > 0) {
          this.dictionaryDetail = response.data;
          this.sortByDate();
          console.log('Dictionary Detail', this.dictionaryDetail);
        } else {
          // No data returned
          this.dictionaryDetail = [];
        }
      },
      error: (error) => {
        console.log('error', error);
        // On error, set empty array
        this.dictionaryDetail = [];
        this.toastService.showError(error);
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
}
