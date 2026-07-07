import { Component, ChangeDetectorRef } from '@angular/core';
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const nombreApellidoPattern = "^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+(?:[ '-][A-Za-zÁÉÍÓÚÑÜáéíóúñü]+)*$";

    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(nombreApellidoPattern)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.pattern(nombreApellidoPattern)]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(120)]],
      correo: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.registroForm.controls; }

  async onSubmit() {
    if (this.registroForm.invalid) return;
    
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
    const { correo, password, nombre, apellido, edad } = this.registroForm.value;

    try {
      await this.authService.register(correo, password, nombre, apellido, edad);
      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error(error);
      let msg = 'Error al registrar el usuario. Es posible que el correo ya esté en uso.';
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('user already registered') || errorMsg.includes('already in use')) {
          msg = 'El correo electrónico ya está registrado.';
        } else if (errorMsg.includes('password')) {
          msg = 'La contraseña es demasiado débil (debe tener al menos 6 caracteres).';
        } else if (errorMsg.includes('invalid email')) {
          msg = 'El correo electrónico no es válido.';
        } else if (errorMsg.includes('rate limit')) {
          msg = 'Demasiados intentos. Por favor, inténtelo de nuevo más tarde.';
        }
      }
      this.errorMessage = msg;
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
