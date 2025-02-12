import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔄 Verificando sessão do usuário...");

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔄 Estado de autenticação mudou:", session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      console.log("📥 Buscando perfil do usuário...");
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      console.log("✅ Perfil carregado:", data);
      setUser(data);
    } catch (error) {
      console.error('❌ Erro ao buscar perfil do usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      console.log("✅ Login bem-sucedido!");
      navigate('/');
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error);
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  const signOut = async () => {
    try {
      console.log("🚪 Realizando logout...");
      setUser(null); // Resetando antes de chamar signOut
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
