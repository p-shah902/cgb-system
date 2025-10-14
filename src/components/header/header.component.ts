import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../../service/auth.service';
import {LoginUser} from '../../models/user';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgbDropdownModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  pageTitle: string = '';
  loggedInUser: LoginUser | null = null;

  constructor(private router: Router, public authService: AuthService) {
  }

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.setPageTitle();
    });

    this.setPageTitle();

    this.authService.userDetails$.subscribe(value => {
      if (value) {
        this.loggedInUser = value;
      }
    })
  }

  setPageTitle() {
    const currentUrl = decodeURIComponent(this.router.url.split('?')[0]); // Remove query params
    this.pageTitle = this.formatTitle(currentUrl);
  }

  formatTitle(url: string): string {
    return url
      .split('/')[1]?.replace(/-/g, ' ') // Get first segment & replace dashes with spaces
      .replace(/\b\w/g, char => char.toUpperCase()) || ''; // Capitalize words & fallback
  }

}
