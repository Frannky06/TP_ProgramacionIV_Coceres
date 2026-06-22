import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { NavbarComponent } from '../../navbar/navbar';
import { GameService } from '../../../service/game.service';
import { AuthService } from '../../../service/auth.service';
import { RouterLink } from '@angular/router';

interface Question {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  options?: string[];
}

@Component({
  selector: 'app-preguntados',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterLink],
  templateUrl: './preguntados.html',
  styleUrl: './preguntados.css',
})
export class Preguntados implements OnInit {
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  score: number = 0;
  loading: boolean = false;
  gameOver: boolean = false;
  
  constructor(
    private http: HttpClient,
    private gameService: GameService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.startGame();
  }

  async startGame() {
    this.loading = true;
    this.score = 0;
    this.currentQuestionIndex = 0;
    this.gameOver = false;
    this.questions = [];
    this.cdr.detectChanges();

    try {
      const res: any = await lastValueFrom(this.http.get('https://opentdb.com/api.php?amount=10&type=multiple'));
      this.questions = res.results.map((q: any) => {
        // Decode HTML entities
        const decodedQuestion = this.decodeHtml(q.question);
        const decodedCorrect = this.decodeHtml(q.correct_answer);
        const decodedIncorrect = q.incorrect_answers.map((ans: string) => this.decodeHtml(ans));
        
        // Shuffle options
        const options = [...decodedIncorrect, decodedCorrect].sort(() => Math.random() - 0.5);
        
        return {
          ...q,
          question: decodedQuestion,
          correct_answer: decodedCorrect,
          incorrect_answers: decodedIncorrect,
          options
        };
      });
    } catch (error) {
      console.error('Error fetching questions', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  decodeHtml(html: string) {
    if (typeof document !== 'undefined') {
      var txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    }
    return html;
  }

  selectOption(option: string) {
    if (this.gameOver) return;

    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (option === currentQuestion.correct_answer) {
      this.score++;
    }

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.finishGame();
    }
  }

  async finishGame() {
    this.gameOver = true;
    this.cdr.detectChanges();

    const user = this.authService.currentUser();
    if (user) {
      try {
        await this.gameService.saveScore(user.id, 'preguntados', `Aciertos: ${this.score}`);
      } catch (e) {
        console.error('Error saving score:', e);
      }
    }
  }
}
