import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  trigger, transition, style, animate, query, stagger
} from '@angular/animations';

interface EncuestaEntry {
  id: string;
  user_id: string;
  nombre: string;
  apellido: string;
  edad: number;
  telefono: string;
  juego_favorito: string;
  frecuencia_juego: string;
  caracteristicas_valoradas: string;
  sugerencia: string;
  recomienda: boolean;
  created_at: string;
}

export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px)' }),
    animate('400ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const tableRowsAnim = trigger('tableRowsAnim', [
  transition(':enter', [
    query('tr', [
      style({ opacity: 0, transform: 'translateX(-16px)' }),
      stagger(40, [
        animate('300ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ], { optional: true })
  ])
]);

@Component({
  selector: 'app-resultados-encuestas',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './resultados-encuestas.html',
  styleUrl: './resultados-encuestas.css',
  animations: [fadeSlideIn, tableRowsAnim]
})
export class ResultadosEncuestasComponent implements OnInit {
  encuestas: EncuestaEntry[] = [];
  loading: boolean = true;
  supabase: SupabaseClient;

  constructor(private cdr: ChangeDetectorRef) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    this.loading = true;
    this.cdr.detectChanges();

    const { data, error } = await this.supabase
      .from('encuestas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading encuestas:', error);
    }
    this.encuestas = data || [];

    this.loading = false;
    this.cdr.detectChanges();
  }

  get totalEncuestas(): number { return this.encuestas.length; }
  get recomiendan(): number { return this.encuestas.filter(e => e.recomienda).length; }
  get juegoFavorito(): string {
    if (!this.encuestas.length) return 'N/A';
    const counts: Record<string, number> = {};
    this.encuestas.forEach(e => {
      counts[e.juego_favorito] = (counts[e.juego_favorito] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  }
}
