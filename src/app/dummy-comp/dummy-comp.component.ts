import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-template1',
  standalone: true,
  imports: [FormsModule,NgbToastModule,CommonModule],
  templateUrl: './dummy-comp.component.html',
  styleUrl: './dummy-comp.component.scss'
})
export class DummyCompComponent {
  @Output() passEntry: EventEmitter<any> = new EventEmitter();

  user = {
    name: '',
    age: ''
  }

  constructor(
    public activeModal: NgbActiveModal,
    public toastService:ToastService
  ) { }

  passBack() {
    this.passEntry.emit();
    this.activeModal.close();
  }
}
