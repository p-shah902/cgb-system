import { Injectable } from '@angular/core';

type UserRole = string | null | undefined;
type PaperStatus = string | null | undefined;

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private is(role: UserRole, roles: string[]): boolean {
    return !!role && roles.includes(role);
  }

  // Show Draft/Register while editing if not Registered
  canShowDraftRegisterInEdit(status: PaperStatus): boolean {
    return status !== 'Registered';
  }

  // Archive: PT or Secretary and status Registered/Withdrawn
  canShowArchive(role: UserRole, status: PaperStatus): boolean {
    return this.is(role, ['Procurement Tag', 'Secretary']) && (status === 'Registered' || status === 'Withdrawn');
  }

  // Send For PDM: PT or CAM and status Registered
  canShowSendForPDM(role: UserRole, status: PaperStatus): boolean {
    return this.is(role, ['Procurement Tag', 'CAM']) && status === 'Registered';
  }

  // Update: PT, CAM, Secretary and status Registered
  canShowUpdate(role: UserRole, status: PaperStatus): boolean {
    return this.is(role, ['Procurement Tag', 'CAM', 'Secretary']) && status === 'Registered';
  }
}


