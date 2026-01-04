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

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error("Erro ao buscar perfil no Supabase:", error)
        return;
      }

      if (data) {
        // --- CORREÇÃO AQUI ---
        // 1. Pega o nome completo onde quer que ele esteja (full_name ou fullName)
        const dbName = data.full_name || data.fullName || data.name || 'Usuário';
        
        // 2. Separa em Primeiro e Último nome (para manter compatibilidade)
        const nameParts = dbName.split(' ');
        const firstName = nameParts[0] || 'Usuário';
        const lastName = nameParts.slice(1).join(' ') || '';

        // 3. Normaliza o cargo
        let rawRole = data.role?.toLowerCase() || 'paciente'
        if (['medico', 'doutor', 'esteta', 'esteticista', 'professional'].includes(rawRole)) {
          rawRole = 'profissional'
        }

        setProfile({
          id: data.id,
          email: data.email,
          first_name: firstName, // Agora preenchido corretamente
          last_name: lastName,   // Agora preenchido corretamente
          role: rawRole as UserRole,
        })
      }
    } catch (err) {
      console.error("Erro geral ao buscar perfil:", err)
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          if (session?.user) {
            console.log("Sessão encontrada. Buscando perfil...")
            setUser(session.user)
            await fetchUserProfile(session.user.id)
          } else {
            console.log("Nenhuma sessão ativa.")
            setUser(null)
            setProfile(null)
          }
        }
      } catch (error) {
        console.error("ERRO CRÍTICO NA AUTH:", error)
      } finally {
        if (mounted) {
          console.log("Destravando tela...")
          setLoading(false)
        }
      }
    }

    initAuth()

    // Trava de Segurança: Se em 3 segundos não carregar, libera a força
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("⚠️ Auth demorou demais. Forçando abertura da tela.")
        setLoading(false)
      }
    }, 3000)

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user)
        // Só busca o perfil se o usuário mudou
        if (session.user.id !== user?.id) {
            await fetchUserProfile(session.user.id)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
      listener.subscription.unsubscribe()
    }
  }, []) // Removido dependencia 'user' para evitar loop infinito

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) await fetchUserProfile(data.user.id)
    } catch (error: any) {
      console.error(error)
      toast.error('Erro ao entrar: ' + error.message)
      throw error
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    window.location.href = '/'
  }

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, refreshProfile }}>
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-500">Carregando sistema...</p>
            <button 
              onClick={() => setLoading(false)} 
              className="mt-4 text-xs text-red-500 underline hover:text-red-700"
            >
              Travou? Clique aqui para destravar.
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}