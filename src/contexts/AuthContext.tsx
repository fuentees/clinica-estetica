import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// 1. DEFINIÇÃO ESTRITA DOS PERFIS
export type UserRole =
  | 'admin'
  | 'profissional'
  | 'recepcionista'
  | 'paciente'

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
}

interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 2. BUSCA DE PERFIL INTELIGENTE
  async function fetchUserProfile(userId: string, userEmail?: string) {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Auto-correção: Cria perfil se não existir
      if (error && error.code === 'PGRST116' && userEmail) {
        console.warn('Perfil ausente. Criando automaticamente...')
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ 
              id: userId, 
              email: userEmail, 
              role: 'paciente', 
              first_name: 'Novo Usuário' 
          }])
          .select()
          .single()

        if (!createError) {
          data = newProfile
          error = null
          toast.success('Perfil criado automaticamente!')
        }
      }

      if (error) throw error

      if (data) {
        // 3. NORMALIZAÇÃO ESTRITA (O "Pulo do Gato")
        let rawRole = data.role?.toLowerCase() || 'paciente'

        // Mapeia nomes antigos para o padrão novo 'profissional'
        if (['medico', 'doutor', 'esteta', 'esteticista', 'professional'].includes(rawRole)) {
          rawRole = 'profissional'
        }

        setProfile({
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: rawRole as UserRole, // Agora garantimos que bate com a tipagem
        })
      }
    } catch (error: any) {
      console.error('❌ Erro no perfil:', error.message)
      setProfile(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) await fetchUserProfile(sessionUser.id, sessionUser.email)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const sessionUser = session?.user ?? null
        if (sessionUser?.id !== user?.id) {
           setUser(sessionUser)
           if (sessionUser) {
             setLoading(true)
             await fetchUserProfile(sessionUser.id, sessionUser.email)
             setLoading(false)
           } else {
             setProfile(null)
             setLoading(false)
           }
        }
      }
    )
    return () => listener.subscription.unsubscribe()
  }, []) 

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Login realizado com sucesso')
    } catch (error: any) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Credenciais inválidas.')
      } else {
        toast.error('Erro ao conectar.')
      }
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    toast.success('Sessão encerrada.')
  }

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id, user.email)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}