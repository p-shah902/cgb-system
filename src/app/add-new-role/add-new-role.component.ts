import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {Validators} from '@angular/forms';
import {FormGroup} from '@angular/forms';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ParticularType, UpsertUserRolesPaylod} from '../../models/role';
import {RoleService} from '../../service/role.service';
import {CommonModule} from '@angular/common';
import {Select2} from 'ng-select2-component';

@Component({
  selector: 'app-add-new-role',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    Select2
  ],
  templateUrl: './add-new-role.component.html',
  styleUrl: './add-new-role.component.scss'
})
export class AddNewRoleComponent implements OnInit {
  @Output() passEntry: EventEmitter<any> = new EventEmitter();

  user = {
    name: '',
    age: ''
  }

  roleForm: FormGroup;
  accessTypes: any[] = [];
  accessTypesAll: ParticularType[] = [];
  selectedParticulars: any[] = [];
  showSectionDropdown: boolean = true;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private roleService: RoleService
  ) {

    this.roleForm = this.fb.group({
      roleName: ['', Validators.required],
      accessTo: [[], Validators.required],
      section: [[]],
      action: ['Read']
    })
  }

  ngOnInit(): void {

    this.loadUserParticulars();

    this.roleForm.get('accessTo')?.valueChanges.subscribe(selectedTypeIds => {
      if (selectedTypeIds) {
        const selectedType = this.accessTypesAll.find(type => type.typeId === selectedTypeIds);
        this.roleForm.get('section')?.setValue([]);
        if (selectedType && selectedType.particulars.length > 0) {
          this.showSectionDropdown = true;
          this.roleForm.get('section')?.setValidators([Validators.required]);
          this.selectedParticulars = selectedType.particulars.map((f: any) => ({
            label: f.particularsName,
            value: f.particularsId
          }));
        } else {
          this.showSectionDropdown = false;
          this.roleForm.get('section')?.clearValidators();
        }
      } else {
        this.selectedParticulars = [];
        this.showSectionDropdown = false;
      }
      this.roleForm.get('section')?.updateValueAndValidity();
    });
  }

  passBack() {
    this.passEntry.emit();
    this.activeModal.close();
  }

  loadUserParticulars() {
    this.roleService.getUserParticularsList(0).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.accessTypesAll = response.data;
          this.accessTypes = response.data.map(t => ({label: t.typeName, value: t.typeId}));
          if (response.data.length > 0) {
            this.roleForm.patchValue({
              accessTo: this.accessTypes[0].typeId
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading user particulars', error);
      }
    });

  }

  save() {
    if (this.roleForm.valid) {

      const formValues = this.roleForm.value;
      console.log(formValues);

      const accessId = formValues.accessTo && formValues.accessTo.length > 0 ?
        formValues.accessTo : [];


      const sectionId = formValues.section && formValues.section.length > 0 ?
        formValues.section : null;


      const payload: UpsertUserRolesPaylod = {
        roleId: 0,
        roleName: formValues.roleName,
        description: formValues.description || "description",
        accessId: accessId,
        sectionId: sectionId,
        isReadAccess: formValues.action === 'Read' || formValues.action === 'Read Write',
        isWriteAccess: formValues.action === 'Read Write'
      };

      console.log(payload);
      this.roleService.upsertUserRoles(payload).subscribe({
        next: (response) => {
          console.log(response);
          if (response.success === false) {
            return;
          }
          this.roleForm.reset();
          this.roleForm.patchValue({
            action: 'Read'
          });
        },
        error: (error) => {
          console.error(' error:', error);
        }
      });


      this.passEntry.emit(formValues);
      this.activeModal.close(formValues);
    } else {
      Object.keys(this.roleForm.controls).forEach(key => {
        this.roleForm.get(key)?.markAsTouched();
      });
    }
  }


}
