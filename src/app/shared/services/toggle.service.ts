import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ToggleService {
  private commentExpandedSubject = new BehaviorSubject<boolean>(false);
  private sidebarExpandedSubject = new BehaviorSubject<boolean>(true);

  commentExpanded$ = this.commentExpandedSubject.asObservable();
  sidebarExpanded$ = this.sidebarExpandedSubject.asObservable();

  expandComments() {
    this.commentExpandedSubject.next(true);
    this.sidebarExpandedSubject.next(false); // Automatically collapse sidebar
  }

  expandSidebar() {
    this.sidebarExpandedSubject.next(true);
    this.commentExpandedSubject.next(false); // Automatically collapse comments
  }

  collapseAll() {
    this.commentExpandedSubject.next(false);
    this.sidebarExpandedSubject.next(false);
  }
}
