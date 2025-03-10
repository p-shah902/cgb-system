import { Routes } from '@angular/router';
import {RoleaccessComponent} from './roleaccess/roleaccess.component';
import {UsermanagementComponent} from './usermanagement/usermanagement.component';
import {UserdetailsComponent} from './userdetails/userdetails.component';
import {CreatepaperComponent} from './createpaper/createpaper.component';
import {PreviewComponent} from './preview/preview.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {PaperStatusComponent} from './paper-status/paper-status.component';
import {ApprovePaperComponent} from './approve-paper/approve-paper.component';
import {ApproveRequestComponent} from './approve-request/approve-request.component';
import {LoginComponent} from './login/login.component';
import {ForgotPasswordComponent} from './forgot-password/forgot-password.component';

export const routes: Routes = [
  {
    path: 'approach-to-market',
    loadComponent: () => import('./approch-to-maket/template1.component').then(m => m.Template1Component)
  },
  {
    path: 'contract-award',
    loadComponent: () => import('./template2/template2.component').then(m => m.Template2Component)
  },
  {
    path: 'contract-variation-or-amendment-approval',
    loadComponent: () => import('./template3/template3.component').then(m => m.Template3Component)
  },
  {
    path: 'approval-of-sale-disposal-form',
    loadComponent: () => import('./template4/template4.component').then(m => m.Template4Component)
  },
  {
    path: 'info-note',
    loadComponent: () => import('./template5/template5.component').then(m => m.Template5Component)
  },
  {
    path: 'cgb',
    loadComponent: () => import('./cgb/cgb.component').then(m => m.CgbComponent)
  },
  {
    path: 'roleaccess',
    loadComponent: () => import('./roleaccess/roleaccess.component').then(m => m.RoleaccessComponent)
  },
  {
    path: 'usermanagement',
    loadComponent: () => import('./usermanagement/usermanagement.component').then(m => m.UsermanagementComponent)
  },
  {
    path: 'userdetails',
    loadComponent: () => import('./userdetails/userdetails.component').then(m => m.UserdetailsComponent)
  },
  {
    path: 'inboxoutbox',
    loadComponent: () => import('./inboxoutbox/inboxoutbox.component').then(m => m.InboxoutboxComponent)
  },
  {
    path: 'paperconfiguration',
    loadComponent: () => import('./paperconfiguration/paperconfiguration.component').then(m => m.PaperconfigurationComponent)
  },
  {
    path: 'createpaper',
    loadComponent: () => import('./createpaper/createpaper.component').then(m => m.CreatepaperComponent)
  },
  {
    path: 'preview',
    loadComponent: () => import('./preview/preview.component').then(m => m.PreviewComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'paper-status',
    loadComponent: () => import('./paper-status/paper-status.component').then(m => m.PaperStatusComponent)
  },
  {
    path: 'approve-request',
    loadComponent: () => import('./approve-request/approve-request.component').then(m => m.ApproveRequestComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
];
