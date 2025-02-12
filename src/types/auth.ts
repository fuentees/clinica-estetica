export type UserRole = 'admin' | 'professional' | 'receptionist' | 'patient';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}