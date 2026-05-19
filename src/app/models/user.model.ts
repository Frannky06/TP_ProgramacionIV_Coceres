export interface User {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    avatar?: string;
    isActive: boolean;
    createdAt: Date;

}
export type UserFilter = 'all' | 'active' | 'inactive' ;

export const MOCK_USERS: User[] = [
    {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@example.com',
        isActive: true,
        createdAt: new Date('2023-01-01')
    },
    {
        id: 2,
        nombre: 'María',
        apellido: 'Gómez',
        email: 'maria.gomez@example.com',
        isActive: false,
        createdAt: new Date('2023-02-01')
    },
    {
        id: 3,
        nombre: 'Carlos',
        apellido: 'López',
        email: 'carlos.lopez@example.com',
        isActive: true,
        createdAt: new Date('2023-03-01')
    }

];