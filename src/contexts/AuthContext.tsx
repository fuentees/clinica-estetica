import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// --- 1. DEFINIÇÃO DE TIPOS ---
export type UserRole = 'admin' | 'profissional' | 'recepcionista' | 'paciente';

interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  clinicId: string | null;
  avatarUrl?: string | null;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isProfessional: boolean;
  signIn: (credentials: SignInData) => Promise<void>; 
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- 2. GERENCIAMENTO DE SESSÃO ---
  useEffect(() => {
    // Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- 3. BUSCA DE PERFIL (SINC COM SEED/PRISMA) ---
  async function fetchProfile(userId: string) {
    try {
      // Buscamos todos os campos para mapear os nomes snake_case do Postgres para camelCase do React
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Erro ao buscar perfil:", error);
      }

      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          fullName: data.full_name || data.fullName || "Usuário", 
          role: (data.role as UserRole) || "paciente",
          clinicId: data.clinic_id || data.clinicId || null, 
          avatarUrl: data.avatar_url || data.avatarUrl || null,
        });
      }
    } catch (error) {
      console.error("Erro interno no fetchProfile:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- 4. AÇÕES DE AUTENTICAÇÃO ---
  async function signIn({ email, password }: SignInData) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  // --- 5. COMPUTAÇÃO DE PERMISSÕES ---
  const isAdmin = profile?.role === "admin";
  const isProfessional = profile?.role === "profissional" || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin,
        isProfessional,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}