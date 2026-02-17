import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'asteroids',
    loadComponent: () => import('./features/asteroids/asteroids.component').then(m => m.AsteroidsComponent),
  },
  {
    path: 'mars',
    loadComponent: () => import('./features/mars/mars.component').then(m => m.MarsComponent),
  },
  {
    path: 'gallery',
    loadComponent: () => import('./features/gallery/gallery.component').then(m => m.GalleryComponent),
  },
  { path: '**', redirectTo: '' },
];
