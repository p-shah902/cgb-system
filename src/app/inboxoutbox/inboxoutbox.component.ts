import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-inboxoutbox',
  standalone: true,
  imports: [NgbNavModule],
  templateUrl: './inboxoutbox.component.html',
  styleUrl: './inboxoutbox.component.scss'
})
export class InboxoutboxComponent {
  active = 1;
}
