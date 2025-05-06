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

  constructor(private http: HttpClient, private router: Router, private thresholdService: ThresholdService) { }

  ngOnInit(): void {
    this.loadThresholds();
  }

  // Load internal and partner thresholds from the API
  loadThresholds(): void {
    this.thresholdService.getThresholdList().subscribe(
      (response: any) => {
        if (response && response.data) {
          this.internalThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Internal');
          this.partnerThresholds = response.data.filter((threshold: any) => threshold.thresholdType === 'Partner');

        } else {
          console.error('No data found in the response');
        }
      },

    );
  }

  navigateToThreshold(): void {
    const type = this.active === 1 ? 'internal' : 'partner';
    this.router.navigate(['/threshold-add', type]);
  }
}
