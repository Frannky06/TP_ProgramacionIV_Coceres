import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroComponent {
  registroForm: FormGroup;
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registroForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(1), Validators.max(120)]],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.registroForm.invalid) return;
    
    this.loading = true;
    this.errorMessage = '';
    const { correo, password, nombre, apellido, edad } = this.registroForm.value;

    try {
      await this.authService.register(correo, password, nombre, apellido, edad);
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error(error);
      this.errorMessage = error.message || 'Error al registrar el usuario. Es posible que el correo ya esté en uso.';
    } finally {
      this.loading = false;
    }
  }
}
