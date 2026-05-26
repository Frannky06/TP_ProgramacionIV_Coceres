import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: number;
  user_id: string;
  text: string;
  created_at: string;
  users?: {
    correo: string;
    nombre: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private supabase: SupabaseClient;
  public messages = signal<ChatMessage[]>([]);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    if (isPlatformBrowser(this.platformId)) {
      this.loadMessages();
      this.subscribeToMessages();
    }
  }

  async loadMessages() {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*, users(correo, nombre)')
      .order('created_at', { ascending: true })
      .limit(100);
      
    if (!error && data) {
      this.messages.set(data as ChatMessage[]);
    }
  }

  private subscribeToMessages() {
    this.supabase.channel('public:chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          this.fetchSingleMessage(payload.new['id']);
        }
      )
      .subscribe();
  }

  private async fetchSingleMessage(id: number) {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*, users(correo, nombre)')
      .eq('id', id)
      .single();
      
    if (!error && data) {
      this.messages.update(msgs => [...msgs, data as ChatMessage]);
    }
  }

  async sendMessage(userId: string, text: string) {
    const { error } = await this.supabase
      .from('chat_messages')
      .insert({ user_id: userId, text });
      
    if (error) {
      console.error('Error enviando mensaje:', error);
      throw error;
    }
  }
}
