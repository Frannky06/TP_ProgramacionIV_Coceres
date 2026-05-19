import { Component, inject, OnInit } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar';
import { GithubService } from '../../service/github.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-quien-soy',
  imports: [NavbarComponent, DatePipe],
  templateUrl: './quien-soy.html',
  styleUrl: './quien-soy.css'
})
export class QuienSoyComponent implements OnInit {
  githubService = inject(GithubService);

  // Tu usuario de GitHub
  readonly githubUsername = 'Frannky06';

  ngOnInit(): void {
    this.githubService.getUser(this.githubUsername);
  }
}
