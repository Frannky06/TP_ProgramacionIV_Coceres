import { Component, ChangeDetectorRef } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
      password: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;
    
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
    const { correo, password } = this.loginForm.value;

    try {
      await this.authService.login(correo, password);
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error(error);
      this.errorMessage = 'Correo o contraseña incorrectos.';
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Inicio de sesión rápido para pruebas
  async quickLogin(type: 'admin' | 'user' | 'tester') {
    let email = '';
    let pass = '123456';

    if (type === 'admin') email = 'admin1@userhub.com';
    if (type === 'user') email = 'user@userhub.com';
    if (type === 'tester') email = 'tester@userhub.com';

    this.loginForm.patchValue({ correo: email, password: pass });
    
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      await this.authService.login(email, pass);
      this.router.navigate(['/home']);
    } catch (error: any) {
      // Si el usuario no existe, lo creamos automáticamente para facilitar el testeo
      try {
        const perfil = type === 'admin' ? 'admin' : 'usuario';
        await this.authService.register(email, pass, type.toUpperCase(), 'Test', 25, perfil);
        await this.authService.login(email, pass); // Aseguramos el login tras registro
        this.router.navigate(['/home']);
      } catch (e) {
        console.error('Error auto-creando usuario:', e);
        this.errorMessage = 'No se pudo iniciar sesión ni crear el usuario rápido. Verifica tu conexión.';
      }
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
