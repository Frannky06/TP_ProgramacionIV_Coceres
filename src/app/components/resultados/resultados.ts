import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { GameService } from '../../service/game.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  trigger, transition, style, animate, query, stagger
} from '@angular/animations';

interface ScoreEntry {
  user_id: string;
  game_name: string;
  score: string;
  created_at: string;
  users?: {
    correo: string;
    nombre: string;
    apellido: string;
  };
  numericScore?: number;
}

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
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './resultados.html',
  styleUrl: './resultados.css',
  animations: [fadeSlideIn, tableRowsAnim]
})
export class ResultadosComponent implements OnInit {
  isAdmin = false;

  // Scores por juego
  ahorcadoScores: ScoreEntry[] = [];
  mayorMenorScores: ScoreEntry[] = [];
  preguntadosScores: ScoreEntry[] = [];
  trucoScores: ScoreEntry[] = [];

  // Encuestas
  encuestas: EncuestaEntry[] = [];

  loading: boolean = true;
  activeTab: 'scores' | 'encuestas' = 'scores';
  supabase: SupabaseClient;

  constructor(
    private gameService: GameService,
    private cdr: ChangeDetectorRef
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    await this.loadAdminStatus();
    await this.loadAll();
  }

  private async loadAdminStatus() {
    const { data: { session } } = await this.supabase.auth.getSession();

    const metadataRole =
      session?.user?.app_metadata?.['role'] ??
      session?.user?.user_metadata?.['role'] ??
      session?.user?.user_metadata?.['perfil'];

    if (typeof metadataRole === 'string' && metadataRole.toLowerCase() === 'admin') {
      this.isAdmin = true;
      return;
    }

    const { data, error } = await this.supabase
      .from('roles')
      .select('role')
      .eq('user_id', session?.user?.id ?? '')
      .maybeSingle();

    this.isAdmin = !error && typeof data?.role === 'string' && data.role.toLowerCase() === 'admin';
  }

  async loadAll() {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const [ahorcado, mayorMenor, preguntados, truco, encuestasData] = await Promise.all([
        this.gameService.getScoresByGame('ahorcado'),
        this.gameService.getScoresByGame('mayor_menor'),
        this.gameService.getScoresByGame('preguntados'),
        this.gameService.getScoresByGame('truco'),
        this.isAdmin ? this.loadEncuestas() : Promise.resolve([])
      ]);

      this.ahorcadoScores = this.processScores(ahorcado || []);
      this.mayorMenorScores = this.processScores(mayorMenor || []);
      this.preguntadosScores = this.processScores(preguntados || []);
      this.trucoScores = this.processScores(truco || []);
      this.encuestas = encuestasData || [];

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async loadEncuestas(): Promise<EncuestaEntry[]> {
    const { data, error } = await this.supabase
      .from('encuestas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading encuestas:', error);
      return [];
    }
    return data || [];
  }

  processScores(data: any[]): ScoreEntry[] {
    return data.map(item => {
      let num = 0;
      if (item.score) {
        const aciertosMatch = item.score.match(/Aciertos:\s*(\d+)/i);
        const puntosMatch = item.score.match(/Puntos:\s*(\d+)/i);

        if (aciertosMatch) {
          num = parseInt(aciertosMatch[1], 10);
        } else if (puntosMatch) {
          num = parseInt(puntosMatch[1], 10);
        } else {
          const match = item.score.match(/\d+/);
          if (match) num = parseInt(match[0], 10);
        }
      }
      return { ...item, numericScore: num };
    }).sort((a, b) => (b.numericScore || 0) - (a.numericScore || 0));
  }

  getUserName(entry: ScoreEntry): string {
    if (entry.users) {
      return `${entry.users.nombre} ${entry.users.apellido}`.trim() || entry.users.correo;
    }
    return 'Usuario Desconocido';
  }

  setTab(tab: 'scores' | 'encuestas') {
    if (tab === 'encuestas' && !this.isAdmin) {
      return;
    }
    this.activeTab = tab;
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
