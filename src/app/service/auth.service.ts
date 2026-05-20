import { Injectable, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface UserProfile {
  id: string;
  correo: string;
  nombre: string;
  apellido: string;
  edad: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  
  // Signals para el estado
  public currentUser = signal<User | null>(null);
  public currentUserProfile = signal<UserProfile | null>(null);
  public loading = signal<boolean>(true);
  
  // Computed
  public isLoggedIn = computed(() => this.currentUser() !== null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    // Solo suscribirse a eventos de auth en el navegador (evita errores en SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.supabase.auth.getSession().then(({ data: { session } }) => {
        this.currentUser.set(session?.user || null);
        if (session?.user) {
          this.loadUserProfile(session.user.id);
        } else {
          this.loading.set(false);
        }
      });

      this.supabase.auth.onAuthStateChange((_event, session) => {
        this.currentUser.set(session?.user || null);
        if (session?.user) {
          this.loadUserProfile(session.user.id);
        } else {
          this.currentUserProfile.set(null);
          this.loading.set(false);
        }
      });
    } else {
      this.loading.set(false);
    }
  }

  private async loadUserProfile(userId: string) {
    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (data) {
      this.currentUserProfile.set(data as UserProfile);
    } else {
      console.error('Error fetching user profile:', error);
    }
    this.loading.set(false);
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  async register(email: string, password: string, nombre: string, apellido: string, edad: number) {
    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // 2. Guardar los datos extra en la tabla 'users'
      const { error: dbError } = await this.supabase.from('users').insert({
        id: authData.user.id,
        correo: email,
        nombre: nombre,
        apellido: apellido,
        edad: edad
      });

      if (dbError) throw dbError;
    }
    
    return authData;
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
}
