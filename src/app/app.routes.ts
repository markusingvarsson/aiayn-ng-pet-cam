import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'monitor-pet',
    loadComponent: () =>
      import('./components/pet-monitor/pet-monitor.component').then(
        (m) => m.PetMonitorComponent
      ),
  },
];
