import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../navbar/navbar';
import { GameService } from '../../../service/game.service';
import { AuthService } from '../../../service/auth.service';

interface Card {
  number: number;
  suit: 'Espadas' | 'Bastos' | 'Oros' | 'Copas';
  power: number;
  envidoValue: number;
}

@Component({
  selector: 'app-truco',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './truco.html',
  styleUrl: './truco.css',
})
export class Truco implements OnInit {
  deck: Card[] = [];
  playerHand: Card[] = [];
  machineHand: Card[] = [];
  
  playerPoints: number = 0;
  machinePoints: number = 0;

  playerScore: number = 0;
  machineScore: number = 0;
  
  playerPlayedCards: Card[] = [];
  machinePlayedCards: Card[] = [];

  gameOver: boolean = false;
  roundOver: boolean = false;
  statusMessage: string = '¡Empieza el juego! Puedes cantar Envido o jugar una carta.';
  
  envidoPlayed: boolean = false;

  constructor(
    private gameService: GameService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.startRound();
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

        this.deck.push({ number: num, suit, power, envidoValue });
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
    this.roundOver = false;
    this.statusMessage = 'Tu turno. Juega una carta o canta Envido.';
    this.cdr.detectChanges();
  }

  calculateEnvido(hand: Card[]): number {
    let maxEnvido = 0;
    // Buscamos pares del mismo palo
    for (let i = 0; i < hand.length; i++) {
      for (let j = i + 1; j < hand.length; j++) {
        if (hand[i].suit === hand[j].suit) {
          const points = 20 + hand[i].envidoValue + hand[j].envidoValue;
          if (points > maxEnvido) maxEnvido = points;
        }
      }
    }
    // Si no hay par, es la carta más alta
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

    const machineWants = Math.random() > 0.5; // La máquina decide al azar si quiere
    if (machineWants) {
      const pEnvido = this.calculateEnvido(this.playerHand);
      const mEnvido = this.calculateEnvido(this.machineHand);
      
      if (pEnvido >= mEnvido) { // Gana el que es mano (asumimos player es mano en empate)
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

  playCard(index: number) {
    if (this.roundOver || this.gameOver) return;

    const playedCard = this.playerHand.splice(index, 1)[0];
    this.playerPlayedCards.push(playedCard);

    // Máquina juega carta al azar
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
        this.playerPoints += 1;
        this.statusMessage += ' ¡Ganaste la mano! (1 punto)';
      } else {
        this.machinePoints += 1;
        this.statusMessage += ' La máquina gana la mano. (1 punto)';
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
    const user = this.authService.currentUser();
    if (user) {
      try {
        await this.gameService.saveScore(user.id, 'truco', `Puntos: ${this.playerPoints}`);
      } catch (e) {
        console.error('Error saving score:', e);
      }
    }
  }
}
