import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {Validators} from '@angular/forms';
import {FormGroup} from '@angular/forms';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgbActiveModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
import {ParticularType, UpsertUserRolesPaylod} from '../../models/role';
import {RoleService} from '../../service/role.service';
import {CommonModule} from '@angular/common';
import {Select2} from 'ng-select2-component';
import { ToastService } from '../../service/toast.service';

@Component({
  selector: 'app-add-new-role',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    Select2,
    NgbToastModule
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
  selectedSectionValue: any[] = [];
  showSectionDropdown: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private roleService: RoleService,
    public toastService:ToastService
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

  updateValues({value: selectedTypeIds}: any) {
    if (selectedTypeIds && selectedTypeIds.length > 0) {
      let filterData = this.accessTypesAll.filter(f => selectedTypeIds.includes(f.typeId) && f.particulars.length > 0);
      if (filterData.length > 0) {
        this.showSectionDropdown = true;
        this.roleForm.get('section')?.setValidators([Validators.required]);
      } else {
        this.showSectionDropdown = false;
        this.roleForm.get('section')?.clearValidators();
      }
      this.selectedParticulars = [];
      selectedTypeIds.forEach((item: number) => {
        const selectedType = this.accessTypesAll.find(type => type.typeId === item);
        if (selectedType && selectedType.particulars.length > 0) {
          this.selectedParticulars.push({
            value: selectedType.typeId,
            label: selectedType.typeName,
            options: selectedType.particulars.map(d => ({
              value: d.particularsId,
              label: d.particularsName
            }))
          })
        }
      })
      this.roleForm.get('accessTo')?.setValue(selectedTypeIds);
    } else {
      this.selectedParticulars = [];
      this.showSectionDropdown = false;
    }
    this.roleForm.get('section')?.updateValueAndValidity();
  }

  updateSectionValues({value}: any) {
    let accessSelected = this.roleForm.get('accessTo')?.value;
    let filterSelected = this.accessTypesAll.filter(d => accessSelected.includes(d.typeId));
    this.selectedSectionValue = [];
    let values: any = {};
    filterSelected.forEach(item => {
      if (!values[item.typeId]) {
        values[item.typeId] = [];
      }
      let filterSelected = item.particulars.filter(f => value.includes(f.particularsId));
      values[item.typeId] = filterSelected.map(d => d.particularsId);
    });
    Object.keys(values).forEach(item => {
      this.selectedSectionValue.push({
        typeId: item,
        particularId: values[item],
      })
    })
    this.roleForm.get('section')?.setValue(value);
  }

  save() {
    if (this.roleForm.valid) {
      const formValues = this.roleForm.value;
      const payload: UpsertUserRolesPaylod = {
        roleName: formValues.roleName,
        description: formValues.description || "description",
        roleAccess: this.selectedSectionValue.map((item: any) => ({
          typeId: item.typeId,
          particularId: item.particularId,
          isReadAccess: formValues.action === 'Read' || formValues.action === 'Read Write',
          isWriteAccess: formValues.action === 'Read Write'
        }))
      };

      this.roleService.createUserRoles(payload).subscribe({
        next: (response) => {
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
