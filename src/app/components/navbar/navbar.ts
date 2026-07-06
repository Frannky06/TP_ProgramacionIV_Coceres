import { Component, effect, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  isAdmin = signal(false);

  constructor(public authService: AuthService, private router: Router) {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        this.isAdmin.set(false);
        return;
      }
      this.authService.checkIsAdmin().then(result => this.isAdmin.set(result));
    });
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
