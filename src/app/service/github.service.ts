import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  location: string | null;
  blog: string | null;
  company: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.github.com/users';

  userData = signal<GitHubUser | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  getUser(username: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<GitHubUser>(`${this.apiUrl}/${username}`).subscribe({
      next: (data) => {
        this.userData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudo obtener datos del usuario de GitHub');
        this.loading.set(false);
        console.error('GitHub API Error:', err);
      }
    });
  }
}
