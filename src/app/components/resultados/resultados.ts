import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar';
import { GameService } from '../../service/game.service';

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

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './resultados.html',
  styleUrl: './resultados.css',
})
export class ResultadosComponent implements OnInit {
  ahorcadoScores: ScoreEntry[] = [];
  mayorMenorScores: ScoreEntry[] = [];
  preguntadosScores: ScoreEntry[] = [];
  trucoScores: ScoreEntry[] = [];
  
  loading: boolean = true;

  constructor(
    private gameService: GameService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAllScores();
  }

  async loadAllScores() {
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
      console.error('Error fetching scores:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  processScores(data: any[]): ScoreEntry[] {
    return data.map(item => {
      // Extraer el número del string para poder ordenar
      // Ej. "Aciertos: 5" -> 5
      let num = 0;
      if (item.score) {
        const match = item.score.match(/\d+/);
        if (match) {
          num = parseInt(match[0], 10);
        }
      }
      return { ...item, numericScore: num };
    }).sort((a, b) => (b.numericScore || 0) - (a.numericScore || 0)); // Orden de mayor a menor
  }

  getUserName(entry: ScoreEntry): string {
    if (entry.users) {
      return `${entry.users.nombre} ${entry.users.apellido}`.trim() || entry.users.correo;
    }
    return 'Usuario Desconocido';
  }
}
