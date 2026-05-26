import { Component, ChangeDetectorRef, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class ChatComponent {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  
  newMessage: string = '';
  isOpen: boolean = false;
  
  constructor(
    public chatService: ChatService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const msgs = this.chatService.messages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;
    
    const user = this.authService.currentUser();
    if (!user) return;
    
    const textToSend = this.newMessage;
    this.newMessage = ''; 
    this.cdr.detectChanges();
    
    try {
      await this.chatService.sendMessage(user.id, textToSend);
    } catch (error) {
      console.error(error);
      this.newMessage = textToSend;
      this.cdr.detectChanges();
    }
  }
}
