import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-template1',
  standalone: true,
  imports: [FormsModule],
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
    public activeModal: NgbActiveModal
  ) { }

  passBack() {
    this.passEntry.emit();
    this.activeModal.close();
  }
}
