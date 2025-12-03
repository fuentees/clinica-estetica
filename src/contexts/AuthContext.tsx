import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Definindo os tipos de permissão
export type UserRole = 'admin' | 'medico' | 'paciente';

// Definindo como é o perfil do usuário no banco
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

interface AuthContextType {
  user: SupabaseUser | null;     // Usuário técnico do Auth (email, id, last_sign_in)
  profile: UserProfile | null;   // Dados do banco (nome, role/função)
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔄 Verificando sessão...");

    // 1. Checa sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Ouve mudanças (Login/Logout em outras abas, etc)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      // Busca dados na tabela 'profiles'
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        // Se der erro (ex: perfil não criado), definimos null mas não deslogamos
        setProfile(null); 
      } else {
        console.log("✅ Perfil carregado:", data);
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      console.log("✅ Login técnico ok. Buscando perfil para redirecionar...");
      
      // Precisamos buscar o perfil AGORA para saber para onde mandar
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profileData) {
          toast.error("Perfil de usuário não encontrado.");
          return;
        }

        // --- AQUI ESTÁ A MÁGICA DO REDIRECIONAMENTO ---
        const userRole = profileData.role as UserRole;
        
        if (userRole === 'paciente') {
          navigate('/portal'); // Manda paciente para o site dele
          toast.success(`Bem-vindo, ${profileData.full_name || 'Paciente'}!`);
        } else {
          navigate('/'); // Manda Admin/Médico para o Dashboard
          toast.success(`Bem-vindo ao sistema, ${profileData.full_name}!`);
        }
      }

    } catch (error: any) {
      console.error('❌ Erro ao fazer login:', error);
      toast.error('Erro ao entrar: ' + (error.message || 'Verifique seus dados'));
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      navigate('/login');
      toast.success('Você saiu do sistema.');
    } catch (error) {
      toast.error('Erro ao sair.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}