import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'template1',
    loadComponent: () => import('./template1/template1.component').then(m => m.Template1Component)
  },
  {
    path: 'template2',
    loadComponent: () => import('./template2/template2.component').then(m => m.Template2Component)
  },
  {
    path: 'template3',
    loadComponent: () => import('./template3/template3.component').then(m => m.Template3Component)
  },
  {
    path: 'template4',
    loadComponent: () => import('./template4/template4.component').then(m => m.Template4Component)
  },
  {
    path: 'template5',
    loadComponent: () => import('./template5/template5.component').then(m => m.Template5Component)
  },
];
