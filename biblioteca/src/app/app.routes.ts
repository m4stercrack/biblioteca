import { Routes } from '@angular/router';
import { Main } from './pages/main/main';
import { Login } from './pages/login/login';

export const routes: Routes = [
  { path: '', component: Main },
  { path: 'login', component: Login },
  { path: '**', redirectTo: 'login' },
];
