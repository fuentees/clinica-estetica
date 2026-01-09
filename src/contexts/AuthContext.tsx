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
  isAdmin: boolean;
  isProfessional: boolean;
  isReceptionist: boolean;
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

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) console.error("❌ Erro ao buscar perfil:", error.message);

      if (data) {
        mountProfile(data);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("❌ Erro interno no AuthContext:", err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  function mountProfile(data: any) {
    const userRole = (data.role || "paciente") as UserRole;
    const userProfile: Profile = {
      id: data.id,
      email: data.email,
      fullName: data.full_name || data.fullName || "Usuário",
      role: userRole,
      clinic_id: data.clinic_id || data.clinicId || null,
      avatarUrl: data.avatar_url || data.avatarUrl || null,
      roleObject: [],
    };
    setProfile(userProfile);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
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

  const role = profile?.role ?? "paciente";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin: role === "admin",
        isProfessional: role === "profissional",
        isReceptionist: role === "recepcionista",
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