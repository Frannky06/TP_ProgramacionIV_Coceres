import { Component, signal, computed, inject } from '@angular/core';
import { UserCard } from '../user-card/user-card';
import { User, MOCK_USERS } from '../../models/user.model';
import { UserService } from '../../service/user';


@Component({
  selector: 'app-user-list',
  imports: [UserCard],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList {
  private userService = inject(UserService);
  subtitle = 'Gestion de usuarios';
  users = this.userService.allUsers;
  filteredUsers = this.userService.filterUsers;

  totalCount = computed(() => this.users().length);
  activeCount = computed(() => this.users().filter(u => u.isActive).length);

  addUser(user: Omit<User, 'id' | 'createdAt'>): void {
    const newUser: User = {
      ...user,
      id: Date.now(),
      createdAt: new Date()
    };
    // Note: Cannot update a readonly signal directly.
    // This should be handled through UserService in a future sprint.
  }

  deleteUser(userId: number): void {
    // Should be handled through UserService
  }

  toggleUserStatus(userId: number): void {
    // Should be handled through UserService
  }
}
