import { Injectable } from '@angular/core';

type UserRole = string | null | undefined;
type PaperStatus = string | null | undefined;

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private is(role: UserRole, roles: string[]): boolean {
    return !!role && roles.includes(role);
  }

  // Show Draft/Register while editing if not Registered
  canShowDraftRegisterInEdit(role: UserRole, status: PaperStatus): boolean {
    return this.is(role, ['Procurement Tag', 'CAM', 'Secretary', 'Super Admin']) && status === 'Draft';
  }

  // Archive: PT or Secretary and status Registered/Withdrawn
  canShowArchive(role: UserRole, status: PaperStatus): boolean {
    return this.is(role, ['Procurement Tag', 'Secretary']) && (status === 'Registered' || status === 'Withdrawn');
  }

  // Send For PDM: PT or CAM and status Registered
  canShowSendForPDM(role: UserRole, status: PaperStatus): boolean {
    if (!role || !status) return false;
    
    // Case-insensitive role check
    const roleLower = role.toLowerCase().trim();
    const isPT = roleLower === 'procurement tag';
    const isCAM = roleLower === 'cam';
    const isRegistered = status === 'Registered';
    
    return (isPT || isCAM) && isRegistered;
  }

  // Update: PT, CAM, Secretary and status Registered
  canShowUpdate(role: UserRole, status: PaperStatus): boolean {
    return this.is(role, ['Procurement Tag', 'CAM', 'Secretary', "Super Admin"]) && status === 'Registered';
  }

  /**
   * Check if user can edit paper based on role and status
   * Implements the edit paper conditions from requirements
   */
  canEditPaper(
    role: UserRole,
    status: PaperStatus,
    currentUserId?: number | null,
    paperCamUserId?: number | null,
    paperProcurementSPAUsers?: string | null,
    isBPGroup100Percent?: boolean,
    hasJVAlignedConsultation?: boolean
  ): boolean {
    if (!role || !status) return false;

    const statusLower = status.toLowerCase().trim();

    // a. PTs (Proc. SPAs) - can edit according to workflow till "Waiting for PDM" and "Action Required"
    if (this.is(role, ['Procurement Tag'])) {
      const procurementSPAUsersList = paperProcurementSPAUsers 
        ? paperProcurementSPAUsers.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))
        : [];
      const isUserInProcurementSPA = currentUserId && procurementSPAUsersList.includes(currentUserId);
      
      if (isUserInProcurementSPA) {
        return statusLower === 'waiting for pdm' || 
               statusLower === 'action required by pre-cgb' ||
               statusLower === 'action required by cgb' ||
               statusLower === 'registered' ||
               statusLower === 'draft';
      }
      return false;
    }

    // b. CAM - only papers they assigned to, paper Status before than "Waiting for PDM"
    if (this.is(role, ['CAM'])) {
      if (currentUserId && paperCamUserId && currentUserId === paperCamUserId) {
        return statusLower === 'registered' ||
               statusLower === 'draft';
      }
      return false;
    }

    // c. PDM - can edit till "Approved by Pre-CGB"
    if (this.is(role, ['PDM'])) {
      return statusLower === 'waiting for pdm' ||
             statusLower === 'approved by pdm' ||
             statusLower === 'on pre-cgb' ||
             statusLower === 'approved by pre-cgb' ||
             statusLower === 'action required by pre-cgb';
    }

    // d. JV Admin - only can put a JV Aligned in Consultation (assigned to)
    if (this.is(role, ['JV Admin'])) {
      // JV Admin can only edit JV Aligned field in Consultation section
      // This is handled separately in the form, but we allow edit access if they have assigned consultation
      return hasJVAlignedConsultation === true;
    }

    // e. CGB Member (Non-Voting) edit ONLY - Government comment only in papers since "PDM Approved" 
    //    except: papers with PSA split BP Group = 100%
    if (this.is(role, ['CGB Member (Non-Voting)']) || role === 'CGB Member (Non-Voting)') {
      // Check if status is "PDM Approved" or later
      const pdmApprovedStatuses = [
        'approved by pdm',
        'on pre-cgb',
        'approved by pre-cgb',
        'on cgb',
        'approved by cgb',
        'on jv approval',
        'on partner approval 1st',
        'on partner approval 2nd',
        'approved'
      ];
      
      const isAfterPDMApproved = pdmApprovedStatuses.some(s => statusLower === s);
      
      if (isAfterPDMApproved) {
        // If BP Group = 100%, they cannot edit (only government comment)
        // If BP Group != 100%, they can edit (government comment only)
        // For now, we allow edit access - the actual field restrictions should be in the form
        return !isBPGroup100Percent;
      }
      return false;
    }

    // Secretary and Super Admin can edit in most cases
    if (this.is(role, ['Secretary', 'Super Admin'])) {
      return true; // Secretary and Super Admin have broader edit permissions
    }

    return false;
  }

  /**
   * Check if user can edit specific fields (for CGB Member Non-Voting - Government comment only)
   */
  canEditAllFields(role: UserRole, status: PaperStatus, isBPGroup100Percent?: boolean): boolean {
    if (!role || !status) return false;

    const statusLower = status.toLowerCase().trim();

    // CGB Member (Non-Voting) can only edit government comment fields after PDM Approved
    if (this.is(role, ['CGB Member (Non-Voting)']) || role === 'CGB Member (Non-Voting)') {
      const pdmApprovedStatuses = [
        'approved by pdm',
        'on pre-cgb',
        'approved by pre-cgb',
        'on cgb',
        'approved by cgb',
        'on jv approval',
        'on partner approval 1st',
        'on partner approval 2nd',
        'approved'
      ];
      
      const isAfterPDMApproved = pdmApprovedStatuses.some(s => statusLower === s);
      
      if (isAfterPDMApproved) {
        // If BP Group = 100%, they cannot edit at all
        // If BP Group != 100%, they can only edit government comment fields
        return !isBPGroup100Percent;
      }
    }

    // All other roles can edit all fields if they have edit access
    return true;
  }
}


