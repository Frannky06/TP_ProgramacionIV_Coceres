import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  trigger, transition, style, animate, query, stagger
} from '@angular/animations';

export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(30px)' }),
    animate('400ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 0, transform: 'translateY(-20px)' }))
  ])
]);

export const staggerList = trigger('staggerList', [
  transition(':enter', [
    query('.form-group, .form-row', [
      style({ opacity: 0, transform: 'translateX(-20px)' }),
      stagger(60, [
        animate('350ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ], { optional: true })
  ])
]);

@Component({
  selector: 'app-encuesta',
  standalone: true,
  imports: [CommonModule, NavbarComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './encuesta.html',
  styleUrl: './encuesta.css',
  animations: [fadeSlideIn, staggerList]
})
export class EncuestaComponent {
  encuestaForm: FormGroup;
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  submitted: boolean = false;
  supabase: SupabaseClient;

  // Opciones para las preguntas
  nivelesExperiencia = ['Principiante', 'Intermedio', 'Avanzado', 'Experto'];
  frecuencias = ['Diariamente', 'Varias veces a la semana', 'Una vez a la semana', 'Ocasionalmente'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    const nombreApellidoPattern = "^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+(?:[ '-][A-Za-zÁÉÍÓÚÑÜáéíóúñü]+)*$";

    this.encuestaForm = this.fb.group({
      // Datos personales
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.pattern(nombreApellidoPattern)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.pattern(nombreApellidoPattern)]],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      telefono: ['', [Validators.required, Validators.pattern('^[0-9]{1,10}$')]],

      // Pregunta 1: Radio buttons - Juego favorito
      juego_favorito: ['', Validators.required],

      // Pregunta 2: Select - Frecuencia de juego
      frecuencia_juego: ['', Validators.required],

      // Pregunta 3: Checkboxes - Características valoradas (al menos 1)
      valora_diseno: [false],
      valora_dificultad: [false],
      valora_variedad: [false],
      valora_multijugador: [false],

      // Pregunta 4: Textarea - Sugerencia
      sugerencia: ['', [Validators.required, Validators.minLength(10)]],

      // Pregunta 5: Checkbox - Recomendaría
      recomienda: [false, Validators.requiredTrue]
    }, { validators: this.atLeastOneCheckbox });
  }

  // Validador personalizado: al menos un checkbox de características seleccionado
  atLeastOneCheckbox(group: FormGroup): { [key: string]: boolean } | null {
    const fields = ['valora_diseno', 'valora_dificultad', 'valora_variedad', 'valora_multijugador'];
    const hasOne = fields.some(f => group.get(f)?.value === true);
    return hasOne ? null : { atLeastOneRequired: true };
  }

  get f() { return this.encuestaForm.controls; }

  get noCheckboxSelected(): boolean {
    return this.submitted && !!this.encuestaForm.errors?.['atLeastOneRequired'];
  }

  async onSubmit() {
    this.submitted = true;
    if (this.encuestaForm.invalid) {
      this.encuestaForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();

    const user = this.authService.currentUser();
    if (!user) {
      this.errorMessage = 'Debes iniciar sesión para enviar una encuesta.';
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const v = this.encuestaForm.value;
    const caracteristicas: string[] = [];
    if (v.valora_diseno) caracteristicas.push('Diseño');
    if (v.valora_dificultad) caracteristicas.push('Dificultad');
    if (v.valora_variedad) caracteristicas.push('Variedad de juegos');
    if (v.valora_multijugador) caracteristicas.push('Multijugador');

    try {
      const { error } = await this.supabase.from('encuestas').insert({
        user_id: user.id,
        nombre: v.nombre,
        apellido: v.apellido,
        edad: Number(v.edad),
        telefono: v.telefono,
        juego_favorito: v.juego_favorito,
        frecuencia_juego: v.frecuencia_juego,
        caracteristicas_valoradas: caracteristicas.join(', '),
        sugerencia: v.sugerencia,
        recomienda: v.recomienda
      });

      if (error) throw error;

      this.successMessage = '¡Encuesta enviada exitosamente! Gracias por tus respuestas. 🎉';
      this.encuestaForm.reset();
      this.submitted = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 3000);
    } catch (e: any) {
      console.error(e);
      this.errorMessage = 'Error al enviar la encuesta: ' + (e.message || 'Intenta de nuevo.');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
}
