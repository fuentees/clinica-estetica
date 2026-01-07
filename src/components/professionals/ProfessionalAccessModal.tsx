import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Lock, Key, Mail, Loader2, X, CheckCircle, Fingerprint, Wand2, Briefcase } from 'lucide-react';

interface Props {
  professional: {
    id: string;
    name: string;
    email?: string | null;
    cpf?: string | null;
    phone?: string | null;
    role?: string | null;
  };
  onClose: () => void;
}

export function ProfessionalAccessModal({ professional, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // --- AUTOMAÇÃO ESTRITA: APENAS CPF ---
  // Remove tudo que não for número do CPF
  const cpfClean = professional.cpf ? professional.cpf.replace(/\D/g, '') : '';
  
  // A senha padrão agora é EXCLUSIVAMENTE o CPF limpo.
  // Se não tiver CPF cadastrado, a senha virá vazia.
  const defaultPassword = cpfClean; 

  const [formData, setFormData] = useState({
    email: professional.email || '', 
    password: defaultPassword,
    role: professional.role || 'profissional'
  });

  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return toast.error("Preencha o e-mail.");
    if (!formData.password) return toast.error("Defina uma senha.");
    if (formData.password.length < 6) return toast.error("Senha curta (mínimo 6 caracteres).");

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_professional_user', {
        email_input: formData.email,
        password_input: formData.password,
        profile_id_input: professional.id,
        role_input: formData.role
      });

      if (error) throw error;
      setSuccess(true);
      toast.success("Acesso liberado com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao criar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700 relative">
        
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-700 p-2 rounded-full"><X size={20}/></button>

        <div className="mb-6">
          <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-gray-900 dark:text-white">
            <Lock className="text-blue-600" size={24}/> 
            {success ? "Acesso Liberado" : "Acesso Staff"}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Gestão de Equipe</p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 border-4 border-white dark:border-gray-700 shadow-xl"><CheckCircle size={32} /></div>
            <div className="space-y-1">
                <p className="font-bold text-gray-900 dark:text-white">Profissional Ativo!</p>
                <p className="text-xs text-gray-500">Credenciais:</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl text-left space-y-3 border border-dashed border-gray-200 dark:border-gray-700">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Login</p>
                    <p className="font-mono font-bold text-lg text-gray-900 dark:text-white select-all">{formData.email}</p>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha</p>
                    <p className="font-mono font-bold text-lg text-gray-900 dark:text-white select-all">{formData.password}</p>
                </div>
            </div>
            <Button onClick={onClose} className="w-full bg-gray-900 text-white rounded-xl h-12 font-bold uppercase tracking-widest">Concluir</Button>
          </div>
        ) : (
          <form onSubmit={handleCreateAccess} className="space-y-5">
            {/* INFO DO PROFISSIONAL */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-blue-500 shadow-sm font-black text-xs">
                  {professional.name.substring(0,2).toUpperCase()}
              </div>
              <div>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-0.5">Colaborador</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white leading-none line-clamp-1">{professional.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Mail size={12}/> E-mail Corporativo</label>
                 {formData.email && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md flex items-center gap-1"><Wand2 size={10}/> Automático</span>}
              </div>
              <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 font-bold rounded-xl" placeholder="email@clinica.com" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 ml-1"><Briefcase size={12}/> Nível de Acesso</label>
              <select 
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 font-bold outline-none focus:ring-2 focus:ring-blue-500"
              >
                  <option value="profissional">Profissional (Padrão)</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Key size={12}/> Senha Inicial</label>
                
                {/* MOSTRA O SINAL VERDE SÓ SE O CPF REALMENTE FOI PUXADO */}
                {cpfClean ? (
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Fingerprint size={10}/> CPF Aplicado
                    </span>
                ) : (
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        Manual (CPF não encontrado)
                    </span>
                )}
              </div>
              <Input 
                type="text" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                className="h-12 font-bold rounded-xl" 
                placeholder="Digite a senha..." // Se não tiver CPF, pede para digitar
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl mt-2">
              {loading ? <Loader2 className="animate-spin"/> : "Liberar Acesso"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}