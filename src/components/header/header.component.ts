import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgbDropdownModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  pageTitle: string = '';

  constructor(private router: Router) { }

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.setPageTitle();
    });

    this.setPageTitle();
  }

  setPageTitle() {
    const currentUrl = this.router.url;
    const formattedTitle = this.formatTitle(currentUrl);
    this.pageTitle = formattedTitle;
  }

  formatTitle(url: string): string {
    const segments = url.split('/').filter(segment => segment);
    let formatted = segments[segments.length - 1]
      ?.replace(/-/g, ' ')
      ?.toLowerCase()
      ?.split(' ')
      ?.map(word => word.charAt(0).toUpperCase() + word.slice(1))
      ?.join(' ');
    return formatted;
  }
}
