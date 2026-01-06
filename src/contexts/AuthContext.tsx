import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type UserRole = "admin" | "profissional" | "recepcionista" | "paciente";

interface Role {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  clinicId: string | null;
  avatarUrl?: string | null;
  roleObject?: Role[] | null;
}

interface SignInData {
  email: string;
  password: string;
}

interface AuthContextData {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isProfessional: boolean;
  isPatient: boolean;
  signIn: (credentials: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- BUSCA PERFIL (MODO ROBUSTO) ---
  async function fetchProfile(userId: string) {
    try {
      console.log("🔍 Buscando perfil para ID:", userId);

      // Usamos select('*') para trazer TODAS as colunas e evitar erro de nome
      const { data, error } = await supabase
        .from("profiles")
        .select('*') 
        .eq("id", userId)
        .single();

      if (error) {
        console.error("❌ Erro ao buscar perfil:", error);
        setProfile(null);
        return;
      }

      console.log("✅ Dados brutos do banco:", data);

      if (data) {
        // Mapeamento Inteligente: Tenta pegar clinicId de várias formas
        // O Postgres pode retornar "clinicId" ou "clinic_id"
        const rawClinicId = data["clinicId"] || data["clinic_id"] || data.clinicId;
        
        // Mapeamento de Role
        const userRole = (data.roleLegacy || data.role || "paciente") as UserRole;

        const userProfile: Profile = {
          id: data.id,
          email: data.email,
          fullName: data.full_name || data.fullName || "Usuário",
          role: userRole,
          clinicId: rawClinicId || null,
          avatarUrl: data.avatar_url || data.avatarUrl || null,
          roleObject: [], 
        };

        console.log("👤 Perfil montado:", userProfile);
        setProfile(userProfile);
      } else {
        console.warn("⚠️ Perfil não encontrado (data é null)");
        setProfile(null);
      }
    } catch (err) {
      console.error("❌ Erro interno no AuthContext:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

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

  const role = profile?.role ?? "paciente";
  const isAdmin = role === "admin";
  const isProfessional = role === "profissional" || role === "admin";
  const isPatient = role === "paciente";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        isProfessional,
        isPatient,
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
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}