import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../service/game.service';
import { AuthService } from '../../../service/auth.service';
import { NavbarComponent } from '../../navbar/navbar';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './ahorcado.html',
  styleUrl: './ahorcado.css',
})
export class Ahorcado implements OnInit {
  words: string[] = ['ANGULAR', 'SUPABASE', 'TYPESCRIPT', 'PROGRAMACION', 'DESARROLLO', 'FRONTEND', 'FIREBASE', 'JAVASCRIPT', 'BACKEND'];
  word: string = '';
  guessedLetters: string[] = [];
  wrongLetters: string[] = [];
  maxAttempts: number = 6;
  gameStatus: 'playing' | 'won' | 'lost' = 'playing';
  alphabet: string[] = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  startTime: number = 0;

  constructor(
    private gameService: GameService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.startGame();
  }

  startGame() {
    this.word = this.words[Math.floor(Math.random() * this.words.length)];
    this.guessedLetters = [];
    this.wrongLetters = [];
    this.gameStatus = 'playing';
    this.startTime = Date.now();
  }

  guessLetter(letter: string) {
    if (this.gameStatus !== 'playing' || this.guessedLetters.includes(letter) || this.wrongLetters.includes(letter)) return;

    if (this.word.includes(letter)) {
      this.guessedLetters.push(letter);
      if (this.checkWin()) {
        this.finishGame('won');
      }
    } else {
      this.wrongLetters.push(letter);
      if (this.wrongLetters.length >= this.maxAttempts) {
        this.finishGame('lost');
      }
    }
  }

  checkWin(): boolean {
    return this.word.split('').every(char => this.guessedLetters.includes(char));
  }

  async finishGame(status: 'won' | 'lost') {
    this.gameStatus = status;
    this.cdr.detectChanges();
    
    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
    const user = this.authService.currentUser();
    
    if (user) {
      const scoreData = `Resultado: ${status === 'won' ? 'Victoria' : 'Derrota'}, Tiempo: ${timeTaken}s, Aciertos: ${this.guessedLetters.length}, Errores: ${this.wrongLetters.length}`;
      try {
        await this.gameService.saveScore(user.id, 'ahorcado', scoreData);
      } catch (e) {
        console.error('No se pudo guardar la puntuación', e);
      }
    }
  }

  get displayWord(): string {
    return this.word.split('').map(char => this.guessedLetters.includes(char) ? char : '_').join(' ');
  }
}
