import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Loader2, 
  LogIn, 
  Mail, 
  Lock, 
  ArrowRight
  // CheckCircle2 removido pois não estava em uso
} from "lucide-react";
import { toast } from "react-hot-toast";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      // CORREÇÃO 1: Passar como objeto { email, password }
      // CORREÇÃO 2: Não esperar retorno 'error', mas sim aguardar a Promise.
      await signIn({ email, password });

      // Se a linha acima não der erro, significa que logou:
      toast.success("Login realizado com sucesso!");
      
      // Redireciona para a raiz e deixa o App.tsx decidir o destino
      navigate("/", { replace: true });

    } catch (error) {
      // Se der erro no signIn, cai aqui
      console.error(error);
      toast.error("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-500">
        
        {/* Cabeçalho Visual */}
        <div className="relative h-48 bg-gradient-to-br from-pink-600 to-purple-700 flex flex-col items-center justify-center text-white p-6">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white/30">
            <LogIn size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter italic uppercase">VF Clinic</h1>
          <p className="text-pink-100 text-sm font-medium mt-1">Acesse seu painel exclusivo</p>
        </div>

        {/* Formulário */}
        <div className="p-8 pt-10">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-3">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-600 transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-pink-500 rounded-2xl outline-none transition-all font-medium text-gray-700 dark:text-gray-200"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-3">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 rounded-2xl outline-none transition-all font-medium text-gray-700 dark:text-gray-200"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Entrar no Sistema <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Esqueceu sua senha? <Link to="/forgot-password" className="text-pink-600 font-bold hover:underline">Recuperar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}