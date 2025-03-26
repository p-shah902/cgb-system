import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-dictionaries-list',
  standalone: true,
  imports: [NgbNavModule, NgbNavModule],
  templateUrl: './dictionaries-list.component.html',
  styleUrl: './dictionaries-list.component.scss'
})
export class DictionariesListComponent {
  active = 'top';
}
