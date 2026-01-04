import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase' 
import { toast } from 'react-hot-toast'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'profissional' | 'recepcionista' | 'paciente'

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  clinicId?: string
}

interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchUserProfile(userId: string) {
    try {
      // Busca tudo (*) da tabela profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error;

      if (data) {
        // LÓGICA BLINDADA: Tenta pegar o nome de qualquer lugar possível
        const fullName = data.full_name || data.fullName || data.name || 'Usuário';
        const parts = fullName.split(' ');
        const firstName = data.first_name || parts[0] || 'Usuário';
        const lastName = data.last_name || parts.slice(1).join(' ') || '';
        
        // Garante um cargo válido
        const role = (data.role || 'paciente') as UserRole;

        setProfile({
          id: data.id,
          email: data.email,
          first_name: firstName,
          last_name: lastName,
          role: role,
          clinicId: data.clinicId
        })
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err)
      toast.error("Erro de conexão com o banco de dados.")
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // O onAuthStateChange vai capturar o login e carregar o perfil automaticamente
    } catch (error: any) {
      console.error(error)
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}