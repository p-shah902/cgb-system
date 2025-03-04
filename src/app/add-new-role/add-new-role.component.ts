import {Component, EventEmitter, Output} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-new-role',
  standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule
    ],
  templateUrl: './add-new-role.component.html',
  styleUrl: './add-new-role.component.scss'
})
export class AddNewRoleComponent {
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
