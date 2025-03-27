import { Injectable } from '@angular/core';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor() { }

  toasts: any[] = [];

  show(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success') {
    this.toasts.push({ message, type });
  }

  remove(toast: any) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  clear() {
    this.toasts.splice(0, this.toasts.length);
  }

}
