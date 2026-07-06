import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar';
import { GameService } from '../../service/game.service';
import { AuthService } from '../../service/auth.service';
import {
  trigger, transition, style, animate
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

export const fadeSlideIn = trigger('fadeSlideIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(24px)' }),
    animate('400ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterLink],
  templateUrl: './resultados.html',
  styleUrl: './resultados.css',
  animations: [fadeSlideIn]
})
export class ResultadosComponent implements OnInit {
  isAdmin = false;

  // Scores por juego
  ahorcadoScores: ScoreEntry[] = [];
  mayorMenorScores: ScoreEntry[] = [];
  preguntadosScores: ScoreEntry[] = [];
  trucoScores: ScoreEntry[] = [];

  loading: boolean = true;

  constructor(
    private gameService: GameService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.isAdmin = await this.authService.checkIsAdmin();
    await this.loadAll();
  }

  async loadAll() {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const [ahorcado, mayorMenor, preguntados, truco] = await Promise.all([
        this.gameService.getScoresByGame('ahorcado'),
        this.gameService.getScoresByGame('mayor_menor'),
        this.gameService.getScoresByGame('preguntados'),
        this.gameService.getScoresByGame('truco')
      ]);

      this.ahorcadoScores = this.processScores(ahorcado || []);
      this.mayorMenorScores = this.processScores(mayorMenor || []);
      this.preguntadosScores = this.processScores(preguntados || []);
      this.trucoScores = this.processScores(truco || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
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
}
