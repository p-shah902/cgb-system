import {Component, inject, OnInit} from '@angular/core';
import {NgbDropdown, NgbDropdownMenu, NgbDropdownToggle} from '@ng-bootstrap/ng-bootstrap';
import {PaperConfig} from '../../models/paper';
import {PaperConfigService} from '../../service/paper/paper-config.service';
import {PaperFilter} from '../../models/general';
import {KeyValuePipe, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Select2} from 'ng-select2-component';

@Component({
  selector: 'app-paper-status',
  standalone: true,
  imports: [
    NgbDropdown,
    NgbDropdownMenu,
    NgbDropdownToggle,
    NgForOf,
    KeyValuePipe,
    FormsModule,
    NgIf
  ],
  templateUrl: './paper-status.component.html',
  styleUrl: './paper-status.component.scss'
})
export class PaperStatusComponent implements OnInit {
  paperList: PaperConfig[] = [];
  private paperService = inject(PaperConfigService);
  filter: PaperFilter;
  isDesc = false;
  aToZ: string = 'A Z';
  groupedPaper: { [key: string]: PaperConfig[] } = {
    'Registered': [],
    'Waiting for PDM': [],
    'Approved by PDM': [],
    'On Pre-CGB': [],
    'Approved by Pre-CGB': [],
    'On CGB': [],
    'Approved by CGB': [],
    'Approved': [],
  };
  statusData: { label: string, value: number }[] = [
    {label: 'Registered', value: 3},
    {label: 'Waiting for PDM', value: 4},
    {label: 'Approved by PDM', value: 5},
    {label: 'On Pre-CGB', value: 6},
    {label: 'Approved by Pre-CGB', value: 7},
    {label: 'On CGB', value: 10},
    {label: 'Approved by CGB', value: 11},
    {label: 'Approved', value: 19},
  ];

  constructor() {
    this.filter = {
      statusIds: [],
      orderType: "DESC"
    }
  }

  keepOrder = (a: any, b: any) => {
    return a;
  }

  isChecked(papers: PaperConfig[]) {
    return papers.filter(d => d.checked).length > 0;
  }

  getData(key: string) {
    return this.statusData.filter(f => f.label !== key);
  }

  trackByGroupKey(index: number, item: { key: string, value: any }): string {
    return item.key;
  }

  updateValue(event: any, groupKey: string) {
    if (event.target.value) {
      let movingPapers = [...JSON.parse(JSON.stringify(this.groupedPaper[groupKey].filter(d => d.checked)))];
      this.groupedPaper[groupKey] = this.groupedPaper[groupKey].filter(d => !d.checked);
      const findStatus = this.statusData.find(d => d.value == event.target.value);
      this.groupedPaper[findStatus!.label].push(...movingPapers.map(d => {
        d.checked = false;
        return d;
      }));

      this.paperService.updateMultiplePaperStatus(movingPapers.map(f => ({
        paperId: f.paperID,
        existingStatusId: Number(f.statusId),
        statusId: Number(event.target.value)
      }))).subscribe(value => {
        console.log('DD', value);
      });
    }
  }

  ngOnInit(): void {
    this.loadPaperConfigList();
  }

  loadPaperConfigList() {
    this.paperService.getPaperConfigList(this.filter).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.paperList = response.data.filter(d => d.statusName !== 'Draft');
          Object.keys(this.groupedPaper).forEach(key => {
            this.groupedPaper[key] = this.paperList.filter(f => f.statusName === key);
          })

        }
      }, error: (error) => {
        console.log('error', error);
      }
    });
  }
}
