import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async saveScore(userId: string, gameName: string, scoreDetails: string) {
    const { error } = await this.supabase
      .from('game_scores')
      .insert({ user_id: userId, game_name: gameName, score: scoreDetails });
      
    if (error) {
      console.error('Error guardando score:', error);
      throw error;
    }
  }

  async getScoresByGame(gameName: string) {
    const { data, error } = await this.supabase
      .from('game_scores')
      .select('*, users(correo, nombre, apellido)')
      .eq('game_name', gameName)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error(`Error obteniendo scores para ${gameName}:`, error);
      throw error;
    }
    return data;
  }
}
