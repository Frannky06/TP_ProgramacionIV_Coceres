import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GameService } from '../../../service/game.service';
import { AuthService } from '../../../service/auth.service';
import { NavbarComponent } from '../../navbar/navbar';
import { RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-mayor-menor',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterLink],
  templateUrl: './mayor-menor.html',
  styleUrl: './mayor-menor.css',
})
export class MayorMenor implements OnInit {
  deckId: string = '';
  currentCard: any = null;
  score: number = 0;
  lives: number = 3;
  gameOver: boolean = false;
  loading: boolean = false;
  lastResult: 'win' | 'lose' | 'tie' | null = null;
  
  cardValues: { [key: string]: number } = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'JACK': 11, 'QUEEN': 12, 'KING': 13, 'ACE': 14
  };

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
    this.lives = 3;
    this.gameOver = false;
    this.currentCard = null;
    this.lastResult = null;
    this.cdr.detectChanges();
    
    try {
      const res: any = await lastValueFrom(this.http.get('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1'));
      this.deckId = res.deck_id;
      
      const drawRes: any = await lastValueFrom(this.http.get(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=1`));
      this.currentCard = drawRes.cards[0];
    } catch (error) {
      console.error('Error starting game:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async guess(choice: 'higher' | 'lower') {
    if (this.gameOver || this.loading) return;

    this.loading = true;
    this.cdr.detectChanges();

    try {
      const res: any = await lastValueFrom(this.http.get(`https://deckofcardsapi.com/api/deck/${this.deckId}/draw/?count=1`));
      
      if (!res.cards || res.cards.length === 0) {
        this.finishGame();
        return;
      }
      
      const nextCard = res.cards[0];
      const currentValue = this.cardValues[this.currentCard.value];
      const nextValue = this.cardValues[nextCard.value];

      this.currentCard = nextCard;

      if (nextValue === currentValue) {
        this.lastResult = 'tie';
      } else {
        let wonRound = false;
        if (choice === 'higher' && nextValue > currentValue) wonRound = true;
        if (choice === 'lower' && nextValue < currentValue) wonRound = true;

        if (wonRound) {
          this.score++;
          this.lastResult = 'win';
        } else {
          this.lives--;
          this.lastResult = 'lose';
          if (this.lives <= 0) {
            this.finishGame();
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async finishGame() {
    this.gameOver = true;
    this.cdr.detectChanges();

    const user = this.authService.currentUser();
    if (user) {
      try {
        await this.gameService.saveScore(user.id, 'mayor_menor', `Aciertos: ${this.score}`);
      } catch (e) {
        console.error('Error saving score:', e);
      }
    }
  }
}

