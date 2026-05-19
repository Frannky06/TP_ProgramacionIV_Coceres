import { Injectable, signal, computed } from '@angular/core';
import { UserCard } from '../components/user-card/user-card';
import { User, MOCK_USERS, UserFilter } from '../models/user.model';



@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users = signal<User[]>(MOCK_USERS);
  private filter = signal<UserFilter>('all');
  readonly allUsers = this.users.asReadonly();
  totalCount = computed(() => this.users().length);

  filterUsers = computed(() => {
    const currentFilter = this.filter();
    const allUsers = this.users();
    if (currentFilter === 'active') {
      return allUsers.filter(u => u.isActive);
    }

    if (currentFilter === 'inactive') {
      return allUsers.filter(u => !u.isActive);
    }
    return allUsers;

  });
}
