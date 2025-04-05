import {Component, inject, OnInit} from '@angular/core';
import {NgbNavModule, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ToastService} from '../../service/toast.service';
import {CommonModule} from '@angular/common';
import {InboxOutbox} from '../../models/inbox-outbox';
import {InboxOutboxService} from '../../service/inbox-outbox.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-inboxoutbox',
  standalone: true,
  imports: [NgbNavModule, NgbToastModule, CommonModule, RouterLink],
  templateUrl: './inboxoutbox.component.html',
  styleUrl: './inboxoutbox.component.scss'
})
export class InboxoutboxComponent implements OnInit {

  public toastService = inject(ToastService)
  active = 1;
  inboxData: InboxOutbox[] = [];
  outboxData: InboxOutbox[] = [];

  constructor(private inboxOutboxService: InboxOutboxService) {
  }

  ngOnInit() {
    this.getInboxOutBox()
  }

  getInboxOutBox() {
    this.inboxOutboxService.getPaperInboxOutbox().subscribe({
      next: response => {
        if (response.status && response.data) {
          this.inboxData = response.data.inBox;
          this.outboxData = response.data.outBox;
        }
      },
      error: err => {
        console.log('ERROR', err);
      }
    })
  }
}
