import { Component, inject, Inject, OnInit } from '@angular/core';
import { NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { DictionaryService } from '../../service/dictionary.service';
import { DictionaryDetail, Item } from '../../models/dictionary';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../service/toast.service';
@Component({
  selector: 'app-dictionaries-list',
  standalone: true,
  imports: [
    NgbNavModule,
    NgbNavModule,
    CommonModule,
    RouterModule,
    NgbToastModule,
  ],
  templateUrl: './dictionaries-list.component.html',
  styleUrl: './dictionaries-list.component.scss',
})
export class DictionariesListComponent implements OnInit {
  active: string = 'top';

  private dictionaryService = inject(DictionaryService);
  private router = inject(Router);
  public toastService = inject(ToastService);

  dictionaryItem: Item[] = [];
  dictionaryDetail: DictionaryDetail[] = [];
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadDictionaryIteams();
  }

  loadDictionaryIteams() {
    this.dictionaryService.getDictionaryItemList().subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.dictionaryItem = response.data;
          console.log('Dictionary Item', this.dictionaryItem);
          if (this.dictionaryItem.length > 0) {
            const iteamName = this.dictionaryItem[0].itemName;
            this.loadDictionaryDetails(iteamName);
          }
        }
      },
      error: (error) => {
        console.log('error', error);
      },
    });
  }

  loadDictionaryDetails(itemName: string) {
    this.active = itemName;
    this.isLoading = true;
    this.dictionaryService.getDictionaryListByItem(itemName).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.dictionaryDetail = response.data;
          this.sortByDate();
          console.log('Dictionary Detail', this.dictionaryDetail);
        }
      },
      error: (error) => {
        console.log('error', error);
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
