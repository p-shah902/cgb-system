import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddNewRoleComponent} from '../add-new-role/add-new-role.component';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { RoleService } from '../../service/role.service';
import { Particular, ParticularType, UpsertUserRolesPaylod, UserRole, UserRoleAccess } from '../../models/role';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { AuthGuard } from '../../guards/auth.guard';
import { Console } from 'console';
@Component({
  selector: 'app-roleaccess',
  standalone: true,
  imports: [NgbAccordionModule,CommonModule],
  templateUrl: './roleaccess.component.html',
  styleUrl: './roleaccess.component.scss'
})
export class RoleaccessComponent implements OnInit {
  private readonly _mdlSvc = inject(NgbModal);
  private readonly roleService=inject(RoleService);
  private readonly authService=inject(AuthService);
  // private readonly authGuard=inject(AuthGuard);

  newRole() {
    const modalRef = this._mdlSvc.open(AddNewRoleComponent,{ centered: true,modalDialogClass: 'custom-modal' });

    modalRef.result.then((result) => {
      if (result) {
        console.log(result);
      }
    });
    // modalRef.componentInstance.passEntry.subscribe((receivedEntry) => {
    //   console.log(receivedEntry);
    // })
  }

  // private subscription: Subscription = new Subscription();
  // roles:UserRole[]=[];
  userRoleAccesses: UserRoleAccess[] = [];
  accessTypes: ParticularType[] = [];
  roleAccess:UpsertUserRolesPaylod[]=[];

  ngOnInit(): void {
    // this.getUserRoleList();
    // this.loadUserParticulars();


    // console.log('Updated User Roles:',this.authGuard.getUserRoles());
    this.authService.userRoleAccess$.subscribe(userRoles => {
      this.userRoleAccesses = userRoles;
      console.log('Updated User Roles:',userRoles);
    });

    this.accessTypes=this.transformUserRoleAccesses(this.userRoleAccesses);
    console.log('Access Type',this.accessTypes);
    this.roleAccess=this.transformToUpsertPayload();
    console.log('Upsert role access',this.roleAccess);
    // this.subscription.add(
    //   this.authService.userRoleAccess$.subscribe(roles => {
    //     this.userRoleAccesses = roles;
    //     console.log('Updated roles:', this.userRoleAccesses);
    //   })
    // );

  }

  // getUserRoleList(){
  //   this.roleService.getUserRolesList().subscribe({
  //     next:(response)=>{
  //       if(response.success && response.data)
  //       {
  //         console.log(response.data);
  //         this.roles=response.data;
  //       }

  //     },error: (error) => {
  //       console.error('Error loading user particulars', error);
  //     }
  //   })
  // }

  // ngOnDestroy() {
  //   this.subscription.unsubscribe();
  // }

  loadUserParticulars(){
    this.roleService.getUserParticularsList(0).subscribe({
      next: (response) => {
        if (response.status && response.data) {
          this.accessTypes = response.data;
          console.log('AccessType',this.accessTypes);
        }
      },
      error: (error) => {
        console.error('Error loading user particulars', error);
      }
    });
  }

  transformUserRoleAccesses(userRoleAccesses: UserRoleAccess[]): ParticularType[] {
    const typeMap = new Map<number, ParticularType>();

    userRoleAccesses.forEach(access => {
      if (!typeMap.has(access.typeId)) {
        typeMap.set(access.typeId, {
          typeId: access.typeId,
          typeName: access.typeName,
          particulars: [],
        });
      }

      const particularType = typeMap.get(access.typeId)!;

      if (!particularType.particulars.some(p => p.particularsId === access.particularsId)) {
        particularType.particulars.push({
          particularsId: access.particularsId,
          particularsName: access.particularsName,
          description: "",
        });
      }
    });

    return Array.from(typeMap.values());
  }

  isChecked(roleParticularId:number[]|null,particularId:number)
  {
    return roleParticularId ? roleParticularId.includes(particularId) : false;
  }

  toggleAccess(event: any, particularType: ParticularType,particular:Particular,userRole:UpsertUserRolesPaylod){

    const existsIndex = this.userRoleAccesses.findIndex(
      (r) => r.roleId === userRole.roleId && r.typeId === particularType.typeId && r.particularsId === particular.particularsId
    );

    console.log('existIndex',existsIndex);
    if (event.target.checked) {
      if (existsIndex === -1) {

        this.userRoleAccesses.push({
          roleId: userRole.roleId,
          roleName: userRole.roleName,
          typeId: particularType.typeId,
          typeName: particularType.typeName,
          particularsId: particular.particularsId,
          particularsName: particular.particularsName,
          isWriteAccess: true,
          isReadAccess: false
        });
      }
    }else {
      if (existsIndex !== -1) {
        this.userRoleAccesses.splice(existsIndex, 1);
      }
    }

    console.log('userRoleAccess',this.userRoleAccesses);
  }

  transformToUpsertPayload(): UpsertUserRolesPaylod[] {
    const roleMap = new Map<number, UpsertUserRolesPaylod>();

    this.userRoleAccesses.forEach((access) => {
      console.log('access',access);
      if (!roleMap.has(access.roleId)) {
        roleMap.set(access.roleId, {
          roleId: access.roleId,
          roleName: access.roleName,
          description: "",
          accessId: [],
          sectionId: [],
          isReadAccess: false,
          isWriteAccess: false,
        });
      }

      const rolePayload = roleMap.get(access.roleId)!;

      if (!rolePayload.accessId.includes(access.typeId)) {
        rolePayload.accessId.push(access.typeId);
      }

      if (access.particularsId && !rolePayload.sectionId!.includes(access.particularsId)) {
        rolePayload.sectionId!.push(access.particularsId);
      }
    });

    return Array.from(roleMap.values());
  }
}
