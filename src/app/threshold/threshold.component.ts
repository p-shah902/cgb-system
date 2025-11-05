import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbNavModule, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ThresholdService } from '../../service/threshold.service';

@Component({
  selector: 'app-threshold',
  standalone: true,
  imports: [NgbNavModule, NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle, NgbToastModule, CommonModule, RouterModule],
  templateUrl: './threshold.component.html',
  styleUrl: './threshold.component.scss'
})
export class ThresholdComponent implements OnInit {
  public toastService = inject(ToastService);
  active = 1;
  internalThresholds: any[] = [];
  partnerThresholds: any[] = [];
  isLoading: boolean = false;

  constructor(private http: HttpClient, private router: Router, private thresholdService: ThresholdService) { }

  ngOnInit(): void {
    this.loadThresholds();
  }

  // Load internal and partner thresholds from the API
  loadThresholds(): void {
    this.isLoading = true;
    this.thresholdService.getThresholdList().subscribe(
      (response: any) => {
        if (response && response.data) {
          this.internalThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Internal');
          this.partnerThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Partner');

        } else {
          console.error('No data found in the response');
        }
      },
      (error) => {
        console.error('Error loading thresholds:', error);
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
      }
    );
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
          this.loadThresholds()
        }
      },
      error: (error) => {
        console.log('Error:', error);
        this.toastService.show("Something went wrong.", 'danger');
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
