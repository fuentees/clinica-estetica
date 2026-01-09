import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { Lock, Mail, Loader2, Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export function PatientLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data.user?.user_metadata?.role !== 'paciente') {
         await supabase.auth.signOut();
         throw new Error("Acesso restrito apenas para pacientes.");
      }

      toast.success(`Bem-vindo de volta!`);
      navigate("/portal");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao entrar. Verifique seus dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-pink-500/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 p-8 md:p-12 relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-500/30">
             <Stethoscope className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            Portal do Paciente
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
            Acesse seus exames e agendamentos
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                type="email" 
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="pl-12 h-14 rounded-xl bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-pink-500 transition-all font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                type="password" 
                placeholder="••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="pl-12 h-14 rounded-xl bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-pink-500 transition-all font-bold"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 bg-gray-900 hover:bg-pink-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={18}/></>}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Esqueceu sua senha? <span className="text-pink-600 font-bold cursor-pointer hover:underline">Fale com a recepção</span>
          </p>
        </div>
      </div>
    </div>
  );
}