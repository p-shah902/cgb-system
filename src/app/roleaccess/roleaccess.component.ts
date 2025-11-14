import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {NgbModal, NgbToastModule} from '@ng-bootstrap/ng-bootstrap';
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
import { ToastService } from '../../service/toast.service';

@Component({
  selector: 'app-roleaccess',
  standalone: true,
  imports: [NgbAccordionModule, CommonModule,NgbToastModule],
  templateUrl: './roleaccess.component.html',
  styleUrl: './roleaccess.component.scss'
})
export class RoleaccessComponent implements OnInit {
  private readonly _mdlSvc = inject(NgbModal);
  private readonly roleService = inject(RoleService);
  public toastService=inject(ToastService)
  isLoading:boolean=false

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
        this.roles = response.data.reverse();
      }, error: (error) => {
        console.error('Error loading user particulars', error);
      }
    })
  }

  getUserAccessList() {
    this.isLoading=true
    this.roleService.getAllRoleAccessList().subscribe({
      next: (response) => {
        this.userRoleAccesses = response.data
      }, error: (error) => {
        console.error('Error loading user particulars', error);
      },complete:()=>{
        this.isLoading=false
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
    const isChecked = event.target.checked;
    
    // Update local state immediately for better UX
    this.updateLocalState(role, access, particular, isChecked);
    
    this.roleService.upsertUserRoles({
      roleId: role.id,
      roleAccess: [{
        typeId: access.typeId,
        particularId: [particular.particularsId],
        isReadAccess: isChecked,
        isWriteAccess: isChecked
      }]
    }).subscribe({
      next: (response) => {
        if (response.success === false) {
          // Revert local state if API call failed
          this.updateLocalState(role, access, particular, !isChecked);
          this.toastService.show('Failed to update role access', 'danger');
          return;
        }
        // Optionally refresh in background without showing loading state
        // Only refresh if we want to ensure data consistency
        // this.getUserAccessList();
      },
      error: (error) => {
        console.error(' error:', error);
        // Revert local state if API call failed
        this.updateLocalState(role, access, particular, !isChecked);
        this.toastService.show('Error updating role access', 'danger');
      }
    });
  }

  private updateLocalState(role: UserRole, access: ParticularType, particular: Particular, isChecked: boolean) {
    // Find the access data for this access type and particular
    let accessData = this.userRoleAccesses.find(f => f.accessId === access.typeId && f.particularId === particular.particularsId);
    
    if (accessData) {
      // Find the user access for this role
      let userAccessIndex = accessData.usersAceess.findIndex(f => f.roleId === role.id);
      
      if (userAccessIndex !== -1) {
        if (isChecked) {
          // Update existing user access when checking
          accessData.usersAceess[userAccessIndex].isReadAccess = true;
          accessData.usersAceess[userAccessIndex].isWriteAccess = true;
        } else {
          // Remove entry when unchecking
          accessData.usersAceess.splice(userAccessIndex, 1);
        }
      } else if (isChecked) {
        // Create new user access if it doesn't exist and we're checking
        accessData.usersAceess.push({
          id: 0, // Will be set by backend on next refresh if needed
          particularId: particular.particularsId,
          roleId: role.id,
          description: '',
          isReadAccess: true,
          isWriteAccess: true
        });
      }
    } else if (isChecked) {
      // Create new access data if it doesn't exist and we're checking
      // Find the access name from accessTypes
      const accessType = this.accessTypes.find(at => at.typeId === access.typeId);
      this.userRoleAccesses.push({
        accessId: access.typeId,
        particularId: particular.particularsId,
        particularsName: particular.particularsName,
        accessName: accessType?.typeName || '',
        usersAceess: [{
          id: 0, // Will be set by backend on next refresh if needed
          particularId: particular.particularsId,
          roleId: role.id,
          description: '',
          isReadAccess: true,
          isWriteAccess: true
        }]
      });
    }
  }
}
