import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../service/game.service';
import { AuthService } from '../../../service/auth.service';
import { NavbarComponent } from '../../navbar/navbar';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ahorcado',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterLink],
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
  score: number = 0; // Number of words guessed correctly

  constructor(
    private gameService: GameService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.startGame();
  }

  startGame() {
    this.score = 0;
    this.wrongLetters = [];
    this.startTime = Date.now();
    this.nextWord();
  }

  nextWord() {
    this.word = this.words[Math.floor(Math.random() * this.words.length)];
    this.guessedLetters = [];
    this.gameStatus = 'playing';
    this.cdr.detectChanges();
  }

  guessLetter(letter: string) {
    if (this.gameStatus !== 'playing' || this.guessedLetters.includes(letter) || this.wrongLetters.includes(letter)) return;

    if (this.word.includes(letter)) {
      this.guessedLetters.push(letter);
      if (this.checkWin()) {
        this.score++;
        this.gameStatus = 'won'; // Temporarily to show success message if needed, or just immediately next word
        this.cdr.detectChanges();
        setTimeout(() => {
          this.nextWord();
        }, 1000);
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
      const scoreData = `Resultado: ${status === 'won' ? 'Victoria' : 'Derrota'}, Tiempo: ${timeTaken}s, Aciertos: ${this.score}, Errores: ${this.wrongLetters.length}`;
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
