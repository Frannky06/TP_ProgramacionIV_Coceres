import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegistroComponent } from './components/registro/registro';
import { HomeComponent } from './components/home/home';
import { QuienSoyComponent } from './components/quien-soy/quien-soy';
import { publicGuard } from './guards/public.guard';
import { authGuard } from './guards/auth.guard';
import { Ahorcado } from './components/game/ahorcado/ahorcado';
import { MayorMenor } from './components/game/mayor-menor/mayor-menor';
import { Preguntados } from './components/game/preguntados/preguntados';
import { Truco } from './components/game/truco/truco';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'registro', component: RegistroComponent, canActivate: [publicGuard] },
  { path: 'home', component: HomeComponent },
  { path: 'quien-soy', component: QuienSoyComponent },
  { path: 'game/ahorcado', component: Ahorcado, canActivate: [authGuard] },
  { path: 'game/mayor-menor', component: MayorMenor, canActivate: [authGuard] },
  { path: 'game/preguntados', component: Preguntados, canActivate: [authGuard] },
  { path: 'game/truco', component: Truco, canActivate: [authGuard] },
  { path: '**', redirectTo: 'home' }
];
