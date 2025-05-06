import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';

export const routes: Routes = [
  {
    path: 'approach-to-market',
    loadComponent: () => import('./approch-to-maket/template1.component').then(m => m.Template1Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'approach-to-market/:id',
    loadComponent: () => import('./approch-to-maket/template1.component').then(m => m.Template1Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'preview/approach-to-market/:id',
    loadComponent: () => import('./preview/preview.component').then(m => m.PreviewComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'contract-award',
    loadComponent: () => import('./template2/template2.component').then(m => m.Template2Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'contract-award/:id',
    loadComponent: () => import('./template2/template2.component').then(m => m.Template2Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'preview/contract-award/:id',
    loadComponent: () => import('./preview2/preview2.component').then(m => m.Preview2Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'variation-paper',
    loadComponent: () => import('./template3/template3.component').then(m => m.Template3Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'variation-paper/:id',
    loadComponent: () => import('./template3/template3.component').then(m => m.Template3Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'approval-of-sale-disposal-form',
    loadComponent: () => import('./template4/template4.component').then(m => m.Template4Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'approval-of-sale-disposal-form/:id',
    loadComponent: () => import('./template4/template4.component').then(m => m.Template4Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'info-note',
    loadComponent: () => import('./template5/template5.component').then(m => m.Template5Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'info-note/:id',
    loadComponent: () => import('./template5/template5.component').then(m => m.Template5Component),
    canActivate: [AuthGuard]
  },
  {
    path: 'cgb-voting',
    loadComponent: () => import('./cgb/cgb.component').then(m => m.CgbComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'roleaccess',
    loadComponent: () => import('./roleaccess/roleaccess.component').then(m => m.RoleaccessComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'usermanagement',
    loadComponent: () => import('./usermanagement/usermanagement.component').then(m => m.UsermanagementComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'userdetails',
    loadComponent: () => import('./userdetails/userdetails.component').then(m => m.UserdetailsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'userdetails/:id',
    loadComponent: () => import('./userdetails/userdetails.component').then(m => m.UserdetailsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'inboxoutbox',
    loadComponent: () => import('./inboxoutbox/inboxoutbox.component').then(m => m.InboxoutboxComponent),
    canActivate: [AuthGuard]
  },
  // {
  //   path: 'paperconfiguration',
  //   loadComponent: () => import('./paperconfiguration/paperconfiguration.component').then(m => m.PaperconfigurationComponent),
  //   canActivate: [AuthGuard]
  // },
  {
    path: 'my-drafts',
    loadComponent: () => import('./my-drafts/paper-list.component').then(m => m.PaperListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'all-papers',
    loadComponent: () => import('./paper-list/paper-list.component').then(m => m.PaperListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'pre-cgb-review',
    loadComponent: () => import('./pre-cgb-review/pre-cgb-review.component').then(m => m.PreCgbReviewComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'createpaper',
    loadComponent: () => import('./createpaper/createpaper.component').then(m => m.CreatepaperComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'paper-status',
    loadComponent: () => import('./paper-status/paper-status.component').then(m => m.PaperStatusComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'approve-request',
    loadComponent: () => import('./approve-request/approve-request.component').then(m => m.ApproveRequestComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },

  {
    path: 'vendors',
    loadComponent: () => import('./vendors/vendors.component').then(m => m.VendorsComponent)
  },
  {
    path: 'vendor-detail',
    loadComponent: () => import('./vendor-detail/vendor-detail.component').then(m => m.VendorDetailComponent)
  },
  {
    path: 'vendor-detail/:id',
    loadComponent: () => import('./vendor-detail/vendor-detail.component').then(m => m.VendorDetailComponent)
  },
  {
    path: 'dictionaries-list',
    loadComponent: () => import('./dictionaries-list/dictionaries-list.component').then(m => m.DictionariesListComponent)
  },
  {
    path: 'dictionaries-edit/:itemName',
    loadComponent: () => import('./dictionaries-edit/dictionaries-edit.component').then(m => m.DictionariesEditComponent)
  },
  {
    path: 'dictionaries-edit/:itemName/:id',
    loadComponent: () => import('./dictionaries-edit/dictionaries-edit.component').then(m => m.DictionariesEditComponent)
  },
  {
    path: 'threshold',
    loadComponent: () => import('./threshold/threshold.component').then(m => m.ThresholdComponent)
  },
  {
    path: 'threshold-add/:type', // e.g., internal or external
    loadComponent: () =>
      import('./threshold-add/threshold-add.component').then(m => m.ThresholdAddComponent)
  },
  {
    path: 'threshold-add/:type/:id', // for editing
    loadComponent: () =>
      import('./threshold-add/threshold-add.component').then(m => m.ThresholdAddComponent)
  },
  {
    path: 'temp',
    loadComponent: () => import('./add-new-role/add-new-role.component').then(m => m.AddNewRoleComponent)
  },
  {
    path: 'temp1',
    loadComponent: () => import('./roleaccess/roleaccess.component').then(m => m.RoleaccessComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'paper-list',
    loadComponent: () => import('./paper-list/paper-list.component').then(m => m.PaperListComponent),
    canActivate: [AuthGuard]
  },
];
