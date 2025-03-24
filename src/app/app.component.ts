import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeaderComponent} from '../components/header/header.component';
import {SidebarComponent} from '../components/sidebar/sidebar.component';
import {NgClass, NgIf} from '@angular/common';
import { AddNewRoleComponent } from "./add-new-role/add-new-role.component";
import { RoleaccessComponent } from "./roleaccess/roleaccess.component";
import {AuthService} from '../service/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, NgClass, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'paper-management';
  sideBarExpanded = true;

  constructor(public authService: AuthService) {
  }
}
