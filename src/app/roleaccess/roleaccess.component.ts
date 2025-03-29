import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddNewRoleComponent} from '../add-new-role/add-new-role.component';
import {NgbAccordionModule} from '@ng-bootstrap/ng-bootstrap';
import {RoleService} from '../../service/role.service';
import {
  Particular,
  ParticularType,
  UpsertUserRolesPaylod,
  UserRole,
  UserRoleAccess,
  UserRoleAccesses
} from '../../models/role';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../service/auth.service';
import {Subscription} from 'rxjs';
import {AuthGuard} from '../../guards/auth.guard';
import {Console} from 'console';

@Component({
  selector: 'app-roleaccess',
  standalone: true,
  imports: [NgbAccordionModule, CommonModule],
  templateUrl: './roleaccess.component.html',
  styleUrl: './roleaccess.component.scss'
})
export class RoleaccessComponent implements OnInit {
  private readonly _mdlSvc = inject(NgbModal);
  private readonly roleService = inject(RoleService);

  newRole() {
    const modalRef = this._mdlSvc.open(AddNewRoleComponent, {centered: true, modalDialogClass: 'custom-modal'});

    modalRef.result.then((result) => {
      if (result) {
        this.getUserRoleList();
        this.getUserAccessList();
      }
    });
  }

  roles: UserRole[] = [];
  userRoleAccesses: UserRoleAccesses[] = [];
  accessTypes: ParticularType[] = [];

  ngOnInit(): void {
    this.getUserRoleList();
    this.loadUserParticulars();
    this.getUserAccessList();
  }

  getUserRoleList() {
    this.roleService.getUserRolesList().subscribe({
      next: (response) => {
        this.roles = response.data.reverse().slice(0, 5);
      }, error: (error) => {
        console.error('Error loading user particulars', error);
      }
    })
  }

  getUserAccessList() {
    this.roleService.getAllRoleAccessList().subscribe({
      next: (response) => {
        this.userRoleAccesses = response.data
      }, error: (error) => {
        console.error('Error loading user particulars', error);
      }
    })
  }

  loadUserParticulars() {
    this.roleService.getUserParticularsList(0).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.accessTypes = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading user particulars', error);
      }
    });
  }

  getRolesChecked(role: UserRole, access: ParticularType, particular: Particular) {
    let accessData = this.userRoleAccesses.find(f => f.accessId === access.typeId && f.particularId === particular.particularsId);
    if (accessData) {
      return accessData.usersAceess.find(f => f.roleId === role.id && f.isWriteAccess);
    }
    return false
  }

  updateUserRole(event: any, role: UserRole, access: ParticularType, particular: Particular) {
    this.roleService.upsertUserRoles({
      roleId: role.id,
      roleAccess: [{
        typeId: access.typeId,
        particularId: [particular.particularsId],
        isReadAccess: event.target.checked,
        isWriteAccess: event.target.checked
      }]
    }).subscribe({
      next: (response) => {
        if (response.success === false) {
          return;
        }
        this.getUserAccessList();
      },
      error: (error) => {
        console.error(' error:', error);
      }
    });
  }
}
