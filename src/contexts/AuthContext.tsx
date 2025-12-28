import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Definição de cargos COMPLETA
export type UserRole = 
    'admin' | 'profissional' | 'esteticista' | 'esteta' | 'recepcionista' | 
    'medico' | 'doutor' | 'paciente' | 'professional';      

export interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
}

interface AuthContextType {
    user: SupabaseUser | null; 
    profile: UserProfile | null; 
    loading: boolean; 
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    async function fetchUserProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, first_name, last_name, role')
                .eq('id', userId)
                .single();

            if (error) throw error;
            
            setProfile({
                id: data.id,
                email: data.email || '',
                first_name: data.first_name,
                last_name: data.last_name,
                role: data.role as UserRole
            });
        } catch (error) {
            console.error('❌ Erro ao buscar perfil:', error);
            setProfile(null);
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchUserProfile(currentUser.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            
            if (currentUser) {
                fetchUserProfile(currentUser.id).finally(() => setLoading(false));
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            if (data.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('role, first_name')
                    .eq('id', data.user.id)
                    .single();

                const userRole = profileData?.role as UserRole;
                
                if (userRole === 'paciente') {
                    navigate('/portal');
                    toast.success(`Bem-vindo(a), ${profileData?.first_name || 'Cliente'}!`);
                } else {
                    navigate('/');
                    toast.success(`Bem-vindo(a), ${profileData?.first_name || 'Admin'}!`);
                }
            }

        } catch (error: any) {
            console.error('❌ Erro ao fazer login:', error);
            const errorMessage = error.message || 'Erro de conexão ou credenciais.';
            if (errorMessage.includes('Invalid login credentials')) {
                toast.error('Credenciais inválidas. Verifique seu e-mail e senha.');
            } else {
                toast.error('Erro ao entrar: ' + errorMessage);
            }
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            navigate('/login');
            toast.success('Você saiu do sistema.');
        } catch (error: any) {
            toast.error('Erro ao sair.');
            throw error;
        }
    };

    const value: AuthContextType = {
        user, profile, loading, signIn, signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};