import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar';
import { GameService } from '../../../service/game.service';
import { AuthService } from '../../../service/auth.service';
import { RouterLink } from '@angular/router';

interface Card {
  number: number;
  suit: 'Espadas' | 'Bastos' | 'Oros' | 'Copas';
  power: number;
  envidoValue: number;
  icon?: string;
}

@Component({
  selector: 'app-truco',
  standalone: true,
  imports: [CommonModule, NavbarComponent, RouterLink],
  templateUrl: './truco.html',
  styleUrl: './truco.css',
})
export class Truco implements OnInit, OnDestroy {
  deck: Card[] = [];
  playerHand: Card[] = [];
  machineHand: Card[] = [];
  
  playerPoints: number = 0;
  machinePoints: number = 0;

  playerPlayedCards: Card[] = [];
  machinePlayedCards: Card[] = [];

  gameOver: boolean = false;
  roundOver: boolean = false;
  statusMessage: string = '¡Empieza el juego! Puedes cantar Envido o jugar una carta.';
  
  envidoPlayed: boolean = false;

  trucoValue: number = 1;
  trucoCantado: boolean = false;

  gameStartTime: number = 0;
  elapsedSeconds: number = 0;
  timerInterval: any;

  suitIcons = {
    'Espadas': '🗡️',
    'Bastos': '🍡',
    'Oros': '🥇',
    'Copas': '🍷'
  };

  constructor(
    private gameService: GameService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.startGame();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startGame() {
    this.playerPoints = 0;
    this.machinePoints = 0;
    this.gameOver = false;
    this.gameStartTime = Date.now();
    this.elapsedSeconds = 0;
    
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
      this.cdr.detectChanges();
    }, 1000);

    this.startRound();
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get formattedTime(): string {
    const m = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
    const s = (this.elapsedSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  generateDeck() {
    const suits: ('Espadas' | 'Bastos' | 'Oros' | 'Copas')[] = ['Espadas', 'Bastos', 'Oros', 'Copas'];
    const numbers = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    this.deck = [];

    for (const suit of suits) {
      for (const num of numbers) {
        let power = 0;
        if (num === 1 && suit === 'Espadas') power = 14;
        else if (num === 1 && suit === 'Bastos') power = 13;
        else if (num === 7 && suit === 'Espadas') power = 12;
        else if (num === 7 && suit === 'Oros') power = 11;
        else if (num === 3) power = 10;
        else if (num === 2) power = 9;
        else if (num === 1 && (suit === 'Copas' || suit === 'Oros')) power = 8;
        else if (num === 12) power = 7;
        else if (num === 11) power = 6;
        else if (num === 10) power = 5;
        else if (num === 7 && (suit === 'Copas' || suit === 'Bastos')) power = 4;
        else if (num === 6) power = 3;
        else if (num === 5) power = 2;
        else if (num === 4) power = 1;

        let envidoValue = num >= 10 ? 0 : num;

        this.deck.push({ number: num, suit, power, envidoValue, icon: this.suitIcons[suit] });
      }
    }
    // Shuffle
    this.deck.sort(() => Math.random() - 0.5);
  }

  startRound() {
    this.generateDeck();
    this.playerHand = this.deck.slice(0, 3);
    this.machineHand = this.deck.slice(3, 6);
    this.playerPlayedCards = [];
    this.machinePlayedCards = [];
    this.envidoPlayed = false;
    this.trucoValue = 1;
    this.trucoCantado = false;
    this.roundOver = false;
    this.statusMessage = 'Tu turno. Juega una carta, canta Envido, o vete al mazo.';
    this.cdr.detectChanges();
  }

  calculateEnvido(hand: Card[]): number {
    let maxEnvido = 0;
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        if (hand[i].suit === hand[j].suit) {
          const points = 20 + hand[i].envidoValue + hand[j].envidoValue;
          if (points > maxEnvido) maxEnvido = points;
        }
      }
    }
    if (maxEnvido === 0) {
      for (const card of hand) {
        if (card.envidoValue > maxEnvido) maxEnvido = card.envidoValue;
      }
    }
    return maxEnvido;
  }

  cantarEnvido() {
    if (this.envidoPlayed || this.playerPlayedCards.length > 0) return;
    this.envidoPlayed = true;

    const machineWants = Math.random() > 0.5;
    if (machineWants) {
      const pEnvido = this.calculateEnvido(this.playerHand);
      const mEnvido = this.calculateEnvido(this.machineHand);
      
      if (pEnvido >= mEnvido) {
        this.playerPoints += 2;
        this.statusMessage = `Envido: ¡Quiero! Tienes ${pEnvido}, la máquina ${mEnvido}. ¡Ganaste 2 puntos!`;
      } else {
        this.machinePoints += 2;
        this.statusMessage = `Envido: ¡Quiero! Tienes ${pEnvido}, la máquina ${mEnvido}. La máquina gana 2 puntos.`;
      }
    } else {
      this.playerPoints += 1;
      this.statusMessage = 'Envido: La máquina no quiere. ¡Ganaste 1 punto!';
    }
    this.checkWinner();
  }

  cantarTruco() {
    if (this.trucoCantado || this.roundOver || this.gameOver) return;
    this.trucoCantado = true;

    const rand = Math.random();
    if (rand < 0.25) {
      // No quiero: el que cantó gana 1 punto de inmediato y la mano termina
      this.playerPoints += 1;
      this.statusMessage = 'Truco: ¡No quiero! Ganaste 1 punto y la mano termina.';
      this.roundOver = true;
      this.checkWinner();
      if (!this.gameOver) {
        setTimeout(() => {
          this.startRound();
        }, 2000);
      }
    } else if (rand < 0.5) {
      // Quiero: la ronda pasa a valer 2 puntos
      this.trucoValue = 2;
      this.statusMessage = 'Truco: ¡Quiero! La mano ahora vale 2 puntos.';
    } else if (rand < 0.75) {
      // Retruco: vale 3 puntos
      this.trucoValue = 3;
      this.statusMessage = '¡Retruco! La mano ahora vale 3 puntos.';
    } else {
      // Quiero vale cuatro: vale 4 puntos
      this.trucoValue = 4;
      this.statusMessage = '¡Quiero vale cuatro! La mano ahora vale 4 puntos.';
    }
    this.cdr.detectChanges();
  }

  irseAlMazo() {
    if (this.roundOver || this.gameOver) return;
    this.machinePoints += this.trucoValue;
    this.statusMessage = `Te fuiste al mazo. La máquina gana ${this.trucoValue} punto(s).`;
    this.roundOver = true;
    this.checkWinner();
    
    if (!this.gameOver) {
      setTimeout(() => {
        this.startRound();
      }, 2000);
    }
  }

  playCard(index: number) {
    if (this.roundOver || this.gameOver) return;

    const playedCard = this.playerHand.splice(index, 1)[0];
    this.playerPlayedCards.push(playedCard);

    const machineIndex = Math.floor(Math.random() * this.machineHand.length);
    const mPlayedCard = this.machineHand.splice(machineIndex, 1)[0];
    this.machinePlayedCards.push(mPlayedCard);

    this.statusMessage = `Jugaste ${playedCard.number} de ${playedCard.suit}. La máquina jugó ${mPlayedCard.number} de ${mPlayedCard.suit}.`;

    this.checkRoundStatus();
  }

  checkRoundStatus() {
    let pWins = 0;
    let mWins = 0;
    
    for (let i = 0; i < this.playerPlayedCards.length; i++) {
      if (this.playerPlayedCards[i].power > this.machinePlayedCards[i].power) {
        pWins++;
      } else if (this.machinePlayedCards[i].power > this.playerPlayedCards[i].power) {
        mWins++;
      }
    }

    let roundEnded = false;
    let winner = '';

    if (pWins >= 2) {
      roundEnded = true;
      winner = 'player';
    } else if (mWins >= 2) {
      roundEnded = true;
      winner = 'machine';
    } else if (this.playerPlayedCards.length === 3) {
      roundEnded = true;
      if (pWins >= mWins) winner = 'player';
      else winner = 'machine';
    }

    if (roundEnded) {
      if (winner === 'player') {
        this.playerPoints += this.trucoValue;
        this.statusMessage += ` ¡Ganaste la mano! (${this.trucoValue} punto${this.trucoValue > 1 ? 's' : ''})`;
      } else {
        this.machinePoints += this.trucoValue;
        this.statusMessage += ` La máquina gana la mano. (${this.trucoValue} punto${this.trucoValue > 1 ? 's' : ''})`;
      }

      this.roundOver = true;
      this.checkWinner();

      if (!this.gameOver) {
        setTimeout(() => {
          this.startRound();
        }, 3500);
      }
    }
  }

  checkWinner() {
    if (this.playerPoints >= 15) {
      this.gameOver = true;
      this.statusMessage = '¡Felicidades, ganaste la partida!';
      this.finishGame();
    } else if (this.machinePoints >= 15) {
      this.gameOver = true;
      this.statusMessage = 'La máquina ha ganado la partida.';
      this.finishGame();
    }
    this.cdr.detectChanges();
  }

  async finishGame() {
    this.stopTimer();
    const user = this.authService.currentUser();
    if (user) {
      try {
        await this.gameService.saveScore(user.id, 'truco', `Puntos: ${this.playerPoints}, Tiempo: ${this.elapsedSeconds}s`);
      } catch (e) {
        console.error('Error saving score:', e);
      }
    }
  }
}
