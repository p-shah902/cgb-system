import {Component, EventEmitter, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-approve-paper',
  standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule
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
    public activeModal: NgbActiveModal
  ) { }

  passBack() {
    this.passEntry.emit();
    this.activeModal.close();
  }
}
