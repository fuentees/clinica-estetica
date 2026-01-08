import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase"; // Confirme se o caminho do supabase está certo

// Tipos de usuários aceitos
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
  clinic_id: string | null;
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
  // Permissões
  isAdmin: boolean;
  isProfessional: boolean;
  isReceptionist: boolean;
  isPatient: boolean;
  // Ações
  signIn: (credentials: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca os dados da tabela 'profiles'
  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Erro ao buscar perfil:", error.message);
      }

      if (data) {
        mountProfile(data);
        return;
      }

      // Fallback: Tenta buscar nos metadados do Auth se não achar na tabela
      const userMeta = (await supabase.auth.getUser()).data.user?.user_metadata;
      if (userMeta && userMeta.profileId) {
        const { data: fallbackData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userMeta.profileId)
          .maybeSingle();
        
        if (fallbackData) {
            mountProfile(fallbackData);
            return;
        }
      }

      setProfile(null);

    } catch (err) {
      console.error("❌ Erro interno no AuthContext:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  // Monta o objeto perfil tratando variações de nome de coluna
  function mountProfile(data: any) {
    const rawClinicId = data.clinic_id || data.clinicId || null;
    const userRole = (data.role || "paciente") as UserRole;

    const userProfile: Profile = {
      id: data.id,
      email: data.email,
      fullName: data.full_name || data.fullName || "Usuário",
      role: userRole,
      clinic_id: rawClinicId,
      avatarUrl: data.avatar_url || data.avatarUrl || null,
      roleObject: [],
    };

    setProfile(userProfile);
  }

  // Monitora o estado da autenticação (Login/Logout)
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  // Lógica de Permissões: ADMIN VÊ TUDO
  const role = profile?.role ?? "paciente";
  const isSuperUser = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        // Admin é Admin
        isAdmin: isSuperUser,
        // Profissional: É quem tem cargo 'profissional' OU é Admin
        isProfessional: role === "profissional" || isSuperUser,
        // Recepcionista: É quem tem cargo 'recepcionista' OU é Admin
        isReceptionist: role === "recepcionista" || isSuperUser,
        // Paciente: Apenas paciente
        isPatient: role === "paciente",
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
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}