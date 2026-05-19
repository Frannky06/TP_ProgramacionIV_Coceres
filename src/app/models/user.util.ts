 import { User } from './user.model';

 export class UserUtil{

    static getFullName(user: User): string {
        return `${user.nombre} ${user.apellido}`;
    }
    static getInitials(user: User) : string {
        return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
    }
    static formatDate(date: Date): string {
        return date.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
 }