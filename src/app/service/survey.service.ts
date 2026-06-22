import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface SurveyResponse {
  id?: string;
  user_id: string;
  nombre: string;
  apellido: string;
  edad: number;
  telefono: string;
  juego_favorito: string;
  recomienda: boolean;
  sugerencia: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async saveResponse(response: SurveyResponse): Promise<void> {
    const { error } = await this.supabase.from('encuestas').insert(response);
    if (error) throw error;
  }

  async getAllResponses(): Promise<SurveyResponse[]> {
    const { data, error } = await this.supabase.from('encuestas').select('*');
    if (error) throw error;
    return data as SurveyResponse[];
  }
}
