import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';
import { adminGuard } from './guards/admin.guard';


export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.LoginComponent), canActivate: [publicGuard] },
  { path: 'registro', loadComponent: () => import('./components/registro/registro').then(m => m.RegistroComponent), canActivate: [publicGuard] },
  { path: 'home', loadComponent: () => import('./components/home/home').then(m => m.HomeComponent) },
  { path: 'quien-soy', loadComponent: () => import('./components/quien-soy/quien-soy').then(m => m.QuienSoyComponent) },
  { path: 'game/ahorcado', loadComponent: () => import('./components/game/ahorcado/ahorcado').then(m => m.Ahorcado), canActivate: [authGuard] },
  { path: 'game/mayor-menor', loadComponent: () => import('./components/game/mayor-menor/mayor-menor').then(m => m.MayorMenor), canActivate: [authGuard] },
  { path: 'game/preguntados', loadComponent: () => import('./components/game/preguntados/preguntados').then(m => m.Preguntados), canActivate: [authGuard] },
  { path: 'game/truco', loadComponent: () => import('./components/game/truco/truco').then(m => m.Truco), canActivate: [authGuard] },
  { path: 'encuesta', loadComponent: () => import('./components/encuesta/encuesta').then(m => m.EncuestaComponent), canActivate: [authGuard] },
  { path: 'resultados', loadComponent: () => import('./components/resultados/resultados').then(m => m.ResultadosComponent), canActivate: [authGuard] },
  { path: 'resultados/encuestas', loadComponent: () => import('./components/resultados-encuestas/resultados-encuestas').then(m => m.ResultadosEncuestasComponent), canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: 'home' }
];
