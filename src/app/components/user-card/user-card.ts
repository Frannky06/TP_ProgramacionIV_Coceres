import { Component, input, output } from '@angular/core';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-card',
  imports: [],
  templateUrl: './user-card.html',
  styleUrl: './user-card.css',
})
export class UserCard {
  user = input.required<User>();
  onToggleStatus = output<number>();
  onDelete = output<number>();

  toggleStatus(): void {
    this.onToggleStatus.emit(this.user().id);
  }

  deleteUser(): void {
    this.onDelete.emit(this.user().id);
  }
}
