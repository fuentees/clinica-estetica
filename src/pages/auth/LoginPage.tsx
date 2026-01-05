import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      // --- AQUI ESTAVA O ERRO, AGORA ESTÁ CORRIGIDO ---
      // Passamos um objeto { email, password } em vez de argumentos separados
      await signIn({ email, password }); 
      
      toast.success("Bem-vindo de volta!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* Header com Gradiente */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10 transform -skew-y-6 scale-150"></div>
          <Sparkles className="mx-auto text-white/90 w-12 h-12 mb-2 animate-pulse" />
          <h1 className="text-3xl font-bold text-white mb-1">VF Estética</h1>
          <p className="text-pink-100 text-sm">Gestão Inteligente & Avançada</p>
        </div>

        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Acesse sua conta</h2>
            <p className="text-gray-500 text-sm">Digite seus dados para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Email</label>
              <Input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-pink-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Senha</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-pink-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-pink-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg shadow-pink-500/20 transition-all hover:scale-[1.02]"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Entrar no Sistema"}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-700 pt-6">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} VF Estética Avançada. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}