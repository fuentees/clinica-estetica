import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Lock, Key, Mail, Loader2, X, CheckCircle, Fingerprint, Wand2, Phone } from 'lucide-react';

// ✅ CORREÇÃO AQUI: Adicionamos 'phone' na tipagem
interface Props {
  patient: {
    id: string;
    name: string;
    email?: string | null;
    clinic_id: string;
    cpf?: string | null;
    phone?: string | null; // <--- O erro sumirá com essa linha
  };
  onClose: () => void;
}

export function PatientAccessModal({ patient, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // --- LÓGICA DE AUTOMAÇÃO ---
  // 1. Tenta limpar o CPF para usar de senha
  const cpfPassword = patient.cpf ? patient.cpf.replace(/\D/g, '') : '';
  // 2. Se não tiver CPF, tenta usar o Telefone (limpo)
  const phonePassword = patient.phone ? patient.phone.replace(/\D/g, '') : '';
  
  // Define a senha padrão (Prioridade: CPF > Telefone > Vazio)
  const defaultPassword = cpfPassword || phonePassword;
  const passwordSource = cpfPassword ? 'CPF' : (phonePassword ? 'Telefone' : 'Manual');

  const [formData, setFormData] = useState({
    email: patient.email || '', 
    password: defaultPassword 
  });

  const handleCreateAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!formData.email) return toast.error("O paciente não possui e-mail cadastrado.");
    if (!formData.password) return toast.error("Defina uma senha.");
    if (formData.password.length < 6) return toast.error("Senha deve ter no mínimo 6 caracteres.");

    setLoading(true);
    try {
      const { error } = await supabase.rpc('create_patient_user', {
        email_input: formData.email,
        password_input: formData.password,
        patient_id_input: patient.id,
        clinic_id_input: patient.clinicId
      });

      if (error) throw error;

      setSuccess(true);
      toast.success("Acesso criado com sucesso!");
      
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
        
        <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-700 p-2 rounded-full"
        >
            <X size={20}/>
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2 text-gray-900 dark:text-white">
            <Lock className="text-pink-600" size={24}/> 
            {success ? "Acesso Liberado" : "Gerar Acesso"}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Portal do Paciente</p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 border-4 border-white dark:border-gray-700 shadow-xl">
                <CheckCircle size={32} />
            </div>
            <div className="space-y-1">
                <p className="font-bold text-gray-900 dark:text-white">Usuário criado!</p>
                <p className="text-xs text-gray-500">Credenciais geradas automaticamente:</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl text-left space-y-3 border border-dashed border-gray-200 dark:border-gray-700">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Login</p>
                    <p className="font-mono font-bold text-lg text-gray-900 dark:text-white select-all">{formData.email}</p>
                </div>
                <div className="h-px bg-gray-200 dark:bg-gray-800"></div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha ({passwordSource})</p>
                    <p className="font-mono font-bold text-lg text-gray-900 dark:text-white select-all">{formData.password}</p>
                </div>
            </div>
            <Button onClick={onClose} className="w-full bg-gray-900 text-white rounded-xl h-12 font-bold uppercase tracking-widest">
                Concluir
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreateAccess} className="space-y-5">
            {/* CARD DE INFO DO PACIENTE */}
            <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl border border-pink-100 dark:border-pink-900/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-pink-500 shadow-sm font-black text-xs">
                  {patient.name.substring(0,2).toUpperCase()}
              </div>
              <div>
                  <p className="text-[10px] text-pink-600 font-black uppercase tracking-widest mb-0.5">Paciente</p>
                  <p className="font-bold text-sm text-gray-900 dark:text-white leading-none line-clamp-1">{patient.name}</p>
              </div>
            </div>

            {/* CAMPO DE E-MAIL */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Mail size={12}/> Login (E-mail)
                 </label>
                 {formData.email && (
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Wand2 size={10}/> Automático
                    </span>
                 )}
              </div>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="h-12 font-bold rounded-xl focus:ring-pink-500 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                placeholder="Sem e-mail cadastrado..."
              />
            </div>

            {/* CAMPO DE SENHA */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <Key size={12}/> Senha Inicial
                </label>
                
                {/* Badges indicando de onde veio a senha */}
                {passwordSource === 'CPF' && (
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Fingerprint size={10}/> CPF Aplicado
                    </span>
                )}
                {passwordSource === 'Telefone' && (
                    <span className="text-[9px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Phone size={10}/> Telefone Aplicado
                    </span>
                )}
              </div>
              
              <Input 
                type="text" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="h-12 font-bold rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 border-dashed focus:ring-pink-500"
                placeholder="Digite uma senha..."
              />
              <p className="text-[10px] text-gray-400 font-medium ml-1">* O paciente poderá alterar depois.</p>
            </div>

            <Button 
                type="submit" 
                disabled={loading || !formData.email || !formData.password} 
                className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl mt-2 transition-all hover:scale-[1.02]"
            >
              {loading ? <Loader2 className="animate-spin"/> : "Confirmar e Criar"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}