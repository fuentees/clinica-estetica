export type UserRole = 'admin' | 'professional' | 'receptionist' | 'patient';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string; // Adicionado: Essencial para o visual premium do dashboard
  createdAt: string;
  // Campos técnicos opcionais para controle de sessão
  lastLoginAt?: string;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  session: any | null; // Adicionado: Para armazenar o token da sessão do Supabase
  loading: boolean;
  initialized: boolean; // Adicionado: Para evitar flashes de tela de login antes da verificação
}