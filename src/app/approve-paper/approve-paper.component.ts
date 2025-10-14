import {Component, EventEmitter, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../service/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-approve-paper',
  standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        NgbToastModule,
        CommonModule
    ],
  templateUrl: './approve-paper.component.html',
  styleUrl: './approve-paper.component.scss'
})
export class ApprovePaperComponent {
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
